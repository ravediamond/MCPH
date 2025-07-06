/**
 * Structured logging utility for MCP server
 * Replaces console.log with proper structured logging for production readiness
 */

export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  clientId?: string;
  tool?: string;
  ip?: string;
  userAgent?: string;
  [key: string]: any;
}

export interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  context?: LogContext;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  duration?: number;
  httpStatus?: number;
}

class Logger {
  private level: LogLevel;
  private serviceName: string;

  constructor(serviceName: string = "mcp-server") {
    this.serviceName = serviceName;
    this.level = this.getLogLevel();
  }

  private getLogLevel(): LogLevel {
    const envLevel = process.env.LOG_LEVEL?.toUpperCase();
    switch (envLevel) {
      case "ERROR":
        return LogLevel.ERROR;
      case "WARN":
        return LogLevel.WARN;
      case "INFO":
        return LogLevel.INFO;
      case "DEBUG":
        return LogLevel.DEBUG;
      default:
        return process.env.NODE_ENV === "production"
          ? LogLevel.INFO
          : LogLevel.DEBUG;
    }
  }

  private shouldLog(level: LogLevel): boolean {
    return level <= this.level;
  }

  private formatLogEntry(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number,
    httpStatus?: number,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      service: this.serviceName,
      ...(context && { context }),
      ...(error && {
        error: {
          name: error.name,
          message: error.message,
          stack: error.stack,
        },
      }),
      ...(duration !== undefined && { duration }),
      ...(httpStatus !== undefined && { httpStatus }),
    };
  }

  private log(
    level: LogLevel,
    message: string,
    context?: LogContext,
    error?: Error,
    duration?: number,
    httpStatus?: number,
  ): void {
    if (!this.shouldLog(level)) return;

    const logEntry = this.formatLogEntry(
      level,
      message,
      context,
      error,
      duration,
      httpStatus,
    );

    // In production, you might want to send this to a logging service
    // For now, we'll use structured console logging
    if (level === LogLevel.ERROR) {
      console.error(JSON.stringify(logEntry));
    } else if (level === LogLevel.WARN) {
      console.warn(JSON.stringify(logEntry));
    } else {
      console.log(JSON.stringify(logEntry));
    }
  }

  error(message: string, context?: LogContext, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error);
  }

  warn(message: string, context?: LogContext): void {
    this.log(LogLevel.WARN, message, context);
  }

  info(message: string, context?: LogContext): void {
    this.log(LogLevel.INFO, message, context);
  }

  debug(message: string, context?: LogContext): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  /**
   * Log HTTP request/response
   */
  http(
    message: string,
    httpStatus: number,
    duration?: number,
    context?: LogContext,
  ): void {
    const level =
      httpStatus >= 500
        ? LogLevel.ERROR
        : httpStatus >= 400
          ? LogLevel.WARN
          : LogLevel.INFO;
    this.log(level, message, context, undefined, duration, httpStatus);
  }

  /**
   * Log MCP tool execution
   */
  tool(
    toolName: string,
    message: string,
    context?: LogContext,
    duration?: number,
    error?: Error,
  ): void {
    const toolContext = { ...context, tool: toolName };
    if (error) {
      this.error(`[${toolName}] ${message}`, toolContext, error);
    } else {
      this.info(`[${toolName}] ${message}`, { ...toolContext, duration });
    }
  }

  /**
   * Log authentication events
   */
  auth(message: string, context?: LogContext, success: boolean = true): void {
    const level = success ? LogLevel.INFO : LogLevel.WARN;
    this.log(level, `[AUTH] ${message}`, context);
  }

  /**
   * Log rate limiting events
   */
  rateLimit(message: string, context?: LogContext): void {
    this.warn(`[RATE_LIMIT] ${message}`, context);
  }

  /**
   * Log security events
   */
  security(message: string, context?: LogContext, error?: Error): void {
    this.error(`[SECURITY] ${message}`, context, error);
  }

  /**
   * Create a child logger with additional context
   */
  child(additionalContext: LogContext): Logger {
    const childLogger = new Logger(this.serviceName);
    childLogger.level = this.level;

    // Override log method to include additional context
    const originalLog = childLogger.log.bind(childLogger);
    childLogger.log = (
      level,
      message,
      context,
      error,
      duration,
      httpStatus,
    ) => {
      const mergedContext = { ...additionalContext, ...context };
      originalLog(level, message, mergedContext, error, duration, httpStatus);
    };

    return childLogger;
  }
}

// Global logger instance
export const logger = new Logger();

/**
 * Performance timing utility
 */
export class Timer {
  private start: number;
  private name: string;

  constructor(name: string) {
    this.name = name;
    this.start = Date.now();
  }

  end(context?: LogContext): number {
    const duration = Date.now() - this.start;
    logger.debug(`${this.name} completed`, { ...context, duration });
    return duration;
  }
}

/**
 * Helper function to time async operations
 */
export async function timeOperation<T>(
  name: string,
  operation: () => Promise<T>,
  context?: LogContext,
): Promise<T> {
  const timer = new Timer(name);
  try {
    const result = await operation();
    timer.end(context);
    return result;
  } catch (error) {
    const duration = timer.end(context);
    logger.error(`${name} failed`, { ...context, duration }, error as Error);
    throw error;
  }
}

/**
 * Request ID generation for tracing
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Express middleware for request logging
 */
export function requestLoggingMiddleware() {
  return (req: any, res: any, next: any) => {
    const requestId = generateRequestId();
    const startTime = Date.now();

    // Add request ID to request object
    req.requestId = requestId;

    // Create request context
    const context: LogContext = {
      requestId,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get("User-Agent"),
      method: req.method,
      url: req.url,
    };

    // Log incoming request
    logger.info("Incoming request", context);

    // Log response when finished
    res.on("finish", () => {
      const duration = Date.now() - startTime;
      logger.http("Request completed", res.statusCode, duration, context);
    });

    next();
  };
}
