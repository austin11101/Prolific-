# Persistence Architecture

## Document control

| Item               | Value                                                                   |
| ------------------ | ----------------------------------------------------------------------- |
| Status             | Sprint 2.29 Topic mutation implemented; final DB revalidation pending   |
| Baseline           | [Foundation Baseline](../reviews/FOUNDATION-BASELINE.md)                |
| Backend authority  | [Core Backend Architecture](../06-core-backend/backend-architecture.md) |
| Database authority | [Database Overview](../07-database/database-overview.md)                |
| Schema scope       | Five approved foundation models only                                    |
| Database state     | Unchanged; all five application tables remain empty                     |

## Purpose and scope

This document defines the shared persistence infrastructure and domain-facing repository contracts created in Sprint 2.17. The foundation provides Prisma lifecycle integration, an opaque application-facing transaction boundary, safe persistence errors, stable dependency-injection tokens, and narrow repository ports for the five approved models.

Sprint 2.18 implemented the read-only Language mapper and adapter. Sprint 2.19 implemented the Actor Principal mapper and adapter with transaction-required, persistence-only controlled provisioning. Sprint 2.20 implemented the Category mapper and adapter with lifecycle reads and transaction-required atomic expected-version persistence. Sprint 2.21 implemented the existing Topic contract with deterministic reads and transaction-required ordinary versioned persistence. Sprint 2.22 implemented immutable Taxonomy Change Record append, correction, and reads. Sprint 2.23 completed the [Persistence Layer Final Review](../reviews/PERSISTENCE-LAYER-FINAL-REVIEW.md) and proposed, without implementing, the blocked [Governed Topic Hierarchy Command](./governed-topic-hierarchy-command.md). These increments create no authentication, authorization, automatic audit workflow, business service, controller, API, DTO, seed, migration, or database change.

Sprint 2.24 implements the read-only [Language Query Service](../reviews/LANGUAGE-QUERY-SERVICE-REVIEW.md) above this boundary. The plain application service depends on `LanguageRepository`; its composition module alone imports `PersistenceModule` and injects `LANGUAGE_REPOSITORY`. It introduces no persistence contract change, transaction, controller, API, or database mutation.

Sprint 2.25 applies the same boundary to the read-only [Category Query Service](../reviews/CATEGORY-QUERY-SERVICE-REVIEW.md). It depends on `CategoryRepository`, injects only `CATEGORY_REPOSITORY` through its composition module, and cannot call `persistVersionedChange`.

Sprint 2.26 completes the approved read-side taxonomy boundary with the [Topic Query Service](../reviews/TOPIC-QUERY-SERVICE-REVIEW.md). It depends only on `TopicRepository`, injects only `TOPIC_REPOSITORY`, and exposes the approved ID, root, direct-child, and flat-hierarchy reads. It preserves repository ordering and stored lifecycle state without introducing traversal, effective-visibility policy, hierarchy mutation, cycle logic, transactions, or audit writes.

Sprint 2.27 implements the [Actor Principal Provisioning Service](../reviews/ACTOR-PROVISIONING-SERVICE-REVIEW.md) above the controlled repository boundary. The plain application service depends only on `ActorPrincipalRepository` and `TransactionManager`, validates the exact immutable ID/kind command, owns one transaction, passes its opaque context to `provisionControlled`, and returns a defensive immutable result. Its composition module injects only `ACTOR_PRINCIPAL_REPOSITORY` and `TRANSACTION_MANAGER`. No authentication, authorization, identity mapping, profile/permission state, audit orchestration, transport, nested transaction, schema change, or development-data insertion is introduced.

Sprint 2.28 implements the internal [Category Ordinary Mutation Service](../reviews/CATEGORY-MUTATION-SERVICE-REVIEW.md). The plain service depends only on `CategoryRepository` and `TransactionManager`, validates explicit metadata/archive/restore commands before opening one transaction, forwards exact lock and hierarchy expectations to `persistVersionedChange`, and returns a defensive immutable result. The repository remains responsible for its atomic dual-version predicate, lock increment, hierarchy comparison/preservation, and conflict classification. The service performs no pre-read, retry, hierarchy mutation, automatic audit append, authorization, transport, schema change, or development-data insertion.

Sprint 2.29 implements the internal [Topic Ordinary Mutation Service](../reviews/TOPIC-MUTATION-SERVICE-REVIEW.md). The original full-record mutation was unsuitable because it required Category, parent, and display-order state that the application command cannot control. The authorized narrow `persistOrdinaryChange` repository operation accepts only Topic ID, expected lock version, and existing ordinary name/lifecycle/timestamp fields. Its atomic update omits Category, parent, and display order, preserving them without a pre-read or read-back write. The application validates first, opens one transaction, calls the repository once, and returns an immutable result. Hierarchy movement, audit orchestration, authorization, and transport remain excluded.

The Sprint brief referred to `docs/04-architecture/backend-architecture.md` and `docs/06-domain/`; those paths do not exist in the repository. The canonical backend and domain authorities remain `docs/06-core-backend/backend-architecture.md` and `docs/architecture/canonical-domain-model.md`. This document uses the requested `docs/04-architecture/` location without duplicating either authority.

## Folder structure

```text
services/core-api/src/
  domain/
    persistence/
      persistence.types.ts
      repositories/
        actor-principal.repository.ts
        language.repository.ts
        category.repository.ts
        topic.repository.ts
        taxonomy-change-record.repository.ts
      transactions/
        transaction-manager.ts
  infrastructure/
    database/
      prisma-database.config.ts
      prisma.module.ts
      prisma.service.ts
    persistence/
      errors/
        persistence.errors.ts
      generated/prisma/
      mappers/
        actor-principal.mapper.ts
        category.mapper.ts
        language.mapper.ts
        taxonomy-change-record.mapper.ts
        topic.mapper.ts
      repositories/
        prisma-actor-principal.repository.ts
        prisma-category.repository.ts
        prisma-language.repository.ts
        prisma-taxonomy-change-record.repository.ts
        prisma-topic.repository.ts
      tokens/
        persistence.tokens.ts
      transactions/
        prisma-transaction.context.ts
        prisma-transaction.manager.ts
  modules/
    persistence/
      persistence.module.ts
```

Concrete mapper/adapter pairs exist for all five foundation records: read-only Language, controlled Actor Principal, versioned Category, ordinary versioned Topic, and append-only Taxonomy Change Record. All six persistence tokens are bound and exported. Empty placeholders remain intentionally omitted.

## Dependency direction

```text
Future application service
  -> domain repository and TransactionManager contracts
  <- infrastructure adapters implement those contracts
  -> PrismaTransactionManager / future Prisma repositories
  -> PrismaService
  -> generated Prisma Client
  -> PostgreSQL
```

Domain persistence contracts import only other domain persistence types. They do not import NestJS, Prisma, generated records, SQL, or transport DTOs. Prisma-generated types remain below `src/infrastructure/persistence/generated/prisma/`.

The five repository ports are deliberately foundation-specific. Future application orchestration may compose Category, Topic, and taxonomy-audit ports behind the approved aggregate-oriented Taxonomy boundary. The ports do not establish one-table-per-aggregate architecture or approve generic CRUD.

## Prisma lifecycle

Sprint 2.17 reuses the existing non-global `PrismaModule` and `PrismaService` rather than creating another client.

`PrismaService`:

- owns the single dependency-injected Prisma Client instance;
- constructs Prisma Client 7.8.0 with `@prisma/adapter-pg` and a bounded `pg.Pool`;
- reads the connection URL and pool settings from validated environment configuration;
- connects during Nest module initialization;
- disconnects idempotently during module destruction;
- disposes the external pool through the adapter;
- enables no verbose query logging; and
- never logs the connection string.

`PersistenceModule` imports the existing `PrismaModule`, registers transaction infrastructure and all five adapters, and remains non-global. It exports only the six domain-facing persistence tokens; the raw Prisma module, concrete adapters, and concrete transaction manager remain infrastructure details. Application feature modules import it for composition, but neither they nor `PersistenceModule` are imported into `AppModule` because no runtime caller is authorized. This preserves the implemented internal boundary without changing application startup behavior.

## Transaction abstraction

The domain-facing `TransactionManager` exposes one operation:

```typescript
execute<TResult>(
  work: (context: TransactionContext) => Promise<TResult>,
): Promise<TResult>;
```

`TransactionContext` is an opaque nominal type with a protected constructor and private brand. It carries no Prisma-visible property. Application and domain code can pass it to repository contracts but cannot obtain a Prisma client from it.

`PrismaTransactionManager` implements the contract with a Prisma interactive transaction. It:

- executes with explicit PostgreSQL/Prisma `READ COMMITTED` isolation;
- returns the callback result unchanged;
- propagates callback and Prisma errors without swallowing or broad conversion;
- performs no automatic retry;
- uses `AsyncLocalStorage` to track the active transaction for the current asynchronous call chain; and
- resolves a Prisma client only through the infrastructure-only `clientFor` method.

`READ COMMITTED` is the initial foundation policy, matching PostgreSQL's ordinary transaction behavior. A future use case requiring a different isolation level or bounded retry policy needs explicit design and tests; callers cannot select arbitrary isolation through the domain contract.

## Transaction-context policy

- Non-transactional future repository calls omit the context; infrastructure resolves the root `PrismaService`.
- A transaction owner calls `execute` once and passes the callback's opaque context to every participating repository operation.
- Future Prisma repository adapters call the infrastructure-only resolver to receive the active transaction client.
- All adapters receiving the same context therefore share one interactive transaction.
- Calling `execute` again within an active transaction is rejected with `InvalidTransactionContextError`; an independent nested transaction is never opened silently.
- A foreign, fabricated, expired, or cross-scope context is rejected.
- A future helper may reuse an already supplied context by continuing to pass it to repositories; it must not re-enter `execute`.

## Repository contract policy

Repository interfaces use readonly, persistence-neutral records that mirror only the approved foundation fields. These records are persistence boundary shapes, not completed domain entities or API DTOs. They may be replaced by richer canonical domain entities when those entities are implemented.

Contracts use `EntityId`, `ExpectedVersion`, lifecycle/actor unions, optional read contexts, required transaction-bearing mutation contexts, and explicit mutation results where needed. They expose no Prisma record, filter, include, generated input, transaction client, unrestricted delete, or all-purpose base repository.

### ActorPrincipalRepository

- `findById`
- `existsById`
- `provisionControlled`

Provisioning requires an explicit operation context and represents only the controlled internal backend path. The contract includes no label, direct identifier, provider subject, update, delete, or public registration operation because those are absent or prohibited in the approved foundation.

Sprint 2.19 implements this contract with `PrismaActorPrincipalRepository` and `ActorPrincipalMapper`. Reads use the root client unless an approved optional transaction context is supplied. `existsById` selects only the UUID. Provisioning requires the caller-owned transaction, uses application-assigned UUID plus `createMany`/`skipDuplicates` as the constraint-backed concurrency primitive, and re-reads the stored row. An equivalent UUID/kind is idempotent; the same UUID with a different immutable kind returns `DuplicateEntityError`. The adapter contains no raw SQL, update, delete, authentication, authorization, or nested transaction.

### LanguageRepository

- `findById`
- `findByNormalizedTag`
- `listContentEnabled`
- `listGovernanceManaged`

The contract is read-only. It intentionally has no create, update, archive, or delete operation because migration-one Language rows are governance-managed reference data.

Sprint 2.18 implements this contract with `PrismaLanguageRepository` and `LanguageMapper`. Root reads use `PrismaService`; transaction-scoped reads resolve only through `PrismaTransactionManager`. Unique lookups preserve caller input exactly. Lists order by `displayOrder ASC` and then UUID `ASC`; the content-enabled list filters `isContentEnabled = true`, while the governance list applies no lifecycle filter. The approved physical Language lifecycle is `isContentEnabled` plus nullable `retiredAt`, not the Category/Topic lifecycle enum.

### CategoryRepository

- `findById`
- `findActiveByNormalizedName`
- `listByLifecycle`
- `persistVersionedChange`

The mutation boundary requires expected lock and hierarchy versions plus a transaction-bearing context. Its result reports both prior/resulting lock versions and prior/resulting hierarchy versions. The contract does not implement normalization, authorization, lifecycle workflow, or transaction ownership.

Sprint 2.20 implements this contract with `PrismaCategoryRepository` and `CategoryMapper`. Reads use the root client or a resolved optional transaction context and order lifecycle lists by display order then UUID. `persistVersionedChange` uses the caller-owned transaction and an atomic UUID/lock-version/hierarchy-version predicate. It increments lock version once and preserves hierarchy version, which remains owned by the future Topic hierarchy transaction. A same-transaction diagnostic read distinguishes absence, lock conflict, hierarchy conflict, and combined conflict without exposing current values. The adapter has no create, delete, actor-attribution, raw-query, or audit-insertion behavior.

### TopicRepository

- `findById`
- `findActiveByScopedName`
- `listRootsByCategory`
- `listChildren`
- `loadHierarchy`
- `persistVersionedChange`

Scoped-name lookup carries Category and parent identity. Hierarchy loading provides future cycle-check input but does not implement or authorize reparenting. Versioned persistence requires a transaction-bearing context.

Sprint 2.21 implements this unchanged contract with `PrismaTopicRepository` and `TopicMapper`. Exact scoped active lookup and deterministic root, direct-child, and flat Category hierarchy reads use the root client or an explicitly resolved transaction client. Root/child/hierarchy lists contain both lifecycle states because the signatures have no lifecycle filter; only `findActiveByScopedName` selects `ACTIVE`.

`persistVersionedChange` atomically matches UUID, immutable Category, immutable parent, and expected Topic lock version. It writes approved ordinary current state, increments lock once, and does not change Category/parent relationships or Category hierarchy version. Relationship mismatches are rejected. The existing contract carries no expected Category hierarchy version, audit input, or hierarchy mutation method; therefore reparenting, Category locking, cycle authorization, hierarchy-version coordination, and audit insertion remain deferred. No raw SQL exception is implemented in this adapter.

### TaxonomyChangeRecordRepository

- `findById`
- `findByCommandId`
- `append`
- `listForCategory`
- `listForTopic`
- `findTerminalCorrection`
- `appendCorrection`

The contract exposes append-only audit behavior and no update or delete. Correction append carries the expected terminal record identity and is implemented with repository-owned same-target, chronology, bounded acyclicity, concurrency, and atomic insertion checks.

Sprint 2.22 implements this unchanged contract with `PrismaTaxonomyChangeRecordRepository` and `TaxonomyChangeRecordMapper`. Ordinary append accepts only original evidence; corrections must use `appendCorrection`. The correction operation validates expected terminal identity, same Category/Topic target, strict chronology, and a bounded 1,000-record predecessor chain before insertion. PostgreSQL unique predecessor enforcement resolves concurrent successors without branching. `findTerminalCorrection` performs bounded forward traversal with same-target and chronology validation. All writes require a caller-owned transaction, and no update, delete, raw SQL, actor provisioning, Category/Topic mutation, or workflow orchestration exists.

## Mapper policy

Future mappers will live below `src/infrastructure/persistence/mappers/` and convert explicitly between:

- generated Prisma persistence records;
- canonical domain entities or the narrow domain-facing records used during foundation work; and
- repository persistence inputs.

Prisma records must not leave infrastructure. Mapping must be explicit and testable; reflection-based mapping, unchecked casts, generic field copying, and API DTO mapping are prohibited. Every foundation mapper creates a frozen independent record and defensively copies dates. Actor Principal, Category, Topic, and Taxonomy Change Record mappers explicitly reject unsupported closed values.

## Persistence error policy

The infrastructure error hierarchy contains:

- `PersistenceError`
- `RepositoryUnavailableError`
- `EntityNotFoundError`
- `DuplicateEntityError`
- `OptimisticConcurrencyError`
- `ConstraintViolationError`
- `InvalidTransactionContextError`

Each error has a stable machine-readable code and a safe generic message. A causal object may be retained in a true private field, while only a safe `hasCause` indicator is public. Connection strings, SQL, parameter values, entity values, and sensitive identifiers are not copied into public properties or messages. The errors contain no HTTP status, NestJS HTTP exception, or user-facing message assumption.

Concrete repositories own operation-specific Prisma/database error translation. The Language adapter maps initialization/engine-unavailability failures to `RepositoryUnavailableError`, maps other query failures to safe `PersistenceError`, returns `null` for ordinary absence, and leaves mapper/programmer errors visible. The Actor Principal adapter additionally maps provider uniqueness failures to `DuplicateEntityError` and recognized connection/operation/pool timeout failures to `RepositoryUnavailableError`; its mapper remains outside the provider catch boundary. The transaction manager propagates transaction failures unchanged except for transaction-context misuse, which it identifies directly.

## Dependency-injection tokens

Stable symbols exist for:

- `ACTOR_PRINCIPAL_REPOSITORY`
- `LANGUAGE_REPOSITORY`
- `CATEGORY_REPOSITORY`
- `TOPIC_REPOSITORY`
- `TAXONOMY_CHANGE_RECORD_REPOSITORY`
- `TRANSACTION_MANAGER`

All six tokens are bound with `useExisting`, so each token resolves to its single infrastructure provider. They are the only persistence-module exports, and module tests assert that every token resolves.

## Testing strategy

The foundation tests verify:

- existing Prisma configuration and lifecycle behavior;
- Nest dependency-injection construction of the non-global persistence module;
- one transaction-manager singleton behind the token;
- all five repository provider bindings and the transaction provider binding;
- callback execution, result return, and error propagation;
- explicit `READ COMMITTED` isolation;
- root-client and active-context resolution;
- rejection of nested, foreign, and expired transaction contexts;
- safe error codes and causal-error preservation without message leakage; and
- a source-level architecture rule prohibiting Prisma imports or type names in domain persistence contracts;
- explicit Language mapping, deterministic query arguments, transaction routing, safe error translation, and absence of mutation methods; and
- disposable PostgreSQL behavior for Language lookup, filtering, ordering, uniqueness, `C` collation, and read-only row-count stability;
- explicit Actor Principal mapping, UUID lookup/existence, transaction-only controlled provisioning, safe errors, and prohibited update/delete behavior; and
- disposable PostgreSQL Actor Principal idempotency, conflicting duplicate, concurrent race, rollback, invalid-context, and unrelated-table isolation behavior.
- explicit Category lifecycle mapping, deterministic reads, atomic versioned writes, safe conflict diagnosis, and prohibited create/delete/audit behavior; and
- disposable PostgreSQL Category partial uniqueness, `C` comparison, check constraints, lifecycle persistence, rollback, concurrency, and unrelated-table isolation behavior.
- explicit Topic mapping, exact-scope reads, deterministic root/direct-child/hierarchy reads, atomic ordinary versioned persistence, relationship-change rejection, and safe error translation; and
- disposable PostgreSQL Topic partial uniqueness, `C` comparison, check constraints, rollback, ordinary concurrency, Category-version preservation, and unrelated-table isolation behavior.
- explicit Taxonomy Change Record mapping, strict append, target-scoped reads, bounded linear correction traversal, safe errors, and prohibited update/delete/workflow behavior; and
- disposable PostgreSQL audit FK/check/unique enforcement, rollback, immutable originals, sequential correction, concurrent append/successor races, and unrelated-table isolation behavior.

All transaction tests use a fake Prisma transaction boundary. They execute no SQL and write no application data.

## Prohibited Prisma leakage

- Domain repositories and transaction contracts must never import `@prisma/*` or generated Prisma code.
- Controllers, DTOs, and application services must not import Prisma directly.
- Prisma filters, includes, records, generated inputs, and `TransactionClient` must not appear in domain-facing signatures.
- Only infrastructure may resolve an opaque transaction context to a root or transaction-scoped Prisma client.
- New leakage requires correction before a repository adapter can be approved.

## Future repository implementation sequence

Each step requires separate authorization and review:

1. Approve one bounded concrete repository adapter or aggregate-oriented adapter slice.
2. Add explicit Prisma-to-domain mapping and operation-specific safe error translation.
3. Add PostgreSQL-backed repository and constraint tests in an isolated database.
4. Verify optimistic concurrency, append-only history, restrictive referential actions, and transaction participation.
5. Add the approved provider binding to `PersistenceModule` only after its implementation passes review.
6. Authorize application-service orchestration separately before any repository operation becomes part of a workflow.
7. Authorize controllers/APIs and any seed or migration independently.

## Current authorization boundary

| Work                                  | Status after Sprint 2.29       |
| ------------------------------------- | ------------------------------ |
| Shared persistence foundation         | `COMPLETE`                     |
| Prisma lifecycle integration          | `COMPLETE`                     |
| Transaction abstraction               | `COMPLETE`                     |
| Repository contracts                  | `COMPLETE`                     |
| Read-only Language adapter            | `COMPLETE`                     |
| Actor Principal adapter               | `COMPLETE`                     |
| Category adapter                      | `COMPLETE`                     |
| Topic adapter                         | `COMPLETE`                     |
| Governed Topic hierarchy mutation     | `NOT IMPLEMENTED`              |
| Taxonomy Change Record adapter        | `COMPLETE`                     |
| All persistence tokens bound          | `COMPLETE`                     |
| Read-only Language query service      | `COMPLETE`                     |
| Read-only Category query service      | `COMPLETE`                     |
| Read-only Topic query service         | `COMPLETE`                     |
| Controlled Actor provisioning service | `COMPLETE`                     |
| Category ordinary mutation primitive  | `COMPLETE`                     |
| Narrow Topic ordinary repository port | `IMPLEMENTED; RECHECK PENDING` |
| Topic ordinary mutation primitive     | `IMPLEMENTED; RECHECK PENDING` |
| Taxonomy audit orchestration          | `NOT IMPLEMENTED`              |
| Authentication or authorization       | `BLOCKED`                      |
| Matrix-approved application services  | `AUTHORIZED WITH RESTRICTIONS` |
| Controllers, DTOs, or APIs            | `BLOCKED`                      |
| Seed execution or data insertion      | `BLOCKED`                      |
| Additional migrations                 | `BLOCKED`                      |
| Flutter implementation                | `BLOCKED`                      |
| Database schema                       | `UNCHANGED`                    |

The final review authorizes future, separately scoped implementation of only its matrix-approved services. Sprint 2.24 through Sprint 2.26 completed taxonomy queries; Sprint 2.27 completed Actor Principal provisioning; Sprint 2.28 completed ordinary Category mutation; and Sprint 2.29 implements the narrow ordinary Topic repository/application primitive with its final disposable/live revalidation pending. Governed hierarchy mutation, taxonomy-audit orchestration, caller authorization, and every other blocked boundary remain excluded.
