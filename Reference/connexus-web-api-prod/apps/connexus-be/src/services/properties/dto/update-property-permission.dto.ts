import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsNotEmpty, IsString, IsUUID } from 'class-validator';

enum UpdatePropertyPermissionType {
  CLIENT = 'CLIENT',
  PROPERTY = 'PROPERTY',
}

export class UpdatePropertyPermissionDto {
  @ApiProperty()
  @IsArray()
  @IsNotEmpty()
  @IsUUID('all', { each: true })
  propertyIds: string[];

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsEnum(UpdatePropertyPermissionType)
  permissionType: UpdatePropertyPermissionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  tenantId: string;
}
