import { jest } from '@jest/globals';
import { prisma } from '../../../jest.setup.js';
import {prisma} from '../../../jes'
import studyPlanService from '../study_plan_service.js';

describe('Study Plan Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a study plan', async () => {
    const mockInput = {
      userId: '123',
      exam: 'Test Exam'
    };

    const expectedResult = {
      id: '1',
      userId: '123',
      exam: 'Test Exam',
      studyDuration: '6 months',
      dailyHours: 6,
      subjects: ['Math'],
      optionals: ['Physics'],
      studyStyle: ['Videos'],
      numberOfAttempts: 1,
      studySessions: []
    };

    prisma.studyPlan.create.mockResolvedValue(expectedResult);
    const result = await studyPlanService.createPlan(mockInput);
    expect(result).toEqual(expectedResult);
    expect(prisma.studyPlan.create).toHaveBeenCalled();
  });
});