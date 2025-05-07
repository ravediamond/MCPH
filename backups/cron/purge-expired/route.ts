import { NextRequest, NextResponse } from 'next/server'
import { purgeExpiredFiles } from '@/services/storageService'
import { logEvent } from '@/services/redisService'

// For Vercel cron job config
export const dynamic = 'force-dynamic'
export const maxDuration = 300 // 5 minutes max duration for the cron job

/**
 * Purges expired files from Google Cloud Storage
 * This endpoint is triggered by a Vercel Cron job
 */
export async function GET(req: NextRequest) {
  // Verify that this is a legitimate cron job request from Vercel
  // In production, you should verify using a secret token
  const authHeader = req.headers.get('authorization')
  
  // If running in production, validate the cron job
  if (process.env.NODE_ENV === 'production' && 
      (!authHeader || 
       !authHeader.startsWith('Bearer ') || 
       authHeader.split(' ')[1] !== process.env.CRON_SECRET)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  try {
    // Purge expired files
    const purgedCount = await purgeExpiredFiles()
    
    // Log the purge event
    if (purgedCount > 0) {
      await logEvent('expire', 'cron-purge', undefined, {
        purgedCount,
        timestamp: new Date().toISOString()
      })
    }
    
    return NextResponse.json({
      success: true,
      message: `Successfully purged ${purgedCount} expired files`,
      purgedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error purging expired files:', error)
    
    // Log the error
    await logEvent('error', 'cron-purge', undefined, {
      error: error instanceof Error ? error.message : String(error),
      timestamp: new Date().toISOString()
    })
    
    return NextResponse.json({
      success: false,
      error: 'Failed to purge expired files',
      message: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}