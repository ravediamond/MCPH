/**
 * Standardized error handling for MCP tools
 * Ensures consistent error responses across all tools for best practice compliance
 */

export enum ErrorCode {
  // Authentication & Authorization
  AUTHENTICATION_REQUIRED = "AUTHENTICATION_REQUIRED",
  PERMISSION_DENIED = "PERMISSION_DENIED",
  INVALID_CREDENTIALS = "INVALID_CREDENTIALS",

  // Resource Errors
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
  RESOURCE_EXPIRED = "RESOURCE_EXPIRED",
  RESOURCE_ALREADY_EXISTS = "RESOURCE_ALREADY_EXISTS",

  // Validation Errors
  INVALID_INPUT = "INVALID_INPUT",
  MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD",
  INVALID_PASSWORD = "INVALID_PASSWORD",

  // System Errors
  INTERNAL_ERROR = "INTERNAL_ERROR",
  TIMEOUT = "TIMEOUT",
  SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",

  // Business Logic Errors
  OPERATION_NOT_ALLOWED = "OPERATION_NOT_ALLOWED",
  QUOTA_EXCEEDED = "QUOTA_EXCEEDED",
}

export interface MCPError {
  code: ErrorCode;
  message: string;
  details?: Record<string, any>;
  requestId?: string;
}

export interface MCPErrorResponse {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError: true;
  error: MCPError;
}

/**
 * Create a standardized MCP error response
 */
export function createMCPError(
  code: ErrorCode,
  message: string,
  details?: Record<string, any>,
  requestId?: string,
): MCPErrorResponse {
  return {
    content: [
      {
        type: "text",
        text: message,
      },
    ],
    isError: true,
    error: {
      code,
      message,
      details,
      requestId,
    },
  };
}

/**
 * Common error responses for frequent scenarios
 */
export const CommonErrors = {
  notFound: (resource: string = "Resource") =>
    createMCPError(ErrorCode.RESOURCE_NOT_FOUND, `${resource} not found`),

  permissionDenied: (action: string = "access this resource") =>
    createMCPError(
      ErrorCode.PERMISSION_DENIED,
      `You don't have permission to ${action}`,
    ),

  authenticationRequired: (action: string = "perform this operation") =>
    createMCPError(
      ErrorCode.AUTHENTICATION_REQUIRED,
      `You need to be logged in to ${action}`,
    ),

  invalidInput: (field: string, reason?: string) =>
    createMCPError(
      ErrorCode.INVALID_INPUT,
      `Invalid input for field '${field}'${reason ? `: ${reason}` : ""}`,
    ),

  expired: (resource: string = "Resource") =>
    createMCPError(ErrorCode.RESOURCE_EXPIRED, `${resource} has expired`),

  alreadyExists: (resource: string = "Resource") =>
    createMCPError(
      ErrorCode.RESOURCE_ALREADY_EXISTS,
      `${resource} already exists`,
    ),

  internalError: (message: string = "An internal error occurred") =>
    createMCPError(ErrorCode.INTERNAL_ERROR, message),

  timeout: (operation: string = "Operation") =>
    createMCPError(ErrorCode.TIMEOUT, `${operation} timed out`),

  serviceUnavailable: (service: string = "Service") =>
    createMCPError(
      ErrorCode.SERVICE_UNAVAILABLE,
      `${service} is currently unavailable`,
    ),

  rateLimitExceeded: () =>
    createMCPError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      "Rate limit exceeded. Please try again later.",
    ),
};

/**
 * Convert a generic Error to an MCPError
 */
export function errorToMCPError(
  error: Error | unknown,
  fallbackCode: ErrorCode = ErrorCode.INTERNAL_ERROR,
): MCPErrorResponse {
  if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes("not found")) {
      return CommonErrors.notFound();
    }
    if (
      error.message.includes("permission") ||
      error.message.includes("unauthorized")
    ) {
      return CommonErrors.permissionDenied();
    }
    if (
      error.message.includes("timeout") ||
      error.message.includes("timed out")
    ) {
      return CommonErrors.timeout();
    }
    if (error.message.includes("expired")) {
      return CommonErrors.expired();
    }

    return createMCPError(fallbackCode, error.message, {
      stack: error.stack,
    });
  }

  return createMCPError(
    fallbackCode,
    typeof error === "string" ? error : "An unknown error occurred",
  );
}

/**
 * Validation helper for required fields
 */
export function validateRequired(
  data: Record<string, any>,
  requiredFields: string[],
): MCPErrorResponse | null {
  for (const field of requiredFields) {
    if (
      data[field] === undefined ||
      data[field] === null ||
      data[field] === ""
    ) {
      return createMCPError(
        ErrorCode.MISSING_REQUIRED_FIELD,
        `Missing required field: ${field}`,
      );
    }
  }
  return null;
}

/**
 * Check if a response is an error
 */
export function isErrorResponse(response: any): response is MCPErrorResponse {
  return response && response.isError === true && response.error;
}

/**
 * Success response helper
 */
export function createSuccessResponse(message: string, data?: any) {
  return {
    content: [
      {
        type: "text" as const,
        text: message,
      },
    ],
    ...(data && { data }),
  };
}
