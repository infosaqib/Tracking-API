import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

export class CopyVersionsToProperties {
  @ApiProperty({
    type: String,
    description: 'The ID of the client scope of work',
    example: '1234567890abcdef12345678',
  })
  @IsString()
  scopeOfVersionId: string;

  @ApiProperty({
    type: [String],
    description: 'List of property IDs to which the version will be copied',
    example: ['1234567890abcdef12345678', 'abcdef1234567890abcdef12'],
  })
  @IsArray()
  @IsString({ each: true })
  propertyIds: string[];
}
