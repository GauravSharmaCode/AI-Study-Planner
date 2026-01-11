export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
  meta: PaginationMeta;
}

export interface LogEntry {
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  timestamp: string;
  serviceId: string;
  userId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
}

export interface MetricData {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  serviceId: string;
  tags?: Record<string, string>;
}
