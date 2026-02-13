import { User } from './user';
import { ServiceEvent } from '../schemas';




// User events (published by User Service)
export interface UserCreatedEvent extends ServiceEvent {
  eventType: 'USER_CREATED';
  payload: {
    userId: string;
    email: string;
    name: string;
  };
}

export interface UserUpdatedEvent extends ServiceEvent {
  eventType: 'USER_UPDATED';
  payload: {
    userId: string;
    changes: Partial<User>;
  };
}

export interface UserDeletedEvent extends ServiceEvent {
  eventType: 'USER_DELETED';
  payload: {
    userId: string;
  };
}

// Study Plan events (published by AI Schedule Service)
export interface StudyPlanCreatedEvent extends ServiceEvent {
  eventType: 'STUDY_PLAN_CREATED';
  payload: {
    studyPlanId: number;
    userId: string;
    exam: string;
  };
}

export interface ScheduleGeneratedEvent extends ServiceEvent {
  eventType: 'SCHEDULE_GENERATED';
  payload: {
    scheduleId: number;
    studyPlanId: number;
    userId: string;
    type: string;
  };
}
