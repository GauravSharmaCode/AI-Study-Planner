import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import scheduleService from '../backend/services/schedule_service.js';
import studyPlanService from '../backend/services/study_plan_service.js';
import { PrismaClient } from '@prisma/client';
import logger from '../backend/utils/logger.js';
import { ScheduleService } from '../backend/services/schedule_service.js';

const prisma = new PrismaClient();

// Commenting out Study Plan Service Tests
/*
describe('Study Plan Service Tests', function() {
    this.timeout(10000);

    let testStudyPlan;

    const EXISTING_USER_ID = '1';

    const testPlanData = {
        userId: EXISTING_USER_ID,
        exam: "GATE CSE",
        studyDuration: "3 months",
        dailyHours: 6,
        subjects: ["Data Structures", "Algorithms", "Operating Systems"],
        optionals: ["Computer Networks"],
        studyStyle: ["Practice-oriented", "Visual Learning"]
    };

    beforeEach(async function() {
        this.timeout(15000);

        try {
            logger.info('Setting up test data...');
            testStudyPlan = await studyPlanService.createPlan(testPlanData);
            logger.info(`Test study plan created: ${testStudyPlan.id}`);
        } catch (error) {
            logger.error('Setup failed:', error);
            throw error;
        }
    });

    afterEach(async function() {
        this.timeout(15000);

        try {
            logger.info('Cleaning up test data...');
            if (testStudyPlan?.id) {
                await studyPlanService.deletePlanById(testStudyPlan.id);
            }
            logger.info('Cleanup complete');
        } catch (error) {
            logger.error('Cleanup failed:', error);
        }
    });

    describe('Study Plan Creation', () => {
        it('should create a new study plan', async () => {
            const newPlan = await studyPlanService.createPlan(testPlanData);

            expect(newPlan).to.have.property('id');
            expect(newPlan.userId).to.equal(EXISTING_USER_ID);
            expect(newPlan.exam).to.equal(testPlanData.exam);
            expect(newPlan.subjects).to.deep.equal(testPlanData.subjects);

            // Cleanup
            await studyPlanService.deletePlanById(newPlan.id);
        });

        it('should throw an error for invalid data', async () => {
            try {
                await studyPlanService.createPlan({});
                throw new Error('Plan creation should have failed');
            } catch (error) {
                expect(error.message).to.include('Validation error');
            }
        });
    });

    describe('Study Plan Retrieval', () => {
        it('should fetch a study plan by ID', async () => {
            const fetchedPlan = await studyPlanService.getPlanById(testStudyPlan.id);
            expect(fetchedPlan.id).to.equal(testStudyPlan.id);
            expect(fetchedPlan.userId).to.equal(EXISTING_USER_ID);
        });

        it('should fetch all study plans for a user', async () => {
            const plans = await studyPlanService.getPlansByUserId(EXISTING_USER_ID);
            expect(plans).to.be.an('array');
            expect(plans.length).to.be.greaterThan(0);
        });

        it('should return null for a non-existent plan ID', async () => {
            const fetchedPlan = await studyPlanService.getPlanById(99999);
            expect(fetchedPlan).to.be.null;
        });
    });

    describe('Study Plan Update', () => {
        it('should update an existing study plan', async () => {
            const updatedData = {
                exam: "Updated Exam",
                dailyHours: 8,
                subjects: ["Updated Subject 1", "Updated Subject 2"]
            };

            const updatedPlan = await studyPlanService.updatePlan(testStudyPlan.id, updatedData);

            expect(updatedPlan.exam).to.equal(updatedData.exam);
            expect(updatedPlan.dailyHours).to.equal(updatedData.dailyHours);
            expect(updatedPlan.subjects).to.deep.equal(updatedData.subjects);
        });

        it('should throw an error for updating a non-existent plan', async () => {
            try {
                await studyPlanService.updatePlan(99999, { exam: "Non-existent Exam" });
                throw new Error('Update should have failed');
            } catch (error) {
                expect(error.message).to.include('Record to update does not exist');
            }
        });
    });

    describe('Study Plan Deletion', () => {
        it('should delete an existing study plan', async () => {
            const newPlan = await studyPlanService.createPlan(testPlanData);

            // Delete the plan
            await studyPlanService.deletePlanById(newPlan.id);

            // Verify deletion
            const fetchedPlan = await studyPlanService.getPlanById(newPlan.id);
            expect(fetchedPlan).to.be.null;
        });

        it('should throw an error for deleting a non-existent plan', async () => {
            try {
                await studyPlanService.deletePlanById(99999);
                throw new Error('Deletion should have failed');
            } catch (error) {
                expect(error.message).to.include('Record to delete does not exist');
            }
        });
    });

    describe('Validation and Edge Cases', () => {
        it('should handle empty subjects array gracefully', async () => {
            const planData = { ...testPlanData, subjects: [] };
            const newPlan = await studyPlanService.createPlan(planData);

            expect(newPlan.subjects).to.be.an('array').that.is.empty;

            // Cleanup
            await studyPlanService.deletePlanById(newPlan.id);
        });

        it('should handle null optional subjects gracefully', async () => {
            const planData = { ...testPlanData, optionals: null };
            const newPlan = await studyPlanService.createPlan(planData);

            expect(newPlan.optionals).to.be.null;

            // Cleanup
            await studyPlanService.deletePlanById(newPlan.id);
        });

        it('should throw an error for invalid user ID', async () => {
            try {
                const invalidData = { ...testPlanData, userId: null };
                await studyPlanService.createPlan(invalidData);
                throw new Error('Plan creation should have failed');
            } catch (error) {
                expect(error.message).to.include('Validation error');
            }
        });
    });
});
*/

// Add cleanup function at the top
async function cleanup() {
    try {
        await prisma.$transaction([
            prisma.schedule.deleteMany(),
            prisma.studySession.deleteMany(),
            prisma.studyPlan.deleteMany(),
            prisma.user.deleteMany()
        ]);
    } catch (error) {
        logger.error('Cleanup error:', error);
    }
}

describe('Schedule Service Tests', function() {
    this.timeout(30000);
    let testUser;
    let testPlan;
    let testSchedule;

    beforeEach(async function() {
        try {
            testUser = await prisma.user.create({
                data: {
                    email: `test${Date.now()}@example.com`,
                    name: 'Test User'
                }
            });

            testPlan = await prisma.studyPlan.create({
                data: {
                    userId: testUser.id,
                    exam: "GATE CSE",
                    studyDuration: "3 months",
                    dailyHours: 6,
                    subjects: ["Data Structures"],
                    optionals: [],
                    studyStyle: ["Practice"]
                }
            });
        } catch (error) {
            logger.error('Setup failed:', error);
            throw error;
        }
    });

    afterEach(async function() {
        await cleanup();
    });

    describe('Daily Schedule Generation', () => {
        it('should generate valid session data', async () => {
            const testPlan = await prisma.studyPlan.create({
                data: {
                    userId: testUser.id,
                    exam: "GATE CSE",
                    studyDuration: "3 months",
                    dailyHours: 6,
                    subjects: ["Data Structures"],
                    optionals: [],
                    studyStyle: ["Practice"]
                }
            });

            const schedule = await scheduleService.generateDaySchedule(testPlan, 1, 90);
            
            // Validate schedule structure
            expect(schedule).to.exist;
            expect(schedule.type).to.equal('DAILY');
            expect(schedule.studyPlanId).to.equal(testPlan.id);
            expect(schedule.userId).to.equal(testPlan.userId);
            expect(schedule.dayNumber).to.equal(1);
            
            // Validate content structure
            expect(schedule.sessions).to.be.an('object');
            expect(schedule.sessions.set).to.be.an('array');
            expect(schedule.sessions.set[0]).to.have.all.keys(['time', 'subject', 'topics', 'type']);
            
            // Validate breaks
            expect(schedule.breaks).to.be.an('array');
            expect(schedule.breaks[0]).to.have.all.keys(['time', 'duration']);
            
            // Validate metadata
            expect(schedule.metadata).to.be.an('object');
            expect(schedule.metadata).to.have.all.keys([
                'currentDay',
                'totalDays',
                'progress',
                'dailyHours',
                'status'
            ]);
        });
    });
});

describe('Schedule Service Tests', () => {
    let scheduleService;
    
    before(async () => {
        scheduleService = new ScheduleService();
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for initialization
    });

    describe('Daily Schedule Generation', () => {
        it('should generate valid session data', async () => {
            const studyPlan = {
                id: 1,
                userId: 1,
                exam: 'Test Exam',
                subjects: ['Math', 'Science'],
                dailyHours: 6,
                preferences: {
                    startTime: '09:00'
                }
            };

            const schedule = await scheduleService.generateDaySchedule(studyPlan, 1, 30);
            
            // Verify schedule structure
            expect(schedule).to.have.property('sessions');
            expect(schedule.sessions).to.have.property('set');
            expect(schedule.sessions.set).to.be.an('array');

            // Verify first session has all required properties
            const session = schedule.sessions.set[0];
            expect(session).to.include.all.keys([
                'time',
                'subject',
                'topics',
                'type',
                'duration',
                'recommendedPace'
            ]);

            // Verify data types
            expect(session.time).to.be.a('string');
            expect(session.subject).to.be.oneOf(studyPlan.subjects);
            expect(session.topics).to.be.an('array');
            expect(session.type).to.equal('STUDY');
            expect(session.duration).to.match(/^\d+min$/);
            expect(session.recommendedPace).to.be.a('string');
        });
    });
});

describe('AI Service Tests', () => {
    it('should handle API errors gracefully', async () => {
        const service = new ScheduleService();
        service.ai = null; // Force API error
        
        const result = await service.generateDailyTargets({
            subjects: ['Math'],
            exam: 'Test'
        }, 1);
        
        expect(result).to.deep.equal(['Study Math concepts']);
    });

    it('should throw error when AI service fails', async () => {
        const service = new ScheduleService();
        service.ai = null; // Force AI service failure

        try {
            await service.generateDailyTargets({
                subjects: ['Math'],
                exam: 'Test'
            }, 1);
            // If we reach here, test should fail
            expect.fail('Should have thrown error');
        } catch (error) {
            expect(error).to.exist;
            expect(error.message).to.include('AI service not initialized');
        }
    });
});