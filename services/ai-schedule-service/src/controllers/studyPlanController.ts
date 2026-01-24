import { Request, Response } from "express";
import studyPlanService from "../services/studyPlanService";
import { createLogger } from "../utils/logger";
const logger = createLogger("study-plan-controller");

export class StudyPlanController {
  /**
   * POST /plans/generate
   * Generate AI-based study plan
   */
  async generateStudyPlan(req: Request, res: Response): Promise<void> {
    try {
      const { subjects, availableHoursPerDay, targetCompletionDate, userId } =
        req.body;

      // Validate required fields
      if (
        !subjects ||
        !availableHoursPerDay ||
        !targetCompletionDate ||
        !userId
      ) {
        res.status(400).json({
          error:
            "Missing required fields: subjects, availableHoursPerDay, targetCompletionDate, userId",
        });
        return;
      }

      const result = await studyPlanService.createPlan({
        subjects,
        availableHoursPerDay,
        targetCompletionDate,
        userId: String(userId),
      });

      res.status(201).json(result);
    } catch (error) {
      logger.error("Controller: Error generating study plan:", error);
      res.status(500).json({
        error: "Failed to generate study plan",
        message: (error as Error).message,
      });
    }
  }

  /**
   * GET /plans/:id
   * Get existing study plan
   */
  async getStudyPlan(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);

      const result = await studyPlanService.getPlanById(id);

      if (!result) {
        res.status(404).json({ error: "Study plan not found" });
        return;
      }

      res.status(200).json(result);
    } catch (error) {
      logger.error("Controller: Error fetching study plan:", error);
      res.status(500).json({
        error: "Failed to fetch study plan",
        message: (error as Error).message,
      });
    }
  }

  /**
   * PATCH /sessions/:id/status
   * Update session status
   */
  async updateSessionStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { status } = req.body;

      await studyPlanService.updateSessionStatus(id, status);

      res.status(200).json({ message: "Session updated" });
    } catch (error) {
      logger.error("Controller: Error updating session status:", error);

      // Handle validation errors with 400 status
      if ((error as Error).message.includes("Invalid status")) {
        res.status(400).json({ error: (error as Error).message });
        return;
      }

      res.status(500).json({
        error: "Failed to update session",
        message: (error as Error).message,
      });
    }
  }

  /**
   * PATCH /sessions/:id/remarks
   * Update session remarks
   */
  async updateSessionRemarks(req: Request, res: Response): Promise<void> {
    try {
      const id = String(req.params.id);
      const { remarks } = req.body;

      await studyPlanService.updateSessionRemarks(id, remarks);

      res.status(200).json({ message: "Remarks updated" });
    } catch (error) {
      logger.error("Controller: Error updating session remarks:", error);
      res.status(500).json({
        error: "Failed to update remarks",
        message: (error as Error).message,
      });
    }
  }
}

export default new StudyPlanController();
