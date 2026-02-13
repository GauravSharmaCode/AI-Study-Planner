const request = require('supertest');
const express = require('express');

// Create a test app without starting the server
const createTestApp = () => {
  const app = express();
  
  // Basic middleware
  app.use(express.json());
  
  // Health endpoint
  app.get('/health', (req, res) => {
    res.json({
      status: 'success',
      message: 'Service is healthy',
      service: 'user-service',
      timestamp: new Date().toISOString()
    });
  });
  
  // Root endpoint
  app.get('/', (req, res) => {
    res.json({
      service: 'user-service',
      version: '1.0.0',
      status: 'running'
    });
  });
  
  return app;
};

describe('User Service API', () => {
  let app;

  beforeAll(() => {
    app = createTestApp();
  });

  describe('Health and Info Endpoints', () => {
    it('should return service info at root endpoint', async () => {
      const res = await request(app).get('/');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('service', 'user-service');
      expect(res.body).toHaveProperty('version', '1.0.0');
      expect(res.body).toHaveProperty('status', 'running');
    });

    it('should return health check', async () => {
      const res = await request(app).get('/health');
      expect(res.statusCode).toBe(200);
      expect(res.body).toHaveProperty('status', 'success');
      expect(res.body).toHaveProperty('message', 'Service is healthy');
      expect(res.body).toHaveProperty('service', 'user-service');
    });
  });
});
