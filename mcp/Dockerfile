# Use official Node.js slim image as the base
FROM node:slim

# Set working directory
WORKDIR /app

# Copy package files from both root and mcp directory
COPY package*.json ./
COPY mcp/package*.json ./mcp/

# Install root dependencies first
RUN npm install

# Change to mcp directory and install its dependencies
WORKDIR /app/mcp
RUN npm install

# Copy source files
COPY mcp/tsconfig.json ./tsconfig.json
COPY mcp/src ./src
COPY lib ../lib
COPY services ../services
COPY shared ../shared
COPY app/types ../app/types
COPY mcp/src/types ./src/types

# Build the application
RUN npm run build

# Remove dev dependencies for a smaller image
RUN npm prune --production

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV PORT=8080

# Start the application using the correct path to the entry point
CMD ["node", "dist/mcp/src/index.js"]
