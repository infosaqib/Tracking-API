import { PaginationDto } from '@app/shared/dto/pagination.dto';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID } from 'class-validator';

export class GetUserPropertiesDto extends PaginationDto {
  @ApiProperty({
    description: 'User ID to get properties for',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  userId: string;

  @ApiProperty({
    description: 'Tenant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  tenantId: string;

  @ApiPropertyOptional({
    description: 'Search term for property name or legal name',
  })
  @IsString()
  @IsOptional()
  search?: string;
}
