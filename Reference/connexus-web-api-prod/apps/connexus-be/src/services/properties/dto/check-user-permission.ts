import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class CheckUserPermissionDto {
  @IsString()
  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  tenantId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty()
  @IsUUID()
  userId: string;
}
