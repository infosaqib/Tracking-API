import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ModifyScopeOfWorkGptDto {
  @ApiProperty({
    description: 'The existing SOW markdown content to be reshaped',
    example:
      '# Scope of Work\n\n## Project Overview\nThis is the existing content...',
  })
  @IsString()
  @IsNotEmpty()
  markdown: string;

  @ApiProperty({
    description: 'User message/instructions for reshaping the SOW',
    example:
      'Add more details about the timeline and make the budget section more detailed',
  })
  @IsString()
  @IsNotEmpty()
  message: string;
}
