"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ai_api_client_1 = require("./ai-api-client");
const logger_1 = __importDefault(require("../utils/logger"));
class StudyPlanService {
    /**
     * Initializes the studyPlanService with a new PrismaClient and logger.
     * @constructor
     */
    constructor() {
        this.prisma = new client_1.PrismaClient();
        this.logger = logger_1.default;
        this.aiClient = new ai_api_client_1.AIAPIClient(process.env.GOOGLE_GENAI_API_KEY || '');
    }
    /**
     * Create a new study plan with AI-generated content
     */
    async createPlan(data) {
        try {
            // Validate input
            this.validateCreatePlanInput(data);
            // Generate AI plan
            const aiGeneratedPlan = await this.generateStudyPlanContent(data);
            // Save to database
            const studyPlan = await this.prisma.studyPlan.create({
                data: {
                    userId: data.userId,
                    subjects: data.subjects,
                    availableHoursPerDay: data.availableHoursPerDay,
                    targetCompletionDate: new Date(data.targetCompletionDate),
                    plan: aiGeneratedPlan
                }
            });
            // Create individual sessions for easy updates
            await this.createSessionsFromPlan(studyPlan.id, aiGeneratedPlan);
            return {
                planId: studyPlan.id,
                plan: aiGeneratedPlan
            };
        }
        catch (error) {
            this.logger.error('Error creating study plan:', error);
            throw new Error(`Failed to create study plan: ${error.message}`);
        }
    }
    /**
     * Get a study plan by ID
     */
    async getPlanById(id) {
        try {
            const studyPlan = await this.prisma.studyPlan.findUnique({
                where: { id },
                include: { sessions: true }
            });
            if (!studyPlan) {
                return null;
            }
            return {
                planId: studyPlan.id,
                plan: studyPlan.plan
            };
        }
        catch (error) {
            this.logger.error('Error fetching study plan:', error);
            throw new Error(`Failed to fetch study plan: ${error.message}`);
        }
    }
    /**
     * Get all plans for a user
     */
    async getAllPlans(userId) {
        try {
            const plans = await this.prisma.studyPlan.findMany({
                where: { userId },
                include: { sessions: true },
                orderBy: { createdAt: 'desc' }
            });
            return plans;
        }
        catch (error) {
            this.logger.error('Error fetching user plans:', error);
            throw new Error(`Failed to fetch plans: ${error.message}`);
        }
    }
    /**
     * Update a study plan by ID
     */
    async updatePlanById(id, updateData) {
        try {
            const studyPlan = await this.prisma.studyPlan.update({
                where: { id },
                data: {
                    ...updateData,
                    targetCompletionDate: updateData.targetCompletionDate ? new Date(updateData.targetCompletionDate) : undefined,
                    updatedAt: new Date()
                }
            });
            return studyPlan;
        }
        catch (error) {
            this.logger.error('Error updating study plan:', error);
            throw new Error(`Failed to update study plan: ${error.message}`);
        }
    }
    /**
     * Delete a study plan by ID
     */
    async deletePlanById(id) {
        try {
            // Delete associated sessions first
            await this.prisma.studySession.deleteMany({
                where: { studyPlanId: id }
            });
            // Delete the study plan
            await this.prisma.studyPlan.delete({
                where: { id }
            });
            return true;
        }
        catch (error) {
            this.logger.error('Error deleting study plan:', error);
            throw new Error(`Failed to delete study plan: ${error.message}`);
        }
    }
    /**
     * Update session status
     */
    async updateSessionStatus(sessionId, status) {
        if (!['pending', 'completed', 'skipped'].includes(status)) {
            throw new Error('Invalid status. Must be: pending, completed, or skipped');
        }
        try {
            await this.prisma.studySession.update({
                where: { id: sessionId },
                data: { status }
            });
        }
        catch (error) {
            this.logger.error('Error updating session status:', error);
            throw new Error(`Failed to update session: ${error.message}`);
        }
    }
    /**
     * Update session remarks
     */
    async updateSessionRemarks(sessionId, remarks) {
        try {
            await this.prisma.studySession.update({
                where: { id: sessionId },
                data: { remarks }
            });
        }
        catch (error) {
            this.logger.error('Error updating session remarks:', error);
            throw new Error(`Failed to update remarks: ${error.message}`);
        }
    }
    /**
     * Private method to validate input data
     */
    validateCreatePlanInput(data) {
        if (!data.subjects || !Array.isArray(data.subjects) || data.subjects.length === 0) {
            throw new Error('Subjects are required and must be a non-empty array');
        }
        if (!data.availableHoursPerDay || data.availableHoursPerDay <= 0) {
            throw new Error('Available hours per day must be greater than 0');
        }
        if (!data.targetCompletionDate) {
            throw new Error('Target completion date is required');
        }
        if (!data.userId) {
            throw new Error('User ID is required');
        }
        // Validate date format
        const targetDate = new Date(data.targetCompletionDate);
        if (isNaN(targetDate.getTime())) {
            throw new Error('Invalid target completion date format');
        }
        // Ensure target date is in the future
        if (targetDate <= new Date()) {
            throw new Error('Target completion date must be in the future');
        }
    }
    /**
     * Private method to generate study plan content using AI
     */
    async generateStudyPlanContent(data) {
        const prompt = `Generate a study plan for the following:
    Subjects: ${data.subjects.join(', ')}
    Available hours per day: ${data.availableHoursPerDay}
    Target completion date: ${data.targetCompletionDate}
    
    Return a JSON object with dates as keys and arrays of study sessions as values.
    Each session should have: topic, start_time, end_time, status (default "pending").
    Format: {"2025-08-12": [{"topic": "Algebra", "start_time": "09:00", "end_time": "10:00", "status": "pending"}]}`;
        try {
            const aiResponse = await this.aiClient.generateContent(prompt);
            const jsonMatch = aiResponse.match(/\{.*\}/s);
            return jsonMatch ? JSON.parse(jsonMatch[0]) : this.generateFallbackPlan(data);
        }
        catch (aiError) {
            this.logger.warn('AI generation failed, using fallback plan', { error: aiError.message });
            return this.generateFallbackPlan(data);
        }
    }
    /**
     * Private method to generate fallback plan when AI fails
     */
    generateFallbackPlan(data) {
        const plan = {};
        const startDate = new Date();
        const endDate = new Date(data.targetCompletionDate);
        const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24));
        for (let i = 0; i < Math.min(daysDiff, 30); i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            const dateKey = currentDate.toISOString().split('T')[0];
            const sessionsPerDay = Math.floor(data.availableHoursPerDay / 2);
            plan[dateKey] = [];
            for (let j = 0; j < sessionsPerDay; j++) {
                const subject = data.subjects[j % data.subjects.length];
                const startHour = 9 + (j * 2);
                const endHour = startHour + 2;
                plan[dateKey].push({
                    topic: `${subject} - Session ${j + 1}`,
                    start_time: `${startHour.toString().padStart(2, '0')}:00`,
                    end_time: `${endHour.toString().padStart(2, '0')}:00`,
                    status: 'pending'
                });
            }
        }
        return plan;
    }
    /**
     * Private method to create individual session records from plan JSON
     */
    async createSessionsFromPlan(studyPlanId, plan) {
        const sessions = [];
        for (const [date, daySessions] of Object.entries(plan)) {
            for (const session of daySessions) {
                sessions.push({
                    studyPlanId,
                    date,
                    topic: session.topic,
                    startTime: session.start_time,
                    endTime: session.end_time,
                    status: session.status || 'pending'
                });
            }
        }
        if (sessions.length > 0) {
            await this.prisma.studySession.createMany({
                data: sessions
            });
        }
    }
    /**
     * Cleanup database connections
     */
    async disconnect() {
        await this.prisma.$disconnect();
    }
}
exports.default = new StudyPlanService();
//# sourceMappingURL=studyPlanService.js.map