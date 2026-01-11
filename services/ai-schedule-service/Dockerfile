FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Copy dependencies
COPY package*.json tsconfig.json ./

# Install dependencies
RUN npm install && npm cache clean --force

# Copy the rest of the app
COPY . .

# Build the TypeScript code
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Install dumb-init and openssl for signal handling and Prisma
RUN apk add --no-cache dumb-init openssl curl

# Create app user and logs directory FIRST
RUN addgroup -g 1001 -S nodejs && \
    adduser -S scheduleuser -u 1001 && \
    mkdir -p /app/logs && \
    chown scheduleuser:nodejs /app/logs

# Set working directory
WORKDIR /app

# Copy built app from builder with correct ownership
COPY --from=builder --chown=scheduleuser:nodejs /app/dist ./dist
COPY --from=builder --chown=scheduleuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=scheduleuser:nodejs /app/package*.json ./
COPY --from=builder --chown=scheduleuser:nodejs /app/prisma ./prisma
# Generate Prisma client after copying schema
RUN npx prisma generate

# Switch to non-root user
USER scheduleuser

# Expose service port
EXPOSE 3002

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3002/health || exit 1

# Start the application directly
CMD ["dumb-init", "node", "dist/index.js"]
