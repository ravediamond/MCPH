import { Redis } from '@upstash/redis';
import { v4 as uuidv4 } from 'uuid';

// Initialize Redis client
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Prefix for file metadata in Redis
const FILE_PREFIX = 'file:';

// Prefix for metrics in Redis
const METRICS_PREFIX = 'metrics:';

// Prefix for events log in Redis
const EVENTS_PREFIX = 'events:';

// Maximum events to keep in the log
const MAX_EVENTS = 1000;

// File metadata type
export interface FileMetadata {
    id: string;
    fileName: string;
    contentType: string;
    size: number;
    gcsPath: string;
    uploadedAt: Date;
    expiresAt: Date;
    downloadCount: number;
    ipAddress?: string;
    userId?: string;
    metadata?: Record<string, string>;
}

/**
 * Save file metadata to Redis with a TTL
 */
export async function saveFileMetadata(
    fileData: FileMetadata,
    ttlSeconds: number
): Promise<boolean> {
    // Format dates for JSON serialization
    const serializedData = {
        ...fileData,
        uploadedAt: fileData.uploadedAt.toISOString(),
        expiresAt: fileData.expiresAt.toISOString(),
    };

    // Save to Redis with TTL
    const key = `${FILE_PREFIX}${fileData.id}`;
    try {
        await redis.set(key, JSON.stringify(serializedData), { ex: ttlSeconds });
        return true;
    } catch (error) {
        console.error('Error saving file metadata to Redis:', error);
        return false;
    }
}

/**
 * Get file metadata from Redis
 */
export async function getFileMetadata(
    fileId: string
): Promise<FileMetadata | null> {
    try {
        const key = `${FILE_PREFIX}${fileId}`;
        const data = await redis.get<string>(key);

        if (!data) return null;

        const parsedData = JSON.parse(data);

        // Convert ISO date strings back to Date objects
        return {
            ...parsedData,
            uploadedAt: new Date(parsedData.uploadedAt),
            expiresAt: new Date(parsedData.expiresAt),
        };
    } catch (error) {
        console.error('Error getting file metadata from Redis:', error);
        return null;
    }
}

/**
 * Increment download count for a file
 */
export async function incrementDownloadCount(fileId: string): Promise<number> {
    try {
        const key = `${FILE_PREFIX}${fileId}`;
        const data = await redis.get<string>(key);

        if (!data) return 0;

        const parsedData = JSON.parse(data);
        const downloadCount = (parsedData.downloadCount || 0) + 1;

        // Update the download count
        parsedData.downloadCount = downloadCount;

        // Get TTL of the key
        const ttl = await redis.ttl(key);

        // Save back to Redis with the same TTL
        if (ttl > 0) {
            await redis.set(key, JSON.stringify(parsedData), { ex: ttl });
        }

        // Also update metrics
        await incrementMetric('downloads');

        return downloadCount;
    } catch (error) {
        console.error('Error incrementing download count:', error);
        return 0;
    }
}

/**
 * Increment a metric counter
 */
export async function incrementMetric(
    metric: string,
    amount: number = 1
): Promise<number> {
    try {
        const key = `${METRICS_PREFIX}${metric}`;
        const value = await redis.incrby(key, amount);

        // Also increment the daily metric
        const today = new Date().toISOString().split('T')[0];
        const dailyKey = `${METRICS_PREFIX}${metric}:${today}`;
        await redis.incrby(dailyKey, amount);

        // Set TTL for daily metrics (30 days)
        await redis.expire(dailyKey, 60 * 60 * 24 * 30);

        return value;
    } catch (error) {
        console.error('Error incrementing metric:', error);
        return 0;
    }
}

/**
 * Get metric value
 */
export async function getMetric(metric: string): Promise<number> {
    try {
        const key = `${METRICS_PREFIX}${metric}`;
        const value = await redis.get<number>(key);
        return value || 0;
    } catch (error) {
        console.error('Error getting metric:', error);
        return 0;
    }
}

/**
 * Get daily metrics for a specific period
 */
export async function getDailyMetrics(
    metric: string,
    days: number = 30
): Promise<Record<string, number>> {
    try {
        const result: Record<string, number> = {};
        const today = new Date();

        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const key = `${METRICS_PREFIX}${metric}:${dateStr}`;
            const value = await redis.get<number>(key);

            result[dateStr] = value || 0;
        }

        return result;
    } catch (error) {
        console.error('Error getting daily metrics:', error);
        return {};
    }
}

/**
 * Log an event
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

        const event = {
            id: eventId,
            type: eventType,
            resourceId,
            timestamp: timestamp.toISOString(),
            ipAddress,
            details,
        };

        // Push to the events log list
        const eventsKey = `${EVENTS_PREFIX}${eventType}`;
        await redis.lpush(eventsKey, JSON.stringify(event));

        // Trim the list to keep only the most recent events
        await redis.ltrim(eventsKey, 0, MAX_EVENTS - 1);

        // Set TTL for the events list (30 days)
        await redis.expire(eventsKey, 60 * 60 * 24 * 30);

        // Increment the event counter
        await incrementMetric(`events:${eventType}`);
    } catch (error) {
        console.error('Error logging event:', error);
    }
}

/**
 * Get recent events of a specific type
 */
export async function getEvents(
    eventType: string,
    limit: number = 100
): Promise<any[]> {
    try {
        const eventsKey = `${EVENTS_PREFIX}${eventType}`;
        const events = await redis.lrange<string>(eventsKey, 0, limit - 1);

        return events.map(event => JSON.parse(event));
    } catch (error) {
        console.error('Error getting events:', error);
        return [];
    }
}

/**
 * Delete all metadata for a file
 */
export async function deleteFileMetadata(fileId: string): Promise<boolean> {
    try {
        const key = `${FILE_PREFIX}${fileId}`;
        await redis.del(key);
        return true;
    } catch (error) {
        console.error('Error deleting file metadata:', error);
        return false;
    }
}