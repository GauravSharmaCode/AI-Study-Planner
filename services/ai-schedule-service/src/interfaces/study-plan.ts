export interface StudyPlan {
  id: number;
  userId: string; // Reference to User service (no FK)
  exam: string;
  studyDuration: string;
  dailyHours: number;
  subjects: string[];
  optionals?: string[];
  studyStyle?: string[];
  numberOfAttempts: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface StudyPreferences {
  startTime?: string;
  endTime?: string;
  breakDuration?: number;
  studyStyle?: 'visual' | 'auditory' | 'kinesthetic' | 'mixed';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}

export interface Schedule {
  id: number;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  studyPlanId: number;
  userId: string; // Reference to User service (no FK)
  dayNumber?: number;
  weekNumber?: number;
  focus: string;
  sessions: SessionData;
  breaks?: BreakData[];
  dailyTargets?: string[];
  weeklyTargets?: string[];
  metadata: ScheduleMetadata;
  createdAt: Date;
  updatedAt: Date;
}

export interface SessionData {
  set: Session[];
}

export interface Session {
  time: string;
  subject: string;
  topics: Topic[];
  type: 'STUDY' | 'REVISION' | 'TEST';
  duration: string;
  recommendedPace: string;
}

export interface Topic {
  name: string;
  type: 'NEW' | 'REVISION' | 'PRACTICE';
  difficulty: number;
  duration?: string;
  prerequisites?: string[];
  resources?: string[];
}

export interface BreakData {
  time: string;
  duration: string;
  type: 'SHORT' | 'LUNCH' | 'LONG' | 'RECREATION';
}

export interface ScheduleMetadata {
  currentDay?: number;
  totalDays?: number;
  currentWeek?: number;
  totalWeeks?: number;
  progress?: number;
  weekProgress?: number;
  dailyHours?: number;
  weeklyHours?: number;
  startDate?: string;
  endDate?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  revision?: boolean;
  weekType?: 'FOUNDATION' | 'CORE_CONCEPTS' | 'PRACTICE' | 'REVISION' | 'FINAL_REVISION';
}

export interface AIScheduleServiceRequest {
  action: 'CREATE_STUDY_PLAN' | 'GENERATE_SCHEDULE' | 'GET_SCHEDULES' | 'UPDATE_SCHEDULE' | 'DELETE_SCHEDULE';
  payload: Record<string, unknown>;
  userId: string;
}

export interface AIScheduleServiceResponse {
  success: boolean;
  data?: Schedule | StudyPlan | Schedule[];
  error?: string;
}
