import fs from "fs";
import path from "path";

function setupServiceAccountForVercel() {
  if (process.env.VERCEL_ENV) {
    const jsonContent = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (jsonContent && jsonContent.trim().startsWith("{")) {
      try {
        JSON.parse(jsonContent);
      } catch (error) {
        console.error("[FirebaseService] Invalid JSON in credentials:", error);
      }
    }
  }
}

setupServiceAccountForVercel();

import {
  initializeApp,
  cert,
  App,
  ServiceAccount,
  getApps,
  getApp,
} from "firebase-admin/app";
import {
  getFirestore,
  Firestore,
  FieldValue,
  QueryDocumentSnapshot,
} from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { Crate, CrateSharing, AccessHistoryEntry } from "../shared/types/crate";

let firebaseApp: App | undefined;
let db: Firestore;

if (!getApps().length) {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log(
        "Initializing Firebase Admin SDK with service account credentials.",
      );

      let serviceAccount: ServiceAccount | undefined;
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      // Check if it's a JSON string (Vercel environment)
      if (
        process.env.VERCEL_ENV &&
        process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith("{")
      ) {
        try {
          serviceAccount = JSON.parse(
            process.env.GOOGLE_APPLICATION_CREDENTIALS,
          );
          console.log(
            "Using parsed JSON credentials from environment variable",
          );
        } catch (error) {
          console.error(
            "Error processing Firebase service account credentials:",
            error,
          );
          throw new Error("Failed to parse service account credentials JSON.");
        }
      } else if (credentialsPath.trim().startsWith("{")) {
        // Handle JSON string in other environments (like Cloud Run)
        try {
          serviceAccount = JSON.parse(credentialsPath);
          console.log(
            "Using parsed JSON credentials from environment variable",
          );
        } catch (error) {
          console.error(
            "Error processing Firebase service account credentials JSON:",
            error,
          );
          throw new Error("Failed to parse service account credentials JSON.");
        }
      } else {
        // Handle file path
        const resolvedPath = credentialsPath.startsWith("/")
          ? credentialsPath
          : path.resolve(process.cwd(), credentialsPath);

        console.log(`Using service account file at: ${resolvedPath}`);

        if (!fs.existsSync(resolvedPath)) {
          console.error(`Service account file not found at: ${resolvedPath}`);
          console.log("Falling back to Application Default Credentials (ADC).");

          firebaseApp = initializeApp({});

          console.log(
            "Firebase Admin SDK initialized with Application Default Credentials.",
          );
        } else {
          serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
        }
      }

      // Only initialize with service account if we successfully parsed it
      if (serviceAccount) {
        firebaseApp = initializeApp({
          credential: cert(serviceAccount),
        });

        console.log(
          "Firebase Admin SDK initialized successfully with service account credentials.",
        );
      }
    } else {
      console.log(
        "GOOGLE_APPLICATION_CREDENTIALS not found, falling back to Application Default Credentials (ADC).",
      );

      firebaseApp = initializeApp({});

      console.log(
        "Firebase Admin SDK initialized with Application Default Credentials.",
      );
    }

    // Ensure firebaseApp is initialized, fallback to ADC if not
    if (!firebaseApp) {
      console.log(
        "No Firebase app initialized, falling back to Application Default Credentials (ADC).",
      );
      firebaseApp = initializeApp({});
    }

    db = getFirestore(firebaseApp);
    console.log("Firestore instance obtained.");

    db.settings({
      ignoreUndefinedProperties: true,
    });
    console.log("Firestore settings applied: ignoreUndefinedProperties=true");
  } catch (error: any) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
    throw new Error(
      `Failed to initialize Firebase Admin SDK: ${error.message}`,
    );
  }
} else {
  firebaseApp = getApp();
  db = getFirestore(firebaseApp);

  try {
    db.settings({
      ignoreUndefinedProperties: true,
    });
    console.log(
      "Firestore settings applied to existing instance: ignoreUndefinedProperties=true",
    );
  } catch (settingsError) {
    console.warn(
      "Could not apply settings to existing Firestore instance:",
      settingsError,
    );
  }

  console.log(
    "Firebase Admin SDK and Firestore instance already initialized. Using existing.",
  );
}

const CRATES_COLLECTION = "crates";
const METRICS_COLLECTION = "metrics";
const EVENTS_COLLECTION = "events";
const CRATE_ACCESS_COLLECTION = "crateAccess";

export {
  CRATES_COLLECTION,
  METRICS_COLLECTION,
  EVENTS_COLLECTION,
  CRATE_ACCESS_COLLECTION,
  db,
};

const toFirestoreData = (data: any): any => {
  const result = { ...data };

  Object.keys(result).forEach((key) => {
    if (result[key] === undefined) {
      delete result[key];
    } else if (result[key] instanceof Date) {
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = toFirestoreData(result[key]);
    }
  });

  return result;
};

const fromFirestoreData = (data: any): any => {
  if (!data) return null;

  const result = { ...data };

  Object.keys(result).forEach((key) => {
    if (result[key] && typeof result[key].toDate === "function") {
      result[key] = result[key].toDate();
    } else if (key === "tags" && result[key] !== undefined) {
      // Special handling for tags to ensure they're always arrays
      if (!Array.isArray(result[key])) {
        console.log(
          `[DEBUG] fromFirestoreData: Converting non-array tags:`,
          result[key],
        );
        result[key] = result[key]
          ? typeof result[key] === "string"
            ? [result[key]]
            : []
          : [];
      }
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = fromFirestoreData(result[key]);
    }
  });

  return result;
};

export async function incrementMetric(
  metric: string,
  amount: number = 1,
): Promise<number> {
  try {
    const metricRef = db.collection(METRICS_COLLECTION).doc("counters");

    const today = new Date().toISOString().split("T")[0];
    const dailyMetricRef = db
      .collection(METRICS_COLLECTION)
      .doc(`daily_${today}`);

    const updateData: Record<string, any> = {};
    updateData[metric] = FieldValue.increment(amount);

    await metricRef.set(updateData, { merge: true });

    await metricRef.update({
      lastUpdated: new Date(),
    });

    await dailyMetricRef.set(updateData, { merge: true });

    const updatedDoc = await metricRef.get();
    return updatedDoc.data()?.[metric] || 0;
  } catch (error) {
    console.error(`Error incrementing metric '${metric}' in Firestore:`, error);
    return 0;
  }
}

export async function getMetric(metric: string): Promise<number> {
  try {
    const metricRef = db.collection(METRICS_COLLECTION).doc("counters");
    const doc = await metricRef.get();

    if (!doc.exists) {
      return 0;
    }

    return doc.data()?.[metric] || 0;
  } catch (error) {
    console.error(`Error getting metric '${metric}' from Firestore:`, error);
    return 0;
  }
}

export async function getDailyMetrics(
  metric: string,
  days: number = 30,
): Promise<Record<string, number>> {
  const result: Record<string, number> = {};
  const today = new Date();

  try {
    const promises = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

      promises.push(
        db
          .collection(METRICS_COLLECTION)
          .doc(`daily_${dateStr}`)
          .get()
          .then((doc: any) => {
            result[dateStr] = doc.exists ? doc.data()?.[metric] || 0 : 0;
          }),
      );
    }

    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error(
      `Error getting daily metrics for '${metric}' from Firestore:`,
      error,
    );
    return {};
  }
}

export async function logEvent(
  eventType: string,
  resourceId: string,
  ipAddress?: string,
  details: Record<string, any> = {},
): Promise<void> {
  try {
    const timestamp = new Date();
    const eventId = uuidv4();

    const eventData = {
      id: eventId,
      type: eventType,
      resourceId,
      timestamp,
      ipAddress: ipAddress || null,
      details: details || null,
    };

    await db.collection(EVENTS_COLLECTION).doc(eventId).set(eventData);

    await incrementMetric(`events:${eventType}`);
  } catch (error) {
    console.error("Error logging event to Firestore:", error);
  }
}

export async function getEvents(
  eventType: string,
  limit: number = 100,
): Promise<any[]> {
  try {
    const querySnapshot = await db
      .collection(EVENTS_COLLECTION)
      .where("type", "==", eventType)
      .orderBy("timestamp", "desc")
      .limit(limit)
      .get();

    if (querySnapshot.empty) {
      return [];
    }

    return querySnapshot.docs.map((doc: any) => {
      const data = doc.data();
      return fromFirestoreData(data);
    });
  } catch (error) {
    console.error("Error getting events from Firestore:", error);
    return [];
  }
}

const USER_SHARED_CRATES_LIMIT = 10;

// Note: getUserStorageUsage removed as it was ownerId-based
// In the editKey system, storage limits would be managed differently

export async function saveCrateMetadata(crateData: Crate): Promise<boolean> {
  try {
    const dataToSave = toFirestoreData({
      ...crateData,
    });

    await db.collection(CRATES_COLLECTION).doc(crateData.id).set(dataToSave);

    return true;
  } catch (error) {
    console.error("Error saving crate metadata to Firestore:", error);
    return false;
  }
}

export async function updateCrateMetadata(
  crateId: string,
  updateData: Partial<Crate>,
): Promise<Crate> {
  try {
    // Get the current crate data first
    const currentCrate = await getCrateMetadata(crateId);
    if (!currentCrate) {
      throw new Error(`Crate with ID ${crateId} not found`);
    }

    // Create the merged data
    const updatedCrate = {
      ...currentCrate,
      ...updateData,
    };

    // Convert to Firestore format
    const dataToSave = toFirestoreData(updatedCrate);

    // Update the document
    await db.collection(CRATES_COLLECTION).doc(crateId).update(dataToSave);

    // Return the updated crate
    return updatedCrate;
  } catch (error) {
    console.error("Error updating crate metadata in Firestore:", error);
    throw error;
  }
}

export async function getCrateMetadata(crateId: string): Promise<Crate | null> {
  try {
    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Ensure tags is always an array
    if (data && !Array.isArray(data.tags)) {
      console.log(
        `[DEBUG] Firebase getCrateMetadata: Tags for crate ${crateId} is not an array, converting:`,
        data.tags,
      );
      if (data.tags) {
        // If it exists but isn't an array, try to convert it
        try {
          data.tags = Array.isArray(data.tags)
            ? data.tags
            : typeof data.tags === "string"
              ? [data.tags]
              : [];
        } catch (e) {
          console.warn(
            `[DEBUG] Firebase getCrateMetadata: Failed to convert tags for crate ${crateId}:`,
            e,
          );
          data.tags = [];
        }
      } else {
        data.tags = [];
      }
    }

    const processedData = fromFirestoreData(data) as Crate;
    console.log(
      `[DEBUG] Firebase getCrateMetadata: Processed crate data with tags:`,
      processedData.tags,
    );

    // Add access history to the response
    try {
      const accessHistory = await getCrateAccessHistory(crateId, 30);
      processedData.accessHistory = accessHistory;
    } catch (accessError) {
      console.warn(
        `Failed to get access history for crate ${crateId}:`,
        accessError,
      );
      processedData.accessHistory = [];
    }

    return processedData;
  } catch (error) {
    console.error("Error getting crate metadata from Firestore:", error);
    return null;
  }
}

export async function incrementCrateDownloadCount(
  crateId: string,
): Promise<number> {
  try {
    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(
        `Crate metadata not found for ID: ${crateId} when incrementing download count.`,
      );
      return 0;
    }

    await docRef.update({
      downloadCount: FieldValue.increment(1),
    });

    await incrementMetric("downloads");

    // Track daily access
    await trackDailyAccess(crateId, "download");

    const updatedDoc = await docRef.get();
    const downloadCount = updatedDoc.data()?.downloadCount || 0;

    return downloadCount;
  } catch (error) {
    console.error(
      "Error incrementing crate download count in Firestore:",
      error,
    );

    try {
      const doc = await db.collection(CRATES_COLLECTION).doc(crateId).get();
      return doc.data()?.downloadCount || 0;
    } catch (e) {
      return 0;
    }
  }
}

export async function incrementCrateViewCount(
  crateId: string,
): Promise<number> {
  try {
    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(
        `Crate metadata not found for ID: ${crateId} when incrementing view count.`,
      );
      return 0;
    }

    await docRef.update({
      viewCount: FieldValue.increment(1),
    });

    await incrementMetric("views");

    // Track daily access
    await trackDailyAccess(crateId, "view");

    const updatedDoc = await docRef.get();
    const viewCount = updatedDoc.data()?.viewCount || 0;

    return viewCount;
  } catch (error) {
    console.error("Error incrementing crate view count in Firestore:", error);

    try {
      const doc = await db.collection(CRATES_COLLECTION).doc(crateId).get();
      return doc.data()?.viewCount || 0;
    } catch (e) {
      return 0;
    }
  }
}

export async function duplicateCrate(
  originalCrateId: string,
  newEditKey: string,
): Promise<{ success: boolean; crateId?: string; error?: string }> {
  try {
    const originalCrate = await getCrateMetadata(originalCrateId);
    if (!originalCrate) {
      return { success: false, error: "Original crate not found" };
    }

    if (!originalCrate.shared.public) {
      return { success: false, error: "Original crate is not public" };
    }

    const newCrateId = uuidv4();
    const now = new Date();

    const duplicatedCrate: Crate = {
      ...originalCrate,
      id: newCrateId,
      editKey: newEditKey,
      createdAt: now,
      downloadCount: 0,
      viewCount: 0,
      shared: {
        public: false,
      },
      title: `Copy of ${originalCrate.title}`,
      gcsPath: `crates/${newCrateId}`,
      metadata: {
        ...originalCrate.metadata,
        derivedFrom: originalCrateId,
        derivedFromTitle: originalCrate.title,
        derivedAt: now.toISOString(),
      },
    };

    // Save metadata first
    await saveCrateMetadata(duplicatedCrate);

    // Copy the file content
    const { copyFile } = await import("./storageService");
    const fileCopySuccess = await copyFile(originalCrateId, newCrateId);

    if (!fileCopySuccess) {
      // If file copy fails, clean up the metadata
      await deleteCrateMetadata(newCrateId);
      return { success: false, error: "Failed to copy file content" };
    }

    await incrementMetric("duplications");

    return { success: true, crateId: newCrateId };
  } catch (error) {
    console.error("Error duplicating crate:", error);
    return { success: false, error: "Failed to duplicate crate" };
  }
}

export async function deleteCrateMetadata(crateId: string): Promise<boolean> {
  try {
    await db.collection(CRATES_COLLECTION).doc(crateId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting crate metadata from Firestore:", error);
    return false;
  }
}

// Note: getUserCrates removed as it was ownerId-based
// In the editKey system, users would track their crates differently

export async function incrementDownloadCount(fileId: string): Promise<number> {
  try {
    const docRef = db.collection("files").doc(fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(
        `File metadata not found for ID: ${fileId} when incrementing download count.`,
      );
      return 0;
    }

    await docRef.update({
      downloadCount: FieldValue.increment(1),
    });

    await incrementMetric("downloads");

    const updatedDoc = await docRef.get();
    const downloadCount = updatedDoc.data()?.downloadCount || 0;

    return downloadCount;
  } catch (error) {
    console.error(
      "Error incrementing file download count in Firestore:",
      error,
    );

    try {
      const doc = await db.collection("files").doc(fileId).get();
      return doc.data()?.downloadCount || 0;
    } catch (e) {
      return 0;
    }
  }
}

// Note: getUserSharedCratesCount removed as it was ownerId-based
// In the editKey system, shared crates limits would be managed differently

// Note: hasReachedSharedCratesLimit removed as it was ownerId-based

export async function updateCrateSharing(
  crateId: string,
  editKey: string,
  sharingSettings: Partial<CrateSharing>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const crate = await getCrateMetadata(crateId);
    if (!crate) {
      return { success: false, error: "Crate not found" };
    }

    if (crate.editKey !== editKey) {
      return {
        success: false,
        error: "You don't have permission to update this crate",
      };
    }

    const updatedSharing = {
      ...crate.shared,
      ...sharingSettings,
    } as any;

    // Handle password deletion properly
    if (
      sharingSettings.hasOwnProperty("passwordHash") &&
      !sharingSettings.passwordHash
    ) {
      delete updatedSharing.passwordHash;
    }

    const updateData: any = { shared: updatedSharing };

    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    await docRef.update(updateData);

    return { success: true };
  } catch (error) {
    console.error("Error updating crate sharing settings:", error);
    return { success: false, error: "Failed to update crate sharing settings" };
  }
}

// Access Tracking Functions

/**
 * Track daily access (view or download) for a crate
 */
export async function trackDailyAccess(
  crateId: string,
  accessType: "view" | "download",
): Promise<void> {
  try {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD format
    const docId = `${crateId}_${today}`;
    const docRef = db.collection(CRATE_ACCESS_COLLECTION).doc(docId);

    const updateData: Record<string, any> = {
      crateId,
      date: today,
      updatedAt: new Date(),
    };

    if (accessType === "view") {
      updateData.views = FieldValue.increment(1);
    } else {
      updateData.downloads = FieldValue.increment(1);
    }

    await docRef.set(updateData, { merge: true });
  } catch (error) {
    console.error(
      `Error tracking daily ${accessType} for crate ${crateId}:`,
      error,
    );
  }
}

/**
 * Get access history for a crate over the last N days
 */
export async function getCrateAccessHistory(
  crateId: string,
  days: number = 30,
): Promise<AccessHistoryEntry[]> {
  try {
    const result: AccessHistoryEntry[] = [];
    const today = new Date();

    // Generate date range
    const dates = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split("T")[0]);
    }

    // Fetch access data for all dates
    const promises = dates.map(async (date) => {
      const docId = `${crateId}_${date}`;
      const doc = await db.collection(CRATE_ACCESS_COLLECTION).doc(docId).get();

      if (doc.exists) {
        const data = doc.data();
        return {
          date,
          views: data?.views || 0,
          downloads: data?.downloads || 0,
        };
      } else {
        return {
          date,
          views: 0,
          downloads: 0,
        };
      }
    });

    const accessData = await Promise.all(promises);
    result.push(...accessData);

    return result;
  } catch (error) {
    console.error(`Error getting access history for crate ${crateId}:`, error);
    return [];
  }
}

/**
 * Get aggregated access statistics for a crate
 */
export async function getCrateAccessStats(crateId: string): Promise<{
  today: { views: number; downloads: number };
  week: { views: number; downloads: number };
  month: { views: number; downloads: number };
}> {
  try {
    const history = await getCrateAccessHistory(crateId, 30);

    const today = new Date().toISOString().split("T")[0];
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date();
    monthAgo.setDate(monthAgo.getDate() - 30);

    const todayStats = history.find((entry) => entry.date === today) || {
      views: 0,
      downloads: 0,
    };

    const weekStats = history
      .filter((entry) => new Date(entry.date) >= weekAgo)
      .reduce(
        (acc, entry) => ({
          views: acc.views + entry.views,
          downloads: acc.downloads + entry.downloads,
        }),
        { views: 0, downloads: 0 },
      );

    const monthStats = history.reduce(
      (acc, entry) => ({
        views: acc.views + entry.views,
        downloads: acc.downloads + entry.downloads,
      }),
      { views: 0, downloads: 0 },
    );

    return {
      today: todayStats,
      week: weekStats,
      month: monthStats,
    };
  } catch (error) {
    console.error(`Error getting access stats for crate ${crateId}:`, error);
    return {
      today: { views: 0, downloads: 0 },
      week: { views: 0, downloads: 0 },
      month: { views: 0, downloads: 0 },
    };
  }
}
