import { PipeTransform, Query, Type, ValidationPipe } from '@nestjs/common';
import { VALIDATOR_OPTIONS } from '@app/core';

/**
 * Decorator that combines @Query() with ValidationPipe for automatic query parameter validation
 * @param validationOptions Optional validation pipe options
 */
export const ValidatedQuery = (
  pipes: Array<Type<PipeTransform> | PipeTransform> = [],
) => {
  return Query(new ValidationPipe(VALIDATOR_OPTIONS), ...pipes);
};
