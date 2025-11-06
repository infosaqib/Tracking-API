import { ApiProperty } from '@nestjs/swagger';
import { ClientStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateStatusDto {
  @ApiProperty({
    enum: ClientStatus,
  })
  @IsEnum(ClientStatus)
  status: ClientStatus;
}
