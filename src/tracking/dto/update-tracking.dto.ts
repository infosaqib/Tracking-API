import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { TrackingStatus } from '@prisma/client';

export class UpdateTrackingDto {
  @ApiProperty({ enum: TrackingStatus, required: false })
  @IsOptional()
  @IsEnum(TrackingStatus)
  status?: TrackingStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationName?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationCity?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationState?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  locationCountry?: string;
}

