import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class GetUploadedUserDto extends PaginationInput {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  search: string;
}
