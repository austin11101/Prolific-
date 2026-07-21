export interface PrismaDatabaseConfig {
  readonly databaseUrl: string;
  readonly poolMax: number;
  readonly connectionTimeoutMillis: number;
  readonly idleTimeoutMillis: number;
}

export const PRISMA_DATABASE_CONFIG = Symbol('PRISMA_DATABASE_CONFIG');

const DEFAULT_POOL_MAX = 10;
const DEFAULT_CONNECTION_TIMEOUT_MS = 5_000;
const DEFAULT_IDLE_TIMEOUT_MS = 30_000;

function readPositiveInteger(
  value: string | undefined,
  fallback: number,
  variableName: string,
): number {
  if (value === undefined || value.trim() === '') {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${variableName} must be a positive integer.`);
  }

  return parsed;
}

export function readPrismaDatabaseConfig(
  environment: NodeJS.ProcessEnv = process.env,
): PrismaDatabaseConfig {
  const databaseUrl = environment.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to configure the Prisma PostgreSQL adapter.');
  }

  return {
    databaseUrl,
    poolMax: readPositiveInteger(
      environment.DATABASE_POOL_MAX,
      DEFAULT_POOL_MAX,
      'DATABASE_POOL_MAX',
    ),
    connectionTimeoutMillis: readPositiveInteger(
      environment.DATABASE_CONNECTION_TIMEOUT_MS,
      DEFAULT_CONNECTION_TIMEOUT_MS,
      'DATABASE_CONNECTION_TIMEOUT_MS',
    ),
    idleTimeoutMillis: readPositiveInteger(
      environment.DATABASE_IDLE_TIMEOUT_MS,
      DEFAULT_IDLE_TIMEOUT_MS,
      'DATABASE_IDLE_TIMEOUT_MS',
    ),
  };
}
