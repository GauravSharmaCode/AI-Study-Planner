interface CreatePlanRequest {
    subjects: string[];
    availableHoursPerDay: number;
    targetCompletionDate: string;
    userId: string;
}
interface StudyPlan {
    id: string;
    userId: string;
    subjects: string[];
    availableHoursPerDay: number;
    targetCompletionDate: Date;
    plan: any;
    createdAt: Date;
    updatedAt: Date;
}
declare class StudyPlanService {
    private prisma;
    private logger;
    private aiClient;
    /**
     * Initializes the studyPlanService with a new PrismaClient and logger.
     * @constructor
     */
    constructor();
    /**
     * Create a new study plan with AI-generated content
     */
    createPlan(data: CreatePlanRequest): Promise<{
        planId: string;
        plan: any;
    }>;
    /**
     * Get a study plan by ID
     */
    getPlanById(id: string): Promise<{
        planId: string;
        plan: any;
    } | null>;
    /**
     * Get all plans for a user
     */
    getAllPlans(userId: string): Promise<StudyPlan[]>;
    /**
     * Update a study plan by ID
     */
    updatePlanById(id: string, updateData: Partial<CreatePlanRequest>): Promise<StudyPlan | null>;
    /**
     * Delete a study plan by ID
     */
    deletePlanById(id: string): Promise<boolean>;
    /**
     * Update session status
     */
    updateSessionStatus(sessionId: string, status: string): Promise<void>;
    /**
     * Update session remarks
     */
    updateSessionRemarks(sessionId: string, remarks: string): Promise<void>;
    /**
     * Private method to validate input data
     */
    private validateCreatePlanInput;
    /**
     * Private method to generate study plan content using AI
     */
    private generateStudyPlanContent;
    /**
     * Private method to generate fallback plan when AI fails
     */
    private generateFallbackPlan;
    /**
     * Private method to create individual session records from plan JSON
     */
    private createSessionsFromPlan;
    /**
     * Cleanup database connections
     */
    disconnect(): Promise<void>;
}
declare const _default: StudyPlanService;
export default _default;
//# sourceMappingURL=studyPlanService.d.ts.map