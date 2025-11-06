import { Module } from '@nestjs/common';
import { SesModule } from 'src/libs/ses/ses.module';
import { CognitoService } from './cognito.service';

@Module({
  providers: [CognitoService],
  exports: [CognitoService],
  imports: [SesModule],
})
export class CognitoModule {}
