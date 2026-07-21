# Topic Query Service Review

## Decision record

| Item                 | Result                               |
| -------------------- | ------------------------------------ |
| Sprint               | 2.26                                 |
| Review date          | 2026-07-21                           |
| Gate authority       | Sprint 2.23 `PASS WITH RESTRICTIONS` |
| Topic query service  | `COMPLETE`                           |
| Application token    | `BOUND`                              |
| Topic mutation       | `NOT IMPLEMENTED`                    |
| Hierarchy mutation   | `NOT IMPLEMENTED`                    |
| Controllers and APIs | `NOT IMPLEMENTED`                    |
| Development database | Unchanged and empty                  |

## Authorization boundary

Sprint 2.26 implements only four read-only, transport-neutral Topic queries and their application-module composition. It creates no Topic create/update/archive/restore/reparent/reorder workflow, cycle authorization, Category hierarchy-version change, taxonomy audit write, controller, route, DTO, authentication or authorization behavior, transaction, seed, schema change, migration, database write, Flutter code, or deployment authority.

## Application-layer structure

```text
src/application/topic/
  topic-query.errors.ts
  topic-query.service.ts
  topic-query.tokens.ts
  topic-query.types.ts
  focused unit and architecture tests

src/modules/topic-application/
  topic-application.module.ts
  topic-application.module.spec.ts
```

The service is a plain TypeScript class. NestJS is confined to the composition module. No generic query framework, taxonomy base service, or shared application abstraction was added.

## Service contract

`TopicQueryService` exposes:

```text
getById(GetTopicByIdQuery) -> Promise<TopicView | null>
listRootsByCategory(ListRootTopicsByCategoryQuery) -> Promise<readonly TopicView[]>
listChildren(ListChildTopicsQuery) -> Promise<readonly TopicView[]>
loadHierarchy(LoadTopicHierarchyQuery) -> Promise<readonly TopicView[]>
```

Each operation delegates exactly once to its identically scoped existing `TopicRepository` read. `findActiveByScopedName` and `persistVersionedChange` are deliberately not exposed. No repository contract was amended.

## Query inputs and invalid-input policy

- `GetTopicByIdQuery` contains readonly `topicId`.
- `ListRootTopicsByCategoryQuery` contains readonly `categoryId`.
- `ListChildTopicsQuery` contains readonly `parentTopicId`.
- `LoadTopicHierarchyQuery` contains readonly `categoryId`.
- Zero-length identifiers raise `InvalidTopicQueryError` with stable code `INVALID_TOPIC_QUERY` and a safe field identity before persistence access.
- Non-empty identifiers are forwarded byte-for-byte. The service performs no trimming, normalization, UUID rewriting, or transport-format validation.

Supplied values are never included in errors. Transport syntax validation remains a future controller concern.

## Output-model decision

Sprint 2.26 uses a dedicated `TopicView`. Every approved `TopicRecord` field is mapped explicitly without invention. Results are new frozen objects; nullable `archivedAt` and both timestamps are defensively copied; collection results are new frozen arrays. This prevents repository records from escaping by reference while preserving the persistence-neutral field contract.

Single-record absence returns `null`. Collection absence returns an immutable empty array.

## Read behavior

### Get by ID

- Calls `TopicRepository.findById` exactly once with the unchanged Topic ID and no context.
- Returns one immutable view or `null`.
- Applies no visibility or lifecycle filter.

### List roots by Category

- Calls `TopicRepository.listRootsByCategory` exactly once with the unchanged Category ID.
- Preserves repository ordering by display order then UUID.
- Preserves both stored lifecycle states because the repository contract has no lifecycle parameter.

### List direct children

- Calls `TopicRepository.listChildren` exactly once with the unchanged parent Topic ID.
- Returns direct children only, in repository order.
- Performs no descendant traversal, Category inference, or lifecycle filtering.

### Load hierarchy

- Calls `TopicRepository.loadHierarchy` exactly once with the unchanged Category ID.
- Preserves the repository-defined flat complete Category set, record order, Category IDs, and nullable parent IDs.
- Does not construct a tree, infer traversal order, move Topics, repair parents, detect or authorize cycles, interpret `hierarchyVersion`, or create audit evidence.

The application copies records into immutable views; “unchanged hierarchy” means semantic membership, ordering, and relationship identity remain unchanged.

## Persistence-error policy

Safe persistence errors propagate unchanged. This preserves the repository layer's stable codes and private provider causes without adding a broad application error hierarchy.

## Dependency direction and dependency injection

```text
Future controller
  -> TopicQueryService
  -> TopicRepository
  -> PrismaTopicRepository
  -> Prisma Client
  -> PostgreSQL
```

Topic application source imports only its own types and persistence-neutral domain contracts. It imports no Prisma, generated client, infrastructure path, NestJS, HTTP concern, transaction type, or other aggregate repository.

`TopicApplicationModule` imports the non-global `PersistenceModule`. Its factory injects `TOPIC_REPOSITORY`, constructs `DefaultTopicQueryService`, binds `TOPIC_QUERY_SERVICE`, and exports only the application token. It registers no controller and remains absent from `AppModule` until an authorized consumer exists.

## No-transaction and no-mutation proof

- No transaction manager or context is imported or injected.
- Repository assertions expect only the approved query identifier.
- The test double includes `findActiveByScopedName` and `persistVersionedChange` and proves neither is called by approved query behavior.
- Source auditing finds no mutation, Prisma client, hierarchy-version, cycle, Actor Principal, or taxonomy-audit dependency.
- No application module is registered in the runtime root module.

## Focused test results

- Topic service: 13 tests covering exact delegation, found/absent results, all invalid identifiers, byte-for-byte forwarding, deterministic ordering, both stored lifecycle states, flat hierarchy preservation, immutable views/dates/lists, no unapproved repository calls, and safe-error propagation.
- Topic application architecture: 1 source-boundary test.
- Topic application module: 2 DI/metadata tests.
- Total: 3 suites and 16 tests passed.

## Optional integration-test decision

No new Topic application-service PostgreSQL suite was added. The service adds no persistence query, mapper rule, constraint, transaction, or concurrency behavior. The existing Topic repository integration suite proves real PostgreSQL ordering and filtering; focused service tests prove application behavior, and the module test proves token wiring with a stub. This avoids duplicating database fixtures without reducing relevant coverage.

## Security, privacy, and visibility review

- No authentication, authorization, identity, Actor Principal, audit, credential, or request-context assumption exists.
- No SQL, database URL, provider detail, supplied query value, or internal cause is logged or exposed.
- Stored lifecycle state is preserved. The service does not claim learner-visible or effective-visible taxonomy semantics.
- Future transport work must separately approve visibility, authorization, syntax validation, result bounds/pagination, and error translation.

## Performance and operability review

ID lookup retains the UUID primary-key path. Root, direct-child, and flat Category-set reads retain the repository's indexed deterministic order. The service adds no query, recursion, N+1 behavior, cache, retry, transaction, or reorder. Topic volume is expected to remain bounded for the MVP; any public hierarchy contract must separately review pagination, payload bounds, and effective visibility.

## Findings

| Severity      | Finding                                                                                                   | Resolution                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `MINOR`       | The repository token is infrastructure-owned while application source must remain infrastructure-neutral. | The Nest composition module owns token injection; the plain service depends only on `TopicRepository`. |
| `OBSERVATION` | `loadHierarchy` is a flat ordered set, not a tree traversal contract.                                     | The service preserves the flat representation and documents the boundary explicitly.                   |
| `OBSERVATION` | Root, child, and hierarchy repository methods return both lifecycle states.                               | The application preserves exact repository semantics and makes no learner-visibility claim.            |
| `OBSERVATION` | Public hierarchy result bounds and effective visibility are not transport-approved.                       | No public transport was added; these policies remain required before API exposure.                     |

No blocker or major finding remains.

## Remaining blocked work

- Topic create, update, archive, restore, rename, reorder, reparent, or `persistVersionedChange` application workflows.
- Cycle validation, Category hierarchy-version coordination, and the governed Topic hierarchy command.
- Category and Language mutations, controlled Actor Principal provisioning, and taxonomy-audit application orchestration.
- Controllers, REST/GraphQL, DTO validation, Swagger/OpenAPI, authentication, and authorization.
- Seeds, schema changes, migrations, PostgreSQL development writes, Flutter, and deployment.

## Recommendation

Approve the read-only Topic query application service. Together with the completed Language and Category query services, the approved taxonomy read-side application boundary is complete. The next application increment must be separately authorized and should address mutation prerequisites—caller/authorization identity, same-transaction taxonomy audit orchestration, and the governed hierarchy design—without treating these read services as mutation authority.

## Validation outcome

- Focused Topic application tests: 3 suites and 16 tests passed.
- Full Core API unit run: 25 suites and 165 tests passed.
- Existing PostgreSQL repository regressions: Language 5, Actor Principal 7, Category 11, Topic 9, and Taxonomy Change Record 11 tests passed; every disposable database was dropped.
- End-to-end: 1 suite and 1 test passed.
- Prettier, ESLint, production TypeScript, test-inclusive TypeScript, and NestJS build passed.
- Prisma 7.8 validate, generate, and migrate status passed; live datasource-to-schema diff is an empty migration.
- PostgreSQL remains 16.13 with one successful migration, zero failed or rolled-back migrations, zero application rows, and zero disposable repository databases.
- Schema and initial-migration checksums remain the approved values. Internal links, heading structure, stale status, `git diff --check`, and unstaged-state checks passed.
- No schema, migration, SQL, generated Prisma source, database row, or root application-module change was made.
