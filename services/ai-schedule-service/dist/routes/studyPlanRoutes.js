"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const studyPlanController_1 = __importDefault(require("../controllers/studyPlanController"));
const router = express_1.default.Router();
/**
 * POST /plans/generate
 * Generate AI-based study plan
 * Body: { "subjects": ["Math", "Physics"], "availableHoursPerDay": 4, "targetCompletionDate": "2025-09-01", "userId": "user123" }
 */
router.post('/generate', studyPlanController_1.default.generateStudyPlan);
/**
 * GET /plans/:id
 * Get existing study plan
 */
router.get('/:id', studyPlanController_1.default.getStudyPlan);
/**
 * PATCH /sessions/:id/status
 * Update session status
 * Body: { "status": "completed" }
 */
router.patch('/sessions/:id/status', studyPlanController_1.default.updateSessionStatus);
/**
 * PATCH /sessions/:id/remarks
 * Update session remarks
 * Body: { "remarks": "Need to review formulas again" }
 */
router.patch('/sessions/:id/remarks', studyPlanController_1.default.updateSessionRemarks);
exports.default = router;
//# sourceMappingURL=studyPlanRoutes.js.map