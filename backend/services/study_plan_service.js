import { PrismaClient } from '@prisma/client';
import logger from "../utils/logger.js";

/**
 * Service for managing study plans, including creation, retrieval, updating, and deletion.
 */
class StudyPlanService {
    /**
     * Initializes the StudyPlanService with a Prisma client and logger.
     * @constructor
     */
    constructor() {
        this.prisma = new PrismaClient();
        this.logger = logger;
    }

    /**
     * Creates a new study plan with optional study sessions.
     * @async
     * @param {Object} plan - The data for the new study plan.
     * @param {number} plan.userId - The ID of the user associated with the plan.
     * @param {string} plan.exam - The name of the exam.
     * @param {string} plan.studyDuration - The duration of the study plan (e.g., "3 months").
     * @param {number} plan.dailyHours - The number of hours to study per day.
     * @param {string[]} plan.subjects - An array of subjects to study.
     * @param {string[]} [plan.optionals=[]] - An optional array of optional subjects.
     * @param {string[]} [plan.studyStyle=[]] - An optional array describing the study style (e.g., ["Practice-oriented"]).
     * @param {number} [plan.numberOfAttempts=1] - An optional number of attempts for the exam.
     * @param {Object[]} [plan.studySessions=[]] - An optional array of study sessions to create with the plan.
     * @returns {Promise<Object>} The newly created study plan with associated study sessions.
     * @throws {Error} If there is an error creating the study plan.
     */
    async createPlan(plan) {
        try {
            this.logger.info("Creating new study plan");

            const savedPlan = await this.prisma.studyPlan.create({
                data: {
                    userId: plan.userId,
                    exam: plan.exam,
                    studyDuration: plan.studyDuration,
                    dailyHours: plan.dailyHours,
                    subjects: plan.subjects,
                    optionals: plan.optionals || [],
                    studyStyle: plan.studyStyle || [],
                    numberOfAttempts: plan.numberOfAttempts || 1
                }
            });

            if (plan.studySessions?.length > 0) {
                await this.createStudySessions(savedPlan.id, plan.studySessions);
            }

            this.logger.info("Study Plan Created:", savedPlan.id);
            return this.getPlanById(savedPlan.id);
        } catch (error) {
            this.logger.error("Error creating study plan:", error);
            throw error;
        }
    }

    /**
     * Creates multiple study sessions associated with a given study plan ID.
     * @async
     * @param {number} planId - The ID of the study plan to associate the sessions with.
     * @param {Object[]} sessions - An array of study session objects.
     * @param {number} sessions[].day - The day number for the session.
     * @param {string[]} sessions[].topics - An array of topics for the session.
     * @param {boolean} sessions[].completed - A boolean indicating if the session is completed.
     * @param {Object[]} sessions[].resources - An array of resources for the session.
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of created study sessions.
     */
    async createStudySessions(planId, sessions) {
        return Promise.all(sessions.map(session =>
            this.prisma.studySession.create({
                data: {
                    studyPlanId: planId,
                    day: String(session.day), // Convert to string
                    topics: session.topics,
                    completed: session.completed,
                    resources: {
                        create: session.resources
                    }
                }
            })
        ));
    }

    /**
     * Retrieves all study plans with their associated study sessions and resources.
     * @async
     * @returns {Promise<Array<Object>>} A promise that resolves to an array of all study plans.
     * @throws {Error} If there is an error fetching the study plans.
     */
    async getAllPlans() {
        try {
            this.logger.info("Fetching all study plans");
            return await this.prisma.studyPlan.findMany({
                include: this.getIncludeOptions()
            });
        } catch (error) {
            this.logger.error("Error fetching all plans:", error);
            throw error;
        }
    }

    /**
     * Retrieves a specific study plan by its ID, including associated study sessions and resources.
     * @async
     * @param {number} id - The ID of the study plan to retrieve.
     * @returns {Promise<Object>} A promise that resolves to the study plan with the given ID.
     * @throws {Error} If the ID is invalid or if the study plan is not found.
     */
    async getPlanById(id) {
        try {
            const validId = this.validateId(id);
            this.logger.info(`Fetching study plan with id: ${validId}`);

            const plan = await this.prisma.studyPlan.findUnique({
                where: { id: validId },
                include: this.getIncludeOptions()
            });

            if (!plan) {
                throw new Error(`Study plan with id ${validId} not found`);
            }
            return plan;
        } catch (error) {
            this.logger.error(`Error fetching plan with id ${id}:`, error);
            throw error;
        }
    }

    /**
     * Updates an existing study plan by its ID.
     * @async
     * @param {number} id - The ID of the study plan to update.
     * @param {Object} updatedPlan - An object containing the updated data for the study plan.
     * @param {string} [updatedPlan.exam] - The updated name of the exam.
     * @param {string} [updatedPlan.studyDuration] - The updated duration of the study plan.
     * @param {number} [updatedPlan.dailyHours] - The updated number of hours to study per day.
     * @param {string[]} [updatedPlan.subjects] - The updated array of subjects.
     * @param {string[]} [updatedPlan.optionals] - The updated array of optional subjects.
     * @param {string[]} [updatedPlan.studyStyle] - The updated array describing the study style.
     * @param {number} [updatedPlan.numberOfAttempts] - The updated number of attempts for the exam.
     * @param {Object[]} [updatedPlan.studySessions] - The updated array of study sessions. Existing sessions will be deleted and these new ones created.
     * @returns {Promise<Object>} A promise that resolves to the updated study plan with associated study sessions and resources.
     * @throws {Error} If the ID is invalid or if there is an error updating the study plan.
     */
    async updatePlanById(id, updatedPlan) {
        try {
            const validId = this.validateId(id);
            this.logger.info(`Updating study plan with id: ${validId}`);

            return await this.prisma.studyPlan.update({
                where: { id: validId },
                data: {
                    exam: updatedPlan.exam,
                    studyDuration: updatedPlan.studyDuration,
                    dailyHours: updatedPlan.dailyHours,
                    subjects: updatedPlan.subjects,
                    optionals: updatedPlan.optionals,
                    studyStyle: updatedPlan.studyStyle,
                    numberOfAttempts: updatedPlan.numberOfAttempts,
                    studySessions: {
                        deleteMany: {},
                        create: this.formatStudySessions(updatedPlan.studySessions)
                    }
                },
                include: this.getIncludeOptions()
            });
        } catch (error) {
            this.logger.error(`Error updating plan with id ${id}:`, error);
            throw error;
        }
    }

    /**
     * Deletes a study plan by its ID. Also deletes all associated study sessions.
     * @async
     * @param {number} id - The ID of the study plan to delete.
     * @returns {Promise<Object>} A promise that resolves to the deleted study plan with its associated data.
     * @throws {Error} If the ID is invalid or if the study plan is not found.
     */
    async deletePlanById(id) {
        try {
            this.logger.info(`Deleting study plan with id: ${id}`);

            // Validate id
            if (!id || isNaN(Number(id))) {
                throw new Error('Invalid study plan ID');
            }

            // First delete associated sessions
            await this.prisma.studySession.deleteMany({
                where: { studyPlanId: Number(id) }
            });

            // Then delete the plan
            const deletedPlan = await this.prisma.studyPlan.delete({
                where: {
                    id: Number(id)
                },
                include: this.getIncludeOptions()
            });

            this.logger.info(`Successfully deleted study plan ${id}`);
            return deletedPlan;

        } catch (error) {
            this.logger.error(`Error deleting plan with id ${id}:`, error);
            if (error.code === 'P2025') {
                throw new Error(`Study plan with id ${id} not found`);
            }
            throw error;
        }
    }

    /**
     * Returns the include options for Prisma queries to fetch associated study sessions and their resources.
     * @private
     * @returns {Object} The Prisma include options.
     */
    getIncludeOptions() {
        return {
            studySessions: {
                include: {
                    resources: true
                }
            }
        };
    }

    /**
     * Formats an array of study session objects for Prisma's createMany or create nested operations.
     * Converts the 'day' property to a string.
     * @private
     * @param {Object[]} sessions - An array of study session objects.
     * @returns {Object[]} An array of formatted study session data for Prisma.
     */
    formatStudySessions(sessions) {
        return sessions?.map(session => ({
            day: String(session.day), // Convert to string
            topics: session.topics,
            completed: session.completed,
            resources: {
                create: session.resources
            }
        })) || [];
    }

    /**
     * Validates if the provided ID is a valid number.
     * @private
     * @param {any} id - The ID to validate.
     * @returns {number} The validated ID as a number.
     * @throws {Error} If the ID is not a valid number.
     */
    validateId(id) {
        if (!id || isNaN(Number(id))) {
            throw new Error('Invalid study plan ID');
        }
        return Number(id);
    }

    /**
     * Returns an object containing predefined error messages for the StudyPlanService.
     * @readonly
     * @static
     * @returns {Object} The error messages object.
     */
    static get ERROR_MESSAGES() {
        return {
            INVALID_ID: 'Invalid study plan ID',
            NOT_FOUND: (id) => `Study plan with id ${id} not found`,
            VALIDATION_ERROR: 'Invalid study plan data'
        };
    }

    /**
     * Validates the essential data of a study plan object.
     * @private
     * @param {Object} plan - The study plan object to validate.
     * @throws {Error} If any of the required plan data is missing.
     */
    validatePlanData(plan) {
        if (!plan.userId) throw new Error(StudyPlanService.ERROR_MESSAGES.VALIDATION_ERROR);
        if (!plan.exam) throw new Error(StudyPlanService.ERROR_MESSAGES.VALIDATION_ERROR);
        if (!plan.studyDuration) throw new Error(StudyPlanService.ERROR_MESSAGES.VALIDATION_ERROR);
        if (!plan.dailyHours) throw new Error(StudyPlanService.ERROR_MESSAGES.VALIDATION_ERROR);
        if (!Array.isArray(plan.subjects)) throw new Error(StudyPlanService.ERROR_MESSAGES.VALIDATION_ERROR);
    }
}

// Create singleton instance
const studyPlanService = new StudyPlanService();
export default studyPlanService;