/**
 * Deterministic Scheduling Engine
 *
 * Pure functions that convert study plan inputs + AI topic estimates
 * into a reproducible, balanced daily schedule.
 *
 * No side effects — no DB, no AI calls. Fully testable.
 */

// ─── Types ──────────────────────────────────────────────────────────

export interface TopicEstimate {
  name: string;
  subject: string;
  estimatedHours: number;
  difficulty: 'easy' | 'medium' | 'hard';
  generateRevisions?: boolean; // Default true. If false, no revisions generated.
}

export interface NormalizedTopic extends TopicEstimate {
  normalizedWeight: number; // estimatedHours * difficultyMultiplier
  totalMinutes: number; // normalizedWeight * 60
}

export interface ScheduleInput {
  targetCompletionDate: Date;
  availableHoursPerDay: number;
  preferredStartTime: string; // "HH:mm"
  subjects: string[];
  topicEstimates: TopicEstimate[];
}

export interface TimeBlock {
  topic: string;
  subject: string;
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  plannedMinutes: number;
  isRevision: boolean;
}

export interface DayPlan {
  date: Date;
  blocks: TimeBlock[];
  totalMinutes: number;
}

export interface CapacityResult {
  totalDays: number;
  totalCapacityMinutes: number;
  dailyAvailableMinutes: number;
}

export interface ScheduleResult {
  days: DayPlan[];
  metadata: {
    totalDays: number;
    totalTopics: number;
    totalSessionCount: number;
    totalRevisionCount: number;
    totalPlannedMinutes: number;
  };
}

export class OverloadError extends Error {
  public readonly workloadMinutes: number;
  public readonly capacityMinutes: number;
  public readonly suggestedMinHours: number;

  constructor(
    workloadMinutes: number,
    capacityMinutes: number,
    totalDays: number,
  ) {
    const suggestedMinHours =
      Math.ceil((workloadMinutes / totalDays / 60) * 10) / 10;
    super(
      `Schedule overloaded: ${workloadMinutes} minutes needed but only ${capacityMinutes} minutes available. ` +
        `Suggest increasing daily hours to at least ${suggestedMinHours}h or extending the target date.`,
    );
    this.name = "OverloadError";
    this.workloadMinutes = workloadMinutes;
    this.capacityMinutes = capacityMinutes;
    this.suggestedMinHours = suggestedMinHours;
  }
}

// ─── Constants ──────────────────────────────────────────────────────

const DIFFICULTY_MULTIPLIERS: Record<string, number> = {
  easy: 1.0,
  medium: 1.25,
  hard: 1.5,
};

const MAX_SESSION_MINUTES = 90;
const MIN_SESSION_MINUTES = 30;
const BREAK_MINUTES = 10;

/** Spaced revision intervals (days after topic completion) */
const REVISION_INTERVALS = [3, 7, 14];

/** Revision sessions are 25% of the original topic duration */
const REVISION_DURATION_RATIO = 0.25;

/** Max days to look ahead for a revision slot if the target day is full */
const REVISION_LOOKAHEAD_DAYS = 3;

// ─── Core Functions ─────────────────────────────────────────────────

/**
 * Step 0: Compute scheduling capacity.
 *
 * Calculates the total available minutes between today and the target completion date.
 *
 * @param {Date} targetCompletionDate - The target date to complete the schedule.
 * @param {Date} today - The starting date.
 * @param {number} availableHoursPerDay - Number of hours available per day.
 * @returns {CapacityResult} The capacity calculation result.
 */
export function computeCapacity(
  targetCompletionDate: Date,
  today: Date,
  availableHoursPerDay: number,
): CapacityResult {
  const todayMidnight = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const targetMidnight = new Date(
    Date.UTC(
      targetCompletionDate.getUTCFullYear(),
      targetCompletionDate.getUTCMonth(),
      targetCompletionDate.getUTCDate(),
    ),
  );

  const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
  const totalDays = Math.max(1, Math.floor(diffMs / (24 * 60 * 60 * 1000)));
  const dailyAvailableMinutes = availableHoursPerDay * 60;
  const totalCapacityMinutes = totalDays * dailyAvailableMinutes;

  return { totalDays, totalCapacityMinutes, dailyAvailableMinutes };
}

/**
 * Step 1: Normalize topic effort using difficulty multipliers.
 *
 * @param {TopicEstimate[]} topics - List of topics with estimated hours and difficulty.
 * @returns {NormalizedTopic[]} List of topics with normalized weights and total minutes.
 */
export function normalizeTopicEffort(
  topics: TopicEstimate[],
): NormalizedTopic[] {
  return topics.map((topic) => {
    const multiplier = DIFFICULTY_MULTIPLIERS[topic.difficulty] ?? 1.0;
    const normalizedWeight = topic.estimatedHours * multiplier;
    return {
      ...topic,
      normalizedWeight,
      totalMinutes: Math.round(normalizedWeight * 60),
    };
  });
}

/**
 * Step 2: Validate that total workload fits within capacity.
 *
 * @param {number} workloadMinutes - Total required minutes.
 * @param {number} capacityMinutes - Total available minutes.
 * @param {number} totalDays - Total number of days.
 * @throws {OverloadError} If workload exceeds capacity.
 */
export function validateCapacity(
  workloadMinutes: number,
  capacityMinutes: number,
  totalDays: number,
): void {
  if (workloadMinutes > capacityMinutes) {
    throw new OverloadError(workloadMinutes, capacityMinutes, totalDays);
  }
}

/**
 * Step 3: Distribute topics across days using a min-heap (greedy) approach.
 *
 * Strategy: sort topics by descending weight, assign each topic chunk
 * to the day with the least current load.
 *
 * @param {NormalizedTopic[]} topics - List of normalized topics.
 * @param {number} totalDays - Total number of days available.
 * @param {number} dailyAvailableMinutes - Minutes available per day.
 * @returns {Map<number, { topic: NormalizedTopic; minutes: number }[]>} Map of day index to list of topic allocations.
 */
export function distributeTopics(
  topics: NormalizedTopic[],
  totalDays: number,
  dailyAvailableMinutes: number,
): Map<number, { topic: NormalizedTopic; minutes: number }[]> {
  // Initialize day loads: dayIndex -> current total minutes
  const dayLoads: number[] = new Array(totalDays).fill(0);
  const dayAllocations = new Map<
    number,
    { topic: NormalizedTopic; minutes: number }[]
  >();

  for (let d = 0; d < totalDays; d++) {
    dayAllocations.set(d, []);
  }

  // Sort topics by descending totalMinutes (largest first = better packing)
  const sorted = [...topics].sort((a, b) => b.totalMinutes - a.totalMinutes);

  for (const topic of sorted) {
    let remaining = topic.totalMinutes;

    while (remaining > 0) {
      // Find the day with the least current load (min-heap emulation)
      let minDay = 0;
      for (let d = 1; d < totalDays; d++) {
        const loadD = dayLoads[d] ?? Infinity;
        const loadMin = dayLoads[minDay] ?? Infinity;
        if (loadD < loadMin) {
          minDay = d;
        }
      }

      // How much can we fit in this day?
      const currentLoad = dayLoads[minDay] ?? 0;
      const available = dailyAvailableMinutes - currentLoad;
      if (available <= 0) {
        // All days are full — this shouldn't happen if validateCapacity passed
        break;
      }

      const chunk = Math.min(remaining, available);
      // Don't create sessions smaller than MIN_SESSION_MINUTES unless it's all that's left
      const effectiveChunk =
        chunk < MIN_SESSION_MINUTES && remaining > chunk ? 0 : chunk;

      if (effectiveChunk <= 0) break;

      const allocation = dayAllocations.get(minDay);
      if (allocation) {
        allocation.push({ topic, minutes: effectiveChunk });
      }
      dayLoads[minDay] = currentLoad + effectiveChunk;
      remaining -= effectiveChunk;
    }
  }

  return dayAllocations;
}

/**
 * Step 4: Generate time blocks for a single day's allocation.
 *
 * Rules:
 * - Max continuous session = 90 minutes
 * - Min session = 30 minutes (unless it's the only remaining chunk)
 * - 10-minute break after each session (except last)
 *
 * @param {{ topic: NormalizedTopic; minutes: number }[]} dayAllocation - List of topic allocations for the day.
 * @param {string} preferredStartTime - Preferred start time in "HH:mm" format.
 * @returns {TimeBlock[]} List of generated time blocks.
 */
export function generateTimeBlocks(
  dayAllocation: { topic: NormalizedTopic; minutes: number }[],
  preferredStartTime: string,
): TimeBlock[] {
  const blocks: TimeBlock[] = [];

  // Parse start time
  const [startHourStr, startMinuteStr] = preferredStartTime.split(":");
  const startHour = Number(startHourStr);
  const startMinute = Number(startMinuteStr);
  let currentMinuteOfDay = startHour * 60 + startMinute;

  for (let i = 0; i < dayAllocation.length; i++) {
    const allocation = dayAllocation[i];
    if (!allocation) continue;

    const { topic, minutes } = allocation;
    let remaining = minutes;

    while (remaining > 0) {
      const sessionMinutes = Math.min(MAX_SESSION_MINUTES, remaining);
      const startTime = minutesToHHMM(currentMinuteOfDay);
      const endTime = minutesToHHMM(currentMinuteOfDay + sessionMinutes);

      blocks.push({
        topic: topic.name,
        subject: topic.subject,
        startTime,
        endTime,
        plannedMinutes: sessionMinutes,
        isRevision: false,
      });

      currentMinuteOfDay += sessionMinutes;
      remaining -= sessionMinutes;

      // Add break after each session (except the very last block of the day)
      const isLastChunk = remaining <= 0 && i === dayAllocation.length - 1;
      if (!isLastChunk) {
        currentMinuteOfDay += BREAK_MINUTES;
      }
    }
  }

  return blocks;
}

/**
 * Step 5: Insert spaced revision sessions at D+3, D+7, D+14 after topic completion.
 *
 * Revision duration = 25% of original topic minutes.
 * Sessions are appended to the target day if capacity allows.
 * If revision day exceeds targetCompletionDate, it is skipped.
 *
 * UPDATE: If target day is full, search up to REVISION_LOOKAHEAD_DAYS forward.
 *
 * @param {DayPlan[]} days - List of day plans.
 * @param {Map<string, number>} topicCompletionDays - Map of topic name to completion day index.
 * @param {NormalizedTopic[]} topics - List of normalized topics.
 * @param {Date} targetCompletionDate - Target date for schedule completion.
 * @param {string} preferredStartTime - Preferred start time for sessions.
 * @param {number} dailyAvailableMinutes - Daily capacity in minutes.
 * @returns {DayPlan[]} Updated day plans with revision sessions.
 */
export function insertRevisionSessions(
  days: DayPlan[],
  topicCompletionDays: Map<string, number>, // topicName -> dayIndex of last session
  topics: NormalizedTopic[],
  targetCompletionDate: Date,
  preferredStartTime: string,
  dailyAvailableMinutes: number,
): DayPlan[] {
  const result = days.map((d) => ({
    ...d,
    blocks: [...d.blocks],
    totalMinutes: d.totalMinutes,
  }));

  const topicMap = new Map(topics.map((t) => [t.name, t]));

  for (const [topicName, completionDay] of topicCompletionDays) {
    const topic = topicMap.get(topicName);
    if (!topic) continue;

    // Respect flag to skip revision generation
    if (topic.generateRevisions === false) continue;

    const revisionMinutes = Math.max(
      MIN_SESSION_MINUTES,
      Math.round(topic.totalMinutes * REVISION_DURATION_RATIO),
    );

    for (const interval of REVISION_INTERVALS) {
      // let inserted = false; // Unused variable

      // Try target day and a few days forward
      for (let offset = 0; offset <= REVISION_LOOKAHEAD_DAYS; offset++) {
        const revDay = completionDay + interval + offset;

        if (revDay >= result.length) break; // past exam date, stop trying for this interval

        const dayPlan = result[revDay];

        if (!dayPlan) continue;

        // Check capacity
        if (dayPlan.totalMinutes + revisionMinutes <= dailyAvailableMinutes) {
          // Found a slot!

          // Find end time of last block on that day
          let startMinute: number;
          if (dayPlan.blocks.length > 0) {
            const lastBlock = dayPlan.blocks[dayPlan.blocks.length - 1];
            if (lastBlock) {
              startMinute = hhmmToMinutes(lastBlock.endTime) + BREAK_MINUTES;
            } else {
              // Should be covered by blocks.length > 0 check, but strict null check might complain
              const [h, m] = preferredStartTime.split(':').map(Number);
              startMinute = (h ?? 0) * 60 + (m ?? 0);
            }
          } else {
            const [h, m] = preferredStartTime.split(':').map(Number);
            startMinute = (h ?? 0) * 60 + (m ?? 0);
          }

          dayPlan.blocks.push({
            topic: topicName,
            subject: topic.subject,
            startTime: minutesToHHMM(startMinute),
            endTime: minutesToHHMM(startMinute + revisionMinutes),
            plannedMinutes: revisionMinutes,
            isRevision: true,
          });
          dayPlan.totalMinutes += revisionMinutes;
          // inserted = true; // Unused variable
          break; // Stop looking for a slot for this interval
        }
      }

      // If !inserted, it means we couldn't fit it within the lookahead window.
      // We silently skip it (best effort for MVP).
    }
  }

  return result;
}

/**
 * Full schedule generation orchestrator.
 *
 * 1. Compute capacity
 * 2. Normalize topic effort
 * 3. Validate capacity
 * 4. Distribute topics across days
 * 5. Generate time blocks per day
 * 6. Insert revision sessions
 *
 * Returns a fully deterministic schedule — same input → same output.
 *
 * @param {ScheduleInput} input - Schedule input parameters.
 * @param {Date} [today=new Date()] - Start date.
 * @returns {ScheduleResult} generated schedule.
 */
export function generateSchedule(
  input: ScheduleInput,
  today: Date = new Date(),
): ScheduleResult {
  const {
    targetCompletionDate,
    availableHoursPerDay,
    preferredStartTime,
    topicEstimates,
  } = input;

  // Step 1: Capacity
  const capacity = computeCapacity(
    targetCompletionDate,
    today,
    availableHoursPerDay,
  );

  // Step 2: Normalize
  const normalized = normalizeTopicEffort(topicEstimates);
  const totalWorkload = normalized.reduce((sum, t) => sum + t.totalMinutes, 0);

  // Step 3: Validate
  validateCapacity(
    totalWorkload,
    capacity.totalCapacityMinutes,
    capacity.totalDays,
  );

  // Step 4: Distribute
  const distribution = distributeTopics(
    normalized,
    capacity.totalDays,
    capacity.dailyAvailableMinutes,
  );

  // Step 5: Generate day plans with time blocks
  const todayMidnight = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );

  const days: DayPlan[] = [];
  const topicCompletionDays = new Map<string, number>();

  for (let d = 0; d < capacity.totalDays; d++) {
    const dayDate = new Date(todayMidnight.getTime() + d * 24 * 60 * 60 * 1000);
    const dayAllocation = distribution.get(d) || [];
    const blocks = generateTimeBlocks(dayAllocation, preferredStartTime);
    const totalMinutes = blocks.reduce((sum, b) => sum + b.plannedMinutes, 0);

    // Track completion day for each topic (last day we see it)
    for (const alloc of dayAllocation) {
      topicCompletionDays.set(alloc.topic.name, d);
    }

    days.push({ date: dayDate, blocks, totalMinutes });
  }

  // Step 6: Insert revision sessions
  const daysWithRevision = insertRevisionSessions(
    days,
    topicCompletionDays,
    normalized,
    targetCompletionDate,
    preferredStartTime,
    capacity.dailyAvailableMinutes,
  );

  // Compute metadata
  let totalSessionCount = 0;
  let totalRevisionCount = 0;
  let totalPlannedMinutes = 0;

  for (const day of daysWithRevision) {
    for (const block of day.blocks) {
      totalSessionCount++;
      totalPlannedMinutes += block.plannedMinutes;
      if (block.isRevision) totalRevisionCount++;
    }
  }

  return {
    days: daysWithRevision,
    metadata: {
      totalDays: capacity.totalDays,
      totalTopics: normalized.length,
      totalSessionCount,
      totalRevisionCount,
      totalPlannedMinutes,
    },
  };
}

// ─── Utility Helpers ────────────────────────────────────────────────

/**
 * Convert minutes since midnight to "HH:mm"
 *
 * @param {number} minutes - Minutes since midnight.
 * @returns {string} Time formatted as "HH:mm".
 */
export function minutesToHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

/**
 * Convert "HH:mm" to minutes since midnight
 *
 * @param {string} hhmm - Time formatted as "HH:mm".
 * @returns {number} Minutes since midnight.
 */
export function hhmmToMinutes(hhmm: string): number {
  const [hStr, mStr] = hhmm.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  return h * 60 + m;
}
