"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudyPlanController = void 0;
const studyPlanService_1 = __importDefault(require("../services/studyPlanService"));
const logger_1 = __importDefault(require("../utils/logger"));
class StudyPlanController {
    /**
     * POST /plans/generate
     * Generate AI-based study plan
     */
    async generateStudyPlan(req, res) {
        try {
            const { subjects, availableHoursPerDay, targetCompletionDate, userId } = req.body;
            // Validate required fields
            if (!subjects || !availableHoursPerDay || !targetCompletionDate || !userId) {
                res.status(400).json({
                    error: 'Missing required fields: subjects, availableHoursPerDay, targetCompletionDate, userId'
                });
                return;
            }
            const result = await studyPlanService_1.default.createPlan({
                subjects,
                availableHoursPerDay,
                targetCompletionDate,
                userId
            });
            res.status(201).json(result);
        }
        catch (error) {
            logger_1.default.error('Controller: Error generating study plan:', error);
            res.status(500).json({
                error: 'Failed to generate study plan',
                message: error.message
            });
        }
    }
    /**
     * GET /plans/:id
     * Get existing study plan
     */
    async getStudyPlan(req, res) {
        try {
            const { id } = req.params;
            const result = await studyPlanService_1.default.getPlanById(id);
            if (!result) {
                res.status(404).json({ error: 'Study plan not found' });
                return;
            }
            res.status(200).json(result);
        }
        catch (error) {
            logger_1.default.error('Controller: Error fetching study plan:', error);
            res.status(500).json({
                error: 'Failed to fetch study plan',
                message: error.message
            });
        }
    }
    /**
     * PATCH /sessions/:id/status
     * Update session status
     */
    async updateSessionStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            await studyPlanService_1.default.updateSessionStatus(id, status);
            res.status(200).json({ message: 'Session updated' });
        }
        catch (error) {
            logger_1.default.error('Controller: Error updating session status:', error);
            // Handle validation errors with 400 status
            if (error.message.includes('Invalid status')) {
                res.status(400).json({ error: error.message });
                return;
            }
            res.status(500).json({
                error: 'Failed to update session',
                message: error.message
            });
        }
    }
    /**
     * PATCH /sessions/:id/remarks
     * Update session remarks
     */
    async updateSessionRemarks(req, res) {
        try {
            const { id } = req.params;
            const { remarks } = req.body;
            await studyPlanService_1.default.updateSessionRemarks(id, remarks);
            res.status(200).json({ message: 'Remarks updated' });
        }
        catch (error) {
            logger_1.default.error('Controller: Error updating session remarks:', error);
            res.status(500).json({
                error: 'Failed to update remarks',
                message: error.message
            });
        }
    }
}
exports.StudyPlanController = StudyPlanController;
exports.default = new StudyPlanController();
//# sourceMappingURL=studyPlanController.js.map