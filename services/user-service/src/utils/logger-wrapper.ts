import { logWithMeta } from "@gauravsharmacode/neat-logger";
import { getContext } from "./context";
import { sanitize } from "./sanitizer";

type LogLevel = "error" | "info" | "warn" | "debug";

export class Logger {
  private static getMeta(level: LogLevel, func: string, meta: any = {}) {
    const context = getContext();
    return {
      func,
      level,
      extra: {
        ...context,
        ...meta,
      },
    };
  }

  static info(message: string, func: string = "any", meta: any = {}) {
    logWithMeta(message, this.getMeta("info", func, meta));
  }

  static warn(message: string, func: string = "any", meta: any = {}) {
    logWithMeta(message, this.getMeta("warn", func, meta));
  }

  static error(message: string, func: string = "any", meta: any = {}) {
    logWithMeta(message, this.getMeta("error", func, meta));
  }

  static debug(message: string, func: string = "any", meta: any = {}) {
    if (process.env.LOG_LEVEL !== "debug") return;
    logWithMeta(`[DEBUG] ${message}`, this.getMeta("info", func, meta));
  }

  static entry(func: string, args: any = {}) {
    const sanitizedArgs = sanitize(args);
    this.info("Function Entry", func, { payload: sanitizedArgs });
  }

  static exit(func: string, result: any = {}) {
    const sanitizedResult = sanitize(result);
    this.info("Function Exit", func, { result: sanitizedResult });
  }

  static stateChange(func: string, stateName: string, before: any, after: any) {
    this.info(`State Change: ${stateName}`, func, {
      before: sanitize(before),
      after: sanitize(after),
    });
  }
}

export const logger = Logger;
