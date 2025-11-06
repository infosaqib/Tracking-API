import { AbilityModule } from '@app/ability';
import { CoreModule } from '@app/core';
import { ExportDataModule as ExportDataModuleLib } from '@app/export-data';
import { GuardsModule } from '@app/guards';
import { HealthModule } from '@app/health';
import { PrismaModule } from '@app/prisma';
import { CognitoModule, S3Module } from '@app/shared';
import { SentryPerformanceMiddleware } from '@app/shared/middlewares/sentry-performance/sentry-performance.middleware';
import { VerifyAuthTokenMiddleware } from '@app/shared/middlewares/verify-auth-token/verify-auth-token.middleware';
import { SqsModule } from '@app/shared/sqs';
import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  APP_FILTER,
  APP_GUARD,
  APP_INTERCEPTOR,
  HttpAdapterHost,
} from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { SentryModule } from '@sentry/nestjs/setup';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { PrismaClientExceptionFilter } from 'nestjs-prisma';
import { join } from 'path';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggingMonitoringInterceptor } from './interceptors/logging-monitoring/logging-monitoring.interceptor';
import { EventsModule } from './libs/events/events.module';
import { SesModule } from './libs/ses/ses.module';
import { AuthModule } from './services/auth/auth.module';
import { BackgroundJobsModule } from './services/background-jobs/background-jobs.module';
import { CitiesModule } from './services/cities/cities.module';
import { ClientsModule } from './services/clients/clients.module';
import { ContractsModule } from './services/contracts/contracts.module';
import { CorporateContactsModule } from './services/corporate-contacts/corporate-contacts.module';
import { CountiesModule } from './services/counties/counties.module';
import { CountriesModule } from './services/countries/countries.module';
import { ExportDataModule } from './services/export-data/export-data.module';
import { MigrationModule } from './services/migration/migration.module';
import { PermissionsModule } from './services/permissions/permissions.module';
import { PropertiesModule } from './services/properties/properties.module';
import { PropertyContactsModule } from './services/property-contacts/property-contacts.module';
import { PropertyContractServicesModule } from './services/property-contract-services/property-contract-services.module';
import { PropertyContractsModule } from './services/property-contracts/property-contracts.module';
import { PropertyServicesModule } from './services/property-services/property-services.module';
import { PublicModule } from './services/public/public.module';
import { RolesModule } from './services/roles/roles.module';
import { ServiceCategoriesModule } from './services/service-categories/service-categories.module';
import { ServicesModule } from './services/services/services.module';
import { StatesModule } from './services/states/states.module';
import { StorageModule } from './services/storage/storage.module';
import { TenantsModule } from './services/tenants/tenants.module';
import { UsersModule } from './services/users/users.module';
import { VendorContactsModule } from './services/vendor-contacts/vendor-contacts.module';
import { VendorsModule } from './services/vendors/vendors.module';
import { ServiceCoverageModule } from './services/service-coverage/service-coverage.module';

@Module({
  imports: [
    CoreModule,
    GuardsModule,
    AbilityModule,
    PrometheusModule.register({
      path: '/connexus-metrics',
    }),
    EventEmitterModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      validate(config) {
        return config;
      },
    }),
    ThrottlerModule.forRoot([
      // {
      //   name: 'short',
      //   ttl: 1000,
      //   limit: 3,
      // },
      // {
      //   name: 'medium',
      //   ttl: 10000,
      //   limit: 20,
      // },
      // {
      //   name: 'long',
      //   ttl: 60000,
      //   limit: 100,
      // },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'public'),
      serveRoot: '/static/',
    }),
    SentryModule.forRoot(),
    CountriesModule,
    StatesModule,
    PermissionsModule,
    RolesModule,
    CognitoModule,
    AuthModule,
    TenantsModule,
    SesModule,
    UsersModule,
    PublicModule,
    MigrationModule,
    ClientsModule,
    StorageModule,
    PropertiesModule,
    ServicesModule,
    ServiceCategoriesModule,
    CitiesModule,
    PropertyContactsModule,
    PropertyServicesModule,
    CountiesModule,
    CorporateContactsModule,
    VendorsModule,
    VendorContactsModule,
    BackgroundJobsModule,
    SqsModule,
    ContractsModule,
    PropertyContractServicesModule,
    PropertyContractsModule,
    HealthModule.forRoot({
      database: { timeout: 10000, key: 'database' },
      memory: { heapThreshold: 150 * 1024 * 1024, key: 'memory_heap' },
      disk: { thresholdPercent: 0.8, path: '/', key: 'storage' },
      enabledChecks: ['database', 'memory', 'disk'],
    }),
    EventsModule,
    PrismaModule,
    S3Module,
    ExportDataModuleLib,
    ExportDataModule,
    ServiceCoverageModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useFactory: ({ httpAdapter }: HttpAdapterHost) => {
        return new PrismaClientExceptionFilter(httpAdapter);
      },
      inject: [HttpAdapterHost],
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingMonitoringInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Apply Sentry performance monitoring middleware to all routes
    consumer
      .apply(SentryPerformanceMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });

    // Apply auth middleware with exclusions
    consumer
      .apply(VerifyAuthTokenMiddleware)
      .exclude(
        { path: 'public/*', method: RequestMethod.ALL, version: '1' },
        { path: 'auth/*', method: RequestMethod.ALL, version: '1' },
        { path: 'connexus-metrics', method: RequestMethod.ALL, version: '*' },
      )
      .forRoutes({
        path: '*',
        method: RequestMethod.ALL,
        version: '1',
      });
  }
}
