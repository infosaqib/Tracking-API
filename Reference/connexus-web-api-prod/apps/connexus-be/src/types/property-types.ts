import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
  ValidateNested,
} from 'class-validator';

import { ApiExtraModels, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateOrConnectUserApiProperty } from 'src/decorator/create-or-connect-user-api-property/create-or-connect-user-api-property.decorator';

export class CreatePropertyUserDto {
  @ApiProperty({ description: 'First name of the property user' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({ description: 'Last name of the property user' })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiProperty({ description: 'Email of the property user' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Title of the property user' })
  @IsString()
  @IsOptional()
  title: string;

  @ApiProperty({ description: 'Phone code of the property user' })
  @IsString()
  @IsOptional()
  phoneCode: string;

  @ApiProperty({ description: 'Phone extension of the property user' })
  @IsString()
  @IsOptional()
  phoneExtension: string;

  @ApiProperty({ description: 'Phone of the property user' })
  @IsString()
  @IsOptional()
  phoneNumber: string;
}

export class ConnectPropertyUserDto {
  @ApiProperty({ description: 'ID of the property user' })
  @IsNotEmpty()
  id: string;
}

export class CreateUserData {
  @ValidateNested()
  @Type(() => CreatePropertyUserDto)
  create: CreatePropertyUserDto;
}

export class ConnectUserData {
  @ValidateNested()
  @Type(() => ConnectPropertyUserDto)
  connect: ConnectPropertyUserDto;
}

export class UserDataDto {
  @ValidateIf((o) => !o.connect)
  @ValidateNested()
  @Type(() => CreatePropertyUserDto)
  @IsNotEmpty()
  create?: CreatePropertyUserDto;

  @ValidateIf((o) => !o.create)
  @ValidateNested()
  @Type(() => ConnectPropertyUserDto)
  @IsNotEmpty()
  connect?: ConnectPropertyUserDto;
}

@ApiExtraModels(ConnectPropertyUserDto, CreatePropertyUserDto, UserDataDto)
export class ConnectOrCreateUserDto {
  @CreateOrConnectUserApiProperty()
  userData: UserDataDto;
}
