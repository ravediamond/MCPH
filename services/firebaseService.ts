import { initializeApp, cert, App, ServiceAccount } from 'firebase-admin/app';
import { getDatabase, ServerValue } from 'firebase-admin/database';
import { v4 as uuidv4 } from 'uuid';

// --- Firebase Admin SDK Initialization ---
let firebaseApp: App;
const databaseURL = process.env.FIREBASE_DATABASE_URL;

if (!databaseURL) {
    throw new Error('FIREBASE_DATABASE_URL environment variable is not set. Ensure it is configured in your environment.');
}

try {
    console.log('Attempting to initialize Firebase Admin SDK using Application Default Credentials (ADC).');
    console.log('This will use GOOGLE_APPLICATION_CREDENTIALS environment variable if set, or other ADC mechanisms.');

    // Initialize Firebase Admin SDK without explicit credentials.
    // It will automatically use Application Default Credentials (ADC).
    // Ensure GOOGLE_APPLICATION_CREDENTIALS is set to the path of a valid service account JSON file
    // with appropriate Firebase permissions, or that the application is running in a GCP environment
    // where ADC is automatically configured (e.g., Cloud Run, GCE, GKE, App Engine).
    firebaseApp = initializeApp({
        databaseURL: databaseURL,
        // No 'credential' property is provided, so ADC will be used.
    });

    console.log('Firebase Admin SDK initialized successfully using Application Default Credentials.');

} catch (error: any) {
    console.error('Error initializing Firebase Admin SDK with Application Default Credentials:', error.message);
    let detailedError = 'Failed to initialize Firebase Admin SDK using Application Default Credentials. ';
    if (error.message.includes('Could not load the default credentials') ||
        error.message.includes('Unable to detect a Project Id') ||
        error.message.includes('getDefaultCredential') ||
        error.message.includes('Error getting access token from GOOGLE_APPLICATION_CREDENTIALS')) {
        detailedError += 'Please ensure the GOOGLE_APPLICATION_CREDENTIALS environment variable is correctly set to the path of a valid service account JSON file. ';
        detailedError += 'The service account must have the necessary Firebase permissions (e.g., Firebase Realtime Database Admin). ';
        detailedError += 'If running in a Google Cloud environment, ensure the runtime service account has these permissions. ';
    } else {
        detailedError += `An unexpected error occurred: ${error.message}. `;
    }
    detailedError += `Also, verify that FIREBASE_DATABASE_URL ("${databaseURL}") is correct.`;
    console.error(detailedError);
    throw new Error(detailedError);
}

const db = getDatabase(firebaseApp);

// --- End Firebase Admin SDK Initialization ---


// Prefix for file metadata in Firebase (paths in Realtime Database)
const FILES_PATH = 'files'; // Replaces FILE_PREFIX

// Prefix for metrics in Firebase
const METRICS_PATH = 'metrics'; // Replaces METRICS_PREFIX
const DAILY_METRICS_PATH = `${METRICS_PATH}/daily`;

// Prefix for events log in Firebase
const EVENTS_LOG_PATH = 'event_logs'; // Replaces EVENTS_PREFIX

// Maximum events to keep in the log (can be managed with queries and cleanup functions)
const MAX_EVENTS = 1000; // This will need a different implementation strategy

// File metadata type (remains the same)
export interface FileMetadata {
    id: string;
    fileName: string;
    contentType: string;
    size: number;
    gcsPath: string; // Assuming this is still relevant with Google Cloud Storage
    uploadedAt: Date;
    expiresAt: Date;
    downloadCount: number;
    ipAddress?: string;
    userId?: string;
    metadata?: Record<string, string>;
}

/**
 * Save file metadata to Firebase.
 * TTL is handled by storing expiresAt and checking it or using a cleanup function.
 */
export async function saveFileMetadata(
    fileData: FileMetadata,
    // ttlSeconds is no longer directly used by Firebase for auto-expiry in the same way as Redis.
    // The expiresAt field in fileData should be set appropriately by the caller.
    _ttlSeconds: number // Parameter kept for signature compatibility if needed, but ignored.
): Promise<boolean> {
    const fileRef = db.ref(`${FILES_PATH}/${fileData.id}`);
    try {
        // Convert Date objects to ISO strings for Firebase
        const dataToSave = {
            ...fileData,
            uploadedAt: fileData.uploadedAt.toISOString(),
            expiresAt: fileData.expiresAt.toISOString(),
        };
        await fileRef.set(dataToSave);
        return true;
    } catch (error) {
        console.error('Error saving file metadata to Firebase:', error);
        return false;
    }
}

/**
 * Get file metadata from Firebase
 */
export async function getFileMetadata(
    fileId: string
): Promise<FileMetadata | null> {
    const fileRef = db.ref(`${FILES_PATH}/${fileId}`);
    try {
        const snapshot = await fileRef.once('value');
        const data = snapshot.val();

        if (!data) return null;

        // Convert ISO date strings back to Date objects
        const fileMetadata: FileMetadata = {
            ...data,
            uploadedAt: new Date(data.uploadedAt),
            expiresAt: new Date(data.expiresAt),
        };

        // Optional: Check for expiry here if needed, though usually done by the caller or cleanup
        // if (fileMetadata.expiresAt <= new Date()) {
        //     // Optionally delete it if expired and accessed
        //     // await deleteFileMetadata(fileId); 
        //     return null; 
        // }

        return fileMetadata;
    } catch (error) {
        console.error('Error getting file metadata from Firebase:', error);
        return null;
    }
}

/**
 * Increment download count for a file in Firebase
 */
export async function incrementDownloadCount(fileId: string): Promise<number> {
    const downloadCountRef = db.ref(`${FILES_PATH}/${fileId}/downloadCount`);
    const fileRef = db.ref(`${FILES_PATH}/${fileId}`);

    try {
        const snapshot = await fileRef.once('value');
        if (!snapshot.exists()) {
            console.warn(`File metadata not found for ID: ${fileId} when incrementing download count.`);
            return 0; // Or throw an error
        }

        const transactionResult = await downloadCountRef.transaction((currentCount: number | null) => { // Explicitly type currentCount
            return (currentCount || 0) + 1;
        });

        if (transactionResult.committed && transactionResult.snapshot.exists()) {
            const newCount = transactionResult.snapshot.val();
            // Also update general metrics
            await incrementMetric('downloads');
            return newCount;
        } else {
            console.error('Failed to increment download count transactionally for fileId:', fileId);
            return snapshot.val()?.downloadCount || 0; // Return old count or 0
        }
    } catch (error) {
        console.error('Error incrementing download count in Firebase:', error);
        // Attempt to get current count if transaction failed for other reasons
        const snapshot = await downloadCountRef.once('value');
        return snapshot.val() || 0;
    }
}

/**
 * Delete file metadata from Firebase
 */
export async function deleteFileMetadata(fileId: string): Promise<boolean> {
    const fileRef = db.ref(`${FILES_PATH}/${fileId}`);
    try {
        await fileRef.remove();
        return true;
    } catch (error) {
        console.error('Error deleting file metadata from Firebase:', error);
        return false;
    }
}

/**
 * Increment a general metric counter (e.g., total downloads, total uploads)
 */
export async function incrementMetric(
    metric: string, // e.g., "uploads", "downloads"
    amount: number = 1
): Promise<number> {
    const metricRef = db.ref(`${METRICS_PATH}/${metric}`);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const dailyMetricRef = db.ref(`${DAILY_METRICS_PATH}/${today}/${metric}`);

    try {
        // Increment total metric
        const totalResult = await metricRef.transaction(currentValue => (currentValue as number || 0) + amount);

        // Increment daily metric
        await dailyMetricRef.transaction(currentValue => (currentValue as number || 0) + amount);

        return totalResult.snapshot.val() || 0;
    } catch (error) {
        console.error(`Error incrementing metric '${metric}' in Firebase:`, error);
        return 0; // Or handle error appropriately
    }
}

/**
 * Get a general metric value
 */
export async function getMetric(metric: string): Promise<number> {
    const metricRef = db.ref(`${METRICS_PATH}/${metric}`);
    try {
        const snapshot = await metricRef.once('value');
        return snapshot.val() || 0;
    } catch (error) {
        console.error(`Error getting metric '${metric}' from Firebase:`, error);
        return 0;
    }
}

/**
 * Get daily metrics for a specific metric type over a number of days
 */
export async function getDailyMetrics(
    metric: string, // e.g., "uploads", "downloads"
    days: number = 30
): Promise<Record<string, number>> {
    const result: Record<string, number> = {};
    const today = new Date();

    try {
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

            const dailyMetricRef = db.ref(`${DAILY_METRICS_PATH}/${dateStr}/${metric}`);
            const snapshot = await dailyMetricRef.once('value');
            result[dateStr] = snapshot.val() || 0;
        }
        return result;
    } catch (error) {
        console.error(`Error getting daily metrics for '${metric}' from Firebase:`, error);
        return {};
    }
}

/**
 * Log an event to Firebase.
 * Events are stored under /event_logs/{eventType}/{eventId}
 */
export async function logEvent(
    eventType: string,
    resourceId: string,
    ipAddress?: string,
    details: Record<string, any> = {}
): Promise<void> {
    const eventLogTypeRef = db.ref(`${EVENTS_LOG_PATH}/${eventType}`);
    try {
        const timestamp = new Date();
        const eventId = uuidv4(); // Generate a unique ID for the event

        const eventData = {
            id: eventId,
            type: eventType,
            resourceId,
            timestamp: timestamp.toISOString(),
            ipAddress,
            details,
        };

        // Use push to generate a unique key and add to the list-like structure
        const newEventRef = eventLogTypeRef.push();
        await newEventRef.set(eventData);

        // Trimming old events (MAX_EVENTS) needs a more complex strategy with Firebase:
        // 1. Query the oldest N events beyond MAX_EVENTS and delete them.
        // This is often done by a scheduled function or periodically.
        // Example:
        // const query = eventLogTypeRef.orderByChild('timestamp').limitToFirst(MAX_EVENTS_TO_TRIM_IF_OVER_LIMIT);
        // This is a simplified placeholder; actual trimming logic can be complex.
        // For now, we'll just add and rely on manual/scheduled cleanup for trimming.

        // Increment event counter metric
        await incrementMetric(`events:${eventType}`);
    } catch (error) {
        console.error('Error logging event to Firebase:', error);
    }
}

/**
 * Get recent events of a specific type from Firebase.
 * Returns events in descending order of addition (most recent first if using push()).
 * To get them by timestamp, you'd order by 'timestamp'.
 */
export async function getEvents(
    eventType: string,
    limit: number = 100
): Promise<any[]> {
    const eventLogTypeRef = db.ref(`${EVENTS_LOG_PATH}/${eventType}`);
    try {
        // Firebase's push() keys are chronologically ordered.
        // limitToLast will get the most recent 'limit' items.
        const snapshot = await eventLogTypeRef.orderByKey().limitToLast(limit).once('value');

        if (!snapshot.exists()) {
            return [];
        }

        const eventsData = snapshot.val();
        // Convert the object of events into an array
        const eventsArray = Object.keys(eventsData)
            .map(key => eventsData[key])
            // Firebase returns them in ascending order by key, so reverse for most recent first
            .reverse();

        return eventsArray;
    } catch (error) {
        console.error('Error getting events from Firebase:', error);
        return [];
    }
}

// --- Functions that might need review or were specific to Redis features like raw client access ---

// The old Redis client instance is no longer here.
// If any part of the app was using `redis.get(...)` directly,
// it needs to be refactored to use the new Firebase-based functions.

// Rate limiting logic that was previously implemented using Upstash/Redis
// will need a new implementation strategy using Firebase (e.g., Cloud Functions + RTDB)
// or a third-party service. The Ratelimit class from '@upstash/ratelimit'
// and its direct usage will no longer work without a Redis instance.

// Consider removing or refactoring cacheUtils.ts if it was purely Redis-based
// or adapt it to use Firebase if a similar caching pattern is desired.
// Firebase RTDB can act as a cache, but its performance characteristics and
// query capabilities are different from Redis.