// Mock Prisma Client
const mockPrisma = {
  studyPlan: {
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  studySession: {
    createMany: jest.fn(),
    update: jest.fn(),
  },
  $disconnect: jest.fn(),
};

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn(() => mockPrisma),
}));

// Mock AI API Client
const mockAIClient = {
  generateContent: jest.fn(),
};

jest.mock('../../src/services/ai-api-client', () => ({
  AIAPIClient: jest.fn(() => mockAIClient),
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
  warn: jest.fn(),
}));

import { StudyPlanController } from '../../src/controllers/studyPlanController';
import { Request, Response } from 'express';

describe('StudyPlanController Unit Tests', () => {
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

  describe('generateStudyPlan', () => {
    it('should generate a study plan successfully', async () => {
      mockRequest = {
        body: {
          subjects: ['Math', 'Physics'],
          availableHoursPerDay: 4,
          targetCompletionDate: '2025-09-01',
          userId: 'user-123'
        }
      };

      const mockAIPlan = {
        '2025-08-12': [
          {
            topic: 'Algebra',
            start_time: '09:00',
            end_time: '10:00',
            status: 'pending'
          }
        ]
      };

      const mockStudyPlan = {
        id: 'plan-uuid',
        userId: 'user-123',
        subjects: ['Math', 'Physics'],
        availableHoursPerDay: 4,
        targetCompletionDate: new Date('2025-09-01'),
        plan: mockAIPlan,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAIClient.generateContent.mockResolvedValue(JSON.stringify(mockAIPlan));
      mockPrisma.studyPlan.create.mockResolvedValue(mockStudyPlan);
      mockPrisma.studySession.createMany.mockResolvedValue({ count: 1 });

      await studyPlanController.generateStudyPlan(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        planId: 'plan-uuid',
        plan: mockAIPlan
      });
      expect(mockPrisma.studyPlan.create).toHaveBeenCalled();
      expect(mockPrisma.studySession.createMany).toHaveBeenCalled();
    });

    it('should handle missing required fields', async () => {
      mockRequest = {
        body: {
          subjects: ['Math'],
          // Missing other required fields
        }
      };

      await studyPlanController.generateStudyPlan(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Missing required fields: subjects, availableHoursPerDay, targetCompletionDate, userId'
      });
    });

    it('should use fallback plan when AI fails', async () => {
      mockRequest = {
        body: {
          subjects: ['Math', 'Physics'],
          availableHoursPerDay: 4,
          targetCompletionDate: '2025-09-01',
          userId: 'user-123'
        }
      };

      const mockStudyPlan = {
        id: 'plan-uuid',
        userId: 'user-123',
        subjects: ['Math', 'Physics'],
        availableHoursPerDay: 4,
        targetCompletionDate: new Date('2025-09-01'),
        plan: {},
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockAIClient.generateContent.mockRejectedValue(new Error('AI service failed'));
      mockPrisma.studyPlan.create.mockResolvedValue(mockStudyPlan);
      mockPrisma.studySession.createMany.mockResolvedValue({ count: 1 });

      await studyPlanController.generateStudyPlan(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockPrisma.studyPlan.create).toHaveBeenCalled();
    });
  });

  describe('getStudyPlan', () => {
    it('should retrieve study plan successfully', async () => {
      mockRequest = {
        params: { id: 'plan-uuid' }
      };

      const mockStudyPlan = {
        id: 'plan-uuid',
        userId: 'user-123',
        plan: {
          '2025-08-12': [
            {
              topic: 'Algebra',
              start_time: '09:00',
              end_time: '10:00',
              status: 'pending'
            }
          ]
        },
        sessions: []
      };

      mockPrisma.studyPlan.findUnique.mockResolvedValue(mockStudyPlan);

      await studyPlanController.getStudyPlan(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        planId: 'plan-uuid',
        plan: mockStudyPlan.plan
      });
    });

    it('should handle study plan not found', async () => {
      mockRequest = {
        params: { id: 'non-existent-uuid' }
      };

      mockPrisma.studyPlan.findUnique.mockResolvedValue(null);

      await studyPlanController.getStudyPlan(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Study plan not found'
      });
    });
  });

  describe('updateSessionStatus', () => {
    it('should update session status successfully', async () => {
      mockRequest = {
        params: { id: 'session-uuid' },
        body: { status: 'completed' }
      };

      mockPrisma.studySession.update.mockResolvedValue({
        id: 'session-uuid',
        status: 'completed'
      });

      await studyPlanController.updateSessionStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Session updated'
      });
      expect(mockPrisma.studySession.update).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        data: { status: 'completed' }
      });
    });

    it('should handle invalid status', async () => {
      mockRequest = {
        params: { id: 'session-uuid' },
        body: { status: 'invalid-status' }
      };

      await studyPlanController.updateSessionStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid status. Must be: pending, completed, or skipped'
      });
    });
  });

  describe('updateSessionRemarks', () => {
    it('should update session remarks successfully', async () => {
      mockRequest = {
        params: { id: 'session-uuid' },
        body: { remarks: 'Need to review formulas again' }
      };

      mockPrisma.studySession.update.mockResolvedValue({
        id: 'session-uuid',
        remarks: 'Need to review formulas again'
      });

      await studyPlanController.updateSessionRemarks(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        message: 'Remarks updated'
      });
      expect(mockPrisma.studySession.update).toHaveBeenCalledWith({
        where: { id: 'session-uuid' },
        data: { remarks: 'Need to review formulas again' }
      });
    });
  });
});
