import { ExecutionContext, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { ProlificApiException } from '../http/prolific-api.exception.js';
import { AuthErrorCodes } from './auth-error-codes.js';
import type { AuthenticatedActor } from './auth.types.js';
import { REQUIRED_ACTOR_TYPES_KEY, REQUIRED_CAPABILITIES_KEY } from './authorization.decorators.js';
import { AuthorizationGuard } from './authorization.guard.js';

describe('AuthorizationGuard', () => {
  const actor: AuthenticatedActor = {
    subject: 'subject-1',
    actorType: 'administrative',
    actorPrincipalId: 'actor-principal-id',
    roles: ['publisher'],
    capabilities: ['lesson:publish'],
    issuer: 'https://identity.prolific.test/',
    audience: ['prolific-core-api'],
    expiresAt: new Date(Date.now() + 60_000),
  };

  it('allows a matching actor type and capability', () => {
    const guard = new AuthorizationGuard(
      reflector({
        [REQUIRED_ACTOR_TYPES_KEY]: ['administrative'],
        [REQUIRED_CAPABILITIES_KEY]: ['lesson:publish'],
      }),
    );

    expect(guard.canActivate(contextWithActor(actor))).toBe(true);
  });

  it('denies a mismatched actor type', () => {
    const guard = new AuthorizationGuard(reflector({ [REQUIRED_ACTOR_TYPES_KEY]: ['service'] }));

    expect(() => guard.canActivate(contextWithActor(actor))).toThrow(ProlificApiException);
    try {
      guard.canActivate(contextWithActor(actor));
    } catch (error) {
      expect(error).toMatchObject({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        getStatus: expect.any(Function),
        code: AuthErrorCodes.actorTypeForbidden,
      });
      expect((error as ProlificApiException).getStatus()).toBe(HttpStatus.FORBIDDEN);
    }
  });

  it('denies a missing capability', () => {
    const guard = new AuthorizationGuard(
      reflector({ [REQUIRED_CAPABILITIES_KEY]: ['lesson:approve'] }),
    );

    expect(() => guard.canActivate(contextWithActor(actor))).toThrow(ProlificApiException);
    try {
      guard.canActivate(contextWithActor(actor));
    } catch (error) {
      expect((error as ProlificApiException).code).toBe(AuthErrorCodes.capabilityForbidden);
    }
  });
});

function reflector(metadata: Record<string, readonly string[]>): Reflector {
  return {
    getAllAndOverride: (key: string) => metadata[key],
  } as unknown as Reflector;
}

function contextWithActor(actor: AuthenticatedActor): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ actor }),
    }),
    getHandler: () => contextWithActor,
    getClass: () => AuthorizationGuard,
  } as unknown as ExecutionContext;
}
