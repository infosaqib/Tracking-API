import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClientStatus, ClientTypes } from '@prisma/client';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  MaxLength,
  ValidateIf,
} from 'class-validator';

export class CreateClientDto {
  @ApiProperty({ description: 'The name of the client' })
  @IsString()
  name: string;

  @ApiPropertyOptional({
    enum: ClientTypes,
    description: 'The type of the client',
  })
  @IsEnum(ClientTypes)
  @MaxLength(50)
  @IsOptional()
  type: ClientTypes;

  @ApiProperty({ description: "The URL of the client's logo" })
  @IsOptional()
  @IsUrl()
  logoUrl: string;

  @ApiProperty({ description: 'The legal name of the client' })
  @IsString()
  legalName: string;

  @ApiPropertyOptional({ description: 'A description of the client' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the client only uses approved vendors',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value || false)
  onlyApprovedVendors?: boolean;

  @ApiPropertyOptional({
    description: 'Whether the client uses non approved vendors',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value || false)
  nonApprovedVendors?: boolean;

  @ApiPropertyOptional({ description: "The client's website URL" })
  @IsOptional()
  @IsUrl()
  website?: string;

  @ApiPropertyOptional({
    description: 'The ID of the parent company, if applicable',
  })
  @IsOptional()
  @IsString()
  @IsUUID()
  parentTenantId?: string;

  @ApiProperty({
    description: 'First name of the primary contact',
  })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name of the primary contact',
  })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Email of the primary contact',
  })
  @IsOptional()
  @IsString()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number of the primary contact',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Phone code of the primary contact',
  })
  @IsOptional()
  @IsString()
  phoneCode?: string;

  @ApiProperty({
    description: 'Phone extension of the primary contact',
  })
  @IsOptional()
  @IsString()
  phoneExtension?: string;

  @ApiProperty({
    description: 'Title of the primary contact',
  })
  @IsOptional()
  @MaxLength(50)
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Status of the client',
    enum: ClientStatus,
  })
  @IsOptional()
  @IsEnum(ClientStatus)
  status: ClientStatus;

  @ApiPropertyOptional({
    description:
      'Array of approved vendor IDs. Only allowed when onlyApprovedVendors is true.',
    type: [String],
  })
  @ValidateIf((o) => o.onlyApprovedVendors === true)
  @IsUUID('4', { each: true })
  @IsOptional()
  approvedVendorIds?: string[];

  @ApiPropertyOptional({
    description:
      'Array of non approved vendor IDs. Only allowed when onlyApprovedVendors is true.',
    type: [String],
  })
  @ValidateIf((o) => o.nonApprovedVendors === true)
  @IsUUID('4', { each: true })
  @IsOptional()
  nonApprovedVendorIds?: string[];
}
