import { PaginationDto, TransformArray } from '@app/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';
import { TransformBoolean } from 'src/utils/transform';

export class GetPropertyForRfpDto extends PaginationDto {
  @ApiPropertyOptional({ description: 'Property IDs' })
  @IsOptional()
  @IsString({ each: true })
  @IsArray()
  @TransformArray()
  propertyIds?: string[];

  @ApiProperty({ description: 'Scope of work ID' })
  @IsString()
  sowId: string;

  @ApiProperty({ description: 'RFP ID' })
  @IsString()
  rfpId: string;

  @ApiPropertyOptional({ description: 'Has attachments' })
  @TransformBoolean()
  @IsOptional()
  hasAttachments?: boolean;

  @ApiPropertyOptional({ description: 'Search' })
  @IsOptional()
  @IsString()
  search?: string;
}
