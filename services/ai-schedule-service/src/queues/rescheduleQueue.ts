/**
 * BullMQ Reschedule Queue
 *
 * Creates and exports the BullMQ Queue instance for rescheduling jobs.
 * Uses Redis connection from environment config.
 */
import { Queue } from "bullmq";
import IORedis from "ioredis";
import { createLogger } from "../utils/logger";

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

export const rescheduleQueue = new Queue<RescheduleJobData, any, string>(
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

/**
 * Graceful shutdown
 */
export async function closeQueue(): Promise<void> {
  await rescheduleQueue.close();
  if (connection) {
    await connection.quit();
    connection = undefined;
  }
}
