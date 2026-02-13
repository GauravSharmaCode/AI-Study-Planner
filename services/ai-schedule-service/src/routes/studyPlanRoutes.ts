import express from 'express';
import studyPlanController from '../controllers/studyPlanController';
import { validateRequest } from '../middleware/validateRequest';
import { protect } from '../middleware/auth';
import {
    CreateStudyPlanSchema,
    GetStudyPlanSchema,
    UpdateStudyPlanSchema,
    DeleteStudyPlanSchema,
    RescheduleSchema,
    GetAnalyticsSchema,
} from '../schemas';

const router = express.Router();

// All plan routes require authentication
router.use(protect);

/**
 * GET /
 * Get all plans for the authenticated user (userId from JWT)
 */
router.get('/', studyPlanController.getAllPlans);

/**
 * POST /generate
 * Generate AI-assisted deterministic study plan
 */
router.post('/generate', validateRequest(CreateStudyPlanSchema), studyPlanController.generateStudyPlan);

/**
 * GET /:id
 * Get study plan by ID
 */
router.get('/:id', validateRequest(GetStudyPlanSchema), studyPlanController.getStudyPlan);

/**
 * PUT /:id
 * Update study plan metadata
 */
router.put('/:id', validateRequest(UpdateStudyPlanSchema), studyPlanController.updateStudyPlan);

/**
 * DELETE /:id
 * Delete study plan and all sessions
 */
router.delete('/:id', validateRequest(DeleteStudyPlanSchema), studyPlanController.deleteStudyPlan);

/**
 * POST /:id/reschedule
 * Trigger async rescheduling
 */
router.post('/:id/reschedule', validateRequest(RescheduleSchema), studyPlanController.reschedule);

/**
 * GET /:id/analytics
 * Get coverage analytics
 */
router.get('/:id/analytics', validateRequest(GetAnalyticsSchema), studyPlanController.getAnalytics);

export default router;
