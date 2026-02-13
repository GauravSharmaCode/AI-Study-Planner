// Simple module loading test
import { describe, it, expect, jest } from '@jest/globals';

// Move mocks to top level
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(() => ({
    studyPlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    studySession: {
      createMany: jest.fn(),
      update: jest.fn(),
    },
    $disconnect: jest.fn(),
    $transaction: jest.fn((callback: any) => callback({
      studyPlan: {
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      studySession: {
        createMany: jest.fn(),
        deleteMany: jest.fn(),
      }
    })),
  })),
}));

jest.mock("../src/services/ai-api-client", () => ({
  AIAPIClient: jest.fn(() => ({
    generateContent: jest.fn(),
    estimateTopics: jest.fn(),
  })),
}));

jest.mock("../src/utils/logger", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

// Mock the reschedule queue to prevent Redis connection
jest.mock("../src/queues/rescheduleQueue", () => ({
  enqueueReschedule: jest.fn(),
  rescheduleQueue: {
    add: jest.fn(),
    close: jest.fn(),
  },
  closeQueue: jest.fn(),
}));

// Mock database config to avoid actual connection logic
jest.mock("../src/config/database", () => ({
  prisma: {
    studyPlan: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(),
    $disconnect: jest.fn(),
  },
  testConnection: jest.fn(),
  disconnect: jest.fn(),
}));

describe("Module Loading Test", () => {
  it("should load StudyPlanService", async () => {
    // Now try to load the service
    const studyPlanService = await import("../src/services/studyPlanService");
    expect(studyPlanService).toBeDefined();
    expect(studyPlanService.default).toBeDefined();
  });
});
