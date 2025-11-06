import { PaginationDto as PaginationInput } from '@app/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class GetCountiesDto extends PaginationInput {
  @ApiPropertyOptional({
    description: 'State ID of the city',
    name: 'stateIds[]',
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  stateIds: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  name?: string;
}
