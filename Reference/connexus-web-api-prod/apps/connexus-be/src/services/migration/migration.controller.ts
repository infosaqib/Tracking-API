import { RouteController } from '@app/shared';
import { Body, Post } from '@nestjs/common';
import { CreateUsersDto } from './dto/create-user.dto';
import { MigrationService } from './migration.service';

@RouteController('migration', {
  // security: envValues.nodeEnv === 'development' ? 'public' : 'protected',
  security: 'public',
})
export class MigrationController {
  constructor(private readonly migrationService: MigrationService) {}

  @Post('/users')
  migrationUsers(@Body() body: CreateUsersDto) {
    return this.migrationService.migrationUsers(body);
  }
}
