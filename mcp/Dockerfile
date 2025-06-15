# Use official Node.js slim image as the base
FROM node:slim

# Set working directory
WORKDIR /app

# Copy package files
COPY mcp/package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm install

# Copy source files
COPY mcp/tsconfig.json ./tsconfig.json
COPY mcp/src ./src
COPY lib ./lib
COPY services ./services
COPY app/types ./app/types

# Build the application
RUN npm run build

# Remove dev dependencies for a smaller image
RUN npm prune --production

# Expose the application port
EXPOSE 8080

# Set environment variables
ENV PORT=8080

# Start the application
CMD ["npm", "start"]
