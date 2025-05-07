'use client';

import { useState, useRef, ChangeEvent, FormEvent } from 'react';
import Button from './ui/Button';
import Card from './ui/Card';

interface FileUploadProps {
  onUploadSuccess?: (data: any) => void;
  onUploadError?: (error: Error) => void;
}

const FileUpload = ({ onUploadSuccess, onUploadError }: FileUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [ttl, setTtl] = useState<number>(1); // Default 1 hour TTL
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setError(null);
    }
  };
  
  const handleTtlChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (!isNaN(value) && value >= 0.016 && value <= 24) {
      setTtl(value);
    }
  };
  
  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!file) {
      setError('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    setError(null);
    
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('ttl', ttl.toString());
      
      // Optional: simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 100);
      
      const response = await fetch('/api/uploads', {
        method: 'POST',
        body: formData,
      });
      
      clearInterval(progressInterval);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Upload failed');
      }
      
      const data = await response.json();
      
      // Set upload progress to 100% when complete
      setUploadProgress(100);
      
      // Store result data
      setResult(data);
      
      // Reset form
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setFile(null);
      
      // Call success callback if provided
      if (onUploadSuccess) {
        onUploadSuccess(data);
      }
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'Failed to upload file');
      
      if (onUploadError) {
        onUploadError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      setUploading(false);
    }
  };
  
  const resetForm = () => {
    setFile(null);
    setTtl(1);
    setError(null);
    setResult(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  // Format file size in a human-readable way
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  // Format TTL in a human-readable way
  const formatTtl = (hours: number): string => {
    if (hours < 1/60) {
      return `${Math.round(hours * 60 * 60)} seconds`;
    } else if (hours < 1) {
      return `${Math.round(hours * 60)} minutes`;
    } else {
      return `${hours === 1 ? '1 hour' : `${hours} hours`}`;
    }
  };
  
  // Return the file upload form or the result screen
  return (
    <div className="w-full max-w-2xl mx-auto">
      {result ? (
        <Card className="bg-gray-800 border-gray-700 p-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-600 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">Upload Successful!</h2>
            <p className="text-gray-300 mb-4">Your file link is ready to share</p>
          </div>
          
          <div className="bg-gray-900 rounded-md p-4 mb-4">
            <div className="flex flex-col gap-2">
              <div>
                <span className="text-gray-400">File Name:</span>
                <span className="ml-2 text-white">{result.fileName}</span>
              </div>
              <div>
                <span className="text-gray-400">Size:</span>
                <span className="ml-2 text-white">{formatFileSize(result.size)}</span>
              </div>
              <div>
                <span className="text-gray-400">Expires:</span>
                <span className="ml-2 text-white">{new Date(result.expiresAt).toLocaleString()}</span>
              </div>
            </div>
          </div>
          
          <div className="relative mb-6">
            <input 
              type="text" 
              value={result.downloadUrl}
              readOnly
              className="w-full p-3 pr-20 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
              onClick={e => (e.target as HTMLInputElement).select()}
            />
            <button 
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-blue-600 text-white px-3 py-1 rounded text-sm"
              onClick={() => {
                navigator.clipboard.writeText(result.downloadUrl);
                alert('Download link copied to clipboard!');
              }}
            >
              Copy
            </button>
          </div>
          
          <div className="flex justify-center">
            <Button 
              variant="primary" 
              onClick={resetForm}
              className="mr-2"
            >
              Upload Another File
            </Button>
            <Button 
              variant="outline"
              onClick={() => window.open(result.downloadUrl, '_blank')}
            >
              Test Download Link
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleUpload}>
          <Card className="bg-gray-800 border-gray-700 p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Upload File</h2>
            
            {error && (
              <div className="p-3 mb-4 bg-red-900/50 border border-red-700 rounded text-red-200 text-sm">
                {error}
              </div>
            )}
            
            <div className="mb-4">
              <label className="block text-gray-300 mb-1">Select File</label>
              <input 
                ref={fileInputRef}
                type="file" 
                onChange={handleFileChange}
                className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white cursor-pointer"
                disabled={uploading}
              />
              {file && (
                <div className="mt-2 text-gray-400 text-sm">
                  Selected: {file.name} ({formatFileSize(file.size)})
                </div>
              )}
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-300 mb-1">
                Time to live: {formatTtl(ttl)}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0.016"
                  max="24"
                  step="0.016"
                  value={ttl}
                  onChange={handleTtlChange}
                  className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                  disabled={uploading}
                />
                <input
                  type="number"
                  min="0.016"
                  max="24"
                  step="0.1"
                  value={ttl}
                  onChange={handleTtlChange}
                  className="w-20 p-1 bg-gray-700 border border-gray-600 rounded text-white text-center"
                  disabled={uploading}
                />
              </div>
              <p className="mt-1 text-gray-400 text-xs">
                Files auto-expire after this time period (1 min to 24 hours)
              </p>
            </div>
            
            {uploading && (
              <div className="mb-4">
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div 
                    className="bg-blue-600 h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="mt-1 text-gray-400 text-xs text-center">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}
            
            <Button
              type="submit"
              variant="primary"
              className="w-full"
              disabled={uploading || !file}
            >
              {uploading ? 'Uploading...' : 'Upload File'}
            </Button>
          </Card>
        </form>
      )}
    </div>
  );
};

export default FileUpload;