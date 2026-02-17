# Nginx API Gateway

High-performance API Gateway using Nginx to replace the Express.js gateway for the AI Study Planner microservices.

## Features

- **High Performance**: Nginx-based reverse proxy with optimized configuration
- **Rate Limiting**: Built-in request rate limiting with different zones for different endpoints
- **Load Balancing**: Upstream service load balancing with health checks
- **Security Headers**: CORS, XSS protection, content type validation, CSP headers
- **Health Checks**: Gateway and service health monitoring
- **Logging**: Detailed access and error logging with performance metrics
- **Compression**: Gzip compression for better performance
- **Connection Limiting**: Protection against connection abuse
- **Error Handling**: Custom error pages with JSON responses

## Architecture

```
Internet → NGINX Gateway (8080) → Services
                     ↓
            Internal Health (8090)
```

## Configuration

The gateway routes requests to:

- **User Service**: `/api/v1/auth/*` and `/api/v1/users/*` → `user-service:3001`
- **AI Schedule Service**: `/api/v1/plans/*` and `/api/v1/sessions/*` → `ai-schedule-service:3002`

### Rate Limiting Zones

- **Auth endpoints**: 5 requests/minute (burst: 10)
- **General API**: 100 requests/minute (burst: 50)
- **AI endpoints**: 10 requests/minute (burst: 20)

### Connection Limits

- Maximum 20 concurrent connections per IP

## Endpoints

### Gateway Endpoints
- `GET /` - Gateway information and available endpoints
- `GET /health` - Main health check
- `GET /nginx-health` - Internal nginx status (port 8090, internal only)

### API Endpoints (Proxied)

#### User Service
- `POST /api/v1/auth/register` - User registration
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/users/me` - Get current user

#### AI Schedule Service
- `POST /api/v1/plans/generate` - Generate AI study plan
- `GET /api/v1/plans/:id` - Get study plan
- `PATCH /api/v1/sessions/:id/status` - Update session status

## Usage

### Docker

```bash
# Build the gateway
docker build -t nginx-gateway .

# Run standalone
docker run -p 8080:8080 -p 8090:8090 nginx-gateway

# Run with Docker Compose (recommended)
docker-compose up nginx-gateway
```

### Local Development

```bash
# Install nginx locally
brew install nginx  # macOS
sudo apt install nginx  # Ubuntu

# Copy configuration
sudo cp nginx.conf /etc/nginx/nginx.conf

# Test configuration
sudo nginx -t

# Start nginx
sudo nginx

# Reload configuration
sudo nginx -s reload
```

## Environment Variables

The gateway expects these upstream services to be available via Docker networking:

- `user-service:3001` - User authentication and management service
- `ai-schedule-service:3002` - AI-powered scheduling service

## Health Checks

### Gateway Health
```bash
curl http://localhost:8080/health
```

Response:
```json
{
  "status": "healthy",
  "service": "nginx-api-gateway",
  "timestamp": "2024-01-01T12:00:00Z",
  "version": "2.0.0"
}
```

### Internal Health (Nginx Stats)
```bash
curl http://localhost:8090/nginx-health
```

### Service Health Aggregation
```bash
curl http://localhost:8080/api/v1/health/services
```

## Performance Features

### Gzip Compression
- Automatic compression for text, JSON, CSS, JS
- Minimum file size: 1KB
- Compression level: 6

### Connection Optimization
- Keep-alive connections enabled
- TCP optimizations (tcp_nopush, tcp_nodelay)
- sendfile enabled for static content

### Upstream Configuration
- Connection pooling with keepalive
- Fail-over with health checks
- Request timeouts and retries

## Security Features

### Headers
- `X-Frame-Options: SAMEORIGIN`
- `X-XSS-Protection: 1; mode=block`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy`
- `Referrer-Policy`

### CORS
- Configurable origins
- Credentials support
- Preflight request handling

### Rate Limiting
- Different limits for different endpoint types
- Burst handling
- IP-based limiting

## Monitoring

### Access Logs
Location: `/var/log/nginx/access.log`

Format includes:
- Request details
- Response time
- Upstream timing
- User agent and referrer

### Error Logs
Location: `/var/log/nginx/error.log`

Log level: `warn` (configurable)

### Metrics Available
- Response times
- Upstream connect/header/response times
- Status codes
- Request counts

## Troubleshooting

### Common Issues

1. **Service Unavailable (503)**
   - Check if upstream services are running
   - Verify service endpoints
   - Check docker network connectivity

2. **Rate Limited (429)**
   - Increase rate limits if needed
   - Check if client is making too many requests

3. **Gateway Timeout (504)**
   - Increase proxy timeouts
   - Check upstream service performance

### Debug Commands

```bash
# Check nginx configuration
nginx -t

# View real-time logs
docker logs -f nginx-gateway

# Check upstream status
curl http://localhost:8080/api/v1/health/services

# Test specific endpoint
curl -v http://localhost:8080/api/v1/auth/health
```

## Future Enhancements

- [ ] Lua scripting for advanced logic
- [ ] Prometheus metrics export
- [ ] JWT validation at gateway level
- [ ] Request/response transformation
- [ ] Circuit breaker pattern
- [ ] Distributed tracing headers

---

**Built for high performance and scalability** 🚀
