# Governed Topic Hierarchy Command

## Status and authority

| Item               | Value                                                          |
| ------------------ | -------------------------------------------------------------- |
| Status             | Design proposal; not implemented or authorized                 |
| Review context     | Sprint 2.23 persistence final review                           |
| Physical authority | Existing Category, Topic, and Taxonomy Change Record schema    |
| Product authority  | ADR-016 and approved taxonomy documentation                    |
| Current gate       | `BLOCKED` pending contract and archived-parent policy approval |

This document defines the minimum future application and persistence boundaries for a governed Topic reparent. It creates no source contract, service, use case, database object, migration, or runtime authority.

## Scope

The proposed command moves one existing Topic, with its subtree implicitly following through the adjacency list, to a new parent or root position inside the Topic's existing Category. It may also set the moved Topic's explicit sibling display order.

The MVP physical design makes `topics.category_id` immutable. Cross-Category moves are prohibited; there is therefore one Category identity and one expected Category hierarchy version, not source/target Category pairs. Cross-Category taxonomy restructuring would require a separate governance decision and likely new application, audit, and historical-impact design.

The command does not create, rename, archive, restore, or delete a Topic. It does not modify descendants, rewrite history, renumber every sibling, provision an actor, or publish content.

## Proposed application owner

A future application-layer `GovernedTopicHierarchyMutation` service owns the command. The name is conceptual and does not authorize a class or module.

The application service:

1. receives trusted server-derived actor context and validated command input;
2. checks authorization before opening the transaction;
3. asks `TransactionManager` to open one transaction;
4. calls the proposed hierarchy persistence boundary with that context;
5. constructs exact `topic_reparent` evidence from the returned prior/resulting state;
6. calls `TaxonomyChangeRecordRepository.append` with the same context; and
7. returns only after Topic, Category hierarchy version, and audit evidence commit together.

Any failure rolls back all three changes. Controllers never own the transaction and repositories never authenticate or authorize the actor.

## Proposed persistence-neutral command

```text
GovernedTopicHierarchyCommand
  commandId: EntityId
  topicId: EntityId
  categoryId: EntityId
  expectedTopicLockVersion: ExpectedVersion
  expectedCategoryHierarchyVersion: ExpectedVersion
  targetParentTopicId: EntityId | null
  expectedTargetParentLockVersion: ExpectedVersion | null
  targetDisplayOrder: number
  actorPrincipalId: EntityId
  reasonCode: string
  occurredAt: Date
```

Rules:

- `categoryId` is both source and target Category.
- `targetParentTopicId = null` means move to root scope.
- `expectedTargetParentLockVersion` is null for a root move and required for a non-root move.
- `targetDisplayOrder` is explicit and non-negative. The command does not silently renumber siblings.
- UUIDs and `occurredAt` are supplied by approved application logic.
- `reasonCode` is a bounded registry value, never narrative or user-entered text.
- Actor identity comes from trusted server context, not a transport-supplied trusted claim.

The source Topic's current parent is deliberately not trusted from the request. The persistence result supplies the authoritative previous parent used in audit evidence.

## Recommended persistence option

Introduce a dedicated persistence-neutral `TaxonomyHierarchyRepository` with one explicit operation such as:

```text
moveTopic(
  input: PersistGovernedTopicHierarchyChangeInput,
  context: TransactionalRepositoryOperationContext
): Promise<GovernedTopicHierarchyMutationResult>
```

The result must report:

- Topic identity;
- Category identity;
- previous and resulting parent identities;
- previous and resulting display order;
- previous and resulting Topic lock versions; and
- previous and resulting Category hierarchy versions.

The repository owns only the database-specific hierarchy persistence primitive. It does not own authorization, reason selection, actor derivation, command replay policy, or audit orchestration.

## Option assessment

| Option                                               | Assessment                                                                                                                                                       | Decision        |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- |
| Extend `TopicRepository`                             | Could hide Category locking/version mutation inside a table-oriented adapter and blur the boundary already used for ordinary Topic writes.                       | Not recommended |
| Separate `TaxonomyHierarchyRepository`               | Makes cross-row locking, hierarchy validation, Category/Topic version mutation, and dedicated concurrency tests explicit without changing ordinary repositories. | **Recommended** |
| Infrastructure aggregate coordinator including audit | Risks moving application workflow, actor/reason decisions, and evidence orchestration below the application layer.                                               | Rejected        |
| Coordinate existing Category and Topic methods       | Impossible: Category persistence preserves hierarchy version and Topic persistence rejects parent/Category changes.                                              | Rejected        |

## Transaction and lock sequence

The future hierarchy adapter must use the caller-owned Prisma interactive transaction and the existing approved Category-lock raw-query exception only:

1. Lock the exact Category row using parameter binding and static reviewed identifiers.
2. Reject missing Category or stale `hierarchy_version` without exposing current values.
3. Load the moving Topic and atomically verify its ID, Category, and expected lock version.
4. For a non-root move, load the target parent, verify the same Category and expected parent lock version, and apply the approved archived-parent policy.
5. Load the authoritative Category hierarchy required for ancestor validation after the Category lock.
6. Reject self-parent, direct-child, deeper-descendant, malformed-cycle, cross-Category, and target-scope uniqueness violations.
7. Update only the moving Topic's parent, display order, update timestamp, and lock version.
8. Increment Category `hierarchy_version` exactly once without changing Category `lock_version` or metadata.
9. Return prior/resulting persistence facts to the application service.
10. Let the application service append exact audit evidence with the same transaction context.

All hierarchy writers must acquire the Category lock first, then affected Topic rows in deterministic UUID order. No hierarchy operation may open its own transaction or use the root client.

## Topic concurrency and affected rows

The moving Topic must be protected by an atomic expected-lock predicate and increment exactly once. A non-root target parent requires its expected lock version because lifecycle and ordinary metadata can change independently from Category hierarchy version.

The exact Prisma-supported mechanism for preventing the target parent from changing between validation and commit requires implementation review. A conditional no-semantic-change Prisma write may provide a row lock without adding a new raw-query exception, but it must be proven not to alter timestamps, versions, audit meaning, or observability. If that mechanism is rejected, transaction isolation/locking policy must be revised before implementation. This is an unresolved hierarchy-only design gate.

Descendants are not updated during a move. They retain parent links, lifecycle, display order, lock versions, and historical identity; moving the subtree follows from changing the root Topic's parent.

## Parent, Category, and cycle rules

- The target parent must exist when non-null.
- Moving Topic and target parent must belong to the command Category.
- The moving Topic cannot be its own parent.
- The target parent cannot be any descendant of the moving Topic.
- Traversal uses authoritative adjacency rows, a visited-ID set, and a reviewed maximum guard.
- A malformed pre-existing cycle fails closed with a safe hierarchy error.
- Root and child active-name partial unique indexes remain the final target-scope authority.
- Cross-Category movement remains prohibited.

## Archived-parent policy

The physical model defines Effective Visibility but does not explicitly approve whether a governed move may target an archived parent or archived ancestor. The minimum safe proposal is to reject such a target because the move would immediately make the subtree effectively unavailable. This recommendation requires Product/Governance approval before implementation; until then the hierarchy command remains blocked.

Archiving an existing parent remains a separate ordinary lifecycle command and does not rewrite descendants.

## Display-order policy

The moving Topic receives the explicit non-negative `targetDisplayOrder`. Existing siblings are not automatically shifted or renumbered because the current schema permits equal display orders and uses UUID as the deterministic tie-breaker. A future product requirement for contiguous ordering would require a separate contract and concurrency review, not an implicit hierarchy side effect.

## Audit evidence

After hierarchy persistence succeeds inside the still-open transaction, the application service appends one Topic-targeted record:

- `operation = topic_reparent`;
- `commandId`, actor, reason, and occurrence time from the approved command context;
- previous/resulting parent IDs from the hierarchy result;
- previous/resulting Topic lock versions from the hierarchy result;
- lifecycle fields null; and
- Category target null because Topic ownership is derived through the Topic FK.

`TaxonomyChangeRecordRepository` records this supplied evidence. It does not infer the hierarchy change or mutate Topic/Category state.

## Command duplication and retries

The existing audit repository uses strict command uniqueness. A future application service may provide idempotent command behavior by checking `findByCommandId`, comparing all persisted evidence-relevant fields, and returning the prior equivalent result. Conflicting command-ID reuse must fail safely.

Concurrent first attempts still race on the database command unique constraint. On a duplicate, the service may reload and compare the committed record. No current repository performs automatic retries.

The approved architecture anticipates bounded retries only for recognized serialization/deadlock infrastructure failures under the same command identity. The exact retry owner, attempt bound, backoff, isolation interaction, and observability fields require approval before hierarchy implementation. Business-version, target, cycle, lifecycle, and uniqueness conflicts are never automatically retried.

## Required contract additions

Before implementation, approve:

- `TaxonomyHierarchyRepository`;
- a dedicated repository token and DI binding;
- `PersistGovernedTopicHierarchyChangeInput`;
- `GovernedTopicHierarchyMutationResult`;
- safe hierarchy-cycle, stale parent, Category-hierarchy, and command-reuse error semantics;
- the archived-parent rule;
- the affected-Topic locking mechanism;
- the bounded traversal limit;
- retry ownership and limits; and
- the application-service command/result contract.

Existing `CategoryRepository`, `TopicRepository`, and `TaxonomyChangeRecordRepository` contracts should remain unchanged.

## Schema and migration impact

No schema change or migration is currently required. The existing Category hierarchy version, Topic lock version, composite same-Category parent FK, partial unique indexes, audit table, and constraints support the proposed command.

A migration would become necessary only if review selects a closure/path table, new lock column, contiguous-order structure, additional database lock primitive, or cross-Category move representation. None is proposed now.

## Required tests

Future authorization must require disposable PostgreSQL tests for:

- root-to-child, child-to-root, and parent-to-parent movement;
- Topic and Category expected-version conflicts;
- target-parent expected-version conflict;
- missing/wrong-Category/self/archived parent;
- direct and deep descendant cycle rejection;
- malformed-cycle traversal guard;
- root and sibling active-name conflict;
- deterministic lock order and recognized deadlock handling;
- two concurrent hierarchy commands with exactly one valid winner;
- Topic lock and Category hierarchy increments exactly once;
- unchanged Category lock and unrelated Topic fields;
- audit evidence matching committed prior/resulting state;
- complete rollback on hierarchy or audit failure;
- equivalent/conflicting command-ID reuse;
- absence of SQL, identifiers, taxonomy names, and evidence in errors/logs; and
- no unrelated-table or configured-development-database writes.

## Remaining gate

Governed Topic hierarchy mutation remains `BLOCKED`. Read services, controlled Actor Principal provisioning, ordinary Category/Topic mutation services, and audit append/correction services may be reviewed independently; none authorizes this hierarchy command.
