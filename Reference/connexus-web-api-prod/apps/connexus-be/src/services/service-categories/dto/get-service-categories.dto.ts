import { PaginationDto } from '@app/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetServiceCategoriesDto extends PaginationDto {
  @ApiProperty({
    description: 'Search term to filter service categories by name',
    example: '',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;
}
