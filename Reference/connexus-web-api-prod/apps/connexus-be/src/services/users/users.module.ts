import { CognitoModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { SesModule } from 'src/libs/ses/ses.module';
import { PermissionsModule } from '../permissions/permissions.module';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [CognitoModule, PermissionsModule, SesModule],
  exports: [UsersService],
})
export class UsersModule {}
