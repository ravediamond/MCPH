import { jest } from '@jest/globals';
import { uploadFile, getSignedDownloadUrl, fileExists, deleteFile } from '@/services/storageService';
import {
    saveFileMetadata,
    getFileMetadata,
    incrementDownloadCount,
    deleteFileMetadata
} from '@/services/firebaseService';

// Mock external services
jest.mock('@google-cloud/storage', () => {
    const mockFile = {
        save: jest.fn().mockResolvedValue({}),
        getSignedUrl: jest.fn().mockResolvedValue(['https://mock-signed-url.com']),
        delete: jest.fn().mockResolvedValue({}),
        exists: jest.fn().mockResolvedValue([true]),
        getMetadata: jest.fn().mockResolvedValue([{ metadata: { expiresAt: new Date().toISOString() } }])
    };

    const mockBucket = {
        file: jest.fn().mockReturnValue(mockFile),
        getFiles: jest.fn().mockResolvedValue([[mockFile]])
    };

    return {
        Storage: jest.fn().mockImplementation(() => ({
            bucket: jest.fn().mockReturnValue(mockBucket)
        }))
    };
});

jest.mock('@upstash/redis', () => {
    const mockRedis = {
        set: jest.fn().mockResolvedValue({}),
        get: jest.fn(),
        ttl: jest.fn().mockResolvedValue(3600),
        del: jest.fn().mockResolvedValue({}),
        keys: jest.fn().mockResolvedValue(['file:123']),
        incr: jest.fn().mockResolvedValue(1),
        lpush: jest.fn().mockResolvedValue({}),
        expire: jest.fn().mockResolvedValue({})
    };

    return {
        Redis: jest.fn().mockImplementation(() => mockRedis)
    };
});

describe('File Storage Service Flow', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockFileBuffer = Buffer.from('test file content');
    const mockFileName = 'test-file.txt';
    const mockContentType = 'text/plain';
    const mockTtlHours = 1;

    test('Full file lifecycle: upload → download → expiry → 404', async () => {
        // 1. Upload a file
        const uploadResult = await uploadFile(
            mockFileBuffer,
            mockFileName,
            mockContentType,
            mockTtlHours
        );

        // Verify upload result
        expect(uploadResult).toBeDefined();
        expect(uploadResult.fileName).toBe(mockFileName);
        expect(uploadResult.contentType).toBe(mockContentType);
        expect(uploadResult.size).toBe(mockFileBuffer.length);
        expect(uploadResult.id).toBeDefined();

        const fileId = uploadResult.id;

        // 2. Save file metadata to Redis
        await saveFileMetadata(uploadResult, mockTtlHours * 3600);

        // 3. Retrieve file metadata from Redis
        const fileMeta = {
            ...uploadResult,
            downloadCount: 0,
            uploadedAt: new Date(uploadResult.uploadedAt),
            expiresAt: new Date(uploadResult.expiresAt)
        };

        const mockRedis = require('@upstash/redis').Redis();
        mockRedis.get.mockResolvedValue(JSON.stringify(fileMeta));

        const retrievedMeta = await getFileMetadata(fileId);
        expect(retrievedMeta).toBeDefined();
        expect(retrievedMeta?.id).toBe(fileId);

        // 4. Get download URL
        const downloadUrl = await getSignedDownloadUrl(fileId, mockFileName);
        expect(downloadUrl).toBe('https://mock-signed-url.com');

        // 5. Increment download count
        const newCount = await incrementDownloadCount(fileId);
        expect(newCount).toBe(1);

        // 6. File expiration simulation
        // First, verify file exists
        let exists = await fileExists(uploadResult.gcsPath);
        expect(exists).toBe(true);

        // Make Redis return null to simulate expiration
        mockRedis.get.mockResolvedValue(null);

        // Verify file is considered "expired" when metadata is gone
        const expiredMeta = await getFileMetadata(fileId);
        expect(expiredMeta).toBeNull();

        // 7. Delete file (simulating cleanup)
        await deleteFile(uploadResult.gcsPath);
        await deleteFileMetadata(fileId);

        // Simulate file no longer exists
        const mockStorage = require('@google-cloud/storage').Storage();
        const mockBucket = mockStorage.bucket();
        const mockFile = mockBucket.file();
        mockFile.exists.mockResolvedValue([false]);

        // Verify file no longer exists
        exists = await fileExists(uploadResult.gcsPath);
        expect(exists).toBe(false);
    });
});