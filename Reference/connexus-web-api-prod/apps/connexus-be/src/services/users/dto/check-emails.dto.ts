import { ApiProperty } from '@nestjs/swagger';
import { ArrayMinSize, IsArray, IsEmail } from 'class-validator';

export class CheckEmailsDto {
  @ApiProperty({
    description: 'Array of email addresses to check',
    example: ['user1@example.com', 'user2@example.com'],
    type: [String],
    isArray: true,
  })
  @IsArray()
  @ArrayMinSize(1)
  @IsEmail({}, { each: true })
  emails: string[];
}
