export const AuthErrorCodes = {
  missingBearerToken: 'missing_bearer_token',
  invalidBearerToken: 'invalid_bearer_token',
  bearerTokenExpired: 'bearer_token_expired',
  authenticationUnavailable: 'authentication_unavailable',
  actorTypeForbidden: 'actor_type_forbidden',
  capabilityForbidden: 'capability_forbidden',
  actorContextMissing: 'actor_context_missing',
} as const;

export type AuthErrorCode = (typeof AuthErrorCodes)[keyof typeof AuthErrorCodes];
