import fs from "fs";
import path from "path";
import os from "os";

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
import { Crate, CrateSharing } from "../shared/types/crate";

let firebaseApp: App;
let db: Firestore;

if (!getApps().length) {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log(
        "Initializing Firebase Admin SDK with service account credentials file.",
      );

      let serviceAccount: ServiceAccount;
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

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
      } else {
        const resolvedPath = credentialsPath.startsWith("/")
          ? credentialsPath
          : path.resolve(process.cwd(), credentialsPath);

        console.log(`Using service account file at: ${resolvedPath}`);

        if (!fs.existsSync(resolvedPath)) {
          console.error(`Service account file not found at: ${resolvedPath}`);
          throw new Error(`Service account file not found at: ${resolvedPath}`);
        }

        serviceAccount = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
      }

      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });

      console.log(
        "Firebase Admin SDK initialized successfully with service account credentials.",
      );
    } else {
      console.log(
        "GOOGLE_APPLICATION_CREDENTIALS not found, falling back to Application Default Credentials (ADC).",
      );

      firebaseApp = initializeApp({});

      console.log(
        "Firebase Admin SDK initialized with Application Default Credentials.",
      );
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

export { CRATES_COLLECTION, METRICS_COLLECTION, EVENTS_COLLECTION, db };

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

const API_KEYS_COLLECTION = "apiKeys";

export interface ApiKeyRecord {
  id: string;
  userId: string;
  hashedKey: string;
  createdAt: Date;
  lastUsedAt?: Date;
  name?: string;
}

import * as crypto from "crypto";

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export async function createApiKey(
  userId: string,
  name?: string,
): Promise<{ apiKey: string; record: ApiKeyRecord }> {
  const apiKey = crypto.randomBytes(32).toString("hex");
  const hashedKey = hashApiKey(apiKey);
  const id = crypto.randomUUID();
  const record: ApiKeyRecord = {
    id,
    userId,
    hashedKey,
    createdAt: new Date(),
    name,
  };
  await db.collection(API_KEYS_COLLECTION).doc(id).set(toFirestoreData(record));
  return { apiKey, record };
}

export async function listApiKeys(userId: string): Promise<ApiKeyRecord[]> {
  const snapshot = await db
    .collection(API_KEYS_COLLECTION)
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  return snapshot.docs.map(
    (doc: any) => fromFirestoreData(doc.data()) as ApiKeyRecord,
  );
}

export async function deleteApiKey(
  userId: string,
  keyId: string,
): Promise<boolean> {
  const docRef = db.collection(API_KEYS_COLLECTION).doc(keyId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await docRef.delete();
  return true;
}

export async function findUserByApiKey(
  apiKey: string,
): Promise<ApiKeyRecord | null> {
  const hashedKey = hashApiKey(apiKey);
  const snapshot = await db
    .collection(API_KEYS_COLLECTION)
    .where("hashedKey", "==", hashedKey)
    .limit(1)
    .get();
  if (snapshot.empty) {
    return null;
  }
  const record = fromFirestoreData(snapshot.docs[0].data()) as ApiKeyRecord;
  await snapshot.docs[0].ref.update({ lastUsedAt: new Date() });
  return record;
}

const API_KEY_USAGE_COLLECTION = "apiKeyUsage";
const API_KEY_TOOL_CALL_LIMIT = 1000;

export async function incrementApiKeyToolUsage(
  apiKeyId: string,
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`; // e.g. 202505
  const docId = `${apiKeyId}_${yearMonth}`;
  const docRef = db.collection(API_KEY_USAGE_COLLECTION).doc(docId);
  const res = await docRef.set(
    {
      apiKeyId,
      yearMonth,
      count: FieldValue.increment(1),
      updatedAt: new Date(),
    },
    { merge: true },
  );
  const doc = await docRef.get();
  const count = doc.data()?.count || 0;
  return { count, remaining: Math.max(0, API_KEY_TOOL_CALL_LIMIT - count) };
}

export async function getApiKeyToolUsage(
  apiKeyId: string,
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const docId = `${apiKeyId}_${yearMonth}`;
  const docRef = db.collection(API_KEY_USAGE_COLLECTION).doc(docId);
  const doc = await docRef.get();
  const count = doc.exists ? doc.data()?.count || 0 : 0;
  return { count, remaining: Math.max(0, API_KEY_TOOL_CALL_LIMIT - count) };
}

const USER_USAGE_COLLECTION = "userUsage";
const USER_TOOL_CALL_LIMIT = 1000;
const USER_SHARED_CRATES_LIMIT = 50;

export async function incrementUserToolUsage(
  userId: string,
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const docId = `${userId}_${yearMonth}`;
  const docRef = db.collection(USER_USAGE_COLLECTION).doc(docId);
  await docRef.set(
    {
      userId,
      yearMonth,
      count: FieldValue.increment(1),
      updatedAt: new Date(),
    },
    { merge: true },
  );
  const doc = await docRef.get();
  const count = doc.data()?.count || 0;
  return { count, remaining: Math.max(0, USER_TOOL_CALL_LIMIT - count) };
}

export async function getUserToolUsage(
  userId: string,
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0",
  )}`;
  const docId = `${userId}_${yearMonth}`;
  const docRef = db.collection(USER_USAGE_COLLECTION).doc(docId);
  const doc = await docRef.get();
  const count = doc.exists ? doc.data()?.count || 0 : 0;
  return { count, remaining: Math.max(0, USER_TOOL_CALL_LIMIT - count) };
}

export async function getUserStorageUsage(
  userId: string,
): Promise<{ used: number; limit: number; remaining: number }> {
  const STORAGE_LIMIT = 500 * 1024 * 1024; // 500MB in bytes
  try {
    // For storage calculation, we need all crates, so we'll use a direct query
    // instead of the paginated getUserCrates function
    const querySnapshot = await db
      .collection(CRATES_COLLECTION)
      .where("ownerId", "==", userId)
      .get();

    if (querySnapshot.empty) {
      return { used: 0, limit: STORAGE_LIMIT, remaining: STORAGE_LIMIT };
    }

    const used = querySnapshot.docs.reduce(
      (sum, doc) => sum + (doc.data().size || 0),
      0,
    );

    return {
      used,
      limit: STORAGE_LIMIT,
      remaining: Math.max(0, STORAGE_LIMIT - used),
    };
  } catch (error) {
    console.error(`Error calculating storage usage for user ${userId}:`, error);
    return { used: 0, limit: STORAGE_LIMIT, remaining: STORAGE_LIMIT };
  }
}

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

export async function getCrateMetadata(crateId: string): Promise<Crate | null> {
  try {
    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    return fromFirestoreData(data) as Crate;
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

export async function deleteCrateMetadata(crateId: string): Promise<boolean> {
  try {
    await db.collection(CRATES_COLLECTION).doc(crateId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting crate metadata from Firestore:", error);
    return false;
  }
}

export async function getUserCrates(
  userId: string,
  limit = 20,
  startAfter?: string,
): Promise<{ crates: Crate[]; lastCrateId: string | null; hasMore: boolean }> {
  try {
    // Start with the base query
    let query = db
      .collection(CRATES_COLLECTION)
      .where("ownerId", "==", userId)
      .orderBy("createdAt", "desc")
      .limit(limit + 1); // Fetch one extra to check if there are more

    // If we have a startAfter cursor, add it to the query
    if (startAfter) {
      try {
        const startAfterDoc = await db
          .collection(CRATES_COLLECTION)
          .doc(startAfter)
          .get();
        if (startAfterDoc.exists) {
          query = query.startAfter(startAfterDoc);
        }
      } catch (cursorError) {
        console.error(`Error setting cursor for user ${userId}:`, cursorError);
        // Continue without cursor if there was an error
      }
    }

    const querySnapshot = await query.get();

    if (querySnapshot.empty) {
      return { crates: [], lastCrateId: null, hasMore: false };
    }

    // Check if we have more results
    const hasMore = querySnapshot.docs.length > limit;
    // Remove the extra document if we fetched more than the limit
    const docsToProcess = hasMore
      ? querySnapshot.docs.slice(0, limit)
      : querySnapshot.docs;

    const crates = docsToProcess.map(
      (doc: QueryDocumentSnapshot) => fromFirestoreData(doc.data()) as Crate,
    );

    // Get the ID of the last document for pagination
    const lastCrateId =
      docsToProcess.length > 0
        ? docsToProcess[docsToProcess.length - 1].id
        : null;

    return { crates, lastCrateId, hasMore };
  } catch (error) {
    console.error(
      `Error getting crates for user ${userId} from Firestore:`,
      error,
    );
    return { crates: [], lastCrateId: null, hasMore: false };
  }
}

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

export async function getUserSharedCratesCount(
  userId: string,
): Promise<{ count: number; limit: number; remaining: number }> {
  try {
    const querySnapshot = await db
      .collection(CRATES_COLLECTION)
      .where("ownerId", "==", userId)
      .where("shared.public", "==", true)
      .get();

    const count = querySnapshot.size;
    return {
      count,
      limit: USER_SHARED_CRATES_LIMIT,
      remaining: Math.max(0, USER_SHARED_CRATES_LIMIT - count),
    };
  } catch (error) {
    console.error(
      `Error getting shared crates count for user ${userId}:`,
      error,
    );
    return {
      count: 0,
      limit: USER_SHARED_CRATES_LIMIT,
      remaining: USER_SHARED_CRATES_LIMIT,
    };
  }
}

export async function hasReachedSharedCratesLimit(
  userId: string,
): Promise<boolean> {
  const { remaining } = await getUserSharedCratesCount(userId);
  return remaining <= 0;
}

export async function updateCrateSharing(
  crateId: string,
  userId: string,
  sharingSettings: Partial<CrateSharing>,
): Promise<{ success: boolean; error?: string }> {
  try {
    const crate = await getCrateMetadata(crateId);
    if (!crate) {
      return { success: false, error: "Crate not found" };
    }

    if (crate.ownerId !== userId) {
      return {
        success: false,
        error: "You don't have permission to update this crate",
      };
    }

    if (sharingSettings.public && !crate.shared.public) {
      const reachedLimit = await hasReachedSharedCratesLimit(userId);
      if (reachedLimit) {
        return {
          success: false,
          error:
            "Shared crates limit reached. You can share a maximum of 50 crates. Please delete some shared crates before sharing new ones.",
        };
      }
    }

    const updatedSharing = {
      ...crate.shared,
      ...sharingSettings,
    };

    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    await docRef.update({
      shared: updatedSharing,
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating crate sharing settings:", error);
    return { success: false, error: "Failed to update crate sharing settings" };
  }
}
