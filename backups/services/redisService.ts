import { Redis } from '@upstash/redis';
import { FileUpload } from '@/types/file';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Prefix for all keys
const KEY_PREFIX = 'file:';
const METRICS_PREFIX = 'metrics:';

/**
 * Saves file metadata to Redis with TTL
 */
export const saveFileMetadata = async (
  fileData: FileUpload,
  ttlSeconds: number
): Promise<void> => {
  const key = `${KEY_PREFIX}${fileData.id}`;
  
  // Store file metadata as JSON
  await redis.set(key, JSON.stringify(fileData), {
    ex: ttlSeconds, // Expires after TTL seconds
  });
  
  // Increment upload counter for metrics
  await redis.incr(`${METRICS_PREFIX}uploads:count`);
  await redis.incr(`${METRICS_PREFIX}uploads:count:${getTodayDateString()}`);
};

/**
 * Gets file metadata from Redis
 */
export const getFileMetadata = async (fileId: string): Promise<FileUpload | null> => {
  const key = `${KEY_PREFIX}${fileId}`;
  const data = await redis.get<string>(key);
  
  if (!data) {
    return null;
  }
  
  const fileData = JSON.parse(data) as FileUpload;
  
  // Convert string dates back to Date objects
  if (typeof fileData.uploadedAt === 'string') {
    fileData.uploadedAt = new Date(fileData.uploadedAt);
  }
  if (typeof fileData.expiresAt === 'string') {
    fileData.expiresAt = new Date(fileData.expiresAt);
  }
  
  return fileData;
};

/**
 * Increments download count for a file
 */
export const incrementDownloadCount = async (fileId: string): Promise<number> => {
  const key = `${KEY_PREFIX}${fileId}`;
  
  // Get current file data
  const data = await redis.get<string>(key);
  if (!data) {
    throw new Error('File not found');
  }
  
  const fileData = JSON.parse(data) as FileUpload;
  fileData.downloadCount += 1;
  
  // Save updated data with the same TTL
  const ttl = await redis.ttl(key);
  if (ttl > 0) {
    await redis.set(key, JSON.stringify(fileData), { ex: ttl });
  } else {
    await redis.set(key, JSON.stringify(fileData));
  }
  
  // Increment download counter for metrics
  await redis.incr(`${METRICS_PREFIX}downloads:count`);
  await redis.incr(`${METRICS_PREFIX}downloads:count:${getTodayDateString()}`);
  
  return fileData.downloadCount;
};

/**
 * Deletes file metadata from Redis
 */
export const deleteFileMetadata = async (fileId: string): Promise<void> => {
  const key = `${KEY_PREFIX}${fileId}`;
  await redis.del(key);
};

/**
 * Counts active files in Redis
 */
export const countActiveFiles = async (): Promise<number> => {
  const keys = await redis.keys(`${KEY_PREFIX}*`);
  return keys.length;
};

/**
 * Gets upload/download metrics
 */
export const getMetrics = async () => {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  
  const [
    totalUploads,
    totalDownloads,
    todayUploads,
    todayDownloads,
    yesterdayUploads,
    yesterdayDownloads,
    activeFiles
  ] = await Promise.all([
    redis.get<number>(`${METRICS_PREFIX}uploads:count`) || 0,
    redis.get<number>(`${METRICS_PREFIX}downloads:count`) || 0,
    redis.get<number>(`${METRICS_PREFIX}uploads:count:${today}`) || 0,
    redis.get<number>(`${METRICS_PREFIX}downloads:count:${today}`) || 0,
    redis.get<number>(`${METRICS_PREFIX}uploads:count:${yesterday}`) || 0,
    redis.get<number>(`${METRICS_PREFIX}downloads:count:${yesterday}`) || 0,
    countActiveFiles()
  ]);
  
  return {
    totalUploads,
    totalDownloads,
    todayUploads,
    todayDownloads,
    yesterdayUploads,
    yesterdayDownloads,
    activeFiles
  };
};

/**
 * Helper function to get today's date string in YYYY-MM-DD format
 */
const getTodayDateString = () => {
  const today = new Date();
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
};

/**
 * Helper function to get yesterday's date string in YYYY-MM-DD format
 */
const getYesterdayDateString = () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
};

/**
 * Log an event
 */
export const logEvent = async (
  eventType: 'upload' | 'download' | 'expire' | 'error',
  fileId: string,
  ipAddress?: string,
  details?: any
) => {
  const timestamp = new Date().toISOString();
  const logEntry = JSON.stringify({
    timestamp,
    eventType,
    fileId,
    ipAddress,
    ...details
  });
  
  // Store log with 7-day expiration (short retention as specified)
  await redis.lpush(`logs:${eventType}`, logEntry);
  await redis.expire(`logs:${eventType}`, 60 * 60 * 24 * 7); // 7 days
};

/**
 * Get recent logs
 */
export const getRecentLogs = async (
  eventType: 'upload' | 'download' | 'expire' | 'error',
  limit: number = 100
) => {
  const logs = await redis.lrange(`logs:${eventType}`, 0, limit - 1);
  return logs.map(log => JSON.parse(log));
};