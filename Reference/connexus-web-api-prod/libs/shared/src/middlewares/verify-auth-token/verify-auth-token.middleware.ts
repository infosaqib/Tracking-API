import { CaslAbilityFactory } from '@app/ability';
import { RequestWithUser } from '@app/core';
import { CognitoService, RequestUser } from '@app/shared';
import { getAttribute } from '@app/shared/cognito/helpers/get-user-attribute';
import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { PermissionType } from 'src/services/permissions/dto/permissions.entity';

@Injectable()
export class VerifyAuthTokenMiddleware implements NestMiddleware {
  constructor(
    private readonly cognitoService: CognitoService,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  private readonly endpointsToSkip: RegExp[] = [
    /^\/v\d+\/public/,
    /^\/v\d+\/auth\/login/,
  ];

  async use(req: RequestWithUser, res: Response, next: () => void) {
    const token = req.headers.authorization;

    // Check if endpoint is in the list of endpoints to skip
    if (
      this.endpointsToSkip.some((endpoint) => endpoint.test(req.originalUrl))
    ) {
      return next();
    }

    if (!token) {
      return next();
    }

    // Decouple bearer token
    const [bearer, authToken] = token.split(' ');

    if (bearer !== 'Bearer' || !authToken) {
      throw new UnauthorizedException('Invalid token');
    }

    // Verify token
    const response = await this.cognitoService.verifyToken(authToken);

    const userAttributes = getAttribute(response.UserAttributes as any);

    const connexusUserId = userAttributes.getValue('custom:connexus_user_id');
    const userType = userAttributes.getValue(
      'custom:user_type',
    ) as PermissionType;
    const tenantId = userAttributes.getValue('custom:tenant_id');

    const { ability, readOnlyTenants, writableTenants } =
      await this.caslAbilityFactory.createForUser({
        userId: connexusUserId,
        userType,
        tenantId,
      });

    // Create mapping for the user attributes
    const user: RequestUser = {
      Username: response.Username,
      email: userAttributes.getValue('email'),
      email_verified: userAttributes.getValue('email_verified') === 'true',
      name: userAttributes.getValue('name'),
      family_name: userAttributes.getValue('family_name'),
      given_name: userAttributes.getValue('given_name'),
      tenant_id: tenantId,
      connexus_user_id: connexusUserId,
      user_type: userType as unknown as RequestUser['user_type'],
      sub: userAttributes.getValue('sub'),
      ability,
      readableTenants: readOnlyTenants,
      writableTenants,
    };

    req.awsUser = user;

    return next();
  }
}
