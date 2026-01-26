import { Request, Response, NextFunction } from "express";
import studyPlanService from "../services/studyPlanService";
import { createLogger } from "../utils/logger";
import { catchAsync } from "../utils/catchAsync";
import { AppError } from "../middleware/errorHandler";

const logger = createLogger("study-plan-controller");

export class StudyPlanController {
  /**
   * POST /plans/generate
   * Generate AI-based study plan
   */
  generateStudyPlan = catchAsync(async (req: Request, res: Response) => {
    const { subjects, availableHoursPerDay, targetCompletionDate, userId } =
      req.body;

    const result = await studyPlanService.createPlan({
      subjects,
      availableHoursPerDay,
      targetCompletionDate,
      userId: String(userId),
    });

    res.status(201).json({
      status: 'success',
      data: result
    });
  });

  /**
   * GET /plans/:id
   * Get existing study plan
   */
  getStudyPlan = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const result = await studyPlanService.getPlanById(id);

    if (!result) {
      throw new AppError("Study plan not found", 404);
    }

    res.status(200).json({
      status: 'success',
      data: result
    });
  });

  /**
   * PATCH /sessions/:id/status
   * Update session status
   */
  updateSessionStatus = catchAsync(async (req: Request, res: Response) => {
    const id = String(req.params.id);
    const { status } = req.body;

    await studyPlanService.updateSessionStatus(id, status);

    res.status(200).json({
      status: 'success',
      message: "Session status updated successfully"
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
      message: "Session remarks updated successfully"
    });
  });
}

export default new StudyPlanController();
