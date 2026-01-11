export interface GatewayRoute {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  serviceUrl: string;
  requiresAuth?: boolean;
  rateLimit?: {
    windowMs: number;
    max: number;
  };
}

export interface ServiceHealthCheck {
  serviceId: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  lastCheck: Date;
  responseTime?: number;
}
