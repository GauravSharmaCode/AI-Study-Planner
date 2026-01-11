declare module '@gauravsharmacode/neat-logger' {
  interface LogMetadata {
    func?: string;
    level?: 'info' | 'warn' | 'error' | 'debug';
    extra?: Record<string, any>;
  }

  export function logWithMeta(message: string, metadata?: LogMetadata): void;
}
