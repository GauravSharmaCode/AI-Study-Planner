import { describe, it, beforeEach, afterEach, before } from 'mocha';
import { expect } from 'chai';
import { ScheduleService } from '../backend/services/schedule_service.js'; // Import class
import scheduleService from '../backend/services/schedule_service.js';      // Import singleton
import studyPlanService from '../backend/services/study_plan_service.js';
import { PrismaClient } from '@prisma/client';
import logger from '../backend/utils/logger.js';

const prisma = new PrismaClient();

// Test configuration
const TEST_CONFIG = {
    TIMEOUT: 30000, // Increased timeout
    TEST_USER: {
        email: () => `test${Date.now()}@example.com`,
        name: 'Test User'
    },
    TEST_PLAN: {
        exam: "GATE CSE",
        studyDuration: "3 months",
        dailyHours: 6,
        subjects: ["Data Structures", "Algorithms"],
        optionals: ["Computer Networks"],
        studyStyle: ["Practice-oriented"],
        studySessions: [
            {
                day: "1", // String format for day
                topics: ["Arrays", "Linked Lists"],
                completed: false,
                resources: [] // Empty resources to avoid FK issues
            }
        ]
    }
};

describe('Integrated Services Tests', function() {
    this.timeout(TEST_CONFIG.TIMEOUT);

    let testUser;
    let testStudyPlan;
    let testSchedule;

    const createTestUser = async () => {
        return await prisma.user.create({
            data: {
                email: TEST_CONFIG.TEST_USER.email(),
                name: TEST_CONFIG.TEST_USER.name
            }
        });
    };

    before(async function() {
        // Verify environment
        if (!process.env.GOOGLE_GENAI_API_KEY) {
            logger.error('Missing GOOGLE_GENAI_API_KEY');
            process.exit(1);
        }

        // Verify services
        try {
            await scheduleService.verifyAIServiceOrExit();
        } catch (error) {
            logger.error('Service verification failed:', error);
            process.exit(1);
        }
    });

    beforeEach(async function() {
        try {
            logger.info('Setting up test data...');
            
            // Create test user
            testUser = await createTestUser();
            logger.info(`Test user created: ${testUser.id}`);

            // Create study plan
            const planData = {
                ...TEST_CONFIG.TEST_PLAN,
                userId: testUser.id
            };

            testStudyPlan = await studyPlanService.createPlan(planData);
            logger.info(`Study plan created: ${testStudyPlan.id}`);

        } catch (error) {
            logger.error('Setup failed:', error);
            throw error;
        }
    });

    afterEach(async function() {
        try {
            logger.info('Cleaning up test data...');
            if (testSchedule?.id) {
                await scheduleService.deleteSchedule(testSchedule.id);
            }
            if (testStudyPlan?.id) {
                await studyPlanService.deletePlanById(testStudyPlan.id);
            }
            if (testUser?.id) {
                await prisma.user.delete({ where: { id: testUser.id } });
            }
            logger.info('Cleanup complete');
        } catch (error) {
            logger.error('Cleanup failed:', error);
        }
    });

    describe('Study Plan Integration', () => {
        it('should create plan with sessions and generate schedule', async () => {
            // Verify study plan creation
            expect(testStudyPlan).to.have.property('id');
            expect(testStudyPlan.studySessions).to.have.length(1);
            expect(testStudyPlan.studySessions[0].topics).to.deep.equal(["Arrays", "Linked Lists"]);

            // Generate schedule based on plan
            testSchedule = await scheduleService.generateDaySchedule(testStudyPlan, 1, 90);
            expect(testSchedule).to.have.property('id');
            expect(testSchedule.studyPlanId).to.equal(testStudyPlan.id);
        });

        it('should update plan and reflect in schedule', async () => {
            // Update study plan
            const updatedPlan = await studyPlanService.updatePlanById(testStudyPlan.id, {
                subjects: ["Updated DS", "Updated Algo"],
                dailyHours: 8
            });
            expect(updatedPlan.subjects).to.deep.equal(["Updated DS", "Updated Algo"]);

            // Generate new schedule
            testSchedule = await scheduleService.generateDaySchedule(updatedPlan, 1, 90);
            expect(testSchedule.metadata.dailyHours).to.equal(8);
        });
    });

    describe('Schedule Generation Based on Plan', () => {
        it('should generate schedule matching study plan parameters', async () => {
            testSchedule = await scheduleService.generateDaySchedule(testStudyPlan, 1, 90);
            
            expect(testSchedule.sessions.set).to.be.an('array');
            expect(testSchedule.dailySchedule).to.have.property('focus');
            expect(testSchedule.metadata.totalDays).to.equal(90);
        });

        it('should generate valid session data', async () => {
            testSchedule = await scheduleService.generateDaySchedule(testStudyPlan, 1, 90);
            
            expect(testSchedule).to.have.property('sessions');
            expect(testSchedule.sessions).to.be.an('object');
            expect(testSchedule.sessions.set).to.be.an('array');
        });

        it('should handle plan updates and regenerate schedule', async () => {
            // First schedule
            testSchedule = await scheduleService.generateDaySchedule(testStudyPlan, 1, 90);
            const firstFocus = testSchedule.focus;

            // Update plan
            await studyPlanService.updatePlanById(testStudyPlan.id, {
                subjects: ["New Subject"]
            });

            // Regenerate schedule
            const newSchedule = await scheduleService.generateDaySchedule(testStudyPlan, 1, 90);
            expect(newSchedule.focus).to.not.equal(firstFocus);
        });

        it('should handle plan updates and regenerate schedule', async () => {
            // First schedule
            testSchedule = await scheduleService.generateDaySchedule(testStudyPlan, 1, 90);
            
            // Update plan without resources
            const updatedPlan = await studyPlanService.updatePlanById(testStudyPlan.id, {
                subjects: ["New Subject"],
                studySessions: [{
                    day: "1",
                    topics: ["New Topic"],
                    completed: false,
                    resources: []
                }]
            });

            const newSchedule = await scheduleService.generateDaySchedule(updatedPlan, 1, 90);
            expect(newSchedule.studyPlanId).to.equal(updatedPlan.id);
        });
    });

    describe('Error Handling and Edge Cases', () => {
        it('should handle invalid study plan for schedule generation', async () => {
            try {
                await scheduleService.generateDaySchedule({ id: 999999 }, 1, 90);
                throw new Error('Should have failed');
            } catch (error) {
                expect(error.message).to.include('error');
            }
        });

        it('should handle concurrent updates', async () => {
            const updatePromises = [
                studyPlanService.updatePlanById(testStudyPlan.id, { dailyHours: 7 }),
                studyPlanService.updatePlanById(testStudyPlan.id, { dailyHours: 8 })
            ];

            await Promise.all(updatePromises).catch(error => {
                expect(error.message).to.include('error');
            });
        });
    });
});

describe('Study Plan Service Tests', function() {
    this.timeout(TEST_CONFIG.TIMEOUT);

    let testUser;
    let testStudyPlan;

    beforeEach(async function() {
        try {
            logger.info('Setting up test data...');
            
            // Create test user
            testUser = await prisma.user.create({
                data: {
                    email: TEST_CONFIG.TEST_USER.email(),
                    name: TEST_CONFIG.TEST_USER.name
                }
            });
            logger.info(`Test user created: ${testUser.id}`);

            // Create study plan with valid user ID
            const planData = {
                ...TEST_CONFIG.TEST_PLAN,
                userId: testUser.id
            };

            testStudyPlan = await studyPlanService.createPlan(planData);
            logger.info(`Study plan created: ${testStudyPlan.id}`);
        } catch (error) {
            logger.error('Setup failed:', error);
            throw error;
        }
    });

    afterEach(async function() {
        try {
            await cleanup();
        } catch (error) {
            logger.error('Cleanup failed:', error);
        }
    });

    // Add your test cases here
    describe('CRUD Operations', () => {
        it('should create a study plan with sessions', async () => {
            expect(testStudyPlan).to.have.property('id');
            expect(testStudyPlan.userId).to.equal(testUser.id);
            expect(testStudyPlan.studySessions).to.have.length(1);
        });

        it('should update a study plan', async () => {
            const updates = {
                dailyHours: 8,
                subjects: ["Updated Subject"]
            };
            
            const updatedPlan = await studyPlanService.updatePlanById(testStudyPlan.id, updates);
            expect(updatedPlan.dailyHours).to.equal(updates.dailyHours);
            expect(updatedPlan.subjects).to.deep.equal(updates.subjects);
        });

        it('should delete a study plan', async () => {
            await studyPlanService.deletePlanById(testStudyPlan.id);
            
            try {
                await studyPlanService.getPlanById(testStudyPlan.id);
                throw new Error('Plan should have been deleted');
            } catch (error) {
                expect(error.message).to.include('not found');
            }
        });
    });
});

describe('Schedule Service Tests', function() {
    this.timeout(TEST_CONFIG.TIMEOUT);

    let testUser;
    let testStudyPlan;
    let testSchedule;

    beforeEach(async function() {
        try {
            // Create test user
            testUser = await prisma.user.create({
                data: {
                    email: TEST_CONFIG.TEST_USER.email(),
                    name: TEST_CONFIG.TEST_USER.name
                }
            });

            // Create study plan
            const planData = {
                ...TEST_CONFIG.TEST_PLAN,
                userId: testUser.id
            };

            testStudyPlan = await studyPlanService.createPlan(planData);
        } catch (error) {
            logger.error('Setup failed:', error);
            throw error;
        }
    });

    describe('Daily Schedule Generation', () => {
        it('should generate valid session data', async () => {
            testSchedule = await scheduleService.generateDaySchedule(testStudyPlan, 1, 90);
            
            expect(testSchedule).to.have.property('type').equal('DAILY');
            expect(testSchedule.sessions).to.be.an('object');
            expect(testSchedule.sessions.set).to.be.an('array');
            expect(testSchedule.breaks).to.be.an('array');
            expect(testSchedule.dailyTargets).to.be.an('array');
        });

        it('should handle errors gracefully', async () => {
            try {
                await scheduleService.generateDaySchedule(null, 1, 90);
                throw new Error('Should have failed');
            } catch (error) {
                expect(error.message).to.include('Failed to generate schedule');
            }
        });
    });
});

// Add utility function for cleanup
async function cleanup() {
    try {
        await prisma.$transaction([
            prisma.resource.deleteMany(),
            prisma.studySession.deleteMany(),
            prisma.schedule.deleteMany(),
            prisma.studyPlan.deleteMany(),
            prisma.user.deleteMany()
        ]);
    } catch (error) {
        logger.error('Cleanup error:', error);
    } finally {
        await prisma.$disconnect();
    }
}