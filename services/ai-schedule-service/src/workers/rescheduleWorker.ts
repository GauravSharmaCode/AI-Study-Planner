/**
 * BullMQ Reschedule Worker
 *
 * Background worker that processes rescheduling jobs.
 * Consumes jobs from the reschedule queue and runs the
 * deterministic rescheduling algorithm inside a Prisma transaction.
 */
import { Worker, Job } from "bullmq";
import {
  RESCHEDULE_QUEUE_NAME,
  RescheduleJobData,
} from "../queues/rescheduleQueue";
import { StudyPlanService } from "../services/studyPlanService";
import { createLogger } from "../utils/logger";

const logger = createLogger("reschedule-worker");

const REDIS_URL = process.env.REDIS_URL || "redis://redis:6379";

function getRedisConnection() {
  const url = new URL(REDIS_URL);
  return {
    host: url.hostname,
    port: parseInt(url.port, 10) || 6379,
  };
}

let worker: Worker | undefined;

/**
 * Start the reschedule worker.
 * Should be called once during application startup.
 */
export function startRescheduleWorker(): Worker {
  const studyPlanService = new StudyPlanService();

  worker = new Worker<RescheduleJobData>(
    RESCHEDULE_QUEUE_NAME,
    async (job: Job<RescheduleJobData>) => {
      const { studyPlanId, correlationId, triggeredBy } = job.data;

      logger.info("Processing reschedule job", {
        jobId: job.id,
        studyPlanId,
        correlationId,
        triggeredBy,
        attempt: job.attemptsMade + 1,
      });

      const startTime = Date.now();

      try {
        await studyPlanService.reschedule(studyPlanId);

        const duration = Date.now() - startTime;
        logger.info("Reschedule job completed", {
          jobId: job.id,
          studyPlanId,
          correlationId,
          durationMs: duration,
        });
      } catch (error) {
        const duration = Date.now() - startTime;
        logger.error("Reschedule job failed", {
          jobId: job.id,
          studyPlanId,
          correlationId,
          durationMs: duration,
          error: (error as Error).message,
          attempt: job.attemptsMade + 1,
        });
        throw error; // BullMQ will retry based on backoff config
      }
    },
    {
      connection: getRedisConnection(),
      concurrency: 3,
    },
  );

  worker.on("failed", (job, err) => {
    logger.error("Reschedule job permanently failed", {
      jobId: job?.id,
      studyPlanId: job?.data.studyPlanId,
      error: err.message,
    });
  });

  worker.on("error", (err) => {
    logger.error("Reschedule worker error", { error: err.message });
  });

  logger.info("Reschedule worker started", { concurrency: 3 });

  return worker;
}

/**
 * Graceful shutdown
 */
export async function stopRescheduleWorker(): Promise<void> {
  if (worker) {
    await worker.close();
    worker = undefined;
    logger.info("Reschedule worker stopped");
  }
}
