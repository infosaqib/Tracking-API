import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { CreateUsersDto } from './dto/create-user.dto';

@Injectable()
export class MigrationService {
  constructor(private readonly usersService: UsersService) {}

  migrationUsers(body: CreateUsersDto) {
    const usersInput: Prisma.UsersCreateManyInput[] = body.users.map(
      (user) => ({
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        authorized: false,
        isInternal: true,
        avatarUrl: '',
        fullName: `${user.firstName} ${user.lastName}`,
        phoneCode: user.phoneCode,
      }),
    );
    return this.usersService.bulkCreateUsers(usersInput);
  }
}
