import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { envValues } from '@app/core';

/**
 * Initialize Sentry with performance monitoring configuration
 * - Profiling for CPU and memory usage
 * - Prisma query monitoring
 * - Request and response tracing
 * - Database query performance tracking
 */
Sentry.init({
  dsn: envValues.sentry.dsn,
  integrations: [
    nodeProfilingIntegration(),
    Sentry.prismaIntegration(),
    // Add Express request handler
    Sentry.httpIntegration(),
  ],

  // Performance monitoring configuration
  tracesSampleRate: 1.0, // Capture 100% of the transactions
  profilesSampleRate: 1.0, // Capture 100% of profiles with transactions

  // Set the environment to help with filtering in Sentry UI
  environment: envValues.nodeEnv,

  // Track API performance by route
  enableTracing: true,

  // Include transaction source for better debugging
  includeLocalVariables: true,

  // Enable HTTP request performance tracking
  autoSessionTracking: true,

  // Attach performance metrics to traces
  attachStacktrace: true,

  // Custom performance tracking options
  tracesSampler: () => {
    // Default to 100% sampling for all transactions
    return 1.0;
  },
});
