import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredFiles } from '@/services/storageService';
import { logEvent } from '@/services/redisService';
import { Redis } from '@upstash/redis';

// For Vercel edge functions
export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max execution time

// Initialize Redis client for locking mechanism
const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Lock key for preventing concurrent cron jobs
const LOCK_KEY = 'cron:purge-expired:lock';
const LOCK_TTL = 600; // 10 minutes (to ensure the lock expires eventually)

/**
 * GET /api/cron/purge-expired
 * Purges expired files from storage
 * 
 * Intended to be called by Vercel Cron:
 * https://vercel.com/docs/cron-jobs
 */
export async function GET(req: NextRequest) {
    try {
        // Check if this is a cron job invocation
        const authHeader = req.headers.get('authorization');
        if (
            process.env.CRON_SECRET &&
            (!authHeader || authHeader !== `Bearer ${process.env.CRON_SECRET}`)
        ) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        // Try to acquire the lock
        const acquiredLock = await redis.set(
            LOCK_KEY,
            new Date().toISOString(),
            { nx: true, ex: LOCK_TTL }
        );

        // If lock not acquired, another instance is already running
        if (!acquiredLock) {
            return NextResponse.json(
                { message: 'Another purge job is already running' },
                { status: 409 }
            );
        }

        try {
            // Purge expired files
            const purgedCount = await purgeExpiredFiles();

            // Log the event
            await logEvent('purge_expired', 'cron-job', undefined, {
                purgedCount
            });

            return NextResponse.json({
                success: true,
                message: `Purged ${purgedCount} expired files`,
                timestamp: new Date().toISOString()
            });
        } finally {
            // Release the lock even if there was an error
            await redis.del(LOCK_KEY);
        }
    } catch (error) {
        console.error('Error purging expired files:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to purge expired files',
                details: error instanceof Error ? error.message : String(error)
            },
            { status: 500 }
        );
    }
}