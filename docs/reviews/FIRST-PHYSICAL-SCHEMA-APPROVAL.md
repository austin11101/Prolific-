# First Physical Schema Approval

## Approval record

| Item                         | Recorded outcome                                |
| ---------------------------- | ----------------------------------------------- |
| First Physical Schema        | `APPROVED`                                      |
| Approval date                | 2026-07-17                                      |
| Authority                    | Project Product Owner / Architecture Governance |
| Governance phase             | Complete                                        |
| Prisma schema implementation | `AUTHORIZED`                                    |
| Migration generation         | `NOT YET AUTHORIZED`                            |
| Migration execution          | `NOT AUTHORIZED`                                |

This record supplies the five human decisions required by the [First Physical Schema Review](./FIRST-PHYSICAL-SCHEMA-REVIEW.md). It approves the reviewed physical design and authorizes only its implementation in `services/core-api/prisma/schema.prisma`. At the time of this approval record, that file remains model-free and PostgreSQL remains unchanged.

## Approval scope

Approval is limited to the migration-one actor-and-taxonomy design documented by the [First Physical Schema Proposal](../07-database/first-physical-schema-proposal.md), including its reviewed table/column mappings, native PostgreSQL types, nullability, defaults, mutability, keys, checks, foreign-key actions, uniqueness, indexes, lifecycle rules, privacy classifications, repository ownership, transaction boundaries, and Sprint 2.9 linear correction-chain amendment.

The approved catalogue contains five tables, five primary keys, five non-primary-key unique constraints, eight foreign keys, 26 checks, and 17 non-primary indexes, of which eight are unique and three are partial unique indexes. Approval does not expand the five-table boundary or settle any explicitly deferred policy.

## Reviewed evidence

- [First Physical Schema Proposal](../07-database/first-physical-schema-proposal.md)
- [First Physical Schema Decision Brief](./FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md)
- [First Physical Schema Decision Register](./FIRST-PHYSICAL-SCHEMA-OPEN-DECISIONS.md)
- [First Physical Schema Multidisciplinary Review](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md), including its Sprint 2.9 final amendment verification
- [First Physical Schema Review](./FIRST-PHYSICAL-SCHEMA-REVIEW.md)
- [Sprint 2 Persistence Implementation Decisions](./SPRINT-2-IMPLEMENTATION-DECISIONS.md)
- [Database Overview](../07-database/database-overview.md) and [ERD](../07-database/erd.md)
- [Product Decision Log](../product-decision-log.md) and [Master Roadmap](../14-roadmap/master-roadmap.md)

All 22 multidisciplinary findings are resolved or accepted: 17 `RESOLVED` and five `ACCEPTED`. Technical blockers, open major findings, and design-decision blockers are zero.

## Approved migration-one scope

The approved increment is the pseudonymous actor-and-taxonomy foundation only. It creates no learner identity, credentials, authorization grants, lesson/content, publication, reading activity, synchronization, analytics, or privacy-workflow model.

### Approved tables

1. `actor_principals`
2. `languages`
3. `categories`
4. `topics`
5. `taxonomy_change_records`

No sixth table may be added under this approval. The exact approved definitions and catalogues remain authoritative in the [proposal](../07-database/first-physical-schema-proposal.md#first-migration-table-definitions).

## Deferred tables and boundaries

The following remain outside this approval and require later bounded review and authorization:

| Deferred boundary                                           | Deferred tables or artifacts                                                                                                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Learner identity                                            | `users`, `user_preferences`, `devices`, `user_identity_profiles`, `authentication_identities`, `authentication_sessions`                                      |
| Authorization and administration                            | `actor_capability_assignments`                                                                                                                                |
| Localized taxonomy                                          | `category_localizations`, `topic_localizations`                                                                                                               |
| Lesson authoring and content                                | `lessons`, `lesson_variants`, `working_drafts`, `working_draft_blocks`, `lesson_revisions`, `lesson_content_blocks`, `reading_positions`                      |
| Audio, sources, and offline packages                        | `tutorial_audio_assets`, `tutorial_alignment_entries`, `content_sources`, `lesson_source_attributions`, `offline_package_manifests`, `offline_package_assets` |
| Editorial workflow                                          | `review_submissions`, `review_decisions`, `publication_records`, `lesson_visibility_records`, `restricted_review_notes`                                       |
| Reading and progress                                        | `reading_sessions`, `reading_session_events`, `progress_events`, `user_progress`, `daily_streaks`                                                             |
| Synchronization                                             | `sync_receipts`, `sync_cursors`, `server_outbox_events`                                                                                                       |
| Privacy workflows                                           | `account_deletion_requests`, `privacy_action_records`, `retention_holds`, `retention_hold_targets`, `anonymization_work_items`                                |
| Search, analytics, reporting, and future content generation | No physical table or projection is authorized                                                                                                                 |

## Reviewer approvals

| Discipline            | Human decision | Date       | Authority                                       | Amendments |
| --------------------- | -------------- | ---------- | ----------------------------------------------- | ---------- |
| Software Architecture | `APPROVED`     | 2026-07-17 | Project Product Owner / Architecture Governance | None       |
| Backend Engineering   | `APPROVED`     | 2026-07-17 | Project Product Owner / Architecture Governance | None       |
| Data / Database       | `APPROVED`     | 2026-07-17 | Project Product Owner / Architecture Governance | None       |
| Security & Privacy    | `APPROVED`     | 2026-07-17 | Project Product Owner / Architecture Governance | None       |
| Product / Governance  | `APPROVED`     | 2026-07-17 | Project Product Owner / Architecture Governance | None       |

These are the supplied human approvals. They replace the pending decision fields without changing the Sprint 2.9 advisory record or historical finding register.

## Implementation authority

| Work item                                                 | Authority after this approval |
| --------------------------------------------------------- | ----------------------------- |
| First Physical Schema                                     | `APPROVED`                    |
| Prisma schema implementation for the approved five tables | `AUTHORIZED`                  |
| Migration generation                                      | `NOT YET AUTHORIZED`          |
| Migration execution                                       | `NOT AUTHORIZED`              |
| Seed execution                                            | `NOT AUTHORIZED`              |
| Repository implementation                                 | `NOT AUTHORIZED`              |
| API implementation                                        | `NOT AUTHORIZED`              |
| Flutter implementation                                    | `NOT AUTHORIZED`              |

Authorization to edit `schema.prisma` begins only in a separate implementation task. This documentation task does not exercise that authority.

## Remaining prohibited work

Until later explicit authorization, do not:

- run Prisma migration generation, `db push`, `db pull`, `migrate diff`, or migration execution;
- create migration directories, executable SQL, PostgreSQL objects, roles, grants, or privileges;
- execute production, development, demo, or test seeds;
- implement repositories, application services, normalization code, raw-query locking, APIs, or Flutter behavior;
- add any deferred table, relation, enum, field, index, or policy to the approved increment; or
- treat schema approval as deployment, database, seed, or application-layer approval.

## Approval conditions

1. Schema implementation must reproduce the approved five-table proposal without scope expansion or silent substitutions.
2. Provider-specific mappings that Prisma cannot express directly must remain documented for later migration review; they must not be approximated through runtime synchronization.
3. `schema.prisma` formatting and validation must pass before schema implementation is presented for review.
4. The implemented model, relation, enum, map, constraint, and index intent must be reconciled against the 44 named constraints and 17-index catalogue.
5. The Prisma schema implementation must not create a migration, SQL, seed, repository, API, Flutter change, or PostgreSQL object.
6. Migration generation requires a separate explicit authorization after the implemented schema receives focused verification and the remaining migration-generation checklist gate is approved.

## Next implementation milestone

The next permitted milestone is a focused Prisma schema implementation task for only `actor_principals`, `languages`, `categories`, `topics`, and `taxonomy_change_records`, followed by formatting, Prisma validation, and documentation/count reconciliation. Migration generation and every downstream implementation activity remain outside that milestone unless separately authorized.
