import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: '2025-11-05T10:00:00.000Z' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/products' })
  path: string;

  @ApiProperty({ example: 'GET' })
  method: string;

  @ApiProperty({ example: 'An error occurred' })
  message: string;

  @ApiProperty({ example: 'Bad Request', required: false })
  error?: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 422 })
  statusCode: number;

  @ApiProperty({ example: 'Validation failed' })
  message: string;

  @ApiProperty({
    example: ['email must be an email', 'password must be longer than or equal to 6 characters'],
    type: [String],
  })
  errors: string[];
}

export class UnauthorizedErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Unauthorized' })
  message: string;

  @ApiProperty({ example: 'Invalid token' })
  error: string;
}

export class NotFoundErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'Resource not found' })
  message: string;
}

export class ConflictErrorResponseDto {
  @ApiProperty({ example: false })
  success: boolean;

  @ApiProperty({ example: 409 })
  statusCode: number;

  @ApiProperty({ example: 'Conflict' })
  message: string;

  @ApiProperty({ example: 'User with this email already exists' })
  error: string;
}

