# Prolific Database Overview

## Document control

| Item               | Value                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status             | Approved persistence architecture; physical design pending Architecture Gate conditions                                                                   |
| Decision authority | [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md) and [ADR-013](../decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md) |
| Domain authority   | [Canonical Domain Model](../architecture/canonical-domain-model.md)                                                                                       |
| Conceptual model   | [Conceptual ERD](./erd.md)                                                                                                                                |
| Gate status        | [Architecture Gate 001 PASS; AG-001 through AG-006 human-verified](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)                               |
| Review date        | YYYY-MM-DD                                                                                                                                                |

## Purpose and scope

This document defines the approved database-access, migration, transaction, integrity, seed, and operational boundaries for the Core API. It does not define the physical schema. Architecture Gate 001 is closed with `PASS`; physical design and implementation may begin only after formal Sprint 2 entry and the applicable [Sprint 2 Entry Checklist](../reviews/SPRINT-2-ENTRY-CHECKLIST.md) decisions.

PostgreSQL is the primary relational database. The Canonical Domain Model defines business meaning, and the Conceptual ERD identifies persistence candidates without forcing table-per-concept storage.

## Approved persistence technology

### Database access

- Prisma ORM is approved for Core API database access.
- PostgreSQL remains authoritative for persisted state and enforced database integrity.
- Prisma-generated types are infrastructure types only.
- Domain models and API DTOs remain separate from Prisma records and generated inputs.
- Prisma access occurs through infrastructure adapters; it is not available to controllers or domain objects.

### Planned Prisma structure

The Core API will own this planned structure during an authorized Sprint 2 implementation task:

```text
services/core-api/prisma/
|-- schema.prisma
|-- migrations/
`-- seed/
```

This directory is not created by this documentation decision.

## Migration ownership and rules

The Core API owns every Prolific PostgreSQL migration. Prisma Migrate is the approved migration system.

- Every schema change requires a migration.
- Migration SQL must be committed with the matching Prisma schema change.
- Generated SQL must be reviewed before it is accepted.
- Development migrations may be generated locally against a development PostgreSQL database.
- Production uses a controlled deployment command from an approved runbook.
- Runtime schema synchronization is prohibited.
- Production changes must not depend on Prisma schema push or another unversioned synchronization mechanism.
- A manual database change is exceptional and must be reconciled through committed migration history before the environment is considered aligned.
- Application startup must not apply production migrations implicitly.
- Migration histories must remain reproducible for a clean database and testable from supported existing versions.

The exact approved commands and rollback/run-forward procedures will be added with the Sprint 2 implementation and operational runbook. A migration is not safe merely because tooling generated it.

## Forward-safe production evolution

Production schema evolution uses four phases:

1. **Expand:** Add backward-compatible structures, nullable fields, new indexes, or parallel representations without removing what the deployed application uses.
2. **Migrate/backfill:** Transform or copy existing data with bounded, restartable, monitored operations.
3. **Switch:** Deploy compatible application behaviour that reads and writes the new representation; verify correctness before removing old behaviour.
4. **Contract:** Remove obsolete structures only after compatibility, rollback needs, backups, and data verification are satisfied.

Destructive one-step production changes are not approved. When rollback is unsafe because data has changed, the plan must favor a reviewed forward fix and preserve backup/restore readiness.

## Transaction ownership

The application service or use case owns the transaction boundary. Infrastructure supplies a transaction-scoped Prisma client, and all participating repository adapters use that same client.

- Repositories must not silently create separate transactions inside one transactional use case.
- Controllers must not own or coordinate database transactions.
- Transactions must not stay open across external service calls, uploads, audio generation, user input, or other unbounded waits.
- Side effects that cannot participate in PostgreSQL transactions use durable intent such as an outbox record and are processed after commit.

### Complete reading session

One transaction safely coordinates Reading Session completion, creation of the Progress Event, creation or reservation of the Outbox Event, and preservation of idempotency identifiers. A partial write must not claim completion while losing the progress or synchronization intent.

### Publish lesson revision

One transaction verifies the exact approved Review Submission/Decision, unchanged content/source checksums, Working Draft state/token, publisher authorization, and separation policy; atomically allocates the next Variant-scoped revision number; creates the immutable Lesson Revision and exactly one Publication Record; updates Current Published Revision and learner visibility; and closes the draft. A failed or losing concurrent attempt creates no partial Revision or publication evidence. External asset work must complete before this bounded transaction, not while it is open.

### Submit lesson draft for review

One transaction verifies draft state/concurrency and submitted checksums, creates an immutable Review Submission, and moves the Working Draft to `in_review`. Later material edits supersede the submission; they never overwrite it.

### Decide lesson review

One transaction verifies the exact current Review Submission, human reviewer capability and separation-of-duties policy, creates an immutable Review Decision, and transitions the Working Draft. Approval records authorization-at-decision evidence and applies only to the submitted checksum.

### Archive, withdraw, or restore

One transaction verifies authorization, appends a visibility/audit record, and changes current discovery state without mutating the Lesson Revision, original Publication Record, or historical Reading Sessions.

## Lesson content persistence expectations

[ADR-013](../decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md) establishes separate persistence concepts for Lesson, Lesson Variant, Working Draft, and Lesson Revision. [ADR-014](../decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md) establishes the immutable Revision content and package boundary.

- Lesson is the stable educational identity and belongs to one Topic.
- Lesson Variant is the stable Language/Difficulty stream. By default, only one active Variant exists per `lesson_id + language_id + difficulty` combination.
- Working Draft is the zero-or-one active editable copy for a Variant in the MVP. Draft saves use optimistic concurrency and do not allocate revision numbers.
- Lesson Revision has UUID identity and an immutable published snapshot. Its positive human-readable revision number is scoped to the Variant.
- Database uniqueness and the application-owned publication transaction both protect `lesson_variant_id + revision_number`.
- Current Published Revision lookup must be efficient while preserving all historical Revisions.
- Destructive cascades from Lesson or Lesson Variant to historical Lesson Revisions are prohibited.
- Reading Sessions and Offline Lesson Packages reference exact Lesson Revision identity; denormalized Lesson/Variant data is not a sufficient historical reference.
- Content Blocks retain stable IDs and deterministic order. Reading Positions are zero-based, contiguous, Revision-scoped, and reconstruct exact block-relative Display Spans.
- The recorded Tokenization Profile/version deterministically derives Reading Units, normalized comparison forms, positions, and word count; the Alignment Profile/version maps tutorial timing to the same positions.
- The Package Manifest carries Package Schema Version, interpretation metadata, attribution, ordered asset descriptors, and SHA-256 Package/Asset Checksums. Checksums never substitute for Revision or asset identity.
- Persistence must efficiently reconstruct one complete immutable package without mutating historical content. JSON versus normalized relations remains a physical decision, but either design must enforce ordering, stable IDs, immutability, and bounded package assembly.
- Destructive cascades must not delete Revision blocks, positions, alignment, manifests, or checksums while a Revision remains historically referenced.
- Administrative and Service Actors use stable distinct references. Deactivation or profile/role changes cannot rewrite or cascade-delete editorial evidence.
- Review Submissions, Review Decisions, Publication Records, and visibility records are append-only; corrections use linked superseding or compensating records.
- Exact submitted content/source checksums and authorization-at-action evidence are preserved. A unique publication relationship ensures one Publication Record per Lesson Revision.
- Current workflow/visibility state may be stored and indexed for efficient operations, but must remain consistent with and reconstructable from immutable evidence.
- Internal review notes and permitted actor snapshots require restricted access and minimal copying; they are never included in learner packages.

Exact model names, fields, constraints, indexes, locking syntax, and revision-allocation query are not approved by this conceptual design.

## Taxonomy persistence expectations

- Category and Topic use stable UUID identity, explicit display order, and lifecycle states `draft`, `active`, `hidden`, and `archived`; localized display names do not replace the Canonical Taxonomy Name.
- Every Topic has exactly one Category and zero or one parent Topic. Parent and child must share a Category, and authoritative ancestry must remain finite and acyclic.
- Active Category canonical names are normalized-unique. Active Topic canonical names are normalized-unique within the sibling scope `(category_id, parent_topic_id)`; exact normalization/collation remains a reviewed physical-design choice.
- Create, rename, reorder, reparent, lifecycle, restoration, and Lesson-reassignment operations validate current state and expected version in an application-owned transaction. Reparenting moves the entire subtree within one Category; cross-Category reparenting is prohibited.
- A Lesson may be reassigned only to an active Topic in its existing Category. Taxonomy changes never rewrite Lesson Revisions, Reading Sessions, progress, or historical analytics.
- Effective Visibility combines a node's own state with every ancestor. Archiving a parent does not bulk-update descendants; restoration re-evaluates current descendant state and conflicts.
- Hard deletion and destructive cascades are prohibited once taxonomy is referenced. Governed commands append actor/time/reason/prior/resulting audit evidence in the same transaction as the authoritative change.
- Recursive queries, closure/path tables, or materialized ancestry may support reads. Any such structure is a rebuildable projection and cannot become the authority for mutation validation.
- Discovery queries must efficiently filter active ancestors, active taxonomy, deterministic order, and eligible published content without assuming a fixed hierarchy depth.

Exact indexes, collation/normalization implementation, hierarchy locking/versioning, localization storage, and projection-refresh mechanics remain deferred within [ADR-016](../decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md).

### Process synchronization event

One transaction detects a duplicate event, applies accepted progress, writes the Sync Receipt, and updates required progress projections. The stable event ID and receipt uniqueness protect retry idempotency.

## History-safe deletion and retention requirements

- Learner identity/account data is structurally separable from Reading Sessions, Progress Events, Sync Receipts, and derived activity. Approved anonymization can detach/replace identity linkage without changing activity or exact Lesson Revision identity.
- Foreign keys and repositories preserve historical records. No destructive cascade crosses an aggregate boundary or reaches immutable content, learner activity, synchronization evidence, editorial/publication/taxonomy audit, actor history, or privacy evidence.
- Domain lifecycle is explicit: deactivate accounts/actors, archive content/taxonomy, withdraw publication visibility, anonymize privacy linkage, and purge only eligible temporary data. A universal `deleted_at` is prohibited as a lifecycle substitute.
- Stable internal identifiers avoid email/name in activity/history. Every denormalized personal-data copy requires documented purpose and treatment.
- Privacy Action Records and Retention Holds are restricted, append-only/data-minimized concepts. Corrections supersede; records exclude credentials, copied profiles, and private activity payloads.
- Account deactivation must prevent new synchronization acceptance and support deletion/anonymization tombstones that survive retries and restoration. Late Devices cannot recreate identity or reattach retained activity.
- Published/referenced content, exact Revisions/packages, and audit evidence are never purged. Never-published, unreviewed, unreferenced draft helpers may be purged only after dependency/audit/hold checks and evidence.
- Backup policy is separate from ordinary data access. Restore procedures reapply current deletion, anonymization, deactivation, and withdrawal state before restored data is exposed.
- Every proposed cascade, including temporary helper/token/upload cleanup, requires explicit review and justification in physical design.
- Retention design records purpose, basis, minimum/maximum duration, trigger, treatment, holds, owner, and evidence. Exact periods and legal bases remain specialist policy.

Exact identity/activity mapping, anonymization implementation, retention/backup periods, tombstone mechanics, and privacy workflow orchestration remain physical/policy work inside [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md).

## Repository policy

Repository interfaces are persistence-independent and shaped around aggregate or use-case needs. Candidate interfaces include:

- `UserRepository`
- `TaxonomyRepository`
- `LessonRepository`
- `ReadingSessionRepository`
- `ProgressEventRepository`
- `SyncReceiptRepository`

Candidate Prisma adapters include:

- `PrismaUserRepository`
- `PrismaLessonRepository`
- `PrismaReadingSessionRepository`
- `PrismaProgressEventRepository`
- `PrismaSyncReceiptRepository`

Not every physical table requires a repository. Generic repositories that obscure meaningful database behavior are prohibited. Reporting, administrative dashboards, and projections may use dedicated read repositories. Interfaces must not expose Prisma client, record, filter, transaction, or generated input types.

## Database logic policy

Normal business logic belongs in NestJS application/domain services. PostgreSQL enforces data integrity close to the data where declarative enforcement is reliable.

### Constraints and indexes

Use PostgreSQL constraints and indexes for:

- primary and foreign keys;
- unique constraints;
- not-null rules;
- check constraints;
- transactional consistency;
- query-supporting and integrity-supporting indexes; and
- immutable-history protection where appropriate.
- unique exact-submission decision/publication relationships and stable audit actor references; and
- efficient lookup of current draft/submission/workflow and visibility state without treating mutable state as historical authority.

Exact constraints and indexes require the relevant physical-design condition to be verified.

### Views

Views may later support administrative reporting, learner progress summaries, lesson statistics, and operational dashboards. A view is a read concern and does not become the authoritative source of a business fact unless a later approved design explicitly says so.

### Stored procedures

Stored procedures are exceptional. They require documented evidence for complex bulk synchronization, performance-critical reporting, controlled maintenance operations, or an operation demonstrably safer near the data. They must not become the default application-service layer.

### Triggers

Triggers remain minimal. They may be considered only for exceptional audit protection, immutable-history enforcement, or database-managed integrity that cannot be reliably enforced elsewhere. They must not implement ordinary reading, progress, lesson, streak, or publication workflows.

## Seed-data policy

Development seed data may include:

- English;
- isiZulu;
- Sepedi;
- Easy, Medium, and Hard pace presets at 100, 150, and 200 WPM; and
- safe development-only sample categories and topics.

Production lesson content must not be published through seed scripts. It must enter through the approved review and publication workflow, and only published content that has passed approval may become learner-visible.

## CI and deployment expectations

Future Core API CI must validate:

- Prisma schema formatting;
- Prisma schema validity;
- committed migration history;
- migration drift against temporary PostgreSQL;
- integration behavior against PostgreSQL;
- multi-repository transaction atomicity; and
- synchronization idempotency and duplicate-event handling.

This task does not add tooling or CI configuration. Exact drift and test-database tools remain to be selected.

The planned production order is:

```text
Confirm backup and restore readiness
-> apply approved migrations
-> deploy compatible Core API
-> run health checks
-> monitor database and application errors
```

Deployment must stop on migration failure and follow the approved runbook. Compatibility, backup, restore, health, and monitoring evidence are required before contraction or destructive cleanup.

## Physical design still unresolved

ADR-012 resolves the ORM, migration owner, repository boundary, and transaction owner. It does not resolve:

- exact Prisma version and connection-pool configuration;
- PostgreSQL extensions;
- drift tooling and test-database strategy;
- raw SQL escape-hatch governance;
- physical model names, columns, types, indexes, foreign-key actions, and timestamp precision;
- exact Working Draft concurrency token, locking strategy, physical structure, revision-allocation query, and translation-lineage representation. Lesson/Variant/Revision identity, numbering scope, uniqueness, optimistic-concurrency principle, and immutability are approved by ADR-013 under AG-002;
- physical JSON-versus-relational representation for approved AG-003 blocks/positions/alignment, exact canonical-JSON library, and package delivery/archive mechanics; the conceptual model is approved by ADR-014 and awaits human verification;
- exact physical actor/reference/capability mapping, actor snapshots, review-note protection, and superseding-record layout within the approved AG-004 boundary;
- exact taxonomy normalization/collation, localized-name mapping, ordering allocation, hierarchy concurrency and recursive/materialized ancestry strategy within the boundary approved by [ADR-016](../decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md); or
- exact identity/activity detachment, Privacy Action Record/Retention Hold mapping, tombstone, anonymization, backup reapplication, and retention automation within the boundary approved by [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md).

Gate verification no longer blocks database implementation. Formal Sprint 2 start, remaining Sprint 1 governance, and applicable before-first-migration checklist items still control when implementation may begin.
