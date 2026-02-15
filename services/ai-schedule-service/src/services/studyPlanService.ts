import { PrismaClient } from "@prisma/client";
import { AIAPIClient } from './ai-api-client';
import { createLogger } from "../utils/logger";
import { prisma } from '../config/database';
import {
  generateSchedule,
  ScheduleInput,
  ScheduleResult,
  TopicEstimate,
} from './schedulingEngine';
import { enqueueReschedule } from '../queues/rescheduleQueue';
import { getCorrelationId } from "../utils/context";

const logger = createLogger('study-plan-service');

// ─── Request / Response Types ───────────────────────────────────────

export interface CreatePlanRequest {
  subjects: string[];
  availableHoursPerDay: number;
  targetCompletionDate: string; // ISO date string
  userId: string;
  examName?: string;
  preferredStartTime?: string; // "HH:mm", default "08:00"
}

export interface UpdateSessionStatusRequest {
  status: 'pending' | 'completed' | 'skipped' | 'partial';
  completedMinutes?: number;
  remarks?: string;
}

export interface CoverageAnalytics {
  totalSessions: number;
  completedSessions: number;
  skippedSessions: number;
  partialSessions: number;
  pendingSessions: number;
  totalPlannedMinutes: number;
  totalCompletedMinutes: number;
  completionPercentage: number;
  daysRemaining: number;
  remainingWorkloadMinutes: number;
  isAtRisk: boolean;
}

// ─── Service Class ──────────────────────────────────────────────────

export class StudyPlanService {
  private prisma: PrismaClient;
  private aiClient: AIAPIClient;

  constructor() {
    this.prisma = prisma;
    this.aiClient = new AIAPIClient(process.env.GOOGLE_GENAI_API_KEY || '');
  }

  // ─── CREATE PLAN ────────────────────────────────────────────────

  async createPlan(data: CreatePlanRequest): Promise<{ planId: string; plan: any; metadata: any }> {
    const func = "createPlan";
    logger.entry(func, { userId: data.userId, subjects: data.subjects });

    this.validateCreatePlanInput(data);

    const preferredStartTime = data.preferredStartTime || '08:00';
    const targetDate = new Date(data.targetCompletionDate);

    // Step 1: AI estimates topics
    logger.info('Requesting AI topic estimation', {
      func,
      subjects: data.subjects,
      examName: data.examName,
    });

    const topicEstimates = await this.aiClient.estimateTopics(
      data.subjects,
      data.examName
    );

    logger.info('AI topic estimation complete', {
      func,
      topicCount: topicEstimates.length,
    });

    // Step 2: Deterministic engine generates schedule
    const scheduleInput: ScheduleInput = {
      targetCompletionDate: targetDate,
      availableHoursPerDay: data.availableHoursPerDay,
      preferredStartTime,
      subjects: data.subjects,
      topicEstimates,
    };

    const scheduleResult = generateSchedule(scheduleInput);

    // Step 3: Persist everything in a transaction
    const studyPlan = await this.prisma.$transaction(async (tx) => {
      // Create the study plan
      const plan = await tx.studyPlan.create({
        data: {
          userId: data.userId,
          examName: data.examName ?? null,
          subjects: data.subjects,
          availableHoursPerDay: data.availableHoursPerDay,
          preferredStartTime,
          targetCompletionDate: targetDate,
          plan: this.scheduleResultToJson(scheduleResult),
          isActive: true,
        },
      });

      // Bulk-create sessions
      const sessionData = this.scheduleResultToSessions(plan.id, scheduleResult);
      if (sessionData.length > 0) {
        await tx.studySession.createMany({ data: sessionData });
      }

      return plan;
    });

    logger.stateChange(func, "StudyPlan Created", null, { planId: studyPlan.id });

    return {
      planId: studyPlan.id,
      plan: this.scheduleResultToJson(scheduleResult),
      metadata: scheduleResult.metadata,
    };
  }

  // ─── GET PLAN ───────────────────────────────────────────────────

  async getPlanById(id: string) {
    logger.entry("getPlanById", { id });
    const studyPlan = await this.prisma.studyPlan.findUnique({
      where: { id },
      include: { sessions: { orderBy: { date: 'asc' } } },
    });

    if (!studyPlan) return null;

    logger.exit("getPlanById", { id });
    return {
      planId: studyPlan.id,
      userId: studyPlan.userId,
      examName: studyPlan.examName || undefined,
      subjects: studyPlan.subjects,
      availableHoursPerDay: studyPlan.availableHoursPerDay,
      preferredStartTime: studyPlan.preferredStartTime,
      targetCompletionDate: studyPlan.targetCompletionDate,
      isActive: studyPlan.isActive,
      plan: studyPlan.plan,
      sessions: studyPlan.sessions,
      createdAt: studyPlan.createdAt,
      updatedAt: studyPlan.updatedAt,
    };
  }

  // ─── GET ALL PLANS ──────────────────────────────────────────────

  async getAllPlans(userId: string) {
    logger.entry("getAllPlans", { userId });
    return this.prisma.studyPlan.findMany({
      where: { userId, isActive: true },
      include: { sessions: { orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─── UPDATE PLAN ────────────────────────────────────────────────

  async updatePlanById(id: string, updateData: Partial<CreatePlanRequest>) {
    const func = "updatePlanById";
    logger.entry(func, { id, updateData });

    const studyPlan = await this.prisma.studyPlan.update({
      where: { id },
      data: {
        ...(updateData.examName !== undefined && { examName: updateData.examName }),
        ...(updateData.subjects && { subjects: updateData.subjects }),
        ...(updateData.availableHoursPerDay && { availableHoursPerDay: updateData.availableHoursPerDay }),
        ...(updateData.preferredStartTime && { preferredStartTime: updateData.preferredStartTime }),
        ...(updateData.targetCompletionDate && {
          targetCompletionDate: new Date(updateData.targetCompletionDate),
        }),
      },
    });

    logger.exit(func, { id });
    return studyPlan;
  }

  // ─── DELETE PLAN ────────────────────────────────────────────────

  async deletePlanById(id: string): Promise<boolean> {
    const func = "deletePlanById";
    logger.entry(func, { id });

    await this.prisma.$transaction(async (tx) => {
      await tx.studySession.deleteMany({ where: { studyPlanId: id } });
      await tx.studyPlan.delete({ where: { id } });
    });

    logger.exit(func, { id });
    return true;
  }

  // ─── SOFT DELETE (deactivate) ───────────────────────────────────

  async deactivatePlan(id: string): Promise<void> {
    const func = "deactivatePlan";
    logger.entry(func, { id });

    await this.prisma.studyPlan.update({
      where: { id },
      data: { isActive: false },
    });

    logger.exit(func, { id });
  }

  // ─── UPDATE SESSION STATUS ──────────────────────────────────────

  async updateSessionStatus(
    sessionId: string,
    update: UpdateSessionStatusRequest
  ): Promise<void> {
    const func = "updateSessionStatus";
    const { status, completedMinutes, remarks } = update;

    logger.entry(func, { sessionId, status });

    if (!['pending', 'completed', 'skipped', 'partial'].includes(status)) {
      throw new Error('Invalid status. Must be: pending, completed, skipped, or partial');
    }

    const session = await this.prisma.studySession.update({
      where: { id: sessionId },
      data: {
        status,
        ...(completedMinutes !== undefined && { completedMinutes }),
        ...(remarks !== undefined && { remarks }),
      },
    });

    // Trigger async rescheduling for skipped or partial sessions
    if (status === 'skipped' || status === 'partial') {
      logger.info('Session status triggers rescheduling', {
        func,
        sessionId,
        status,
        studyPlanId: session.studyPlanId,
      });

      await enqueueReschedule({
        studyPlanId: session.studyPlanId,
        correlationId: getCorrelationId() || 'unknown',
        triggeredBy: 'session_status_change',
      });
    }

    logger.exit(func, { sessionId });
  }

  // ─── UPDATE SESSION REMARKS ─────────────────────────────────────

  async updateSessionRemarks(sessionId: string, remarks: string): Promise<void> {
    const func = "updateSessionRemarks";
    logger.entry(func, { sessionId });

    await this.prisma.studySession.update({
      where: { id: sessionId },
      data: { remarks },
    });

    logger.exit(func, { sessionId });
  }

  // ─── RESCHEDULE ─────────────────────────────────────────────────

  async reschedule(studyPlanId: string): Promise<void> {
    const func = "reschedule";
    logger.entry(func, { studyPlanId });

    const plan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: { sessions: true },
    });

    if (!plan) throw new Error(`Study plan not found: ${studyPlanId}`);
    if (!plan.isActive) throw new Error(`Study plan is deactivated: ${studyPlanId}`);

    const now = new Date();
    const tomorrowMidnight = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
    ));

    // Compute remaining workload from incomplete sessions
    let remainingMinutes = 0;

    // Collect topics that still need work
    const topicWorkload = new Map<string, { studyMinutes: number; revisionMinutes: number; subject: string }>();

    for (const session of plan.sessions) {
      if (session.status === 'completed') continue;

      let unfinishedMinutes: number;
      if (session.status === 'partial' && session.completedMinutes != null) {
        unfinishedMinutes = session.plannedMinutes - session.completedMinutes;
      } else if (session.status === 'skipped') {
        unfinishedMinutes = session.plannedMinutes;
      } else if (session.status === 'pending' && session.date >= tomorrowMidnight) {
        unfinishedMinutes = session.plannedMinutes;
      } else {
        continue;
      }
      
      if (unfinishedMinutes <= 0) continue;

      const existing = topicWorkload.get(session.topic) || { studyMinutes: 0, revisionMinutes: 0, subject: '' };

      if (session.isRevision) {
        existing.revisionMinutes += unfinishedMinutes;
      } else {
        existing.studyMinutes += unfinishedMinutes;
      }
      existing.subject = existing.subject || session.topic;

      topicWorkload.set(session.topic, existing);
      remainingMinutes += unfinishedMinutes;
    }

    if (remainingMinutes <= 0) {
      logger.info('No remaining workload to reschedule', { func, studyPlanId });
      return;
    }

    // Build topic estimates
    const rescheduledTopics: TopicEstimate[] = [];

    for (const [topicName, data] of topicWorkload) {
      if (data.studyMinutes > 0) {
        rescheduledTopics.push({
          name: topicName,
          subject: data.subject,
          estimatedHours: data.studyMinutes / 60,
          difficulty: 'medium',
          generateRevisions: true,
        });
      }

      if (data.revisionMinutes > 0) {
        rescheduledTopics.push({
          name: `${topicName} (Revision)`,
          subject: data.subject,
          estimatedHours: data.revisionMinutes / 60,
          difficulty: 'medium',
          generateRevisions: false,
        });
      }
    }

    const scheduleResult = generateSchedule(
      {
        targetCompletionDate: plan.targetCompletionDate,
        availableHoursPerDay: plan.availableHoursPerDay,
        preferredStartTime: plan.preferredStartTime,
        subjects: plan.subjects,
        topicEstimates: rescheduledTopics,
      },
      tomorrowMidnight
    );

    // Transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.studySession.deleteMany({
        where: {
          studyPlanId,
          date: { gte: tomorrowMidnight },
        },
      });

      const sessionData = this.scheduleResultToSessions(studyPlanId, scheduleResult);
      if (sessionData.length > 0) {
        await tx.studySession.createMany({ data: sessionData });
      }

      await tx.studyPlan.update({
        where: { id: studyPlanId },
        data: { plan: this.scheduleResultToJson(scheduleResult) },
      });
    });

    logger.stateChange(func, "Schedule Regenerated", null, {
      studyPlanId,
      newSessionCount: scheduleResult.metadata.totalSessionCount,
    });
  }

  // ─── COVERAGE ANALYTICS ─────────────────────────────────────────

  async getCoverageAnalytics(studyPlanId: string): Promise<CoverageAnalytics> {
    const func = "getCoverageAnalytics";
    logger.entry(func, { studyPlanId });

    const plan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: { sessions: true },
    });

    if (!plan) throw new Error(`Study plan not found: ${studyPlanId}`);

    const now = new Date();
    const daysRemaining = Math.max(0, Math.floor(
      (plan.targetCompletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    ));

    let completedSessions = 0;
    let skippedSessions = 0;
    let partialSessions = 0;
    let pendingSessions = 0;
    let totalPlannedMinutes = 0;
    let totalCompletedMinutes = 0;

    for (const session of plan.sessions) {
      totalPlannedMinutes += session.plannedMinutes;

      switch (session.status) {
        case 'completed':
          completedSessions++;
          totalCompletedMinutes += session.completedMinutes ?? session.plannedMinutes;
          break;
        case 'skipped':
          skippedSessions++;
          break;
        case 'partial':
          partialSessions++;
          totalCompletedMinutes += session.completedMinutes ?? 0;
          break;
        default:
          pendingSessions++;
          break;
      }
    }

    const completionPercentage = totalPlannedMinutes > 0
      ? Math.round((totalCompletedMinutes / totalPlannedMinutes) * 100)
      : 0;

    const remainingWorkloadMinutes = totalPlannedMinutes - totalCompletedMinutes;
    const remainingCapacity = daysRemaining * plan.availableHoursPerDay * 60;
    const isAtRisk = remainingWorkloadMinutes > remainingCapacity;

    const result = {
      totalSessions: plan.sessions.length,
      completedSessions,
      skippedSessions,
      partialSessions,
      pendingSessions,
      totalPlannedMinutes,
      totalCompletedMinutes,
      completionPercentage,
      daysRemaining,
      remainingWorkloadMinutes,
      isAtRisk,
    };

    logger.exit(func, { studyPlanId, completionPercentage });
    return result;
  }

  // ─── PRIVATE HELPERS ────────────────────────────────────────────

  private validateCreatePlanInput(data: CreatePlanRequest): void {
    if (!data.subjects || !Array.isArray(data.subjects) || data.subjects.length === 0) {
      throw new Error('Subjects are required and must be a non-empty array');
    }
    if (!data.availableHoursPerDay || data.availableHoursPerDay <= 0) {
      throw new Error('Available hours per day must be greater than 0');
    }
    if (data.availableHoursPerDay > 12) {
      throw new Error('Available hours per day must not exceed 12');
    }
    if (!data.targetCompletionDate) {
      throw new Error('Target completion date is required');
    }
    if (!data.userId) {
      throw new Error('User ID is required');
    }

    const targetDate = new Date(data.targetCompletionDate);
    if (isNaN(targetDate.getTime())) {
      throw new Error('Invalid target completion date format');
    }
    if (targetDate <= new Date()) {
      throw new Error('Target completion date must be in the future');
    }
  }

  /**
   * Convert ScheduleResult to a JSON-serializable snapshot for the `plan` column.
   */
  private scheduleResultToJson(result: ScheduleResult): any {
    return {
      days: result.days.map(day => ({
        date: day.date.toISOString(),
        totalMinutes: day.totalMinutes,
        sessions: day.blocks.map(block => ({
          topic: block.topic,
          subject: block.subject,
          startTime: block.startTime,
          endTime: block.endTime,
          plannedMinutes: block.plannedMinutes,
          isRevision: block.isRevision,
        })),
      })),
      metadata: result.metadata,
    };
  }

  /**
   * Convert ScheduleResult days/blocks into flat StudySession records for Prisma.
   */
  private scheduleResultToSessions(
    studyPlanId: string,
    result: ScheduleResult
  ): Array<{
    studyPlanId: string;
    date: Date;
    topic: string;
    startTime: string;
    endTime: string;
    plannedMinutes: number;
    isRevision: boolean;
    status: string;
  }> {
    const sessions: Array<{
      studyPlanId: string;
      date: Date;
      topic: string;
      startTime: string;
      endTime: string;
      plannedMinutes: number;
      isRevision: boolean;
      status: string;
    }> = [];

    for (const day of result.days) {
      for (const block of day.blocks) {
        sessions.push({
          studyPlanId,
          date: day.date,
          topic: block.topic,
          startTime: block.startTime,
          endTime: block.endTime,
          plannedMinutes: block.plannedMinutes,
          isRevision: block.isRevision,
          status: 'pending',
        });
      }
    }

    return sessions;
  }

  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default new StudyPlanService();
