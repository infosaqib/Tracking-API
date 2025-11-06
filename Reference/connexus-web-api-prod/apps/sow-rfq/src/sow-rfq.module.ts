import { CaslAbilityFactory } from '@app/ability';
import { CoreModule } from '@app/core';
import { HealthModule } from '@app/health';
import { CognitoModule, S3Module, SharedModule } from '@app/shared';
import { SentryPerformanceMiddleware } from '@app/shared/middlewares/sentry-performance/sentry-performance.middleware';
import { VerifyAuthTokenMiddleware } from '@app/shared/middlewares/verify-auth-token/verify-auth-token.middleware';
import { SqsModule } from '@app/shared/sqs';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AgentModule } from './services/agent/agent.module';
import { ClientScopeOfWorkModule } from './services/client-scope-of-work/client-scope-of-work.module';
import { OnlyOfficeModule } from './services/only-office/only-office.module';
import { RfpPropertyAttachmentsModule } from './services/rfp-property-attachments/rfp-property-attachments.module';
import { RfpModule } from './services/rfp/rfp.module';
import { ScopeOfWorkVersionModule } from './services/scope-of-work-version/scope-of-work-version.module';
import { ScopeOfWorkVersionService } from './services/scope-of-work-version/scope-of-work-version.service';
import { ScopeOfWorkModule } from './services/scope-of-work/scope-of-work.module';
import { SowGptModule } from './services/sow-gpt/sow-gpt.module';
import { TemplateGenerationTasksModule } from './services/template-generation-tasks/template-generation-tasks.module';

@Module({
  imports: [
    CoreModule,
    SharedModule,
    HealthModule.forRoot({
      database: { timeout: 10000, key: 'database' },
      memory: { heapThreshold: 150 * 1024 * 1024, key: 'memory_heap' },
      disk: { thresholdPercent: 0.8, path: '/', key: 'storage' },
      enabledChecks: ['database', 'memory', 'disk'],
    }),
    ScopeOfWorkModule,
    CognitoModule,
    SqsModule,
    S3Module,
    OnlyOfficeModule,
    ClientScopeOfWorkModule,
    ScopeOfWorkVersionModule,
    RfpModule,
    RfpPropertyAttachmentsModule,
    SowGptModule,
    TemplateGenerationTasksModule,
    AgentModule,
  ],
  controllers: [],
  providers: [CaslAbilityFactory, ScopeOfWorkVersionService],
})
export class SowRfqModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Sentry performance monitoring middleware to all routes
    consumer
      .apply(SentryPerformanceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Apply auth middleware with exclusions
    consumer.apply(VerifyAuthTokenMiddleware).forRoutes({
      path: '*',
      method: RequestMethod.ALL,
      version: '1',
    });
  }
}
