export type TopicType = 'NEW' | 'REVISION' | 'PRACTICE';
export interface Topic {
    name: string;
    type: TopicType;
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
    resources?: string[];
}
export interface Session {
    startTime: string;
    endTime: string;
    subject: string;
    topics: Topic[];
    durationMinutes: number;
}
export type BreakType = 'SHORT' | 'LUNCH';
export interface Break {
    type: BreakType;
    durationMinutes: number;
}
export interface DailyTargets {
    conceptsToCover: number;
    practiceQuestions: number;
    revisionMinutes: number;
}
export interface DayContent {
    focus: string;
    sessions: Session[];
    breaks: Break[];
    dailyTargets: DailyTargets;
}
export type ScheduleType = 'DAILY' | 'WEEKLY';
export type ScheduleStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
export interface ScheduleMetadata {
    currentDay: number;
    totalDays: number;
    status: ScheduleStatus;
}
export interface Schedule {
    id: number;
    type: ScheduleType;
    studyPlanId: number;
    userId: string;
    dayNumber: number;
    focus: string;
    sessions: Session[];
    breaks: Break[];
    dailyTargets: DailyTargets;
    metadata: ScheduleMetadata;
}
export interface StudyPlan {
    id: number;
    userId: string;
    subjects: string[];
    dailyHours: number;
    daysPerWeek: number;
    totalWeeks: number;
    preferences?: {
        startTime?: string;
    };
}
//# sourceMappingURL=index.d.ts.map