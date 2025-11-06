import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { ClientStatus } from '@prisma/client';
import { IsOptional, IsUUID } from 'class-validator';
import { CreateClientDto } from './create-client.dto';

const omitFields = [
  'firstName',
  'lastName',
  'email',
  'phoneNumber',
  'phoneCode',
] as const;

export class UpdateClientDto extends PartialType(
  OmitType(CreateClientDto, omitFields),
) {
  @ApiPropertyOptional({
    enum: ClientStatus,
    description: 'The status of the property',
  })
  status: ClientStatus;

  @ApiPropertyOptional({
    description: 'Array of approved vendor IDs',
    type: [String],
  })
  @IsOptional()
  @IsUUID('4', { each: true })
  approvedVendorIds?: string[];
}
