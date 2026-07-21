# Language Query Service Review

## Decision record

| Item                      | Result                               |
| ------------------------- | ------------------------------------ |
| Sprint                    | 2.24                                 |
| Review date               | 2026-07-20                           |
| Gate authority            | Sprint 2.23 `PASS WITH RESTRICTIONS` |
| Language query service    | `COMPLETE`                           |
| Application service token | `BOUND`                              |
| Language mutation         | `BLOCKED`                            |
| Controllers and APIs      | `NOT IMPLEMENTED`                    |
| Database state            | Unchanged and empty                  |

## Authorization boundary

Sprint 2.24 implements only three read-only, transport-neutral Language queries and their application-module composition. It creates no controller, route, DTO, authentication or authorization behavior, mutation, transaction, seed, schema change, migration, database write, Category/Topic/Actor/audit service, Flutter code, or deployment authority.

## Application-layer structure

```text
src/application/language/
  language-query.errors.ts
  language-query.service.ts
  language-query.tokens.ts
  language-query.types.ts
  focused unit and architecture tests

src/modules/language-application/
  language-application.module.ts
  language-application.module.spec.ts
```

The application service is a plain TypeScript class. NestJS appears only in the composition module. No broad application framework, base query service, generic filter, or shared error hierarchy was introduced.

## Service contract

`LanguageQueryService` exposes:

```text
getById(GetLanguageByIdQuery) -> Promise<LanguageView | null>
getByTag(GetLanguageByTagQuery) -> Promise<LanguageView | null>
listContentEnabled() -> Promise<readonly LanguageView[]>
```

The contract is readonly, persistence-neutral, transport-neutral, and independent of NestJS decorators. It exposes neither repository contexts nor Prisma-generated types.

## Query input types

- `GetLanguageByIdQuery` contains only readonly `languageId`.
- `GetLanguageByTagQuery` contains only readonly `normalizedTag`.
- Neither type includes validation decorators, HTTP concepts, Prisma filters, pagination, fallback, aliases, or generic search behavior.
- `normalizedTag` is an already-normalized exact-match value. The application service never trims, lowercases, case-folds, rewrites punctuation, or otherwise normalizes it.

## Output-model decision

Sprint 2.24 uses a dedicated `LanguageView` rather than returning the repository's `LanguageRecord` object directly. This preserves an explicit application boundary and guarantees defensive immutability even when a test or future repository implementation supplies an unfrozen record.

Every approved Language field is mapped explicitly without invention. Every result is a new frozen object, and all non-null `Date` values are copied. List results are new frozen arrays containing new frozen views. No Prisma model or application consumer can mutate the repository-owned object through the returned view.

## Get-by-ID behavior

- Requires a non-empty `languageId` string.
- Calls `LanguageRepository.findById` exactly once with the unchanged ID and no transaction context.
- Returns a frozen `LanguageView` when found and `null` when absent.
- Performs no direct database access, mutation, retry, or transaction work.

## Get-by-tag behavior

- Requires a non-empty `normalizedTag` string.
- Calls `LanguageRepository.findByNormalizedTag` exactly once with the unchanged tag and no transaction context.
- Returns a frozen `LanguageView` when found and `null` when absent.
- Adds no locale matching, fallback, prefix search, alias, trimming, or normalization behavior.

## List-content-enabled behavior

- Calls `LanguageRepository.listContentEnabled` exactly once with no transaction context.
- Trusts the repository contract's content-enabled filter and deterministic `displayOrder`/UUID ordering.
- Does not reorder, filter again, paginate, or cache.
- Returns a frozen empty array for no records and a frozen ordered collection otherwise.

## Absence policy

Single-record absence returns `null`, matching the persistence-neutral repository convention. Empty lists return a readonly empty collection. No HTTP-style not-found exception or response status is introduced.

## Invalid-input policy

A zero-length ID or normalized tag raises `InvalidLanguageQueryError` with stable code `INVALID_LANGUAGE_QUERY` and safe field identity. Validation happens before repository delegation. Whitespace and other non-empty values are preserved exactly; transport-level syntax validation remains future work and must not silently normalize data.

## Persistence-error policy

Existing safe persistence errors propagate unchanged. The application service neither exposes a provider cause nor obscures the established stable persistence code. No broad application error hierarchy was needed for this read-only slice.

## Dependency direction

```text
Future controller
  -> LanguageQueryService
  -> LanguageRepository
  -> PrismaLanguageRepository
  -> Prisma Client
  -> PostgreSQL
```

Application source imports only its own types and persistence-neutral domain contracts. It imports no Prisma, generated client, concrete repository, infrastructure token, HTTP DTO, controller, transaction manager, or another aggregate repository.

## Dependency-injection registration

`LanguageApplicationModule` imports the non-global `PersistenceModule`. Its factory injects `LANGUAGE_REPOSITORY`, constructs `DefaultLanguageQueryService`, binds `LANGUAGE_QUERY_SERVICE`, and exports only that application token. Concrete persistence providers are not re-exported. The module has no controller and remains absent from `AppModule` until an authorized consumer exists.

## No-transaction proof

- `TransactionManager` is not injected or imported.
- Repository calls omit `RepositoryOperationContext`.
- No transaction context or interactive transaction is created.
- No retry or cross-repository orchestration exists.
- Unit assertions require the repository methods to receive exactly their approved arguments.

## No-mutation proof

The service can call only `findById`, `findByNormalizedTag`, and `listContentEnabled`. It has no Prisma client, Language mutation port, seed path, audit port, or write-capable dependency. The application architecture test rejects transaction and other aggregate dependencies. The configured development tables remain untouched.

## Unit-test results

Focused service coverage verifies exact delegation, found/absent results, empty-input rejection, exact tag preservation, defensive record/date copying, immutable ordered and empty lists, repository-data non-mutation, no transaction argument, and unchanged safe-error propagation.

Nine service tests pass. The separate application architecture test also passes and audits every non-test file in the Language application directory.

## Module-test results

The module compiles with a `LANGUAGE_REPOSITORY` stub, resolves `LANGUAGE_QUERY_SERVICE`, delegates through the injected stub, exports only the application token, registers no controller, and has no global-module metadata. It requires neither PostgreSQL nor a concrete Prisma adapter.

Two module tests pass.

## Optional integration-test decision

No new application-service PostgreSQL integration suite was added. The service introduces no query, constraint, mapping, or transaction behavior beyond the already PostgreSQL-tested Language repository. Focused unit tests prove application semantics, and the isolated module test proves DI wiring without duplicating fixtures or increasing database cleanup risk. The existing Language repository integration suite remains mandatory regression evidence.

## Security and privacy review

- No authentication, authorization, user identity, Actor Principal, or audit assumption exists.
- No credentials, connection strings, SQL, provider details, or input logging exists.
- The safe invalid-input error contains no supplied value.
- No public transport contract or unrestricted search abstraction exists.
- Future controllers must separately validate transport syntax and apply any approved visibility/authorization policy.

## Performance and operability review

ID and normalized-tag queries retain the repository's indexed unique lookups. The content-enabled list retains its approved indexed filter and deterministic order. There is no N+1 behavior, transaction duration, retry loop, cache, or extra query. The small governance-managed Language set does not require pagination for this internal application contract; any future public collection contract remains separately reviewed.

## Findings

| Severity      | Finding                                                                                               | Resolution                                                                                                                      |
| ------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `MINOR`       | The persistence token lives in infrastructure, but application source must not import infrastructure. | The composition module owns token injection through a factory; the plain service depends only on `LanguageRepository`.          |
| `OBSERVATION` | `LanguageRecord` is persistence-neutral but is repository-shaped.                                     | A dedicated defensively immutable `LanguageView` establishes the application boundary.                                          |
| `OBSERVATION` | No general application validation policy exists yet.                                                  | This slice rejects only zero-length values and preserves all non-empty input exactly; transport syntax policy remains deferred. |

No blocker or major finding remains.

## Remaining blocked work

- Language mutation and launch-language seed execution.
- Controllers, REST/GraphQL routes, DTOs, Swagger/OpenAPI, authentication, and authorization.
- Category, Topic, Actor Principal, taxonomy audit, and governed hierarchy application services outside their own authorized tasks.
- Schema changes, migrations, PostgreSQL development writes, Flutter, and deployment.

## Recommendation for Category query services

A future bounded Category-query task may follow the same plain-service plus composition-module pattern. It must explicitly define active/lifecycle visibility, absence semantics, immutable application views, and list bounds. It must not combine Category reads with mutation, automatic audit, Topic hierarchy behavior, controllers, or APIs.

## Validation outcome

- Focused Language application tests: 3 suites and 12 tests passed.
- Full Core API unit tests: 19 suites and 135 tests passed.
- Existing PostgreSQL repository regressions: Language 5, Actor Principal 7, Category 11, Topic 9, and Taxonomy Change Record 11 tests passed.
- End-to-end: 1 suite and 1 test passed.
- Prettier, ESLint, production TypeScript, test-inclusive TypeScript, and NestJS build passed.
- Prisma validate/generate/migrate status passed; the configured datasource has no schema drift.
- PostgreSQL remains 16.13 with one successful migration, zero failed/rolled-back migrations, zero application rows, and zero disposable repository databases.
- Schema and migration checksums remain the approved values; no schema or migration file changed.
