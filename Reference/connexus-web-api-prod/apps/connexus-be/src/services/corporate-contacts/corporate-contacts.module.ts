import { Module } from '@nestjs/common';
import { CorporateContactsService } from './corporate-contacts.service';
import { CorporateContactsController } from './corporate-contacts.controller';

@Module({
  controllers: [CorporateContactsController],
  providers: [CorporateContactsService],
})
export class CorporateContactsModule {}
