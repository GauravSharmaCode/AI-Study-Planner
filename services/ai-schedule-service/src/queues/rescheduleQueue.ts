/**
 * BullMQ Reschedule Queue
 *
 * Creates and exports the BullMQ Queue instance for rescheduling jobs.
 * Uses Redis connection from environment config.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { createLogger } from "../utils/logger";
import { queueDepth, queueFailedCount } from "../utils/metrics";

const logger = createLogger("reschedule-queue");

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

let connection: IORedis | undefined;

export function getConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(REDIS_URL, {
      maxRetriesPerRequest: null, // Required by BullMQ
    });
    connection.on("error", (err) => {
      logger.error("Redis connection error", { error: err.message });
    });
    connection.on("connect", () => {
      logger.info("Redis connected for reschedule queue");
    });
  }
  return connection;
}

export interface RescheduleJobData {
  studyPlanId: string;
  correlationId: string;
  triggeredBy: "session_status_change" | "manual";
}

export const RESCHEDULE_QUEUE_NAME = "reschedule-plan";

export const rescheduleQueue = new Queue<RescheduleJobData, unknown, string>(
  RESCHEDULE_QUEUE_NAME,
  {
    connection: getConnection() as any,
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: "exponential",
        delay: 1000, // 1s * 2^attempt
      },
      removeOnComplete: { count: 100 }, // keep last 100 completed
      removeOnFail: { count: 50 }, // keep last 50 failed
    },
  },
);

/**
 * Enqueue a reschedule job.
 * Uses studyPlanId as the job ID for deduplication —
 * if a job for the same plan is already queued, it won't be duplicated.
 */
export async function enqueueReschedule(
  data: RescheduleJobData,
): Promise<void> {
  await rescheduleQueue.add("reschedule", data, {
    jobId: `reschedule-${data.studyPlanId}`,
  });
  logger.info("Reschedule job enqueued", {
    studyPlanId: data.studyPlanId,
    correlationId: data.correlationId,
  });
}

let monitoringInterval: ReturnType<typeof setInterval> | undefined;

export function startQueueMonitoring() {
  if (monitoringInterval) return;

  // Update initially
  updateQueueMetrics();

  monitoringInterval = setInterval(updateQueueMetrics, 5000);
}

async function updateQueueMetrics() {
  try {
    const waiting = await rescheduleQueue.getWaitingCount();
    const failed = await rescheduleQueue.getFailedCount();

    queueDepth.set({ queue_name: RESCHEDULE_QUEUE_NAME }, waiting);
    queueFailedCount.set({ queue_name: RESCHEDULE_QUEUE_NAME }, failed);
  } catch (err) {
    logger.warn('Failed to monitor queue depth (Redis may be down)', { error: (err as Error).message });
  }
}

export function stopQueueMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = undefined;
  }
}

/**
 * Graceful shutdown
 */
export async function closeQueue(): Promise<void> {
  stopQueueMonitoring();
  await rescheduleQueue.close();
  if (connection) {
    await connection.quit();
    connection = undefined;
  }
}
