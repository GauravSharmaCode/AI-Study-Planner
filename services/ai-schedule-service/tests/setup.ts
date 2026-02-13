// Global test setup for AI Schedule Service
import { jest } from "@jest/globals";

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

// Cleanup after all tests - close BullMQ/Redis connections to prevent worker leaks
// Using dynamic imports to avoid triggering module loading at setup time
afterAll(async () => {
  jest.restoreAllMocks();

  // Dynamically import and clean up to avoid triggering side-effects at setup time
  try {
    const { closeQueue } = await import("../src/queues/rescheduleQueue");
    await closeQueue();
  } catch {
    // Ignore if module couldn't be loaded
  }

  try {
    const { stopRescheduleWorker } = await import(
      "../src/workers/rescheduleWorker"
    );
    await stopRescheduleWorker();
  } catch {
    // Ignore if module couldn't be loaded
  }
});
