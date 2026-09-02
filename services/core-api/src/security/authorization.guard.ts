import { CanActivate, ExecutionContext, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ProlificApiException } from '../http/prolific-api.exception.js';
import { AuthErrorCodes } from './auth-error-codes.js';
import type { AuthenticatedActorType, RequestWithActor } from './auth.types.js';
import { REQUIRED_ACTOR_TYPES_KEY, REQUIRED_CAPABILITIES_KEY } from './authorization.decorators.js';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestWithActor>();
    const actor = request.actor;

    if (actor === undefined) {
      throw new ProlificApiException(
        HttpStatus.FORBIDDEN,
        AuthErrorCodes.actorContextMissing,
        'Authenticated actor context is required.',
      );
    }

    const actorTypes = this.reflector.getAllAndOverride<readonly AuthenticatedActorType[]>(
      REQUIRED_ACTOR_TYPES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (actorTypes !== undefined && !actorTypes.includes(actor.actorType)) {
      throw new ProlificApiException(
        HttpStatus.FORBIDDEN,
        AuthErrorCodes.actorTypeForbidden,
        'This operation is not permitted for the authenticated actor type.',
      );
    }

    const capabilities = this.reflector.getAllAndOverride<readonly string[]>(
      REQUIRED_CAPABILITIES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (
      capabilities !== undefined &&
      !capabilities.every((capability) => actor.capabilities.includes(capability))
    ) {
      throw new ProlificApiException(
        HttpStatus.FORBIDDEN,
        AuthErrorCodes.capabilityForbidden,
        'The authenticated actor is missing a required capability.',
      );
    }

    return true;
  }
}
