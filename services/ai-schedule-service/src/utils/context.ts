import { AsyncLocalStorage } from 'async_hooks';

export interface Context {
  correlationId?: string;
  userId?: string;
}

export const contextStore = new AsyncLocalStorage<Context>();

export const getContext = (): Context => {
  return contextStore.getStore() || {};
};

export const getCorrelationId = (): string | undefined => {
  return getContext().correlationId;
};

export const getUserId = (): string | undefined => {
  return getContext().userId;
};

export const runWithContext = <T>(context: Context, callback: () => T): T => {
  return contextStore.run(context, callback);
};
