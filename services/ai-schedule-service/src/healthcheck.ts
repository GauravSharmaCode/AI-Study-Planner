#!/usr/bin/env node

/**
 * Health Check Script for AI Schedule Service
 * This script is used by Docker to check if the service is healthy.
 * It makes an HTTP request to the /health endpoint and exits with appropriate codes.
 */

import http from 'http';

const options = {
  hostname: 'localhost',
  port: 3002,
  path: '/health',
  method: 'GET',
  timeout: 5000,
};

const healthCheck = http.request(options, (res) => {
  console.log(`Health check response: ${res.statusCode}`);
  
  if (res.statusCode === 200) {
    process.exit(0); // Success
  } else {
    process.exit(1); // Failure
  }
});

healthCheck.on('error', (err) => {
  console.error('Health check failed:', err.message);
  process.exit(1); // Failure
});

healthCheck.on('timeout', () => {
  console.error('Health check timed out');
  healthCheck.destroy();
  process.exit(1); // Failure
});

healthCheck.end();
