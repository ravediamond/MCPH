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
COPY lib ../lib
COPY services ../services
COPY shared ../shared
COPY app/types ../app/types

# Create symlinks so the import paths will resolve correctly
RUN mkdir -p dist/lib dist/services dist/shared
RUN ln -s /app/lib /app/mcp/dist/lib
RUN ln -s /app/services /app/mcp/dist/services
RUN ln -s /app/shared /app/mcp/dist/shared

# Build the application
RUN npm run build

# Remove dev dependencies for a smaller image
RUN npm prune --production

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV PORT=8080

# Start the application using the correct path to the entry point
CMD ["node", "--experimental-specifier-resolution=node", "dist/mcp/src/index.js"]
