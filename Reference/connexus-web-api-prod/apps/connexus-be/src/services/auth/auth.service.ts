import { CognitoService } from '@app/shared';
import { Injectable } from '@nestjs/common';
import { LoginDto } from './dto/create-auth.dto';

@Injectable()
export class AuthService {
  constructor(private readonly cognitoService: CognitoService) {}

  async login(loginDto: LoginDto) {
    return this.cognitoService.generateToken(loginDto.email, loginDto.password);
  }
}
