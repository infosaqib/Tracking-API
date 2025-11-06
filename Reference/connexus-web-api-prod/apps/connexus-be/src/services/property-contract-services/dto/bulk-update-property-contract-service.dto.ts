import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsString,
  ValidateNested,
} from 'class-validator';

class BulkUpdatePropertyContractServiceInput {
  @IsString()
  @ApiProperty({
    description: 'The id of the property contract service to be updated.',
  })
  id: string;

  @IsString()
  @ApiProperty({
    description:
      'The id of the service to be linked with the property contract.',
  })
  serviceId: string;
}

export class BulkUpdatePropertyContractServiceDto {
  @ApiProperty({
    description: 'Array of property contract services to be updated.',
    type: BulkUpdatePropertyContractServiceInput,
    isArray: true,
    example: [
      {
        id: 'uuid-here',
        serviceId: 'uuid-here',
      },
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => BulkUpdatePropertyContractServiceInput)
  input: BulkUpdatePropertyContractServiceInput[];
}
