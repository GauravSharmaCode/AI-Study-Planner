// Mock Prisma Client before any imports
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
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

// Mock AI service to avoid external API calls in tests
jest.mock("../../src/services/ai-api-client", () => ({
  AIAPIClient: jest.fn().mockImplementation(() => ({
    generateContent: jest.fn().mockResolvedValue(
      JSON.stringify({
        "2025-08-12": [
          {
            topic: "Test Topic",
            start_time: "09:00",
            end_time: "10:00",
            status: "pending",
          },
        ],
      }),
    ),
  })),
}));

// Mock logger
jest.mock("../../src/utils/logger", () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

const request = require("supertest");

// Skip integration tests unless TEST_DB=on
const describeIntegration =
  process.env.TEST_DB === "on" ? describe : describe.skip;

describeIntegration("AI Schedule Service Integration Tests", () => {
  let app: any;

  beforeAll(async () => {
    // Import app after mocking
    const { default: testApp } = await import("../../src/index");
    app = testApp;
  });

  describe("Health Check", () => {
    it("should return health status", async () => {
      const response = await request(app).get("/health").expect(200);

      expect(response.body).toHaveProperty("status");
      expect(response.body.status).toBe("healthy");
    });
  });

  describe("Error Handling", () => {
    it("should handle 404 for unknown routes", async () => {
      const response = await request(app)
        .get("/api/v1/unknown-route")
        .expect(404);

      expect(response.body).toHaveProperty("error");
    });
  });
});
