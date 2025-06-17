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

# More direct approach for the problematic storageService.js file
RUN echo "==== Direct fix for storageService.js ====" && \
    mkdir -p /tmp && \
    # Extract import statements
    grep "import" /app/mcp/dist/services/storageService.js > /tmp/imports.txt && \
    # Replace relative paths with absolute paths + .js extension
    sed -i 's|"./firebaseService"|"/app/mcp/dist/services/firebaseService.js"|g' /tmp/imports.txt && \
    sed -i 's|"../lib/gcpStorageClient"|"/app/mcp/dist/lib/gcpStorageClient.js"|g' /tmp/imports.txt && \
    sed -i 's|"../lib/services"|"/app/mcp/dist/lib/services/index.js"|g' /tmp/imports.txt && \
    # Create new file with fixed imports
    cat /tmp/imports.txt > /tmp/storageService.js && \
    # Append everything after the import statements
    sed -n '/^import/,${/^import/!p}' /app/mcp/dist/services/storageService.js >> /tmp/storageService.js && \
    # Replace the original file
    mv /tmp/storageService.js /app/mcp/dist/services/storageService.js && \
    # Show the result
    echo "==== New imports in storageService.js ====" && \
    grep "import" /app/mcp/dist/services/storageService.js

# Final pass to check and fix any remaining relative imports
RUN find /app/mcp/dist -name "*.js" -exec sed -i 's|"\.\.\/|"/app/mcp/dist/|g' {} \;
RUN find /app/mcp/dist -name "*.js" -exec sed -i 's|"\.\.\/\.\.\/|"/app/mcp/dist/|g' {} \;

# Debug: Check the file structure to verify files are in the correct locations
RUN echo "==== DEBUG: File structure after build ====" && \
    echo "Contents of /app/mcp/dist:" && ls -la /app/mcp/dist && \
    echo "Contents of /app/lib:" && ls -la /app/lib && \
    echo "Contents of /app/mcp/dist/lib (should contain apiKeyAuth.js):" && ls -la /app/mcp/dist/lib || echo "Directory not found" && \
    echo "Contents of /app/mcp/dist/mcp/src:" && ls -la /app/mcp/dist/mcp/src || echo "Directory not found"

# Ensure JS files in lib, services, and shared are available in the dist directory
RUN find /app/lib -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;
RUN find /app/services -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;
RUN find /app/shared -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;

# Remove dev dependencies for a smaller image
RUN npm prune --production

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV NODE_PATH=/app:/app/mcp

# Add one last debug check before starting
RUN echo "==== FINAL DEBUG: Check for apiKeyAuth module ====" && \
    find /app -name "apiKeyAuth.js" || echo "apiKeyAuth.js not found"

# Add debug: Display the content of key import files to verify import paths have been fixed
RUN echo "==== DEBUG: Checking import paths in key files ====" && \
    echo "=== index.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/mcp/src/index.js | grep "lib\|services\|shared" || echo "No matching imports found" && \
    echo "=== apiKeyAuth.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/lib/apiKeyAuth.js | grep "services" || echo "No matching imports found" && \
    echo "=== firebaseService.js imports ===" && \
    grep -n "import.*from" /app/mcp/dist/services/firebaseService.js | grep "lib" || echo "No matching imports found"

# Start the application with a check for all imports
CMD ["sh", "-c", "echo 'Verifying module imports...' && grep -r 'import.*from' /app/mcp/dist --include='*.js' | grep -v '\\.js\"' || echo 'All imports look good!' && node dist/mcp/src/index.js"]
