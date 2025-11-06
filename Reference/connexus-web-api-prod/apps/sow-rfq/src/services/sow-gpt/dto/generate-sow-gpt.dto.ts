import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class GenerateScopeOfWorkDto {
  @ApiProperty({
    description: 'ID of the service',
    example: 'cfeba318-fd49-42d8-8226-c49bc8b4cf45',
  })
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @ApiProperty({
    description: 'Name of the service',
    example: 'Landscaping Services',
  })
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @ApiProperty({
    description: 'Array of property IDs',
    type: [String],
    example: [
      'cfeba318-fd49-42d8-8226-c49bc8b4cf45',
      'c4bdd626-b2a3-4cf2-8dc0-abeee62e9bf2',
    ],
  })
  @IsArray()
  @IsNotEmpty()
  @IsUUID(undefined, { each: true })
  propertyIds: string[];

  @ApiProperty({
    description: 'Name of the scope of work',
    example: 'Annual Landscaping Maintenance',
  })
  @IsString()
  @IsNotEmpty()
  sowName: string;

  @ApiProperty({
    description: 'ID of the client',
    example: 'cfeba318-fd49-42d8-8226-c49bc8b4cf45',
  })
  @IsString()
  @IsNotEmpty()
  clientId: string;
}
