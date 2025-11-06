import { UploadType } from '@app/shared';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class CreateDownloadUrlDto {
  @ApiProperty()
  @IsString()
  key: string;

  @ApiProperty()
  @IsString()
  resourceId: string;

  @ApiProperty({ enum: UploadType })
  @IsEnum(UploadType)
  type: UploadType;
}
