/**
 * Structured logger for Vercel debugging.
 * Outputs JSON logs that Vercel's log viewer can parse and filter.
 *
 * Usage:
 *   import { challengeLog } from "@/lib/logger";
 *   challengeLog.info("generate_start", { userId, subjectCount });
 *   challengeLog.error("generate_failed", { userId, error: err.message });
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  event: string;
  data?: Record<string, unknown>;
  duration?: number;
  error?: string;
  stack?: string;
}

function formatEntry(entry: LogEntry): string {
  const base = `[${entry.timestamp}] [${entry.level.toUpperCase()}] [${entry.category}] ${entry.event}`;
  const parts = [base];
  if (entry.data && Object.keys(entry.data).length > 0) {
    parts.push(JSON.stringify(entry.data));
  }
  if (entry.duration !== undefined) {
    parts.push(`${entry.duration}ms`);
  }
  if (entry.error) {
    parts.push(`error="${entry.error}"`);
  }
  return parts.join(" ");
}

function createLogger(category: string) {
  function log(level: LogLevel, event: string, data?: Record<string, unknown>, duration?: number, error?: string) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      event,
      data,
      duration,
      error,
    };

    const msg = formatEntry(entry);

    // Structured JSON for Vercel log viewer
    const jsonPayload = { ...entry, msg: undefined };

    switch (level) {
      case "debug":
        console.debug(msg);
        break;
      case "info":
        console.info(msg);
        break;
      case "warn":
        console.warn(msg);
        break;
      case "error":
        console.error(msg, jsonPayload);
        break;
    }
  }

  return {
    debug: (event: string, data?: Record<string, unknown>) => log("debug", event, data),
    info: (event: string, data?: Record<string, unknown>, duration?: number) => log("info", event, data, duration),
    warn: (event: string, data?: Record<string, unknown>) => log("warn", event, data),
    error: (event: string, data?: Record<string, unknown>, error?: string) => log("error", event, data, undefined, error),
    /** Timer helper — returns a stop function that logs duration */
    timer: (event: string, data?: Record<string, unknown>) => {
      const start = Date.now();
      return (extra?: Record<string, unknown>) => {
        const duration = Date.now() - start;
        log("info", event, { ...data, ...extra }, duration);
        return duration;
      };
    },
  };
}

export const challengeLog = createLogger("challenge");
export const authLog = createLogger("auth");
export const aiLog2 = createLogger("ai");
export const dbLog = createLogger("db");
