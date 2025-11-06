import { RouteController } from '@app/shared';
import { Body, Patch, Post } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GenerateScopeOfWorkDto, ModifyScopeOfWorkGptDto } from './dto';
import { SowGptService } from './sow-gpt.service';

@RouteController('sow-gpt')
export class SowGptController {
  constructor(private readonly sowGptService: SowGptService) {}

  @Post('generate')
  @ApiOperation({
    summary: 'Generate a scope of work template using GPT',
    description:
      'Generate a comprehensive scope of work document in markdown format based on service details and property information.',
  })
  async create(@Body() generateScopeOfWorkDto: GenerateScopeOfWorkDto) {
    return this.sowGptService.generateScopeOfWorkGpt(generateScopeOfWorkDto);
  }

  @Patch('modify')
  @ApiOperation({
    summary: 'Modify an existing scope of work markdown based on user feedback',
    description:
      'Take an existing SOW markdown and modify it according to user comments. If the message is not SOW-related, returns the original content unchanged.',
  })
  async modify(@Body() modifyScopeOfWorkDto: ModifyScopeOfWorkGptDto) {
    return this.sowGptService.modifyScopeOfWork(modifyScopeOfWorkDto);
  }
}
