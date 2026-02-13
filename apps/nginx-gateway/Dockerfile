# Multi-stage Nginx API Gateway
FROM nginx:1.25-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Create log directories and set permissions
RUN mkdir -p /var/log/nginx && \
    touch /var/log/nginx/access.log && \
    touch /var/log/nginx/error.log && \
    chmod 777 /var/log/nginx && \
    chmod 666 /var/log/nginx/access.log && \
    chmod 666 /var/log/nginx/error.log

# Health check script
COPY <<EOF /usr/local/bin/health-check.sh
#!/bin/sh
set -e

# Check main gateway
if ! curl -f http://localhost:8080/health >/dev/null 2>&1; then
    echo "Main gateway health check failed"
    exit 1
fi

# Check internal health
if ! curl -f http://localhost:8090/health >/dev/null 2>&1; then
    echo "Internal health check failed"
    exit 1
fi

echo "All health checks passed"
exit 0
EOF

RUN chmod +x /usr/local/bin/health-check.sh

# Expose ports
EXPOSE 8080 8090

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
  CMD /usr/local/bin/health-check.sh

# Start nginx (run as root to avoid permission issues)
CMD ["nginx", "-g", "daemon off;"]
