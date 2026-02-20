import client from 'prom-client';

// Create a Registry which registers the metrics
const register = new client.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
  app: 'ai-schedule-service',
});

// Enable the collection of default metrics
client.collectDefaultMetrics({ register });

// --- Metrics Definitions ---

export const httpRequestDurationMicroseconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.5, 1, 2, 5],
  registers: [register],
});

export const planGenerationDurationSeconds = new client.Histogram({
  name: 'plan_generation_duration_seconds',
  help: 'Duration of study plan generation in seconds',
  labelNames: ['status'], // success, failure
  buckets: [1, 5, 10, 30, 60],
  registers: [register],
});

export const aiApiLatencySeconds = new client.Histogram({
  name: 'ai_api_latency_seconds',
  help: 'Latency of AI API calls in seconds',
  labelNames: ['operation', 'status'], // success, failure
  buckets: [0.5, 1, 2, 5, 10, 20],
  registers: [register],
});

export const rescheduleJobDurationSeconds = new client.Histogram({
  name: 'reschedule_job_duration_seconds',
  help: 'Duration of reschedule jobs in seconds',
  labelNames: ['status'], // success, failure
  buckets: [0.1, 0.5, 1, 5, 10],
  registers: [register],
});

export const queueDepth = new client.Gauge({
  name: 'queue_depth',
  help: 'Number of jobs waiting in the queue',
  labelNames: ['queue_name'],
  registers: [register],
});

export const queueFailedCount = new client.Gauge({
  name: 'queue_failed_count',
  help: 'Number of failed jobs in the queue (DLQ)',
  labelNames: ['queue_name'],
  registers: [register],
});

export const dbTransactionDurationSeconds = new client.Histogram({
  name: 'db_transaction_duration_seconds',
  help: 'Duration of database transactions in seconds',
  labelNames: ['operation', 'table'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1],
  registers: [register],
});

export default register;
