# Prolific Core API

NestJS scaffold for the Prolific versioned REST API and Sprint 2 Prisma tooling boundary.

The application contains the Nest bootstrap, a provider-neutral OAuth/OIDC bearer-token security boundary, and the non-global Prisma infrastructure modules. Prisma 7 uses the PostgreSQL driver adapter and a bounded `pg` pool configured from environment variables. Product registration, provider-hosted login, refresh-token rotation, physical account/session entities, lesson APIs, and synchronization behaviour are intentionally not implemented yet.

## Database environment

Copy the repository `.env.example` values into a local ignored environment file or provide them through the shell/runtime. Required and optional variables are:

```text
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>?schema=public
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_IDLE_TIMEOUT_MS=30000
```

`DATABASE_URL` is required when constructing the Prisma module. Credentials must never be committed.

## OAuth environment

The first authentication slice treats the Core API as an OAuth/OIDC resource server. It verifies RS256 bearer access tokens issued by an approved external provider. Configure:

```text
OAUTH_ISSUER=https://identity.example.test/
OAUTH_AUDIENCE=prolific-core-api
OAUTH_PUBLIC_KEY_PEM_BASE64=base64_encoded_rs256_public_key_pem
OAUTH_CLOCK_TOLERANCE_SECONDS=60
```

`OAUTH_PUBLIC_KEY_PEM` may be used instead of the base64 setting for local experiments, with newlines escaped as `\n`. The mounted session endpoint is `GET /api/v1/auth/session`.

## Commands

Run these from the repository root:

```text
npm run dev:api
npm run lint:api
npm run test:api
npm run test:api:e2e
npm run build:api
npm --workspace @prolific/core-api run prisma:validate
npm --workspace @prolific/core-api run prisma:format
npm --workspace @prolific/core-api run prisma:generate
```

The Prisma commands validate, format, and generate only. Migration, push, pull, reset, deploy, and seed scripts remain intentionally absent. Generated output is written to `src/infrastructure/persistence/generated/prisma/` and ignored by Git.

Public API routes use the `/api/v1` prefix.
