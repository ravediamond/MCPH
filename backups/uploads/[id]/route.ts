import { NextRequest, NextResponse } from 'next/server';
import { ipAddress } from '@vercel/edge';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { getFileMetadata, incrementDownloadCount, logEvent } from '@/services/redisService';
import { getSignedDownloadUrl } from '@/services/storageService';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter (100 downloads per minute per IP)
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, '1 m'),
  analytics: true,
  prefix: "@upstash/ratelimit/downloads",
});

/**
 * GET /api/uploads/[id]
 * 
 * Downloads a file by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      );
    }
    
    // Rate limit check
    const ip = ipAddress(request) || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Check if the info parameter is present to return metadata instead of file
    const url = new URL(request.url);
    const infoOnly = url.searchParams.get('info') === 'true';
    
    // Get file metadata from Redis
    const fileData = await getFileMetadata(id);
    
    if (!fileData) {
      return NextResponse.json(
        { error: 'File not found or expired' },
        { status: 404 }
      );
    }
    
    // Check if file has expired
    const now = new Date();
    if (fileData.expiresAt < now) {
      return NextResponse.json(
        { error: 'File has expired' },
        { status: 410 }
      );
    }

    // If info only, return metadata without incrementing download count
    if (infoOnly) {
      const { gcsPath, ipAddress, ...safeFileData } = fileData;
      
      return NextResponse.json({
        ...safeFileData,
        uploadedAt: fileData.uploadedAt.toISOString(),
        expiresAt: fileData.expiresAt.toISOString(),
      });
    }
    
    // Increment download count
    await incrementDownloadCount(id);
    
    // Log download event
    await logEvent('download', id, ip, {
      fileName: fileData.fileName
    });
    
    // Get a signed URL for the file
    const signedUrl = await getSignedDownloadUrl(id, fileData.fileName);
    
    // Redirect to the signed URL
    return NextResponse.redirect(signedUrl);
    
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'File download failed' },
      { status: 500 }
    );
  }
}