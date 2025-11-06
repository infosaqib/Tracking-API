import { FileType, SignedUrlExpiresIn, UploadType } from '@app/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';

const resourceIdRequiredTypes = [
  UploadType.CLIENT_LOGO,
  UploadType.VENDOR_LOGO,
  UploadType.VENDOR_W9,
  UploadType.VENDOR_CERTIFICATE_OF_INSURANCE,
  UploadType.SCOPE_OF_WORK,
  UploadType.CLIENT_HEADER_IMAGE,
];

export class CreateSignedUrlDto {
  @ApiProperty({ enum: SignedUrlExpiresIn })
  @IsEnum(SignedUrlExpiresIn)
  @IsOptional()
  expiresIn: SignedUrlExpiresIn = SignedUrlExpiresIn.ONE_HOUR;

  @ApiProperty({ enum: UploadType })
  @IsEnum(UploadType)
  uploadType: UploadType;

  @ApiProperty({ enum: FileType })
  @IsEnum(FileType)
  fileType: FileType;

  @ApiPropertyOptional()
  @IsString()
  @ValidateIf((o) => resourceIdRequiredTypes.includes(o.uploadType))
  resourceId?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  fileName?: string;

  @ApiProperty()
  @IsString()
  @IsOptional()
  fileHash?: string;
}
