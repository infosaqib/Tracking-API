import { RequestWithUser } from '@app/core';
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const GetRequestUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.awsUser;
    return user;
  },
);
