import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { uploadFile } from '@/services/storageService';
import { saveFileMetadata, incrementMetric, logEvent, FileMetadata } from '@/services/redisService';

// Maximum file size (500MB)
const MAX_FILE_SIZE = 500 * 1024 * 1024;

// Default TTL if not specified (1 hour)
const DEFAULT_TTL_HOURS = 1;

// Maximum TTL allowed (24 hours)
const MAX_TTL_HOURS = 24;

export const config = {
    api: {
        bodyParser: false,
    },
    runtime: 'nodejs',
};

/**
 * Extract client IP address from request
 */
function getClientIp(req: NextRequest): string {
    const forwardedFor = req.headers.get('x-forwarded-for');
    if (forwardedFor) {
        return forwardedFor.split(',')[0].trim();
    }
    return '127.0.0.1';
}

/**
 * Parse the form data and extract file and parameters
 */
async function parseFormData(req: NextRequest): Promise<{
    file: File;
    ttl: number;
}> {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File;

        if (!file) {
            throw new Error('No file provided');
        }

        // Get TTL from form data (in hours)
        let ttl = DEFAULT_TTL_HOURS;
        const ttlValue = formData.get('ttl');

        if (ttlValue) {
            ttl = parseFloat(ttlValue.toString());

            // Validate TTL
            if (isNaN(ttl) || ttl <= 0) {
                ttl = DEFAULT_TTL_HOURS;
            } else if (ttl > MAX_TTL_HOURS) {
                ttl = MAX_TTL_HOURS;
            }
        }

        return { file, ttl };
    } catch (error) {
        console.error('Error parsing form data:', error);
        throw new Error('Failed to parse upload request');
    }
}

/**
 * POST handler for file uploads
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    try {
        // Get client IP
        const clientIp = getClientIp(req);

        // Parse form data
        const { file, ttl } = await parseFormData(req);

        // Check file size
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: `File is too large. Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB` },
                { status: 413 }
            );
        }

        // Read file as buffer
        const fileBuffer = Buffer.from(await file.arrayBuffer());

        // Upload file to storage
        const fileData = await uploadFile(
            fileBuffer,
            file.name,
            file.type || 'application/octet-stream',
            ttl
        );

        // Calculate TTL in seconds
        const ttlSeconds = Math.round(ttl * 3600);

        // Save file metadata to Redis
        await saveFileMetadata(fileData, ttlSeconds);

        // Calculate expiration time in UTC string
        const expiresAt = fileData.expiresAt.toISOString();

        // Generate download URL (this will be a link to our API endpoint)
        const downloadUrl = `${req.nextUrl.origin}/api/uploads/${fileData.id}`;

        // Log the upload event
        await logEvent('file_upload', fileData.id, clientIp, {
            fileName: file.name,
            fileSize: file.size,
            ttl,
        });

        // Increment upload count metric
        await incrementMetric('uploads');

        // Return response
        return NextResponse.json({
            id: fileData.id,
            fileName: fileData.fileName,
            contentType: fileData.contentType,
            size: fileData.size,
            downloadUrl,
            uploadedAt: fileData.uploadedAt.toISOString(),
            expiresAt,
        });
    } catch (error) {
        console.error('Error handling upload:', error);
        return NextResponse.json(
            { error: 'Failed to process upload' },
            { status: 500 }
        );
    }
}

/**
 * GET handler to check API status
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
    return NextResponse.json({
        status: 'ok',
        maxFileSize: MAX_FILE_SIZE,
        maxTtlHours: MAX_TTL_HOURS,
    });
}