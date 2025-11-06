import { envValues, messages, PRISMA_ERROR_STATUS } from '@app/core';
import { ForbiddenError } from '@casl/ability';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

const logger = new Logger('HttpExceptionFilter');

/**
 * Global HTTP exception filter that handles all exceptions thrown in the application
 * and formats them into a consistent response structure.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  @Sentry.WithSentry()
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Log the error with stack trace for debugging
    logger.error(`Exception occurred during request to ${request.url}`);
    logger.error(
      exception instanceof Error ? exception.stack : String(exception),
    );

    // Default values
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = null;
    const stack = exception instanceof Error ? exception.stack : undefined;
    let type = exception.constructor.name;

    // Handle HttpExceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any)?.message || message;
        error = (exceptionResponse as any)?.error || null;
      } else if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      }
    }

    // Handle CASL ForbiddenError
    if (
      exception instanceof ForbiddenError ||
      exception instanceof ForbiddenException
    ) {
      status = HttpStatus.FORBIDDEN;
      message =
        exception instanceof ForbiddenError
          ? exception.message || messages.errorMessages.forbidden
          : messages.errorMessages.forbidden;
      type = 'ForbiddenError';
    }

    // Handle Prisma errors
    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      status = PRISMA_ERROR_STATUS[exception.code] || status;
      error = exception.code;
      message = this.formatPrismaErrorMessage(exception);
      type = 'PrismaError';
    }

    // Handle validation errors
    if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = exception.message.replace(/\n/g, ' ');
      type = 'ValidationError';
    }

    const responseBody = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      error,
      stack,
      type,
    };

    // Remove sensitive information in production
    if (envValues.nodeEnv === 'production') {
      delete responseBody.stack;
      delete responseBody.error;
    }

    response.status(status).json(responseBody);
  }

  /**
   * Format Prisma error messages to be more user-friendly
   */
  private formatPrismaErrorMessage(
    exception: Prisma.PrismaClientKnownRequestError,
  ): string {
    // Extract the field name from the error message for unique constraint violations
    if (exception.code === 'P2002') {
      const field = (exception.meta?.target as string[])?.[0] || 'field';
      return `A record with this ${field} already exists`;
    }

    // For record not found errors
    if (exception.code === 'P2025') {
      return 'Record not found';
    }

    // For foreign key constraint failures
    if (exception.code === 'P2003') {
      const field = (exception.meta?.field_name as string) || 'field';
      return `Related ${field} not found`;
    }

    // Default to the original message
    return exception.message;
  }
}
