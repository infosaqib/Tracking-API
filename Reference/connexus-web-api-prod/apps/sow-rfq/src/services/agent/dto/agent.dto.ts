import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import {
  AnswerRequest,
  AnswerResponse,
  GenerateResponse,
  StartResponse,
} from '../agent.types';

export class StartAgentDto {
  @ApiProperty({
    description: 'ID of the service',
    example: 'cfeba318-fd49-42d8-8226-c49bc8b4cf45',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Name of the service',
    example: 'Landscaping Services',
  })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({
    description: 'Array of property IDs',
    type: [String],
    example: [
      'cfeba318-fd49-42d8-8226-c49bc8b4cf45',
      'c4bdd626-b2a3-4cf2-8dc0-abeee62e9bf2',
    ],
  })
  @IsString({ each: true })
  @IsNotEmpty()
  propertyIds: string[];

  @ApiProperty({
    description: 'Name of the scope of work',
    example: 'Annual Landscaping Maintenance',
  })
  @IsString()
  @IsNotEmpty()
  sowName: string;

  @ApiProperty({
    description: 'ID of the client',
    example: 'cfeba318-fd49-42d8-8226-c49bc8b4cf45',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;
}

export class StartAgentResponseDto implements StartResponse {
  @ApiProperty({
    description: 'Unique session ID',
    example: 'uuid-v4-string',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Key identifier for the current question',
    example: 'review_changes',
  })
  @IsString()
  @IsNotEmpty()
  questionKey: string;

  @ApiProperty({
    description: 'The question to be answered',
    example: 'Would you like any changes to this scope of work?',
  })
  @IsString()
  @IsNotEmpty()
  question: string;

  @ApiProperty({
    description: 'Number of remaining questions',
    example: 1,
  })
  @IsNotEmpty()
  remaining: number;

  @ApiProperty({
    description: 'Sample Scope of Work content',
    example: '# Sample SOW\n\nThis is a sample scope of work...',
  })
  @IsString()
  @IsNotEmpty()
  sampleSow: string;
}

export class AnswerAgentRequestDto implements AnswerRequest {
  @ApiProperty({
    description: 'Session ID',
    example: 'uuid-v4-string',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Key identifier for the question being answered',
    example: 'review_changes',
  })
  @IsString()
  @IsNotEmpty()
  questionKey: string;

  @ApiProperty({
    description: "User's answer to the question",
    example: 'Yes, I would like to modify the timeline section',
  })
  @IsString()
  @IsNotEmpty()
  answer: string;
}

export class AnswerAgentResponseDto implements AnswerResponse {
  @ApiProperty({
    description: 'Session ID',
    example: 'uuid-v4-string',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Whether the session is complete',
    example: false,
  })
  @IsNotEmpty()
  done: boolean;

  @ApiProperty({
    description: 'Next question information (if not done)',
    required: false,
    type: 'object',
    properties: {
      questionKey: { type: 'string' },
      question: { type: 'string' },
      remaining: { type: 'number' },
    },
  })
  @IsOptional()
  next?: {
    questionKey: string;
    question: string;
    remaining: number;
  };
}

export class GenerateDocumentResponseDto implements GenerateResponse {
  @ApiProperty({
    description: 'Session ID',
    example: 'uuid-v4-string',
  })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({
    description: 'Generated document in markdown format',
    example: '# Final Scope of Work\n\n## Project Overview\n\n...',
  })
  @IsString()
  @IsNotEmpty()
  markdown: string;
}

export class StreamResponseDto {
  @ApiProperty({
    description: 'Streamed text content',
    example: 'This is the next part of the document...',
  })
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({
    description: 'Error message if streaming failed',
    required: false,
    example: 'Failed to stream response',
  })
  @IsOptional()
  @IsString()
  error?: string;
}
