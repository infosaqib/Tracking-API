import { AuthGuard } from '@app/guards';
import {
  Controller,
  UseGuards,
  UseInterceptors,
  applyDecorators,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiInternalServerErrorResponse,
  ApiNotFoundResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiUnprocessableEntityResponse,
} from '@nestjs/swagger';
import { BigIntSerializerInterceptor } from '../big-int-serializer/big-int-serializer.interceptor';
import { RouteControllerOptions } from './types';

/**
 *
 * @param route
 * @param options
 * @returns list of decorators
 *
 * @description
 * This function is a decorator that takes a route and options and returns a controller decorator.
 * By default, the security is set to protected and the version is set to 1.
 * If the security is set to protected, the controller will be protected by the AuthGuard.
 */

export const RouteController = (
  route: string,
  options?: Partial<RouteControllerOptions>,
) => {
  const tag = route
    .split('-')
    .map((t) => t.charAt(0).toUpperCase() + t.slice(1))
    .join(' ');

  const routeOptions: RouteControllerOptions = {
    security: 'protected',
    version: '1',
    addUserAbility: false,
    useBigIntSerializer: false,
    ...options,
  };

  const decorators: ClassDecorator[] = [
    ApiTags(tag),
    Controller({
      path: route,
      version: routeOptions.version,
    }),
  ];

  if (routeOptions.useBigIntSerializer) {
    decorators.unshift(UseInterceptors(BigIntSerializerInterceptor));
  }

  if (routeOptions.security === 'protected') {
    decorators.unshift(ApiBearerAuth());
    decorators.unshift(
      ApiUnauthorizedResponse({ description: 'Unauthorized' }),
      ApiForbiddenResponse({ description: 'Forbidden' }),
      ApiNotFoundResponse({ description: 'Not Found' }),
      ApiBadRequestResponse({ description: 'Bad Request' }),
      ApiUnprocessableEntityResponse({ description: 'Unprocessable Entity' }),
      ApiInternalServerErrorResponse({ description: 'Internal Server Error' }),
    );
    decorators.unshift(UseGuards(AuthGuard));
  }

  return applyDecorators(...decorators);
};
