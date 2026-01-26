import express from 'express';
import studyPlanController from '../controllers/studyPlanController';
import { validateRequest } from '../middleware/validateRequest';
import {
    CreateStudyPlanSchema,
    GetStudyPlanSchema
} from '../schemas';

const router = express.Router();

/**
 * POST /generate
 * Generate AI-based study plan
 */
router.post('/generate', validateRequest(CreateStudyPlanSchema), studyPlanController.generateStudyPlan);

/**
 * GET /:id
 * Get existing study plan
 */
router.get('/:id', validateRequest(GetStudyPlanSchema), studyPlanController.getStudyPlan);

export default router;

