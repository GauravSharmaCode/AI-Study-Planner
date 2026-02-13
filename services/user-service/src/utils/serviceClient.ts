import axios, { AxiosResponse, AxiosError } from "axios";
// import { createLogger } from './logger'; // Using neat-logger instead or adapting
import { logWithMeta } from "@gauravsharmacode/neat-logger"; // Adapter for user-service
import { ServiceResponse } from "../schemas";

// Adapter to match createLogger interface if we re-implemented it, but since we are in user-service
// which uses neat-logger, let's just make a simple wrapper or use logWithMeta directly.
// The original code used a class or object with info/error methods.

const logger = {
  info: (msg: string, meta?: unknown) =>
    logWithMeta(msg, { level: "info", func: "ServiceClient", extra: meta as Record<string, unknown> }),
  error: (msg: string, meta?: unknown) =>
    logWithMeta(msg, { level: "error", func: "ServiceClient", extra: meta as Record<string, unknown> }),
};

export class ServiceClient {
  private readonly serviceUrl: string;
  private readonly serviceName: string;
  private readonly timeout: number;

  constructor(serviceUrl: string, serviceName: string, timeout = 5000) {
    this.serviceUrl = serviceUrl;
    this.serviceName = serviceName;
    this.timeout = timeout;
  }

  async request<T = unknown>(
    endpoint: string,
    data?: unknown,
    options: {
      method?: "GET" | "POST" | "PUT" | "DELETE";
      headers?: Record<string, string>;
      userId?: string;
    } = {},
  ): Promise<ServiceResponse<T>> {
    const { method = "POST", headers = {}, userId } = options;
    const requestId = this.generateRequestId();

    try {
      logger.info("Service request started", {
        service: this.serviceName,
        endpoint,
        method,
        requestId,
        userId,
      });

      const response: AxiosResponse<T> = await axios({
        method,
        url: `${this.serviceUrl}${endpoint}`,
        data,
        headers: {
          "Content-Type": "application/json",
          "X-Request-ID": requestId,
          "X-Service-Name": this.serviceName,
          ...headers,
        },
        timeout: this.timeout,
      });

      logger.info("Service request completed", {
        service: this.serviceName,
        endpoint,
        status: response.status,
        requestId,
      });

      return {
        success: true,
        data: response.data,
        requestId,
        timestamp: new Date().toISOString(),
        serviceId: this.serviceName,
      };
    } catch (error: unknown) {
      const err = error as AxiosError | Error;
      const message = axios.isAxiosError(err) ? err.message : (err as Error).message;
      const status = axios.isAxiosError(err) ? err.response?.status : undefined;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseMessage = axios.isAxiosError(err) ? (err.response?.data as any)?.message : undefined;

      logger.error("Service request failed", {
        service: this.serviceName,
        endpoint,
        error: message,
        requestId,
        status,
      });

      return {
        success: false,
        error: responseMessage || message,
        requestId,
        timestamp: new Date().toISOString(),
        serviceId: this.serviceName,
      };
    }
  }

  async healthCheck(): Promise<{ healthy: boolean; responseTime?: number }> {
    const startTime = Date.now();

    try {
      await axios.get(`${this.serviceUrl}/health`, { timeout: 3000 });
      return {
        healthy: true,
        responseTime: Date.now() - startTime,
      };
    } catch (error) { // eslint-disable-line @typescript-eslint/no-unused-vars
      return { healthy: false };
    }
  }

  private generateRequestId(): string {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Pre-configured service clients
export const createUserServiceClient = (baseUrl: string) =>
  new ServiceClient(baseUrl, "user-service");

export const createAIScheduleServiceClient = (baseUrl: string) =>
  new ServiceClient(baseUrl, "ai-schedule-service");

// Service discovery and health monitoring
export class ServiceRegistry {
  private services: Map<string, ServiceClient> = new Map();
  private healthStatus: Map<string, boolean> = new Map();

  register(serviceName: string, serviceUrl: string): void {
    const client = new ServiceClient(serviceUrl, serviceName);
    this.services.set(serviceName, client);
    this.healthStatus.set(serviceName, false);
  }

  get(serviceName: string): ServiceClient | undefined {
    return this.services.get(serviceName);
  }

  async checkHealth(): Promise<Map<string, boolean>> {
    const promises = Array.from(this.services.entries()).map(
      async ([name, client]) => {
        const { healthy } = await client.healthCheck();
        this.healthStatus.set(name, healthy);
        return [name, healthy] as [string, boolean];
      },
    );

    const results = await Promise.all(promises);
    return new Map(results);
  }

  getHealthStatus(): Map<string, boolean> {
    return new Map(this.healthStatus);
  }

  isServiceHealthy(serviceName: string): boolean {
    return this.healthStatus.get(serviceName) || false;
  }
}

// Global service registry instance
export const serviceRegistry = new ServiceRegistry();

// Utility functions for common service operations
export const userService = {
  async validateToken(
    token: string,
    userServiceUrl: string,
  ): Promise<{ valid: boolean; userId?: string }> {
    const client = createUserServiceClient(userServiceUrl);
    const response = await client.request(
      "/auth/validate",
      { token },
      {
        method: "POST",
      },
    );

    if (response.success && response.data) {
      return { valid: true, userId: response.data.userId };
    }

    return { valid: false };
  },

  async getUserById(
    userId: string,
    userServiceUrl: string
  ): Promise<ServiceResponse<unknown>> {
    const client = createUserServiceClient(userServiceUrl);
    return client.request(`/users/${userId}`, null, { method: "GET" });
  },
};

export const aiScheduleService = {
  async createStudyPlan(
    studyPlanData: unknown,
    userId: string,
    serviceUrl: string,
  ): Promise<ServiceResponse<unknown>> {
    const client = createAIScheduleServiceClient(serviceUrl);
    return client.request("/study-plans", studyPlanData, {
      method: "POST",
      userId,
    });
  },

  async generateSchedule(
    scheduleData: unknown,
    userId: string,
    serviceUrl: string,
  ): Promise<ServiceResponse<unknown>> {
    const client = createAIScheduleServiceClient(serviceUrl);
    return client.request("/schedules/generate", scheduleData, {
      method: "POST",
      userId,
    });
  },
};

export default ServiceClient;
