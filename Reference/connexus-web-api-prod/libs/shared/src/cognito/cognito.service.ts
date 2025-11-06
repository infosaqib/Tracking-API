import {
  AdminCreateUserCommand,
  AdminCreateUserRequest,
  AdminDeleteUserCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminGetUserCommand,
  AdminInitiateAuthCommand,
  AdminSetUserPasswordCommand,
  AdminUpdateUserAttributesCommand,
  AuthFlowType,
  GetUserCommand,
  MessageActionType,
} from '@aws-sdk/client-cognito-identity-provider';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { envValues } from '@app/core';
import { calculateSecretHash, client } from './cognito.helpers';
import { generateRandomPassword } from './helpers/generareRandomPassword';

@Injectable()
export class CognitoService {
  private userPoolId = envValues.auth.userPoolId;

  async signUp(input: Omit<AdminCreateUserRequest, 'UserPoolId'>) {
    const password = generateRandomPassword();
    const command = new AdminCreateUserCommand({
      ...input,
      UserPoolId: this.userPoolId,
      TemporaryPassword: password,
      MessageAction: MessageActionType.SUPPRESS,
    });

    const response = await client.send(command);

    return { password, response };
  }

  async generateToken(email: string, password: string) {
    const command = new AdminInitiateAuthCommand({
      UserPoolId: this.userPoolId,
      ClientId: envValues.auth.clientId,
      AuthFlow: AuthFlowType.ADMIN_NO_SRP_AUTH,
      AuthParameters: {
        USERNAME: email,
        PASSWORD: password,
        SECRET_HASH: calculateSecretHash(email),
      },
    });

    const response = await client.send(command);

    return {
      authToken: response.AuthenticationResult?.AccessToken,
      expiresIn: response.AuthenticationResult?.ExpiresIn,
    };
  }

  async verifyToken(idToken: string) {
    try {
      const command = new GetUserCommand({ AccessToken: idToken });
      const response = await client.send(command);
      return response;
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }

  async checkEmailExists(email: string) {
    try {
      const command = new AdminGetUserCommand({
        Username: email,
        UserPoolId: this.userPoolId,
      });
      const response = await client.send(command);
      return response;
    } catch (error) {
      throw new NotFoundException('Email not found');
    }
  }

  async createTemporaryPassword(email: string) {
    const password = generateRandomPassword();
    const command = new AdminSetUserPasswordCommand({
      Permanent: false,
      Password: password,
      Username: email,
      UserPoolId: this.userPoolId,
    });

    const response = await client.send(command);
    return { response, password };
  }

  deleteUsers(cognitoIds: string[]) {
    return Promise.all(
      cognitoIds.map((id) =>
        client.send(
          new AdminDeleteUserCommand({
            UserPoolId: this.userPoolId,
            Username: id,
          }),
        ),
      ),
    );
  }

  disableUser(username: string) {
    return client.send(
      new AdminDisableUserCommand({
        Username: username,
        UserPoolId: this.userPoolId,
      }),
    );
  }

  enableUser(username: string) {
    return client.send(
      new AdminEnableUserCommand({
        Username: username,
        UserPoolId: this.userPoolId,
      }),
    );
  }

  async setPassword(cognitoId: string, password: string) {
    const command = new AdminSetUserPasswordCommand({
      Permanent: true,
      Password: password,
      Username: cognitoId,
      UserPoolId: this.userPoolId,
    });

    const response = await client.send(command);

    return response;
  }

  async updateUserAttributes(input: {
    username: string;
    attributes: Record<string, string>;
  }) {
    const { username, attributes } = input;
    return client.send(
      new AdminUpdateUserAttributesCommand({
        UserAttributes: Object.entries(attributes).map(([Name, Value]) => ({
          Name,
          Value,
        })),
        Username: username,
        UserPoolId: this.userPoolId,
      }),
    );
  }
}
