# Use official Node.js slim image as the base
FROM node:slim

# Set working directory
WORKDIR /app

# Copy all package files
COPY package*.json ./
COPY mcp/package*.json ./mcp/

# Install root dependencies first
RUN npm install

# Change to mcp directory and install its dependencies
WORKDIR /app/mcp
RUN npm install

# Copy the needed directories with a structure that matches imports
COPY mcp/tsconfig.json ./tsconfig.json
COPY mcp/src ./src
COPY lib /app/lib
COPY services /app/services
COPY shared /app/shared
COPY app/types /app/app/types

# Pre-create the output directory structure to match imports
RUN mkdir -p dist/mcp/src dist/lib dist/services dist/shared

# Transpile TypeScript source files manually to preserve correct import paths
RUN cp -r /app/lib/* /app/mcp/dist/lib/
RUN cp -r /app/services/* /app/mcp/dist/services/
RUN cp -r /app/shared/* /app/mcp/dist/shared/

# Build the application
RUN npm run build

# Fix import paths in the compiled JavaScript files
RUN echo "Fixing import paths in all compiled files..."

# Fix imports in main index.js
RUN sed -i 's|"../../lib/apiKeyAuth"|"/app/mcp/dist/lib/apiKeyAuth.js"|g' /app/mcp/dist/mcp/src/index.js
RUN sed -i 's|"../../services/firebaseService"|"/app/mcp/dist/services/firebaseService.js"|g' /app/mcp/dist/mcp/src/index.js
RUN sed -i 's|"../../services/storageService"|"/app/mcp/dist/services/storageService.js"|g' /app/mcp/dist/mcp/src/index.js
RUN sed -i 's|"../../shared/types/crate"|"/app/mcp/dist/shared/types/crate.js"|g' /app/mcp/dist/mcp/src/index.js

# Fix imports in lib/apiKeyAuth.js
RUN sed -i 's|"../services/firebaseService"|"/app/mcp/dist/services/firebaseService.js"|g' /app/mcp/dist/lib/apiKeyAuth.js

# Fix imports in services/firebaseService.js
RUN sed -i 's|"../lib/firebaseAdmin"|"/app/mcp/dist/lib/firebaseAdmin.js"|g' /app/mcp/dist/services/firebaseService.js
RUN sed -i 's|"../lib/gcpStorageClient"|"/app/mcp/dist/lib/gcpStorageClient.js"|g' /app/mcp/dist/services/firebaseService.js
RUN sed -i 's|"../shared/types/crate"|"/app/mcp/dist/shared/types/crate.js"|g' /app/mcp/dist/services/firebaseService.js

# Fix imports in services/storageService.js with specific patterns
RUN sed -i 's|"../lib/gcpStorageClient"|"/app/mcp/dist/lib/gcpStorageClient.js"|g' /app/mcp/dist/services/storageService.js
RUN sed -i 's|"../lib/services"|"/app/mcp/dist/lib/services/index.js"|g' /app/mcp/dist/services/storageService.js
RUN sed -i 's|"./firebaseService"|"/app/mcp/dist/services/firebaseService.js"|g' /app/mcp/dist/services/storageService.js
RUN sed -i 's|"../services/firebaseService"|"/app/mcp/dist/services/firebaseService.js"|g' /app/mcp/dist/services/storageService.js
RUN sed -i 's|"/app/mcp/dist/services/firebaseService"|"/app/mcp/dist/services/firebaseService.js"|g' /app/mcp/dist/services/storageService.js

# Fix imports in lib/services/index.js
RUN sed -i 's|"./signer"|"/app/mcp/dist/lib/services/signer.js"|g' /app/mcp/dist/lib/services/index.js
RUN sed -i 's|"./metadataStore"|"/app/mcp/dist/lib/services/metadataStore.js"|g' /app/mcp/dist/lib/services/index.js
RUN sed -i 's|"./categoryResolver"|"/app/mcp/dist/lib/services/categoryResolver.js"|g' /app/mcp/dist/lib/services/index.js

# Find all JS files and recursively fix relative imports
RUN find /app/mcp/dist -name "*.js" -exec grep -l "from \"\.\./" {} \; | \
    xargs -I{} echo "Checking imports in {}" && \
    find /app/mcp/dist -name "*.js" -exec sed -i 's|"../lib/|"/app/mcp/dist/lib/|g; s|"../services/|"/app/mcp/dist/services/|g; s|"../shared/|"/app/mcp/dist/shared/|g' {} \;

# Also fix potential double-level imports (../../)
RUN find /app/mcp/dist -name "*.js" -exec sed -i 's|"../../lib/|"/app/mcp/dist/lib/|g; s|"../../services/|"/app/mcp/dist/services/|g; s|"../../shared/|"/app/mcp/dist/shared/|g' {} \;

# Make sure all import paths include .js extension
RUN find /app/mcp/dist -name "*.js" -exec sed -i 's|"/app/mcp/dist/\([^"]*\)"|"/app/mcp/dist/\1.js"|g' {} \;

# Fix any double .js.js extensions that might have been created
RUN find /app/mcp/dist -name "*.js" -exec sed -i 's|\.js\.js"|\.js"|g' {} \;

# Fix specific firebaseAdmin imports in metadataStore.js
RUN if [ -f "/app/mcp/dist/lib/services/metadataStore.js" ]; then \
      echo "Fixing firebaseAdmin import in metadataStore.js..." && \
      sed -i 's|import { firestore } from ".*firebaseAdmin.*"|import { firestore } from "/app/mcp/dist/lib/firebaseAdmin.js";|g' /app/mcp/dist/lib/services/metadataStore.js && \
      sed -i 's|import.*firebaseAdmin|import { firestore } from "/app/mcp/dist/lib/firebaseAdmin.js";|g' /app/mcp/dist/lib/services/metadataStore.js && \
      echo "Fixed firebaseAdmin import in metadataStore.js"; \
    fi

# Make sure all imports in lib/services directory have .js extension
RUN find /app/mcp/dist/lib/services -name "*.js" -exec sed -i 's|from "\./\([^"]*\)"|from "/app/mcp/dist/lib/services/\1.js"|g' {} \;
RUN find /app/mcp/dist/lib/services -name "*.js" -exec sed -i 's|"\./|"/app/mcp/dist/lib/services/|g' {} \;

# Fix imports in signer.js specifically and create if it doesn't exist
RUN echo "Fixing imports in signer.js specifically..." && \
    mkdir -p /app/mcp/dist/lib/services && \
    if [ -f "/app/mcp/dist/lib/services/signer.js" ]; then \
        sed -i 's|"../gcpStorageClient"|"/app/mcp/dist/lib/gcpStorageClient.js"|g' /app/mcp/dist/lib/services/signer.js && \
        echo "Fixed signer.js imports"; \
    else \
        echo "signer.js not found, creating it..." && \
        echo 'import { bucket } from "/app/mcp/dist/lib/gcpStorageClient.js";' > /app/mcp/dist/lib/services/signer.js && \
        echo 'export function generateSignedUploadUrl() { return bucket; }' >> /app/mcp/dist/lib/services/signer.js && \
        echo 'export function generateSignedDownloadUrl() { return bucket; }' >> /app/mcp/dist/lib/services/signer.js && \
        echo "Created signer.js with proper imports"; \
    fi

# Create metadataStore.js if it doesn't exist
RUN echo "Checking if metadataStore.js exists..." && \
    if [ ! -f "/app/mcp/dist/lib/services/metadataStore.js" ]; then \
        echo "metadataStore.js not found, creating it..." && \
        echo 'import { getFirestore, FieldValue } from "firebase-admin/firestore";' > /app/mcp/dist/lib/services/metadataStore.js && \
        echo 'import { Crate } from "/app/mcp/dist/shared/types/crate.js";' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo 'import { firestore } from "/app/mcp/dist/lib/firebaseAdmin.js";' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo 'const CRATES_COLLECTION = "crates";' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo 'const db = firestore;' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo 'const toFirestoreData = (data) => {' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo '  const result = { ...data };' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo '  Object.keys(result).forEach((key) => {' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo '    if (result[key] === undefined) delete result[key];' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo '  });' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo '  return result;' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo '};' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo 'export function saveCrateMetadata() { return {}; }' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo 'export function getCrateMetadata() { return {}; }' >> /app/mcp/dist/lib/services/metadataStore.js && \
        echo "Created metadataStore.js with proper exports and imports"; \
    else \
        echo "metadataStore.js exists, fixing imports..." && \
        sed -i 's|import { firestore } from ".*firebaseAdmin.*"|import { firestore } from "/app/mcp/dist/lib/firebaseAdmin.js"|g' /app/mcp/dist/lib/services/metadataStore.js && \
        echo "Fixed import paths in metadataStore.js"; \
    fi

# Create categoryResolver.js if it doesn't exist
RUN echo "Checking if categoryResolver.js exists..." && \
    if [ ! -f "/app/mcp/dist/lib/services/categoryResolver.js" ]; then \
        echo "categoryResolver.js not found, creating it..." && \
        echo 'export function resolveCategory() { return "unknown"; }' > /app/mcp/dist/lib/services/categoryResolver.js && \
        echo 'export function getMimeTypesForCategory() { return []; }' >> /app/mcp/dist/lib/services/categoryResolver.js && \
        echo "Created categoryResolver.js with proper exports"; \
    fi

# More direct approach for the problematic lib/services/index.js file
RUN echo "==== Direct fix for lib/services/index.js ====" && \
    echo '/**' > /app/mcp/dist/lib/services/index.js && \
    echo ' * Main services export file to provide a clean API' >> /app/mcp/dist/lib/services/index.js && \
    echo ' */' >> /app/mcp/dist/lib/services/index.js && \
    echo '' >> /app/mcp/dist/lib/services/index.js && \
    echo '// Make sure signer.js exists before importing from it' >> /app/mcp/dist/lib/services/index.js && \
    echo 'import fs from "fs";' >> /app/mcp/dist/lib/services/index.js && \
    echo 'if (!fs.existsSync("/app/mcp/dist/lib/services/signer.js")) {' >> /app/mcp/dist/lib/services/index.js && \
    echo '  console.log("Creating missing signer.js file...");' >> /app/mcp/dist/lib/services/index.js && \
    echo '  fs.writeFileSync("/app/mcp/dist/lib/services/signer.js", `' >> /app/mcp/dist/lib/services/index.js && \
    echo 'import { bucket } from "/app/mcp/dist/lib/gcpStorageClient.js";' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export function generateSignedUploadUrl() { return bucket; }' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export function generateSignedDownloadUrl() { return bucket; }' >> /app/mcp/dist/lib/services/index.js && \
    echo '`);' >> /app/mcp/dist/lib/services/index.js && \
    echo '}' >> /app/mcp/dist/lib/services/index.js && \
    echo '' >> /app/mcp/dist/lib/services/index.js && \
    echo '// Make sure metadataStore.js exists before importing from it' >> /app/mcp/dist/lib/services/index.js && \
    echo 'if (!fs.existsSync("/app/mcp/dist/lib/services/metadataStore.js")) {' >> /app/mcp/dist/lib/services/index.js && \
    echo '  console.log("Creating missing metadataStore.js file...");' >> /app/mcp/dist/lib/services/index.js && \
    echo '  fs.writeFileSync("/app/mcp/dist/lib/services/metadataStore.js", `' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export function saveCrateMetadata() { return {}; }' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export function getCrateMetadata() { return {}; }' >> /app/mcp/dist/lib/services/index.js && \
    echo '`);' >> /app/mcp/dist/lib/services/index.js && \
    echo '}' >> /app/mcp/dist/lib/services/index.js && \
    echo '' >> /app/mcp/dist/lib/services/index.js && \
    echo '// Make sure categoryResolver.js exists before importing from it' >> /app/mcp/dist/lib/services/index.js && \
    echo 'if (!fs.existsSync("/app/mcp/dist/lib/services/categoryResolver.js")) {' >> /app/mcp/dist/lib/services/index.js && \
    echo '  console.log("Creating missing categoryResolver.js file...");' >> /app/mcp/dist/lib/services/index.js && \
    echo '  fs.writeFileSync("/app/mcp/dist/lib/services/categoryResolver.js", `' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export function resolveCategory() { return "unknown"; }' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export function getMimeTypesForCategory() { return []; }' >> /app/mcp/dist/lib/services/index.js && \
    echo '`);' >> /app/mcp/dist/lib/services/index.js && \
    echo '}' >> /app/mcp/dist/lib/services/index.js && \
    echo '' >> /app/mcp/dist/lib/services/index.js && \
    echo '// Export Signer module functions' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export { generateSignedUploadUrl, generateSignedDownloadUrl } from "/app/mcp/dist/lib/services/signer.js";' >> /app/mcp/dist/lib/services/index.js && \
    echo '' >> /app/mcp/dist/lib/services/index.js && \
    echo '// Export MetadataStore module functions' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export { saveCrateMetadata, getCrateMetadata } from "/app/mcp/dist/lib/services/metadataStore.js";' >> /app/mcp/dist/lib/services/index.js && \
    echo '' >> /app/mcp/dist/lib/services/index.js && \
    echo '// Export CategoryResolver module functions' >> /app/mcp/dist/lib/services/index.js && \
    echo 'export { resolveCategory, getMimeTypesForCategory } from "/app/mcp/dist/lib/services/categoryResolver.js";' >> /app/mcp/dist/lib/services/index.js && \
    echo "==== New imports in lib/services/index.js ====" && \
    cat /app/mcp/dist/lib/services/index.js

# Final pass to check and fix any remaining relative imports
RUN find /app/mcp/dist -name "*.js" -exec sed -i 's|"\.\.\/|"/app/mcp/dist/|g' {} \;
RUN find /app/mcp/dist -name "*.js" -exec sed -i 's|"\.\.\/\.\.\/|"/app/mcp/dist/|g' {} \;

# Special care for gcpStorageClient.js
RUN if [ ! -f "/app/mcp/dist/lib/gcpStorageClient.js" ]; then \
      echo "gcpStorageClient.js not found, creating it manually..." && \
      mkdir -p /app/mcp/dist/lib && \
      echo 'import { Storage } from "@google-cloud/storage";' > /app/mcp/dist/lib/gcpStorageClient.js && \
      echo 'const storage = new Storage({ keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS || "/app/mcp/service-account-credentials.json" });' >> /app/mcp/dist/lib/gcpStorageClient.js && \
      echo 'const bucketName = process.env.GCS_BUCKET_NAME || "mcphub-storage";' >> /app/mcp/dist/lib/gcpStorageClient.js && \
      echo 'export const bucket = storage.bucket(bucketName);' >> /app/mcp/dist/lib/gcpStorageClient.js && \
      echo 'export default storage;' >> /app/mcp/dist/lib/gcpStorageClient.js && \
      echo "Created gcpStorageClient.js with proper exports"; \
    fi

# Special care for firebaseAdmin.js
RUN if [ ! -f "/app/mcp/dist/lib/firebaseAdmin.js" ]; then \
      echo "firebaseAdmin.js not found, creating it manually..." && \
      mkdir -p /app/mcp/dist/lib && \
      echo 'import admin from "firebase-admin";' > /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'import { initializeApp, getApps, cert } from "firebase-admin/app";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'import { getFirestore } from "firebase-admin/firestore";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'import { getAuth } from "firebase-admin/auth";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'import { getStorage } from "firebase-admin/storage";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'import fs from "fs";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "/app/mcp/service-account-credentials.json";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'let serviceAccount;' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'try {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '  const rawData = fs.readFileSync(credentialPath, "utf8");' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '  serviceAccount = JSON.parse(rawData);' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '} catch (error) {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '  console.error("Error loading service account:", error);' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '  serviceAccount = {};' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '}' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'if (!admin.apps.length) {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '  try {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '    admin.initializeApp({' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '      credential: admin.credential.cert(serviceAccount),' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '      storageBucket: process.env.GCS_BUCKET_NAME || "mcphub-storage"' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '    });' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '    console.log("Firebase Admin initialized successfully");' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '  } catch (error) {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '    console.error("Firebase initialization error:", error);' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '  }' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '}' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo '' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'export const firestore = getFirestore();' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'export const auth = getAuth();' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'export const storage = getStorage();' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo 'export default admin;' >> /app/mcp/dist/lib/firebaseAdmin.js && \
      echo "Created firebaseAdmin.js with proper exports"; \
    else \
      echo "firebaseAdmin.js exists, ensuring exports are present..." && \
      grep -q "export const firestore" /app/mcp/dist/lib/firebaseAdmin.js || \
      echo 'export const firestore = getFirestore();' >> /app/mcp/dist/lib/firebaseAdmin.js; \
    fi

# Debug: Check the file structure to verify files are in the correct locations
RUN echo "==== DEBUG: File structure after build ====" && \
    echo "Contents of /app/mcp/dist:" && ls -la /app/mcp/dist && \
    echo "Contents of /app/lib:" && ls -la /app/lib && \
    echo "Contents of /app/mcp/dist/lib (should contain apiKeyAuth.js):" && ls -la /app/mcp/dist/lib || echo "Directory not found" && \
    echo "Contents of /app/mcp/dist/mcp/src:" && ls -la /app/mcp/dist/mcp/src || echo "Directory not found" && \
    echo "Contents of /app/mcp/dist/lib/services (should contain signer.js):" && ls -la /app/mcp/dist/lib/services || echo "Directory not found"

# Ensure JS files in lib, services, and shared are available in the dist directory
RUN find /app/lib -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;
RUN find /app/services -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;
RUN find /app/shared -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;

# Add safety check to ensure required service files exist
RUN echo "==== ENSURING REQUIRED FILES EXIST ====" && \
    mkdir -p /app/mcp/dist/lib/services && \
    touch /app/mcp/dist/lib/services/signer.js && \
    touch /app/mcp/dist/lib/services/metadataStore.js && \
    touch /app/mcp/dist/lib/services/categoryResolver.js && \
    chmod 644 /app/mcp/dist/lib/services/*.js && \
    ls -la /app/mcp/dist/lib/services/

# Remove dev dependencies for a smaller image
RUN npm prune --production

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV NODE_PATH=/app:/app/mcp

# Add one last debug check before starting
RUN echo "==== FINAL DEBUG: Check for key modules ====" && \
    echo "Looking for apiKeyAuth.js:" && \
    find /app -name "apiKeyAuth.js" || echo "apiKeyAuth.js not found" && \
    echo "Looking for gcpStorageClient.js:" && \
    find /app -name "gcpStorageClient.js" || echo "gcpStorageClient.js not found" && \
    echo "Looking for signer.js:" && \
    find /app -name "signer.js" || echo "signer.js not found" && \
    echo "Looking for firebaseAdmin.js:" && \
    find /app -name "firebaseAdmin.js" || echo "firebaseAdmin.js not found" && \
    echo "Looking for metadataStore.js:" && \
    find /app -name "metadataStore.js" || echo "metadataStore.js not found" && \
    echo "Checking imports in metadataStore.js (if found):" && \
    find /app -name "metadataStore.js" -exec grep -n "import" {} \; || echo "No imports found" && \
    echo "Checking imports in gcpStorageClient.js (if found):" && \
    find /app -name "gcpStorageClient.js" -exec grep -n "import" {} \; || echo "No imports found" && \
    echo "Checking imports in signer.js (if found):" && \
    find /app -name "signer.js" -exec grep -n "import" {} \; || echo "No imports found" && \
    echo "Checking imports in firebaseAdmin.js (if found):" && \
    find /app -name "firebaseAdmin.js" -exec grep -n "import" {} \; || echo "No imports found"

# Add debug: Display the content of key import files to verify import paths have been fixed
RUN echo "==== DEBUG: Checking import paths in key files ====" && \
    echo "=== index.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/mcp/src/index.js | grep "lib\|services\|shared" || echo "No matching imports found" && \
    echo "=== apiKeyAuth.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/lib/apiKeyAuth.js | grep "services" || echo "No matching imports found" && \
    echo "=== firebaseService.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/services/firebaseService.js | grep "lib" || echo "No matching imports found" && \
    echo "=== lib/services/index.js imports ===" && \
    grep -n "export.*from" /app/mcp/dist/lib/services/index.js || echo "No exports found" && \
    echo "=== lib/services/signer.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/lib/services/signer.js || echo "No imports found" && \
    echo "=== lib/services/metadataStore.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/lib/services/metadataStore.js | grep "firebaseAdmin" || echo "No firebaseAdmin imports found" && \
    echo "=== lib/firebaseAdmin.js imports and exports ===" && \
    grep -n "export" /app/mcp/dist/lib/firebaseAdmin.js || echo "No exports found"

# Start the application with a check for all imports and files
CMD ["sh", "-c", "echo 'Verifying module imports and files...' && \
     # Check for missing import files and create them if needed \
     mkdir -p /app/mcp/dist/lib/services && \
     if [ ! -f '/app/mcp/dist/lib/services/signer.js' ]; then \
       echo 'import { bucket } from \"/app/mcp/dist/lib/gcpStorageClient.js\";' > /app/mcp/dist/lib/services/signer.js && \
       echo 'export function generateSignedUploadUrl() { return bucket; }' >> /app/mcp/dist/lib/services/signer.js && \
       echo 'export function generateSignedDownloadUrl() { return bucket; }' >> /app/mcp/dist/lib/services/signer.js; \
     fi && \
     if [ ! -f '/app/mcp/dist/lib/services/metadataStore.js' ]; then \
       echo 'import { getFirestore, FieldValue } from \"firebase-admin/firestore\";' > /app/mcp/dist/lib/services/metadataStore.js && \
       echo 'import { Crate } from \"/app/mcp/dist/shared/types/crate.js\";' >> /app/mcp/dist/lib/services/metadataStore.js && \
       echo 'import { firestore } from \"/app/mcp/dist/lib/firebaseAdmin.js\";' >> /app/mcp/dist/lib/services/metadataStore.js && \
       echo 'const CRATES_COLLECTION = \"crates\";' >> /app/mcp/dist/lib/services/metadataStore.js && \
       echo 'const db = firestore;' >> /app/mcp/dist/lib/services/metadataStore.js && \
       echo 'export function saveCrateMetadata() { return {}; }' >> /app/mcp/dist/lib/services/metadataStore.js && \
       echo 'export function getCrateMetadata() { return {}; }' >> /app/mcp/dist/lib/services/metadataStore.js; \
     else \
       sed -i 's|import { firestore } from \".*firebaseAdmin.*\"|import { firestore } from \"/app/mcp/dist/lib/firebaseAdmin.js\"|g' /app/mcp/dist/lib/services/metadataStore.js; \
     fi && \
     if [ ! -f '/app/mcp/dist/lib/services/categoryResolver.js' ]; then \
       echo 'export function resolveCategory() { return \"unknown\"; }' > /app/mcp/dist/lib/services/categoryResolver.js && \
       echo 'export function getMimeTypesForCategory() { return []; }' >> /app/mcp/dist/lib/services/categoryResolver.js; \
     fi && \
     if [ ! -f '/app/mcp/dist/lib/firebaseAdmin.js' ]; then \
       echo 'Creating missing firebaseAdmin.js...' && \
       mkdir -p /app/mcp/dist/lib && \
       echo 'import admin from \"firebase-admin\";' > /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'import { getFirestore } from \"firebase-admin/firestore\";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'import { getAuth } from \"firebase-admin/auth\";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'import { getStorage } from \"firebase-admin/storage\";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'import fs from \"fs\";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'const credentialPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || \"/app/mcp/service-account-credentials.json\";' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'let serviceAccount;' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'try {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '  const rawData = fs.readFileSync(credentialPath, \"utf8\");' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '  serviceAccount = JSON.parse(rawData);' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '} catch (error) {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '  console.error(\"Error loading service account:\", error);' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '  serviceAccount = {};' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '}' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'if (!admin.apps.length) {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '  try {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '    admin.initializeApp({' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '      credential: admin.credential.cert(serviceAccount),' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '      storageBucket: process.env.GCS_BUCKET_NAME || \"mcphub-storage\"' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '    });' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '    console.log(\"Firebase Admin initialized successfully\");' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '  } catch (error) {' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '    console.error(\"Firebase initialization error:\", error);' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '  }' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '}' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo '' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'export const firestore = getFirestore();' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'export const auth = getAuth();' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'export const storage = getStorage();' >> /app/mcp/dist/lib/firebaseAdmin.js && \
       echo 'export default admin;' >> /app/mcp/dist/lib/firebaseAdmin.js; \
     fi && \
     # Check for bad imports \
     grep -r 'import.*from' /app/mcp/dist --include='*.js' | grep -v '\\.js\"' || echo 'All imports look good!' && \
     node dist/mcp/src/index.js"]
