import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { MigrationController } from './migration.controller';
import { MigrationService } from './migration.service';

@Module({
  controllers: [MigrationController],
  providers: [MigrationService],
  imports: [UsersModule],
})
export class MigrationModule {}
