import { AuthGuard } from '@app/guards';
import { GetRequestUser, RequestUser, RouteController } from '@app/shared';
import { Get, Param, Post, UseGuards } from '@nestjs/common';
import { TemplateGenerationTasksService } from './template-generation-tasks.service';

@RouteController('template-generation-tasks')
@UseGuards(AuthGuard)
export class TemplateGenerationTasksController {
  constructor(
    private readonly templateGenerationTasksService: TemplateGenerationTasksService,
  ) {}

  @Get(':id')
  async getTemplateGenerationTask(@Param('id') id: string) {
    return this.templateGenerationTasksService.getTemplateGenerationTask(id);
  }

  @Post(':id/retry')
  async retryFailedTask(
    @Param('id') id: string,
    @GetRequestUser() user: RequestUser,
  ) {
    return this.templateGenerationTasksService.retryFailedTask(id, user);
  }
}
