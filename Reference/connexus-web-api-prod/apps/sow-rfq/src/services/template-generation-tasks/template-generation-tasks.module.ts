import { SqsModule } from '@app/shared/sqs';
import { Module } from '@nestjs/common';
import { TemplateGenerationTasksController } from './template-generation-tasks.controller';
import { TemplateGenerationTasksService } from './template-generation-tasks.service';

@Module({
  imports: [SqsModule],
  controllers: [TemplateGenerationTasksController],
  providers: [TemplateGenerationTasksService],
})
export class TemplateGenerationTasksModule {}
