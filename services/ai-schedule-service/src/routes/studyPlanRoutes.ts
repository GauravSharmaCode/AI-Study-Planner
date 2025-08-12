import express from 'express';
import studyPlanController from '../controllers/studyPlanController';

const router = express.Router();

/**
 * POST /plans/generate
 * Generate AI-based study plan
 * Body: { "subjects": ["Math", "Physics"], "availableHoursPerDay": 4, "targetCompletionDate": "2025-09-01", "userId": "user123" }
 */
router.post('/generate', studyPlanController.generateStudyPlan);

/**
 * GET /plans/:id
 * Get existing study plan
 */
router.get('/:id', studyPlanController.getStudyPlan);

/**
 * PATCH /sessions/:id/status
 * Update session status
 * Body: { "status": "completed" }
 */
router.patch('/sessions/:id/status', studyPlanController.updateSessionStatus);

/**
 * PATCH /sessions/:id/remarks
 * Update session remarks
 * Body: { "remarks": "Need to review formulas again" }
 */
router.patch('/sessions/:id/remarks', studyPlanController.updateSessionRemarks);

export default router;
