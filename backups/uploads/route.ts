import { NextRequest, NextResponse } from 'next/server';
import { ipAddress } from '@vercel/edge';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

import { uploadFile } from '@/services/storageService';
import { saveFileMetadata, logEvent } from '@/services/redisService';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

// Initialize Redis client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

// Create rate limiter (20 uploads per 10 minutes per IP)
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, '10 m'),
  analytics: true,
  prefix: "@upstash/ratelimit/uploads",
});

/**
 * POST /api/uploads
 * 
 * Uploads a file to Google Cloud Storage and stores metadata in Redis
 * Files auto-expire based on the TTL (default: 1 hour)
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit check
    const ip = ipAddress(request) || '127.0.0.1';
    const { success } = await ratelimit.limit(ip);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Try again later.' },
        { status: 429 }
      );
    }

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Get TTL from form data (default to 1 hour)
    const ttlHours = Number(formData.get('ttl')) || 1;
    
    // Validate TTL (min 1 minute, max 24 hours)
    if (ttlHours < 0.016 || ttlHours > 24) {
      return NextResponse.json(
        { error: 'TTL must be between 0.016 (1 minute) and 24 hours' },
        { status: 400 }
      );
    }

    // Optional metadata
    const metadata: Record<string, string> = {};
    for (const [key, value] of formData.entries()) {
      if (key !== 'file' && key !== 'ttl' && typeof value === 'string') {
        metadata[key] = value;
      }
    }

    // Read the file as buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(fileBuffer);

    // Upload to Google Cloud Storage
    const fileData = await uploadFile(
      buffer,
      file.name,
      file.type,
      ttlHours,
      metadata
    );

    // Calculate TTL in seconds for Redis
    const ttlSeconds = Math.floor(ttlHours * 60 * 60);
    
    // Save metadata in Redis with TTL
    await saveFileMetadata(fileData, ttlSeconds);
    
    // Log upload event
    await logEvent('upload', fileData.id, ip, {
      fileName: fileData.fileName,
      size: fileData.size,
      ttlHours
    });

    // Return success response with file ID and expiry time
    const host = request.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'https';
    const downloadUrl = `${protocol}://${host}/api/uploads/${fileData.id}`;

    return NextResponse.json({
      id: fileData.id,
      fileName: fileData.fileName,
      contentType: fileData.contentType,
      size: fileData.size,
      uploadedAt: fileData.uploadedAt.toISOString(),
      expiresAt: fileData.expiresAt.toISOString(),
      downloadUrl,
    }, { status: 201 });
    
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'File upload failed' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/uploads
 * 
 * Lists active file metrics (not file details for privacy)
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow metrics endpoint through here
    const url = new URL(request.url);
    if (url.pathname !== '/api/uploads') {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    const activeFiles = await redis.keys('file:*');
    
    return NextResponse.json({
      activeFiles: activeFiles.length,
      message: `There are currently ${activeFiles.length} active files in the system.`
    });
    
  } catch (error) {
    console.error('Get metrics error:', error);
    return NextResponse.json(
      { error: 'Failed to get metrics' },
      { status: 500 }
    );
  }
}