// Test setup file
// This runs before all tests to set up the test environment

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.JWT_SECRET = 'test-secret-key';
process.env.PORT = '3001';
process.env.SERVICE_NAME = 'user-service';
process.env.LOG_LEVEL = 'error'; // Reduce log noise in tests

// Mock console methods to reduce test output noise
const originalLog = console.log;
const originalError = console.error;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterAll(() => {
  console.log = originalLog;
  console.error = originalError;
});

// Global test timeout
jest.setTimeout(10000);
