# Taxonomy Change Record Repository Review

## Review record

| Item              | Value                                                                              |
| ----------------- | ---------------------------------------------------------------------------------- |
| Sprint            | 2.22                                                                               |
| Review date       | 2026-07-20                                                                         |
| Scope             | Existing immutable audit persistence contract only                                 |
| Outcome           | `PASS`                                                                             |
| Database baseline | PostgreSQL 16.13; one applied migration; zero drift; five empty application tables |

## Authorization boundary

Sprint 2.22 implements the existing `TaxonomyChangeRecordRepository` contract, explicit mapper, Prisma adapter, final dependency-injection binding, safe error translation, unit tests, and disposable PostgreSQL integration tests. It does not implement Category or Topic mutation orchestration, a governed hierarchy command, automatic audit creation, an application service, use case, controller, API, DTO, authentication, authorization, seed, migration, PostgreSQL change, development-database row, or Flutter work.

The repository persists evidence supplied by a future authorized workflow. It does not infer actor, target, operation, reason, lifecycle transition, parent transition, or version evidence from mutable entities.

## Exact physical model

`taxonomy_change_records` contains sixteen immutable fields:

| Field                      | Physical representation          | Rule                                             |
| -------------------------- | -------------------------------- | ------------------------------------------------ |
| `id`                       | UUID primary key                 | Application-assigned immutable identity          |
| `commandId`                | unique UUID                      | Strict command/evidence identity                 |
| `actorPrincipalId`         | UUID FK                          | Required existing Actor Principal                |
| `categoryId`               | nullable UUID FK                 | Populated only for Category target               |
| `topicId`                  | nullable UUID FK                 | Populated only for Topic target                  |
| `operation`                | constrained text                 | Approved Category/Topic operation                |
| `reasonCode`               | constrained text                 | Non-whitespace machine code; no narrative        |
| `previousLifecycleState`   | nullable text                    | Operation-dependent `active`/`archived` evidence |
| `resultingLifecycleState`  | nullable text                    | Operation-dependent `active`/`archived` evidence |
| `previousParentTopicId`    | nullable UUID FK                 | Reparent evidence where applicable               |
| `resultingParentTopicId`   | nullable UUID FK                 | Reparent evidence where applicable               |
| `previousVersion`          | nullable integer                 | Null only for creation; otherwise positive       |
| `resultingVersion`         | positive integer                 | Creation 1 or previous + 1                       |
| `supersedesChangeRecordId` | nullable unique UUID self-FK     | At most one direct successor                     |
| `occurredAt`               | `timestamptz(6)`                 | Caller-supplied immutable event time             |
| `createdAt`                | `timestamptz(6)` default `now()` | Database-owned immutable receipt time            |

PostgreSQL owns two non-primary unique constraints, six restrictive foreign keys, seven checks, three target/actor chronological indexes, and two parent-reference indexes. Exactly one Category/Topic target is required. There is no generic target type, JSON evidence, narrative, request/response payload, identity label, or mutable timestamp.

## Implemented contract and types

The unchanged contract implements:

- `findById`;
- `findByCommandId`;
- `append`;
- `listForCategory`;
- `listForTopic`;
- `findTerminalCorrection`; and
- `appendCorrection`.

`TaxonomyChangeRecordView`, `AppendTaxonomyChangeRecordInput`, and `AppendTaxonomyCorrectionInput` remain readonly, Prisma-independent, and transport-independent. No contract amendment was required.

One representation detail is explicit: `createdAt` is present on the shared record view but the physical design assigns it to PostgreSQL. Append operations therefore do not write the caller's `createdAt`; the returned mapped record contains the database receipt time.

## Mapper behavior

`TaxonomyChangeRecordMapper` maps all sixteen fields, defensively copies both dates, freezes the returned record, validates all nine approved operation codes, and validates nullable `active`/`archived` lifecycle evidence. It preserves UUIDs, target, reason, parent, version, supersession, and timestamps without deriving or rewriting evidence.

The mapper performs no database access, diff calculation, actor/target loading, permission validation, reason generation, business transition decision, or audit creation.

## Append and immutability semantics

`append` requires a valid caller-owned transaction context and uses only its resolved Prisma client. It performs one Prisma `create` with caller-supplied evidence except for database-owned `createdAt`.

Ordinary append rejects a non-null `supersedesChangeRecordId`; correction-shaped evidence must use `appendCorrection` so terminal, target, chronology, and chain rules cannot be bypassed. The repository exposes no update, delete, hard delete, patch, save, upsert, or generic audit-query method. PostgreSQL test evidence confirmed that corrections never modify their originals.

## Target and Actor Principal handling

Category and Topic targets use separate nullable foreign keys. Repository list methods explicitly include the opposite FK as null so Category and Topic histories cannot mix. PostgreSQL checks enforce exactly one target and operation compatibility; restrictive FKs enforce target existence.

The adapter persists only the supplied Actor Principal UUID. It does not provision, authenticate, authorize, label, or otherwise mutate the actor. The restrictive FK is authoritative, and invalid actor/target references map to `ConstraintViolationError` without exposing UUIDs.

## Duplicate and command semantics

Append is strict, not idempotent:

- duplicate record UUID returns `DuplicateEntityError`;
- duplicate command UUID returns `DuplicateEntityError`;
- no equivalent-record lookup or silent success is performed; and
- PostgreSQL uniqueness is the concurrent authority.

Two clients concurrently appending the same record/command produced exactly one row, one successful caller, and one `DuplicateEntityError`.

## Correction and supersession semantics

`appendCorrection` creates a new row and requires:

- a valid caller-owned transaction;
- `record.supersedesChangeRecordId` equal to `expectedTerminalRecordId`;
- a distinct proposed record identity;
- an existing expected predecessor;
- the exact same Category/Topic target;
- a strictly later `occurredAt`;
- a valid bounded predecessor chain; and
- no existing direct successor.

The adapter traverses predecessors through Prisma with a visited-ID set and maximum 1,000-record guard. `findTerminalCorrection` traverses unique successors using the same bound, validates same-target and strictly increasing chronology at every hop, and rejects malformed cycles or chains with `ConstraintViolationError`. It uses no raw SQL, recursive procedure, trigger, or update.

The nullable unique predecessor constraint remains the race authority. Two concurrent successors for one terminal predecessor produced one winner, one `DuplicateEntityError`, and one direct successor. Sequential corrections formed a deterministic linear chain, and the original row remained byte-for-byte equal at the domain mapping boundary.

## Read semantics and ordering

- ID and command lookups return a mapped immutable record or `null`.
- Category and Topic histories are strictly separated.
- Subject histories order by `occurredAt DESC`, then UUID `ASC`, matching the physical time indexes and providing a stable tie-breaker.
- Returned history arrays and individual records are frozen.
- `findTerminalCorrection` returns the terminal row or `EntityNotFoundError` for a missing origin.
- Reads use the root Prisma client unless an approved optional transaction context is supplied; they do not start transactions.

The contract contains no actor-history list, arbitrary chronological scan, pagination abstraction, generic subject union, backward-chain list, or broad audit DSL, so none was added.

## Transactions and rollback

Every append and correction resolves the exact active caller-owned transaction context. Missing, foreign, fabricated, or expired contexts fail before a create. The repository never opens or nests a transaction.

Disposable PostgreSQL evidence proved that a caller failure rolls back a successful insert completely, constraint failures insert nothing, committed appends persist once, and concurrent unique races cannot leave duplicate or branched evidence.

## Safe error translation

| Condition                                                                       | Safe result                      |
| ------------------------------------------------------------------------------- | -------------------------------- |
| Duplicate ID, command, or direct successor                                      | `DuplicateEntityError`           |
| Missing correction origin/predecessor                                           | `EntityNotFoundError`            |
| Invalid actor, target, operation matrix, reason, version, parent, or chronology | `ConstraintViolationError`       |
| Self, cross-target, cyclic, or overlong correction chain                        | `ConstraintViolationError`       |
| Invalid transaction                                                             | `InvalidTransactionContextError` |
| Repository unavailable                                                          | `RepositoryUnavailableError`     |
| Unexpected provider failure                                                     | `PersistenceError`               |

Prisma errors and structured PostgreSQL driver codes `23502`, `23503`, `23505`, and `23514` map without message parsing. Public errors expose no SQL, provider text, actor/subject UUID, reason code, evidence, credentials, connection string, or current chain data. Causes remain private, and mapper/programming errors remain visible as mapper failures.

## Dependency injection

`TAXONOMY_CHANGE_RECORD_REPOSITORY` is bound with `useExisting` to `PrismaTaxonomyChangeRecordRepository`. `PersistenceModule` remains non-global and now resolves/exports all six persistence tokens:

- `TRANSACTION_MANAGER`;
- `LANGUAGE_REPOSITORY`;
- `ACTOR_PRINCIPAL_REPOSITORY`;
- `CATEGORY_REPOSITORY`;
- `TOPIC_REPOSITORY`; and
- `TAXONOMY_CHANGE_RECORD_REPOSITORY`.

Concrete adapter classes remain internal providers. `AppModule` remains unchanged.

## Validation evidence

### Unit, build, and static validation

- Focused mapper/repository/module run: 3 suites, 29 tests passed.
- Full unit run: 16 suites, 123 tests passed.
- Full e2e run: 1 suite, 1 test passed.
- Prettier, ESLint, production TypeScript, test-inclusive TypeScript, and Nest build: passed.

### Disposable PostgreSQL integration

- Requested audit database: `prolific_taxonomy_change_record_repository_test_20260720_144350_689`.
- PostgreSQL 63-byte catalogue form: `prolific_taxonomy_change_record_repository_test_20260720_144350`.
- Audit result: 1 suite, 11 tests passed.
- Topic regression: `prolific_topic_repository_test_0720_144447_219`; 9 tests passed.
- Category regression: `prolific_category_repository_test_0720_144641_469`; 11 tests passed.
- Actor Principal regression: `prolific_actor_principal_repository_test_0720_144715_316`; 7 tests passed.
- Language regression: `prolific_language_repository_test_0720_144752_488`; 5 tests passed.
- Every database received only `20260717_initial_foundation` plus direct test fixtures and was dropped.
- Final disposable-database catalogue count: zero.

The direct fixtures are test setup, not seed execution. Tests did not update/delete audit records for cleanup; the disposable databases were dropped.

## Architectural and multidisciplinary audit

- **Software Architecture — PASS:** append persistence remains separate from workflows; transaction ownership is explicit; no Prisma leaks into domain; no generic audit base exists.
- **Backend Engineering — PASS:** deterministic reads, strict duplicates, bounded correction traversal, stable errors, rollback, and two relevant concurrency races are covered.
- **Data and Database — PASS:** FKs, checks, and uniqueness remain authoritative; no update/delete path exists; originals and unrelated rows remain unchanged.
- **Security and Privacy — PASS:** audit evidence, actor/subject identity, provider details, SQL, and credentials do not leak through errors; no authentication assumption exists.
- **Product and Governance — PASS:** history is durable, corrections append, originals remain intact, and no automatic governance workflow was invented.

## Findings and severities

| Severity      | Finding                                                                                 | Resolution                                                                             |
| ------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `OBSERVATION` | `createdAt` is carried by the shared record view although PostgreSQL owns its value.    | Adapter omits it on create and returns the database receipt time.                      |
| `OBSERVATION` | Operation and lifecycle evidence are physical text, not Prisma enums.                   | Mapper validates the approved closed sets; PostgreSQL checks remain authoritative.     |
| `OBSERVATION` | The bounded reason-code registry remains application-owned and is not implemented here. | Adapter preserves the code; PostgreSQL enforces only the approved no-whitespace shape. |
| `OBSERVATION` | The contract has no actor-history or full correction-chain list operation.              | No broad query API was invented.                                                       |

No blocker, major, or minor finding remains.

## Development baseline and remaining authority

Final verification confirms PostgreSQL 16.13, exactly one successful migration, no failed/rolled-back migration, zero Prisma-representable drift, zero rows in all five configured development tables, unchanged schema/migration checksums, one migration directory, one SQL file, zero disposable databases, and nothing staged.

Language remains read-only; Actor Principal remains persistence-only; Category and Topic remain complete for their approved contracts. The audit repository is now complete, but automatic audit orchestration and governed Topic hierarchy mutation remain deferred until an approved aggregate command contract supplies expected Category hierarchy version, affected Topic locks, actor/reason/command evidence, and shared transaction coordination.

The recommended next task is a final persistence-layer review covering all contracts, token bindings, cross-repository transaction assumptions, and the exact gate required before any application-service orchestration. Services, APIs, authentication/authorization, seeds, migrations, PostgreSQL changes, and Flutter remain blocked.
