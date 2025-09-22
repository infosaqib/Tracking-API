/**
 * Custom Error Classes and Error Handling Utilities
 */

/**
 * Base Application Error Class
 */
class AppError extends Error {
  constructor(message, statusCode, code = null, isOperational = true) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = isOperational;
    this.code = code;
    this.timestamp = new Date().toISOString();
    
    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Validation Error Class
 */
class ValidationError extends AppError {
  constructor(message, errors = [], code = 'VALIDATION_ERROR') {
    super(message, 400, code);
    this.errors = errors;
  }
}

/**
 * Authentication Error Class
 */
class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed', code = 'AUTHENTICATION_ERROR') {
    super(message, 401, code);
  }
}

/**
 * Authorization Error Class
 */
class AuthorizationError extends AppError {
  constructor(message = 'Access denied', code = 'AUTHORIZATION_ERROR') {
    super(message, 403, code);
  }
}

/**
 * Not Found Error Class
 */
class NotFoundError extends AppError {
  constructor(message = 'Resource not found', code = 'NOT_FOUND') {
    super(message, 404, code);
  }
}

/**
 * Conflict Error Class
 */
class ConflictError extends AppError {
  constructor(message = 'Resource conflict', code = 'CONFLICT') {
    super(message, 409, code);
  }
}

/**
 * Rate Limit Error Class
 */
class RateLimitError extends AppError {
  constructor(message = 'Too many requests', retryAfter = null, code = 'RATE_LIMIT_EXCEEDED') {
    super(message, 429, code);
    this.retryAfter = retryAfter;
  }
}

/**
 * External Service Error Class
 */
class ExternalServiceError extends AppError {
  constructor(service, message = 'External service error', code = 'EXTERNAL_SERVICE_ERROR') {
    super(message, 502, code);
    this.service = service;
  }
}

/**
 * Database Error Class
 */
class DatabaseError extends AppError {
  constructor(message = 'Database operation failed', code = 'DATABASE_ERROR') {
    super(message, 500, code);
  }
}

/**
 * Configuration Error Class
 */
class ConfigurationError extends AppError {
  constructor(message = 'Configuration error', code = 'CONFIGURATION_ERROR') {
    super(message, 500, code);
  }
}

/**
 * Business Logic Error Class
 */
class BusinessLogicError extends AppError {
  constructor(message = 'Business logic error', code = 'BUSINESS_LOGIC_ERROR') {
    super(message, 422, code);
  }
}

/**
 * Error Severity Levels
 */
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
};

/**
 * Error Categories
 */
const ERROR_CATEGORY = {
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  AUTHORIZATION: 'authorization',
  NOT_FOUND: 'not_found',
  CONFLICT: 'conflict',
  RATE_LIMIT: 'rate_limit',
  EXTERNAL_SERVICE: 'external_service',
  DATABASE: 'database',
  CONFIGURATION: 'configuration',
  BUSINESS_LOGIC: 'business_logic',
  UNKNOWN: 'unknown'
};

/**
 * Error Response Builder
 */
class ErrorResponseBuilder {
  constructor(error, req = null) {
    this.error = error;
    this.req = req;
  }

  /**
   * Build error response based on environment
   */
  build() {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const isProduction = process.env.NODE_ENV === 'production';

    const baseResponse = {
      success: false,
      message: this.error.message,
      code: this.error.code || 'UNKNOWN_ERROR',
      timestamp: this.error.timestamp || new Date().toISOString(),
      path: this.req?.path,
      method: this.req?.method
    };

    // Add stack trace in development
    if (isDevelopment && this.error.stack) {
      baseResponse.stack = this.error.stack;
    }

    // Add error details in development
    if (isDevelopment && this.error.errors) {
      baseResponse.errors = this.error.errors;
    }

    // Add retry information for rate limit errors
    if (this.error instanceof RateLimitError && this.error.retryAfter) {
      baseResponse.retryAfter = this.error.retryAfter;
    }

    // Add service information for external service errors
    if (this.error instanceof ExternalServiceError && this.error.service) {
      baseResponse.service = this.error.service;
    }

    // Add request ID if available
    if (this.req?.requestId) {
      baseResponse.requestId = this.req.requestId;
    }

    return baseResponse;
  }

  /**
   * Get HTTP status code
   */
  getStatusCode() {
    return this.error.statusCode || 500;
  }

  /**
   * Get error severity
   */
  getSeverity() {
    if (this.error.statusCode >= 500) return ERROR_SEVERITY.HIGH;
    if (this.error.statusCode >= 400) return ERROR_SEVERITY.MEDIUM;
    return ERROR_SEVERITY.LOW;
  }

  /**
   * Get error category
   */
  getCategory() {
    if (this.error instanceof ValidationError) return ERROR_CATEGORY.VALIDATION;
    if (this.error instanceof AuthenticationError) return ERROR_CATEGORY.AUTHENTICATION;
    if (this.error instanceof AuthorizationError) return ERROR_CATEGORY.AUTHORIZATION;
    if (this.error instanceof NotFoundError) return ERROR_CATEGORY.NOT_FOUND;
    if (this.error instanceof ConflictError) return ERROR_CATEGORY.CONFLICT;
    if (this.error instanceof RateLimitError) return ERROR_CATEGORY.RATE_LIMIT;
    if (this.error instanceof ExternalServiceError) return ERROR_CATEGORY.EXTERNAL_SERVICE;
    if (this.error instanceof DatabaseError) return ERROR_CATEGORY.DATABASE;
    if (this.error instanceof ConfigurationError) return ERROR_CATEGORY.CONFIGURATION;
    if (this.error instanceof BusinessLogicError) return ERROR_CATEGORY.BUSINESS_LOGIC;
    return ERROR_CATEGORY.UNKNOWN;
  }
}

/**
 * Error Logger
 */
class ErrorLogger {
  constructor(logger) {
    this.logger = logger;
  }

  /**
   * Log error with appropriate level
   */
  log(error, req = null, additionalData = {}) {
    const builder = new ErrorResponseBuilder(error, req);
    const severity = builder.getSeverity();
    const category = builder.getCategory();

    const logData = {
      error: {
        name: error.name,
        message: error.message,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
        category,
        severity
      },
      request: req ? {
        method: req.method,
        url: req.url,
        headers: this.sanitizeHeaders(req.headers),
        body: this.sanitizeBody(req.body),
        query: req.query,
        params: req.params,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        userId: req.user?.id
      } : null,
      additional: additionalData,
      timestamp: new Date().toISOString()
    };

    // Log based on severity
    switch (severity) {
      case ERROR_SEVERITY.CRITICAL:
        this.logger.error('Critical Error', logData);
        break;
      case ERROR_SEVERITY.HIGH:
        this.logger.error('High Severity Error', logData);
        break;
      case ERROR_SEVERITY.MEDIUM:
        this.logger.warn('Medium Severity Error', logData);
        break;
      case ERROR_SEVERITY.LOW:
        this.logger.info('Low Severity Error', logData);
        break;
      default:
        this.logger.error('Unknown Severity Error', logData);
    }
  }

  /**
   * Sanitize headers for logging
   */
  sanitizeHeaders(headers) {
    const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-webhook-signature'];
    const sanitized = { ...headers };
    
    sensitiveHeaders.forEach(header => {
      if (sanitized[header]) {
        sanitized[header] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }

  /**
   * Sanitize body for logging
   */
  sanitizeBody(body) {
    if (!body || typeof body !== 'object') return body;
    
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
    const sanitized = { ...body };
    
    sensitiveFields.forEach(field => {
      if (sanitized[field]) {
        sanitized[field] = '[REDACTED]';
      }
    });
    
    return sanitized;
  }
}

/**
 * Async Error Wrapper
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Error Monitoring Interface
 */
class ErrorMonitor {
  constructor() {
    this.errorCounts = new Map();
    this.errorThresholds = {
      [ERROR_SEVERITY.CRITICAL]: 1,
      [ERROR_SEVERITY.HIGH]: 10,
      [ERROR_SEVERITY.MEDIUM]: 50,
      [ERROR_SEVERITY.LOW]: 100
    };
  }

  /**
   * Track error occurrence
   */
  trackError(error, req = null) {
    const builder = new ErrorResponseBuilder(error, req);
    const severity = builder.getSeverity();
    const category = builder.getCategory();
    
    const key = `${category}:${severity}`;
    const currentCount = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, currentCount + 1);

    // Check if threshold exceeded
    const threshold = this.errorThresholds[severity];
    if (currentCount + 1 >= threshold) {
      this.alertThresholdExceeded(key, currentCount + 1, threshold, error, req);
    }
  }

  /**
   * Alert when threshold exceeded
   */
  alertThresholdExceeded(key, count, threshold, error, req) {
    // In production, this would integrate with monitoring services
    console.error(`🚨 ERROR THRESHOLD EXCEEDED: ${key} - ${count}/${threshold}`, {
      error: error.message,
      path: req?.path,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get error statistics
   */
  getStats() {
    return Object.fromEntries(this.errorCounts);
  }

  /**
   * Reset error counts
   */
  reset() {
    this.errorCounts.clear();
  }
}

module.exports = {
  // Error Classes
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  DatabaseError,
  ConfigurationError,
  BusinessLogicError,
  
  // Utilities
  ErrorResponseBuilder,
  ErrorLogger,
  ErrorMonitor,
  asyncHandler,
  
  // Constants
  ERROR_SEVERITY,
  ERROR_CATEGORY
};
