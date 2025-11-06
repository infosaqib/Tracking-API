import { ValidationPipeOptions } from '@nestjs/common';

export const VALIDATOR_OPTIONS: ValidationPipeOptions = {
  transform: true,
  errorHttpStatusCode: 422,
  transformOptions: {
    enableImplicitConversion: false,
  },
  whitelist: true,
};
