import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import * as jwt from 'jsonwebtoken';

import { extractBearerToken } from './bearer-token.js';

export interface LocalJwtPayload {
  sub: string;
  email: string;
  actor_type: string;
  capabilities: string[];
}

export interface RequestWithLocalUser {
  userId?: string;
  email?: string;
  capabilities?: string[];
}

@Injectable()
export class LocalJwtAuthenticationGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request & RequestWithLocalUser>();
    const token = extractBearerToken(request);
    const jwtSecret = process.env.LOCAL_AUTH_JWT_SECRET ?? 'change_me_to_a_long_secret';

    try {
      const payload = jwt.verify(token, jwtSecret, {
        algorithms: ['HS256'],
      }) as LocalJwtPayload;

      request.userId = payload.sub;
      request.email = payload.email;
      request.capabilities = payload.capabilities;
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired access token.');
    }
  }
}
