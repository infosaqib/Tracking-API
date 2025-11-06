import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import * as crypto from 'crypto';
import { envValues } from '@app/core';

export const client = new CognitoIdentityProviderClient({
  region: envValues.auth.region,
});

export function calculateSecretHash(email: string) {
  const { clientId } = envValues.auth;
  const { clientSecret } = envValues.auth;

  return crypto
    .createHmac('SHA256', clientSecret)
    .update(email + clientId)
    .digest('base64');
}
