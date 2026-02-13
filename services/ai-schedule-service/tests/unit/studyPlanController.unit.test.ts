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

// Mock reschedule queue
jest.mock("../../src/queues/rescheduleQueue", () => ({
  enqueueReschedule: jest.fn(),
}));

import { StudyPlanController } from "../../src/controllers/studyPlanController";
import { Request, Response } from "express";

describe("StudyPlanController Unit Tests", () => {
  let studyPlanController: StudyPlanController;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    studyPlanController = new StudyPlanController();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockNext = jest.fn();
  });

  describe("generateStudyPlan", () => {
    it("should generate a study plan successfully", async () => {
      mockRequest = {
        userId: "user-123",
        body: {
          subjects: ["Math", "Physics"],
          availableHoursPerDay: 4,
          targetCompletionDate: "2027-09-01",
        },
      } as any;

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
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      // Controller wraps response in { status: 'success', data: ... }
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        data: mockResult,
      });
      expect(mockStudyPlanService.createPlan).toHaveBeenCalledWith(
        expect.objectContaining({
          subjects: ["Math", "Physics"],
          availableHoursPerDay: 4,
          targetCompletionDate: "2027-09-01",
          userId: "user-123",
        }),
      );
    });

    // Note: Error handling via catchAsync is tested in integration tests
    // Unit testing catchAsync behavior requires complex async/await handling
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
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        data: mockResult,
      });
      expect(mockStudyPlanService.getPlanById).toHaveBeenCalledWith(
        "plan-uuid",
      );
    });

    // Note: Error handling (404 not found) is tested in integration tests
  });

  describe("updateSessionStatus", () => {
    it("should update session status successfully", async () => {
      mockRequest = {
        params: { id: "session-uuid" },
        body: { status: "completed" },
        correlationId: "test-correlation-id",
      } as any;

      mockStudyPlanService.updateSessionStatus.mockResolvedValue(undefined);

      await studyPlanController.updateSessionStatus(
        mockRequest as Request,
        mockResponse as Response,
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        message: "Session status updated successfully",
      });
      expect(mockStudyPlanService.updateSessionStatus).toHaveBeenCalledWith(
        "session-uuid",
        { status: "completed" },
        "test-correlation-id",
      );
    });

    // Note: Error handling via catchAsync is tested in integration tests
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
        mockNext,
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: "success",
        message: "Session remarks updated successfully",
      });
      expect(mockStudyPlanService.updateSessionRemarks).toHaveBeenCalledWith(
        "session-uuid",
        "Need to review formulas again",
      );
    });
  });
});
