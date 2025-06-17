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
RUN echo "Fixing import paths in compiled files..."
RUN sed -i 's|"../../lib/apiKeyAuth"|"/app/mcp/dist/lib/apiKeyAuth.js"|g' /app/mcp/dist/mcp/src/index.js
RUN sed -i 's|"../../services/firebaseService"|"/app/mcp/dist/services/firebaseService.js"|g' /app/mcp/dist/mcp/src/index.js
RUN sed -i 's|"../../services/storageService"|"/app/mcp/dist/services/storageService.js"|g' /app/mcp/dist/mcp/src/index.js
RUN sed -i 's|"../../shared/types/crate"|"/app/mcp/dist/shared/types/crate.js"|g' /app/mcp/dist/mcp/src/index.js

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

# Add debug: Display the content of index.js to verify import paths have been fixed
RUN echo "==== DEBUG: Checking import paths in index.js ====" && \
    grep -n "import.*from" /app/mcp/dist/mcp/src/index.js | grep "lib\|services\|shared"

# Start the application
CMD ["node", "dist/mcp/src/index.js"]
