import { ApiProperty } from '@nestjs/swagger';

export class PropertyContractService {
  @ApiProperty()
  id: string;

  @ApiProperty()
  contractId: string;

  @ApiProperty({ required: false })
  serviceId?: string;

  @ApiProperty()
  propertyContractId: string;

  @ApiProperty({ required: false })
  extractedServiceName?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  modifiedAt: Date;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty({ required: false })
  createdById?: string;

  @ApiProperty({ required: false })
  modifiedById?: string;
}
