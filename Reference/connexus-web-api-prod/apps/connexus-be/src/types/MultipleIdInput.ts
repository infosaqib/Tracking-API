import { ApiProperty } from '@nestjs/swagger';
import { IsArray } from 'class-validator';

export class MultipleIdInput {
  @IsArray()
  @ApiProperty({
    required: true,
    type: 'array',
    isArray: true,
    items: {
      type: 'string',
    },
    name: 'ids[]',
  })
  ids: string[];
}
