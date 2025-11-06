import { ApiProperty } from '@nestjs/swagger';

export class ServiceEntity {
  @ApiProperty({
    description: 'Unique identifier for the service',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the service',
    example: 'HVAC Maintenance',
  })
  servicesName: string;

  @ApiProperty({
    description: 'Description of the service',
    example: 'Heating, ventilation, and air conditioning maintenance services',
  })
  serviceDescription: string;

  @ApiProperty({
    description: 'Status of the service',
    example: 'ACTIVE',
  })
  status: string;

  @ApiProperty({
    description: 'Category of the service',
    example: 'OPEX',
  })
  category: string;
}

export class ServiceCategoryDetailEntity {
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
    description: 'List of services in this category',
    type: [ServiceEntity],
  })
  services: ServiceEntity[];

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
