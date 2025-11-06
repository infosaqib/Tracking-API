import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PermissionType } from './permissions.entity';

export class GetPermissions {
  @ApiProperty({
    enum: PermissionType,
    enumName: 'PermissionType',
  })
  @IsOptional()
  @IsString()
  @IsEnum(PermissionType)
  type?: string;
}
