import { Request, Response } from "express";
import studyPlanService from "../services/studyPlanService";
import { createLogger } from "../utils/logger";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../middleware/errorHandler";
import { enqueueReschedule } from "../queues/rescheduleQueue";

const logger = createLogger("study-plan-controller");

/**
 * Controller for handling study plan and session related requests.
 */
export class StudyPlanController {
  /**
   * POST /plans/generate
   *
   * Generate a study plan using AI estimation + deterministic scheduling engine.
   *
   * @param {Request} req - Express request object containing plan details in body.
   * @param {Response} res - Express response object.
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
   *
   * Get all active study plans for the authenticated user.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
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
   *
   * Get a specific study plan by ID.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @throws {AppError} If plan is not found (404).
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
   *
   * Update study plan metadata.
   *
   * @param {Request} req - Express request object containing update data.
   * @param {Response} res - Express response object.
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
   *
   * Hard delete a study plan and all its sessions.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
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
   *
   * Trigger an asynchronous rescheduling job for a plan.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @throws {AppError} If plan is not found.
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
   *
   * Get coverage analytics and progress metrics for a plan.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
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
   *
   * Update the status of a specific session.
   * Note: This may trigger an async rescheduling job if the status is 'skipped' or 'partial'.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
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
   *
   * Update remarks/notes for a specific session.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
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
