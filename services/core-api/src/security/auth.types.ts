export type AuthenticatedActorType = 'learner' | 'administrative' | 'service';

export interface AuthenticatedActor {
  readonly subject: string;
  readonly actorType: AuthenticatedActorType;
  readonly actorPrincipalId: string | null;
  readonly roles: readonly string[];
  readonly capabilities: readonly string[];
  readonly issuer: string;
  readonly audience: readonly string[];
  readonly expiresAt: Date;
}

export interface RequestWithActor {
  actor?: AuthenticatedActor;
}

export interface OAuthJwtClaims {
  readonly sub?: unknown;
  readonly iss?: unknown;
  readonly aud?: unknown;
  readonly exp?: unknown;
  readonly nbf?: unknown;
  readonly iat?: unknown;
  readonly actor_type?: unknown;
  readonly actor_principal_id?: unknown;
  readonly roles?: unknown;
  readonly capabilities?: unknown;
  readonly scope?: unknown;
}
