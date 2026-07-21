# First Migration Execution Approval

## Approval decision

| Item             | Approved value                                                                  |
| ---------------- | ------------------------------------------------------------------------------- |
| Decision         | `APPROVED FOR DEVELOPMENT EXECUTION`                                            |
| Approval date    | 2026-07-20                                                                      |
| Authority        | Project Product Owner / Architecture Governance                                 |
| Environment      | Configured local development PostgreSQL database only                           |
| Database target  | PostgreSQL 16.13, `localhost:5432`, database `prolific`, schema `public`        |
| Migration        | `services/core-api/prisma/migrations/20260717_initial_foundation/migration.sql` |
| Approved SHA-256 | `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`              |
| Approval use     | Consumed by successful Prisma deployment on 2026-07-20                          |

The approving authority accepts the technical recommendation in the [First Migration SQL Review](./FIRST-MIGRATION-SQL-REVIEW.md) and authorizes one Prisma deployment of the exact approved migration to the configured local development database. This approval does not apply to staging, production, another database, another checksum, or another migration.

## Approved object catalogue

Execution is limited to:

- one PostgreSQL enum, `taxonomy_lifecycle_state`;
- five tables: `actor_principals`, `languages`, `categories`, `topics`, and `taxonomy_change_records`;
- 26 named `CHECK` constraints;
- eight foreign keys;
- five primary keys;
- five non-primary `UNIQUE` table constraints;
- three partial unique indexes;
- nine non-unique indexes;
- 17 total non-primary indexes, including five unique-constraint backing indexes;
- four normalized columns with explicit PostgreSQL `"C"` collation; and
- Prisma's `_prisma_migrations` history table and one successful history row created by `prisma migrate deploy`.

No application data or seed row is approved.

## Environment boundary

The repository contains no active `.env` file and no inherited `DATABASE_URL`. The authorized command must therefore receive the exact local development URL represented by the repository's Compose defaults and `.env.example`. Before execution, the running container must independently confirm database `prolific`, user `prolific`, PostgreSQL 16.13, host port 5432, healthy status, and connection readiness.

The configured development database must have zero pre-existing public application relations, custom application types, public routines, and `_prisma_migrations` tables. Any mismatch cancels this approval for the current attempt.

## Execution conditions

Before deployment:

1. Recompute the migration SHA-256 and require an exact match with the approved value.
2. Confirm the migration directory contains only `20260717_initial_foundation` and one `migration.sql`.
3. Confirm `migration_lock.toml` specifies `provider = "postgresql"`.
4. Validate `schema.prisma` without changing it.
5. Confirm nothing is staged.
6. Capture the empty pre-execution catalogue.

The preferred and authorized execution command is:

```powershell
npx prisma migrate deploy --config ./prisma.config.ts
```

It must run once from `services/core-api` with the verified local development `DATABASE_URL`. `prisma migrate dev`, `db push`, and `migrate reset` are prohibited.

## Failure and rollback conditions

If Prisma fails before SQL execution, inspect PostgreSQL and Prisma history once and stop. Do not retry blindly. A controlled manual fallback is within the supplied approval only when all of the following can be proven: Prisma executed no migration step, the approved checksum is unchanged, the target remains the verified development database, `ON_ERROR_STOP=1` and a safe transaction boundary are used, and Prisma history can remain authoritative without fabricating a history row. If those conditions cannot all be met, manual execution is prohibited.

If execution starts and fails, do not reset, edit the migration, delete objects, mark a history row as resolved, or attempt rollback manually. Preserve the failed state, classify it, and obtain a reviewed recovery decision.

## Prohibited work

This approval does not authorize:

- migration execution outside the configured local development database;
- staging or production deployment;
- seed execution or application-row insertion;
- a second or additional migration;
- mutation of the approved Prisma schema or migration SQL;
- repository, service, API, controller, DTO, or Flutter implementation;
- production roles, grants, privileges, triggers, routines, or extensions; or
- staging, committing, tagging, or pushing repository files.

## Required post-execution verification

Success requires all of the following:

- exactly one successful Prisma history row named `20260717_initial_foundation`;
- populated `finished_at`, null `rolled_back_at`, correct checksum, and no failed/partial history row;
- exact live object counts matching the approved catalogue;
- correct types, nullability, defaults, timestamp precision, collation, predicates, and referential actions;
- empty application tables;
- no Prisma-representable drift among `schema.prisma`, migration SQL, and PostgreSQL;
- all reviewed PostgreSQL-only controls present;
- successful Prisma format, validation, generation, and migration status; and
- documented execution evidence and continued blocking of seeds and downstream implementation.

This approval is consumed by one successful development execution or suspended by any execution failure. It grants no authority beyond that boundary.

## Execution result

The approved command succeeded on its first attempt on 2026-07-20. The [First Migration Execution Report](./FIRST-MIGRATION-EXECUTION-REPORT.md) records the exact history, live-catalogue, empty-table, and drift evidence. Initial migration execution is `COMPLETE`; post-migration verification is `PASS`; seed execution and repository/API/service/Flutter work remain blocked.
