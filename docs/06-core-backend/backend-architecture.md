# Prolific Core Backend Architecture

## Document control

| Item               | Value                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status             | Approved persistence boundaries; broader Core API architecture remains in progress                                                                        |
| Persistence ADRs   | [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md) and [ADR-013](../decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md) |
| Domain authority   | [Canonical Domain Model](../architecture/canonical-domain-model.md)                                                                                       |
| Database authority | [Database Overview](../07-database/database-overview.md)                                                                                                  |
| Gate status        | [Architecture Gate 001 PASS; AG-001 through AG-006 human-verified](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)                               |
| Review date        | YYYY-MM-DD                                                                                                                                                |

## Purpose and scope

This document defines the approved Core API boundaries for AG-001 through AG-006, including persistence, immutable content, packages, editorial/taxonomy audit, and history-safe privacy treatment. It does not implement modules, services, repositories, Prisma, database entities, migrations, or APIs. Authentication, detailed module composition, final API contracts, exact privacy policy, and physical mappings remain pending.

The Core API is a versioned REST API built with NestJS and TypeScript. PostgreSQL is its primary relational database, and Prisma ORM is its approved infrastructure database-access technology.

## Dependency flow

```text
Controller
-> Application Service
-> Domain Rules
-> Repository Interface
-> Prisma Repository Adapter
-> Prisma Client
-> PostgreSQL
```

Dependencies point inward toward application and domain policy. Outer infrastructure implements inner contracts.

## Layer responsibilities

### Controllers

- Translate authenticated HTTP input into application commands or queries.
- Validate transport input and map application outcomes to the approved API response/error format.
- Remain thin: no Prisma imports, persistence mapping, transaction ownership, or product workflow logic.

### Application services and use cases

- Coordinate one business operation and enforce its application-level authorization and ordering.
- Depend on repository interfaces, domain policies, clocks, identifiers, and other explicit ports.
- Own transaction boundaries when one operation requires atomic writes.
- Avoid keeping a database transaction open while invoking external systems or waiting on unbounded work.

### Domain rules

- Express product invariants and state transitions using domain types.
- Remain independent from NestJS transport types, Prisma-generated types, SQL, and external providers.
- Follow the Canonical Domain Model and approved product decisions.

### Repository interfaces

- Describe persistence capabilities needed by aggregates or use cases.
- Accept and return domain/application types, not Prisma records, filters, transactions, or generated inputs.
- Expose meaningful operations rather than generic CRUD abstractions.

### Prisma repository adapters

- Implement repository interfaces in the infrastructure layer.
- Use Prisma Client to query PostgreSQL.
- Map explicitly between persisted records and domain/application types.
- Use the transaction-scoped Prisma client supplied by the owning application service when a use case is transactional.
- Translate database-specific failures into safe infrastructure/application errors without exposing internal details.

### Read repositories

Dedicated read repositories may serve learner projections, administrative reporting, lesson statistics, or dashboards without loading full aggregates. They remain behind application services and return purpose-built application projections rather than Prisma types.

## Repository policy

Repositories are defined around aggregate and use-case needs. Approved examples are:

- `UserRepository`
- `TaxonomyRepository`
- `LessonRepository`
- `ReadingSessionRepository`
- `ProgressEventRepository`
- `SyncReceiptRepository`

Infrastructure adapter examples are:

- `PrismaUserRepository`
- `PrismaLessonRepository`
- `PrismaReadingSessionRepository`
- `PrismaProgressEventRepository`
- `PrismaSyncReceiptRepository`

These examples do not require one class per table or approve a final module layout. A `TaxonomyRepository` may coordinate Category/Topic use-case needs. A `LessonRepository` coordinates aggregate/use-case operations across Lesson, Variant, Working Draft, Revision, package metadata, and typed editorial evidence under ADR-015. Not every persistence concept receives a repository, and a generic base repository must not hide behavior important to authorization, append-only history, package reconstruction, concurrency, numbering, immutability, idempotency, or performance.

## Lesson application use cases

The planned application boundary includes:

- `CreateLesson`
- `CreateLessonVariant`
- `CreateLessonDraft`
- `UpdateLessonDraft`
- `SubmitLessonDraftForReview`
- `RequestLessonDraftChanges`
- `RejectLessonDraft`
- `ApproveLessonDraft`
- `PublishLessonRevision`
- `ArchiveLessonVariant`
- `WithdrawLessonRevision`
- `RestoreLessonPublication`
- `AssembleLessonRevisionPackage`
- `VerifyLessonRevisionPackage`

These names define conceptual use cases, not NestJS service or DTO classes.

The planned taxonomy application boundary includes `CreateCategory`, `UpdateCategoryMetadata`, `HideCategory`, `ArchiveCategory`, `RestoreCategory`, `CreateTopic`, `UpdateTopicMetadata`, `ReparentTopic`, `HideTopic`, `ArchiveTopic`, `RestoreTopic`, and `ReassignLessonToTopic`. These are explicit governed commands rather than generic CRUD or delete operations.

The planned privacy/lifecycle boundary includes `RequestAccountDeletion`, `DeactivateLearnerAccount`, policy-permitted `CancelDeletionRequest`, `ApplyIdentityAnonymization`, `PlaceRetentionHold`, `ReleaseRetentionHold`, `PurgeEligibleDraftData`, `ArchiveLesson`, `WithdrawLessonRevision`, `DeactivateAdministrativeActor`, and `DisableServiceActor`. Archive, withdrawal, deactivation, anonymization, hold, and purge are distinct authorized use cases; repositories expose no generic destructive delete for historical aggregates.

Taxonomy commands receive trusted server actor context, reason, command/idempotency identity where applicable, and an expected version. An application-owned transaction validates normalized scoped names, lifecycle state, same-Category ancestry, cycle freedom, and the current hierarchy version; then it applies the mutation and append-only audit evidence together. Reparenting locks or otherwise concurrency-protects the affected authoritative hierarchy and moves the whole subtree. Catalog/ancestry projections may refresh asynchronously after commit and are never used to authorize a write. Cross-Category reparenting, destructive cascades, and hard deletion of referenced taxonomy are prohibited.

Administrative use cases receive a trusted authenticated actor context from the server security boundary. They check current capability, workflow state, exact Review Submission identity, concurrency/checksum integrity, and separation-of-duties policy. Request DTOs never supply a trusted actor ID. Content Engine calls use a distinct Service Actor context restricted to draft creation/update and can never invoke approval or publication.

Typed Review Submissions, Review Decisions, Publication Records, and visibility records are immutable repository outcomes. Corrections append superseding or compensating evidence; ordinary save/delete methods cannot alter history. Restricted review notes and minimal actor snapshots are mapped separately from learner responses and packages.

Draft mutation commands supply the expected concurrency token. The application service returns an explicit conflict for a stale update; silent last-write-wins is prohibited. The exact token representation remains deferred.

`LessonRepository` must expose meaningful operations that preserve the Lesson aggregate without leaking Prisma types. It must distinguish editable Working Draft mapping from immutable Lesson Revision mapping. Published Revisions cannot be updated through ordinary save operations.

## Persistence mapping

- PostgreSQL and committed migrations are authoritative for the deployed schema.
- The Prisma schema maps the approved physical design and generates infrastructure-only types.
- Repository adapters map persistence records to domain models or application projections.
- API DTOs map at the transport boundary and do not expose Prisma-generated shapes.
- A change in Prisma naming or relation representation must not silently change domain terminology or public contracts.

## Transaction ownership

The application service or use case owns the transaction boundary. The infrastructure transaction mechanism provides a transaction-scoped Prisma client, and every repository adapter participating in that use case shares it.

- Repositories must not silently start independent transactions.
- Controllers must not begin, commit, or roll back transactions.
- Domain objects do not know that a database transaction exists.
- External service calls, uploads, audio generation, long-running computation, and user waits occur outside the database transaction.
- Durable outbox intent bridges committed database work to asynchronous external side effects.

The concrete transaction-context or unit-of-work API will be designed during authorized implementation. It must preserve these ownership rules without leaking Prisma types into application-service interfaces.

### Complete reading session

The application service starts one transaction and supplies its scoped Prisma client to the Reading Session, Progress Event, and Outbox persistence adapters. The transaction completes the Reading Session, creates the Progress Event, creates or reserves the Outbox Event, and preserves idempotency identifiers. All succeed or all fail.

### Publish lesson revision

The `PublishLessonRevision` application service starts one transaction after external audio/alignment preparation, block normalization, Reading Position generation, deterministic package assembly, and asset verification. It validates those prepared inputs and SHA-256 checksums, the exact approved Review Submission/Decision, unchanged Working Draft state/token/checksums, Publisher capability, and separation policy; assigns the next Variant-scoped Revision Number; creates the immutable Lesson Revision, manifest material, and exactly one Publication Record; switches Current Published Revision and learner visibility; and closes the Working Draft. No upload, audio generation, or long-running tokenization occurs inside the transaction. Concurrent or failed attempts create no duplicate/partial Revision or Publication Record.

### Editorial workflow transactions

Submit-for-review atomically verifies concurrency/state/checksums, creates an immutable Review Submission, and enters `in_review`. Request-changes, reject, or approve atomically validates exact submission and human authorization, creates an immutable Review Decision, and transitions state. Archive, withdrawal, and restoration atomically append visibility evidence and update discovery state without mutating original publication history. All participating adapters share the application-owned transaction-scoped Prisma client.

### Taxonomy transactions

Create, rename, reorder, reparent, hide, archive, restore, and Lesson-reassignment use cases atomically validate expected versions and the ADR-016 invariants, persist the resulting authoritative relationships/state, and append actor/time/reason/prior/resulting audit evidence. Ancestor unavailability changes descendant Effective Visibility without bulk-rewriting descendant states. Restoration revalidates current uniqueness, ancestry, and lifecycle rules. Lesson reassignment is limited to an active Topic in the Lesson's existing Category and does not rewrite published Revision or Reading Session history.

### Privacy workflow transactions

Account deactivation verifies request authority, changes state, revokes database-held authorization/session state, prevents new sync acceptance, and appends minimal Privacy Action evidence atomically where those records share persistence. Identity anonymization is a controlled retryable workflow that checks Retention Holds, removes/replaces approved identifiers and activity linkage consistently, preserves historical Revision references, and records policy/outcome without copying personal data. Eligible draft purge atomically proves absence of publication/review/history/hold dependencies before removal and evidence creation. File/object cleanup and other long-running external work occurs after commit through retryable orchestration.

Privacy workflows use server-derived identity, least-privilege authorization, idempotent action IDs, explicit requested/pending/blocked/completed/failed states, and privacy-safe structured logging. Late Device/outbox events for deactivated/deleted accounts are rejected and cannot recreate account state or reattach anonymized history.

### Package assembly and verification boundary

Application services coordinate deterministic Content Block validation, Language-specific Tokenization Profile/version selection, Reading Unit/Position generation, word-count validation, tutorial Alignment Profile/version validation, canonical manifest assembly, and SHA-256 computation. Infrastructure adapters provide binary asset reads/writes, canonical serialization, and storage transport. Domain/application rules reject unsupported blocks, non-contiguous positions, invalid spans, identity mismatches, missing attribution, and checksum mismatches. Controllers return descriptors or authorized transport references; they do not assemble packages or expose storage credentials.

### Process synchronization event

The synchronization application service starts one transaction for duplicate-event detection, accepted progress application, Sync Receipt creation, and required projection updates. A stable event ID and unique receipt boundary ensure a retry does not create a second Reading Session or duplicate progress.

## Migration and deployment boundary

The Core API owns all Prisma Migrate history under the planned `services/core-api/prisma/` directory. Application runtime does not synchronize the schema. Production migration execution is a controlled deployment activity described in the [Database Overview](../07-database/database-overview.md), separate from ordinary Core API startup.

## Database logic boundary

Normal business workflows stay in application/domain services. PostgreSQL constraints enforce structural integrity and transactional consistency. Views support bounded read concerns. Stored procedures and triggers are exceptional and require the evidence and restrictions in the Database Overview; they must not replace normal reading, progress, lesson, streak, synchronization, or publication services.

## Testing expectations

Future implementation must test:

- repository mapping and database constraints against PostgreSQL;
- transaction atomicity across multiple repository adapters;
- duplicate synchronization events and payload identity;
- stale-draft conflict handling, active-Variant/draft uniqueness, concurrent publication, revision-number allocation, immutable Revision mapping, and publication state/audit atomicity;
- server-derived actor context, capability and default self-approval denial, Service Actor restrictions, changed-submission conflicts, immutable/superseding audit behavior, one-record-per-Revision publication, and visibility compensation;
- normalized Category and sibling Topic uniqueness, same-Category parenting/reassignment, root and deep hierarchy traversal, direct/indirect cycle rejection, stale concurrent reparenting, subtree preservation, lifecycle-derived Effective Visibility, restoration conflicts, audit atomicity, and prohibited destructive cascades;
- account-request verification, deactivation/session revocation, late-sync rejection, identity/activity detachment, anonymization consistency and retry, Retention Holds, purge eligibility, prohibited cascades, restricted Privacy Action access, privacy-safe logging, and backup-restore tombstone reapplication;
- deterministic multilingual profile fixtures, ordered blocks, contiguous Reading Positions, exact span reconstruction, word counts, audio alignment references, canonical Package Checksum inclusions/exclusions, Asset Checksum failures, and unsupported schema/block/profile behavior;
- migration application on clean and supported existing schemas;
- migration drift in temporary PostgreSQL;
- safe translation of database errors; and
- architectural boundaries that prevent Prisma imports in controllers and domain code.

No test tooling is added by this documentation task.

## Remaining design work

The [Synchronization Service Design](./sync-service.md) defines the later sync application boundary and shared per-event outcomes. The [shared JSON Schemas](../../packages/shared-contracts/README.md) define specification-only package, sync, and error shapes.

- Exact Prisma version, connection pooling, schema naming, adapter placement, and transaction-context API.
- PostgreSQL extensions, raw SQL escape-hatch governance, migration drift tooling, and test-database strategy.
- Deferred AG-002 through AG-006 implementation details such as concurrency/locking, Language-specific tokenization, package delivery, authentication/RBAC library, actor/identity-activity mapping, taxonomy optimization, anonymization/tombstones, retention automation, snapshots, review-note retention, and audit-query access.
- Authentication/session design, authorization matrix, API error envelope, observability, and broader module boundaries.
- Object/file storage, lesson-package delivery, and synchronization service design.

These details do not reopen the ORM selection. Architecture Gate 001 no longer prohibits database implementation; formal Sprint 2 start and the applicable [Sprint 2 Entry Checklist](../reviews/SPRINT-2-ENTRY-CHECKLIST.md) prerequisites still apply.
