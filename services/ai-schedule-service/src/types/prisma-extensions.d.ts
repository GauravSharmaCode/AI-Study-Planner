import { StudyPlan as OriginalStudyPlan, StudySession as OriginalStudySession } from "@prisma/client";

declare module "@prisma/client" {
  export interface StudyPlan extends OriginalStudyPlan {
    examName?: string;
    preferredStartTime: string;
    isActive: boolean;
  }

  export interface StudySession extends OriginalStudySession {
    plannedMinutes: number;
    completedMinutes?: number;
    isRevision: boolean;
    startTime: string; // Already exists but redefining for clarity
    endTime: string;   // Already exists
  }
}

// Alternatively, just export extended types for internal use if module augmentation is tricky
export interface ExtendedStudyPlan extends OriginalStudyPlan {
    examName?: string | null;
    preferredStartTime: string;
    isActive: boolean;
}

export interface ExtendedStudySession extends OriginalStudySession {
    plannedMinutes: number;
    completedMinutes: number | null;
    isRevision: boolean;
}
