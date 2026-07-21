# Actor Principal Repository Review

## Review summary

| Item                                   | Result              |
| -------------------------------------- | ------------------- |
| Sprint                                 | 2.19                |
| Review date                            | 2026-07-20          |
| Actor Principal repository             | `COMPLETE`          |
| Actor Principal mapper                 | `COMPLETE`          |
| Controlled provisioning                | `COMPLETE`          |
| Duplicate and concurrent-race handling | `COMPLETE`          |
| Contract amendment                     | None                |
| Authentication or authorization        | `NOT IMPLEMENTED`   |
| Development database                   | Unchanged and empty |

## Authorization boundary

Sprint 2.19 implements only the Actor Principal mapper, Prisma repository adapter, dependency-injection binding, controlled persistence-only provisioning, and associated tests. It does not implement authentication, authorization, credentials, login, profiles, identity-provider integration, services, use cases, controllers, APIs, DTOs, seeds, migrations, PostgreSQL schema changes, or Flutter work.

Actor Principals are restricted pseudonymous audit identities. The repository receives an already-approved immutable identity from a trusted future workflow; it does not decide whether the caller is trusted and is not an identity directory.

## Source reconciliation

The Sprint brief referred to `docs/06-domain/canonical-domain-model.md`, `docs/06-domain/domain-glossary.md`, and `docs/06-domain/aggregate-boundaries.md`; those paths do not exist. The canonical model and glossary are [Canonical Domain Model](../architecture/canonical-domain-model.md) and [Domain Glossary](../02-requirements/domain-glossary.md). No standalone aggregate-boundaries document exists; the reviewed repository and aggregate boundaries are recorded in the canonical model, [Backend Architecture](../06-core-backend/backend-architecture.md), [Persistence Architecture](../04-architecture/persistence-architecture.md), physical proposal, and implementation decisions.

The brief's external-subject lookup examples do not apply to the approved model. The physical schema intentionally contains no provider subject, email, username, profile, role, permission, token, or credential field. No such field or operation was invented.

## Exact physical model

`actor_principals` contains exactly:

| Field       | Representation                              | Rule                                                  |
| ----------- | ------------------------------------------- | ----------------------------------------------------- |
| `id`        | application-supplied PostgreSQL UUID        | Immutable primary key; no database UUID default       |
| `actorKind` | `administrative`, `service`, or `system`    | Required constrained text; `learner` is not permitted |
| `createdAt` | PostgreSQL `timestamptz(6)` default `now()` | Immutable persistence timestamp                       |

The table has one primary key, one actor-kind check, no secondary unique identity, no lifecycle field, and no mutation surface beyond controlled provisioning.

## Contract and record

The existing `ActorPrincipalRepository` contract was sufficient and remains unchanged:

- `findById(id, context?)` returns the mapped record or `null`;
- `existsById(id, context?)` returns a boolean using an ID-only selection; and
- `provisionControlled(input, context)` requires a transaction context and returns the stored immutable record.

`ActorPrincipalRecord` remains persistence-neutral and readonly with `id`, `actorKind`, and `createdAt`. It contains no Prisma import or generated type, and no user, provider, authentication, authorization, or transport concern.

## Mapper behavior

`ActorPrincipalMapper` is infrastructure-owned and explicit. It maps every approved field, preserves the application UUID and actor kind, copies `createdAt`, freezes the result, and rejects unsupported persisted actor kinds. It performs no ID generation, normalization, validation of claims, database access, provisioning, or authorization.

## Lookup and existence semantics

`findById` uses the UUID primary key and maps only a present result. `existsById` uses `findUnique` with `select: { id: true }`, returns only a boolean, and does not invoke the mapper. Reads use the root client without context and the exact transaction-scoped client when a valid optional context is supplied. No list, search, update, deactivate, delete, or external-subject operation exists.

## Controlled provisioning and concurrency

Provisioning requires the caller-owned `TransactionalRepositoryOperationContext`. The adapter resolves that opaque context through `PrismaTransactionManager`, calls `createMany` with the application-supplied UUID and `skipDuplicates: true`, and then re-reads the exact UUID in the same transaction.

- A new UUID creates one row.
- Repeating the same UUID and actor kind returns the equivalent stored record idempotently.
- Reusing the UUID with a different actor kind returns `DuplicateEntityError` and never overwrites the immutable row.
- PostgreSQL primary-key uniqueness is the final concurrency guard.
- Concurrent equivalent provisioning waits at the constraint boundary and both callers resolve to the same single row.
- No pre-insert existence check is relied upon, no raw SQL is used by the adapter, and no retry loop or nested transaction is opened.

The disposable PostgreSQL integration race used two independent Prisma clients and caller-owned transactions. Both calls completed with the same mapped record and the database contained exactly one row.

## Transaction and rollback behavior

Simple reads do not open transactions. Controlled provisioning cannot use the root client and requires the exact active context resolved by `PrismaTransactionManager`. Foreign, expired, and otherwise invalid contexts fail with `InvalidTransactionContextError` before mutation. Prisma transaction clients never cross the domain contract.

An integration test provisioned a row and then deliberately failed the caller-owned transaction. The failure propagated and the row was absent afterward. A successful transaction persisted exactly one row.

## Error translation

The adapter translates:

- Prisma `P2002` uniqueness failures to `DuplicateEntityError`;
- initialization, engine panic, connection, operation-timeout, closed-connection, and pool-timeout failures to `RepositoryUnavailableError`; and
- other provider failures to the safe generic `PersistenceError`.

Invalid transaction-context errors propagate unchanged. Mapper/programming failures occur outside the provider translation boundary and are not misclassified. Public messages contain no SQL, connection strings, provider details, credentials, or actor identifiers; original causes remain private through the established persistence-error mechanism.

## Dependency injection

`PersistenceModule` explicitly registers and exports `ACTOR_PRINCIPAL_REPOSITORY` through `useExisting`. The existing `LANGUAGE_REPOSITORY` and `TRANSACTION_MANAGER` bindings remain intact. Category, Topic, and Taxonomy Change Record tokens remain unbound and fail resolution. Concrete repository classes are not exported, the module remains non-global, and `AppModule` is unchanged.

## Test and validation evidence

### Unit, build, and static validation

- Focused mapper, repository, and module tests: 20 passed.
- Full unit suite: 10 suites and 54 tests passed.
- Full e2e suite: 1 suite and 1 test passed.
- Formatting, ESLint, production TypeScript, test-inclusive TypeScript, and NestJS build: passed.
- Prisma validate, generate, and migrate status: passed with Prisma 7.8.0 and one applied migration.
- Live datasource-to-schema diff: empty migration; zero Prisma-representable drift.

### Actor Principal integration environment

- Disposable database: `prolific_actor_principal_repository_test_20260720_124811_775`.
- PostgreSQL: 16.13 using the existing local PostgreSQL 16 service.
- Applied content: only migration `20260717_initial_foundation`.
- Result: 1 suite and 7 tests passed.
- Scenarios: missing lookup/existence, successful provision and lookup, ID-only existence, immutable mapped result, idempotent repeat, conflicting-kind duplicate, two-client concurrent race, rollback, invalid context before write, and zero unrelated-table writes.
- Cleanup: connections closed, database dropped, and exact-name catalogue lookup returned zero.

### Language regression environment

- Disposable database: `prolific_language_repository_test_20260720_124854_162`.
- Applied content: only migration `20260717_initial_foundation`.
- Result: 1 suite and 5 tests passed.
- Cleanup: database dropped and exact-name catalogue lookup returned zero.

## Development-database safety

Before testing, the configured `prolific` database was PostgreSQL 16.13 with one successful migration, no failed or rolled-back migration, and zero rows in all five application tables. Final verification confirmed the same five-table/one-enum catalogue, one successful migration, zero failed history, zero rows, zero drift, and no remaining Actor Principal or Language test database. No fixture or repository provisioning operation targeted the development database.

The frozen checksums remain:

- Prisma schema: `0C503B9B77346F0114093C47CF5E6C513749620465AF545165F1513DBE569113`;
- initial migration: `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`.

## Authentication and architecture audits

The implementation contains no password or hashing, JWT or claim parsing, OAuth/OIDC/SAML client, login or registration handler, session or token management, role or permission model, email identity assumption, provider SDK, profile API, middleware, guard, controller, transport DTO, or endpoint.

Domain persistence code contains no Prisma import and returns no generated type. Mapper and adapter remain infrastructure-owned. No generic repository, base CRUD class, application service, use case, raw query, schema change, migration, seed, Language mutation, or unrelated repository implementation was introduced.

## Multidisciplinary findings

| Severity      | Perspective          | Finding                                                                                    | Resolution                                                                                                    |
| ------------- | -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `MAJOR`       | Product / Security   | Brief examples implied an external subject that the approved model expressly prohibits.    | Resolved by preserving the three-field physical model and exact existing ID-based contract.                   |
| `MAJOR`       | Backend / Data       | Check-then-create alone would not safely resolve concurrent idempotent provisioning.       | Resolved with constraint-backed `skipDuplicates`, exact re-read, kind comparison, and a two-client race test. |
| `MAJOR`       | Security / Backend   | Raw provider failures could expose sensitive infrastructure or actor values.               | Resolved with narrow safe translation and private causes.                                                     |
| `OBSERVATION` | Architecture         | Three supplied `docs/06-domain` paths do not exist.                                        | Canonical existing sources were used; the missing standalone aggregate-boundaries path is recorded.           |
| `OBSERVATION` | Product / Governance | The approved actor has no runtime lifecycle, label, authentication, or authorization data. | Preserved exactly; future linkage and access policy remain separate, explicitly gated work.                   |

No blocker or unresolved major finding remains.

## Remaining prohibited work

- Actor Principal update, deletion, lifecycle, profile, authentication, authorization, or public provisioning workflow.
- Category, Topic, or Taxonomy Change Record concrete repository implementation.
- Language mutation.
- Application services, use cases, controllers, transport DTOs, APIs, guards, or `AppModule` integration.
- Seed execution, development-data insertion, schema changes, additional migrations, and PostgreSQL changes.
- Flutter work, staging, production deployment, commit, tag, or push.

## Recommendation

Accept the Actor Principal repository. Category, Topic, and Taxonomy Change Record work remains separately gated. Because Category, Topic, locking, hierarchy versions, governed mutations, and taxonomy evidence are transactionally coupled, review their next authorization as one explicitly bounded taxonomy persistence slice rather than as unrelated table CRUD.
