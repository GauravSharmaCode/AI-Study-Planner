import express from 'express';
import studyPlanController from '../controllers/studyPlanController';
import { validateRequest } from '../middleware/validateRequest';
import { protect } from '../middleware/auth';
import {
    UpdateSessionStatusSchema,
    UpdateSessionRemarksSchema
} from '../schemas';

const router = express.Router();

// All session routes require authentication
router.use(protect);

/**
 * PATCH /:id/status
 * Update session status (triggers async reschedule for skipped/partial)
 */
router.patch('/:id/status', validateRequest(UpdateSessionStatusSchema), studyPlanController.updateSessionStatus);

/**
 * PATCH /:id/remarks
 * Update session remarks
 */
router.patch('/:id/remarks', validateRequest(UpdateSessionRemarksSchema), studyPlanController.updateSessionRemarks);

export default router;
