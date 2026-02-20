import { AsyncLocalStorage } from 'async_hooks';

export interface Context {
  correlationId?: string;
  requestId?: string;
  userId?: string;
  planId?: string;
}

export const contextStore = new AsyncLocalStorage<Context>();

export const getContext = (): Context => {
  return contextStore.getStore() || {};
};

export const getCorrelationId = (): string | undefined => {
  return getContext().correlationId;
};

export const getRequestId = (): string | undefined => {
  return getContext().requestId;
};

export const getUserId = (): string | undefined => {
  return getContext().userId;
};

export const getPlanId = (): string | undefined => {
  return getContext().planId;
};

export const runWithContext = <T>(context: Context, callback: () => T): T => {
  return contextStore.run(context, callback);
};
