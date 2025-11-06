import { VALIDATOR_OPTIONS } from '@app/core';
import { RouteController } from '@app/shared';
import { Body, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/create-auth.dto';

@RouteController('auth', {
  security: 'public',
})
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('/login')
  @UsePipes(
    new ValidationPipe({
      ...VALIDATOR_OPTIONS,
      forbidUnknownValues: true,
      forbidNonWhitelisted: false,
    }),
  )
  login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }
}
