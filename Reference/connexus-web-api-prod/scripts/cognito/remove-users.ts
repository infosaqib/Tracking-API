/* eslint-disable no-console */
import {
  AdminDeleteUserCommand,
  CognitoIdentityProviderClient,
  ListUsersCommand,
} from '@aws-sdk/client-cognito-identity-provider';

export const cognito = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION,
});

export const removeAllUsersFromCognito = async () => {
  const deleteUsers = async (paginationToken?: string) => {
    const users = new ListUsersCommand({
      UserPoolId: process.env.COGNITO_USER_POOL_ID,
      AttributesToGet: [],
      Limit: 60,
      PaginationToken: paginationToken,
    });

    const { Users, PaginationToken } = await cognito.send(users);

    const deletePromises = Users.map((user) => {
      return cognito.send(
        new AdminDeleteUserCommand({
          Username: user.Username,
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
        }),
      );
    });

    await Promise.all(deletePromises);

    console.log(
      'Deleted users:',
      Users.length,
      'PaginationToken:',
      PaginationToken,
    );

    if (PaginationToken) {
      await deleteUsers(PaginationToken);
    }
  };

  await deleteUsers();
};
