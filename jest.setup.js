import { jest } from '@jest/globals';
import { mockDeep } from 'jest-mock-extended';

const mockDb = mockDeep();

export const prisma = mockDb;

beforeEach(() => {
  jest.clearAllMocks();
});