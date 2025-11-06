import { Body, PipeTransform, Type, ValidationPipe } from '@nestjs/common';

/**
 * Decorator that combines @Body() with ValidationPipe for automatic request body validation
 * @param validationOptions Optional validation pipe options
 */
export const ValidatedBody = (
  pipes: Array<Type<PipeTransform> | PipeTransform> = [],
) => {
  return Body(
    new ValidationPipe({
      transform: true,
      errorHttpStatusCode: 422,
      transformOptions: {
        enableImplicitConversion: false,
      },
      forbidUnknownValues: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
    ...pipes,
  );
};
