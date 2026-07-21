# Category Repository Review

## Review summary

| Item                          | Result              |
| ----------------------------- | ------------------- |
| Sprint                        | 2.20                |
| Review date                   | 2026-07-20          |
| Category repository           | `COMPLETE`          |
| Category mapper               | `COMPLETE`          |
| Category reads                | `COMPLETE`          |
| Controlled versioned mutation | `COMPLETE`          |
| Optimistic concurrency        | `COMPLETE`          |
| Contract amendment            | None                |
| Development database          | Unchanged and empty |
| Topic/audit repositories      | `NOT IMPLEMENTED`   |

## Authorization boundary

Sprint 2.20 implements only the existing Category persistence contract, explicit mapper, Prisma adapter, dependency-injection binding, safe error translation, and associated unit and disposable-database tests. It does not implement a service, use case, controller, API, DTO, authentication, authorization, Topic repository, Taxonomy Change Record repository, automatic audit workflow, seed, migration, development-database write, PostgreSQL schema change, or Flutter work.

The adapter persists state that a future authorized application workflow has already validated. It does not decide taxonomy business transitions, normalize names, authorize actors, or append audit evidence automatically.

## Source and contract reconciliation

The implemented schema and existing `CategoryRepository` contract are narrower than several examples in the Sprint brief:

- Category has no `createdByActorPrincipalId` or `updatedByActorPrincipalId` column or contract field.
- The contract has no create, list-all, explicit archive, explicit restore, reorder, or existence operation.
- `persistVersionedChange` updates an existing Category and can persist a caller-approved lifecycle or ordering state; it does not create a Category or define those workflows.
- Taxonomy evidence belongs to the separately gated `TaxonomyChangeRecordRepository` and future application-owned transaction.
- The Category adapter has no approved raw-query exception. The documented Category `FOR UPDATE` exception belongs to the future aggregate-oriented Topic hierarchy transaction, not this whole-record Category update.

No fields or methods were added to compensate for these differences. Canonical model and glossary material was read from the existing `docs/architecture/canonical-domain-model.md` and `docs/02-requirements/domain-glossary.md` paths.

## Exact physical model

`categories` contains:

| Field                     | Physical representation                     | Rule                                                      |
| ------------------------- | ------------------------------------------- | --------------------------------------------------------- |
| `id`                      | UUID                                        | Immutable application-assigned primary key                |
| `canonicalName`           | text                                        | Required, non-blank                                       |
| `normalizedCanonicalName` | text with explicit PostgreSQL `C` collation | Required; active rows use partial uniqueness              |
| `lifecycleState`          | `active` or `archived` enum                 | Required; defaults active                                 |
| `displayOrder`            | integer                                     | Non-negative                                              |
| `iconKey`                 | nullable text                               | Optional current metadata                                 |
| `lockVersion`             | positive integer                            | Starts at 1; metadata/lifecycle/order concurrency token   |
| `hierarchyVersion`        | positive integer                            | Starts at 1; Category-scoped future Topic hierarchy token |
| `archivedAt`              | nullable `timestamptz(6)`                   | Null only when active; required when archived             |
| `createdAt` / `updatedAt` | `timestamptz(6)`                            | Created time immutable; updated time supplied by caller   |

There are no actor-attribution columns. The active-name rule is the PostgreSQL partial unique index `uq__categories__active_name`; archived duplicates are permitted.

## Implemented contract and domain type

The existing contract remains unchanged:

- `findById`;
- `findActiveByNormalizedName`;
- `listByLifecycle`; and
- `persistVersionedChange`.

`CategoryRecord`, `PersistCategoryChangeInput`, and `CategoryMutationResult` remain readonly, Prisma-independent, and transport-independent. Mutation input keeps lock and hierarchy expectations separate. The result reports both previous and resulting versions separately.

## Mapper behavior

`CategoryMapper` explicitly maps all approved fields and both lifecycle representations. It preserves UUID, canonical and normalized names, display order, icon, lock version, and hierarchy version; defensively copies all dates; freezes the returned record; and rejects unsupported persistence or domain lifecycle values. It performs no normalization, ID generation, version calculation, lifecycle decision, database query, actor handling, or audit creation.

## Read semantics

- `findById` uses the UUID primary key and returns a mapped record or `null`.
- `findActiveByNormalizedName` uses `findFirst` because Prisma cannot represent the approved partial unique index as a model-level unique input. It filters `normalizedCanonicalName` plus `ACTIVE`, passes caller input unchanged, and returns zero or one record.
- `listByLifecycle` maps the requested domain state to the exact Prisma enum and orders by `displayOrder ASC`, then `id ASC`.
- Reads use `PrismaService` without context or the exact resolved transaction client when an approved optional context is supplied. They do not open transactions.

PostgreSQL `C` comparison behavior was verified: `science` finds the active fixture while `SCIENCE` does not.

## Versioned update and lifecycle behavior

`persistVersionedChange` requires a valid caller-owned transaction context and uses `updateManyAndReturn` with an atomic predicate on:

- Category UUID;
- expected lock version; and
- expected hierarchy version.

It writes only approved mutable state, uses the caller-supplied `updatedAt`, increments lock version once, and does not write hierarchy version. It never uses the root client, starts a transaction, performs raw SQL, creates a row, deletes a row, provisions an actor, or inserts taxonomy evidence.

Archive and restore are not separate repository methods. A future authorized workflow may pass approved archived or active state through `persistVersionedChange`. The database enforces lifecycle/timestamp consistency and active-name uniqueness. Integration tests verified a durable archive and restore, plus a restore conflict when another active Category already owns the normalized name.

## Mutation/version matrix

| State persisted through the existing operation | Lock version | Hierarchy version | Notes                                                        |
| ---------------------------------------------- | ------------ | ----------------- | ------------------------------------------------------------ |
| Canonical or normalized name                   | `+1`         | unchanged         | Active partial uniqueness remains database-authoritative     |
| Display order or icon                          | `+1`         | unchanged         | Category metadata/order concurrency                          |
| Archive or restore state                       | `+1`         | unchanged         | Timestamp consistency and restore uniqueness enforced        |
| Future Topic hierarchy mutation                | not owned    | not owned         | Deferred to Topic/taxonomy transaction; not implemented here |

`hierarchyVersion` is still compared during Category persistence so a Category change cannot ignore a concurrently changed hierarchy owner. It is incremented only by a future authorized hierarchy transaction, consistent with the approved physical and concurrency decisions.

## Missing versus concurrency distinction

When the atomic write returns no row, the adapter performs one same-transaction ID/version selection:

- absent UUID becomes `EntityNotFoundError`;
- changed lock version becomes `OptimisticConcurrencyError` with code `OPTIMISTIC_LOCK_CONCURRENCY`;
- changed hierarchy version becomes code `OPTIMISTIC_HIERARCHY_CONCURRENCY`; and
- both changed becomes code `OPTIMISTIC_LOCK_AND_HIERARCHY_CONCURRENCY`.

No current database version is included in public errors. This narrow extension preserves the existing generic `OPTIMISTIC_CONCURRENCY` code for unspecified callers and does not change Language or Actor Principal behavior.

## Duplicate and constraint behavior

PostgreSQL partial uniqueness is the final authority. Restoring the archived `science` fixture while an active `science` row existed produced `DuplicateEntityError`; the archived row remained unchanged. An archived duplicate was otherwise stored and read successfully.

Prisma known uniqueness/foreign-key/null/check codes map to existing safe errors. Prisma 7's PostgreSQL driver adapter exposes check violations as a structured `DriverAdapterError` with `cause.kind = postgres` and SQLSTATE `23514`; a narrow structural classifier maps only that code to `ConstraintViolationError` without parsing or exposing its provider message.

## Actor Principal and audit boundaries

The Category table and contract contain no Actor Principal foreign key. The repository therefore does not accept, provision, query, or mutate an actor. No taxonomy audit record is created. Future governed Category workflows must combine the Category and Taxonomy Change Record repositories under one separately authorized application-owned transaction with an already-provisioned actor.

## Dependency injection

`PersistenceModule` registers and exports `CATEGORY_REPOSITORY` through `useExisting` alongside `ACTOR_PRINCIPAL_REPOSITORY`, `LANGUAGE_REPOSITORY`, and `TRANSACTION_MANAGER`. Topic and Taxonomy Change Record tokens remain unbound and fail resolution. Concrete adapters are not exported, the module remains non-global, and `AppModule` remains unchanged.

## Test and validation evidence

### Unit, build, and static results

- Category mapper: 6 tests passed.
- Category repository: 16 tests passed.
- Focused mapper/repository/module verification: passed.
- Full unit suite: 12 suites and 79 tests passed.
- Full e2e suite: 1 suite and 1 test passed.
- Formatting, ESLint, production TypeScript, test-inclusive TypeScript, and NestJS build: passed.
- Prisma validate, generate, and migrate status: passed with Prisma 7.8.0 and one applied migration.
- Live datasource-to-schema diff: empty migration; zero Prisma-representable drift.

### Category disposable integration

- Passing database: `prolific_category_repository_test_20260720_132348_554`.
- PostgreSQL: 16.13 using the existing PostgreSQL 16 service.
- Applied content: only migration `20260717_initial_foundation`.
- Result: 1 suite and 11 tests passed.
- Covered: missing/UUID/active-name reads, `C` comparison, lifecycle filtering and ordering, expected-version metadata update, separate lock/hierarchy conflicts, archive/restore, archived duplicate allowance, restore uniqueness conflict, check-constraint translation, rollback, two-client concurrent mutation, invalid context, and unrelated-table isolation.
- Concurrency result: exactly one transaction succeeded with expected lock version 1; the loser received `OptimisticConcurrencyError`; final lock version was 2.
- Cleanup: all connections closed, database dropped, and catalogue lookup returned zero.

An earlier disposable run exposed the Prisma driver-adapter check-classification gap. It failed one assertion, rolled back the invalid update, and was dropped. The narrow structural classification was added and the full fresh suite then passed.

### Regression databases

- Language: `prolific_language_repository_test_20260720_132439_191`; 5 tests passed; dropped.
- Actor Principal: `prolific_actor_principal_repository_test_20260720_132813_365`; 7 tests passed; dropped.
- Final catalogue search found no repository test database.

## Development-database safety

Before and after testing, the configured `prolific` database remained PostgreSQL 16.13 with five approved application tables, one approved enum, one successful migration, no failed or rolled-back migration, zero rows in every application table, and zero Prisma-representable drift. No integration fixture or mutation used its URL.

The frozen checksums remain:

- Prisma schema: `0C503B9B77346F0114093C47CF5E6C513749620465AF545165F1513DBE569113`;
- initial migration: `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`.

## Multidisciplinary findings

| Severity      | Perspective        | Finding                                                                                           | Resolution                                                                                                 |
| ------------- | ------------------ | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `MAJOR`       | Architecture       | Brief examples exceeded the existing update-only contract and included absent actor/audit fields. | Resolved by preserving the exact contract and documenting non-applicable operations.                       |
| `MAJOR`       | Backend / Data     | A zero-row conditional update could mean missing, lock conflict, or hierarchy conflict.           | Resolved with atomic update and narrow same-transaction version diagnosis using safe conflict kinds.       |
| `MAJOR`       | Data / Backend     | Prisma's driver adapter did not convert PostgreSQL check SQLSTATE `23514` to a known Prisma code. | Resolved with a structural, code-only classifier; no provider-message parsing or leakage.                  |
| `MAJOR`       | Concurrency        | Concurrent whole-record updates could become last-write-wins without an atomic predicate.         | Resolved and integration-tested: one success, one safe conflict, one lock increment.                       |
| `OBSERVATION` | Product/Governance | Category lifecycle persistence alone cannot satisfy the required future audit workflow.           | Audit/service work remains blocked; the adapter does not claim to implement a complete governance command. |

No blocker or unresolved major finding remains.

## Remaining prohibited work

- Category creation or unrestricted CRUD outside the existing contract.
- Topic and Taxonomy Change Record repository implementation and the aggregate taxonomy transaction.
- Automatic actor provisioning, authentication, authorization, audit workflow, or application service.
- Language mutation or Actor Principal behavior beyond existing controlled provisioning.
- Controllers, DTOs, APIs, seeds, development-data insertion, schema changes, migrations, or PostgreSQL changes.
- Flutter, staging/production deployment, commit, tag, or push.

## Recommendation for Topic work

Accept the Category repository as the atomic current-row persistence component. Do not implement Topic as an isolated table CRUD adapter. Its authorization should include the Category row-lock exception, expected Category hierarchy version, affected Topic lock versions, same-Category and cycle validation, active sibling uniqueness, atomic version updates, and Taxonomy Change Record insertion as one reviewed aggregate-oriented persistence slice.
