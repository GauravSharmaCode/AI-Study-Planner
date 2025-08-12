#!/usr/bin/env node
"use strict";
/**
 * Health Check Script for AI Schedule Service
 * This script is used by Docker to check if the service is healthy.
 * It makes an HTTP request to the /health endpoint and exits with appropriate codes.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = __importDefault(require("http"));
const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/health',
    method: 'GET',
    timeout: 5000,
};
const healthCheck = http_1.default.request(options, (res) => {
    console.log(`Health check response: ${res.statusCode}`);
    if (res.statusCode === 200) {
        process.exit(0); // Success
    }
    else {
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
//# sourceMappingURL=healthcheck.js.map