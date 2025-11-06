import { CognitoModule } from '@app/shared';
import { Module } from '@nestjs/common';
import { SesModule } from 'src/libs/ses/ses.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService],
  imports: [CognitoModule, SesModule],
})
export class AuthModule {}
