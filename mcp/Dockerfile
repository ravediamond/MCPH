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

# Copy all source files to maintain the correct directory structure
COPY mcp/tsconfig.json ./tsconfig.json
COPY mcp/src ./src
COPY lib /app/lib
COPY services /app/services
COPY shared /app/shared
COPY app/types /app/app/types

# Build the application
RUN npm run build

# Ensure the dist directory has the correct structure for imports
RUN mkdir -p /app/mcp/dist/lib /app/mcp/dist/services /app/mcp/dist/shared
RUN cp -r /app/lib /app/mcp/dist/ && cp -r /app/services /app/mcp/dist/ && cp -r /app/shared /app/mcp/dist/

# Remove dev dependencies for a smaller image
RUN npm prune --production

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV PORT=8080

# Start the application using the correct path to the entry point
CMD ["node", "dist/mcp/src/index.js"]
