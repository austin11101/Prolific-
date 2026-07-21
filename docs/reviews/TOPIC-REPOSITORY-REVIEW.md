# Topic Repository Review

## Review record

| Item              | Value                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Sprint            | 2.21                                                                               |
| Review date       | 2026-07-20                                                                         |
| Scope             | Existing Topic persistence contract only                                           |
| Outcome           | `PASS WITH EXPLICIT HIERARCHY DEFERRAL`                                            |
| Database baseline | PostgreSQL 16.13; one applied migration; zero drift; five empty application tables |

## Authorization boundary

Sprint 2.21 implements the existing `TopicRepository` contract, `TopicMapper`, Prisma adapter, dependency-injection binding, safe error translation, unit tests, and disposable PostgreSQL integration tests. It creates no application service, use case, controller, API, DTO, authentication, authorization, Taxonomy Change Record adapter, taxonomy audit orchestration, seed, migration, schema change, development-database row, or Flutter code.

The adapter persists state that a future authorized workflow has already validated. It does not normalize names, authorize actors, decide lifecycle transitions, create Topics, reparent Topics, traverse ancestry to authorize a write, increment Category hierarchy state, or append audit evidence.

## Source and contract reconciliation

The implemented schema and existing contract are narrower than several conditional examples in the Sprint brief:

- `Topic` has `lockVersion` but no Topic `hierarchyVersion` field.
- `PersistTopicChangeInput` carries only `expectedLockVersion`; it has no expected Topic hierarchy version, expected Category hierarchy version, command identity, actor, reason, or prior parent.
- The contract has no `persistHierarchyChange`, create, archive, restore, reorder, ancestor/descendant, or existence method.
- `loadHierarchy` is documented as future cycle-check input and explicitly does not authorize reparenting.
- The approved physical design requires hierarchy changes, Category locking/version coordination, and append-only taxonomy evidence in one transaction. Taxonomy audit orchestration is prohibited in Sprint 2.21 and its repository token remains unbound.

No contract amendment was made. Treating the whole-record input as authority to change `categoryId` or `parentTopicId` would have bypassed the approved Category hierarchy token and audit invariant. The adapter therefore includes both relationships in the atomic match predicate, never writes them, and safely rejects a mismatch as `ConstraintViolationError`.

## Exact physical model

| Field                     | Physical representation            | Rule                                                             |
| ------------------------- | ---------------------------------- | ---------------------------------------------------------------- |
| `id`                      | UUID                               | Immutable application-assigned primary key                       |
| `categoryId`              | UUID FK                            | Required and immutable for the MVP                               |
| `parentTopicId`           | nullable UUID                      | Optional same-Category parent; not mutable through this contract |
| `canonicalName`           | text                               | Required, non-blank                                              |
| `normalizedCanonicalName` | text with PostgreSQL `C` collation | Required; partial active-sibling uniqueness                      |
| `lifecycleState`          | `active` or `archived` enum        | Required; defaults active                                        |
| `displayOrder`            | integer                            | Non-negative sibling order                                       |
| `lockVersion`             | positive integer                   | Starts at 1; sole Topic concurrency token                        |
| `archivedAt`              | nullable `timestamptz(6)`          | Null only when active; required when archived                    |
| `createdAt` / `updatedAt` | `timestamptz(6)`                   | Created time immutable; update time supplied by caller           |

The composite unique key `(category_id, id)` supports the same-Category parent FK. PostgreSQL enforces Category and parent FKs, no self-parent, lifecycle/timestamp consistency, positive version, non-negative order, and active root/child partial uniqueness. The database has no Topic hierarchy-version column.

## Implemented contract and domain-facing types

The unchanged contract implements:

- `findById`;
- `findActiveByScopedName`;
- `listRootsByCategory`;
- `listChildren`;
- `loadHierarchy`; and
- `persistVersionedChange`.

`TopicRecord`, `TopicNameScope`, `PersistTopicChangeInput`, and `VersionedMutationResult` remain readonly, Prisma-independent, and transport-independent. Category and nullable parent identities are explicit. There is one explicit expected Topic lock version and no hierarchy mutation input.

## Mapper behavior

`TopicMapper` explicitly maps every approved field and both lifecycle representations. It preserves root/child, Category, canonical/normalized name, order, lock version, archival, and timestamp state; defensively copies every `Date`; freezes the returned record; and rejects unsupported persistence or domain lifecycle values. It performs no normalization, traversal, path calculation, ID/version generation, authorization, database access, or audit creation.

## Read semantics

- `findById` uses the Topic UUID and returns a mapped record or `null`.
- `findActiveByScopedName` uses the exact Category, nullable parent, normalized name, and `ACTIVE` scope. Input is not trimmed, folded, or normalized.
- `listRootsByCategory` filters exact Category plus `parentTopicId = null`.
- `listChildren` filters one exact `parentTopicId`; it does not include deeper descendants.
- `loadHierarchy` returns a flat complete Category set for future validation input; it does not infer traversal order.
- Root, child, and flat hierarchy lists order by `displayOrder ASC`, then UUID `ASC`.
- Root/child/hierarchy list methods include both lifecycle states because their existing signatures contain no lifecycle filter. Only the explicitly named active lookup filters lifecycle.
- Reads use the root Prisma client unless an approved transaction context is supplied; they never open a transaction.

PostgreSQL `C` comparison was verified: `science` matched the fixture while `SCIENCE` did not.

## Ordinary versioned persistence

`persistVersionedChange` requires a valid caller-owned transaction and uses `updateManyAndReturn` with an atomic predicate on Topic UUID, immutable Category, immutable parent, and expected lock version. It writes only canonical name, normalized name, lifecycle, display order, archive timestamp, update timestamp, and one lock-version increment.

The mutation never uses the root client, starts a nested transaction, creates or deletes a row, writes a parent/Category FK, runs raw SQL, updates Category, or inserts taxonomy evidence. A same-transaction diagnostic read distinguishes missing Topic, stale lock, and attempted relationship change without exposing identifiers or current versions.

Sprint 2.29 adds a separate narrow `persistOrdinaryChange` operation because the full-record contract was unsuitable for an application command prohibited from controlling Category, parent, or display order. Its persistence-neutral input contains only Topic ID, expected lock version, canonical/normalized names, lifecycle, archive timestamp, and update timestamp. One atomic update matches ID plus expected lock, increments the lock once, and omits Category, parent, and display order from update data. The existing full-record method remains unchanged. The narrow operation performs no pre-read; a bounded diagnostic read occurs only after a zero-row update to classify missing versus stale lock.

The narrow update does not use Prisma's optional update limit. Because Topic ID is unique, at most one row can match. A disposable concurrency regression demonstrated that the limited form could select an ID before a competing commit and then update it without rechecking the stale version predicate. The direct update is intended to retain the full PostgreSQL `id + lock_version` recheck; its final disposable one-winner rerun remains pending because privileged Docker access became unavailable after the correction.

## Uniqueness, lifecycle, and constraints

PostgreSQL remains authoritative for active partial uniqueness:

- active roots are unique by Category and normalized name;
- active children are unique by Category, parent, and normalized name;
- archived duplicates are allowed; and
- the same child normalized name under different parents is allowed.

Restoring an archived root or child into an occupied active scope produced `DuplicateEntityError` and left the archived record unchanged. Lifecycle/check violations map to `ConstraintViolationError` through structural Prisma/driver error classification; no provider message parsing is used.

## Hierarchy behavior and cycle prevention

Hierarchy mutation is **not implemented** because the existing contract does not represent it and the approved atomic audit boundary is not available. Consequently:

- parent and Category changes are rejected;
- no Category `FOR UPDATE` raw query exists in this adapter;
- no cycle-prevention algorithm or traversal guard authorizes mutation;
- no Category hierarchy version is compared or incremented;
- no concurrent hierarchy mutation test claims coverage; and
- no Taxonomy Change Record is created.

The flat `loadHierarchy` read is complete input for a future bounded cycle validator. Direct database integrity still enforces same-Category parenthood and self-parent rejection, but those constraints do not replace the deferred multi-row cycle transaction.

## Version increment matrix

| State persisted through existing operation |      Topic lock | Topic hierarchy | Category hierarchy |
| ------------------------------------------ | --------------: | --------------- | -----------------: |
| Canonical or normalized name               |            `+1` | not present     |          unchanged |
| Display order                              |            `+1` | not present     |          unchanged |
| Archive or restore state                   |            `+1` | not present     |          unchanged |
| Parent or Category change                  |        rejected | not present     |          unchanged |
| Future governed reparent                   | not implemented | not present     |    not implemented |

## Transactions, rollback, and concurrency

All mutations resolve the exact caller-owned active transaction context. Missing, foreign, expired, or fabricated contexts are rejected before a write. The repository never opens or nests a transaction.

Disposable PostgreSQL evidence proved:

- a successful ordinary mutation commits and increments Topic lock version once;
- caller failure rolls the successful repository operation back;
- a database constraint failure leaves state unchanged;
- two concurrent ordinary writes using expected lock version 1 produce one winner and one `OptimisticConcurrencyError` loser;
- final lock version is 2, not 3; and
- Category hierarchy version remains 1.

No hierarchy-race result is claimed because hierarchy mutation is outside the implemented contract.

## Safe error translation

| Condition                           | Safe result                                                  |
| ----------------------------------- | ------------------------------------------------------------ |
| Missing Topic                       | `EntityNotFoundError`                                        |
| Stale Topic lock                    | `OptimisticConcurrencyError` / `OPTIMISTIC_LOCK_CONCURRENCY` |
| Attempted parent or Category change | `ConstraintViolationError`                                   |
| Root or child active-name collision | `DuplicateEntityError`                                       |
| FK/check/null/relation violation    | `ConstraintViolationError`                                   |
| Invalid transaction                 | `InvalidTransactionContextError`                             |
| Repository unavailable              | `RepositoryUnavailableError`                                 |
| Unexpected provider failure         | `PersistenceError`                                           |

Public errors expose no SQL, connection data, names, UUIDs, provider text, or current versions. Causes remain private. Mapper/programming failures remain mapper failures rather than being misclassified as database failures. No `HierarchyCycleError` was added because no hierarchy mutation exists.

## Dependency injection

`TOPIC_REPOSITORY` is bound with `useExisting` to `PrismaTopicRepository`. `PersistenceModule` remains non-global and resolves/exports:

- `TRANSACTION_MANAGER`;
- `LANGUAGE_REPOSITORY`;
- `ACTOR_PRINCIPAL_REPOSITORY`;
- `CATEGORY_REPOSITORY`; and
- `TOPIC_REPOSITORY`.

`TAXONOMY_CHANGE_RECORD_REPOSITORY` remains the only unbound foundation repository token, and the module test verifies that requesting it fails. Concrete adapters are not exported by class. `AppModule` is unchanged.

## Validation evidence

### Unit, build, and static validation

- Focused Topic mapper/repository/module run: 3 suites, 17 tests passed.
- Full unit run: 14 suites, 95 tests passed.
- Full e2e run: 1 suite, 1 test passed.
- Prettier, ESLint, production TypeScript, test-inclusive TypeScript, and Nest build: passed.
- Prisma validate and generate: passed with Prisma 7.8.0.
- Prisma migrate status: one applied migration; database up to date.
- Live datasource-to-schema diff: empty migration; zero Prisma-representable drift.

### Disposable PostgreSQL integration

- Topic: `prolific_topic_repository_test_20260720_141244_356`; 1 suite and 9 tests passed; dropped and catalogue absence verified.
- Category regression: `prolific_category_repository_test_20260720_141407_381`; 11 tests passed; dropped.
- Actor Principal regression: `prolific_actor_principal_repository_test_20260720_141422_185`; 7 tests passed; dropped.
- Language regression: `prolific_language_repository_test_20260720_141507_500`; 5 tests passed; dropped.
- Final disposable-database catalogue count: zero.

Every test database received only the existing `20260717_initial_foundation` migration and direct test fixtures. Fixture insertion was not seed execution. No configured development fixture or Topic row was created.

### Development database and checksum verification

- PostgreSQL: 16.13.
- Migration history: exactly one successful `20260717_initial_foundation`; no failed or rolled-back migration.
- Application rows: zero in all five tables.
- Lifecycle enum: exact values `active`, `archived`.
- Prisma schema SHA-256: `0C503B9B77346F0114093C47CF5E6C513749620465AF545165F1513DBE569113`.
- Initial migration SHA-256: `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`.
- Migration directories / SQL files: one / one.
- No schema or migration diff; no staged file.

## Architectural and multidisciplinary audit

- **Software Architecture — PASS:** no Prisma crosses the domain boundary; transaction ownership remains explicit; no generic CRUD/tree base, service workflow, raw-query exception, or audit orchestration was introduced.
- **Backend Engineering — PASS for existing contract:** deterministic reads, atomic lock predicate, bounded operation count, stable errors, rollback, and ordinary concurrency are covered.
- **Data and Database — PASS for existing contract:** partial uniqueness/check/FK rules remain authoritative; parent/Category are protected from unsupported writes; unrelated tables and baseline remain unchanged.
- **Security and Privacy — PASS:** errors expose no identifiers, names, SQL, credentials, or provider payloads; no authentication or authorization assumption exists.
- **Product and Governance — PASS WITH DEFERRAL:** archived Topics remain durable and no hard deletion exists. Governed hierarchy/audit behavior remains unavailable rather than being invented.

## Findings and severities

| Severity      | Finding                                                                                                                                                                                                                                           | Resolution                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `MAJOR`       | The Sprint expected-state examples request complete hierarchy mutation/cycle/Category-version coverage, but the source-of-truth contract has no hierarchy mutation or expected Category hierarchy version, and audit orchestration is prohibited. | Not silently expanded. Existing contract implemented; hierarchy remains separately gated. |
| `OBSERVATION` | Topic has no independent hierarchy version; Category owns the physical hierarchy token.                                                                                                                                                           | Recorded in model and matrix; no synthetic field added.                                   |
| `OBSERVATION` | Root/child list signatures have no lifecycle parameter.                                                                                                                                                                                           | Both states returned; only `findActiveByScopedName` filters active.                       |
| `OBSERVATION` | Root and child uniqueness map to the shared duplicate code rather than scope-specific codes.                                                                                                                                                      | Existing safe hierarchy preserved; no unnecessary error-contract expansion.               |

There is no blocker or major code defect in the implemented existing repository contract. The major scope mismatch blocks only a claim that hierarchy mutation is complete.

## Recommendation and remaining prohibited work

Approve `PrismaTopicRepository` for its existing read and ordinary versioned-persistence contract. Do **not** authorize reparenting through it. The next bounded persistence task should implement and review `TaxonomyChangeRecordRepository`. A later separately approved aggregate-oriented taxonomy hierarchy contract must then carry expected Category hierarchy version, affected Topic lock expectations, actor/reason/command evidence, Category locking, bounded cycle validation, version increments, and audit insertion in one caller-owned transaction.

Language remains read-only; Actor Principal remains persistence-only; Category remains complete for its approved contract. Taxonomy audit orchestration, hierarchy mutation, services, APIs, authentication/authorization, seeds, additional migrations, PostgreSQL changes, and Flutter remain blocked.
