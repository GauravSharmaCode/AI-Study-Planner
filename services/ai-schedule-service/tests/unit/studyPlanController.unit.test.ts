// Mock StudyPlanService
const mockStudyPlanService = {
  createPlan: jest.fn(),
  getPlanById: jest.fn(),
  updateSessionStatus: jest.fn(),
  updateSessionRemarks: jest.fn(),
};

jest.mock("../../src/services/studyPlanService", () => mockStudyPlanService);

// Mock logger
jest.mock("../../src/utils/logger", () => ({
  createLogger: jest.fn(() => ({
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  })),
}));

import { StudyPlanController } from "../../src/controllers/studyPlanController";
import { Request, Response } from "express";

describe("StudyPlanController Unit Tests", () => {
  let studyPlanController: StudyPlanController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    studyPlanController = new StudyPlanController();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("generateStudyPlan", () => {
    it("should generate a study plan successfully", async () => {
      mockRequest = {
        body: {
          subjects: ["Math", "Physics"],
          availableHoursPerDay: 4,
          targetCompletionDate: "2025-09-01",
          userId: "user-123",
        },
      };

      const mockResult = {
        planId: "plan-uuid",
        plan: {
          "2025-08-12": [
            {
              topic: "Algebra",
              start_time: "09:00",
              end_time: "10:00",
              status: "pending",
            },
          ],
        },
      };

      mockStudyPlanService.createPlan.mockResolvedValue(mockResult);

      await studyPlanController.generateStudyPlan(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockStudyPlanService.createPlan).toHaveBeenCalledWith({
        subjects: ["Math", "Physics"],
        availableHoursPerDay: 4,
        targetCompletionDate: "2025-09-01",
        userId: "user-123",
      });
    });

    it("should handle missing required fields", async () => {
      mockRequest = {
        body: {
          subjects: ["Math"],
          // Missing other required fields
        },
      };

      await studyPlanController.generateStudyPlan(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error:
          "Missing required fields: subjects, availableHoursPerDay, targetCompletionDate, userId",
      });
      expect(mockStudyPlanService.createPlan).not.toHaveBeenCalled();
    });

    it("should handle service errors", async () => {
      mockRequest = {
        body: {
          subjects: ["Math", "Physics"],
          availableHoursPerDay: 4,
          targetCompletionDate: "2025-09-01",
          userId: "user-123",
        },
      };

      mockStudyPlanService.createPlan.mockRejectedValue(
        new Error("Service error"),
      );

      await studyPlanController.generateStudyPlan(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Failed to generate study plan",
        message: "Service error",
      });
    });
  });

  describe("getStudyPlan", () => {
    it("should retrieve study plan successfully", async () => {
      mockRequest = {
        params: { id: "plan-uuid" },
      };

      const mockResult = {
        planId: "plan-uuid",
        plan: {
          "2025-08-12": [
            {
              topic: "Algebra",
              start_time: "09:00",
              end_time: "10:00",
              status: "pending",
            },
          ],
        },
      };

      mockStudyPlanService.getPlanById.mockResolvedValue(mockResult);

      await studyPlanController.getStudyPlan(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(mockResult);
      expect(mockStudyPlanService.getPlanById).toHaveBeenCalledWith(
        "plan-uuid",
      );
    });

    it("should handle study plan not found", async () => {
      mockRequest = {
        params: { id: "non-existent-uuid" },
      };

      mockStudyPlanService.getPlanById.mockResolvedValue(null);

      await studyPlanController.getStudyPlan(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Study plan not found",
      });
    });
  });

  describe("updateSessionStatus", () => {
    it("should update session status successfully", async () => {
      mockRequest = {
        params: { id: "session-uuid" },
        body: { status: "completed" },
      };

      mockStudyPlanService.updateSessionStatus.mockResolvedValue(undefined);

      await studyPlanController.updateSessionStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Session updated",
      });
      expect(mockStudyPlanService.updateSessionStatus).toHaveBeenCalledWith(
        "session-uuid",
        "completed",
      );
    });

    it("should handle invalid status", async () => {
      mockRequest = {
        params: { id: "session-uuid" },
        body: { status: "invalid-status" },
      };

      mockStudyPlanService.updateSessionStatus.mockRejectedValue(
        new Error("Invalid status. Must be: pending, completed, or skipped"),
      );

      await studyPlanController.updateSessionStatus(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: "Invalid status. Must be: pending, completed, or skipped",
      });
    });
  });

  describe("updateSessionRemarks", () => {
    it("should update session remarks successfully", async () => {
      mockRequest = {
        params: { id: "session-uuid" },
        body: { remarks: "Need to review formulas again" },
      };

      mockStudyPlanService.updateSessionRemarks.mockResolvedValue(undefined);

      await studyPlanController.updateSessionRemarks(
        mockRequest as Request,
        mockResponse as Response,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: "Remarks updated",
      });
      expect(mockStudyPlanService.updateSessionRemarks).toHaveBeenCalledWith(
        "session-uuid",
        "Need to review formulas again",
      );
    });
  });
});
