// import { PrismaClient } from '@prisma/client';
// import logger from '../utils/logger';
// import dotenv from 'dotenv';
// import axios from 'axios';
// import { AIAPIClient } from './ai-api-client';
// import {
//   StudyPlan,
//   Session,
//   Topic,
//   Break,
//   DayContent,
//   Schedule,
//   ScheduleMetadata
// } from '../types';

// dotenv.config();

// export class ScheduleService {
//   private readonly logger = logger;
//   private readonly prisma: PrismaClient;
//   private readonly aiClient: AIAPIClient;
//   private readonly userServiceUrl: string;

//   constructor() {
//     try {
//       this.logger.info('Initializing AI Schedule Service...');
//       this.prisma = new PrismaClient();
//       this.userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

//       const apiKey = process.env.GOOGLE_GENAI_API_KEY;
//       if (!apiKey || apiKey === 'your_api_key_here') {
//         this.handleFatalError('Valid GOOGLE_GENAI_API_KEY is required in your .env file');
//       }

//       this.aiClient = new AIAPIClient(apiKey);
//     } catch (error) {
//       this.handleFatalError(`Service initialization failed: ${(error as Error).message}`);
//     }
//   }

//   /**
//    * Generates a list of study topics for a given subject and day.
//    * The topics are retrieved from the AI client based on a dynamic prompt.
//    *
//    * @param subject - The subject to generate topics for.
//    * @param dayNumber - The study day number.
//    * @returns Promise resolving to an array of Topic objects.
//    */
//   private async generateTopicsForSubject(subject: string, dayNumber: number): Promise<Topic[]> {
//     const prompt = `Generate 3-5 topics for ${subject} study on day ${dayNumber}.
//       Return as a valid JSON array with this exact format:
//       [{"name": "topic name", "type": "NEW|REVISION|PRACTICE", "difficulty": 1-5, "duration": "30"}]`;

//     try {
//       const responseText = await this.aiClient.generateResult(prompt);
//       const jsonMatch = responseText.match(/\[.*\]/s);
//       return jsonMatch ? JSON.parse(jsonMatch[0]) : [];
//     } catch (error) {
//       this.logger.error(`Failed to generate or parse topics for ${subject}`, { error: (error as Error).message });
//       return [
//         { name: `${subject} Fundamentals`, type: "NEW", difficulty: 2, duration: "45" },
//         { name: `${subject} Key Concepts`, type: "REVISION", difficulty: 3, duration: "45" },
//       ];
//     }
//   }

//   /**
//    * Generates specific daily study targets for a given study plan and day.
//    *
//    * @param studyPlan - The study plan data.
//    * @param dayNumber - The study day number.
//    * @returns Promise resolving to an array of daily target strings.
//    */
//   private async generateDailyTargets(studyPlan: StudyPlan, dayNumber: number): Promise<string[]> {
//     const prompt = `Generate 3-5 specific study targets for day ${dayNumber} of ${studyPlan.exam} preparation.
//       Subjects: ${studyPlan.subjects.join(', ')}
//       Return as a valid JSON array of strings.`;

//     try {
//       const responseText = await this.aiClient.generateTargets(prompt);
//       const jsonMatch = responseText.match(/\[.*\]/s);
//       const parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
//       return Array.isArray(parsed) ? parsed : [`Study ${studyPlan.subjects[0]} concepts`];
//     } catch (error) {
//       this.logger.error('Failed to generate or parse daily targets.', { error: (error as Error).message });
//       return [
//         `Study ${studyPlan.subjects[0] || 'core'} concepts`,
//         `Review previous day's material`,
//       ];
//     }
//   }

//   /**
//    * Creates and saves a daily schedule in the database.
//    *
//    * @param studyPlan - The study plan for which to create the schedule.
//    * @param dayNumber - The current day number.
//    * @param totalDays - Total number of days in the study plan.
//    * @returns Promise resolving to the saved Schedule object.
//    */
//   async generateDaySchedule(studyPlan: StudyPlan, dayNumber: number, totalDays: number): Promise<Schedule> {
//     try {
//       if (!studyPlan) throw new Error('Study plan is required');
//       const userExists = await this.validateUser(studyPlan.userId);
//       if (!userExists) throw new Error(`User ${studyPlan.userId} not found`);

//       const content = await this.generateDayContent(studyPlan, dayNumber);
//       const metadata = this.generateDayMetadata(dayNumber, totalDays, studyPlan);

//       const schedule = await this.prisma.schedule.create({
//         data: {
//           type: 'DAILY',
//           studyPlanId: studyPlan.id,
//           userId: studyPlan.userId,
//           dayNumber: dayNumber,
//           focus: content.focus,
//           sessions: content.sessions as any,
//           breaks: content.breaks as any,
//           dailyTargets: content.dailyTargets as any,
//           metadata: metadata as any
//         },
//         include: { studyPlan: true }
//       });

//       this.logger.info('Schedule generated and saved successfully', { scheduleId: schedule.id });
//       return schedule as any;
//     } catch (error) {
//       this.logger.error('Schedule generation failed:', error);
//       throw new Error(`Failed to generate schedule: ${(error as Error).message}`);
//     }
//   }

//   /**
//    * Generates the content for a specific study day including sessions, breaks, and targets.
//    *
//    * @param studyPlan - The study plan.
//    * @param dayNumber - The current day number.
//    * @returns Promise resolving to a DayContent object.
//    */
//   async generateDayContent(studyPlan: StudyPlan, dayNumber: number): Promise<DayContent> {
//     const normalizedPlan = this.normalizeStudyPlan(studyPlan);
//     if (!normalizedPlan) throw new Error('Invalid study plan data');

//     const startTime = this.calculateDayStartTime(normalizedPlan.preferences?.startTime);
//     const sessionsPerDay = Math.floor(normalizedPlan.dailyHours / 2);

//     const sessions = await this.generateDaySessions(
//       normalizedPlan.subjects, startTime, sessionsPerDay, normalizedPlan, dayNumber
//     );
//     const [breaks, dailyTargets] = await Promise.all([
//       this.generateDayBreaks(sessions),
//       this.generateDailyTargets(normalizedPlan, dayNumber)
//     ]);

//     return {
//       focus: `Day ${dayNumber} Study: ${normalizedPlan.subjects[0]}`,
//       sessions: { set: sessions },
//       breaks,
//       dailyTargets
//     };
//   }

//   /**
//    * Generates a list of study sessions for a given day.
//    *
//    * @param subjects - List of subjects to study.
//    * @param startTime - The start time for the day.
//    * @param sessionsCount - Number of sessions in the day.
//    * @param studyPlan - The study plan.
//    * @param dayNumber - The current day number.
//    * @returns Promise resolving to an array of Session objects.
//    */
//   private async generateDaySessions(subjects: string[], startTime: string, sessionsCount: number, studyPlan: StudyPlan, dayNumber: number): Promise<Session[]> {
//     const sessions: Session[] = [];
//     let currentTime = new Date(`2000-01-01 ${startTime}`);
//     const avgSessionLen = (studyPlan.dailyHours / sessionsCount) * 60;

//     for (let i = 0; i < sessionsCount; i++) {
//       const subject = subjects[i % subjects.length];
//       const topics = await this.generateTopicsForSubject(subject, dayNumber);
//       const sessionDuration = topics.reduce((total, topic) => total + (parseInt(topic.duration || '0') || avgSessionLen), 0);

//       sessions.push({
//         time: currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
//         subject,
//         topics,
//         type: "STUDY",
//         duration: `${sessionDuration}min`,
//         recommendedPace: this.calculateStudyPace(topics)
//       });
//       currentTime.setMinutes(currentTime.getMinutes() + sessionDuration);
//     }
//     return sessions;
//   }

//   /**
//    * Calculates a recommended study pace based on topic difficulty.
//    *
//    * @param topics - Array of Topic objects.
//    * @returns Recommended pace as a string.
//    */
//   private calculateStudyPace(topics: Topic[]): string {
//     const avgDifficulty = topics.reduce((sum, t) => sum + (t.difficulty || 3), 0) / topics.length;
//     if (avgDifficulty >= 4) return "Take extra time";
//     if (avgDifficulty >= 3) return "Maintain steady pace";
//     return "Proceed quickly";
//   }

//   /**
//    * Generates a list of breaks between study sessions.
//    *
//    * @param sessions - Array of Session objects.
//    * @returns Array of Break objects.
//    */
//   private generateDayBreaks(sessions: Session[]): Break[] {
//     return sessions.slice(0, -1).map((session, index) => {
//       const sessionTime = new Date(`2000-01-01 ${session.time}`);
//       sessionTime.setMinutes(sessionTime.getMinutes() + parseInt(session.duration || '120'));
//       const breakType = index === Math.floor(sessions.length / 2) - 1
//         ? { duration: "45min", type: "LUNCH" as const }
//         : { duration: "15min", type: "SHORT" as const };
//       return {
//         time: sessionTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
//         ...breakType
//       };
//     });
//   }

//   /**
//    * Validates and normalizes a study plan object.
//    *
//    * @param plan - The original study plan.
//    * @returns Normalized StudyPlan object or null if invalid.
//    */
//   private normalizeStudyPlan(plan: StudyPlan): StudyPlan | null {
//     if (!plan || !plan.subjects?.length || !plan.dailyHours) return null;
//     return {
//       ...plan,
//       preferences: {
//         startTime: plan.preferences?.startTime || '09:00 AM',
//         ...plan.preferences
//       }
//     };
//   }

//   /**
//    * Determines the start time for the study day.
//    *
//    * @param startTime - Optional preferred start time.
//    * @returns A valid start time string.
//    */
//   private calculateDayStartTime(startTime?: string): string {
//     return startTime || '09:00 AM';
//   }

//   /**
//    * Validates whether a user exists by calling the user service.
//    *
//    * @param userId - The ID of the user to validate.
//    * @returns Promise resolving to true if the user exists, false otherwise.
//    */
//   private async validateUser(userId: string): Promise<boolean> {
//     try {
//       const response = await axios.get(`${this.userServiceUrl}/users/${userId}`, { timeout: 5000 });
//       return response.status === 200 && !!response.data;
//     } catch (error) {
//       this.logger.error('User validation failed', { userId, error: (error as Error).message });
//       return false;
//     }
//   }

//   /**
//    * Logs a fatal error and terminates the process.
//    *
//    * @param message - Error message.
//    * @throws Terminates the Node.js process with exit code 1.
//    */
//   private handleFatalError(message: string): never {
//     const errorMsg = `[FATAL ERROR] ${message}`;
//     this.logger.error({ level: 'fatal', message: errorMsg });
//     process.exit(1);
//   }
// }

// export default new ScheduleService();
