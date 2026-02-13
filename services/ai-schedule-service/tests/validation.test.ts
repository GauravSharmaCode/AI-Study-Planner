import express from "express";
import request from "supertest";
import { validateRequest } from "../src/middleware/validateRequest";
import { CreateStudyPlanSchema } from "../src/schemas";
import globalErrorHandler from "../src/middleware/errorHandler";

describe("Zod Validation Middleware - AI Schedule Service", () => {
  let app: express.Application;

  beforeAll(() => {
    app = express();
    app.use(express.json());

    // Test route
    app.post(
      "/test-validate",
      validateRequest(CreateStudyPlanSchema),
      (req, res) => {
        res.status(200).json({ success: true });
      },
    );

    app.use(globalErrorHandler);
  });

  test("should fail validation with missing subjects", async () => {
    const response = await request(app)
      .post("/test-validate")
      .send({
        availableHoursPerDay: 4,
        targetCompletionDate: "2025-09-01",
      })
      .expect(400);

    expect(response.body.status).toBe("fail");
    // Zod v4 format: "Invalid input: expected array, received undefined"
    expect(response.body.message).toContain("body.subjects");
  });

  test("should fail validation with invalid date", async () => {
    const response = await request(app)
      .post("/test-validate")
      .send({
        subjects: ["Math"],
        availableHoursPerDay: 4,
        targetCompletionDate: "invalid-date",
      })
      .expect(400);

    // Zod v4 format: "Must be a valid future date"
    expect(response.body.message).toContain("body.targetCompletionDate");
    expect(response.body.message).toContain("Must be a valid future date");
  });

  test("should pass validation with valid data", async () => {
    // Note: userId is now derived from JWT, not from request body
    // Use a future date (2027-09-01) since current date is 2026
    await request(app)
      .post("/test-validate")
      .send({
        subjects: ["Math"],
        availableHoursPerDay: 4,
        targetCompletionDate: "2027-09-01",
      })
      .expect(200);
  });
});
