# Topic Ordinary Mutation Application Service Review

## Document control

| Item                 | Value                                                             |
| -------------------- | ----------------------------------------------------------------- |
| Sprint               | 2.29                                                              |
| Status               | `IMPLEMENTED; FINAL DISPOSABLE REVALIDATION BLOCKED`              |
| Scope                | Internal ordinary Topic metadata and lifecycle mutation primitive |
| Repository operation | `TopicRepository.persistOrdinaryChange`                           |
| Database baseline    | [Foundation Baseline](./FOUNDATION-BASELINE.md)                   |
| Date                 | 2026-07-21                                                        |

## Outcome

Sprint 2.29 implements `TopicMutationService.persistOrdinaryChange` and one narrow persistence-neutral Topic repository operation. The operation updates only canonical name, normalized canonical name, lifecycle state, archive timestamp, update timestamp, and the atomic lock-version increment. Category ownership, parent relationship, and display order are neither inputs nor update columns.

This is an internal primitive, not a governed administrative workflow. It remains absent from `AppModule` and has no controller, API, authentication, authorization, actor, audit, hierarchy, creation, deletion, or deployment behavior.

## Contract contradiction and resolution

The original Sprint 2.29 brief required one application repository call while prohibiting Category, parent, and display-order fields in the command. The existing `TopicRepository.persistVersionedChange` accepted a full `TopicRecord`, used Category and parent in its predicate, and wrote display order. Using it would therefore have leaked hierarchy/order state into the application command or required a prohibited pre-read.

The revised authority resolves this by adding `TopicRepository.persistOrdinaryChange`. The existing full-record method remains unchanged and is not repurposed. The new input contains only Topic ID, expected Topic lock version, canonical name, normalized canonical name, lifecycle state, archive timestamp, and update timestamp. It contains no Prisma type, Category ID, parent Topic ID, display order, hierarchy version, movement instruction, or arbitrary patch.

## Repository behavior

`PrismaTopicRepository.persistOrdinaryChange` requires the caller's transaction context and performs one `updateManyAndReturn` operation with Topic ID and expected lock version as its atomic predicate. It increments the lock version exactly once and maps the returned row through the existing Topic mapper.

The operation intentionally omits Prisma's optional update limit. Topic ID is unique, so the predicate can affect at most one row. Disposable concurrency testing showed that a limited update could select the UUID before a competing commit and later update by UUID without rechecking the stale lock predicate. The direct non-limited update is intended to preserve PostgreSQL's atomic predicate recheck. Focused tests pass after this correction; the required disposable concurrency rerun is pending because privileged Docker access became unavailable.

The Prisma update data excludes `categoryId`, `parentTopicId`, and `displayOrder`; PostgreSQL therefore preserves them without a read-and-write-back cycle. There is no pre-read. If the atomic update affects no row, one bounded diagnostic read distinguishes missing Topic from stale lock using the established safe persistence errors. There is no retry or nested transaction.

The adapter performs no audit append, Category update, hierarchy validation, cycle check, relationship write, raw SQL, creation, deletion, or root-client mutation.

## Application contract and validation

`PersistTopicOrdinaryChangeCommand` is readonly and contains Topic ID, expected positive lock version, and explicit current/resulting ordinary state. Ordinary state contains only canonical name, normalized canonical name, lifecycle state, archive timestamp, and update timestamp.

Current/resulting state allows no-op validation before opening a transaction without a repository pre-read. An `updatedAt`-only difference is a no-op. Lifecycle/archive timestamp consistency is enforced. Values are not trimmed, normalized, defaulted, or silently rewritten.

Runtime objects use an exact field allowlist. Unsafe objects containing `categoryId`, `parentTopicId`, `displayOrder`, `hierarchyVersion`, or any arbitrary command/state field fail with `INVALID_TOPIC_MUTATION_COMMAND` before a transaction opens.

## Transaction and result behavior

The application validates first, opens exactly one transaction, calls `TopicRepository.persistOrdinaryChange` exactly once with the exact context, and returns a frozen `TopicMutationResult` and Topic view with defensive date copies. It commits on success and rolls back on any failure. It performs no pre-read, second repository call, nested transaction, or retry. Safe persistence errors propagate unchanged.

## Dependency injection and architecture

`TopicMutationApplicationModule` imports `PersistenceModule`, injects only `TOPIC_REPOSITORY` and `TRANSACTION_MANAGER`, exports only `TOPIC_MUTATION_SERVICE`, is non-global, registers no controller, and remains absent from `AppModule`.

The application source imports no Prisma, generated client, infrastructure adapter, NestJS, HTTP, audit repository, Category repository, Actor repository, hierarchy repository, authentication package, or transport decorator. The repository input remains domain-owned and Prisma-independent.

## Test evidence

Focused tests cover exact narrow Prisma update shape; metadata/lifecycle updates; missing/stale classification; invalid transaction rejection; command validation; prohibited runtime fields; one transaction and repository call; exact context; commit, rollback, no retry; safe-error propagation; immutable results; architecture exclusions; and module metadata.

The first extended disposable run proved metadata/lifecycle behavior and preservation checks but exposed a concurrent double-winner in the limited update form. The adapter was corrected and all focused/full in-process tests pass. The final disposable rerun for the corrected update, catalogue cleanup query, Prisma status/drift, and live development inspection remain blocked by the host approval usage limit and are not claimed as passing.

## Database and scope evidence

- `schema.prisma` and its checksum remain unchanged.
- The applied migration and its checksum remain unchanged.
- No SQL, migration, seed, development row, or PostgreSQL schema object is introduced.
- No task code targets or writes the development database; its final live row-count recheck is pending.
- Disposable cleanup ran in the failed suite's `finally` block; the final catalogue count recheck is pending.
- `AppModule` remains unchanged and nothing is staged.

## Resulting status

| Capability                                 | Status            |
| ------------------------------------------ | ----------------- |
| Language, Category, and Topic Queries      | `COMPLETE`        |
| Actor Provisioning                         | `COMPLETE`        |
| Category Ordinary Mutation                 | `COMPLETE`        |
| `TopicRepository.persistOrdinaryChange`    | `IMPLEMENTED`     |
| Topic Ordinary Mutation Service            | `IMPLEMENTED`     |
| Atomic one-call persistence                | `IMPLEMENTED`     |
| Application-owned transaction              | `UNIT VERIFIED`   |
| Category/parent/display-order preservation | `RECHECK PENDING` |
| Taxonomy Audit Orchestration               | `NOT IMPLEMENTED` |
| Governed Hierarchy                         | `BLOCKED`         |
| REST API                                   | `BLOCKED`         |
| Authentication                             | `BLOCKED`         |
| Flutter                                    | `BLOCKED`         |

## Remaining boundary

The narrow operation does not authorize hierarchy mutation. Governed Topic movement still requires the separately approved hierarchy repository/command, cycle policy, Category hierarchy concurrency, authorization, and atomic audit evidence. Taxonomy audit orchestration remains unimplemented; transport and authentication remain separate gates.
