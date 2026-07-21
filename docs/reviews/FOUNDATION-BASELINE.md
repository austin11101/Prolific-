# Foundation Baseline

## Decision record

| Item                         | Recorded value                                                                |
| ---------------------------- | ----------------------------------------------------------------------------- |
| Status                       | `VERIFIED AND FROZEN`                                                         |
| Verification date            | 2026-07-20                                                                    |
| Environment                  | Configured local development database                                         |
| Database                     | PostgreSQL 16.13, database `prolific`, schema `public`                        |
| Approved schema version      | Five-model foundation implemented in `services/core-api/prisma/schema.prisma` |
| Prisma schema SHA-256        | `0C503B9B77346F0114093C47CF5E6C513749620465AF545165F1513DBE569113`            |
| Applied migration            | `20260717_initial_foundation`                                                 |
| Foundation migration SHA-256 | `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`            |
| Migration state              | One finished, non-rolled-back, one-step history row; no failure log           |
| Drift state                  | Zero Prisma-representable drift                                               |
| Application data             | All five foundation tables empty                                              |

This record freezes the first applied persistence baseline. It consumes the verified result in the [First Migration Execution Report](./FIRST-MIGRATION-EXECUTION-REPORT.md), confirms that result again against the live catalogue, and establishes the exact starting point for repository implementation. It does not authorize a database mutation.

## Approval scope

The baseline covers only the following approved foundation objects:

- `actor_principals`
- `languages`
- `categories`
- `topics`
- `taxonomy_change_records`
- `taxonomy_lifecycle_state`
- Prisma migration history for `20260717_initial_foundation`

No lesson, user, progress, download, synchronization, editorial-content, or seed-data table is part of this baseline.

## Verification evidence

The following checks passed on 2026-07-20:

- `prisma validate` accepted the configured schema.
- `prisma generate` regenerated Prisma Client 7.8.0 successfully.
- `prisma migrate status` found one migration and reported the database up to date.
- A live-datasource-to-schema migration diff returned only `-- This is an empty migration.`
- Read-only PostgreSQL inspection confirmed the expected tables, enum, constraints, indexes, collations, referential actions, and empty application tables.
- The schema and migration checksums remained unchanged across verification.
- No migration, SQL, seed, or PostgreSQL write was produced by this sprint.

## Migration history

| Migration                     | Database checksum                                                  | Finished | Rolled back | Applied steps | Failure log |
| ----------------------------- | ------------------------------------------------------------------ | -------- | ----------- | ------------: | ----------- |
| `20260717_initial_foundation` | `acf58378b548f4677aabfb65260da6e19c6d617b5162ac2bf444149e36ff837d` | Yes      | No          |             1 | None        |

The database checksum is the lower-case representation of the approved migration-file SHA-256. There is exactly one migration directory and one successful application-history row.

## Table catalogue

| Table                     | Purpose                                                      | Rows at freeze |
| ------------------------- | ------------------------------------------------------------ | -------------: |
| `actor_principals`        | Minimal durable actor reference for taxonomy audit history   |              0 |
| `languages`               | Canonical supported-language identity and discovery metadata |              0 |
| `categories`              | Root taxonomy nodes with lifecycle and concurrency state     |              0 |
| `topics`                  | Category-scoped hierarchical taxonomy nodes                  |              0 |
| `taxonomy_change_records` | Append-only taxonomy mutation and correction history         |              0 |

## Enum catalogue

| Enum                       | Ordinal | Value      |
| -------------------------- | ------: | ---------- |
| `taxonomy_lifecycle_state` |       1 | `active`   |
| `taxonomy_lifecycle_state` |       2 | `archived` |

## Constraint catalogue

### Primary keys

- `pk__actor_principals`
- `pk__languages`
- `pk__categories`
- `pk__topics`
- `pk__taxonomy_change_records`

### Non-primary unique constraints

- `uq__languages__normalized_tag`
- `uq__languages__normalized_name`
- `uq__topics__category_identity`
- `uq__taxonomy_change_records__command_id`
- `uq__taxonomy_change_records__supersedes`

### Foreign keys

- `fk__topics__category_id__categories`
- `fk__topics__category_id_parent_topic_id__topics`
- `fk__taxonomy_change_records__actor_id__actor_principals`
- `fk__taxonomy_change_records__category_id__categories`
- `fk__taxonomy_change_records__topic_id__topics`
- `fk__taxonomy_change_records__previous_parent_topic_id__topics`
- `fk__taxonomy_change_records__resulting_parent_topic_id__topics`
- `fk__taxonomy_change_records__supersede__taxonomy_change_records`

All eight foreign keys use the approved non-cascading actions. Live inspection found no cascade action.

### Check constraints

- `ck__actor_principals__actor_kind`
- `ck__languages__bcp47_tag_non_blank`
- `ck__languages__normalized_tag_non_blank`
- `ck__languages__canonical_name_non_blank`
- `ck__languages__normalized_name_non_blank`
- `ck__languages__display_order_non_negative`
- `ck__languages__retirement_content_consistency`
- `ck__categories__canonical_name_non_blank`
- `ck__categories__normalized_name_non_blank`
- `ck__categories__display_order_non_negative`
- `ck__categories__lock_version_positive`
- `ck__categories__hierarchy_version_positive`
- `ck__categories__lifecycle_timestamp_consistency`
- `ck__topics__canonical_name_non_blank`
- `ck__topics__normalized_name_non_blank`
- `ck__topics__display_order_non_negative`
- `ck__topics__lock_version_positive`
- `ck__topics__lifecycle_timestamp_consistency`
- `ck__topics__no_self_parent`
- `ck__taxonomy_change_records__exactly_one_target`
- `ck__taxonomy_change_records__target_operation`
- `ck__taxonomy_change_records__reason_code_shape`
- `ck__taxonomy_change_records__lifecycle_applicability`
- `ck__taxonomy_change_records__parent_applicability`
- `ck__taxonomy_change_records__version_progression`
- `ck__taxonomy_change_records__no_self_supersession`

The live catalogue contains exactly 26 approved checks.

## Index catalogue

PostgreSQL exposes 17 non-primary indexes: five indexes backing non-primary unique constraints, three standalone partial unique indexes, and nine non-unique indexes. Primary-key backing indexes are accounted for with their constraints and are not included in this total.

### Partial unique indexes

| Index                           | Approved predicate                                           |
| ------------------------------- | ------------------------------------------------------------ |
| `uq__categories__active_name`   | `lifecycle_state = 'active'`                                 |
| `uq__topics__active_root_name`  | `lifecycle_state = 'active' AND parent_topic_id IS NULL`     |
| `uq__topics__active_child_name` | `lifecycle_state = 'active' AND parent_topic_id IS NOT NULL` |

### Non-unique indexes

- `ix__languages__content_order`
- `ix__categories__discovery_order`
- `ix__topics__parent_order`
- `ix__topics__parent`
- `ix__taxonomy_change_records__category_time`
- `ix__taxonomy_change_records__topic_time`
- `ix__taxonomy_change_records__actor_time`
- `ix__taxonomy_change_records__previous_parent`
- `ix__taxonomy_change_records__resulting_parent`

## Collation catalogue

The live catalogue applies explicit PostgreSQL `COLLATE "C"` to exactly these normalized identity columns:

- `languages.normalized_tag`
- `languages.normalized_name`
- `categories.normalized_canonical_name`
- `topics.normalized_canonical_name`

## Negative catalogue assertions

The foundation has no database-generated UUID defaults, cascade foreign-key actions, non-internal triggers, application routines, generated columns, JSONB columns, extra application tables, extra application enum types, or application rows. These absences are intentional.

## Repository implementation authority

| Work                             | Authority after this review                |
| -------------------------------- | ------------------------------------------ |
| Repository implementation        | `AUTHORIZED`                               |
| Matrix-approved services         | `AUTHORIZED WITH SPRINT 2.23 RESTRICTIONS` |
| API implementation               | `NOT AUTHORIZED`                           |
| Seed execution                   | `NOT AUTHORIZED`                           |
| Additional migrations            | `NOT AUTHORIZED`                           |
| Controller or DTO implementation | `NOT AUTHORIZED`                           |
| Flutter implementation           | `NOT AUTHORIZED`                           |

The original baseline authority was limited to persistence repositories/adapters and their tests for the five foundation models. Sprint 2.23 supersedes only the application-service portion for its explicitly listed readiness matrix. It does not authorize public transport behavior, schema expansion, data insertion, or changes to approved product rules. Every implementation remains a separate, reviewable task.

## Repository starting assumptions

- Repository interfaces and adapters remain below application services, consistent with [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md) and the [Backend Architecture](../06-core-backend/backend-architecture.md).
- The applied schema and generated Prisma client are the persistence contract; repository work must not edit `schema.prisma` or the applied migration.
- UUIDs are application-generated UUIDv4 values. The database intentionally has no UUID-generating defaults or UUID extensions.
- API and application timestamps remain UTC. Repository mappings must preserve the approved database timestamp semantics.
- `lock_version` and `hierarchy_version` participate in approved optimistic-concurrency behavior; repositories must not silently bypass them.
- Taxonomy audit records are append-only. Correction links create a one-successor linear chain and do not authorize history deletion or mutation.
- Referential actions are restrictive/non-cascading. Repositories must surface conflicts through controlled persistence errors rather than delete dependent history.
- Normalized identity values are supplied by approved application logic and enforced by database uniqueness and `C` collation; the database does not generate normalized columns.
- No foundation reference data exists yet. Repository tests must use isolated test fixtures and must not execute the blocked seed proposal.
- Transaction ownership remains with future application services. A repository may expose the approved transaction-aware adapter contract but must not invent service workflows.

## Future migration policy

- Never rewrite or delete the applied `20260717_initial_foundation` migration.
- Every schema change requires a new, bounded migration after physical-design review, generated-SQL review, checksum capture, explicit execution authority, and environment-specific verification.
- Do not use `prisma db push`, `prisma db pull`, destructive reset commands, or manually executed ad hoc SQL to evolve shared environments.
- Preserve Prisma migration history and verify checksum integrity, status, catalogue shape, and live-to-schema drift before and after every authorized migration.
- PostgreSQL-only controls that Prisma cannot express remain explicit, named, reviewed migration SQL; they must not be silently dropped by a later migration.
- Use expand-migrate-contract for incompatible changes and preserve history-safe deletion, audit, and offline identifier rules.
- Development authorization does not imply staging or production authorization. Each target environment retains a separate deployment gate.

## Known deferred work

- Deterministic launch-language seed execution and all other application data insertion.
- Concrete repository implementation beyond the completed five foundation adapters.
- Application services beyond the completed taxonomy queries, controlled [Actor Principal provisioning](./ACTOR-PROVISIONING-SERVICE-REVIEW.md), and internal ordinary [Category](./CATEGORY-MUTATION-SERVICE-REVIEW.md) and [Topic](./TOPIC-MUTATION-SERVICE-REVIEW.md) mutation primitives, plus all controllers, DTOs, public APIs, and OpenAPI changes.
- Additional content, user, lesson, progress, download, synchronization, and editorial tables.
- Additional migrations and all staging or production deployment.
- Database privilege/grant implementation and production operations configuration.
- Authentication/RBAC mapping, anonymization mechanics, and final retention periods.
- Taxonomy normalization service behavior, cycle-safe move orchestration, Category hierarchy-version coordination, and automatic audit workflow orchestration.
- Flutter and all learner-facing implementation.

## Outcome

The first database foundation is verified, drift-free, empty, and frozen at the recorded checksums. Sprint 2.17 through Sprint 2.22 implemented all five repository adapters, and Sprint 2.24 through Sprint 2.29 add taxonomy queries, Actor provisioning, and internal ordinary Category/Topic mutation primitives without a baseline change or development-data insertion. The narrow Topic ordinary operation preserves Category, parent, and display order and does not authorize hierarchy mutation or Category hierarchy-version coordination; the future [Governed Topic Hierarchy Command](../04-architecture/governed-topic-hierarchy-command.md) remains blocked. Taxonomy-audit orchestration, authentication/authorization, and every other downstream authority listed above remain blocked or unimplemented.
