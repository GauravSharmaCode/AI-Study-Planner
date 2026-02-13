// Simple module loading test
describe("Module Loading Test", () => {
  it("should load StudyPlanService", async () => {
    // Mock the dependencies first
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
      })),
    }));

    jest.mock("../src/services/ai-api-client", () => ({
      AIAPIClient: jest.fn(() => ({
        generateContent: jest.fn(),
      })),
    }));

    jest.mock("../src/utils/logger", () => ({
      createLogger: jest.fn(() => ({
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
      })),
    }));

    // Now try to load the service
    const studyPlanService = await import("../src/services/studyPlanService");
    expect(studyPlanService).toBeDefined();
    expect(studyPlanService.default).toBeDefined();
  });
});
