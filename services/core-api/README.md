# Prolific Core API

NestJS scaffold for the Prolific versioned REST API and Sprint 2 Prisma tooling boundary.

The application contains the Nest bootstrap, an empty root module, and a non-global Prisma infrastructure module skeleton. Prisma 7 uses the PostgreSQL driver adapter and a bounded `pg` pool configured from environment variables. The model-free Prisma schema generates infrastructure-only client code into an ignored path. Product features, repositories, authentication, physical database entities, migrations, lesson APIs, and synchronization behaviour are intentionally not implemented.

## Database environment

Copy the repository `.env.example` values into a local ignored environment file or provide them through the shell/runtime. Required and optional variables are:

```text
DATABASE_URL=postgresql://<user>:<password>@localhost:5432/<database>?schema=public
DATABASE_POOL_MAX=10
DATABASE_CONNECTION_TIMEOUT_MS=5000
DATABASE_IDLE_TIMEOUT_MS=30000
```

`DATABASE_URL` is required when constructing the Prisma module. Credentials must never be committed.

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

Public API routes will use the `/api/v1` prefix when feature modules are introduced.
