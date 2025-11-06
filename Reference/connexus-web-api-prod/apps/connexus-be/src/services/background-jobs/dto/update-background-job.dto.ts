import { ApiProperty } from '@nestjs/swagger';
import { BackgroundJobStatuses } from '@prisma/client';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateBackgroundJobDto {
  @ApiProperty({
    description: 'The status of the background job',
    enum: BackgroundJobStatuses,
    example: BackgroundJobStatuses.COMPLETED,
  })
  @IsOptional()
  @IsEnum(BackgroundJobStatuses)
  status?: BackgroundJobStatuses;

  @ApiProperty({
    description: 'The response from the background job',
    example: 'Contract processed successfully',
  })
  @IsOptional()
  @IsString()
  response?: string;
}
