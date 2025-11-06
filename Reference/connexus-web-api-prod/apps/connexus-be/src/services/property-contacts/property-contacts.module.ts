import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { PropertyContactsController } from './property-contacts.controller';
import { PropertyContactsService } from './property-contacts.service';

@Module({
  controllers: [PropertyContactsController],
  providers: [PropertyContactsService],
  imports: [UsersModule],
})
export class PropertyContactsModule {}
