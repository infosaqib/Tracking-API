import { AppAbility } from '@app/ability';
import { RequestWithUser, messages } from '@app/core';
import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  CHECK_POLICIES_KEY,
  PolicyHandler,
} from 'apps/connexus-be/src/decorator/check-policies/check-policies.decorator';

@Injectable()
export class PolicyGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_KEY,
        context.getHandler(),
      ) || [];

    const { awsUser } = context.switchToHttp().getRequest<RequestWithUser>();
    const { ability } = awsUser;

    const hasAccess = policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability),
    );

    if (!hasAccess) {
      throw new ForbiddenException(messages.errorMessages.forbidden);
    }

    return true;
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }
}
