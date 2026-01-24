import { PrismaClient } from "@prisma/client";
import { AIAPIClient } from './ai-api-client';
import { StudyPlan } from '../schemas';
import { createLogger } from "../utils/logger";
import { prisma } from '../config/database';

const logger = createLogger('study-plan-service');
// ...

interface CreatePlanRequest {
  subjects: string[];
  availableHoursPerDay: number;
  targetCompletionDate: string;
  userId: string;
}



// Mapping to usage: getAllPlans returns StudyPlan[].

class StudyPlanService {
  private prisma: PrismaClient;
  private logger: any;
  private aiClient: AIAPIClient;

  /**
   * Initializes the studyPlanService with a shared PrismaClient and logger.
   * @constructor
   */
  constructor() {
    this.prisma = prisma;
    this.logger = logger;
    this.aiClient = new AIAPIClient(process.env.GOOGLE_GENAI_API_KEY || '');
  }

  /**
   * Create a new study plan with AI-generated content
   */
  async createPlan(data: CreatePlanRequest): Promise<{ planId: string; plan: any }> {
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

    } catch (error) {
      this.logger.error('Error creating study plan:', error);
      throw new Error(`Failed to create study plan: ${(error as Error).message}`);
    }
  }

  /**
   * Get a study plan by ID
   */
  async getPlanById(id: string): Promise<{ planId: string; plan: any } | null> {
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

    } catch (error) {
      this.logger.error('Error fetching study plan:', error);
      throw new Error(`Failed to fetch study plan: ${(error as Error).message}`);
    }
  }

  /**
   * Get all plans for a user
   */
  async getAllPlans(userId: string): Promise<StudyPlan[]> {
    try {
      const plans = await this.prisma.studyPlan.findMany({
        where: { userId },
        include: { sessions: true },
        orderBy: { createdAt: 'desc' }
      });

      return plans as StudyPlan[];

    } catch (error) {
      this.logger.error('Error fetching user plans:', error);
      throw new Error(`Failed to fetch plans: ${(error as Error).message}`);
    }
  }

  /**
   * Update a study plan by ID
   */
  async updatePlanById(id: string, updateData: Partial<CreatePlanRequest>): Promise<StudyPlan | null> {
    try {
      const studyPlan = await this.prisma.studyPlan.update({
        where: { id },
        data: {
          ...updateData,
          targetCompletionDate: updateData.targetCompletionDate ? new Date(updateData.targetCompletionDate) : undefined,
          updatedAt: new Date()
        }
      });

      return studyPlan as StudyPlan;

    } catch (error) {
      this.logger.error('Error updating study plan:', error);
      throw new Error(`Failed to update study plan: ${(error as Error).message}`);
    }
  }

  /**
   * Delete a study plan by ID
   */
  async deletePlanById(id: string): Promise<boolean> {
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

    } catch (error) {
      this.logger.error('Error deleting study plan:', error);
      throw new Error(`Failed to delete study plan: ${(error as Error).message}`);
    }
  }

  /**
   * Update session status
   */
  async updateSessionStatus(sessionId: string, status: string): Promise<void> {
    if (!['pending', 'completed', 'skipped'].includes(status)) {
      throw new Error('Invalid status. Must be: pending, completed, or skipped');
    }

    try {
      await this.prisma.studySession.update({
        where: { id: sessionId },
        data: { status }
      });

    } catch (error) {
      this.logger.error('Error updating session status:', error);
      throw new Error(`Failed to update session: ${(error as Error).message}`);
    }
  }

  /**
   * Update session remarks
   */
  async updateSessionRemarks(sessionId: string, remarks: string): Promise<void> {
    try {
      await this.prisma.studySession.update({
        where: { id: sessionId },
        data: { remarks }
      });

    } catch (error) {
      this.logger.error('Error updating session remarks:', error);
      throw new Error(`Failed to update remarks: ${(error as Error).message}`);
    }
  }

  /**
   * Private method to validate input data
   */
  private validateCreatePlanInput(data: CreatePlanRequest): void {
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
  private async generateStudyPlanContent(data: CreatePlanRequest): Promise<any> {
    const prompt = `Generate a study plan for the following:
    Subjects: ${data.subjects.join(', ')}
    Available hours per day: ${data.availableHoursPerDay}
    Target completion date: ${data.targetCompletionDate}
    
    Return a JSON object with dates as keys and arrays of study sessions as values.
    Each session should have: topic, start_time, end_time, status (default "pending").
    Format: {"2025-08-12": [{"topic": "Algebra", "start_time": "09:00", "end_time": "10:00", "status": "pending"}]}`;

    const aiResponse = await this.aiClient.generateContent(prompt);
    const jsonMatch = aiResponse.match(/\{.*\}/s);
    
    if (!jsonMatch) {
      throw new Error('AI failed to generate valid study plan format');
    }
    
    return JSON.parse(jsonMatch[0]);
  }



  /**
   * Private method to create individual session records from plan JSON
   */
  private async createSessionsFromPlan(studyPlanId: string, plan: any): Promise<void> {
    const sessions = [];
    
    for (const [date, daySessions] of Object.entries(plan)) {
      for (const session of daySessions as any[]) {
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
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default new StudyPlanService();