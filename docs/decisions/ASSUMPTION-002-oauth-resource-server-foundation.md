# ASSUMPTION-002: OAuth Resource Server Foundation

## Status

Implementation assumption for the first authentication and authorization slice.

## Context

The MVP scope and API overview require optional learner registration, sign-in, access tokens, refresh tokens, and authorization. They also explicitly leave the authentication provider, token format, issuer, audience, lifetimes, refresh-token rotation, recovery, consent, and production RBAC assignments unresolved.

## Assumption

Until a provider-specific authentication decision is approved, the Core API may implement a provider-neutral OAuth 2.0/OIDC resource-server boundary that:

- accepts short-lived `Authorization: Bearer` access tokens issued outside this service;
- verifies RS256 JWT signature, issuer, audience, expiry, and not-before claims using environment-provided provider configuration;
- derives trusted actor context from validated token claims, never from request payloads;
- supports role and capability authorization checks at the NestJS transport boundary; and
- exposes only a current-session context endpoint for this slice.

This does not implement provider-hosted login, registration, refresh-token issuance or rotation, logout/session revocation, account recovery, guardian consent, or final production role assignment.

## Consequences

The first slice can protect API routes and unblock authorization tests without committing the platform to Auth0, Azure AD B2C, Cognito, Supabase Auth, a custom identity provider, or another provider. A later ADR must replace or confirm this assumption before release-impacting authentication flows are implemented.
