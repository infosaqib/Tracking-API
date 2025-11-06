import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateItemsPerPageDto {
  @ApiProperty({
    description: 'Number of items to display per page',
    minimum: 5,
    maximum: 100,
    default: 10,
    example: 25,
  })
  @IsInt()
  @Min(5)
  @Max(100)
  itemsPerPage: number;
}
