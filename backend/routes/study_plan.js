const express = require('express');
import {
    createPlan,
    getAllPlans,
    getPlanById,
    updatePlanById,
    deletePlanById
} from '../controller/study_plan';

const router = express.Router();

// Route definitions
router.post('/generate-plan', createPlan);
router.get('/generate-plan', getAllPlans);
router.get('/generate-plan/:id', getPlanById);
router.patch('/generate-plan/:id', updatePlanById);
router.delete('/generate-plan/:id', deletePlanById);

export default router;
