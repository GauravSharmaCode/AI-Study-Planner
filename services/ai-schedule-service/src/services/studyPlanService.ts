import { PrismaClient, Prisma, SessionStatus } from "@prisma/client";
import { AIAPIClient } from './ai-api-client';
import { createLogger } from "../utils/logger";
import { prisma } from '../config/database';
import { planGenerationDurationSeconds, dbTransactionDurationSeconds } from "../utils/metrics";
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
  status: string;
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

/**
 * Service for managing study plans, including creation, retrieval, updates, and scheduling logic.
 */
export class StudyPlanService {
  private prisma: PrismaClient;
  private aiClient: AIAPIClient;

  constructor() {
    this.prisma = prisma;
    const ollamaApiKey = process.env.OLLAMA_API_KEY || '';
    const ollamaModel = process.env.OLLAMA_MODEL;
    this.aiClient = new AIAPIClient(ollamaApiKey, ollamaModel);
  }

  // ─── CREATE PLAN ────────────────────────────────────────────────

  /**
   * Creates a new study plan.
   *
   * Orchestrates the following steps:
   * 1. Validates input.
   * 2. Calls AI to estimate topics and effort.
   * 3. Uses the deterministic engine to generate a schedule.
   * 4. Persists the plan and sessions to the database in a transaction.
   *
   * @param {CreatePlanRequest} data - The plan creation request data.
   * @returns {Promise<{ planId: string; plan: any; metadata: any }>} The created plan details.
   * @throws {Error} If input is invalid or downstream services fail.
   */
  async createPlan(data: CreatePlanRequest): Promise<{ planId: string; plan: any; metadata: any }> {
    const func = "createPlan";
    logger.entry(func, { userId: data.userId, subjects: data.subjects });
    const start = Date.now();

    try {
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
    const dbStart = Date.now();
    const studyPlan = await this.prisma.$transaction(async (tx) => {
      // Deactivate any existing active plans for this user (Single Active Plan Rule)
      await tx.studyPlan.updateMany({
        where: { userId: data.userId, isActive: true },
        data: { isActive: false, status: 'ARCHIVED' },
      });

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
          status: 'ACTIVE',
        },
      });

      // Bulk-create sessions
      const sessionData = this.scheduleResultToSessions(plan.id, scheduleResult);
      if (sessionData.length > 0) {
        await tx.studySession.createMany({ data: sessionData });
      }

      return plan;
    });
    const dbDuration = (Date.now() - dbStart) / 1000;
    dbTransactionDurationSeconds.observe({ operation: 'createPlan', table: 'StudyPlan' }, dbDuration);

    logger.stateChange(func, "StudyPlan Created", null, { planId: studyPlan.id });

    const totalDuration = (Date.now() - start) / 1000;
    planGenerationDurationSeconds.observe({ status: 'success' }, totalDuration);

    return {
      planId: studyPlan.id,
      plan: this.scheduleResultToJson(scheduleResult),
      metadata: scheduleResult.metadata,
    };
    } catch (error) {
      const totalDuration = (Date.now() - start) / 1000;
      planGenerationDurationSeconds.observe({ status: 'failure' }, totalDuration);
      throw error;
    }
  }

  // ─── GET PLAN ───────────────────────────────────────────────────

  /**
   * Retrieves a study plan by ID, including its sessions.
   *
   * @param {string} id - The study plan ID.
   * @returns {Promise<any | null>} The study plan object or null if not found.
   */
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

  /**
   * Retrieves all active study plans for a user.
   *
   * @param {string} userId - The user ID.
   * @returns {Promise<any[]>} List of study plans.
   */
  async getAllPlans(userId: string) {
    logger.entry("getAllPlans", { userId });
    return this.prisma.studyPlan.findMany({
      where: { userId, isActive: true },
      include: { sessions: { orderBy: { date: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    }) as any;
  }

  // ─── UPDATE PLAN ────────────────────────────────────────────────

  /**
   * Updates a study plan's details.
   *
   * Note: This only updates the plan metadata, not the generated schedule/sessions.
   * To regenerate the schedule, use `reschedule()`.
   *
   * @param {string} id - The study plan ID.
   * @param {Partial<CreatePlanRequest>} updateData - The data to update.
   * @returns {Promise<any>} The updated study plan.
   */
  async updatePlanById(id: string, updateData: Partial<CreatePlanRequest>) {
    const func = "updatePlanById";
    logger.entry(func, { id, updateData });

    // Fetch current version for optimistic locking
    const currentPlan = await this.prisma.studyPlan.findUnique({
      where: { id },
      select: { version: true },
    });

    if (!currentPlan) {
      throw new Error("Study plan not found");
    }

    // Optimistic locking: update only if version hasn't changed
    const updateResult = await this.prisma.studyPlan.updateMany({
      where: { id, version: currentPlan.version },
      data: {
        ...(updateData.examName !== undefined && { examName: updateData.examName }),
        ...(updateData.subjects && { subjects: updateData.subjects }),
        ...(updateData.availableHoursPerDay && { availableHoursPerDay: updateData.availableHoursPerDay }),
        ...(updateData.preferredStartTime && { preferredStartTime: updateData.preferredStartTime }),
        ...(updateData.targetCompletionDate && {
          targetCompletionDate: new Date(updateData.targetCompletionDate),
        }),
        version: { increment: 1 },
      },
    });

    if (updateResult.count === 0) {
      throw new Error('Optimistic Lock Error: Plan has been updated by another process.');
    }

    const studyPlan = await this.prisma.studyPlan.findUnique({ where: { id } });
    logger.exit(func, { id });
    return studyPlan;
  }

  // ─── DELETE PLAN ────────────────────────────────────────────────

  /**
   * Hard deletes a study plan and its associated sessions.
   *
   * @param {string} id - The study plan ID.
   * @returns {Promise<boolean>} True if successful.
   */
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

  /**
   * Deactivates a study plan (soft delete).
   *
   * @param {string} id - The study plan ID.
   * @returns {Promise<void>}
   */
  async deactivatePlan(id: string): Promise<void> {
    const func = "deactivatePlan";
    logger.entry(func, { id });

    await this.prisma.studyPlan.update({
      where: { id },
      data: { isActive: false, status: 'ARCHIVED' },
    });

    logger.exit(func, { id });
  }

  // ─── UPDATE SESSION STATUS ──────────────────────────────────────

  /**
   * Updates the status of a specific study session.
   *
   * Triggers rescheduling if status is 'skipped' or 'partial'.
   *
   * @param {string} sessionId - The session ID.
   * @param {UpdateSessionStatusRequest} update - The update data.
   * @returns {Promise<void>}
   * @throws {Error} If status is invalid.
   */
  async updateSessionStatus(
    sessionId: string,
    update: UpdateSessionStatusRequest
  ): Promise<void> {
    const func = "updateSessionStatus";
    const { completedMinutes, remarks } = update;
    const status = update.status.toUpperCase() as 'PENDING' | 'COMPLETED' | 'SKIPPED' | 'PARTIAL';

    logger.entry(func, { sessionId, status });

    if (!['PENDING', 'COMPLETED', 'SKIPPED', 'PARTIAL'].includes(status)) {
      throw new Error('Invalid status. Must be: PENDING, COMPLETED, SKIPPED, or PARTIAL');
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
    if (status === 'SKIPPED' || status === 'PARTIAL') {
      logger.info('Session status triggers rescheduling', {
        func,
        sessionId,
        status,
        studyPlanId: session.studyPlanId,
      });

      await enqueueReschedule({
        studyPlanId: session.studyPlanId,
        correlationId: getCorrelationId() || 'any',
        triggeredBy: 'session_status_change',
      });
    }

    logger.exit(func, { sessionId });
  }

  // ─── UPDATE SESSION REMARKS ─────────────────────────────────────

  /**
   * Updates remarks for a session.
   *
   * @param {string} sessionId - The session ID.
   * @param {string} remarks - The remarks to save.
   * @returns {Promise<void>}
   */
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

  /**
   * Reschedules the remaining workload for a study plan.
   *
   * Calculates pending work from incomplete sessions and generates a new schedule
   * starting from tomorrow.
   *
   * @param {string} studyPlanId - The study plan ID.
   * @returns {Promise<void>}
   * @throws {Error} If plan not found or inactive.
   */
  async reschedule(studyPlanId: string): Promise<void> {
    const func = "reschedule";
    logger.entry(func, { studyPlanId });

    const now = new Date();
    const tomorrowMidnight = new Date(Date.UTC(
      now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1
    ));

    const plan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
      include: {
        sessions: {
          where: {
            OR: [
              { status: 'SKIPPED' },
              { status: 'PARTIAL', completedMinutes: { not: null } },
              { status: 'PENDING', date: { gte: tomorrowMidnight } },
            ],
          },
        },
      },
    });

    if (!plan) throw new Error(`Study plan not found: ${studyPlanId}`);
    if (!plan.isActive) throw new Error(`Study plan is deactivated: ${studyPlanId}`);

    // Compute remaining workload from incomplete sessions
    let remainingMinutes = 0;

    // Collect topics that still need work
    const topicWorkload = new Map<string, { studyMinutes: number; revisionMinutes: number; subject: string }>();

    for (const session of plan.sessions) {
      if (session.status === 'COMPLETED') continue;

      let unfinishedMinutes: number;
      if (session.status === 'PARTIAL' && session.completedMinutes != null) {
        unfinishedMinutes = session.plannedMinutes - session.completedMinutes;
      } else if (session.status === 'SKIPPED') {
        unfinishedMinutes = session.plannedMinutes;
      } else if (session.status === 'PENDING' && session.date >= tomorrowMidnight) {
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
    const dbStart = Date.now();
    try {
      await this.prisma.$transaction(async (tx) => {
        // Clear old sessions
        await tx.studySession.deleteMany({
          where: {
            studyPlanId,
            date: { gte: tomorrowMidnight },
          },
        });

        // Add new sessions
        const sessionData = this.scheduleResultToSessions(studyPlanId, scheduleResult);
        if (sessionData.length > 0) {
          await tx.studySession.createMany({ data: sessionData });
        }

        // Update plan with new schedule and optimistic locking
        // Using updateMany with version filter — if count is 0, a concurrent write happened
        const rescheduleUpdate = await tx.studyPlan.updateMany({
          where: { id: studyPlanId, version: plan.version },
          data: {
            plan: this.scheduleResultToJson(scheduleResult),
            version: { increment: 1 },
          },
        });
        if (rescheduleUpdate.count === 0) {
          throw new Prisma.PrismaClientKnownRequestError(
            'Optimistic lock conflict during reschedule',
            { code: 'P2025', clientVersion: '' }
          );
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
        throw new Error('Optimistic Lock Error: Plan has been modified during rescheduling.');
      }
      throw error;
    }
    const dbDuration = (Date.now() - dbStart) / 1000;
    dbTransactionDurationSeconds.observe({ operation: 'reschedule', table: 'StudyPlan' }, dbDuration);

    logger.stateChange(func, "Schedule Regenerated", null, {
      studyPlanId,
      newSessionCount: scheduleResult.metadata.totalSessionCount,
    });
  }

  // ─── COVERAGE ANALYTICS ─────────────────────────────────────────

  /**
   * Calculates coverage analytics for a study plan.
   *
   * Metrics include:
   * - Completion percentage
   * - Remaining workload vs. capacity (risk assessment)
   * - Session counts by status
   *
   * @param {string} studyPlanId - The study plan ID.
   * @returns {Promise<CoverageAnalytics>} The analytics data.
   * @throws {Error} If plan not found.
   */
  async getCoverageAnalytics(studyPlanId: string): Promise<CoverageAnalytics> {
    const func = "getCoverageAnalytics";
    logger.entry(func, { studyPlanId });

    // Optimization: Fetch plan only (no sessions) and use DB aggregation
    const plan = await this.prisma.studyPlan.findUnique({
      where: { id: studyPlanId },
    });

    if (!plan) throw new Error(`Study plan not found: ${studyPlanId}`);

    // DB Aggregation using raw SQL for performance
    // Define the expected shape of the raw query result
    interface RawAnalytics {
      total_sessions: bigint;
      total_planned_minutes: bigint | null;
      completed_sessions: bigint | null;
      skipped_sessions: bigint | null;
      partial_sessions: bigint | null;
      pending_sessions: bigint | null;
      total_completed_minutes: bigint | null;
    }

    const statsResult = await this.prisma.$queryRaw<RawAnalytics[]>`
      SELECT
        COUNT(*) as total_sessions,
        SUM("plannedMinutes") as total_planned_minutes,
        SUM(CASE WHEN "status" = 'completed' THEN 1 ELSE 0 END) as completed_sessions,
        SUM(CASE WHEN "status" = 'skipped' THEN 1 ELSE 0 END) as skipped_sessions,
        SUM(CASE WHEN "status" = 'partial' THEN 1 ELSE 0 END) as partial_sessions,
        SUM(CASE WHEN "status" = 'pending' THEN 1 ELSE 0 END) as pending_sessions,
        SUM(CASE
          WHEN "status" = 'completed' THEN COALESCE("completedMinutes", "plannedMinutes")
          WHEN "status" = 'partial' THEN COALESCE("completedMinutes", 0)
          ELSE 0
        END) as total_completed_minutes
      FROM "study_sessions"
      WHERE "studyPlanId" = ${studyPlanId}
    `;

    const stats: RawAnalytics = statsResult[0] || {
      total_sessions: BigInt(0),
      total_planned_minutes: BigInt(0),
      completed_sessions: BigInt(0),
      skipped_sessions: BigInt(0),
      partial_sessions: BigInt(0),
      pending_sessions: BigInt(0),
      total_completed_minutes: BigInt(0),
    };

    // Helper to safely convert BigInt/null to Number
    const toNumber = (val: bigint | null | undefined) => val ? Number(val) : 0;

    const totalSessions = toNumber(stats.total_sessions);
    const totalPlannedMinutes = toNumber(stats.total_planned_minutes);
    const completedSessions = toNumber(stats.completed_sessions);
    const skippedSessions = toNumber(stats.skipped_sessions);
    const partialSessions = toNumber(stats.partial_sessions);
    const pendingSessions = toNumber(stats.pending_sessions);
    const totalCompletedMinutes = toNumber(stats.total_completed_minutes);

    const now = new Date();
    const daysRemaining = Math.max(0, Math.floor(
      (plan.targetCompletionDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    ));

    const completionPercentage = totalPlannedMinutes > 0
      ? Math.round((totalCompletedMinutes / totalPlannedMinutes) * 100)
      : 0;

    const remainingWorkloadMinutes = totalPlannedMinutes - totalCompletedMinutes;
    const remainingCapacity = daysRemaining * plan.availableHoursPerDay * 60;
    const isAtRisk = remainingWorkloadMinutes > remainingCapacity;

    const result = {
      totalSessions,
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
    subject: string | null;
    startTime: string;
    endTime: string;
    plannedMinutes: number;
    isRevision: boolean;
    status: SessionStatus;
  }> {
    const sessions: Array<{
      studyPlanId: string;
      date: Date;
      topic: string;
      subject: string | null;
      startTime: string;
      endTime: string;
      plannedMinutes: number;
      isRevision: boolean;
      status: SessionStatus;
    }> = [];

    for (const day of result.days) {
      for (const block of day.blocks) {
        sessions.push({
          studyPlanId,
          date: day.date,
          topic: block.topic,
          subject: block.subject ?? null,
          startTime: block.startTime,
          endTime: block.endTime,
          plannedMinutes: block.plannedMinutes,
          isRevision: block.isRevision,
          status: SessionStatus.PENDING,
        });
      }
    }

    return sessions;
  }

  /**
   * Disconnects the Prisma client.
   */
  async disconnect(): Promise<void> {
    await this.prisma.$disconnect();
  }
}

export default new StudyPlanService();
