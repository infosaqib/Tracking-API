const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { 
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
  ErrorResponseBuilder, 
  ErrorLogger, 
  ErrorMonitor,
  ERROR_SEVERITY,
  ERROR_CATEGORY
} = require('../utils/errors');
const logger = require('../config/logger');
const config = require('../config');

/**
 * Global Error Handler Middleware
 */
class GlobalErrorHandler {
  constructor() {
    this.errorLogger = new ErrorLogger(logger);
    this.errorMonitor = new ErrorMonitor();
  }

  /**
   * Main error handling middleware
   */
  handleError = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log the error
    this.errorLogger.log(error, req);

    // Track error for monitoring
    this.errorMonitor.trackError(error, req);

    // Handle specific error types
    error = this.handleSpecificErrors(error, req);

    // Build error response
    const responseBuilder = new ErrorResponseBuilder(error, req);
    const response = responseBuilder.build();
    const statusCode = responseBuilder.getStatusCode();

    // Send error response
    res.status(statusCode).json(response);
  };

  /**
   * Handle specific error types
   */
  handleSpecificErrors = (error, req) => {
    // Mongoose validation error
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map(e => ({
        field: e.path,
        message: e.message,
        value: e.value,
        type: e.kind
      }));

      return new ValidationError('Validation failed', errors);
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      const value = error.keyValue[field];
      
      return new ConflictError(`${field} '${value}' already exists`, 'DUPLICATE_KEY_ERROR');
    }

    // Mongoose cast error
    if (error.name === 'CastError') {
      const message = `Invalid ${error.path}: ${error.value}`;
      return new ValidationError(message, [], 'INVALID_ID');
    }

    // JWT errors
    if (error.name === 'JsonWebTokenError') {
      return new AuthenticationError('Invalid token', 'INVALID_TOKEN');
    }

    if (error.name === 'TokenExpiredError') {
      return new AuthenticationError('Token has expired', 'TOKEN_EXPIRED');
    }

    if (error.name === 'NotBeforeError') {
      return new AuthenticationError('Token not active', 'TOKEN_NOT_ACTIVE');
    }

    // Multer errors (file upload)
    if (error.code === 'LIMIT_FILE_SIZE') {
      return new ValidationError('File too large', [], 'FILE_TOO_LARGE');
    }

    if (error.code === 'LIMIT_FILE_COUNT') {
      return new ValidationError('Too many files', [], 'TOO_MANY_FILES');
    }

    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return new ValidationError('Unexpected field', [], 'UNEXPECTED_FILE_FIELD');
    }

    // Rate limiting errors
    if (error.statusCode === 429) {
      return new RateLimitError(
        error.message || 'Too many requests',
        error.retryAfter,
        'RATE_LIMIT_EXCEEDED'
      );
    }

    // Database connection errors
    if (error.name === 'MongoNetworkError' || error.name === 'MongoTimeoutError') {
      return new DatabaseError('Database connection failed', 'DATABASE_CONNECTION_ERROR');
    }

    // Redis connection errors
    if (error.message && error.message.includes('Redis')) {
      return new DatabaseError('Cache service unavailable', 'CACHE_ERROR');
    }

    // External service errors
    if (error.isAxiosError) {
      const service = this.extractServiceName(error.config?.url);
      return new ExternalServiceError(service, error.message, 'EXTERNAL_SERVICE_ERROR');
    }

    // Stripe errors
    if (error.type && error.type.startsWith('Stripe')) {
      return new ExternalServiceError('Stripe', error.message, 'PAYMENT_SERVICE_ERROR');
    }

    // PayPal errors
    if (error.name === 'PAYPAL_ERROR') {
      return new ExternalServiceError('PayPal', error.message, 'PAYMENT_SERVICE_ERROR');
    }

    // Socket.io errors
    if (error.message && error.message.includes('Socket')) {
      return new ExternalServiceError('Socket.io', error.message, 'REALTIME_SERVICE_ERROR');
    }

    // Configuration errors
    if (error.message && error.message.includes('config')) {
      return new ConfigurationError(error.message, 'CONFIGURATION_ERROR');
    }

    // Business logic errors
    if (error.name === 'BusinessLogicError') {
      return new BusinessLogicError(error.message, error.code);
    }

    // Default to AppError if not already an AppError
    if (!(error instanceof AppError)) {
      return new AppError(
        error.message || 'Internal server error',
        error.statusCode || 500,
        'INTERNAL_ERROR',
        false
      );
    }

    return error;
  };

  /**
   * Extract service name from URL
   */
  extractServiceName = (url) => {
    if (!url) return 'Unknown';
    
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'Unknown';
    }
  };

  /**
   * Handle uncaught exceptions
   */
  handleUncaughtException = () => {
    process.on('uncaughtException', (err) => {
      logger.error('Uncaught Exception! Shutting down...', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });

      // Close server gracefully
      process.exit(1);
    });
  };

  /**
   * Handle unhandled promise rejections
   */
  handleUnhandledRejection = () => {
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection! Shutting down...', {
        reason: reason?.message || reason,
        stack: reason?.stack,
        promise: promise.toString(),
        timestamp: new Date().toISOString()
      });

      // Close server gracefully
      process.exit(1);
    });
  };

  /**
   * Handle SIGTERM signal
   */
  handleSIGTERM = () => {
    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      process.exit(0);
    });
  };

  /**
   * Handle SIGINT signal
   */
  handleSIGINT = () => {
    process.on('SIGINT', () => {
      logger.info('SIGINT received. Shutting down gracefully...');
      process.exit(0);
    });
  };

  /**
   * Initialize all error handlers
   */
  initialize = () => {
    this.handleUncaughtException();
    this.handleUnhandledRejection();
    this.handleSIGTERM();
    this.handleSIGINT();
  };

  /**
   * Get error statistics
   */
  getErrorStats = () => {
    return this.errorMonitor.getStats();
  };

  /**
   * Reset error statistics
   */
  resetErrorStats = () => {
    this.errorMonitor.reset();
  };
}

// Create singleton instance
const globalErrorHandler = new GlobalErrorHandler();

// Export middleware and utilities
module.exports = {
  handleError: globalErrorHandler.handleError,
  initialize: globalErrorHandler.initialize,
  getErrorStats: globalErrorHandler.getErrorStats,
  resetErrorStats: globalErrorHandler.resetErrorStats,
  globalErrorHandler
};
