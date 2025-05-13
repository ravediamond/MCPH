import { initializeApp, cert, App, ServiceAccount, getApps, getApp } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import { v4 as uuidv4 } from 'uuid';

// --- Firebase Admin SDK Initialization ---
let firebaseApp: App;
let db: Firestore;

// Flag to track if settings have been applied
let settingsApplied = false;

if (!getApps().length) {
    try {
        console.log('Attempting to initialize Firebase Admin SDK using Application Default Credentials (ADC).');
        console.log('This will use GOOGLE_APPLICATION_CREDENTIALS environment variable if set, or other ADC mechanisms.');

        // Initialize Firebase Admin SDK without explicit credentials.
        // It will automatically use Application Default Credentials (ADC).
        firebaseApp = initializeApp({
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
            detailedError += 'The service account must have the necessary Firebase permissions (e.g., Firestore Admin). ';
            detailedError += 'If running in a Google Cloud environment, ensure the runtime service account has these permissions. ';
        } else {
            detailedError += `An unexpected error occurred: ${error.message}. `;
        }
        console.error(detailedError);
        throw new Error(detailedError);
    }
} else {
    firebaseApp = getApp(); // Use the already initialized app
    console.log('Firebase Admin SDK already initialized. Using existing app.');
}

// Initialize Firestore
db = getFirestore(firebaseApp);

// Apply settings only once to avoid the "Firestore has already been initialized" error
if (!settingsApplied) {
    try {
        // Enable Firestore timestamp snapshots
        db.settings({ ignoreUndefinedProperties: true });
        settingsApplied = true;
        console.log('Firestore settings applied successfully.');
    } catch (error) {
        // If settings have already been applied, this is not a critical error
        console.warn('Could not apply Firestore settings, they may have already been configured:', error);
    }
}

// --- End Firebase Admin SDK Initialization ---

// Collection names for Firestore
const FILES_COLLECTION = 'files';
const METRICS_COLLECTION = 'metrics';
const EVENTS_COLLECTION = 'events';
const TEXT_CONTENT_COLLECTION = 'text_content';

// Export collection names for use in other modules
export { FILES_COLLECTION, METRICS_COLLECTION, EVENTS_COLLECTION, TEXT_CONTENT_COLLECTION };

// File metadata type
export interface FileMetadata {
    id: string;
    fileName: string;
    contentType: string;
    size: number;
    gcsPath: string;
    uploadedAt: Date;
    expiresAt?: Date;  // Added to match the storageService interface
    downloadCount: number;
    ipAddress?: string;
    userId?: string;
    metadata?: Record<string, string>;
}

/**
 * Convert Firebase timestamp to Date and vice versa
 */
const toFirestoreData = (data: any): any => {
    // Deep copy the object and handle Date conversion
    const result = { ...data };

    // Convert Date objects to Firestore timestamps
    Object.keys(result).forEach(key => {
        if (result[key] instanceof Date) {
            // We'll keep it as a Date; Firestore will convert it automatically
        } else if (typeof result[key] === 'object' && result[key] !== null) {
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
    Object.keys(result).forEach(key => {
        if (result[key] && typeof result[key].toDate === 'function') {
            result[key] = result[key].toDate();
        } else if (typeof result[key] === 'object' && result[key] !== null) {
            result[key] = fromFirestoreData(result[key]);
        }
    });

    return result;
};

/**
 * Save file metadata to Firestore.
 */
export async function saveFileMetadata(
    fileData: FileMetadata,
    _ttlSeconds: number // Parameter kept for signature compatibility
): Promise<boolean> {
    try {
        // Convert the data for Firestore
        const dataToSave = toFirestoreData({
            ...fileData,
        });

        // Add to Firestore
        await db.collection(FILES_COLLECTION).doc(fileData.id).set(dataToSave);

        return true;
    } catch (error) {
        console.error('Error saving file metadata to Firestore:', error);
        return false;
    }
}

/**
 * Get file metadata from Firestore
 */
export async function getFileMetadata(
    fileId: string
): Promise<FileMetadata | null> {
    try {
        const docRef = db.collection(FILES_COLLECTION).doc(fileId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data();

        // Convert Firestore timestamps back to Date objects
        return fromFirestoreData(data) as FileMetadata;
    } catch (error) {
        console.error('Error getting file metadata from Firestore:', error);
        return null;
    }
}

/**
 * Increment download count for a file in Firestore
 */
export async function incrementDownloadCount(fileId: string): Promise<number> {
    try {
        const docRef = db.collection(FILES_COLLECTION).doc(fileId);
        const doc = await docRef.get();

        if (!doc.exists) {
            console.warn(`File metadata not found for ID: ${fileId} when incrementing download count.`);
            return 0;
        }

        // Use FieldValue.increment() for atomic increment operation
        await docRef.update({
            downloadCount: FieldValue.increment(1)
        });

        // Also update general metrics
        await incrementMetric('downloads');

        // Get the updated document to return the new count
        const updatedDoc = await docRef.get();
        const downloadCount = updatedDoc.data()?.downloadCount || 0;

        return downloadCount;
    } catch (error) {
        console.error('Error incrementing download count in Firestore:', error);

        // Attempt to get current count if update failed
        try {
            const doc = await db.collection(FILES_COLLECTION).doc(fileId).get();
            return doc.data()?.downloadCount || 0;
        } catch (e) {
            return 0;
        }
    }
}

/**
 * Delete file metadata from Firestore
 */
export async function deleteFileMetadata(fileId: string): Promise<boolean> {
    try {
        await db.collection(FILES_COLLECTION).doc(fileId).delete();
        return true;
    } catch (error) {
        console.error('Error deleting file metadata from Firestore:', error);
        return false;
    }
}

/**
 * Increment a general metric counter
 */
export async function incrementMetric(
    metric: string,
    amount: number = 1
): Promise<number> {
    try {
        const metricRef = db.collection(METRICS_COLLECTION).doc('counters');

        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];
        const dailyMetricRef = db.collection(METRICS_COLLECTION).doc(`daily_${today}`);

        // Use FieldValue.increment for atomic increment
        const updateData: Record<string, any> = {};
        updateData[metric] = FieldValue.increment(amount);

        // Update the total counters
        await metricRef.set(updateData, { merge: true });

        // Also update the timestamp
        await metricRef.update({
            lastUpdated: new Date()
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
        const metricRef = db.collection(METRICS_COLLECTION).doc('counters');
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
            const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD

            promises.push(
                db.collection(METRICS_COLLECTION).doc(`daily_${dateStr}`).get()
                    .then(doc => {
                        result[dateStr] = doc.exists ? (doc.data()?.[metric] || 0) : 0;
                    })
            );
        }

        await Promise.all(promises);
        return result;
    } catch (error) {
        console.error(`Error getting daily metrics for '${metric}' from Firestore:`, error);
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
        console.error('Error logging event to Firestore:', error);
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
        const querySnapshot = await db.collection(EVENTS_COLLECTION)
            .where('type', '==', eventType)
            .orderBy('timestamp', 'desc')
            .limit(limit)
            .get();

        if (querySnapshot.empty) {
            return [];
        }

        // Convert to array of data
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert any Firestore timestamps to Date objects
            return fromFirestoreData(data);
        });
    } catch (error) {
        console.error('Error getting events from Firestore:', error);
        return [];
    }
}

/**
 * Get file metadata for a specific user from Firestore
 */
export async function getUserFiles(userId: string): Promise<FileMetadata[]> {
    try {
        const querySnapshot = await db.collection(FILES_COLLECTION)
            .where('userId', '==', userId)
            .orderBy('uploadedAt', 'desc')
            .get();

        if (querySnapshot.empty) {
            return [];
        }

        // Convert to array of data, converting Firestore timestamps to Date objects
        return querySnapshot.docs.map(doc => fromFirestoreData(doc.data()) as FileMetadata);
    } catch (error) {
        console.error(`Error getting files for user ${userId} from Firestore:`, error);
        return []; // Return empty array on error
    }
}