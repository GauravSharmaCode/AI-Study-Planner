
import { jest, describe, it, expect, beforeEach } from '@jest/globals';

// Mock dependencies
const mockPrisma = {
  studyPlan: {
    findUnique: jest.fn() as jest.Mock,
  },
  $queryRaw: jest.fn() as jest.Mock,
};

// Mock the config module to export our mockPrisma
jest.mock('../../src/config/database', () => ({
  prisma: mockPrisma,
}));

// Mock logger
jest.mock('../../src/utils/logger', () => ({
  createLogger: () => ({
    entry: jest.fn(),
    exit: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock AI client
jest.mock('../../src/services/ai-api-client', () => ({
  AIAPIClient: jest.fn().mockImplementation(() => ({
    estimateTopics: jest.fn(),
  })),
}));

// Import the service AFTER mocks
import { StudyPlanService } from '../../src/services/studyPlanService';

describe('StudyPlanService - Analytics Optimization', () => {
  let service: StudyPlanService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StudyPlanService();
  });

  it('should calculate coverage analytics correctly using raw SQL aggregation', async () => {
    const studyPlanId = 'plan-123';
    const mockPlan = {
      id: studyPlanId,
      targetCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
      availableHoursPerDay: 4,
    };

    // Mock findUnique to return plan details (without sessions)
    (mockPrisma.studyPlan.findUnique as any).mockResolvedValue(mockPlan);

    // Mock queryRaw to return aggregated stats
    // Note: in Postgres/Prisma, aggregates like SUM/COUNT return BigInt or string sometimes.
    // Simulating BigInt returns as they would come from Prisma.
    const mockAggregates = [{
      total_sessions: BigInt(10),
      total_planned_minutes: BigInt(600), // 10 * 60
      completed_sessions: BigInt(3),
      skipped_sessions: BigInt(1),
      partial_sessions: BigInt(2),
      pending_sessions: BigInt(4),
      total_completed_minutes: BigInt(250), // 3*60 (completed) + 1*0 (skipped) + 2*35 (partial) + 4*0 (pending) = 180 + 70 = 250
    }];

    (mockPrisma.$queryRaw as any).mockResolvedValue(mockAggregates);

    const result = await service.getCoverageAnalytics(studyPlanId);

    // Assertions
    expect(mockPrisma.studyPlan.findUnique).toHaveBeenCalledWith({
      where: { id: studyPlanId },
    });

    expect(mockPrisma.$queryRaw).toHaveBeenCalled();

    expect(result.totalSessions).toBe(10);
    expect(result.completedSessions).toBe(3);
    expect(result.skippedSessions).toBe(1);
    expect(result.partialSessions).toBe(2);
    expect(result.pendingSessions).toBe(4);
    expect(result.totalPlannedMinutes).toBe(600);
    expect(result.totalCompletedMinutes).toBe(250);
    expect(result.completionPercentage).toBe(42);

    // Remaining workload: 600 - 250 = 350
    expect(result.remainingWorkloadMinutes).toBe(350);

    // Remaining capacity: 10 days * 4 hours * 60 = 2400 mins
    // 350 <= 2400 -> Not at risk
    expect(result.isAtRisk).toBe(false);
  });

  it('should handle zero sessions gracefully', async () => {
    const studyPlanId = 'plan-empty';
    const mockPlan = {
      id: studyPlanId,
      targetCompletionDate: new Date(),
      availableHoursPerDay: 4,
    };

    (mockPrisma.studyPlan.findUnique as any).mockResolvedValue(mockPlan);

    // If no sessions, SQL aggregate functions on empty set return NULL (except COUNT which returns 0).
    const mockAggregates = [{
      total_sessions: BigInt(0),
      total_planned_minutes: null,
      completed_sessions: null,
      skipped_sessions: null,
      partial_sessions: null,
      pending_sessions: null,
      total_completed_minutes: null,
    }];

    (mockPrisma.$queryRaw as any).mockResolvedValue(mockAggregates);

    const result = await service.getCoverageAnalytics(studyPlanId);

    expect(result.totalSessions).toBe(0);
    expect(result.totalPlannedMinutes).toBe(0);
    expect(result.totalCompletedMinutes).toBe(0);
    expect(result.completionPercentage).toBe(0);
    expect(result.completedSessions).toBe(0);
    expect(result.skippedSessions).toBe(0);
    expect(result.partialSessions).toBe(0);
    expect(result.pendingSessions).toBe(0);
  });

  it('should throw error if plan not found', async () => {
    (mockPrisma.studyPlan.findUnique as any).mockResolvedValue(null);

    await expect(service.getCoverageAnalytics('invalid-id')).rejects.toThrow('Study plan not found: invalid-id');

    expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
  });
});
