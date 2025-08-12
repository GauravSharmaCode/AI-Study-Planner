// Global test setup for AI Schedule Service
import { jest } from '@jest/globals';

// Mock console to avoid noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup test environment
beforeEach(() => {
  jest.clearAllMocks();
});

// Cleanup after tests
afterAll(() => {
  jest.restoreAllMocks();
});
