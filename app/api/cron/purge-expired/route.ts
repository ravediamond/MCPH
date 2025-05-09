import { NextRequest, NextResponse } from 'next/server';
import { purgeExpiredFiles } from '@/services/storageService';
import { logEvent } from '@/services/firebaseService';

// For Vercel edge functions
// export const runtime = 'edge'; // Removed this line
export const dynamic = 'force-dynamic';
// ... SQS-1745: maxDuration for serverless functions is much shorter (e.g., 10-15s on Vercel Hobby)
// If purgeExpiredFiles can take longer, this might need to be deployed on a tier that supports longer execution
// or the job needs to be broken down / made idempotent to run more frequently for shorter durations.
// For standard serverless functions, maxDuration might be interpreted differently or have different limits.
// Vercel's default for Serverless Functions is 10s (Hobby) up to 900s (Pro/Enterprise based on config).
// Let's comment it out for now, or adjust based on typical execution time and Vercel plan.
// export const maxDuration = 300; // 5 minutes max execution time

// REMOVED: Upstash Redis client initialization for locking mechanism
// const redis = new Redis({
//     url: process.env.UPSTASH_REDIS_REST_URL!,
//     token: process.env.UPSTASH_REDIS_REST_TOKEN!,
// });

// REMOVED: Lock key for preventing concurrent cron jobs
// const LOCK_KEY = 'cron:purge-expired:lock';
// const LOCK_TTL = 600; // 10 minutes (to ensure the lock expires eventually)

/**
 * GET /api/cron/purge-expired
 * Purges expired files from storage
 * 
 * Intended to be called by Vercel Cron:
 * https://vercel.com/docs/cron-jobs
 */
export async function GET(req: NextRequest) {
    // Implement a new locking mechanism here if needed (e.g., using Firebase)
    // For example, try to set a flag in Firebase and proceed only if successful.
    // Ensure the lock is released in a finally block.

    // --- Firebase Lock Example (Conceptual) ---
    // const lockRef = db.ref('locks/cron/purge-expired');
    // const lockTTL = 600 * 1000; // 10 minutes in milliseconds
    // let lockAcquired = false;
    // try {
    //     const transactionResult = await lockRef.transaction(currentData => {
    //         if (currentData === null || currentData.timestamp < Date.now() - lockTTL) {
    //             return { timestamp: Date.now(), owner: 'your-cron-job-instance-id' };
    //         }
    //         return; // Abort transaction if lock is held by another active process
    //     });
    //     if (!transactionResult.committed || !transactionResult.snapshot.exists()) {
    //         return NextResponse.json({ message: 'Cron job already running or lock contention.' }, { status: 429 });
    //     }
    //     lockAcquired = true;
    // --- End Firebase Lock Example ---

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

    } catch (error) {
        console.error('Error in cron job:', error);
        return NextResponse.json({ message: 'Cron job failed.', error: (error as Error).message }, { status: 500 });
    } finally {
        // Release the lock
        // if (lockAcquired && lockRef) { // Release Firebase lock
        //    await lockRef.remove();
        // }
    }
}