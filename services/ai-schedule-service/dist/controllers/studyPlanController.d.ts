import { Request, Response } from 'express';
export declare class StudyPlanController {
    /**
     * POST /plans/generate
     * Generate AI-based study plan
     */
    generateStudyPlan(req: Request, res: Response): Promise<void>;
    /**
     * GET /plans/:id
     * Get existing study plan
     */
    getStudyPlan(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /sessions/:id/status
     * Update session status
     */
    updateSessionStatus(req: Request, res: Response): Promise<void>;
    /**
     * PATCH /sessions/:id/remarks
     * Update session remarks
     */
    updateSessionRemarks(req: Request, res: Response): Promise<void>;
}
declare const _default: StudyPlanController;
export default _default;
//# sourceMappingURL=studyPlanController.d.ts.map