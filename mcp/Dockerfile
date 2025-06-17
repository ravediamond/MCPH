# Use Node.js Alpine for smaller image size
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY mcp/package*.json ./mcp/

# Install dependencies
RUN npm ci

# Copy source files
COPY mcp/tsconfig.json ./mcp/
COPY mcp/src ./mcp/src
COPY lib ./lib
COPY services ./services
COPY shared ./shared

# Build the application
WORKDIR /app/mcp
RUN npm ci
RUN npm run build

# Create production image
FROM node:20-slim
WORKDIR /app

# Copy built files and package.json
COPY --from=builder /app/mcp/dist ./dist
COPY --from=builder /app/mcp/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Set environment variables
ENV PORT=8080
ENV NODE_ENV=production

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "dist/index.js"]