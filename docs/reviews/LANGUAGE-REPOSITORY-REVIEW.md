# Language Repository Review

## Decision record

| Item                      | Result              |
| ------------------------- | ------------------- |
| Sprint                    | 2.18                |
| Review date               | 2026-07-20          |
| Language repository       | `COMPLETE`          |
| Language mapper           | `COMPLETE`          |
| Contract amendment        | None                |
| Runtime Language mutation | `PROHIBITED`        |
| Development database      | Unchanged and empty |
| Other repositories        | `NOT IMPLEMENTED`   |

## Authorization boundary

Sprint 2.18 implements only the read-only Language persistence adapter, its explicit mapper, dependency-injection binding, safe read-error translation, and tests. It does not authorize or implement Language creation, update, archive, restore, upsert, or deletion. It also does not implement another repository, application service, use case, controller, API, DTO, seed, migration, schema change, PostgreSQL development-data write, or Flutter change.

## Source reconciliation

The Sprint brief referred to `docs/06-domain/canonical-domain-model.md` and `docs/06-domain/domain-glossary.md`; those paths do not exist. The canonical sources are [Canonical Domain Model](../architecture/canonical-domain-model.md) and [Domain Glossary](../02-requirements/domain-glossary.md).

The brief also described Language lifecycle using `ACTIVE` and `ARCHIVED`. The approved physical Language model does not use `taxonomy_lifecycle_state`; it stores `is_content_enabled` and nullable `retired_at`. The [First Seed Data Proposal](../07-database/first-seed-data-proposal.md) explicitly states that its presentation label `ACTIVE` means `retired_at IS NULL` and `is_content_enabled = true`, not the taxonomy enum. The existing contract therefore remains `listContentEnabled`, and no lifecycle field or contract operation was invented.

## Implemented contract

The Sprint 2.17 `LanguageRepository` contract was sufficient and remains unchanged:

- `findById`
- `findByNormalizedTag`
- `listContentEnabled`
- `listGovernanceManaged`

All results use the existing readonly `LanguageRecord`. It contains only approved fields: immutable UUID, canonical and normalized tag/name values, ISO basis, display order, content enablement, retirement timestamp, and creation/update timestamps. It imports no Prisma type and assumes no API serialization format.

## Mapper behavior

`LanguageMapper` explicitly copies every generated Prisma Language field into a new frozen `LanguageRecord`.

- UUID, BCP 47 tag, normalized tag, ISO basis, canonical name, normalized name, display order, content enablement, and retirement state are preserved exactly.
- `createdAt`, `updatedAt`, and non-null `retiredAt` are copied into new `Date` instances.
- The original Prisma object is never returned or mutated.
- The mapper performs no normalization, identifier generation, database call, or business decision.
- There is no unsupported persistence lifecycle value to translate because Language has no persistence lifecycle enum.

## Query semantics

| Operation               | Prisma query                             | Absence     | Ordering                           |
| ----------------------- | ---------------------------------------- | ----------- | ---------------------------------- |
| `findById`              | Unique lookup by UUID primary key        | `null`      | Not applicable                     |
| `findByNormalizedTag`   | Unique lookup by stored `normalized_tag` | `null`      | Not applicable                     |
| `listContentEnabled`    | `is_content_enabled = true`              | Empty array | `display_order ASC`, then `id ASC` |
| `listGovernanceManaged` | No lifecycle filter                      | Empty array | `display_order ASC`, then `id ASC` |

The repository does not trim, case-fold, validate, or normalize caller input. The stored normalized field and explicit PostgreSQL `COLLATE "C"` remain authoritative. The stable UUID tie-breaker makes ordering deterministic when display orders match.

The database check constraint guarantees a retired Language cannot remain content-enabled. `listContentEnabled` uses the indexed approved content flag; it does not reinterpret `retiredAt` as a separate repository lifecycle.

## Transaction-context behavior

- No context uses the injected root `PrismaService`.
- An optional valid transaction context is resolved only through `PrismaTransactionManager.clientFor`.
- A transaction-scoped read uses the existing transaction client and never opens another transaction.
- Foreign, fabricated, expired, or otherwise invalid contexts retain the Sprint 2.17 `InvalidTransactionContextError` behavior.
- Prisma `TransactionClient` is not exposed through the Language contract.

## Error translation

- Ordinary missing rows return `null` and are not errors.
- Invalid transaction contexts propagate as `INVALID_TRANSACTION_CONTEXT`.
- Prisma initialization or engine-panic failures map to `RepositoryUnavailableError` with `REPOSITORY_UNAVAILABLE`.
- Other provider/query failures map to a safe `PersistenceError` with `PERSISTENCE_ERROR`.
- Mapper/programmer errors occur outside the query translation boundary and are not hidden.
- Provider messages, SQL, credentials, connection strings, and parameter values are not copied into public error messages. Causes remain private through the Sprint 2.17 error mechanism.

## Dependency injection

`PersistenceModule` registers:

- `LanguageMapper`;
- `PrismaLanguageRepository`; and
- `LANGUAGE_REPOSITORY` using `useExisting` so the token resolves to the single adapter instance.

The module exports `LANGUAGE_REPOSITORY` and `TRANSACTION_MANAGER`. The concrete adapter class is not exported. Actor Principal, Category, Topic, and Taxonomy Change Record tokens remain unbound and resolve to no placeholder. The module remains non-global and `AppModule` remains unchanged.

## Unit and build validation

- Core API formatting: pass.
- ESLint: pass with zero warnings or errors.
- Production TypeScript check: pass.
- Test-inclusive TypeScript check: pass.
- Nest build: pass.
- Full unit suite: 35 tests across eight suites, all pass.
- Mapper coverage includes complete mapping, enabled/retired representation, object independence, freezing, and defensive Date copies.
- Repository coverage includes every query, absence, deterministic filter/order arguments, mapper use, transaction-client routing, invalid context, safe error translation, and absence of mutation methods.
- Module coverage confirms only Language and transaction tokens are bound.

## Integration-test environment and results

The integration suite used PostgreSQL 16.13 in the uniquely named disposable database `prolific_language_repository_test_20260720_121604_671`. It did not reuse database `prolific`.

1. The existing `20260717_initial_foundation` migration was applied to the empty disposable database.
2. Three test-owned Language fixtures were inserted directly for test setup: two content-enabled rows and one retired/content-disabled row.
3. Five integration scenarios passed:
   - UUID/tag lookup and missing lookup;
   - explicit `C`-collated normalized-tag case behavior;
   - content-enabled and all-governance deterministic lists;
   - PostgreSQL normalized-tag uniqueness; and
   - unchanged row count across repository reads.
4. No production seed was executed.
5. Prisma and fixture pools were closed.
6. The disposable database was dropped; a `pg_database` lookup returned zero remaining matches.

## Development-database safety

Before the disposable test, the configured `prolific` database contained exactly one completed migration, no failed history row, and zero rows in all five application tables. Final verification confirmed the same state, zero Prisma-representable drift, and unchanged schema/migration checksums. No fixture or integration-test connection used the development database URL.

## Test tooling repair

The prior test-inclusive TypeScript failure was an import-resolution mismatch: the e2e test imported internal `supertest/types`, which is not a supported NodeNext package export. It now types the Nest HTTP server with Node's standard `Server`; runtime behavior is unchanged, no dependency was added, and both test-inclusive TypeScript and ESLint pass.

## Multidisciplinary findings

| Severity      | Perspective        | Finding                                                                                      | Resolution                                                                                                |
| ------------- | ------------------ | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `MAJOR`       | Product / Data     | The brief's Language `ACTIVE`/`ARCHIVED` wording conflicts with the approved physical model. | Resolved by preserving `isContentEnabled`/`retiredAt` and the existing contract; no enum was invented.    |
| `MAJOR`       | Security / Backend | Provider failures could leak if raw Prisma errors crossed the adapter.                       | Resolved with narrow safe translation and private causes.                                                 |
| `MINOR`       | Backend tooling    | Internal `supertest/types` import broke the test-inclusive NodeNext check.                   | Resolved with a standard Node HTTP server type and no behavior/dependency change.                         |
| `OBSERVATION` | Architecture       | The two supplied `docs/06-domain` paths are absent.                                          | Canonical existing model/glossary paths were used and documented.                                         |
| `OBSERVATION` | Architecture       | This is the first concrete adapter behind the five table-specific foundation ports.          | It remains infrastructure-owned and read-only; no generic CRUD or aggregate policy change was introduced. |

No blocker or unresolved major finding remains.

## Remaining prohibited work

- Language create, update, archive, restore, upsert, or delete behavior.
- Production or development seed execution and launch-language insertion.
- Actor Principal, Category, Topic, or Taxonomy Change Record repository implementation.
- Application services, use cases, controllers, DTOs, APIs, or `AppModule` integration.
- Schema changes, additional migrations, PostgreSQL development-schema changes, and staging/production deployment.
- Flutter work.

## Recommendation

Accept the read-only Language repository. The next repository should be selected through a separate bounded authorization. A controlled Actor Principal adapter is smaller, while Category/Topic work should be reviewed as one taxonomy consistency slice because their version, hierarchy, locking, audit, and correction invariants are transactionally coupled.
