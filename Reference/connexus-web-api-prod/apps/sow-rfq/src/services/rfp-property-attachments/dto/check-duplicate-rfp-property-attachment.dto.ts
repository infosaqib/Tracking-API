import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CheckDuplicateRfpPropertyAttachmentDto {
  @ApiProperty({ description: 'RFP ID' })
  @IsString()
  @IsNotEmpty()
  rfpId: string;

  @ApiProperty({ description: 'Property ID' })
  @IsString()
  @IsNotEmpty()
  propertyId: string;

  @ApiProperty({ description: 'File hash' })
  @IsString()
  @IsNotEmpty()
  fileHash: string;
}
