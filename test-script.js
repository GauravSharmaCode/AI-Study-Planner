import { PrismaClient } from '@prisma/client';
import studyPlanService from './backend/services/study_plan_service.js';
import scheduleService from './backend/services/schedule_service.js';
import logger from './backend/utils/logger.js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load both .env files
const rootEnvPath = join(__dirname, '.env');
const backendEnvPath = join(__dirname, 'backend', '.env');

console.log('Environment Setup:');
console.log('Root .env exists:', fs.existsSync(rootEnvPath));
console.log('Backend .env exists:', fs.existsSync(backendEnvPath));

// Load both .env files in correct order
dotenv.config({ path: rootEnvPath });
dotenv.config({ path: backendEnvPath });

const prisma = new PrismaClient();

// Verify environment variables
console.log('\nEnvironment Check:');
console.log('API Key available:', !!process.env.GOOGLE_GENAI_API_KEY);
console.log('Database URL available:', !!process.env.DATABASE_URL);

// Test data
const testPlan = {
    "id": "test-plan-1",
    "userId": "1",
    "exam": "UPSC Civil Services",
    "studyDuration": "2 weeks",
    "dailyHours": 8,
    "subjects": [
        "History",
        "Geography",
        "Polity",
        "Economics"
    ],
    "optionals": ["Sociology"],
    "studyStyle": [
        "Focused Study",
        "Regular Revision",
        "Practice Tests"
    ]
};

// Add new test plan for GATE CSE
const gateTestPlan = {
    "id": "test-plan-2",
    "userId": "2",
    "exam": "GATE Computer Science",
    "studyDuration": "4 months",
    "dailyHours": 6,
    "subjects": [
        "Data Structures & Algorithms",
        "Operating Systems",
        "Database Management Systems",
        "Computer Networks",
        "Theory of Computation",
        "Programming & System Design"
    ],
    "optionals": [],
    "studyStyle": [
        "Problem Solving",
        "Concept Building",
        "Previous Year Questions",
        "Mock Tests"
    ]
};

const testStudyPlan = {
    userId: "test-user-1",
    exam: "GATE CSE",
    studyDuration: "3 months",
    dailyHours: 6,
    subjects: ["Data Structures", "Algorithms", "Operating Systems"],
    optionals: ["Computer Networks"],
    studyStyle: ["Practice-oriented", "Visual Learning"],
    numberOfAttempts: 1
    // Remove studySessions for initial test
};

// Add test user data
const testUser = {
    email: "test@example.com",
    name: "Test User"
};

// Add user creation function
async function createTestUser() {
    try {
        const user = await prisma.user.create({
            data: testUser
        });
        logger.info(`Test user created with id: ${user.id}`);
        return user;
    } catch (error) {
        if (error.code === 'P2002') {
            // If user already exists, fetch it
            return await prisma.user.findUnique({
                where: { email: testUser.email }
            });
        }
        throw error;
    }
}

async function testWeeklySchedule() {
    console.log('\n🗓️ Testing Weekly Schedule Generation...');
    
    try {
        console.log('📋 Using test plan with duration:', testPlan.studyDuration);
        
        // Test weekly schedule generation
        const weekNumber = 1;
        const totalWeeks = 2;
        const weeklySchedule = await scheduleService.generateWeekSchedule(testPlan, weekNumber, totalWeeks);
        
        console.log('\n✅ Weekly Schedule Generated Successfully:');
        console.log(JSON.stringify(weeklySchedule, null, 2));
        validateWeeklySchedule(weeklySchedule);

    } catch (error) {
        console.error('❌ Weekly Schedule Generation Failed:', error.message);
        console.error('\nStack trace:', error.stack);
    }
}

function validateScheduleMetadata(metadata, type = 'week') {
    const validationResults = {
        hasCurrentPosition: type === 'week' ? !!metadata.currentWeek : !!metadata.currentDay,
        hasTotal: type === 'week' ? !!metadata.totalWeeks : !!metadata.totalDays,
        hasProgress: typeof metadata.progress === 'string',
        hasNavigation: !!(metadata.nextWeek || metadata.nextDay || metadata.previousWeek || metadata.previousDay)
    };

    if (type === 'week') {
        validationResults.hasDateRange = !!(metadata.startDate && metadata.endDate);
    }

    console.log(`\n🔍 Validating ${type} Metadata:`);
    Object.entries(validationResults).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
    });

    return Object.values(validationResults).every(v => v === true);
}

async function testDailySchedule() {
    console.log('\n📅 Testing Daily Schedule Generation...');
    
    try {
        console.log('📋 Generating daily schedule for:', testPlan.exam);
        const { metadata, schedule } = await scheduleService.generateDaySchedule(testPlan, 1, 14);
        
        console.log('\n📊 Schedule Metadata:');
        console.log(JSON.stringify(metadata, null, 2));
        
        validateScheduleMetadata(metadata, 'day');
        validateDailySchedule(schedule);

    } catch (error) {
        console.error('❌ Daily Schedule Generation Failed:', error.message);
        console.error('\nStack trace:', error.stack);
    }
}

function validateDailyProgression(schedules) {
    console.log('\n🔍 Validating Daily Progression:');
    const validationResults = {
        hasUniqueTopics: validateUniqueTopics(schedules),
        hasLogicalProgression: validateTopicProgression(schedules),
        hasVariedSubjects: validateSubjectDistribution(schedules)
    };

    logValidationResults('Daily Progression', validationResults);
}

function validateUniqueTopics(schedules) {
    const allTopics = new Set();
    let hasOverlap = false;

    schedules.forEach(schedule => {
        schedule.sessions.forEach(session => {
            session.topics.forEach(topic => {
                if (allTopics.has(topic)) {
                    hasOverlap = true;
                }
                allTopics.add(topic);
            });
        });
    });

    return !hasOverlap;
}

function validateTopicProgression(schedules) {
    // Check if topics follow a logical sequence
    return schedules.every((schedule, index) => {
        if (index === 0) return true;
        const prevDay = schedules[index - 1];
        const currentDay = schedule;

        // Check if current day's topics build upon previous day's topics
        return currentDay.sessions.some(session =>
            session.topics.some(topic =>
                topic.toLowerCase().includes('advanced') ||
                topic.toLowerCase().includes('continuation') ||
                topic.toLowerCase().includes('part') ||
                topic.toLowerCase().includes('next')
            )
        );
    });
}

function validateSubjectDistribution(schedules) {
    const subjectCounts = new Map();
    schedules.forEach(schedule => {
        schedule.sessions.forEach(session => {
            const count = subjectCounts.get(session.subject) || 0;
            subjectCounts.set(session.subject, count + 1);
        });
    });

    // Check if subjects are distributed evenly
    const counts = Array.from(subjectCounts.values());
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);

    return (maxCount - minCount) <= 2; // Allow small variation in distribution
}

async function testCompleteSchedule() {
    console.log('\n📚 Testing Complete Schedule Generation...');
    try {
        const completeSchedule = await scheduleService.generateSchedule(testPlan);
        console.log('\n✅ Complete Schedule Generated Successfully');
        console.log('📊 Schedule Overview:');
        console.log(`Total Weeks: ${Object.keys(completeSchedule.weeklySchedule).length}`);
        console.log(`Monthly Targets: ${completeSchedule.monthlyTargets.length}`);
        console.log(`Evaluation Milestones: ${completeSchedule.evaluationMilestones.length}`);
        validateCompleteSchedule(completeSchedule);
    } catch (error) {
        console.error('❌ Complete Schedule Generation Failed:', error.message);
        console.error('\nStack trace:', error.stack);
    }
}

function validateWeeklySchedule(schedule) {
    const validationResults = {
        hasFocus: typeof schedule.focus === 'string',
        hasWeeklyTargets: Array.isArray(schedule.weeklyTargets),
        hasWeeklyTests: Array.isArray(schedule.weeklyTests),
        hasAllDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
            .every(day => schedule[day] && 
                Array.isArray(schedule[day].subjects) && 
                Array.isArray(schedule[day].topics) && 
                Array.isArray(schedule[day].resources))
    };

    logValidationResults('Weekly Schedule', validationResults);
}

function validateDailySchedule(schedule) {
    const validationResults = {
        hasDayNumber: typeof schedule.dayNumber === 'number',
        hasFocus: typeof schedule.focus === 'string',
        hasSessions: Array.isArray(schedule.sessions) && schedule.sessions.length > 0,
        hasBreaks: Array.isArray(schedule.breaks) && schedule.breaks.length > 0,
        hasTargets: Array.isArray(schedule.dailyTargets) && schedule.dailyTargets.length > 0,
        hasRevision: schedule.revision && typeof schedule.revision.time === 'string'
    };

    logValidationResults('Daily Schedule', validationResults);
}

function validateCompleteSchedule(schedule) {
    const validationResults = {
        hasWeeklySchedule: !!schedule.weeklySchedule,
        hasMonthlyTargets: Array.isArray(schedule.monthlyTargets),
        hasEvaluationMilestones: Array.isArray(schedule.evaluationMilestones),
        hasAllWeeks: Object.keys(schedule.weeklySchedule).length > 0
    };

    logValidationResults('Complete Schedule', validationResults);
}

function logValidationResults(title, results) {
    console.log(`\n🔍 Validating ${title}:`);
    Object.entries(results).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
    });
}

async function testGATEScheduleGeneration() {
    console.log('\n🎯 Testing GATE Schedule Generation...');
    
    try {
        // Test Weekly Schedule
        console.log('\n📚 Testing Weekly Schedule for GATE:');
        const weekSchedule = await scheduleService.generateWeekSchedule(gateTestPlan, 1, 16);
        
        // Validate technical content
        validateTechnicalContent(weekSchedule.schedule, 'GATE');
        console.log('\n🔍 Checking GATE-specific elements:');
        const gateValidation = {
            hasProgrammingTasks: checkForProgrammingContent(weekSchedule.schedule),
            hasProblemSolving: checkForProblemSolving(weekSchedule.schedule),
            hasTheoryRevision: checkForTheoryContent(weekSchedule.schedule)
        };
        logValidationResults('GATE Schedule', gateValidation);

        // Test Daily Schedule
        console.log('\n📅 Testing Daily Schedule for GATE:');
        const daySchedule = await scheduleService.generateDaySchedule(gateTestPlan, 1, 120);
        console.log('\n✅ Daily Schedule Sample:');
        console.log(JSON.stringify(daySchedule, null, 2));
        validateDailySchedule(daySchedule.schedule);

    } catch (error) {
        console.error('❌ GATE Schedule Generation Failed:', error.message);
        console.error('\nStack trace:', error.stack);
    }
}

function validateTechnicalContent(schedule, examType) {
    console.log(`\n🔍 Validating ${examType} Technical Content:`);
    const validationResults = {
        hasSubjectBalance: checkSubjectDistribution(schedule),
        hasProperProgression: checkTopicProgression(schedule),
        hasExamSpecificFormat: checkExamFormat(schedule, examType)
    };

    logValidationResults('Technical Content', validationResults);
}

function checkForProgrammingContent(schedule) {
    return schedule.weeklyTargets.some(target => 
        target.toLowerCase().includes('coding') ||
        target.toLowerCase().includes('programming') ||
        target.toLowerCase().includes('implementation')
    );
}

function checkForProblemSolving(schedule) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.some(day => 
        schedule[day]?.topics.some(topic =>
            topic.toLowerCase().includes('problem') ||
            topic.toLowerCase().includes('exercise') ||
            topic.toLowerCase().includes('practice')
        )
    );
}

function checkForTheoryContent(schedule) {
    const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    return days.some(day => 
        schedule[day]?.topics.some(topic =>
            topic.toLowerCase().includes('concept') ||
            topic.toLowerCase().includes('theory') ||
            topic.toLowerCase().includes('fundamentals')
        )
    );
}

async function testStudyPlanCRUD() {
    console.log('\n🔍 Testing Study Plan Service CRUD Operations...');
    let createdPlanId;
    let testUserId;

    try {
        // Create test user first
        const user = await createTestUser();
        testUserId = user.id;
        console.log('✅ Test user ready:', testUserId);

        // Update test plan with valid user ID
        const planData = {
            ...testStudyPlan,
            userId: testUserId
        };

        // Test Create Plan
        console.log('\n📝 Testing Plan Creation:');
        const createdPlan = await studyPlanService.createPlan(planData);
        createdPlanId = createdPlan.id;
        console.log('✅ Plan Created:', createdPlan.id);
        validatePlan(createdPlan, planData);

        // Test Get By Id
        console.log('\n📖 Testing Get Plan By ID:');
        const fetchedPlan = await studyPlanService.getPlanById(createdPlanId);
        console.log('✅ Plan Retrieved');
        validatePlan(fetchedPlan, planData);

        // Test Update
        console.log('\n📝 Testing Plan Update:');
        const updatedData = {
            ...planData,
            dailyHours: 8,
            subjects: [...planData.subjects, "Computer Architecture"]
        };
        const updatedPlan = await studyPlanService.updatePlanById(createdPlanId, updatedData);
        console.log('✅ Plan Updated');
        validatePlan(updatedPlan, updatedData);

        // Test Get All
        console.log('\n📚 Testing Get All Plans:');
        const allPlans = await studyPlanService.getAllPlans();
        console.log(`✅ Retrieved ${allPlans.length} plans`);
        validatePlansList(allPlans);

        // Test Delete
        console.log('\n🗑️ Testing Plan Deletion:');
        await studyPlanService.deletePlanById(createdPlanId);
        console.log('✅ Plan Deleted');

        // Verify Deletion
        try {
            await studyPlanService.getPlanById(createdPlanId);
            console.log('❌ Plan still exists after deletion');
        } catch (error) {
            console.log('✅ Plan successfully deleted');
        }
    } catch (error) {
        console.error('❌ Study Plan CRUD Test Failed:', error.message);
        console.error('\nStack trace:', error.stack);
    } finally {
        // Clean up
        if (createdPlanId) {
            try {
                await studyPlanService.deletePlanById(createdPlanId);
            } catch (error) {
                console.error('Failed to clean up study plan:', error.message);
            }
        }
        if (testUserId) {
            try {
                await prisma.user.delete({ where: { id: testUserId } });
            } catch (error) {
                console.error('Failed to clean up test user:', error.message);
            }
        }
    }
}

function validatePlan(plan, expectedData) {
    const validationResults = {
        hasId: !!plan.id,
        matchesExam: plan.exam === expectedData.exam,
        matchesDuration: plan.studyDuration === expectedData.studyDuration,
        hasSubjects: JSON.stringify(plan.subjects) === JSON.stringify(expectedData.subjects),
        hasOptionals: Array.isArray(plan.optionals),
        hasStudyStyle: Array.isArray(plan.studyStyle)
    };

    console.log('\n🔍 Plan Validation Results:');
    Object.entries(validationResults).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
    });
}

function validatePlansList(plans) {
    const validationResults = {
        isArray: Array.isArray(plans),
        hasItems: plans.length > 0,
        hasValidStructure: plans.every(plan => 
            plan.id && 
            plan.exam && 
            plan.studyDuration && 
            Array.isArray(plan.subjects)
        )
    };

    console.log('\n🔍 Plans List Validation:');
    Object.entries(validationResults).forEach(([key, value]) => {
        console.log(`${value ? '✅' : '❌'} ${key}: ${value}`);
    });
}

// Update runTests function with proper error handling
async function runTests() {
    try {
        console.log('\n🚀 Starting Tests...');
        await testStudyPlanCRUD();
        console.log('\n✅ All tests completed successfully');
    } catch (error) {
        console.error('❌ Tests Failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

// Start tests
runTests();