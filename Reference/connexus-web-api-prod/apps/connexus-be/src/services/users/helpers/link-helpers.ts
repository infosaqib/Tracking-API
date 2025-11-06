import { envValues } from '@app/core';

export const createInvitationLink = (token: string) => {
  const link = `${envValues.frontendUrl}/auth/verify?token=${token}`;

  return link;
};
