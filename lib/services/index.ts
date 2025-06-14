/**
 * Main services export file to provide a clean API
 */

// Export Signer module functions
export { generateSignedUploadUrl, generateSignedDownloadUrl } from './signer';

// Export MetadataStore module functions
export { 
  saveCrateMetadata, 
  getCrateMetadata
} from './metadataStore';

// Export FileOps module functions
export { 
  compressBuffer, 
  decompressBuffer,
  type CompressionResult 
} from './fileOps';

// Export CategoryResolver module functions
export { 
  resolveCategory, 
  getMimeTypesForCategory 
} from './categoryResolver';
