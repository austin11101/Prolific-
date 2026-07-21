# First Migration Execution Report

## Outcome

| Item                                           | Result                                                                           |
| ---------------------------------------------- | -------------------------------------------------------------------------------- |
| Initial migration execution                    | `COMPLETE`                                                                       |
| Post-migration verification                    | `PASS`                                                                           |
| Execution date                                 | 2026-07-20                                                                       |
| Authority                                      | Project Product Owner / Architecture Governance                                  |
| Target                                         | Local development PostgreSQL 16.13 at `localhost:5432/prolific`, schema `public` |
| Migration                                      | `20260717_initial_foundation`                                                    |
| Approved and executed SHA-256                  | `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`               |
| Seed execution                                 | `BLOCKED`                                                                        |
| Repository implementation                      | `BLOCKED PENDING SPRINT 2.16 APPROVAL`                                           |
| APIs, services, Flutter, additional migrations | `BLOCKED`                                                                        |

The [First Migration Execution Approval](./FIRST-MIGRATION-EXECUTION-APPROVAL.md) authorized one application of the exact reviewed migration to the configured local development database. The migration succeeded on the first Prisma deployment attempt. No fallback, manual migration SQL execution, reset, database recreation, or migration edit occurred.

## Pre-execution state

The migration file matched the supplied approved checksum immediately before execution. The package contained exactly one migration directory, one `migration.sql`, and `migration_lock.toml` with provider `postgresql`. `schema.prisma` validated and nothing was staged.

The repository contains no active `.env` file and the process inherited no `DATABASE_URL`. The target was established without ambiguity from all of the following matching evidence:

- `compose.yaml` defaults and `.env.example`: `localhost:5432/prolific`, schema `public`;
- running container environment: database `prolific`, user `prolific`;
- Docker port mapping: host port 5432 to container port 5432;
- Docker status: running and healthy;
- `pg_isready`: accepting connections; and
- live SQL identity: PostgreSQL 16.13, current database/user `prolific`.

The exact verified local development URL was supplied only to the authorized Prisma process. Credentials were not written to the repository or documentation.

Pre-execution catalogue:

| Object                          | Count |
| ------------------------------- | ----: |
| Public application relations    |     0 |
| Public custom application types |     0 |
| Public routines                 |     0 |
| `_prisma_migrations` tables     |     0 |

Any nonzero count would have stopped execution.

## Command and execution result

Executed once from `services/core-api`:

```powershell
npx prisma migrate deploy --config ./prisma.config.ts
```

Prisma detected one migration, applied `20260717_initial_foundation`, and reported that all migrations were successfully applied. `prisma migrate dev`, `db push`, `migrate reset`, seed commands, and manual SQL were not run.

## Prisma migration history

Exactly one history row exists:

| Field                 | Verified value                                                     |
| --------------------- | ------------------------------------------------------------------ |
| `migration_name`      | `20260717_initial_foundation`                                      |
| `checksum`            | `acf58378b548f4677aabfb65260da6e19c6d617b5162ac2bf444149e36ff837d` |
| `finished_at`         | Populated                                                          |
| `rolled_back_at`      | Null                                                               |
| `applied_steps_count` | 1                                                                  |
| Failure logs          | None                                                               |

No failed, partial, duplicate, or rolled-back migration row exists. Prisma created and owns the history entry; no row was fabricated or reconciled manually.

## Live PostgreSQL catalogue

| Object class                               | Verified count |
| ------------------------------------------ | -------------: |
| Application tables                         |              5 |
| Application enums                          |              1 |
| CHECK constraints                          |             26 |
| Foreign-key constraints                    |              8 |
| Primary-key constraints                    |              5 |
| Non-primary unique table constraints       |              5 |
| Standalone ordinary unique indexes         |              0 |
| Partial unique indexes                     |              3 |
| Non-unique indexes                         |              9 |
| Total non-primary indexes                  |             17 |
| Explicit `"C"`-collated normalized columns |              4 |
| UUID database defaults                     |              0 |
| Non-internal triggers                      |              0 |
| Application routines                       |              0 |
| Generated columns                          |              0 |
| JSONB columns                              |              0 |
| Extra application tables                   |              0 |

The five tables are `actor_principals`, `languages`, `categories`, `topics`, and `taxonomy_change_records`. The enum is `taxonomy_lifecycle_state` with ordered values `active`, `archived`.

## Field, type, nullability, and default audit

The live schema contains 52 approved application columns:

| PostgreSQL type            | Count |
| -------------------------- | ----: |
| `uuid`                     |    14 |
| `text`                     |    15 |
| `integer`                  |     8 |
| `boolean`                  |     1 |
| `timestamptz(6)`           |    12 |
| `taxonomy_lifecycle_state` |     2 |

Thirteen columns are nullable exactly as approved: Language retirement time; Category icon/archive time; Topic parent/archive time; and the eight optional taxonomy-change target/evidence/correction fields. Fourteen approved database defaults are present. No UUID field has a database default. Every `*_at` column is `timestamptz(6)`.

## Constraint, index, collation, and action audit

All 26 reviewed check constraints are installed. The audit checks enforce exact-one target, target/operation compatibility, reason-code shape, lifecycle applicability, parent applicability/change, version progression, and no self-supersession. Application-owned recursive hierarchy and correction-chain rules remain outside database triggers and routines.

The live partial predicates are:

- active Category normalized name;
- active root Topic name with `parent_topic_id IS NULL`; and
- active child Topic name with `parent_topic_id IS NOT NULL`.

All predicates use the mapped lowercase `active` enum value. Explicit `"C"` collation is present only on `languages.normalized_tag`, `languages.normalized_name`, `categories.normalized_canonical_name`, and `topics.normalized_canonical_name`.

All eight foreign keys use `ON DELETE RESTRICT` and `ON UPDATE NO ACTION`. No cascade action exists.

## Empty-table verification

| Table                     | Rows |
| ------------------------- | ---: |
| `actor_principals`        |    0 |
| `languages`               |    0 |
| `categories`              |    0 |
| `topics`                  |    0 |
| `taxonomy_change_records` |    0 |

No seed or application row was inserted.

## Prisma and drift verification

- `prisma format`: PASS;
- `prisma validate`: PASS;
- `prisma generate`: PASS with Prisma Client 7.8.0;
- `prisma migrate status`: PASS, one migration found, database up to date;
- live datasource to approved `schema.prisma` diff: empty migration;
- `schema.prisma`: byte-unchanged by verification; and
- `migration.sql`: byte-unchanged with the approved SHA-256.

There is no Prisma-representable drift. Direct PostgreSQL inspection separately confirms that all reviewed Prisma-inexpressible checks, partial predicates, and explicit collations remain installed.

## Findings

| ID       | Severity    | Finding                                                                             | Status                                                                                                                                                                                  |
| -------- | ----------- | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FMER-001 | OBSERVATION | No active `.env` or inherited `DATABASE_URL` existed.                               | The target was unambiguously established from repository defaults plus live container/database identity and supplied explicitly to the one authorized process. No secret was persisted. |
| FMER-002 | OBSERVATION | The earlier Windows `migrate dev --create-only` shadow-engine path failed opaquely. | `prisma migrate deploy` succeeded on the first attempt; this did not affect execution. Retain the development-workflow finding for future migration generation.                         |

Blockers: zero. Major findings: zero. Minor execution findings: zero.

## Remaining restrictions and next milestone

Successful migration execution does not authorize downstream work:

- seed execution remains blocked;
- repository implementation was blocked at the Sprint 2.15 checkpoint; Sprint 2.16 subsequently authorized the bounded work in the [Foundation Baseline](./FOUNDATION-BASELINE.md);
- services, APIs, controllers, DTOs, and Flutter remain blocked;
- additional migrations require a new bounded review and approval;
- staging and production deployment remain blocked; and
- production roles, grants, and privileges remain unimplemented.

**Next milestone recommendation:** present the verified execution evidence for a focused Sprint 2.16 repository-implementation approval. That approval must define exact repository scope, tests, transaction boundaries, and prohibited adjacent work before implementation begins.
