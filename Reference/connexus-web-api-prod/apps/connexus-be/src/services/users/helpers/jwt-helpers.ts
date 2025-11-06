import { configs, envValues, messages } from '@app/core';
import { BadRequestException } from '@nestjs/common';
import jwt, { JwtPayload } from 'jsonwebtoken';

export const createInvitationToken = (cognitoId: string, password: string) => {
  const token = jwt.sign(
    {
      cognitoId,
      code: password,
    },
    envValues.auth.jwtSecret,
    {
      expiresIn: `${configs.auth.invitationExpiry}h`,
    },
  );

  return token;
};

export const verifyInvitationToken = (token: string) => {
  try {
    const decoded = jwt.verify(
      token,
      envValues.auth.jwtSecret,
    ) as JwtPayload & { cognitoId: string; code: string };
    return decoded;
  } catch (error) {
    throw new BadRequestException(messages.user.invalidToken);
  }
};
