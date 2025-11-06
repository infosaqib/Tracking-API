import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingMonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingMonitoringInterceptor.name);

  @Sentry.WithSentry()
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() === 'http') {
      return this.logHttpCall(context, next);
    }
    return next.handle();
  }

  private logHttpCall(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest<Request>();
    const userAgent = request.get('user-agent') || '';
    const { ip, method, path: url } = request;
    const correlationKey = randomUUID();

    const userId = request.awsUser?.connexus_user_id || 'anonymous';

    // Add custom context to Sentry transaction
    Sentry.setContext('request', {
      url,
      method,
      userAgent,
      ip,
      correlationKey,
      controller: context.getClass().name,
      handler: context.getHandler().name,
    });

    // Set user information if available
    if (userId !== 'anonymous') {
      Sentry.setUser({ id: userId });
    }

    // Add transaction data
    Sentry.setTag('transaction_id', correlationKey);
    Sentry.setTag('http.method', method);
    Sentry.setTag('http.url', url);

    this.logger.log(
      `[${correlationKey}] ${method} ${url} ${userId} ${userAgent} ${ip}: ${
        context.getClass().name
      } ${context.getHandler().name}`,
    );

    const now = Date.now();
    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse<Response>();
          const { statusCode } = response;

          // Add response metrics
          const responseTime = Date.now() - now;

          // Add response tags
          Sentry.setTag('http.status_code', statusCode.toString());
          Sentry.setTag('http.response_time_ms', responseTime.toString());

          this.logger.log(
            `[${correlationKey}] ${method} ${url} ${statusCode}: ${responseTime}ms`,
          );
        },
        error: (error) => {
          // Error is automatically captured by WithSentry decorator
          this.logger.error(
            `[${correlationKey}] Error processing ${method} ${url}: ${error.message}`,
          );
        },
      }),
    );
  }
}
