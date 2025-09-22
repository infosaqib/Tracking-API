const { asyncHandler } = require('./errors');

/**
 * Async Route Wrapper
 * Wraps async route handlers to catch and pass errors to the global error handler
 */

/**
 * Wrap a single async route handler
 */
const wrapAsync = (fn) => {
  return asyncHandler(fn);
};

/**
 * Wrap multiple async route handlers
 */
const wrapAsyncHandlers = (handlers) => {
  return handlers.map(handler => {
    if (typeof handler === 'function') {
      return wrapAsync(handler);
    }
    return handler;
  });
};

/**
 * Wrap controller methods
 */
const wrapController = (controller) => {
  const wrappedController = {};
  
  for (const [methodName, method] of Object.entries(controller)) {
    if (typeof method === 'function') {
      wrappedController[methodName] = wrapAsync(method);
    } else {
      wrappedController[methodName] = method;
    }
  }
  
  return wrappedController;
};

/**
 * Express route wrapper with error handling
 */
const routeWrapper = (fn) => {
  return (req, res, next) => {
    const wrappedFn = wrapAsync(fn);
    return wrappedFn(req, res, next);
  };
};

/**
 * Middleware wrapper for async middleware
 */
const middlewareWrapper = (fn) => {
  return (req, res, next) => {
    const wrappedFn = wrapAsync(fn);
    return wrappedFn(req, res, next);
  };
};

/**
 * Service method wrapper
 */
const serviceWrapper = (service) => {
  const wrappedService = {};
  
  for (const [methodName, method] of Object.entries(service)) {
    if (typeof method === 'function') {
      wrappedService[methodName] = async (...args) => {
        try {
          return await method.apply(service, args);
        } catch (error) {
          // Re-throw with additional context
          error.service = service.constructor.name;
          error.method = methodName;
          throw error;
        }
      };
    } else {
      wrappedService[methodName] = method;
    }
  }
  
  return wrappedService;
};

/**
 * Database operation wrapper
 */
const dbWrapper = (operation) => {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      // Add database context
      error.operation = operation.name || 'unknown';
      error.type = 'database';
      throw error;
    }
  };
};

/**
 * External API call wrapper
 */
const apiWrapper = (apiCall, serviceName = 'External API') => {
  return async (...args) => {
    try {
      return await apiCall(...args);
    } catch (error) {
      // Add API context
      error.service = serviceName;
      error.type = 'external_api';
      error.isAxiosError = true;
      throw error;
    }
  };
};

/**
 * File operation wrapper
 */
const fileWrapper = (operation) => {
  return async (...args) => {
    try {
      return await operation(...args);
    } catch (error) {
      // Add file operation context
      error.operation = operation.name || 'unknown';
      error.type = 'file_operation';
      throw error;
    }
  };
};

/**
 * Validation wrapper
 */
const validationWrapper = (validator) => {
  return (req, res, next) => {
    try {
      const result = validator(req, res, next);
      
      // If validator returns a promise
      if (result && typeof result.then === 'function') {
        return result.catch(error => {
          error.type = 'validation';
          next(error);
        });
      }
      
      return result;
    } catch (error) {
      error.type = 'validation';
      next(error);
    }
  };
};

/**
 * Batch operation wrapper
 */
const batchWrapper = (operations) => {
  return async (...args) => {
    const results = [];
    const errors = [];
    
    for (let i = 0; i < operations.length; i++) {
      try {
        const result = await operations[i](...args);
        results.push({ index: i, success: true, result });
      } catch (error) {
        error.operationIndex = i;
        error.operationName = operations[i].name || `operation_${i}`;
        errors.push({ index: i, success: false, error });
      }
    }
    
    if (errors.length > 0) {
      const batchError = new Error(`Batch operation failed: ${errors.length}/${operations.length} operations failed`);
      batchError.errors = errors;
      batchError.results = results;
      batchError.type = 'batch_operation';
      throw batchError;
    }
    
    return results;
  };
};

/**
 * Retry wrapper with exponential backoff
 */
const retryWrapper = (operation, maxRetries = 3, baseDelay = 1000) => {
  return async (...args) => {
    let lastError;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation(...args);
      } catch (error) {
        lastError = error;
        
        if (attempt === maxRetries) {
          error.retryAttempts = attempt - 1;
          error.maxRetries = maxRetries;
          throw error;
        }
        
        // Exponential backoff
        const delay = baseDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError;
  };
};

/**
 * Timeout wrapper
 */
const timeoutWrapper = (operation, timeoutMs = 30000) => {
  return async (...args) => {
    return Promise.race([
      operation(...args),
      new Promise((_, reject) => {
        setTimeout(() => {
          const timeoutError = new Error(`Operation timed out after ${timeoutMs}ms`);
          timeoutError.type = 'timeout';
          timeoutError.timeout = timeoutMs;
          reject(timeoutError);
        }, timeoutMs);
      })
    ]);
  };
};

module.exports = {
  wrapAsync,
  wrapAsyncHandlers,
  wrapController,
  routeWrapper,
  middlewareWrapper,
  serviceWrapper,
  dbWrapper,
  apiWrapper,
  fileWrapper,
  validationWrapper,
  batchWrapper,
  retryWrapper,
  timeoutWrapper
};
