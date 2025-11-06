import { Injectable, NestMiddleware } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { NextFunction, Request, Response } from 'express';

/**
 * Middleware for enhancing Sentry performance monitoring
 * Adds detailed request metrics and creates Sentry breadcrumbs
 */
@Injectable()
export class SentryPerformanceMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    // Create a breadcrumb for the request
    Sentry.addBreadcrumb({
      category: 'http',
      type: 'http',
      level: 'info',
      message: `${req.method} ${req.originalUrl}`,
      data: {
        url: req.originalUrl,
        method: req.method,
        query: req.query,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          host: req.headers.host,
          'accept-encoding': req.headers['accept-encoding'],
        },
      },
    });

    // Set operation name which will be used for the transaction
    req.__sentry_transaction_name = `${req.method} ${req.path}`;

    // Add route information to the current scope
    Sentry.setTag('route', req.path);

    // Create a timer to measure the response time
    const start = Date.now();

    // Add response handlers
    res.on('finish', () => {
      const duration = Date.now() - start;

      // Add performance metrics
      Sentry.setTag('response.status', res.statusCode.toString());
      Sentry.setTag('response.time_ms', duration.toString());

      if (res.statusCode >= 400) {
        Sentry.setTag('error', 'true');

        // For 5xx errors, set the transaction to failed
        if (res.statusCode >= 500) {
          Sentry.setTag('error.type', 'server_error');
        } else {
          Sentry.setTag('error.type', 'client_error');
        }
      }

      // Create a breadcrumb for the response
      Sentry.addBreadcrumb({
        category: 'http',
        type: 'http',
        level: res.statusCode >= 400 ? 'error' : 'info',
        message: `Response: ${res.statusCode}`,
        data: {
          status: res.statusCode,
          duration,
        },
      });
    });

    next();
  }
}
