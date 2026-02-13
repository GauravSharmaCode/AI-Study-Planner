/**
 * Deterministic Scheduling Engine — Unit Tests
 *
 * These test all pure functions in schedulingEngine.ts
 * with no mocks needed (no IO, no DB, no AI).
 */
import {
  computeCapacity,
  normalizeTopicEffort,
  validateCapacity,
  distributeTopics,
  generateTimeBlocks,
  insertRevisionSessions,
  generateSchedule,
  minutesToHHMM,
  hhmmToMinutes,
  OverloadError,
  TopicEstimate,
  NormalizedTopic,
} from '../../src/services/schedulingEngine';

// ─── Helpers ────────────────────────────────────────────────────────

function makeDate(yyyy: number, mm: number, dd: number): Date {
  return new Date(Date.UTC(yyyy, mm - 1, dd));
}

function makeTopics(overrides: Partial<TopicEstimate>[] = []): TopicEstimate[] {
  const defaults: TopicEstimate[] = [
    { name: 'Algebra', subject: 'Math', estimatedHours: 2, difficulty: 'easy' },
    { name: 'Calculus', subject: 'Math', estimatedHours: 4, difficulty: 'hard' },
    { name: 'Optics', subject: 'Physics', estimatedHours: 3, difficulty: 'medium' },
  ];
  return defaults.map((t, i) => ({ ...t, ...(overrides[i] || {}) }));
}

// ─── computeCapacity ────────────────────────────────────────────────

describe('computeCapacity', () => {
  it('should compute correct days and capacity', () => {
    const today = makeDate(2026, 1, 1);
    const exam = makeDate(2026, 1, 31);
    const result = computeCapacity(exam, today, 4);

    expect(result.totalDays).toBe(30);
    expect(result.dailyAvailableMinutes).toBe(240);
    expect(result.totalCapacityMinutes).toBe(7200);
  });

  it('should return minimum 1 day when exam is tomorrow', () => {
    const today = makeDate(2026, 3, 10);
    const exam = makeDate(2026, 3, 11);
    const result = computeCapacity(exam, today, 6);

    expect(result.totalDays).toBe(1);
    expect(result.totalCapacityMinutes).toBe(360);
  });

  it('should return 1 day when exam is same day (edge case)', () => {
    const today = makeDate(2026, 3, 10);
    const exam = makeDate(2026, 3, 10);
    const result = computeCapacity(exam, today, 4);

    // floor(0 / 86400000) = 0, but we clamp to 1
    expect(result.totalDays).toBe(1);
  });

  it('should handle large date ranges', () => {
    const today = makeDate(2026, 1, 1);
    const exam = makeDate(2026, 7, 1);
    const result = computeCapacity(exam, today, 4);

    expect(result.totalDays).toBe(181); // Jan 1 to Jul 1
    expect(result.totalCapacityMinutes).toBe(181 * 240);
  });
});

// ─── normalizeTopicEffort ───────────────────────────────────────────

describe('normalizeTopicEffort', () => {
  it('should apply correct difficulty multipliers', () => {
    const topics = makeTopics();
    const normalized = normalizeTopicEffort(topics);

    // easy: 2 * 1.0 = 2.0h = 120min
    expect(normalized[0]?.normalizedWeight).toBe(2.0);
    expect(normalized[0]?.totalMinutes).toBe(120);

    // hard: 4 * 1.5 = 6.0h = 360min
    expect(normalized[1]?.normalizedWeight).toBe(6.0);
    expect(normalized[1]?.totalMinutes).toBe(360);

    // medium: 3 * 1.25 = 3.75h = 225min
    expect(normalized[2]?.normalizedWeight).toBe(3.75);
    expect(normalized[2]?.totalMinutes).toBe(225);
  });

  it('should handle empty array', () => {
    expect(normalizeTopicEffort([])).toEqual([]);
  });

  it('should default to 1.0 multiplier for unknown difficulty', () => {
    const topics: TopicEstimate[] = [
      { name: 'X', subject: 'Y', estimatedHours: 2, difficulty: 'unknown' as any },
    ];
    const normalized = normalizeTopicEffort(topics);
    expect(normalized[0]?.normalizedWeight).toBe(2.0);
  });
});

// ─── validateCapacity ───────────────────────────────────────────────

describe('validateCapacity', () => {
  it('should pass when workload fits capacity', () => {
    expect(() => validateCapacity(500, 1000, 10)).not.toThrow();
  });

  it('should pass when workload equals capacity', () => {
    expect(() => validateCapacity(1000, 1000, 10)).not.toThrow();
  });

  it('should throw OverloadError when workload exceeds capacity', () => {
    expect(() => validateCapacity(1001, 1000, 10)).toThrow(OverloadError);
  });

  it('should include suggested hours in OverloadError', () => {
    try {
      validateCapacity(1200, 1000, 10);
      fail('Expected OverloadError');
    } catch (e) {
      expect(e).toBeInstanceOf(OverloadError);
      expect((e as OverloadError).suggestedMinHours).toBeGreaterThan(0);
      expect((e as OverloadError).workloadMinutes).toBe(1200);
      expect((e as OverloadError).capacityMinutes).toBe(1000);
    }
  });
});

// ─── distributeTopics ───────────────────────────────────────────────

describe('distributeTopics', () => {
  it('should distribute topics across days evenly', () => {
    const topics = normalizeTopicEffort(makeTopics());
    const totalMinutes = topics.reduce((s, t) => s + t.totalMinutes, 0);
    const distribution = distributeTopics(topics, 5, 240);

    // All minutes should be accounted for
    let allocatedMinutes = 0;
    for (const [, allocations] of distribution) {
      for (const alloc of allocations) {
        allocatedMinutes += alloc.minutes;
      }
    }
    expect(allocatedMinutes).toBe(totalMinutes);
  });

  it('should not exceed daily capacity on any day', () => {
    const topics = normalizeTopicEffort(makeTopics());
    const dailyMax = 240;
    const distribution = distributeTopics(topics, 5, dailyMax);

    for (const [, allocations] of distribution) {
      const dayTotal = allocations.reduce((s, a) => s + a.minutes, 0);
      expect(dayTotal).toBeLessThanOrEqual(dailyMax);
    }
  });

  it('should handle a single topic', () => {
    const topics = normalizeTopicEffort([
      { name: 'Solo', subject: 'S', estimatedHours: 1, difficulty: 'easy' },
    ]);
    const distribution = distributeTopics(topics, 3, 240);

    let totalAllocated = 0;
    for (const [, allocs] of distribution) {
      totalAllocated += allocs.reduce((s, a) => s + a.minutes, 0);
    }
    expect(totalAllocated).toBe(60); // 1h * 1.0 = 60min
  });
});

// ─── generateTimeBlocks ────────────────────────────────────────────

describe('generateTimeBlocks', () => {
  it('should create blocks starting at preferred start time', () => {
    const topics = normalizeTopicEffort([
      { name: 'A', subject: 'S', estimatedHours: 1, difficulty: 'easy' },
    ]);
    const topic0 = topics[0];
    if (!topic0) throw new Error("Topic should exist");

    const blocks = generateTimeBlocks(
      [{ topic: topic0, minutes: 60 }],
      '09:00'
    );

    expect(blocks[0]?.startTime).toBe('09:00');
    expect(blocks[0]?.endTime).toBe('10:00');
    expect(blocks[0]?.plannedMinutes).toBe(60);
  });

  it('should split sessions larger than 90 minutes', () => {
    const topics = normalizeTopicEffort([
      { name: 'Big', subject: 'S', estimatedHours: 3, difficulty: 'easy' },
    ]);
    const topic0 = topics[0];
    if (!topic0) throw new Error("Topic should exist");

    const blocks = generateTimeBlocks(
      [{ topic: topic0, minutes: 180 }],
      '08:00'
    );

    // 180 min → 90 + 90
    expect(blocks.length).toBe(2);
    expect(blocks[0]?.plannedMinutes).toBe(90);
    expect(blocks[1]?.plannedMinutes).toBe(90);
  });

  it('should add breaks between sessions', () => {
    const topics = normalizeTopicEffort([
      { name: 'A', subject: 'X', estimatedHours: 1, difficulty: 'easy' },
      { name: 'B', subject: 'Y', estimatedHours: 1, difficulty: 'easy' },
    ]);
    const topic0 = topics[0];
    const topic1 = topics[1];
    if (!topic0 || !topic1) throw new Error("Topics should exist");

    const blocks = generateTimeBlocks(
      [
        { topic: topic0, minutes: 60 },
        { topic: topic1, minutes: 60 },
      ],
      '08:00'
    );

    // A: 08:00–09:00, break 10min, B: 09:10–10:10
    expect(blocks[0]?.endTime).toBe('09:00');
    expect(blocks[1]?.startTime).toBe('09:10');
  });

  it('should handle empty allocation', () => {
    const blocks = generateTimeBlocks([], '08:00');
    expect(blocks).toEqual([]);
  });
});

// ─── insertRevisionSessions ────────────────────────────────────────

describe('insertRevisionSessions', () => {
  it('should insert revisions at D+3, D+7, D+14', () => {
    const topics = normalizeTopicEffort([
      { name: 'Topic1', subject: 'S', estimatedHours: 2, difficulty: 'easy' },
    ]);

    // Create 20 empty days
    const days = Array.from({ length: 20 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)),
      blocks: [],
      totalMinutes: 0,
    }));

    const completionDays = new Map([['Topic1', 0]]); // completed on day 0
    const exam = makeDate(2026, 1, 21);

    const result = insertRevisionSessions(days, completionDays, topics, exam, '08:00', 240);

    // Should have revision blocks on days 3, 7, 14
    expect(result[3]?.blocks.length).toBe(1);
    expect(result[3]?.blocks[0]?.isRevision).toBe(true);
    expect(result[3]?.blocks[0]?.topic).toBe('Topic1');

    expect(result[7]?.blocks.length).toBe(1);
    expect(result[7]?.blocks[0]?.isRevision).toBe(true);

    expect(result[14]?.blocks.length).toBe(1);
    expect(result[14]?.blocks[0]?.isRevision).toBe(true);
  });

  it('should skip revisions past exam date', () => {
    const topics = normalizeTopicEffort([
      { name: 'T', subject: 'S', estimatedHours: 1, difficulty: 'easy' },
    ]);

    // Only 5 days — D+7 and D+14 should be skipped
    const days = Array.from({ length: 5 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)),
      blocks: [],
      totalMinutes: 0,
    }));

    const completionDays = new Map([['T', 0]]);
    const exam = makeDate(2026, 1, 6);

    const result = insertRevisionSessions(days, completionDays, topics, exam, '08:00', 240);

    expect(result[3]?.blocks.length).toBe(1);
    // Day 4 (D+7 would be index 7 — out of bounds)
    expect(result[4]?.blocks.length).toBe(0);
  });

  it('should skip revisions if day is full', () => {
    const topics = normalizeTopicEffort([
      { name: 'T', subject: 'S', estimatedHours: 1, difficulty: 'easy' },
    ]);

    const days = Array.from({ length: 10 }, (_, i) => ({
      date: new Date(Date.UTC(2026, 0, 1 + i)),
      blocks: [],
      totalMinutes: i === 3 ? 240 : 0, // day 3 is full (240/240)
    }));

    const completionDays = new Map([['T', 0]]);
    const exam = makeDate(2026, 1, 11);

    const result = insertRevisionSessions(days, completionDays, topics, exam, '08:00', 240);

    // Day 3 was full — revision should be skipped for that interval
    expect(result[3]?.blocks.length).toBe(0);
    // But D+7 should still have revision
    expect(result[7]?.blocks.length).toBe(1);
  });
});

// ─── generateSchedule (full orchestrator) ──────────────────────────

describe('generateSchedule', () => {
  it('should generate a complete schedule', () => {
    const today = makeDate(2026, 1, 1);
    const exam = makeDate(2026, 2, 1); // 31 days

    const result = generateSchedule(
      {
        targetCompletionDate: exam,
        availableHoursPerDay: 4,
        preferredStartTime: '09:00',
        subjects: ['Math', 'Physics'],
        topicEstimates: makeTopics(),
      },
      today
    );

    expect(result.days.length).toBe(31);
    expect(result.metadata.totalTopics).toBe(3);
    expect(result.metadata.totalSessionCount).toBeGreaterThan(0);
    expect(result.metadata.totalPlannedMinutes).toBeGreaterThan(0);
    // Should include some revision sessions
    expect(result.metadata.totalRevisionCount).toBeGreaterThan(0);
  });

  it('should throw OverloadError if workload exceeds capacity', () => {
    const today = makeDate(2026, 1, 1);
    const exam = makeDate(2026, 1, 2); // only 1 day

    expect(() =>
      generateSchedule(
        {
          targetCompletionDate: exam,
          availableHoursPerDay: 1, // only 60 min capacity
          preferredStartTime: '08:00',
          subjects: ['Math'],
          topicEstimates: [
            { name: 'Big', subject: 'Math', estimatedHours: 10, difficulty: 'hard' },
          ],
        },
        today
      )
    ).toThrow(OverloadError);
  });

  it('should produce deterministic output (same input → same result)', () => {
    const today = makeDate(2026, 1, 1);
    const exam = makeDate(2026, 2, 1);
    const input = {
      targetCompletionDate: exam,
      availableHoursPerDay: 4,
      preferredStartTime: '09:00',
      subjects: ['Math'],
      topicEstimates: [
        { name: 'Algebra', subject: 'Math', estimatedHours: 2, difficulty: 'easy' as const },
        { name: 'Calculus', subject: 'Math', estimatedHours: 3, difficulty: 'hard' as const },
      ],
    };

    const result1 = generateSchedule(input, today);
    const result2 = generateSchedule(input, today);

    expect(result1.metadata).toEqual(result2.metadata);
    expect(result1.days.length).toBe(result2.days.length);

    for (let i = 0; i < result1.days.length; i++) {
      expect(result1.days[i]?.blocks).toEqual(result2.days[i]?.blocks);
    }
  });

  it('should handle empty topic list gracefully', () => {
    const today = makeDate(2026, 1, 1);
    const exam = makeDate(2026, 2, 1);

    const result = generateSchedule(
      {
        targetCompletionDate: exam,
        availableHoursPerDay: 4,
        preferredStartTime: '09:00',
        subjects: ['Math'],
        topicEstimates: [],
      },
      today
    );

    expect(result.metadata.totalSessionCount).toBe(0);
    expect(result.metadata.totalPlannedMinutes).toBe(0);
  });
});

// ─── Utility helpers ────────────────────────────────────────────────

describe('minutesToHHMM', () => {
  it('should convert minutes to HH:mm', () => {
    expect(minutesToHHMM(0)).toBe('00:00');
    expect(minutesToHHMM(90)).toBe('01:30');
    expect(minutesToHHMM(540)).toBe('09:00');
    expect(minutesToHHMM(1439)).toBe('23:59');
  });
});

describe('hhmmToMinutes', () => {
  it('should convert HH:mm to minutes', () => {
    expect(hhmmToMinutes('00:00')).toBe(0);
    expect(hhmmToMinutes('09:00')).toBe(540);
    expect(hhmmToMinutes('14:30')).toBe(870);
    expect(hhmmToMinutes('23:59')).toBe(1439);
  });
});
