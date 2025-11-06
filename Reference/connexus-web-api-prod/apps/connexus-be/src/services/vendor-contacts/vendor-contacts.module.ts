import { CognitoModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { VendorContactsController } from './vendor-contacts.controller';
import { VendorContactsService } from './vendor-contacts.service';

@Module({
  controllers: [VendorContactsController],
  providers: [VendorContactsService],
  imports: [UsersModule, CognitoModule],
})
export class VendorContactsModule {}
