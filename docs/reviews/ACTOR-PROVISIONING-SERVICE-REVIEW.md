# Actor Provisioning Service Review

## Decision record

| Item                         | Result                               |
| ---------------------------- | ------------------------------------ |
| Sprint                       | 2.27                                 |
| Review date                  | 2026-07-21                           |
| Gate authority               | Sprint 2.23 `PASS WITH RESTRICTIONS` |
| Actor provisioning service   | `COMPLETE`                           |
| Application service token    | `BOUND`                              |
| Application transaction      | `IMPLEMENTED`                        |
| Authentication/authorization | `NOT IMPLEMENTED`                    |
| Controllers and APIs         | `NOT IMPLEMENTED`                    |
| Development database         | Unchanged and empty                  |

## Authorization boundary

Sprint 2.27 implements only controlled Actor Principal provisioning and its application-module composition. It creates no authentication, authorization, identity-provider, credential, JWT, OAuth, session, User, profile, role, permission, controller, route, GraphQL, Swagger/OpenAPI, Category/Topic mutation, taxonomy-audit orchestration, hierarchy movement, seed, schema change, migration, development-data write, Flutter code, or deployment authority.

The service is an internal application capability with no registered runtime or transport caller. Its existence does not establish that any caller is trusted. A future caller must receive separate authorization and must supply an approved application-owned Actor Principal identity and kind.

## Application-layer structure

```text
src/application/actor/
  actor-provisioning.errors.ts
  actor-provisioning.service.ts
  actor-provisioning.tokens.ts
  actor-provisioning.types.ts
  focused unit and architecture tests

src/modules/actor-application/
  actor-application.module.ts
  actor-application.module.spec.ts
```

The service is a plain TypeScript class. NestJS is confined to the composition module. No generic command framework, CRUD service, identity abstraction, or shared mutation base was added.

## Service contract

`ActorProvisioningService` exposes one operation:

```text
provisionActorPrincipal(ProvisionActorPrincipalCommand)
  -> Promise<ProvisionActorPrincipalResult>
```

It delegates only to `ActorPrincipalRepository.provisionControlled` inside `TransactionManager.execute`. It does not call repository lookup/existence operations before provisioning and does not amend either persistence contract.

## Command and validation

`ProvisionActorPrincipalCommand` is readonly and contains:

- `actorPrincipalId`: application-assigned immutable identity;
- `actorKind`: exactly `administrative`, `service`, or `system`.

Zero-length IDs, zero-length kinds, and unsupported kinds raise `InvalidActorProvisioningCommandError` with stable code `INVALID_ACTOR_PROVISIONING_COMMAND` and safe field identity. Invalid commands are rejected before a transaction opens or persistence is called. Non-empty IDs and approved kinds are forwarded byte-for-byte; no trimming, UUID rewriting, kind conversion, or transport validation occurs.

The narrow validation confirms only the approved command shape. It does not authenticate a person or service, evaluate permissions, validate an identity-provider subject, or assign capabilities.

## Result model

`ProvisionActorPrincipalResult` is a dedicated application result containing:

- `actorPrincipalId`;
- `actorKind`;
- `createdAt`.

The service maps every approved repository record field explicitly while renaming the persistence-neutral `id` to the application contract's `actorPrincipalId`. It returns a new frozen result and a defensive copy of `createdAt`; no Prisma or repository implementation type escapes.

## Transaction ownership

The application service calls `TransactionManager.execute` exactly once for each valid command. Inside its callback it calls `provisionControlled` once and supplies `{ transaction }` containing the exact opaque context received from the manager.

- Repository success returns the immutable application result and allows the manager to commit.
- Repository or transaction failure propagates unchanged and causes the manager to roll back.
- Validation failure opens no transaction.
- The service does not start a nested transaction, retry, retain a context, or call another repository.

The application layer requests a transaction; only infrastructure performs the physical commit or rollback.

## Idempotency and conflict behavior

The service preserves the reviewed repository semantics:

- a new ID/kind creates one immutable principal;
- the same ID and same kind is idempotent and returns the stored principal;
- the same ID with a different kind propagates `DuplicateEntityError` and rolls back;
- the service never changes an existing kind or performs check-then-create outside the repository's constraint-backed operation.

No new command/idempotency key is invented. The immutable Actor Principal ID is the approved idempotency identity for this operation.

## Error policy

- Narrow command errors use `INVALID_ACTOR_PROVISIONING_COMMAND` and never include supplied values.
- Safe repository persistence errors propagate unchanged.
- Transaction errors propagate unchanged.
- No HTTP status, `HttpException`, transport envelope, provider diagnostic, SQL detail, credential, actor ID, or identity payload is added to errors or logs.

## Dependency direction and dependency injection

```text
Future approved internal caller
  -> ActorProvisioningService
  -> TransactionManager + ActorPrincipalRepository
  -> Prisma transaction + PrismaActorPrincipalRepository
  -> PostgreSQL
```

Actor application source imports only its own types and persistence-neutral domain contracts. It imports no Prisma, generated client, infrastructure path, NestJS, HTTP concern, authentication library, Category/Topic repository, or taxonomy-audit repository.

`ActorApplicationModule` imports the non-global `PersistenceModule`. Its factory injects `ACTOR_PRINCIPAL_REPOSITORY` and `TRANSACTION_MANAGER`, constructs `DefaultActorProvisioningService`, binds `ACTOR_PROVISIONING_SERVICE`, and exports only that application token. It registers no controller and remains absent from `AppModule` until an authorized internal consumer exists.

## Focused test results

- Actor provisioning service: 10 test declarations / 12 Jest cases covering success, all three approved kinds, exact command forwarding, immutable defensive output, same-ID/same-kind idempotency, conflicting-kind rollback, repository-error rollback, transaction-error propagation, all invalid inputs, one transaction, exact context delivery, commit, rollback, and absence of lookup calls.
- Actor application architecture: 1 source-boundary test.
- Actor application module: 2 DI/metadata tests.
- Total: 3 suites and 15 tests passed.

## Integration-test decision

No duplicate Actor application-service PostgreSQL suite was added. The service introduces no new query, mapper rule, constraint, concurrency primitive, or physical transaction implementation. The existing Actor Principal repository integration suite proves successful commit, same-ID/same-kind idempotency, conflicting kind, concurrent equivalent provisioning, rollback, invalid context, and database isolation. Focused service tests prove application transaction ownership and module composition. The existing repository suite is rerun as a regression in this sprint.

## Security and privacy review

- The principal contains only immutable pseudonymous ID, closed kind, and creation time.
- No email, username, provider subject, profile, direct identifier, credential, token, role, permission, claim, session, or learner identity exists.
- `administrative`, `service`, and `system` classify the audit principal; they do not grant capabilities.
- No public endpoint or root-module registration makes provisioning reachable.
- Future identity linkage must use the separately approved mapping boundary and must never replace historical Actor Principal IDs.

## Findings

| Severity      | Finding                                                                                                               | Resolution                                                                                             |
| ------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| `MINOR`       | Persistence and transaction tokens are infrastructure-owned while application source must remain infrastructure-free. | The Nest composition module owns token injection; the plain service depends only on domain contracts.  |
| `OBSERVATION` | Command validation cannot establish trusted-caller authority because authentication/authorization are prohibited.     | The module remains internal and unregistered; future caller authority is a separate gate.              |
| `OBSERVATION` | Physical commit/rollback is owned by the injected transaction manager, not manually invoked by the service.           | The service wraps the complete repository operation in one `execute` callback and tests both outcomes. |

No blocker or major finding remains within the authorized service boundary.

## Expected-state matrix

| Capability                 | Status            |
| -------------------------- | ----------------- |
| Language Query Service     | `COMPLETE`        |
| Category Query Service     | `COMPLETE`        |
| Topic Query Service        | `COMPLETE`        |
| Actor Provisioning Service | `COMPLETE`        |
| Category Mutation Service  | `NOT IMPLEMENTED` |
| Topic Mutation Service     | `NOT IMPLEMENTED` |
| Taxonomy Audit Service     | `NOT IMPLEMENTED` |
| Governed Hierarchy         | `BLOCKED`         |
| REST API                   | `BLOCKED`         |
| Authentication             | `NOT IMPLEMENTED` |
| Flutter                    | `BLOCKED`         |

## Remaining blocked work

- Authentication, authorization, identity-provider integration, credentials, sessions, Users, profiles, roles, permissions, and actor-to-request binding.
- Actor Principal update, deletion, lifecycle, deactivation, search, listing, or public provisioning.
- Category and Topic mutations, taxonomy-audit orchestration, and governed hierarchy movement.
- Controllers, REST/GraphQL, DTO decorators, Swagger/OpenAPI, and root runtime composition.
- Seeds, schema changes, migrations, PostgreSQL development writes, Flutter, and deployment.

## Recommendation

Approve the internal controlled Actor Principal provisioning service. Do not register it in the root runtime or expose it through transport until a separately approved trusted-caller and authorization boundary exists. The next mutation increment must retain same-transaction audit requirements and may not infer authority from Actor Principal existence or kind.

## Validation outcome

- Focused Actor application tests: 3 suites and 15 tests passed.
- Full Core API unit run: 28 suites and 180 tests passed.
- Existing PostgreSQL repository regressions: Language 5, Actor Principal 7, Category 11, Topic 9, and Taxonomy Change Record 11 tests passed; every disposable database was dropped.
- End-to-end: 1 suite and 1 test passed.
- Prettier, ESLint, production TypeScript, test-inclusive TypeScript, and NestJS build passed.
- Prisma 7.8 validate, generate, and migrate status passed; live datasource-to-schema diff is an empty migration.
- PostgreSQL remains 16.13 with one successful migration, zero failed or rolled-back migrations, zero application rows, and zero disposable repository databases.
- Schema and initial-migration checksums remain the approved values. Internal links, heading structure, stale status, `git diff --check`, and unstaged-state checks passed.
- No schema, migration, SQL, generated Prisma source, development row, package, or root application-module change was made.
