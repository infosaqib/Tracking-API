/* eslint-disable no-restricted-syntax */
/* eslint-disable no-console */
import {
  AddCustomAttributesCommand,
  CognitoIdentityProviderClient,
} from '@aws-sdk/client-cognito-identity-provider';
import { envValues } from '@app/core';

const userAttributes = ['connexus_user_id', 'tenant_id', 'user_type'] as const;

export const client = new CognitoIdentityProviderClient({
  region: envValues.auth.region,
});

export const addUserAttributesToCognito = async () => {
  for await (const attribute of userAttributes) {
    try {
      const command = new AddCustomAttributesCommand({
        UserPoolId: envValues.auth.userPoolId,
        CustomAttributes: [
          {
            Name: attribute,
            AttributeDataType: 'String',
            DeveloperOnlyAttribute: false,
            Mutable: true,
            Required: false,
          },
        ],
      });

      await client.send(command);

      console.log('User attribute added to Cognito: ', attribute);
    } catch (error) {
      console.log('Error adding user attributes to Cognito: ', attribute);
    }
  }
};
