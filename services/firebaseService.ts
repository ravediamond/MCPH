import fs from "fs";
import path from "path";
import os from "os";

// Utility to handle service account credentials for Vercel
function setupServiceAccountForVercel() {
  if (process.env.VERCEL_ENV) {
    const jsonContent = process.env.GOOGLE_APPLICATION_CREDENTIALS;
    if (jsonContent && jsonContent.trim().startsWith("{")) {
      try {
        // Validate the JSON is parseable
        JSON.parse(jsonContent);
        // In Vercel, we'll use the JSON content directly in other modules
        // No need to write to temp file
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
import { getFirestore, Firestore, FieldValue } from "firebase-admin/firestore";
import { v4 as uuidv4 } from "uuid";
import { Crate } from "../app/types/crate";

// --- Firebase Admin SDK Initialization ---
let firebaseApp: App;
let db: Firestore;

if (!getApps().length) {
  try {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log(
        "Initializing Firebase Admin SDK with service account credentials file."
      );

      let serviceAccount: ServiceAccount;
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

      // Check if it's a JSON string or a file path
      if (
        process.env.VERCEL_ENV &&
        process.env.GOOGLE_APPLICATION_CREDENTIALS.trim().startsWith("{")
      ) {
        // Parse JSON string for Vercel environment
        try {
          serviceAccount = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS);
          console.log("Using parsed JSON credentials from environment variable");
        } catch (error) {
          console.error("Error parsing credentials JSON:", error);
          throw new Error("Failed to parse service account credentials JSON.");
        }
      } else {
        // Use file path for local environment
        // Handle both absolute and relative paths
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

      // Initialize with explicit credentials
      firebaseApp = initializeApp({
        credential: cert(serviceAccount),
      });

      console.log(
        "Firebase Admin SDK initialized successfully with service account credentials."
      );
    } else {
      console.log(
        "GOOGLE_APPLICATION_CREDENTIALS not found, falling back to Application Default Credentials (ADC)."
      );

      firebaseApp = initializeApp({
        // No 'credential' property is provided, so ADC will be used.
      });

      console.log(
        "Firebase Admin SDK initialized with Application Default Credentials."
      );
    }

    // Initialize Firestore for the first time
    db = getFirestore(firebaseApp);
    console.log("Firestore instance obtained.");

    // Apply settings immediately and only once during initial setup
    try {
      db.settings({ ignoreUndefinedProperties: true });
      console.log("Firestore settings applied successfully.");
    } catch (settingsError: any) {
      console.warn(
        `Firestore settings could not be applied. Error: ${settingsError.message}`
      );
    }
  } catch (error: any) {
    console.error("Error initializing Firebase Admin SDK:", error.message);
    throw new Error(`Failed to initialize Firebase Admin SDK: ${error.message}`);
  }
} else {
  firebaseApp = getApp(); // Use the already initialized app
  db = getFirestore(firebaseApp); // Get the existing Firestore instance
  console.log(
    "Firebase Admin SDK and Firestore instance already initialized. Using existing."
  );
  // Settings are assumed to have been applied during the initial setup in the block above.
}

// --- End Firebase Admin SDK Initialization ---

// Collection names for Firestore
const CRATES_COLLECTION = "crates"; // Collection for crates
const METRICS_COLLECTION = "metrics";
const EVENTS_COLLECTION = "events";

// Export collection names for use in other modules
export { CRATES_COLLECTION, METRICS_COLLECTION, EVENTS_COLLECTION };

/**
 * Convert Firebase timestamp to Date and vice versa
 */
const toFirestoreData = (data: any): any => {
  // Deep copy the object and handle Date conversion
  const result = { ...data };

  // Convert Date objects to Firestore timestamps
  Object.keys(result).forEach((key) => {
    if (result[key] instanceof Date) {
      // We'll keep it as a Date; Firestore will convert it automatically
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = toFirestoreData(result[key]);
    }
  });

  return result;
};

const fromFirestoreData = (data: any): any => {
  if (!data) return null;

  // Convert Firestore timestamps to Date objects
  const result = { ...data };

  // Convert Firestore timestamps back to Date objects
  Object.keys(result).forEach((key) => {
    if (result[key] && typeof result[key].toDate === "function") {
      result[key] = result[key].toDate();
    } else if (typeof result[key] === "object" && result[key] !== null) {
      result[key] = fromFirestoreData(result[key]);
    }
  });

  return result;
};

/**
 * Increment a general metric counter
 */
export async function incrementMetric(
  metric: string,
  amount: number = 1
): Promise<number> {
  try {
    const metricRef = db.collection(METRICS_COLLECTION).doc("counters");

    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split("T")[0];
    const dailyMetricRef = db
      .collection(METRICS_COLLECTION)
      .doc(`daily_${today}`);

    // Use FieldValue.increment for atomic increment
    const updateData: Record<string, any> = {};
    updateData[metric] = FieldValue.increment(amount);

    // Update the total counters
    await metricRef.set(updateData, { merge: true });

    // Also update the timestamp
    await metricRef.update({
      lastUpdated: new Date(),
    });

    // Update daily counters
    await dailyMetricRef.set(updateData, { merge: true });

    // Get updated value
    const updatedDoc = await metricRef.get();
    return updatedDoc.data()?.[metric] || 0;
  } catch (error) {
    console.error(`Error incrementing metric '${metric}' in Firestore:`, error);
    return 0;
  }
}

/**
 * Get a general metric value
 */
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

/**
 * Get daily metrics for a specific metric type over a number of days
 */
export async function getDailyMetrics(
  metric: string,
  days: number = 30
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
          .then((doc) => {
            result[dateStr] = doc.exists ? doc.data()?.[metric] || 0 : 0;
          })
      );
    }

    await Promise.all(promises);
    return result;
  } catch (error) {
    console.error(
      `Error getting daily metrics for '${metric}' from Firestore:`,
      error
    );
    return {};
  }
}

/**
 * Log an event to Firestore
 */
export async function logEvent(
  eventType: string,
  resourceId: string,
  ipAddress?: string,
  details: Record<string, any> = {}
): Promise<void> {
  try {
    const timestamp = new Date();
    const eventId = uuidv4();

    const eventData = {
      id: eventId,
      type: eventType,
      resourceId,
      timestamp,
      ipAddress,
      details,
    };

    // Add to the events collection with auto-generated ID
    await db.collection(EVENTS_COLLECTION).doc(eventId).set(eventData);

    // Create a query for cleanup (to run in a scheduled function)
    // This just increments the event counter; actual cleanup is done separately
    await incrementMetric(`events:${eventType}`);
  } catch (error) {
    console.error("Error logging event to Firestore:", error);
  }
}

/**
 * Get recent events of a specific type from Firestore
 */
export async function getEvents(
  eventType: string,
  limit: number = 100
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

    // Convert to array of data
    return querySnapshot.docs.map((doc) => {
      const data = doc.data();
      // Convert any Firestore timestamps to Date objects
      return fromFirestoreData(data);
    });
  } catch (error) {
    console.error("Error getting events from Firestore:", error);
    return [];
  }
}

// --- API Keys Collection ---
const API_KEYS_COLLECTION = "apiKeys";

export interface ApiKeyRecord {
  id: string; // Firestore doc ID
  userId: string;
  hashedKey: string; // Store only hashed version
  createdAt: Date;
  lastUsedAt?: Date;
  name?: string; // Optional: user-friendly name
}

import * as crypto from "crypto";

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export async function createApiKey(
  userId: string,
  name?: string
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
    (doc) => fromFirestoreData(doc.data()) as ApiKeyRecord
  );
}

export async function deleteApiKey(
  userId: string,
  keyId: string
): Promise<boolean> {
  const docRef = db.collection(API_KEYS_COLLECTION).doc(keyId);
  const doc = await docRef.get();
  if (!doc.exists || doc.data()?.userId !== userId) return false;
  await docRef.delete();
  return true;
}

export async function findUserByApiKey(
  apiKey: string
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
  // Optionally update lastUsedAt
  await snapshot.docs[0].ref.update({ lastUsedAt: new Date() });
  return record;
}

const API_KEY_USAGE_COLLECTION = "apiKeyUsage";
const API_KEY_TOOL_CALL_LIMIT = 1000;

/**
 * Increment the monthly tool usage for an API key. Returns the new count and remaining quota.
 */
export async function incrementApiKeyToolUsage(
  apiKeyId: string
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
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
    { merge: true }
  );
  // Read the updated count
  const doc = await docRef.get();
  const count = doc.data()?.count || 0;
  return { count, remaining: Math.max(0, API_KEY_TOOL_CALL_LIMIT - count) };
}

/**
 * Get the current monthly tool usage for an API key.
 */
export async function getApiKeyToolUsage(
  apiKeyId: string
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  const docId = `${apiKeyId}_${yearMonth}`;
  const docRef = db.collection(API_KEY_USAGE_COLLECTION).doc(docId);
  const doc = await docRef.get();
  const count = doc.exists ? doc.data()?.count || 0 : 0;
  return { count, remaining: Math.max(0, API_KEY_TOOL_CALL_LIMIT - count) };
}

const USER_USAGE_COLLECTION = "userUsage";
const USER_TOOL_CALL_LIMIT = 1000;

/**
 * Increment the monthly tool usage for a user. Returns the new count and remaining quota.
 */
export async function incrementUserToolUsage(
  userId: string
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
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
    { merge: true }
  );
  const doc = await docRef.get();
  const count = doc.data()?.count || 0;
  return { count, remaining: Math.max(0, USER_TOOL_CALL_LIMIT - count) };
}

/**
 * Get the current monthly tool usage for a user.
 */
export async function getUserToolUsage(
  userId: string
): Promise<{ count: number; remaining: number }> {
  const now = new Date();
  const yearMonth = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}`;
  const docId = `${userId}_${yearMonth}`;
  const docRef = db.collection(USER_USAGE_COLLECTION).doc(docId);
  const doc = await docRef.get();
  const count = doc.exists ? doc.data()?.count || 0 : 0;
  return { count, remaining: Math.max(0, USER_TOOL_CALL_LIMIT - count) };
}

/**
 * Get total storage used by a user (sum of all crate sizes in bytes)
 */
export async function getUserStorageUsage(
  userId: string
): Promise<{ used: number; limit: number; remaining: number }> {
  const STORAGE_LIMIT = 500 * 1024 * 1024; // 500MB in bytes
  try {
    const crates = await getUserCrates(userId);
    const used = crates.reduce((sum, crate) => sum + (crate.size || 0), 0);
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

/**
 * Save crate metadata to Firestore.
 */
export async function saveCrateMetadata(crateData: Crate): Promise<boolean> {
  try {
    // Convert the data for Firestore
    const dataToSave = toFirestoreData({
      ...crateData,
    });

    // Add to Firestore
    await db.collection(CRATES_COLLECTION).doc(crateData.id).set(dataToSave);

    return true;
  } catch (error) {
    console.error("Error saving crate metadata to Firestore:", error);
    return false;
  }
}

/**
 * Get crate metadata from Firestore
 */
export async function getCrateMetadata(crateId: string): Promise<Crate | null> {
  try {
    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    const doc = await docRef.get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();

    // Convert Firestore timestamps back to Date objects
    return fromFirestoreData(data) as Crate;
  } catch (error) {
    console.error("Error getting crate metadata from Firestore:", error);
    return null;
  }
}

/**
 * Increment download count for a crate in Firestore
 */
export async function incrementCrateDownloadCount(
  crateId: string
): Promise<number> {
  try {
    const docRef = db.collection(CRATES_COLLECTION).doc(crateId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(
        `Crate metadata not found for ID: ${crateId} when incrementing download count.`
      );
      return 0;
    }

    // Use FieldValue.increment() for atomic increment operation
    await docRef.update({
      downloadCount: FieldValue.increment(1),
    });

    // Also update general metrics
    await incrementMetric("downloads");

    // Get the updated document to return the new count
    const updatedDoc = await docRef.get();
    const downloadCount = updatedDoc.data()?.downloadCount || 0;

    return downloadCount;
  } catch (error) {
    console.error(
      "Error incrementing crate download count in Firestore:",
      error
    );

    // Attempt to get current count if update failed
    try {
      const doc = await db.collection(CRATES_COLLECTION).doc(crateId).get();
      return doc.data()?.downloadCount || 0;
    } catch (e) {
      return 0;
    }
  }
}

/**
 * Delete crate metadata from Firestore
 */
export async function deleteCrateMetadata(crateId: string): Promise<boolean> {
  try {
    await db.collection(CRATES_COLLECTION).doc(crateId).delete();
    return true;
  } catch (error) {
    console.error("Error deleting crate metadata from Firestore:", error);
    return false;
  }
}

/**
 * Get crates for a specific user from Firestore
 */
export async function getUserCrates(userId: string): Promise<Crate[]> {
  try {
    const querySnapshot = await db
      .collection(CRATES_COLLECTION)
      .where("ownerId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    if (querySnapshot.empty) {
      return [];
    }

    // Convert to array of data, converting Firestore timestamps to Date objects
    return querySnapshot.docs.map(
      (doc) => fromFirestoreData(doc.data()) as Crate
    );
  } catch (error) {
    console.error(
      `Error getting crates for user ${userId} from Firestore:`,
      error
    );
    return []; // Return empty array on error
  }
}

/**
 * Increment download count for a file in Firestore
 */
export async function incrementDownloadCount(fileId: string): Promise<number> {
  try {
    const docRef = db.collection("files").doc(fileId);
    const doc = await docRef.get();

    if (!doc.exists) {
      console.warn(
        `File metadata not found for ID: ${fileId} when incrementing download count.`
      );
      return 0;
    }

    // Use FieldValue.increment() for atomic increment operation
    await docRef.update({
      downloadCount: FieldValue.increment(1),
    });

    // Also update general metrics
    await incrementMetric("downloads");

    // Get the updated document to return the new count
    const updatedDoc = await docRef.get();
    const downloadCount = updatedDoc.data()?.downloadCount || 0;

    return downloadCount;
  } catch (error) {
    console.error(
      "Error incrementing file download count in Firestore:",
      error
    );

    // Attempt to get current count if update failed
    try {
      const doc = await db.collection("files").doc(fileId).get();
      return doc.data()?.downloadCount || 0;
    } catch (e) {
      return 0;
    }
  }
}
