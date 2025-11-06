import { ApiProperty } from '@nestjs/swagger';

export class ServiceCategoryEntity {
  @ApiProperty({
    description: 'Unique identifier for the service category',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the service category',
    example: 'Maintenance Services',
  })
  name: string;

  @ApiProperty({
    description: 'Number of services in this category',
    example: 5,
  })
  servicesCount: number;

  @ApiProperty({
    description: 'Date when the service category was created',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the service category was last updated',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}
