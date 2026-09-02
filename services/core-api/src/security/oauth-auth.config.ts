export const OAUTH_AUTH_CONFIG = Symbol('OAUTH_AUTH_CONFIG');

export interface OAuthAuthConfig {
  readonly issuer: string;
  readonly audience: readonly string[];
  readonly publicKeyPem: string;
  readonly clockToleranceSeconds: number;
}

const DEFAULT_CLOCK_TOLERANCE_SECONDS = 60;

export function readOAuthAuthConfig(env: NodeJS.ProcessEnv = process.env): OAuthAuthConfig | null {
  const issuer = readRequired(env.OAUTH_ISSUER);
  const audience = readCsv(env.OAUTH_AUDIENCE);
  const publicKeyPem = readPublicKey(env);

  if (issuer === null || audience.length === 0 || publicKeyPem === null) {
    return null;
  }

  return {
    issuer,
    audience,
    publicKeyPem,
    clockToleranceSeconds: readClockTolerance(env.OAUTH_CLOCK_TOLERANCE_SECONDS),
  };
}

function readRequired(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed === undefined || trimmed.length === 0 ? null : trimmed;
}

function readCsv(value: string | undefined): readonly string[] {
  const trimmed = value?.trim();
  if (trimmed === undefined || trimmed.length === 0) return [];
  return trimmed
    .split(',')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

function readPublicKey(env: NodeJS.ProcessEnv): string | null {
  const base64Pem = readRequired(env.OAUTH_PUBLIC_KEY_PEM_BASE64);
  if (base64Pem !== null) {
    return Buffer.from(base64Pem, 'base64').toString('utf8');
  }

  const escapedPem = readRequired(env.OAUTH_PUBLIC_KEY_PEM);
  return escapedPem?.replaceAll('\\n', '\n') ?? null;
}

function readClockTolerance(value: string | undefined): number {
  if (value === undefined || value.trim().length === 0) {
    return DEFAULT_CLOCK_TOLERANCE_SECONDS;
  }

  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 300) {
    return DEFAULT_CLOCK_TOLERANCE_SECONDS;
  }

  return parsed;
}
