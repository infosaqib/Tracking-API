import { CognitoIdentityProviderClient } from '@aws-sdk/client-cognito-identity-provider';
import { envValues } from '@app/core';

export const cognitoIdentityProviderClient = new CognitoIdentityProviderClient({
  region: envValues.auth.region,
});
