import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsOptional, IsString } from 'class-validator';

export class CreateRoleDto {
  @IsString()
  @ApiProperty()
  name: string;

  @IsString()
  @IsOptional()
  @ApiProperty({
    required: false,
  })
  tenantsId: string;

  @ApiProperty({
    isArray: true,
    type: 'number',
    default: [],
  })
  @ArrayMinSize(1)
  @IsArray()
  permissions: string[];
}
