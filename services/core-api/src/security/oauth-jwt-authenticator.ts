import { createVerify } from 'node:crypto';

import { Injectable } from '@nestjs/common';

import type { AuthenticatedActor, AuthenticatedActorType, OAuthJwtClaims } from './auth.types.js';
import type { OAuthAuthConfig } from './oauth-auth.config.js';

export class OAuthAuthenticationError extends Error {}

export class OAuthConfigurationError extends Error {}

@Injectable()
export class OAuthJwtAuthenticator {
  constructor(private readonly config: OAuthAuthConfig | null) {}

  authenticate(accessToken: string): AuthenticatedActor {
    if (this.config === null) {
      throw new OAuthConfigurationError('OAuth authentication is not configured.');
    }

    const token = parseJwt(accessToken);
    verifySignature(accessToken, token.header, this.config.publicKeyPem);
    const claims = token.payload;

    const nowSeconds = Math.floor(Date.now() / 1000);
    assertStringClaim(claims.iss, 'iss');
    assertStringClaim(claims.sub, 'sub');
    assertNumberClaim(claims.exp, 'exp');
    assertIssuer(claims.iss, this.config.issuer);
    assertAudience(claims.aud, this.config.audience);
    assertExpiry(claims.exp, nowSeconds, this.config.clockToleranceSeconds);
    assertNotBefore(claims.nbf, nowSeconds, this.config.clockToleranceSeconds);

    return {
      subject: claims.sub,
      actorType: readActorType(claims.actor_type),
      actorPrincipalId: readOptionalString(claims.actor_principal_id),
      roles: readStringList(claims.roles),
      capabilities: readCapabilities(claims),
      issuer: claims.iss,
      audience: readAudienceList(claims.aud),
      expiresAt: new Date(claims.exp * 1000),
    };
  }
}

interface ParsedJwt {
  readonly header: { readonly alg?: unknown; readonly typ?: unknown };
  readonly payload: OAuthJwtClaims;
}

function parseJwt(token: string): ParsedJwt {
  const parts = token.split('.');
  if (parts.length !== 3 || parts.some((part) => part.length === 0)) {
    throw new OAuthAuthenticationError('Malformed bearer token.');
  }

  const [headerPart, payloadPart] = parts;
  const header = parseJsonObject(headerPart, 'JWT header');
  const payload = parseJsonObject(payloadPart, 'JWT payload') as OAuthJwtClaims;
  return { header, payload };
}

function parseJsonObject(value: string, label: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(base64UrlDecode(value).toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new OAuthAuthenticationError(`${label} is not an object.`);
    }
    return parsed as Record<string, unknown>;
  } catch (error) {
    if (error instanceof OAuthAuthenticationError) throw error;
    throw new OAuthAuthenticationError(`Invalid ${label}.`);
  }
}

function verifySignature(
  token: string,
  header: { readonly alg?: unknown },
  publicKeyPem: string,
): void {
  if (header.alg !== 'RS256') {
    throw new OAuthAuthenticationError('Unsupported token signature algorithm.');
  }

  const [headerPart, payloadPart, signaturePart] = token.split('.');
  const verifier = createVerify('RSA-SHA256');
  verifier.update(`${headerPart}.${payloadPart}`);
  verifier.end();

  const valid = verifier.verify(publicKeyPem, base64UrlDecode(signaturePart));
  if (!valid) {
    throw new OAuthAuthenticationError('Invalid bearer token signature.');
  }
}

function base64UrlDecode(value: string): Buffer {
  const normalized = value.replaceAll('-', '+').replaceAll('_', '/');
  const padding = '='.repeat((4 - (normalized.length % 4)) % 4);
  return Buffer.from(`${normalized}${padding}`, 'base64');
}

function assertStringClaim(value: unknown, claim: string): asserts value is string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new OAuthAuthenticationError(`Missing ${claim} claim.`);
  }
}

function assertNumberClaim(value: unknown, claim: string): asserts value is number {
  if (!Number.isFinite(value)) {
    throw new OAuthAuthenticationError(`Missing ${claim} claim.`);
  }
}

function assertIssuer(value: string, expected: string): void {
  if (value !== expected) {
    throw new OAuthAuthenticationError('Token issuer is not trusted.');
  }
}

function assertAudience(value: unknown, allowed: readonly string[]): void {
  const tokenAudience = readAudienceList(value);
  if (!tokenAudience.some((audience) => allowed.includes(audience))) {
    throw new OAuthAuthenticationError('Token audience is not accepted.');
  }
}

function assertExpiry(exp: number, nowSeconds: number, toleranceSeconds: number): void {
  if (exp + toleranceSeconds < nowSeconds) {
    throw new OAuthAuthenticationError('Bearer token has expired.');
  }
}

function assertNotBefore(nbf: unknown, nowSeconds: number, toleranceSeconds: number): void {
  if (nbf === undefined) return;
  if (!Number.isFinite(nbf)) {
    throw new OAuthAuthenticationError('Invalid nbf claim.');
  }
  if ((nbf as number) - toleranceSeconds > nowSeconds) {
    throw new OAuthAuthenticationError('Bearer token is not active yet.');
  }
}

function readAudienceList(value: unknown): readonly string[] {
  if (typeof value === 'string' && value.length > 0) return [value];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }
  return [];
}

function readActorType(value: unknown): AuthenticatedActorType {
  if (value === 'administrative' || value === 'service' || value === 'learner') {
    return value;
  }
  return 'learner';
}

function readOptionalString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function readStringList(value: unknown): readonly string[] {
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  }
  if (typeof value === 'string' && value.length > 0) return [value];
  return [];
}

function readCapabilities(claims: OAuthJwtClaims): readonly string[] {
  const capabilities = new Set(readStringList(claims.capabilities));
  if (typeof claims.scope === 'string') {
    for (const scope of claims.scope.split(' ')) {
      if (scope.length > 0) capabilities.add(scope);
    }
  }
  return [...capabilities];
}
