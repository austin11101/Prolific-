# Category Ordinary Mutation Application Service Review

## Document control

| Item              | Value                                                                           |
| ----------------- | ------------------------------------------------------------------------------- |
| Sprint            | 2.28                                                                            |
| Status            | `COMPLETE`                                                                      |
| Scope             | Internal ordinary Category metadata and lifecycle mutation application boundary |
| Repository        | Existing `CategoryRepository.persistVersionedChange` contract                   |
| Architecture gate | [Persistence Layer Final Review](./PERSISTENCE-LAYER-FINAL-REVIEW.md)           |
| Database baseline | [Foundation Baseline](./FOUNDATION-BASELINE.md)                                 |
| Date              | 2026-07-21                                                                      |

## Outcome

Sprint 2.28 implements `CategoryMutationService.persistOrdinaryChange` as a transport-neutral application primitive. It supports only explicit metadata updates, archive transitions, and restore transitions against an existing Category. It creates no Category, performs no hierarchy movement, does not increment `hierarchyVersion`, and does not append taxonomy audit evidence.

The service is not a complete governed administration workflow and is not exposed through `AppModule`, a controller, or an API. A future authorized caller must establish authentication and authorization and coordinate any required audit evidence in the approved transaction design before this primitive may support product behavior.

## Application contract

`PersistCategoryOrdinaryChangeCommand` is readonly and explicit. It contains:

- `operation`: `update_metadata`, `archive`, or `restore`;
- `categoryId`;
- exact positive `expectedLockVersion` and `expectedHierarchyVersion` values;
- the current ordinary Category state; and
- the intended resulting ordinary Category state.

The current/resulting state shape contains canonical and normalized names, lifecycle state, display order, optional icon key, archive timestamp, creation timestamp, and update timestamp. It deliberately contains no Topic relationship, parent, child, hierarchy-movement, audit, actor, authorization, transport, or arbitrary patch field.

`PersistCategoryOrdinaryChangeResult` is a dedicated immutable application result. It contains a frozen defensive Category view and the repository's previous/resulting lock and hierarchy versions. All returned dates are copied.

## Validation and operation rules

Validation occurs before a transaction opens. Invalid commands fail with stable code `INVALID_CATEGORY_MUTATION_COMMAND` and a narrow field indicator.

- Category ID must be a non-empty string. Values are not trimmed or normalized.
- Both expected versions must be positive safe integers; zero is invalid because the physical version baseline begins at one.
- Only the three explicit operations are accepted.
- Lifecycle values and lifecycle/archive timestamp combinations must be valid.
- Creation time cannot be rewritten.
- `update_metadata` must preserve lifecycle state and archive time and must change at least one approved metadata field. An `updatedAt`-only command is a no-op and is rejected.
- `archive` requires active/null to archived/non-null and cannot combine metadata changes.
- `restore` requires archived/non-null to active/null and cannot combine metadata changes.

The service does not trim, normalize, default, or otherwise silently rewrite caller values. Database constraints and the repository's safe error mapping remain authoritative for persistence-level integrity.

## Transaction and concurrency behavior

The application service opens exactly one transaction through `TransactionManager.execute`, calls `CategoryRepository.persistVersionedChange` exactly once, and passes the opaque transaction context to that call. It performs no pre-read, nested transaction, retry, or post-write query.

The exact expected lock and hierarchy versions are forwarded. The existing repository owns the atomic `id + lockVersion + hierarchyVersion` predicate, lock-version increment, hierarchy-version comparison and preservation, missing-row diagnosis, and separate lock, hierarchy, and combined conflict classification. Ordinary Category mutation never increments `hierarchyVersion`.

Any repository or transaction failure exits the callback and rolls back. Safe persistence errors propagate unchanged; no HTTP exception or transport mapping is introduced.

## Lifecycle boundary

Archive and restore use the existing full-record versioned mutation. There is no delete method and no generic save or patch surface. This sprint does not authorize physical deletion, Category creation, Topic mutation, reparenting, sibling reordering across an aggregate, hierarchy-version advancement, or cycle logic.

## Dependency injection

`CategoryMutationApplicationModule` is non-global, imports `PersistenceModule`, injects only `CATEGORY_REPOSITORY` and `TRANSACTION_MANAGER`, and exports only `CATEGORY_MUTATION_SERVICE`. It registers no controller and remains absent from `AppModule`.

The plain service imports the domain repository and transaction ports only. It has no NestJS, Prisma, generated-client, HTTP, authentication, authorization, JWT, other repository, or infrastructure dependency.

## Test evidence

The focused test suite covers:

- metadata mutation, archive, and restore;
- exact value and transaction-context forwarding;
- one transaction and one repository call;
- commit on success and rollback on failure;
- invalid IDs, lock versions, hierarchy versions, operations, lifecycle states, lifecycle transitions, no-op commands, and immutable creation time;
- absence of pre-reads and retries;
- unchanged propagation of missing, duplicate, lock-conflict, hierarchy-conflict, combined-conflict, constraint, invalid-context, unavailable-repository, and general persistence errors;
- immutable defensive output and date copies;
- module resolution and export metadata; and
- architecture exclusions for Prisma, infrastructure, transport, other repositories, authentication, hierarchy movement, generic patches, and DTOs.

No new application-level PostgreSQL integration suite is added. The existing Category repository disposable-database suite already proves the exact atomic persistence, constraints, rollback, and concurrency behavior. The new unit suite proves application orchestration and the module suite proves dependency injection; duplicating the repository SQL matrix here would add test cost without exercising a new database path.

## Database and scope evidence

- `schema.prisma` is unchanged.
- The applied migration and migration checksum are unchanged.
- No SQL, seed, repository, controller, API, service outside this bounded slice, Flutter code, or application data is introduced.
- The development database remains the frozen empty five-table baseline.
- No disposable database is created by the focused application tests.

## Governance reconciliation

The Sprint 2.23 readiness matrix authorized ordinary Category changes with restrictions. Sprint 2.28 implements only the internal validation, transaction, repository-call, and result-mapping primitive. It does not satisfy or remove the future caller authorization and taxonomy-audit workflow gates. Documentation now distinguishes the completed primitive from an exposed governed mutation workflow.

## Resulting status

| Capability                         | Status            |
| ---------------------------------- | ----------------- |
| Language Query Service             | `COMPLETE`        |
| Category Query Service             | `COMPLETE`        |
| Topic Query Service                | `COMPLETE`        |
| Actor Provisioning Service         | `COMPLETE`        |
| Category Ordinary Mutation Service | `COMPLETE`        |
| Topic Ordinary Mutation Service    | `NOT IMPLEMENTED` |
| Taxonomy Audit Service             | `NOT IMPLEMENTED` |
| Governed Hierarchy                 | `BLOCKED`         |
| REST API                           | `BLOCKED`         |
| Authentication                     | `NOT IMPLEMENTED` |
| Flutter                            | `BLOCKED`         |

## Next milestone

The next separately authorized application slice is Topic ordinary mutation. It must preserve immutable relationship fields and must not be confused with the blocked governed hierarchy command. Taxonomy audit orchestration, authorization, transport, and hierarchy behavior remain separate gates.
