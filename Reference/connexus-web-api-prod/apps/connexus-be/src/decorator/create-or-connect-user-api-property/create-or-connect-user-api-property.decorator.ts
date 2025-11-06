import { applyDecorators } from '@nestjs/common';
import { ApiProperty, getSchemaPath } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNotEmpty, ValidateNested } from 'class-validator';
import {
  ConnectPropertyUserDto,
  CreatePropertyUserDto,
  UserDataDto,
} from 'src/types/property-types';

export const CreateOrConnectUserApiProperty = () =>
  applyDecorators(
    ApiProperty({
      description: `The data of the user to be added as a property contact. Either 'create' or 'connect' must be provided.
    - 'create': Use this to create a new user. It requires the following fields:
      * firstName: string
      * lastName: string
      * email: string
      * title: string
      * phoneCode: string
      * phoneNumber: string
    
    - 'connect': Use this to connect an existing user. It requires:
      * id: string (the ID of the existing user)
    
    If both are provided, 'create' will be used.`,
      oneOf: [
        {
          properties: {
            create: { $ref: getSchemaPath(CreatePropertyUserDto) },
          },
        },
        {
          properties: {
            connect: { $ref: getSchemaPath(ConnectPropertyUserDto) },
          },
        },
      ],
    }),
    ValidateNested(),
    Type(() => UserDataDto),
    IsNotEmpty(),
  );
