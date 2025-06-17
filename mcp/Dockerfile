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

# Ensure JS files in lib, services, and shared are available in the dist directory
RUN find /app/lib -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;
RUN find /app/services -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;
RUN find /app/shared -name "*.js" -exec cp --parents {} /app/mcp/dist/ \;

# Copy and set permissions for the start script
COPY mcp/start.sh ./start.sh
RUN chmod +x ./start.sh

# Remove dev dependencies for a smaller image
RUN npm prune --production

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV PORT=8080
ENV NODE_PATH=/app:/app/mcp

# Start the application using the wrapper script
CMD ["./start.sh"]
