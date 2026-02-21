/**
 * Lightweight structured logger for the NinjaOne MCP server.
 *
 * All output goes to stderr so it doesn't interfere with
 * the MCP protocol on stdout (stdio transport).
 *
 * Configure via LOG_LEVEL env var: debug | info | warn | error (default: info)
 */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LEVELS;

function getConfiguredLevel(): LogLevel {
  const env = (process.env.LOG_LEVEL || "info").toLowerCase();
  if (env in LEVELS) return env as LogLevel;
  return "info";
}

function formatMessage(level: LogLevel, message: string, context?: unknown): string {
  const timestamp = new Date().toISOString();
  const prefix = `${timestamp} [${level.toUpperCase()}]`;
  if (context !== undefined) {
    let contextStr: string;
    try {
      contextStr = JSON.stringify(context);
    } catch {
      contextStr = String(context);
    }
    return `${prefix} ${message} ${contextStr}`;
  }
  return `${prefix} ${message}`;
}

function log(level: LogLevel, message: string, context?: unknown): void {
  if (LEVELS[level] < LEVELS[getConfiguredLevel()]) return;
  console.error(formatMessage(level, message, context));
}

export const logger = {
  debug: (message: string, context?: unknown) => log("debug", message, context),
  info: (message: string, context?: unknown) => log("info", message, context),
  warn: (message: string, context?: unknown) => log("warn", message, context),
  error: (message: string, context?: unknown) => log("error", message, context),
};
