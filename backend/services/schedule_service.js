import { GoogleGenAI, Type } from "@google/genai";
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

class ScheduleService {
    constructor() {
        try {
            // Initialize logger first for error capture
            this.logger = logger || console;
            this.logger.info('Initializing Schedule Service...');

            // Initialize Prisma client
            this.prisma = new PrismaClient();

            // Verify API key and initialize AI
            const apiKey = process.env.GOOGLE_GENAI_API_KEY;
            if (!apiKey || apiKey === 'your_api_key_here') {
                this.handleFatalError('Valid GOOGLE_GENAI_API_KEY is required');
            }

            // Initialize AI with explicit key
            this.ai = new GoogleGenAI({
                apiKey: apiKey,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1024
                }
            });

            // Test AI connection
            this.verifyAIServiceOrExit();

        } catch (error) {
            this.handleFatalError(`Service initialization failed: ${error.message}`);
        }
    }

    /**
     * Verifies AI service or exits process
     * @private
     */
    async verifyAIServiceOrExit() {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: 'test',
                config: {
                    temperature: 0.1
                }
            });

            if (!response?.text) {
                this.handleFatalError('AI service verification failed - no response');
            }

            this.logger.info('AI service verified successfully');
        } catch (error) {
            this.handleFatalError(`AI service verification failed: ${error.message}`);
        }
    }

    /**
     * Handles fatal errors by logging and exiting process
     * @private
     * @param {string} message - Error message
     */
    handleFatalError(message) {
        const errorMsg = `[FATAL ERROR] ${message}`;
        
        if (!this.logger) {
            // Initialize logger if not exists
            this.logger = logger || console;
        }

        // Log fatal error with proper formatting
        this.logger.error({
            level: 'fatal',
            message: errorMsg,
            timestamp: new Date().toISOString(),
            service: 'ScheduleService'
        });

        // Exit with failure code
        process.exit(1);
    }

    /**
     * Validates the structure of a study plan.
     * @param {Object} studyPlan - The study plan to validate.
     * @param {number} studyPlan.id - The ID of the study plan.
     * @param {number} studyPlan.userId - The user ID associated with the study plan.
     * @throws {Error} If the study plan is invalid.
     */
    async validateStudyPlan(studyPlan) {
        if (!studyPlan?.id || !studyPlan?.userId) {
            throw new Error('Invalid study plan: missing required fields');
        }
        if (!Array.isArray(studyPlan.subjects) || studyPlan.subjects.length === 0) {
            throw new Error('Invalid study plan: subjects are required');
        }
    }


    /**
     * Validates the parameters for generating a schedule.
     * @param {number} dayNumber - The current day number.
     * @param {number} totalDays - The total number of days in the schedule.
     * @throws {Error} If the parameters are invalid.
     */
    async     validateScheduleParams(dayNumber, totalDays) {
        if (!Number.isInteger(dayNumber) || dayNumber < 1) {
            throw new Error('Invalid day number');
        }
        if (!Number.isInteger(totalDays) || totalDays < dayNumber) {
            throw new Error('Invalid total days');
        }
    }


    /**
     * Generates the content for a specific day in the study plan.
     * @async
     * @param {Object} studyPlan - The study plan for which to generate content.
     * @param {number} dayNumber - The day number for which to generate content.
     * @returns {Promise<Object>} The generated content for the day.
     * @throws {Error} If content generation fails.
     */
    async generateDayContent(studyPlan, dayNumber) {
        try {
            if (!studyPlan || !dayNumber) {
                throw new Error('Missing required parameters');
            }

            // Normalize study plan data
            const normalizedPlan = this.normalizeStudyPlan(studyPlan);
            if (!normalizedPlan) {
                throw new Error('Invalid study plan data');
            }

            // Calculate times
            const startTime = this.calculateDayStartTime(
                normalizedPlan.preferences?.startTime || "09:00"
            );
            const sessionsPerDay = Math.floor(normalizedPlan.dailyHours / 2);

            // Generate sessions first since breaks depend on them
            const sessions = await this.generateDaySessions(
                normalizedPlan.subjects,
                startTime,
                sessionsPerDay,
                normalizedPlan,
                dayNumber
            );

            // Now generate breaks and targets since sessions are available
            const [breaks, dailyTargets] = await Promise.all([
                this.generateDayBreaks(sessions),
                this.generateDailyTargets(normalizedPlan, dayNumber)
            ]);

            return {
                focus: `Day ${dayNumber} Study: ${normalizedPlan.subjects[0]}`,
                sessions: { set: sessions },
                breaks,
                dailyTargets
            };

        } catch (error) {
            this.logger.error('Error generating content:', error);
            throw new Error(`error: Failed to generate content - ${error.message}`);
        }
    }

    /**
     * Generates session schedule for a day
     * @private
     * @param {string[]} subjects - List of subjects to study
     * @param {string} startTime - Day start time
     * @param {number} sessionsCount - Number of sessions to generate
* @param {Object} studyPlan - Study plan for context
     * @param {number} dayNumber - Current day number
     * @returns {Promise<Array>} Array of session objects
     */
async generateDaySessions(subjects, startTime, sessionsCount, studyPlan, dayNumber) {
    try {
        const sessions = [];
        if (!Array.isArray(subjects) || subjects.length === 0) {
            throw new Error('Invalid subjects array');
        }

        let currentTime = new Date(`2000-01-01 ${startTime}`);
        const totalHoursPerDay = studyPlan.dailyHours;
        const averageSessionLength = (totalHoursPerDay / sessionsCount) * 60; // in minutes

        for (let i = 0; i < sessionsCount; i++) {
            const subjectIndex = i % subjects.length;
            const subject = subjects[subjectIndex];

            // Get topics with their recommended durations
            const topics = await this.generateTopicsForSubject(
                subject,
                dayNumber,
                studyPlan
            );

            // Calculate session duration based on topics
            const sessionDuration = topics.reduce((total, topic) => {
                return total + (parseInt(topic.duration) || averageSessionLength);
            }, 0);

            sessions.push({
                time: currentTime.toLocaleTimeString('en-US', { 
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true 
                }),
                subject: subject,
                topics: topics,
                type: "STUDY",
                duration: `${sessionDuration}min`,
                recommendedPace: this.calculateStudyPace(topics)
            });

            // Add dynamic duration for next session
            currentTime.setMinutes(currentTime.getMinutes() + sessionDuration);
        }

        return sessions;
    } catch (error) {
        this.logger.error('Error generating sessions:', error);
        throw new Error(`Failed to generate sessions: ${error.message}`);
    }
}

/**
 * Calculates recommended study pace based on topics
 * @private
 * @param {Array} topics - Array of topics with difficulty levels
 * @returns {string} Recommended pace description
 */
calculateStudyPace(topics) {
    const avgDifficulty = topics.reduce((sum, t) => sum + (t.difficulty || 3), 0) / topics.length;
    
    if (avgDifficulty >= 4) return "Take extra time for complex concepts";
    if (avgDifficulty >= 3) return "Maintain steady pace";
    return "Can proceed quickly if concepts are clear";
}

    /**
     * Generates breaks between sessions
     * @private
     * @param {Array} sessions - Array of study sessions
     * @returns {Array} Array of break objects
     */
    generateDayBreaks(sessions) {
        const breaks = [];
        
        sessions.forEach((session, index) => {
            if (index < sessions.length - 1) {
                const sessionTime = new Date(`2000-01-01 ${session.time}`);
                sessionTime.setHours(sessionTime.getHours() + 2); // After 2-hour session

                const breakType = index === Math.floor(sessions.length / 2) - 1 
                    ? { duration: "45min", type: "LUNCH" }
                    : { duration: "15min", type: "SHORT" };

                breaks.push({
                    time: sessionTime.toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                    }),
                    ...breakType
                });
            }
        });

        return breaks;
    }

    /**
     * Generates a daily schedule for a study plan.
     * @async
     * @param {Object} studyPlan - The study plan for which to generate the schedule.
     * @param {number} dayNumber - The current day number.
     * @param {number} totalDays - The total number of days in the schedule.
     * @returns {Promise<Object>} The generated daily schedule.
     * @throws {Error} If schedule generation fails.
     */
    async generateDaySchedule(studyPlan, dayNumber, totalDays) {
        try {
            // Validate input parameters
            if (!studyPlan) {
                throw new Error('Study plan is required');
            }
            
            // Generate content before creating schedule
            const content = await this.generateDayContent(studyPlan, dayNumber);
            const metadata = await this.generateDayMetadata(dayNumber, totalDays, studyPlan);

            // Ensure content has required structure
            if (!content.sessions || !content.sessions.set) {
                throw new Error('Invalid content structure');
            }

            const schedule = await this.prisma.schedule.create({
                data: {
                    type: 'DAILY',
                    studyPlanId: studyPlan.id,
                    userId: studyPlan.userId,
                    dayNumber: dayNumber,
                    focus: content.focus,
                    sessions: content.sessions,
                    breaks: content.breaks || [],
                    dailyTargets: content.dailyTargets || [],
                    metadata: metadata
                },
                include: {
                    studyPlan: true,
                    user: true
                }
            });

            // Validate created schedule
            if (!schedule || !schedule.sessions || !schedule.sessions.set) {
                throw new Error('Failed to create valid schedule structure');
            }

            return schedule;
        } catch (error) {
            this.logger.error('Schedule generation failed:', error);
            throw new Error(`Failed to generate schedule: ${error.message}`);
        }
    }

    /**
     * Generates a weekly schedule for a study plan.
     * @async
     * @param {Object} studyPlan - The study plan for which to generate the schedule.
     * @param {number} weekNumber - The current week number.
     * @param {number} totalWeeks - The total number of weeks in the schedule.
     * @returns {Promise<Object>} The generated weekly schedule.
     * @throws {Error} If schedule generation fails.
     */
    async generateWeekSchedule(studyPlan, weekNumber, totalWeeks) {
        try {
            await this.validateStudyPlan(studyPlan);
            if (!weekNumber || !totalWeeks || weekNumber > totalWeeks) {
                throw new Error('Invalid week parameters');
            }

            const weekContent = await this.generateWeekContent(studyPlan, weekNumber, totalWeeks);
            const metadata = await this.generateWeekMetadata(weekNumber, totalWeeks, studyPlan);

            const schedule = await this.prisma.schedule.create({
                data: {
                    type: 'WEEKLY',
                    studyPlanId: studyPlan.id,
                    userId: studyPlan.userId,
                    weekNumber: weekNumber,
                    focus: weekContent.focus,
                    sessions: {
                        monday: weekContent.monday,
                        tuesday: weekContent.tuesday,
                        wednesday: weekContent.wednesday,
                        thursday: weekContent.thursday,
                        friday: weekContent.friday,
                        saturday: weekContent.saturday,
                        sunday: weekContent.sunday
                    },
                    weeklyTargets: weekContent.weeklyTargets,
                    weeklyTests: weekContent.weeklyTests,
                    breaks: this.generateWeeklyBreaks(),
                    metadata: metadata
                },
                include: {
                    studyPlan: true,
                    user: true
                }
            });

            return schedule;
        } catch (error) {
            this.logger.error('Error generating weekly schedule:', error);
            throw new Error(`Failed to generate weekly schedule: ${error.message}`);
        }
    }

    /**
     * Generates metadata for a specific day in the schedule.
     * @param {number} dayNumber - The current day number.
     * @param {number} totalDays - The total number of days in the schedule.
     * @param {Object} studyPlan - The study plan object.
     * @returns {Object} The metadata for the day.
     */
    async generateDayMetadata(dayNumber, totalDays, studyPlan) {
        if (!dayNumber || !totalDays || !studyPlan) {
            throw new Error('Missing required parameters for metadata generation');
        }

        return {
            currentDay: dayNumber,
            totalDays: totalDays,
            progress: (dayNumber / totalDays) * 100,
            dailyHours: studyPlan.dailyHours,
            status: 'PENDING'
        };
    }

    /**
     * Generates metadata for a specific week in the schedule.
     * @param {number} weekNumber - The current week number.
     * @param {number} totalWeeks - The total number of weeks in the schedule.
     * @param {Object} studyPlan - The study plan object.
     * @returns {Object} The metadata for the week.
     */
    async generateWeekMetadata(weekNumber, totalWeeks, studyPlan) {
        return {
            currentWeek: weekNumber,
            totalWeeks: totalWeeks,
            weekProgress: (weekNumber / totalWeeks) * 100,
            weeklyHours: studyPlan.dailyHours * 7,
            startDate: this.calculateWeekStartDate(weekNumber),
            endDate: this.calculateWeekEndDate(weekNumber),
            status: 'PENDING',
            revision: weekNumber % 4 === 0, // Every 4th week is revision
            weekType: this.determineWeekType(weekNumber, totalWeeks)
        };
    }

    /**
     * Determines the type of week based on its position in the schedule.
     * @private
     * @param {number} weekNumber - Current week number
     * @param {number} totalWeeks - Total weeks in schedule
     * @returns {string} The type of week
     */
    determineWeekType(weekNumber, totalWeeks) {
        if (weekNumber === 1) return 'FOUNDATION';
        if (weekNumber === totalWeeks) return 'FINAL_REVISION';
        if (weekNumber % 4 === 0) return 'REVISION';
        if (weekNumber % 2 === 0) return 'PRACTICE';
        return 'CORE_CONCEPTS';
    }

    /**
     * Generates standard weekly breaks schedule.
     * @private
     * @returns {Object} Weekly breaks configuration
     */
    generateWeeklyBreaks() {
        return {
            dailyBreaks: [
                { time: "11:00 AM", duration: "15min", type: "SHORT" },
                { time: "1:00 PM", duration: "45min", type: "LUNCH" },
                { time: "4:00 PM", duration: "15min", type: "SHORT" }
            ],
            weekendBreaks: [
                { time: "11:30 AM", duration: "30min", type: "LONG" },
                { time: "2:00 PM", duration: "60min", type: "RECREATION" }
            ]
        };
    }

    /**
     * Generates content for a specific week in the study plan.
     * @async
     * @param {Object} studyPlan - The study plan for which to generate content.
     * @param {number} weekNumber - The week number for which to generate content.
     * @param {number} totalWeeks - The total number of weeks in the schedule.
     * @returns {Promise<Object>} The generated content for the week.
     * @throws {Error} If content generation fails.
     */
    async generateWeekContent(studyPlan, weekNumber, totalWeeks) {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `Generate week ${weekNumber} schedule for ${studyPlan.exam}.
            Include:
            - Weekly focus
            - Weekly targets
            - Daily subjects and topics`,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.2,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            'focus': {
                                type: Type.STRING,
                                description: 'Weekly focus area'
                            },
                            'weeklyTargets': {
                                type: Type.ARRAY,
                                items: { type: Type.STRING }
                            }
                        },
                        required: ['focus', 'weeklyTargets']
                    }
                }
            });

            return JSON.parse(response.text);
        } catch (error) {
            this.logger.error('Error generating week content:', error);
            return {
                focus: `Week ${weekNumber} Core Studies`,
                weeklyTargets: [`Master ${studyPlan.subjects[0]}`]
            };
        }
    }

    // Only keep essential CRUD operations
    async getScheduleById(id) {
        try {
            const schedule = await this.prisma.schedule.findUnique({
                where: { id: Number(id) },
                include: {
                    studyPlan: true,
                    user: true
                }
            });

            if (!schedule) {
                throw new Error(`Schedule with id ${id} not found`);
            }

            return schedule;
        } catch (error) {
            // Ensure 'this.logger' is defined before using it
            if (console && console.error) {
                console.error(`Error fetching schedule ${id}:`, error);
            }
            // if (this.logger && this.logger.error) {
            //     this.logger.error(`Error fetching schedule ${id}:`, error);
            // }
            throw error;
        }
    }

    async getSchedulesByStudyPlan(studyPlanId) {
        try {
            return await this.prisma.schedule.findMany({
                where: {
                    studyPlanId: parseInt(studyPlanId)
                },
                orderBy: [
                    { weekNumber: 'asc' },
                    { dayNumber: 'asc' }
                ]
            });
        } catch (error) {
            // Ensure 'logger' is defined before using it
            if (console && console.error) {
                console.error(`Error fetching schedules for study plan ${studyPlanId}:`, error);
            }
            // if (logger && logger.error) {
            //     logger.error(`Error fetching schedules for study plan ${studyPlanId}:`, error);
            // }
            throw error;
        }
    }

    async updateSchedule(scheduleId, updatedData) {
        // Ensure 'logger' is defined before using it
        if (console && console.info) {
            console.info('Update Schedule Request:', {
                scheduleId,
                data: JSON.stringify(updatedData, null, 2)
            });
        }
        // if (logger && logger.info) {
        //     logger.info('Update Schedule Request:', {
        //         scheduleId,
        //         data: JSON.stringify(updatedData, null, 2)
        //     });
        // }
        try {
            const updated = await this.prisma.schedule.update({
                where: { id: scheduleId },
                data: updatedData
            });
            // Ensure 'logger' is defined before using it
            if (console && console.info) {
                console.info('Updated Schedule:', JSON.stringify(updated, null, 2));
            }
            // if (logger && logger.info) {
            //     logger.info('Updated Schedule:', JSON.stringify(updated, null, 2));
            // }
            return updated;
        } catch (error) {
            // Ensure 'logger' is defined before using it
            if (console && console.error) {
                console.error(`Error updating schedule ${scheduleId}:`, error);
            }
            // if (logger && logger.error) {
            //     logger.error(`Error updating schedule ${scheduleId}:`, error);
            // }
            throw error;
        }
    }

    async deleteSchedule(id) {
        try {
            return await this.prisma.schedule.delete({
                where: { id: Number(id) }
            });
        } catch (error) {
            // Ensure 'this.logger' is defined before using it
            if (console && console.error) {
                console.error(`Error deleting schedule ${id}:`, error);
            }
            // if (this.logger && this.logger.error) {
            //     this.logger.error(`Error deleting schedule ${id}:`, error);
            // }
            throw error;
        }
    }

    // Add helper methods for weekly schedule
    calculateWeekStartDate(weekNumber) {
        const startDate = new Date();
        const daysToAdd = (weekNumber - 1) * 7;
        startDate.setDate(startDate.getDate() + daysToAdd);
        return startDate.toISOString().split('T')[0];
    }

    calculateWeekEndDate(weekNumber) {
        const endDate = new Date();
        const daysToAdd = (weekNumber - 1) * 7 + 6;
        endDate.setDate(endDate.getDate() + daysToAdd);
        return endDate.toISOString().split('T')[0];
    }

    /**
     * Calculates the start time for a day's schedule
     * @private
     * @param {string} preferredTime - Preferred start time in "HH:mm" format
     * @returns {string} Formatted start time
     */
    calculateDayStartTime(preferredTime) {
        try {
            // Parse the preferred time or use default
            const [hours, minutes] = (preferredTime || "09:00").split(':');
            const time = new Date();
            time.setHours(parseInt(hours, 10));
            time.setMinutes(parseInt(minutes, 10));

            // Format time to 12-hour format
            return time.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            this.logger.error('Error calculating start time:', error);
            return "9:00 AM"; // Default fallback
        }
    }

    /**
     * Generates topics for a subject based on study progress and exam requirements
     * @private
     * @param {string} subject - Subject to generate topics for
     * @param {number} dayNumber - Current day in study plan
     * @param {Object} studyPlan - Complete study plan with progress
     * @returns {Promise<Array>} Array of topics with metadata
     */
    async generateTopicsForSubject(subject, dayNumber, studyPlan) {
        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `Generate topics for ${subject} study on day ${dayNumber}`,
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: {
                        type: Type.ARRAY,
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                'name': { type: Type.STRING },
                                'type': { type: Type.STRING },
                                'difficulty': { type: Type.NUMBER }
                            }
                        }
                    }
                }
            });

            return JSON.parse(response.text);
        } catch (error) {
            this.logger.error(`Error generating topics:`, error);
            return [{ name: `${subject} Basics`, type: "NEW", difficulty: 1 }];
        }
    }

    /**
     * Generates daily targets based on study plan and progress
     * @private
     * @param {Object} studyPlan - The study plan object
     * @param {number} dayNumber - Current day number
     * @returns {Promise<Array<string>>} Array of daily targets
     */
    async generateDailyTargets(studyPlan, dayNumber) {
        if (!this.ai) {
            throw new Error('AI service not initialized');
        }

        try {
            const response = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: `Generate 3-5 specific study targets for day ${dayNumber} of ${studyPlan.exam} preparation.
            Consider subjects: ${studyPlan.subjects.join(', ')}
            Format: Return array of target strings`,
                generationConfig: {
                    temperature: 0.2,
                    maxOutputTokens: 1024,
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_DANGEROUS",
                            threshold: "BLOCK_NONE"
                        }
                    ]
                }
            });

            // Proper response validation
            if (!response?.response) {
                throw new Error('Empty response from AI');
            }

            const text = response.response.text();
            if (!text) {
                throw new Error('Empty text in AI response');
            }

            // Attempt to parse as JSON
            try {
                const parsed = JSON.parse(text);
                if (!Array.isArray(parsed)) {
                    return [`Study ${studyPlan.subjects[0]} concepts`];
                }
                return parsed;
            } catch (parseError) {
                // If JSON parsing fails, try to extract targets from text
                const lines = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0)
                    .slice(0, 5);
                    
                return lines.length ? lines : [`Study ${studyPlan.subjects[0]} concepts`];
            }

        } catch (error) {
            this.logger.error('AI request failed:', error);
            // Return fallback targets instead of throwing
            return [`Study ${studyPlan.subjects[0] || 'core'} concepts`];
        }
    }

    /**
     * Updates study plan data with corrected ID
     * @private
     * @param {Object} studyPlan - Raw study plan data
     * @returns {Object} Normalized study plan
     */
    normalizeStudyPlan(studyPlan) {
        if (!studyPlan) return null;

        return {
            ...studyPlan,
            id: parseInt(studyPlan.id),
            subjects: Array.isArray(studyPlan.subjects) ? studyPlan.subjects : [],
            dailyHours: parseInt(studyPlan.dailyHours) || 6,
            preferences: studyPlan.preferences || {}
        };
    }

    /**
     * Base method for AI content generation
     * @private
     * @param {string} prompt - The prompt for AI
     * @returns {Promise<any>} Parsed AI response
     */
    async generateAIContent(prompt) {
        try {
            // Log the request
            this.logger.info('AI Request:', {
                timestamp: new Date().toISOString(),
                model: 'gemini-2.0-flash',
                prompt: prompt
            });

            const requestStart = performance.now();

            // Generate content with schema validation
            const result = await this.ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: prompt,
                config: {
                    responseMimeType: 'application/json',
                    temperature: 0.2,
                    maxOutputTokens: 1024,
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            focus: {
                                type: Type.STRING,
                                description: 'Focus area for the study session'
                            },
                            topics: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT,
                                    properties: {
                                        name: { type: Type.STRING },
                                        type: { 
                                            type: Type.STRING,
                                            enum: ['NEW', 'REVISION', 'PRACTICE']
                                        },
                                        difficulty: { 
                                            type: Type.NUMBER,
                                            minimum: 1,
                                            maximum: 5
                                        },
                                        duration: { type: Type.STRING },
                                        prerequisites: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        },
                                        resources: {
                                            type: Type.ARRAY,
                                            items: { type: Type.STRING }
                                        }
                                    },
                                    required: ['name', 'type', 'difficulty']
                                }
                            }
                        },
                        required: ['focus', 'topics']
                    }
                }
            });

            const requestDuration = performance.now() - requestStart;

            // Log response
            this.logger.info('AI Response:', {
                timestamp: new Date().toISOString(),
                duration: `${requestDuration.toFixed(2)}ms`,
                status: 'success'
            });

            // Schema validation ensures proper JSON structure
            return result.response.text();

        } catch (error) {
            this.logger.error('AI Request Failed:', {
                timestamp: new Date().toISOString(),
                error: error.message,
                prompt: prompt.substring(0, 100) + '...',
                stack: error.stack
            });
            throw new Error(`AI content generation failed: ${error.message}`);
        }
    }
}

// Change export to expose both class and instance
export { ScheduleService };   // Export class
export default new ScheduleService();   // Export singleton instance