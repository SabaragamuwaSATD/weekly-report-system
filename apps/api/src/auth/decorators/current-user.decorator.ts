import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface CurrentUserPayload {
  userId: string;
  email: string;
  role: string;
}

interface RequestWithUser extends Request {
  user: CurrentUserPayload;
}

// Usage in a controller: @CurrentUser() user: CurrentUserPayload
export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): CurrentUserPayload => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    return request.user;
  },
);
