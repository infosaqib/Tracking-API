/* eslint-disable no-console */
import {
  AdminCreateUserCommand,
  AttributeType,
} from '@aws-sdk/client-cognito-identity-provider';
import { CreateUserDto } from 'src/services/users/dto/create-user.dto';
import { envValues } from '@app/core';
import { cognitoIdentityProviderClient } from '../aws';
import { db } from '../db';

const superAdminEmail = 'adminscxprod@yopmail.com';

export const addSuperAdmin = async () => {
  console.log('Adding super admin');

  // Check super admin role
  const superAdminRole = await db.roles.findFirst({
    where: {
      name: 'Super Admin',
    },
  });

  if (!superAdminRole) {
    throw new Error('Super Admin role not found');
  }

  // Check super admin user
  const superAdmin = await db.users.findFirst({
    where: {
      email: superAdminEmail,
      userRoles: {
        some: {
          roleId: superAdminRole.id,
        },
      },
    },
  });

  if (superAdmin) {
    console.log('Super Admin already exists');
    return;
  }

  const createUserDto: CreateUserDto = {
    authorized: true,
    email: superAdminEmail,
    firstName: 'Super',
    lastName: 'Admin',
    phoneNumber: '1234567890',
    phoneExtension: '1',
    tenantsId: null,
    title: 'Super Admin',
    userRoles: [superAdminRole.id],
    phoneCode: '+1',
    avatarUrl: '',
  };

  const newUser = await db.users.create({
    data: {
      email: createUserDto.email,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      phoneNumber: createUserDto.phoneNumber,
      phoneExtension: createUserDto.phoneExtension,
      phoneCode: createUserDto.phoneCode,
      avatarUrl: createUserDto.avatarUrl,
      title: createUserDto.title,
      userRoles: {
        create: createUserDto.userRoles.map((roleId) => ({
          roleId,
        })),
      },
      isInternal: true,
      authorized: true,
    },
  });

  const attributes: AttributeType[] = [
    {
      Name: 'email',
      Value: newUser.email,
    },
    {
      Name: 'name',
      Value: `${newUser.firstName} ${newUser.lastName}`,
    },
    {
      Name: 'given_name',
      Value: newUser.firstName,
    },
    {
      Name: 'family_name',
      Value: newUser.lastName,
    },
    {
      Name: 'email_verified',
      Value: 'true',
    },
    {
      Name: 'custom:connexus_user_id',
      Value: newUser.id,
    },
    {
      Name: 'custom:user_type',
      Value: 'connexus',
    },
    {
      Name: 'custom:tenant_id',
      Value: '',
    },
  ];

  await cognitoIdentityProviderClient.send(
    new AdminCreateUserCommand({
      UserAttributes: attributes,
      Username: newUser.email,
      UserPoolId: envValues.auth.userPoolId,
      TemporaryPassword: 'connexusAdmin@123',
      MessageAction: 'SUPPRESS',
    }),
  );
};
