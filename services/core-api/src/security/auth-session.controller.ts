import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';

import type { RequestWithActor } from './auth.types.js';
import { AuthorizationGuard } from './authorization.guard.js';
import { OAuthAuthenticationGuard } from './oauth-authentication.guard.js';

@Controller('auth')
export class AuthSessionController {
  @Get('session')
  @UseGuards(OAuthAuthenticationGuard, AuthorizationGuard)
  session(@Req() request: Request & RequestWithActor) {
    const actor = request.actor;
    if (actor === undefined) {
      throw new Error('Authenticated actor context was not attached.');
    }

    return {
      data: {
        subject: actor.subject,
        actorType: actor.actorType,
        actorPrincipalId: actor.actorPrincipalId,
        roles: actor.roles,
        capabilities: actor.capabilities,
        issuer: actor.issuer,
        audience: actor.audience,
        expiresAt: actor.expiresAt.toISOString(),
      },
    };
  }
}
