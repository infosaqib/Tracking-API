import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsUrl } from 'class-validator';

export class UpdateThemeHeaderImageDto {
  @ApiProperty({
    description: 'The URL of the client theme header image',
    required: false,
    example: 'https://example.com/header-image.jpg',
  })
  @IsOptional()
  @IsUrl()
  themeHeaderImageUrl?: string | null;
}
