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
    const userId = req.userId; // Resolved from JWT

    logger.info('Generating study plan', {
      correlationId: req.correlationId,
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
    const userId = req.userId; // Resolved from JWT

    const plans = await studyPlanService.getAllPlans(userId);

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
    const result = await studyPlanService.getPlanById(id);

    if (!result) {
      throw new AppError("Study plan not found", 404);
    }

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
    const result = await studyPlanService.updatePlanById(id, req.body);

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
    await studyPlanService.deletePlanById(id);

    res.status(204).send();
  });

  /**
   * POST /plans/:id/reschedule
   * Trigger async rescheduling for a plan
   */
  reschedule = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);

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
    const analytics = await studyPlanService.getCoverageAnalytics(id);

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

    await studyPlanService.updateSessionStatus(
      id,
      { status, completedMinutes, remarks },
      req.correlationId
    );

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

    await studyPlanService.updateSessionRemarks(id, remarks);

    res.status(200).json({
      status: 'success',
      message: "Session remarks updated successfully",
    });
  });
}

export default new StudyPlanController();
