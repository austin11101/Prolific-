# Category Query Service Review

## Decision record

| Item                      | Result                               |
| ------------------------- | ------------------------------------ |
| Sprint                    | 2.25                                 |
| Review date               | 2026-07-21                           |
| Gate authority            | Sprint 2.23 `PASS WITH RESTRICTIONS` |
| Category query service    | `COMPLETE`                           |
| Application service token | `BOUND`                              |
| Category mutation         | `NOT IMPLEMENTED`                    |
| Controllers and APIs      | `NOT IMPLEMENTED`                    |
| Database state            | Unchanged and empty                  |

## Authorization boundary

Sprint 2.25 implements only three read-only, transport-neutral Category queries and their application-module composition. It creates no Category mutation, Topic/Actor/audit/hierarchy service, controller, route, DTO, authentication or authorization behavior, transaction, seed, schema change, migration, database write, Flutter code, or deployment authority.

## Application-layer structure

```text
src/application/category/
  category-query.errors.ts
  category-query.service.ts
  category-query.tokens.ts
  category-query.types.ts
  focused unit and architecture tests

src/modules/category-application/
  category-application.module.ts
  category-application.module.spec.ts
```

The service is a plain TypeScript class. NestJS is confined to the composition module. No generic query framework or shared application abstraction was added.

## Service contract

`CategoryQueryService` exposes:

```text
getById(GetCategoryByIdQuery) -> Promise<CategoryView | null>
findActiveByNormalizedName(FindCategoryByNormalizedNameQuery) -> Promise<CategoryView | null>
listByLifecycle(ListCategoriesByLifecycleQuery) -> Promise<readonly CategoryView[]>
```

The contract uses the exact existing `CategoryRepository` operations and introduces no repository amendment.

## Query input types

- `GetCategoryByIdQuery` contains readonly `categoryId`.
- `FindCategoryByNormalizedNameQuery` contains readonly `normalizedName`.
- `ListCategoriesByLifecycleQuery` contains readonly `lifecycleState`.
- There are no transport/validation decorators, Prisma filters, generic search inputs, trimming, lowercasing, or normalization.

The normalized name is an already-normalized exact comparison value. Lifecycle accepts only the approved `active` and `archived` values.

## Output-model decision

Sprint 2.25 uses a dedicated `CategoryView`. Although `CategoryRecord` is persistence-neutral, a dedicated application view prevents the repository object from becoming the application result by reference and follows the first application slice's explicit boundary.

Every approved Category field is mapped explicitly without invention. Results are new frozen objects, nullable `archivedAt` and both timestamps are defensively copied, and collections are new frozen arrays. This protects callers even when a future repository or test double returns mutable data.

## Get-by-ID behavior

- Rejects a zero-length `categoryId` before persistence access.
- Calls `CategoryRepository.findById` exactly once with the unchanged ID and no transaction context.
- Returns a frozen `CategoryView` when found and `null` when absent.

## Find-active-by-normalized-name behavior

- Rejects a zero-length `normalizedName` before persistence access.
- Calls `CategoryRepository.findActiveByNormalizedName` exactly once with the unchanged value.
- Does not trim, case-fold, normalize, search by prefix, or fall back to archived Categories.
- Returns a frozen view when found and `null` when absent.

## List-by-lifecycle behavior

- Accepts exactly `active` or `archived`.
- Calls `CategoryRepository.listByLifecycle` once with the exact lifecycle and no context.
- Preserves the repository's deterministic display-order/UUID ordering.
- Returns a frozen empty collection or a frozen collection of frozen views.
- Performs no additional lifecycle interpretation or filtering.

## Absence policy

Single-record absence returns `null`. Collection absence returns an immutable empty array. No HTTP not-found exception or status code is introduced.

## Invalid-input policy

Zero-length IDs/names and empty or unsupported lifecycle values raise `InvalidCategoryQueryError` with stable code `INVALID_CATEGORY_QUERY` and the safe field identity. Supplied values are never included in the error. Non-empty names are forwarded byte-for-byte.

## Persistence-error policy

Safe persistence errors propagate unchanged. This preserves existing stable codes and private provider causes without adding a broad application error hierarchy.

## Dependency direction

```text
Future controller
  -> CategoryQueryService
  -> CategoryRepository
  -> PrismaCategoryRepository
  -> Prisma Client
  -> PostgreSQL
```

Category application source imports only its own types and persistence-neutral domain contracts. It imports no Prisma, generated client, infrastructure path, NestJS, HTTP concern, transaction type, or other aggregate repository.

## Dependency-injection registration

`CategoryApplicationModule` imports the non-global `PersistenceModule`. Its factory injects `CATEGORY_REPOSITORY`, constructs `DefaultCategoryQueryService`, binds `CATEGORY_QUERY_SERVICE`, and exports only the application token. The module registers no controller and remains absent from `AppModule` until an authorized consumer exists.

## No-transaction proof

- No transaction manager or context is imported or injected.
- Every repository assertion expects only the approved query argument.
- No interactive transaction, retry, or cross-repository orchestration exists.

## No-mutation proof

The repository test double includes `persistVersionedChange` so tests can explicitly prove it is never called. Source auditing finds no mutation invocation. The service has no Prisma client, actor/audit dependency, seed path, or write-capable application port.

## Focused test results

- Category service: 11 tests covering exact delegation, found/absent results, all invalid inputs, exact normalized name, both lifecycle values, ordering, immutable views/dates/lists, repository-data non-mutation, no mutation calls, and safe-error propagation.
- Category application architecture: 1 source-boundary test.
- Category application module: 2 DI/metadata tests.
- Total: 3 suites and 14 tests passed.

## Optional integration-test decision

No new Category application-service PostgreSQL suite was added. This service adds no persistence query, constraint, mapping, transaction, or concurrency behavior. The existing Category repository integration suite proves the real PostgreSQL semantics; focused service tests prove application behavior, and the module test proves token wiring with a stub. Avoiding duplicate database fixtures keeps this slice narrow without reducing relevant coverage.

## Security and privacy review

- No authentication, authorization, identity, Actor Principal, audit, credential, or request-context assumption exists.
- No SQL, database URL, provider detail, supplied query value, or internal cause is logged or exposed.
- No public transport or broad search contract exists.
- Future transport work must separately approve visibility, authorization, syntax validation, pagination, and error translation.

## Performance and operability review

ID lookup retains the UUID primary-key path. Active-name lookup retains the approved active-name predicate and partial unique index semantics. Lifecycle lists preserve the repository's indexed deterministic order. The service adds no query, N+1 behavior, cache, retry, transaction, or reorder. Category volume is expected to remain bounded for MVP; any public list contract must separately review pagination and visibility.

## Findings

| Severity      | Finding                                                                                                   | Resolution                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| `MINOR`       | The repository token is infrastructure-owned while application source must remain infrastructure-neutral. | The Nest composition module owns token injection; the plain service depends only on `CategoryRepository`. |
| `OBSERVATION` | Category views contain lock and hierarchy versions used by later governed workflows.                      | They remain transport-neutral application data and are not exposed through an API in this sprint.         |
| `OBSERVATION` | Public active-category visibility and pagination policy are not yet transport-approved.                   | This internal query service preserves exact repository semantics; transport policy remains blocked.       |

No blocker or major finding remains.

## Remaining blocked work

- Category create, archive, restore, rename, reorder, or `persistVersionedChange` application workflows.
- Topic, Actor Principal, taxonomy audit, and governed hierarchy services.
- Controllers, REST/GraphQL, DTO validation, Swagger/OpenAPI, authentication, and authorization.
- Seeds, schema changes, migrations, PostgreSQL development writes, Flutter, and deployment.

## Recommendation for Topic query services

A separately scoped Topic-query task may follow the same application/composition pattern for the existing approved read methods. It must explicitly address flat hierarchy output, effective visibility versus stored lifecycle, result bounds, parent/category scope, and deterministic ordering. It must not introduce reparenting, cycle handling, Category hierarchy-version changes, audit orchestration, controllers, or APIs.

## Validation outcome

- Focused Category application tests: 3 suites and 14 tests passed.
- Full Core API unit tests: 22 suites and 149 tests passed.
- Existing PostgreSQL repository regressions: Language 5, Actor Principal 7, Category 11, Topic 9, and Taxonomy Change Record 11 tests passed.
- End-to-end: 1 suite and 1 test passed.
- Prettier, ESLint, production TypeScript, test-inclusive TypeScript, and NestJS build passed.
- Prisma validate/generate/migrate status passed; the configured datasource has no schema drift.
- PostgreSQL remains 16.13 with one successful migration, zero failed/rolled-back migrations, zero application rows, and zero disposable repository databases.
- Schema and migration checksums remain the approved values; no schema or migration file changed.
