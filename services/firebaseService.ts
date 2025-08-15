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

const METRICS_COLLECTION = "metrics";
const EVENTS_COLLECTION = "events";
export { METRICS_COLLECTION, EVENTS_COLLECTION, db };

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
  await docRef.set(
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

// MCP Client Registration
const MCP_CLIENTS_COLLECTION = "mcpClients";

export interface McpClient {
  id: string;
  userId: string;
  clientName: string;
  authMethod: "api_key" | "firebase_auth";
  registeredAt: Date;
  lastSeenAt: Date;
}

/**
 * Register or update an MCP client
 */
export async function registerMcpClient(
  userId: string,
  clientName: string,
  authMethod: "api_key" | "firebase_auth",
): Promise<McpClient> {
  try {
    const clientId = `${userId}_${clientName}`;
    const now = new Date();

    const existingClient = await getMcpClient(clientId);

    const clientData: McpClient = {
      id: clientId,
      userId,
      clientName,
      authMethod,
      registeredAt: existingClient?.registeredAt || now,
      lastSeenAt: now,
    };

    await db
      .collection(MCP_CLIENTS_COLLECTION)
      .doc(clientId)
      .set(toFirestoreData(clientData));

    console.log(
      `[registerMcpClient] Client ${clientName} registered for user ${userId} with ${authMethod}`,
    );
    return clientData;
  } catch (error) {
    console.error("Error registering MCP client:", error);
    throw error;
  }
}

/**
 * Get MCP client information
 */
export async function getMcpClient(
  clientId: string,
): Promise<McpClient | null> {
  try {
    const doc = await db.collection(MCP_CLIENTS_COLLECTION).doc(clientId).get();
    if (!doc.exists) {
      return null;
    }
    return fromFirestoreData(doc.data()) as McpClient;
  } catch (error) {
    console.error("Error getting MCP client:", error);
    return null;
  }
}

/**
 * List all MCP clients for a user
 */
export async function listUserMcpClients(userId: string): Promise<McpClient[]> {
  try {
    const querySnapshot = await db
      .collection(MCP_CLIENTS_COLLECTION)
      .where("userId", "==", userId)
      .orderBy("lastSeenAt", "desc")
      .get();

    return querySnapshot.docs.map(
      (doc) => fromFirestoreData(doc.data()) as McpClient,
    );
  } catch (error) {
    console.error("Error listing user MCP clients:", error);
    return [];
  }
}
