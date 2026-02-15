import { Request, Response } from "express";
import studyPlanService from "../services/studyPlanService";
import { createLogger } from "../utils/logger";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../middleware/errorHandler";
import { enqueueReschedule } from "../queues/rescheduleQueue";

const logger = createLogger("study-plan-controller");

export class StudyPlanController {
  /**
   * POST /plans/generate
   * Generate study plan using AI + deterministic engine
   */
  generateStudyPlan = catchAsync(async (req: Request, res: Response) => {
    const { subjects, availableHoursPerDay, targetCompletionDate, examName, preferredStartTime } =
      req.body;
    const userId = req.userId!; // Resolved from JWT via protect middleware

    logger.entry('generateStudyPlan', {
      userId,
      subjects,
    });

    const result = await studyPlanService.createPlan({
      subjects,
      availableHoursPerDay,
      targetCompletionDate,
      userId,
      examName,
      preferredStartTime,
    });

    logger.exit('generateStudyPlan', { planId: result.planId });

    res.status(201).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * GET /plans
   * Get all plans for the authenticated user
   */
  getAllPlans = catchAsync(async (req: Request, res: Response) => {
    const userId = req.userId!; // Resolved from JWT

    logger.entry('getAllPlans', { userId });

    const plans = await studyPlanService.getAllPlans(userId);

    logger.exit('getAllPlans', { count: plans.length });

    res.status(200).json({
      status: 'success',
      results: plans.length,
      data: plans,
    });
  });

  /**
   * GET /plans/:id
   * Get study plan by ID
   */
  getStudyPlan = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    logger.entry('getStudyPlan', { id });

    const result = await studyPlanService.getPlanById(id);

    if (!result) {
      logger.warn('Study plan not found', { id });
      throw new AppError("Study plan not found", 404);
    }

    logger.exit('getStudyPlan', { id });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * PUT /plans/:id
   * Update study plan metadata
   */
  updateStudyPlan = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    logger.entry('updateStudyPlan', { id, updateData: req.body });

    const result = await studyPlanService.updatePlanById(id, req.body);

    logger.exit('updateStudyPlan', { id });

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  /**
   * DELETE /plans/:id
   * Delete study plan and all sessions
   */
  deleteStudyPlan = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    logger.entry('deleteStudyPlan', { id });

    await studyPlanService.deletePlanById(id);

    logger.exit('deleteStudyPlan', { id });

    res.status(204).send();
  });

  /**
   * POST /plans/:id/reschedule
   * Trigger async rescheduling for a plan
   */
  reschedule = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    logger.entry('reschedule', { id });

    // Verify plan exists
    const plan = await studyPlanService.getPlanById(id);
    if (!plan) {
      throw new AppError("Study plan not found", 404);
    }

    await enqueueReschedule({
      studyPlanId: id,
      correlationId: req.correlationId || 'manual',
      triggeredBy: 'manual',
    });

    logger.exit('reschedule', { id, message: 'Job enqueued' });

    res.status(202).json({
      status: 'success',
      message: 'Rescheduling job enqueued',
    });
  });

  /**
   * GET /plans/:id/analytics
   * Get coverage analytics for a plan
   */
  getAnalytics = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);

    logger.entry('getAnalytics', { id });

    const analytics = await studyPlanService.getCoverageAnalytics(id);

    logger.exit('getAnalytics', { id });

    res.status(200).json({
      status: 'success',
      data: analytics,
    });
  });

  /**
   * PATCH /sessions/:id/status
   * Update session status (triggers reschedule if skipped/partial)
   */
  updateSessionStatus = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { status, completedMinutes, remarks } = req.body;

    logger.entry('updateSessionStatus', { id, status });

    await studyPlanService.updateSessionStatus(
      id,
      { status, completedMinutes, remarks }
    );

    logger.exit('updateSessionStatus', { id });

    res.status(200).json({
      status: 'success',
      message: "Session status updated successfully",
    });
  });

  /**
   * PATCH /sessions/:id/remarks
   * Update session remarks
   */
  updateSessionRemarks = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { remarks } = req.body;

    logger.entry('updateSessionRemarks', { id });

    await studyPlanService.updateSessionRemarks(id, remarks);

    logger.exit('updateSessionRemarks', { id });

    res.status(200).json({
      status: 'success',
      message: "Session remarks updated successfully",
    });
  });
}

export default new StudyPlanController();
