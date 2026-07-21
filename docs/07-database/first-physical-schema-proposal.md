# First Physical Schema Proposal

## Document control

| Item                 | Value                                                                                                |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Status               | Approved; Prisma schema reviewed; initial migration applied and verified in local development        |
| Scope                | Authoritative review proposal for the first PostgreSQL migration and later physical mappings         |
| Implementation state | Five-model Prisma schema and initial migration are live in development; application tables are empty |
| Authority            | Canonical Domain Model, ADR-012 through ADR-017, and Sprint 2 Persistence Implementation Decisions   |
| Review package       | [First Physical Schema Review](../reviews/FIRST-PHYSICAL-SCHEMA-REVIEW.md)                           |
| Migration gate       | [First Migration Readiness Checklist](../reviews/FIRST-MIGRATION-CHECKLIST.md)                       |
| Proposed             | 2026-07-17                                                                                           |

## Purpose and decision boundary

This document translates approved domain and architecture rules into a reviewable physical PostgreSQL proposal. It is not executable schema, Prisma syntax, migration SQL, or authorization to create database objects. Every name, type, action, constraint, and index remains proposed until the required human reviewers approve the package.

The proposal distinguishes three things:

1. the smallest foundation proposed for the first migration;
2. target physical tables proposed for bounded later migrations; and
3. unresolved Product, Security, Privacy, legal, or architecture choices that this document does not decide.

## Governing physical conventions

- PostgreSQL tables and columns use plural `snake_case` tables and singular `snake_case` columns.
- Aggregate, entity, audit, command, offline, and idempotency identities use application- or client-generated UUIDv4 stored as native `uuid`; no UUID extension or database default is proposed.
- Instants use `timestamptz` at microsecond database precision. Durations use non-negative `bigint` milliseconds. Audio offsets use non-negative `integer` milliseconds.
- Human sequence numbers, schema versions, position indexes, display orders, and lock versions use `integer` with explicit range checks. Counts that can grow without a small domain bound use `bigint`.
- Names, tags, URLs, checksums, reason codes, and identifiers use `text` unless a real domain maximum is approved. Arbitrary `varchar` limits are prohibited.
- SHA-256 values use canonical lower-case `sha256:` text with a format check. Raw binary digest storage is not proposed because packages and APIs exchange the canonical text form.
- Money and arbitrary precision decimals are not part of this schema. `numeric(4,2)` is proposed only for bounded accessibility font scale.
- Arrays and unbounded metadata columns are not proposed. Bounded JSONB exceptions are catalogued explicitly.
- A universal `deleted_at`, generic entity audit table, polymorphic foreign key without typed integrity, and destructive historical cascade are prohibited.
- Constraint and index names follow the deterministic patterns in the [Sprint 2 Persistence Implementation Decisions](../reviews/SPRINT-2-IMPLEMENTATION-DECISIONS.md#constraints-and-indexes).

## Migration scope

### Required in the first migration

The approved proposed first migration is the pseudonymous actor-and-taxonomy foundation only:

| Table                     | Why it is foundational                                                     |
| ------------------------- | -------------------------------------------------------------------------- |
| `actor_principals`        | Stable human/service/system audit identity without credentials or RBAC.    |
| `languages`               | Approved launch content-language reference data.                           |
| `categories`              | Authoritative top-level taxonomy aggregate with lifecycle and concurrency. |
| `topics`                  | Authoritative same-Category adjacency-list hierarchy.                      |
| `taxonomy_change_records` | Append-only evidence required for governed taxonomy mutation.              |

This five-table scope creates no learner account, preferences, Device association, credentials, authorization grants, content, publication, learner activity, sync, analytics, or privacy workflow. After the Sprint 2.9 supersession amendment, it contains 17 proposed non-primary indexes, eight foreign-key constraints, 26 check constraints, five non-primary-key unique constraints, and five primary-key constraints. Three of the 17 indexes are partial unique indexes rather than table constraints. The migration may not be created until every required human approval and later migration authorization in this package are complete.

### Deferred to later migrations

| Deferred boundary                       | Proposed tables                                                                                                                                               | Blocking dependency                                                                                                     |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Learner identity shells                 | `users`, `user_preferences`, `devices`                                                                                                                        | Authentication-provider mapping, account lifecycle, consent, safeguarding, Device ownership, and anonymization behavior |
| Direct identity and authentication      | `user_identity_profiles`, `authentication_identities`, `authentication_sessions`                                                                              | Authentication provider, recovery, consent, credential/session design, anonymization treatment                          |
| RBAC and administration                 | `actor_capability_assignments`                                                                                                                                | Final RBAC/capability mapping and administrator identity design                                                         |
| Localized taxonomy                      | `category_localizations`, `topic_localizations`                                                                                                               | Localization storage and fallback policy                                                                                |
| Lesson authoring and immutable content  | `lessons`, `lesson_variants`, `working_drafts`, `working_draft_blocks`, `lesson_revisions`, `lesson_content_blocks`, `reading_positions`                      | Approved bounded lesson-schema increment and tokenization rules                                                         |
| Audio, alignment, sources, and packages | `tutorial_audio_assets`, `tutorial_alignment_entries`, `content_sources`, `lesson_source_attributions`, `offline_package_manifests`, `offline_package_assets` | Storage/delivery, alignment generation, source-rights rubric, canonical manifest implementation                         |
| Editorial evidence                      | `review_submissions`, `review_decisions`, `publication_records`, `lesson_visibility_records`, `restricted_review_notes`                                       | Final capability mapping, note protection/retention, approved publication increment                                     |
| Reading and progress                    | `reading_sessions`, `reading_session_events`, `progress_events`, `user_progress`, `daily_streaks`                                                             | Player timing, timezone/streak, reconciliation, and retention decisions                                                 |
| Synchronization                         | `sync_receipts`, `sync_cursors`, `server_outbox_events`                                                                                                       | Cursor format/expiry, receipt retention, multi-device reconciliation, outbound delivery requirements                    |
| Privacy workflows                       | `account_deletion_requests`, `privacy_action_records`, `retention_holds`, `retention_hold_targets`, `anonymization_work_items`                                | Legal basis/periods, workflow owner, anonymization algorithm, hold policy                                               |
| Search, analytics, and reporting        | Purpose-built projections only after approval                                                                                                                 | Search semantics, analytics scope, measured workloads, reporting and deployment-provider choices                        |
| Future content generation               | No first-schema table proposed                                                                                                                                | Future workflow decision; Content Engine remains draft-only                                                             |

## Deferred learner identity-shell definitions

FPSD-001 defers the following three conceptual mappings to a later reviewed migration. They remain useful future design input but are not migration-one tables, constraints, indexes, or authorization. Authentication-provider mapping, account lifecycle, consent, safeguarding, Device ownership, and anonymization behavior must be sufficiently finalized before implementation review.

The following definitions are complete proposals for review. “Immutable” means an ordinary update is prohibited after insertion. Defaults are database defaults only where explicitly stated.

### `users`

**Responsibility:** stable non-identifying registered learner subject. **Aggregate/repository:** User aggregate / `UserRepository`.

| Column           | Type               | Null/default                  | Mutability and rule                                                                                                     |
| ---------------- | ------------------ | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `id`             | `uuid`             | required; no DB default       | Immutable application-generated UUIDv4 primary key.                                                                     |
| `account_state`  | constrained `text` | required; `active`            | Mutable only through explicit lifecycle commands. Proposed values: `active`, `restricted`, `deactivated`, `anonymized`. |
| `deactivated_at` | `timestamptz`      | nullable                      | Set when state first becomes `deactivated`; never cleared by ordinary update.                                           |
| `anonymized_at`  | `timestamptz`      | nullable                      | Set only by a later approved anonymization workflow.                                                                    |
| `lock_version`   | `integer`          | required; `1`                 | Positive optimistic concurrency token.                                                                                  |
| `created_at`     | `timestamptz`      | required; transaction `now()` | Immutable persistence creation time.                                                                                    |
| `updated_at`     | `timestamptz`      | required; transaction `now()` | Updated with successful current-state changes.                                                                          |

- Primary key: `pk__users` on `id`.
- Checks: positive `lock_version`; lifecycle timestamps consistent with state; `anonymized_at` cannot precede `deactivated_at` when both exist.
- No email, name, provider subject, password, token, role, analytics identifier, or device fingerprint is stored.
- Reading/activity tables later reference this stable subject with `RESTRICT`; direct identity data lives in deferred one-to-one tables.
- Expected repository update predicate is `id + lock_version`; conflict maps to the application concurrency response.

### `user_preferences`

**Responsibility:** one validated current preference set per User. **Aggregate/repository:** User aggregate / `UserRepository`.

| Column                  | Type               | Null/default                  | Mutability and rule                                                                           |
| ----------------------- | ------------------ | ----------------------------- | --------------------------------------------------------------------------------------------- |
| `user_id`               | `uuid`             | required                      | Immutable primary key and FK to `users.id`.                                                   |
| `interface_language_id` | `uuid`             | nullable                      | FK to `languages.id`; null means application fallback remains unresolved.                     |
| `content_language_id`   | `uuid`             | nullable                      | FK to `languages.id`; selected preferred lesson language.                                     |
| `pace_preset`           | constrained `text` | required; `medium`            | `easy`, `medium`, or `hard`; actual session WPM is still recorded separately.                 |
| `font_scale`            | `numeric(4,2)`     | required; `1.00`              | Proposed inclusive range `0.75` to `2.00`; accessibility review may widen it before approval. |
| `tutorial_autoplay`     | `boolean`          | required; `true`              | Preserves the approved tutorial-first default; replay remains independent.                    |
| `lock_version`          | `integer`          | required; `1`                 | Positive optimistic concurrency token.                                                        |
| `created_at`            | `timestamptz`      | required; transaction `now()` | Immutable.                                                                                    |
| `updated_at`            | `timestamptz`      | required; transaction `now()` | Mutable diagnostic timestamp.                                                                 |

- Primary key: `pk__user_preferences` on `user_id`; all foreign keys use `ON DELETE RESTRICT`, `ON UPDATE NO ACTION`.
- Checks enforce pace, font range, and positive version. No JSON preference bag is allowed.
- Preferences are personal profile data and are removed or treated under the later approved privacy workflow; they are never copied into immutable activity except the actual pace used.

### `devices`

**Responsibility:** stable pseudonymous registered installation association and synchronization authority state. **Aggregate/repository:** User aggregate for current association; Sync boundary for history.

| Column           | Type               | Null/default                  | Mutability and rule                                                  |
| ---------------- | ------------------ | ----------------------------- | -------------------------------------------------------------------- |
| `id`             | `uuid`             | required; no DB default       | Immutable server-issued/registered UUIDv4 primary key.               |
| `user_id`        | `uuid`             | required                      | Stable FK to `users.id`; reassignment to another User is prohibited. |
| `platform`       | constrained `text` | required                      | Proposed `android` or `ios`; not hardware identity.                  |
| `device_state`   | constrained `text` | required; `active`            | `active` or `deactivated`.                                           |
| `registered_at`  | `timestamptz`      | required                      | Immutable domain timestamp.                                          |
| `last_seen_at`   | `timestamptz`      | nullable                      | Operational current-state hint; not authorization or ordering proof. |
| `deactivated_at` | `timestamptz`      | nullable                      | Required when deactivated.                                           |
| `created_at`     | `timestamptz`      | required; transaction `now()` | Immutable persistence time.                                          |
| `updated_at`     | `timestamptz`      | required; transaction `now()` | Mutable diagnostic timestamp.                                        |

- Primary key: `pk__devices`; index `ix__devices__user_state` supports current association lookup.
- Checks enforce state/timestamp consistency and `last_seen_at >= registered_at` when present.
- No advertising ID, serial number, phone number, IP address, push token, or unrestricted user agent is proposed.
- Hard deletion and reassignment are prohibited once sync evidence exists. Later `sync_receipts.device_id` uses `RESTRICT`.

## First-migration table definitions

The following five definitions are the current migration-one proposal.

### `actor_principals`

**Responsibility:** stable non-secret identity for human administrators, service actors, and system processes referenced by append-only evidence. **Aggregate/repository:** security boundary; restricted editorial/taxonomy repositories consume it.

| Column       | Type               | Null/default                  | Mutability and rule                                        |
| ------------ | ------------------ | ----------------------------- | ---------------------------------------------------------- |
| `id`         | `uuid`             | required; no DB default       | Immutable UUIDv4 primary key.                              |
| `actor_kind` | constrained `text` | required                      | `administrative`, `service`, or `system`. Never `learner`. |
| `created_at` | `timestamptz`      | required; transaction `now()` | Immutable.                                                 |

- Primary key: `pk__actor_principals`; no name, email address, telephone number, username, unrestricted label, direct personal identifier, credential, role, permission, provider subject, access token, refresh token, or secret column.
- Checks enforce the narrow actor-kind set. FPSD-013 prohibits an unused actor lifecycle field or broad account-state enum.
- Historical evidence references this immutable pseudonymous identity with `RESTRICT`; future profile or access changes never rewrite or remove prior actions.
- RBAC/capability assignments and mutable human profiles remain deferred.
- Security classification: restricted pseudonymous audit identity, not anonymous data and not an identity directory. Ordinary learner, discovery, analytics, and operational-reader access is prohibited.
- Provisioning occurs only through a controlled backend service/repository and is idempotent under an approved command ID or stable internal operation. There is no public endpoint, arbitrary identity payload, runtime update, or runtime deletion. Future user/service linkage uses separate mapping structures and never replaces an existing audit actor UUID.

### `languages`

**Responsibility:** stable platform-managed lesson-content language reference. **Aggregate/repository:** reference data; taxonomy/content read repositories.

| Column               | Type          | Null/default                  | Mutability and rule                                                                                  |
| -------------------- | ------------- | ----------------------------- | ---------------------------------------------------------------------------------------------------- |
| `id`                 | `uuid`        | required; no DB default       | Immutable fixed UUIDv4 primary key.                                                                  |
| `bcp47_tag`          | `text`        | required                      | Canonical case-preserving BCP 47 tag; immutable after first use.                                     |
| `normalized_tag`     | `text`        | required                      | Application-produced deterministic tag key; unique under explicit PostgreSQL `"C"` collation.        |
| `iso_language_basis` | `text`        | required                      | Approved ISO basis: `eng`, `zul`, or `nso`; immutable after first use.                               |
| `canonical_name`     | `text`        | required                      | Product-approved display label, stored separately from its comparison value.                         |
| `normalized_name`    | `text`        | required                      | Application-produced comparison value; unique under explicit PostgreSQL `"C"` collation.             |
| `display_order`      | `integer`     | required                      | Non-negative deterministic display order; never identity.                                            |
| `is_content_enabled` | `boolean`     | required; `true`              | Controls new lesson-content availability, not historical validity or any audio/interface capability. |
| `retired_at`         | `timestamptz` | nullable                      | Retires new use without rewriting history.                                                           |
| `created_at`         | `timestamptz` | required; transaction `now()` | Immutable.                                                                                           |
| `updated_at`         | `timestamptz` | required; transaction `now()` | Changed only by an approved governance migration or seed amendment.                                  |

- Primary key: `pk__languages`; unique `uq__languages__normalized_tag` and `uq__languages__normalized_name`. `bcp47_tag`, `normalized_tag`, and `normalized_name` are validated together; the canonical label remains a display value and is not itself the uniqueness key.
- Checks require non-blank tags/names, non-negative order, and `is_content_enabled = false` when retired. The shared backend validator enforces the exact approved UUID/tag/ISO/name mapping and reports normalization collisions before any approved seed or migration amendment; database uniqueness remains the final concurrency safeguard.
- Migration-one Languages are governance-owned reference data. No public or administrator create/update/delete endpoint is authorized, and normal application credentials may not perform ad hoc mutation. A future change requires a reviewed governance decision, deterministic compatibility/collision validation, and an approved seed or migration amendment that preserves existing UUIDs. No Language lock/version field is required while runtime mutation remains prohibited.
- Tutorial-audio, text-to-speech, voice, interface-language, and per-language lesson-availability capability fields are excluded from migration one.
- Interface-language availability is intentionally not encoded until Product approves that separate launch coverage.
- Seed mapping is defined in [First Seed Data Proposal](./first-seed-data-proposal.md).
- Security classification: non-personal platform reference data; approved active rows may be learner-visible as content-language metadata.

### `categories`

**Responsibility:** authoritative language-neutral top-level taxonomy aggregate and hierarchy concurrency owner. **Aggregate/repository:** Category aggregate / `TaxonomyRepository`.

| Column                      | Type                                | Null/default                  | Mutability and rule                                                      |
| --------------------------- | ----------------------------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `id`                        | `uuid`                              | required; no DB default       | Immutable UUIDv4 primary key.                                            |
| `canonical_name`            | `text`                              | required                      | Current language-neutral Canonical Taxonomy Name.                        |
| `normalized_canonical_name` | `text`                              | required                      | Application-produced key using the approved NFKC/full-case-fold profile. |
| `lifecycle_state`           | proposed `taxonomy_lifecycle_state` | required; `ACTIVE`            | FPSD-013 conceptual values: `ACTIVE` or `ARCHIVED`.                      |
| `display_order`             | `integer`                           | required                      | Non-negative; ties resolve by UUID.                                      |
| `icon_key`                  | `text`                              | nullable                      | Presentation reference only; no URL or binary.                           |
| `lock_version`              | `integer`                           | required; `1`                 | Category metadata/lifecycle concurrency.                                 |
| `hierarchy_version`         | `integer`                           | required; `1`                 | Category-scoped Topic hierarchy concurrency.                             |
| `archived_at`               | `timestamptz`                       | nullable                      | Current archived-state timestamp.                                        |
| `created_at`                | `timestamptz`                       | required; transaction `now()` | Immutable.                                                               |
| `updated_at`                | `timestamptz`                       | required; transaction `now()` | Updated on successful mutation.                                          |

- Primary key: `pk__categories`; partial unique active normalized-name index; discovery/order index.
- Checks enforce non-blank names, non-negative order, positive versions, `archived_at` null for `ACTIVE`, and `archived_at` present for `ARCHIVED`.
- Archive increments `lock_version`; restoration returns to `ACTIVE`, clears `archived_at`, and revalidates normalized uniqueness and Effective Visibility.
- Archive/restore changes current state and appends `taxonomy_change_records`; it never mutates descendants.
- FPSD-005 approves NFKC, locale-independent full case folding, whitespace normalization, apostrophe/dash presentation canonicalization, meaningful punctuation/diacritic preservation, and rejection of controls, bidi overrides, zero-width, soft-hyphen, and default-ignorable characters. Display and comparison values remain separate; `citext` is prohibited.
- Automated TN-001 through TN-022 tests must prove deterministic equivalence, distinction, and rejection behavior across create, rename, reparent, import, and seed validation before `TaxonomyRepository` acceptance.
- Security classification: governed non-personal taxonomy metadata; only the `ACTIVE` eligible projection is learner-visible.

### `topics`

**Responsibility:** authoritative finite acyclic adjacency-list Topic hierarchy. **Aggregate/repository:** Topic under Category hierarchy / `TaxonomyRepository`.

| Column                      | Type                                | Null/default                  | Mutability and rule                                   |
| --------------------------- | ----------------------------------- | ----------------------------- | ----------------------------------------------------- |
| `id`                        | `uuid`                              | required; no DB default       | Immutable UUIDv4 primary key.                         |
| `category_id`               | `uuid`                              | required                      | Immutable Category ownership for MVP.                 |
| `parent_topic_id`           | `uuid`                              | nullable                      | Optional same-Category parent.                        |
| `canonical_name`            | `text`                              | required                      | Current Canonical Taxonomy Name.                      |
| `normalized_canonical_name` | `text`                              | required                      | Approved deterministic application normalization key. |
| `lifecycle_state`           | proposed `taxonomy_lifecycle_state` | required; `ACTIVE`            | FPSD-013 conceptual values: `ACTIVE` or `ARCHIVED`.   |
| `display_order`             | `integer`                           | required                      | Non-negative sibling order; UUID tie-breaker.         |
| `lock_version`              | `integer`                           | required; `1`                 | Topic metadata/lifecycle/hierarchy concurrency.       |
| `archived_at`               | `timestamptz`                       | nullable                      | Current archived-state timestamp.                     |
| `created_at`                | `timestamptz`                       | required; transaction `now()` | Immutable.                                            |
| `updated_at`                | `timestamptz`                       | required; transaction `now()` | Updated on successful mutation.                       |

- Primary key: `pk__topics`; additional unique `(category_id, id)` supports the composite self-FK `(category_id, parent_topic_id)` to `(category_id, id)`, enforcing same-Category parenthood.
- `parent_topic_id <> id` is declarative. Descendant-cycle prevention requires an application-owned transaction, recursive authoritative query, and Category hierarchy-version lock; no trigger is proposed for migration one.
- Two partial unique indexes enforce active sibling names: roots by `(category_id, normalized_canonical_name)` where parent is null, and children by `(category_id, parent_topic_id, normalized_canonical_name)` where parent is not null.
- Reparenting increments the Topic lock version and Category hierarchy version atomically, appends audit evidence, and never changes `category_id`.
- Archive increments `lock_version`. Restoration returns to `ACTIVE`, clears `archived_at`, and revalidates sibling uniqueness, parent validity, Category consistency, ancestor state, and Effective Visibility.
- An archived parent makes descendants effectively invisible without rewriting descendant lifecycle state. `DELETED` and withdrawal are not taxonomy lifecycle states.
- Security classification: governed non-personal taxonomy metadata; only effectively visible `ACTIVE` paths are learner-visible.

### `taxonomy_change_records`

**Responsibility:** restricted append-only evidence for Category and Topic commands. **Aggregate/repository:** taxonomy audit member / `TaxonomyRepository`, with restricted read repository for audit queries.

| Column                        | Type               | Null/default                  | Mutability and rule                                                                                                  |
| ----------------------------- | ------------------ | ----------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `id`                          | `uuid`             | required; no DB default       | Immutable audit-record UUIDv4.                                                                                       |
| `command_id`                  | `uuid`             | required                      | Immutable opaque UUIDv4 idempotency identity; globally unique and non-semantic.                                      |
| `actor_principal_id`          | `uuid`             | required                      | Stable server-derived actor FK.                                                                                      |
| `category_id`                 | `uuid`             | nullable                      | Category target when populated; null for every Topic-targeted record.                                                |
| `topic_id`                    | `uuid`             | nullable                      | Typed Topic target reference.                                                                                        |
| `operation`                   | constrained `text` | required                      | Approved Category/Topic create, update, reparent, archive, or restore operation.                                     |
| `reason_code`                 | `text`             | required                      | Bounded application-owned machine-readable code; never narrative or user input.                                      |
| `previous_lifecycle_state`    | constrained `text` | nullable                      | Lifecycle state before create/archive/restore when applicable.                                                       |
| `resulting_lifecycle_state`   | constrained `text` | nullable                      | Lifecycle state after create/archive/restore when applicable.                                                        |
| `previous_parent_topic_id`    | `uuid`             | nullable                      | Reparent evidence.                                                                                                   |
| `resulting_parent_topic_id`   | `uuid`             | nullable                      | Reparent evidence.                                                                                                   |
| `previous_version`            | `integer`          | nullable                      | Target lock version before mutation; null only for creation.                                                         |
| `resulting_version`           | `integer`          | required                      | Committed positive target lock version; `1` for creation.                                                            |
| `supersedes_change_record_id` | `uuid`             | nullable                      | Immutable restrictive self-FK to an earlier record; nullable unique constraint permits at most one direct successor. |
| `occurred_at`                 | `timestamptz`      | required                      | Immutable application event time.                                                                                    |
| `created_at`                  | `timestamptz`      | required; transaction `now()` | Immutable persistence receipt time.                                                                                  |

- Primary key: `pk__taxonomy_change_records`; unique `command_id` and nullable unique `supersedes_change_record_id`; all actor, target, parent, and supersession FKs use `ON DELETE RESTRICT` and `ON UPDATE NO ACTION`.
- Exactly one of `category_id` and `topic_id` is populated. Target type is derived from that FK; no `target_type` column exists. A Topic's Category owner is derived through `topics.category_id` and is not duplicated in this audit row.
- Every field is immutable after insertion. `id` is application-generated; `created_at` alone uses the transaction-time database default. All other required values are supplied by the owning transaction.
- Corrections append a row whose nullable `supersedes_change_record_id` references an earlier record. Every record references zero or one predecessor and, through `uq__taxonomy_change_records__supersedes`, has zero or one direct successor. A chain may contain any finite number of sequential corrections, but it cannot branch. The original remains unchanged and every predecessor link is immutable.
- PostgreSQL declaratively enforces the restrictive self-FK, nullable direct-successor uniqueness, self-supersession check, and ordinary row constraints. The nullable unique constraint is preferred over a partial unique index because PostgreSQL already permits multiple nulls, Prisma can represent ordinary optional-field uniqueness, and the backing unique index also supports successor lookup and FK-related history protection.
- The repository transaction validates that the predecessor is earlier, is the current terminal record, has the same effective Category/Topic target, and would not create a cycle. It inserts the correction and its audit evidence atomically. A stale or concurrent attempt against a predecessor that already gained a successor maps the unique conflict to one stable domain conflict; one concurrent correction succeeds and the other fails without branching or partial evidence. No recursive trigger, stored procedure, or new raw-query exception is approved.
- A correction chain is interpreted in append order: the terminal record is the latest correction, while every predecessor remains authoritative historical evidence. Readers may traverse backward from a terminal row through `supersedes_change_record_id` or forward through the unique successor lookup; missing links, multiple successors, cycles, or cross-target hops are invalid.
- The bounded reason-code registry is owned by the shared backend validation component. Unknown, retired-without-compatibility, user-provided, narrative, personal-data-bearing, or allegation-bearing values are rejected. No PostgreSQL reason-code enum is proposed.
- FPSD-007 prohibits narrative/free-text notes in migration one. Structured reason codes and transition/version evidence are the complete allowed audit payload. Any future narrative note requires a separately reviewed protected design.
- Security classification: restricted operational audit data and restricted pseudonymous governance evidence. It is unavailable to public APIs, learners, anonymous users, ordinary content reads, analytics, unrestricted logs, and the operational-reader role by default. Future audit exports or reads require an explicitly reviewed operational/governance authorization design.
- Migration one creates no automated deletion, expiry, or retention job. Audit evidence is preserved and physical deletion is prohibited while the legal/governance retention period remains pending. This is an interim preservation rule, not a claim of permanent retention; future policy must preserve correction/history relationships and cover backups and operational copies.

#### Audit operation and nullability matrix

All rows require `id`, `command_id`, `actor_principal_id`, exactly one target FK, `operation`, `reason_code`, `resulting_version`, `occurred_at`, and `created_at`. `supersedes_change_record_id` is optional for any correction but, when present, must name the same-target terminal predecessor and satisfy the linear-chain rules above.

| Operation          | Required target | Lifecycle fields                  | Parent fields                                | Version fields                            |
| ------------------ | --------------- | --------------------------------- | -------------------------------------------- | ----------------------------------------- |
| `category_create`  | Category        | previous null; resulting `ACTIVE` | both null                                    | previous null; resulting `1`              |
| `category_update`  | Category        | both null                         | both null                                    | previous required; resulting previous + 1 |
| `category_archive` | Category        | `ACTIVE` to `ARCHIVED`            | both null                                    | previous required; resulting previous + 1 |
| `category_restore` | Category        | `ARCHIVED` to `ACTIVE`            | both null                                    | previous required; resulting previous + 1 |
| `topic_create`     | Topic           | previous null; resulting `ACTIVE` | previous null; resulting nullable for a root | previous null; resulting `1`              |
| `topic_update`     | Topic           | both null                         | both null                                    | previous required; resulting previous + 1 |
| `topic_reparent`   | Topic           | both null                         | each nullable; values must be distinct       | previous required; resulting previous + 1 |
| `topic_archive`    | Topic           | `ACTIVE` to `ARCHIVED`            | both null                                    | previous required; resulting previous + 1 |
| `topic_restore`    | Topic           | `ARCHIVED` to `ACTIVE`            | both null                                    | previous required; resulting previous + 1 |

The target/operation, lifecycle, parent, and version applicability rules are proposed declarative checks. Terminal-predecessor validation, same-target correction, correction acyclicity, controlled reason-code membership, parent ownership, expected Category `hierarchy_version`, and affected Topic-version validation remain transaction/repository rules.

#### Required correction-chain tests

Future PostgreSQL repository integration tests must cover:

1. an original record with no correction and no successor;
2. one valid direct correction;
3. multiple valid sequential corrections forming one linear chain;
4. two attempted direct successors for the same predecessor, with the second receiving the stable conflict;
5. concurrent direct-correction attempts, with exactly one committed successor;
6. rejected self-supersession;
7. rejected cross-target supersession;
8. rejected direct or indirect cycle attempts;
9. a stale terminal-record assumption after another successor commits;
10. complete rollback on any validation or persistence failure;
11. atomic correction/audit insertion and preservation of the original; and
12. immutable predecessor linkage after insertion.

Tests must exercise both backward and forward chain retrieval, prove that no branch can be observed, and verify that database uniqueness errors translate to the approved stable conflict without exposing provider details. These are future implementation requirements only; no test or database artifact is created by this proposal.

## Deferred target table definitions

The following tables are proposed target mappings, not first-migration authorization. Their compact column grammar is normative for review:

- `?` means nullable; every unmarked column is required.
- An unqualified `id` or `*_id` is native `uuid`, application-generated for primary identities, with no database default.
- `*_at` is `timestamptz`; `*_date` is PostgreSQL `date`; `*_version`, order, index, sequence, and bounded counts are `integer`; durations/counts described as milliseconds or totals are `bigint`; flags are `boolean`; other named scalar codes, labels, URLs, checksums, states, and storage keys are `text`.
- No database default exists unless the row explicitly states one. Later mutable state rows start with `lock_version = 1`; immutable evidence rows have no lock version.
- Primary IDs, ownership FKs, original `created_at`, event times, checksums, sequence identities, and all append-only/Revision/package fields are immutable. Current state, lock version, `updated_at`, lifecycle timestamps, and explicitly described projections are mutable only through their owning application transaction.
- Every FK uses the action recorded in the complete matrix below. Every later bounded migration must expand its compact row into the same per-column review form used for the five current first-migration tables before implementation.

### Identity, access, and privacy

| Table                          | Responsibility, columns, and keys                                                                                                                                        | Lifecycle, privacy, repository, and deferral                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user_identity_profiles`       | One-to-one direct identity partition: `user_id uuid` PK/FK, approved name/email fields, `anonymized_at?`, `created_at`, `updated_at`. Provider credentials are excluded. | `UserRepository`; `RESTRICT` to User; removable/treatable independently. Exact fields, uniqueness, consent, and anonymization await Privacy and authentication review. |
| `authentication_identities`    | Provider association: app UUID PK, `user_id`, `provider_code`, `provider_subject`, state, created/deactivated timestamps; unique provider + subject.                     | Security-owned; no password/token columns. Provider selection, subject treatment, and deletion behavior unresolved.                                                    |
| `authentication_sessions`      | Refresh/session record with opaque hashed secret reference, User/Device FKs, expiry/revocation timestamps.                                                               | Security-owned temporary operational data; credential design and retention unresolved; never referenced by history.                                                    |
| `actor_capability_assignments` | App UUID PK, actor FK, capability code, validity timestamps, granting actor FK, created timestamp; unique active assignment.                                             | Authorization repository; RBAC mapping deferred. Historical evidence stores minimal authorization-at-action snapshot separately.                                       |
| `account_deletion_requests`    | App UUID PK, User FK, request state/code, requested/completed timestamps, policy version, lock version.                                                                  | Privacy workflow; no copied profile. Exact verification, cancellation, timeframe, and state set require approval.                                                      |
| `privacy_action_records`       | App UUID PK, typed User/actor/hold references, action type, policy version, reason/outcome codes, requested/started/completed timestamps, supersedes FK, retry state.    | Restricted append-only privacy evidence; no private activity or profile copy. Action set and retention unresolved.                                                     |
| `retention_holds`              | App UUID PK, hold reason/code, authority reference, placed/released timestamps, placing/releasing actor FKs, superseding evidence.                                       | Restricted append-only lifecycle; exact authority and retention policy unresolved.                                                                                     |
| `retention_hold_targets`       | App UUID PK and typed nullable User, Revision, Session, audit-record, or privacy-action FKs with exactly-one-target check.                                               | No generic polymorphic target is sufficient. Each target FK is `RESTRICT`; target coverage expands only with approved migrations.                                      |
| `anonymization_work_items`     | App UUID PK, User/action FKs, bounded workflow state, lease/retry timestamps, policy version, last safe error code.                                                      | Retryable orchestration state, not audit authority. Algorithm, owner, and retention unresolved.                                                                        |

### Localization and lesson content

| Table                        | Responsibility, columns, and keys                                                                                                                                                                                                           | Integrity, ownership, and deferral                                                                                                      |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `category_localizations`     | Composite PK `(category_id, language_id)`; `display_name`, `description?`, timestamps.                                                                                                                                                      | Taxonomy repository; `RESTRICT` FKs. Fallback and required-language policy unresolved.                                                  |
| `topic_localizations`        | Composite PK `(topic_id, language_id)`; `display_name`, `description?`, timestamps.                                                                                                                                                         | Taxonomy repository; `RESTRICT` FKs. Not a new Topic identity.                                                                          |
| `lessons`                    | App UUID PK; Topic FK, lifecycle state, stable internal label?, lock version, created/updated/archived timestamps.                                                                                                                          | `LessonRepository`; learner content excluded. Stable metadata set and taxonomy audit integration need bounded review.                   |
| `lesson_variants`            | App UUID PK; Lesson/Language FKs, proposed `lesson_difficulty`, lifecycle, `next_revision_number integer`, `current_published_revision_id?`, lock version, timestamps; unique `(lesson_id, language_id, difficulty)`.                       | `LessonRepository`; current Revision composite FK proves same Variant. Publication allocates positive revision atomically.              |
| `working_drafts`             | App UUID PK; Variant FK, workflow state, title, tokenization/alignment profile names and versions, content/source checksums, source Revision lineage?, lock version, created/updated/submitted/approved timestamps; one active per Variant. | Mutable Lesson aggregate member. No JSON content; exact state transition constraints and source lineage await lesson increment.         |
| `working_draft_blocks`       | App UUID PK; Draft FK, block type, block index, readable flag, exact display text; unique draft + index and draft + id.                                                                                                                     | Mutable draft-owned rows; explicit guarded purge only. They do not become immutable Revision rows in place.                             |
| `lesson_revisions`           | App UUID PK; Variant FK, positive revision number, title, word count, estimated reading seconds, profile names/versions, package checksum, package schema version, published timestamp; unique Variant + number and Variant + id.           | Immutable `LessonRepository` history. No `updated_at`; every package-relevant field immutable.                                          |
| `lesson_content_blocks`      | App UUID PK; Revision FK, block type, block index, readable flag, exact canonical display text; unique Revision + index and Revision + id.                                                                                                  | Immutable Revision member. Optional decorative JSON is rejected until a schema exists.                                                  |
| `reading_positions`          | App UUID PK; Revision FK, Block FK, zero-based position index, Reading Unit UUID, Unicode-scalar start/end offsets, canonical surface text, normalized comparison text; unique Revision + index/unit.                                       | Immutable Revision member. Composite FK proves block and position share Revision; contiguous coverage is publication-transaction logic. |
| `tutorial_audio_assets`      | App UUID PK; Revision/Language FKs, asset storage key, MIME type, duration/byte size, asset checksum, created timestamp; unique current tutorial asset per Revision.                                                                        | Immutable package member after publication. Storage key is not a temporary URL; provider selection deferred.                            |
| `tutorial_alignment_entries` | App UUID PK; Revision/audio FKs, alignment index, start/end milliseconds, start/end position indexes, confidence?, review state?; unique audio + index.                                                                                     | Immutable ordered mapping. Composite relationships prove same Revision; alignment generation/review semantics unresolved.               |
| `content_sources`            | App UUID PK; canonical source identifier, title, canonical URL/reference?, publisher?, licence label?, created/updated timestamps.                                                                                                          | Content/source repository. No arbitrary import metadata; rights taxonomy and sensitive raw evidence remain unresolved.                  |
| `lesson_source_attributions` | App UUID PK; Revision/Source FKs, attribution order/text, learner-visible flag, licence/permission label?, canonical reference?; unique Revision + Source + order.                                                                          | Immutable Revision use context; retained offline and never cascaded from Source.                                                        |
| `offline_package_manifests`  | App UUID PK; Revision FK unique, positive schema/min-reader versions, profile versions, package checksum unique per semantic package, byte size?, immutable canonical manifest JSONB?, generated timestamp.                                 | Derived immutable package snapshot owned by Lesson repository/package assembler. JSONB is optional and gated below.                     |
| `offline_package_assets`     | App UUID PK; Manifest FK, asset kind, deterministic relative path, MIME type, byte size, SHA-256 checksum, display order; unique manifest + path/order.                                                                                     | Immutable descriptors; binary bytes remain external. Temporary URLs are excluded.                                                       |

### Editorial workflow

| Table                       | Responsibility, columns, and keys                                                                                                                                                                      | Integrity, ownership, and deferral                                                                                     |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| `review_submissions`        | App UUID PK; Draft/Variant/submitter actor FKs, submitted draft version, content/source checksums, capability-policy version, submitted timestamp, supersedes?; unique applicable submission identity. | Append-only exact submitted state. `EditorialRepository` or Lesson boundary.                                           |
| `review_decisions`          | App UUID PK; Submission/reviewer actor FKs, decision, capability-policy version, self-approval exception code?, decided timestamp, supersedes?; one terminal Decision per Submission.                  | Append-only human decision; Service Actor prohibited by application transaction. Approval is not publication.          |
| `publication_records`       | App UUID PK; Revision/Submission/Decision/publisher actor FKs, matching checksums, policy version, published timestamp; unique Revision and command identity.                                          | Append-only, created atomically with Revision. Exactly one Publication Record per Revision.                            |
| `lesson_visibility_records` | App UUID PK; Revision/Publication/actor FKs, action (`withdrawn`, `restored`, `archived` as context permits), prior/resulting visibility, reason code, occurred timestamp, supersedes?.                | Append-only compensating visibility evidence; original publication and Revision remain unchanged.                      |
| `restricted_review_notes`   | App UUID PK; typed Submission/Decision FK, author actor FK, protected note text, created/superseded timestamps.                                                                                        | Restricted separate store; no learner API/package access or default full-text index. Retention/access policy required. |

Approvals are `review_decisions` with decision `approved`; a separate approval table would duplicate the same immutable fact. Withdrawals and archives are typed `lesson_visibility_records`; separate per-action tables are not justified.

### Reading activity, progress, and synchronization

| Table                    | Responsibility, columns, and keys                                                                                                                                                                                                                                                                     | Integrity, privacy, synchronization, and deferral                                                                                 |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `reading_sessions`       | Client UUID PK; nullable retained User link per approved anonymization mapping, exact Revision FK, package/profile versions, pace preset, actual WPM, phase/sync state, final position?, eligible units, practice elapsed milliseconds, created/started/completed/abandoned timestamps, lock version. | `ReadingSessionRepository`; exact Revision immutable. Tutorial cannot set completion. User link treatment needs Privacy approval. |
| `reading_session_events` | Client/event UUID PK; Session/Revision FKs, event type, non-negative sequence, position, elapsed milliseconds, client occurred/server received timestamps; unique Session + sequence where semantics require.                                                                                         | Append-only chronology; typed columns preferred over JSON. Tutorial and practice remain distinct.                                 |
| `progress_events`        | Client event UUID PK; User?/Session/Revision FKs, event type/schema version, sequence, actual WPM, position, elapsed, completion, occurred/received timestamps.                                                                                                                                       | Immutable sync/domain fact; identity linkage detachable only under approved policy.                                               |
| `user_progress`          | Composite/UUID identity with User + Lesson/Variant scope, completed count, total practice milliseconds, last Revision/event/time, lock version, updated timestamp; unique owner/resource scope.                                                                                                       | Rebuildable projection, not event authority. `ProgressEventRepository` does not treat it as history.                              |
| `daily_streaks`          | User PK/FK, timezone/policy version, current/longest days, last qualifying local date/event, lock version, updated timestamp.                                                                                                                                                                         | Rebuildable projection. Timezone and delayed-sync policy block implementation.                                                    |
| `sync_receipts`          | App UUID PK; stable User/Device/Event/Session/Revision FKs, event/schema/type, sequence, SHA-256 payload fingerprint, bounded immutable payload JSONB?, outcome/reason code, occurred/received/processed timestamps, domain result ID?; unique User scope + event ID.                                 | `SyncReceiptRepository`; append-only durable idempotency evidence. Mismatched fingerprint is rejected. Retention unresolved.      |
| `sync_cursors`           | App UUID PK; User/Device FKs, opaque cursor token or server sequence, issued/advanced/expired timestamps, lock version; unique cursor scope.                                                                                                                                                          | Cursor is opaque to clients. Format, expiry, reset, and change feed are unresolved.                                               |
| `server_outbox_events`   | App UUID PK; event kind, aggregate type/id, payload schema version, bounded JSONB payload, status, attempts, available/leased/published timestamps, unique domain event identity.                                                                                                                     | Only for approved server-to-external side effects. Not the mobile outbox; broker/delivery choice deferred.                        |

`sync_requests` are transport envelopes and are not persisted as authoritative tables. Request correlation belongs in minimized operational logs. Mobile `outbox_events` live in the future local mobile database, not PostgreSQL; this proposal therefore does not create a server table named `outbox_events`.

## Enum and closed-value strategy

| Value set                  | Proposed representation                                   | Reason and migration scope                                                                                                                            |
| -------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Account state              | Deferred constrained-text proposal                        | Deferred with `users` by FPSD-001; privacy workflow may add states before the learner identity migration.                                             |
| Taxonomy lifecycle         | Approved two-value enum; schema implementation authorized | Prisma/domain members `ACTIVE`/`ARCHIVED` map to PostgreSQL values `active`/`archived` under the approved naming convention; no other taxonomy state. |
| Lesson difficulty          | PostgreSQL enum later mapped from Prisma enum             | Stable approved `beginner`, `intermediate`, `advanced`; deferred with lesson tables.                                                                  |
| Working Draft state        | PostgreSQL enum                                           | Closed workflow set; deferred with authoring tables.                                                                                                  |
| Review decision/status     | PostgreSQL enum                                           | Closed append-only decision set; deferred with editorial tables.                                                                                      |
| Publication status         | No mutable status enum                                    | Publication is an immutable record; current visibility derives from typed visibility records.                                                         |
| Reading pace preset        | Constrained text plus actual integer WPM                  | Product presets are closed, but actual WPM is the historical fact. No seed table.                                                                     |
| Device platform            | Constrained text                                          | Small MVP set but likely to grow with supported clients.                                                                                              |
| Sync outcome               | Constrained text                                          | Contract outcomes may evolve by schema/API version; preserve reason code separately.                                                                  |
| Privacy action type        | Constrained text or policy-owned lookup after review      | Legal/privacy workflows may change; do not freeze before specialist approval.                                                                         |
| Source licence type        | Constrained text with learner-facing label                | Rights/permission categories are not stable enough for a DB enum; no administrator-managed lookup is approved yet.                                    |
| Reading/session event type | Constrained text plus positive schema version             | Versioned contract registry owns compatibility; no cross-version database enum.                                                                       |
| Content block type         | PostgreSQL enum                                           | Stable MVP closed set `heading`, `paragraph`, `callout`, `fact`, `quote`; deferred with lesson content.                                               |
| Role and permission        | Deferred capability reference data                        | Administrator-managed/security-owned values; no enum or seed until RBAC approval.                                                                     |

## Hierarchical taxonomy decision

| Strategy          | Assessment                                                                                                                                           |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Adjacency list    | Recommended for migration one. It is authoritative, minimal, supports unbounded finite depth, and maps directly to the approved parent rule.         |
| Closure table     | Deferred optimization. It speeds ancestor/descendant reads but adds transactional maintenance and should remain rebuildable, not mutation authority. |
| Materialized path | Deferred. Reparenting rewrites descendants and needs an approved path/collation representation.                                                      |
| Nested sets       | Rejected for the foundation because subtree mutation rewrites broad ranges and complicates optimistic concurrency.                                   |

The composite Topic self-FK enforces same-Category parenthood. FPSD-006 approves application-owned cycle prevention for migration one with mandatory conditions: all taxonomy writes pass through the repository/application-service boundary; direct application writes outside it are prohibited; production privileges are least-privilege; the mutation's Category row is locked first with the narrowly approved raw-query exception; the locked Category must match the command; expected Category `hierarchy_version` and affected Topic `lock_version` values are verified after the lock; self-parenting, ancestor cycles, and cross-Category parenting are rejected; sibling normalized-name uniqueness is revalidated; hierarchy/entity versions and structured `taxonomy_change_records` evidence commit atomically; and concurrent reparenting integration tests pass. No database trigger or hierarchy procedure is required. Unsupported direct database writes could still bypass multi-row cycle enforcement and are operationally prohibited. Effective visibility is calculated from own plus ancestor state; archiving never rewrites descendants. Restoration re-runs ancestor and uniqueness checks.

### Taxonomy raw-query locking exception

The only approved raw-query exception in migration one is the PostgreSQL Category-row locking primitive that Prisma's normal model API cannot express safely. It is governed as follows:

- raw-query code exists only inside the taxonomy persistence adapter and only inside a Prisma interactive transaction owned by the application service;
- values use parameter binding; string interpolation of values is prohibited;
- SQL identifiers are static, allow-listed by code, and independently code-reviewed;
- the query locks only the required Category row with the approved `FOR UPDATE` behavior and returns only the minimum identifier/version columns required for validation;
- the adapter verifies the locked Category matches the mutation, then validates expected hierarchy and affected Topic versions before traversal or mutation;
- ancestor inspection, cycle and same-Category checks, uniqueness revalidation, mutation, version increments, and audit append occur in that same transaction;
- controllers, general application services, other repositories, ad hoc tooling, diagnostics, and learner/content read paths may not invoke or expose raw SQL;
- database/provider failures are translated into stable persistence/domain errors; stale business versions are not treated as infrastructure retries;
- automatic retries are bounded and limited to recognized retryable transaction failures such as reviewed serialization/deadlock classes, using the same idempotent command identity; and
- observability records a correlation reference, operation class, attempt count, duration, and stable outcome/error code without SQL text, bound values, names, audit payloads, identity data, or unrestricted database errors.

Required integration evidence covers concurrent reparenting, stale Category and Topic versions, wrong-Category lock rejection, deadlock/recognized retry handling, retry exhaustion, rollback, uniqueness revalidation, and mutation/version/audit atomicity. This exception does not authorize unrestricted raw SQL or any executable query in this proposal.

## Lesson Revision immutability strategy

- Lesson is stable identity; Variant is the stable Language/Difficulty stream; Revision is the immutable published snapshot.
- Working Draft and Working Draft Blocks are mutable and separate from Revision rows. Publishing copies approved material into new immutable rows.
- Variant `next_revision_number` starts at `1`; the publication transaction locks/compares the Variant, allocates and increments the number, then inserts under unique `(lesson_variant_id, revision_number)`.
- A composite current-published FK proves that a Variant points only to one of its own Revisions. It is changed only in the same publication/visibility transaction.
- Revision title, content blocks, positions, profiles, word count, package/checksum inputs, audio/alignment, attributions, publication linkage, and publication timestamp never update after publication.
- Reading Sessions and sync evidence reference exact Revision UUIDs with `RESTRICT`.
- Withdrawal and archive append visibility evidence and change current discovery state; they do not mutate or delete Revision content or the original Publication Record.
- Corrections create a new Working Draft and Revision. No revision number is reused or consumed by draft saves.
- Database permissions and repository design should deny ordinary updates to immutable tables. Whether an additional trigger is warranted remains a later reviewed defense-in-depth decision; no trigger is approved here.

## JSONB boundary catalogue

| Proposed field                                 | Why relational columns are insufficient                                                                                                       | Maximum scope and schema version                                                                    | Validation/indexing                                                                                                    | Migration/privacy/compatibility                                                                                                                           |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `offline_package_manifests.canonical_manifest` | Optional byte-for-byte canonical derived snapshot aids deterministic delivery while authoritative identity/checksum fields remain relational. | One immutable manifest for one Revision; positive `package_schema_version`; proposed maximum 1 MiB. | Package assembler validates owned JSON Schema and checksum. No GIN index.                                              | Rebuildable from authoritative rows; new schema versions create new package material, never in-place reinterpretation. Contains public package data only. |
| `sync_receipts.event_payload`                  | Versioned event bodies differ while envelope/idempotency fields remain relational.                                                            | One immutable strict event object; positive `event_schema_version`; proposed maximum 64 KiB.        | Sync application validates shared JSON Schema before persistence. No GIN; named fields needed for queries are columns. | Retention and identity detachment require Privacy approval. Unsupported versions retain original evidence and return defined outcomes.                    |
| `server_outbox_events.payload`                 | External side-effect envelopes vary by event kind.                                                                                            | One immutable allow-listed event payload; positive schema version; proposed maximum 256 KiB.        | Owning publisher validates schema. Index relational status/time only.                                                  | Deferred until delivery architecture; excludes credentials and unrestricted learner data.                                                                 |

All three JSONB fields are deferred. No JSONB field is required in migration one. Generic metadata, free-form preferences, hidden foreign keys, unrestricted audit blobs, and provider diagnostics are rejected.

## Foreign-key action matrix

Unless a row states otherwise, `ON UPDATE` is `NO ACTION`. Archive, deactivation, withdrawal, and anonymization are stateful operations and do not invoke referential actions. This matrix catalogs both current and deferred relationships; a `yes` in **Required?** describes the relation when its table is implemented and does not move a deferred table into migration one.

The exact first-migration FK catalogue contains eight constraints:

| Child columns                                         | Referenced columns           | Required/nullability               | Delete/update action     |
| ----------------------------------------------------- | ---------------------------- | ---------------------------------- | ------------------------ |
| `topics.category_id`                                  | `categories.id`              | required                           | `RESTRICT` / `NO ACTION` |
| `topics(category_id, parent_topic_id)`                | `topics(category_id, id)`    | optional parent                    | `RESTRICT` / `NO ACTION` |
| `taxonomy_change_records.actor_principal_id`          | `actor_principals.id`        | required                           | `RESTRICT` / `NO ACTION` |
| `taxonomy_change_records.category_id`                 | `categories.id`              | nullable; exactly-one target check | `RESTRICT` / `NO ACTION` |
| `taxonomy_change_records.topic_id`                    | `topics.id`                  | nullable; exactly-one target check | `RESTRICT` / `NO ACTION` |
| `taxonomy_change_records.previous_parent_topic_id`    | `topics.id`                  | nullable by operation matrix       | `RESTRICT` / `NO ACTION` |
| `taxonomy_change_records.resulting_parent_topic_id`   | `topics.id`                  | nullable by operation matrix       | `RESTRICT` / `NO ACTION` |
| `taxonomy_change_records.supersedes_change_record_id` | `taxonomy_change_records.id` | nullable correction link           | `RESTRICT` / `NO ACTION` |

There is no audit FK from a Topic-targeted row to Category: Category ownership is derived through the target Topic. Same-target supersession and correction acyclicity are repository checks because a simple FK cannot prove them.

| Child relationship                                         | Required?                                | ON DELETE                       | Preservation/anonymization behavior                                                         |
| ---------------------------------------------------------- | ---------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------- |
| `user_preferences.user_id -> users.id`                     | yes                                      | `RESTRICT`                      | Explicit privacy workflow treats preferences before any permitted identity purge.           |
| preference Language FKs -> `languages.id`                  | no                                       | `RESTRICT`                      | Language retirement does not erase preferences/history.                                     |
| `devices.user_id -> users.id`                              | yes                                      | `RESTRICT`                      | Device deactivates; no reassignment or history cascade.                                     |
| taxonomy record actor -> `actor_principals.id`             | yes                                      | `RESTRICT`                      | Future actor profile/access treatment preserves evidence.                                   |
| taxonomy record Category/Topic/parent/supersession FKs     | typed/conditional                        | `RESTRICT`                      | Taxonomy and correction history are preserved; exactly one target FK is populated.          |
| `topics.category_id -> categories.id`                      | yes                                      | `RESTRICT`                      | Category archive never deletes Topics.                                                      |
| Topic composite parent -> Topic composite identity         | no                                       | `RESTRICT`                      | Reparent is explicit; parent deletion prohibited once referenced.                           |
| identity/auth/profile/session FKs -> User/Device           | yes                                      | `RESTRICT`                      | Treatment is explicit and policy-driven, not cascade.                                       |
| actor capability FKs -> actor principals                   | yes                                      | `RESTRICT`                      | Assignments revoke/expire; actor history survives.                                          |
| localization FKs -> taxonomy/Language                      | yes                                      | `RESTRICT`                      | Explicit cleanup only for approved never-used draft data.                                   |
| `lessons.topic_id -> topics.id`                            | yes                                      | `RESTRICT`                      | Reassignment/archive only.                                                                  |
| `lesson_variants.lesson_id/language_id`                    | yes                                      | `RESTRICT`                      | Variant archive preserves Revision history.                                                 |
| Working Draft -> Variant and Draft Blocks -> Draft         | yes                                      | `RESTRICT`                      | Guarded explicit purge may remove eligible draft helpers only after dependency/hold checks. |
| Revision -> Variant                                        | yes                                      | `RESTRICT`                      | Immutable historical relationship.                                                          |
| Variant current Revision composite FK                      | no                                       | `RESTRICT`, deferrable proposal | Cleared/switched only by governed transaction; Revision is not deleted.                     |
| Revision Block -> Revision                                 | yes                                      | `RESTRICT`                      | Immutable package material.                                                                 |
| Position composite Block/Revision FKs                      | yes                                      | `RESTRICT`                      | Exact Revision reconstruction preserved.                                                    |
| Audio/alignment -> Revision/Language/Position              | yes                                      | `RESTRICT`                      | Package and session interpretation preserved.                                               |
| Attribution -> Revision/Source                             | yes                                      | `RESTRICT`                      | Source retirement cannot erase published attribution.                                       |
| Manifest/assets -> Revision/Manifest                       | yes                                      | `RESTRICT`                      | Immutable package history; explicit never-published cleanup only.                           |
| Review Submission -> Draft/Variant/actor                   | yes                                      | `RESTRICT`                      | Exact submitted state and actor evidence retained.                                          |
| Review Decision -> Submission/actor                        | yes                                      | `RESTRICT`                      | Decision append-only.                                                                       |
| Publication -> Revision/Submission/Decision/actor          | yes                                      | `RESTRICT`                      | Publication history cannot be removed by actor/content lifecycle.                           |
| Visibility record -> Revision/Publication/actor            | yes                                      | `RESTRICT`                      | Compensating history retained.                                                              |
| Review Note -> Submission or Decision/actor                | conditional                              | `RESTRICT`                      | Restricted retention workflow; no cascade.                                                  |
| Reading Session -> User/Revision                           | policy-dependent User; Revision required | `RESTRICT`                      | User linkage may later detach through an approved mapping; Revision never detaches.         |
| Session Event -> Session/Revision                          | yes                                      | `RESTRICT`                      | Chronology survives lifecycle.                                                              |
| Progress Event -> User/Session/Revision                    | policy-dependent User; others required   | `RESTRICT`                      | No direct identifier; approved detachment only.                                             |
| Progress/Streak -> User                                    | yes                                      | `RESTRICT`                      | Rebuildable projections explicitly removed during privacy treatment if approved.            |
| Sync Receipt -> User/Device/Session/Revision               | yes                                      | `RESTRICT`                      | Receipt remains bounded idempotency evidence; late devices cannot reattach identity.        |
| Sync Cursor -> User/Device                                 | yes                                      | `RESTRICT`                      | Cursor expires/revokes explicitly.                                                          |
| Privacy request/action/hold FKs -> User/actor/typed target | typed/conditional                        | `RESTRICT`                      | Minimal evidence survives treatment; holds block purge.                                     |

No `CASCADE` is proposed. A future cascade may be considered only for a strictly owned, non-historical temporary helper after line-item review.

## Normalization and uniqueness catalogue

| Value                   | Scope and enforcement                                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Language tag            | Global unique `normalized_tag` under explicit `"C"` collation; BCP 47 validation in the shared backend validator and seed corpus.    |
| Language name           | Global unique `normalized_name` under explicit `"C"` collation; display `canonical_name` remains separate.                           |
| Category ID             | Global UUID primary key.                                                                                                             |
| Active Category name    | Global partial unique normalized key where lifecycle is active.                                                                      |
| Topic ID                | Global UUID primary key.                                                                                                             |
| Active root Topic name  | Per Category partial unique `(category_id, normalized_canonical_name)` where active and parent null.                                 |
| Active child Topic name | Per Category and Parent partial unique `(category_id, parent_topic_id, normalized_canonical_name)` where active and parent non-null. |
| Topic path/slug         | No stored path or slug in migration one; stable IDs and ancestry are authoritative.                                                  |
| Lesson ID               | Global UUID primary key. No global title/name uniqueness.                                                                            |
| Lesson Variant          | Unique per Lesson + Language + Difficulty across lifecycle.                                                                          |
| Revision number         | Unique and positive per Variant.                                                                                                     |
| Content Source          | Proposed global canonical source identifier; exact normalization awaits source-rights review.                                        |
| Attribution             | Unique per Revision + Source + display order; repeated contextual use requires distinct approved order/context.                      |
| Device identity         | Global UUID; no hardware-identifier uniqueness.                                                                                      |
| Event/idempotency ID    | Client UUID unique in authenticated User scope; payload fingerprint must match.                                                      |
| Sync cursor             | Unique opaque token/sequence within User + Device scope.                                                                             |
| User progress           | Unique User + resource scope selected by the projection.                                                                             |

Case-insensitive taxonomy/reference uniqueness uses stored application-generated normalized keys, not `citext`. Every normalized comparison column participating in equality or uniqueness uses explicit PostgreSQL `"C"` collation in the future physical migration for deterministic bytewise comparison. Display values remain ordinary Unicode text and are not used for linguistic ordering through these keys. Prisma cannot currently express every required column/index collation detail portably; any migration customization must be separately visible and approved before execution, without using runtime schema synchronization. FPSD-005 approves the [Taxonomy Normalization Decision](./taxonomy-normalization-decision.md): NFKC, locale-independent full case folding, trimming/whitespace collapse, apostrophe/dash presentation canonicalization, meaningful punctuation/diacritic preservation, and rejection of prohibited invisible/control characters. TN-001 through TN-022 must become executable automated tests before taxonomy repository acceptance and must exercise seed validation, Category/Topic create and rename, Topic reparent revalidation, imports, and future administration through one shared backend domain/application implementation. Repositories receive validated display and normalized values but still rely on database uniqueness as the concurrency safeguard.

## Index catalogue

| Proposed index                                    | Table and columns/order                                             | Unique/predicate                   | Workload or invariant                                | Write cost | First migration? |
| ------------------------------------------------- | ------------------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------- | ---------- | ---------------- |
| `uq__languages__normalized_tag`                   | `languages(normalized_tag)`                                         | unique                             | Tag identity                                         | low        | yes              |
| `uq__languages__normalized_name`                  | `languages(normalized_name)`                                        | unique                             | Canonical Language-name identity                     | low        | yes              |
| `ix__languages__content_order`                    | `languages(is_content_enabled, display_order, id)`                  | no                                 | Language selection                                   | low        | yes              |
| `ix__devices__user_state`                         | `devices(user_id, device_state, id)`                                | no                                 | Active Device authorization                          | medium     | later            |
| `uq__categories__active_name`                     | `categories(normalized_canonical_name)`                             | unique; active only                | Active global naming                                 | medium     | yes              |
| `ix__categories__discovery_order`                 | `categories(lifecycle_state, display_order, id)`                    | no                                 | Deterministic catalog                                | medium     | yes              |
| `uq__topics__category_identity`                   | `topics(category_id, id)`                                           | unique                             | Composite same-Category FK                           | medium     | yes              |
| `uq__topics__active_root_name`                    | `topics(category_id, normalized_canonical_name)`                    | unique; active and parent null     | Root sibling naming                                  | medium     | yes              |
| `uq__topics__active_child_name`                   | `topics(category_id, parent_topic_id, normalized_canonical_name)`   | unique; active and parent non-null | Child sibling naming                                 | medium     | yes              |
| `ix__topics__parent_order`                        | `topics(category_id, parent_topic_id, display_order, id)`           | no                                 | Child listing/traversal                              | medium     | yes              |
| `ix__topics__parent`                              | `topics(parent_topic_id)`                                           | no                                 | Recursive descendant traversal and delete protection | medium     | yes              |
| `uq__taxonomy_change_records__command_id`         | `taxonomy_change_records(command_id)`                               | unique                             | Retry idempotency                                    | medium     | yes              |
| `ix__taxonomy_change_records__category_time`      | `taxonomy_change_records(category_id, occurred_at DESC, id)`        | no                                 | Category audit chronology                            | medium     | yes              |
| `ix__taxonomy_change_records__topic_time`         | `taxonomy_change_records(topic_id, occurred_at DESC, id)`           | no                                 | Topic audit chronology                               | medium     | yes              |
| `ix__taxonomy_change_records__actor_time`         | `taxonomy_change_records(actor_principal_id, occurred_at DESC, id)` | no                                 | Restricted actor audit                               | medium     | yes              |
| `ix__taxonomy_change_records__previous_parent`    | `taxonomy_change_records(previous_parent_topic_id)`                 | no                                 | Parent history protection and FK checks              | medium     | yes              |
| `ix__taxonomy_change_records__resulting_parent`   | `taxonomy_change_records(resulting_parent_topic_id)`                | no                                 | Parent history protection and FK checks              | medium     | yes              |
| `uq__taxonomy_change_records__supersedes`         | `taxonomy_change_records(supersedes_change_record_id)`              | unique; multiple nulls allowed     | One direct successor and correction traversal        | medium     | yes              |
| `uq__lesson_variants__lesson_language_difficulty` | Variant scope columns                                               | unique                             | One stream per adaptation                            | medium     | later            |
| `uq__lesson_revisions__variant_number`            | `(lesson_variant_id, revision_number)`                              | unique                             | Atomic Revision numbering                            | medium     | later            |
| `ix__lesson_revisions__variant_history`           | `(lesson_variant_id, revision_number DESC)`                         | no                                 | Revision history                                     | medium     | later            |
| `ix__lessons__topic_state`                        | `(topic_id, lifecycle_state, id)`                                   | no                                 | Published discovery join                             | medium     | later            |
| `uq__working_drafts__active_variant`              | `(lesson_variant_id)`                                               | unique active predicate            | One active Draft                                     | medium     | later            |
| `uq__lesson_blocks__revision_order`               | `(lesson_revision_id, block_index)`                                 | unique                             | Deterministic package                                | high       | later            |
| `uq__reading_positions__revision_index`           | `(lesson_revision_id, position_index)`                              | unique                             | Position identity/order                              | high       | later            |
| `ix__reading_positions__block`                    | `(lesson_revision_id, content_block_id, position_index)`            | no                                 | Package reconstruction                               | high       | later            |
| `uq__publication_records__revision`               | `(lesson_revision_id)`                                              | unique                             | One publication fact                                 | low        | later            |
| `ix__review_submissions__queue`                   | `(current_status, submitted_at, id)`                                | no; open only if stable            | Editorial queue                                      | medium     | later            |
| `ix__lesson_visibility_records__revision_time`    | `(lesson_revision_id, occurred_at DESC, id)`                        | no                                 | Current/historical visibility                        | medium     | later            |
| `ix__reading_sessions__user_started`              | `(user_id, started_at DESC, id)`                                    | no                                 | Learner history                                      | high       | later            |
| `ix__reading_sessions__revision`                  | `(lesson_revision_id, started_at DESC, id)`                         | no                                 | Revision history/analytics                           | high       | later            |
| `uq__session_events__session_sequence`            | `(reading_session_id, sequence)`                                    | unique where required              | Event ordering/idempotency                           | high       | later            |
| `uq__progress_events__event_id`                   | `(id)` plus scoped receipt uniqueness                               | unique                             | Immutable event identity                             | high       | later            |
| `uq__user_progress__owner_resource`               | User + selected Lesson/Variant scope                                | unique                             | Projection identity                                  | medium     | later            |
| `uq__sync_receipts__user_event`                   | `(user_id, event_id)`                                               | unique                             | Server idempotency                                   | high       | later            |
| `ix__sync_receipts__device_received`              | `(device_id, received_at DESC, id)`                                 | no                                 | Device receipt history                               | high       | later            |
| `ix__server_outbox__work_queue`                   | `(status, available_at, id)`                                        | no; pending only                   | Worker leasing                                       | high       | later            |
| `ix__privacy_actions__target_time`                | Typed target + `requested_at DESC`                                  | no                                 | Restricted privacy chronology                        | medium     | later            |
| `ix__retention_hold_targets__active_target`       | Typed target columns                                                | no; active hold only               | Purge blocking                                       | medium     | later            |

The two parent-history FKs use separate leading-column indexes because either nullable FK must independently support restrictive deletion/history checks; a composite index would not support the second FK when the first is null or unconstrained. The nullable supersession unique constraint creates its own leading-column unique index, so a redundant non-unique supersession index is prohibited. The complete five-table proposal therefore still has 17 non-primary indexes: eight unique (including three partial unique indexes) and nine non-unique. No BRIN, GIN, trigram, full-text, covering, or speculative analytics index is proposed. Later performance indexes require named queries and query-plan evidence.

## Constraint catalogue

The finalized five-table migration contains 44 named table constraints: five primary keys, five non-primary-key unique constraints, eight foreign keys, and 26 checks. PostgreSQL creates one backing index for each non-primary unique constraint. Three additional uniqueness invariants are standalone partial unique indexes and are counted in the 17-index total rather than as PostgreSQL table constraints. The [First Migration SQL Review](../reviews/FIRST-MIGRATION-SQL-REVIEW.md) records the exact finalized SQL names and validation evidence.

| Table                     | Primary keys | Unique constraints | Foreign keys | Check constraints | Check catalogue                                                                                                                                                                      |
| ------------------------- | -----------: | -----------------: | -----------: | ----------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `actor_principals`        |            1 |                  0 |            0 |                 1 | actor kind                                                                                                                                                                           |
| `languages`               |            1 |                  2 |            0 |                 6 | non-blank tag; non-blank normalized tag; non-blank canonical name; non-blank normalized name; non-negative order; retirement/content consistency                                     |
| `categories`              |            1 |                  0 |            0 |                 6 | non-blank display name; non-blank normalized name; non-negative order; positive lock version; positive hierarchy version; lifecycle/timestamp consistency                            |
| `topics`                  |            1 |                  1 |            2 |                 6 | non-blank display name; non-blank normalized name; non-negative order; positive lock version; lifecycle/timestamp consistency; no self-parent                                        |
| `taxonomy_change_records` |            1 |                  2 |            6 |                 7 | exactly-one target; target/operation compatibility; reason-code shape; lifecycle applicability; parent applicability/change; version applicability/progression; no self-supersession |
| **Total**                 |        **5** |              **5** |        **8** |            **26** | **44 named constraints overall**                                                                                                                                                     |

| Rule                                                                      | Enforcement proposal                                                                                                                                                                                    |
| ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Positive/non-negative versions, counts, WPM, durations, positions, orders | PostgreSQL check constraints.                                                                                                                                                                           |
| Timestamp ordering and lifecycle timestamp consistency                    | PostgreSQL checks where row-local; application transaction where facts span rows.                                                                                                                       |
| Same-Category Topic parent                                                | Composite FK plus self-parent check.                                                                                                                                                                    |
| Audit target exclusivity and operation applicability                      | Exactly-one Category/Topic check plus the operation/nullability matrix; no stored `target_type`.                                                                                                        |
| Audit correction relationship                                             | Restrictive nullable self-FK, no-self check, nullable unique direct-successor constraint/index, and repository terminal/same-target/acyclic validation; MDR-XD-002 is resolved.                         |
| Language normalized identities                                            | Unique normalized tag and name under explicit `"C"` collation; shared validator owns mapping/collision checks.                                                                                          |
| Topic cycle freedom and subtree reparent safety                           | Approved application transaction, Category-first lock, recursive authoritative query, version checks, restricted writes, and mandatory concurrent tests; no trigger required.                           |
| Active root/child normalized uniqueness                                   | Two partial unique indexes.                                                                                                                                                                             |
| One Variant per Lesson/Language/Difficulty                                | Unique constraint.                                                                                                                                                                                      |
| Positive Variant-scoped Revision number                                   | Check plus unique constraint; allocation transaction.                                                                                                                                                   |
| One active Working Draft                                                  | Partial unique index plus workflow transaction.                                                                                                                                                         |
| Contiguous Block/Position/alignment order                                 | Publication application service validates complete sequence; adjacent-row continuity requires integration tests and possibly a deferred trigger.                                                        |
| Position span validity                                                    | Row check `start >= 0`, `end > start`; block-length and Unicode-scalar correctness validated by tokenizer/publication service.                                                                          |
| Tutorial cannot complete lesson                                           | Event-type/mode/completion row checks plus Reading Session application state machine.                                                                                                                   |
| Publication prerequisites                                                 | Application-owned transaction validates exact approved Submission/Decision/checksums and separation of duties.                                                                                          |
| One Publication per Revision                                              | Unique constraint.                                                                                                                                                                                      |
| Append-only editorial/taxonomy/privacy evidence                           | Table-specific privileges deny ordinary update/delete, repositories expose append/read only, and application design uses superseding evidence; optional defense-in-depth trigger requires later review. |
| Withdrawal/archive consistency                                            | Typed visibility record checks plus transaction updating current discovery reference.                                                                                                                   |
| Sync payload fingerprint reuse                                            | Unique scoped event key plus application comparison; immutable receipt.                                                                                                                                 |
| Same User/Device/session relationships                                    | Required FKs plus ingestion transaction authorization; cross-table ownership may use composite FKs when physical increment is reviewed.                                                                 |
| Retention Hold blocks purge                                               | Typed target FKs plus privacy application transaction; deferred constraint/trigger only if needed.                                                                                                      |

No exclusion constraint is currently justified. Deferrable composite constraints may be required for the Variant/current-Revision circular reference and must be reviewed in that migration.

## Optimistic concurrency mapping

| Entity/projection           | Token and behavior                                                                                                               | Conflict and retry                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| User                        | `integer lock_version`, starts `1`; compare/increment on account-state mutation.                                                 | Domain conflict; no silent retry.                                                                                                   |
| User Preferences            | `integer lock_version`, starts `1`; compare/increment on whole preference update.                                                | Reload and explicit user/application retry.                                                                                         |
| Device                      | No general version initially; activation/deactivation uses expected current state and idempotent command ID.                     | Conflict on incompatible terminal state.                                                                                            |
| Language                    | No migration-one runtime token; governance-owned rows change only through an approved migration/seed amendment preserving UUIDs. | Runtime mutation is prohibited; compatibility and collision validation precede every future controlled change.                      |
| Category                    | `integer lock_version`, starts `1`; metadata/lifecycle/order updates compare/increment.                                          | `412`/domain conflict; explicit reload.                                                                                             |
| Topic                       | `integer lock_version`, starts `1`, plus Category `hierarchy_version` for hierarchy writes.                                      | Entire reparent transaction retries only for bounded serialization/deadlock with same command ID; stale business version conflicts. |
| Lesson                      | Proposed `integer lock_version` for Topic reassignment/stable metadata.                                                          | Explicit conflict; no generic retry.                                                                                                |
| Lesson Variant              | `lock_version` plus locked `next_revision_number`; publication atomically increments.                                            | Losing publication conflicts; number allocation rolls back.                                                                         |
| Working Draft               | Required `lock_version`, starts `1`; every material save/transition increments.                                                  | Stale edit returns precondition/conflict.                                                                                           |
| Editorial immutable records | No version; command ID and uniqueness provide idempotency.                                                                       | Duplicate returns prior result or conflicts if payload differs.                                                                     |
| Reading Session             | Proposed version only for server-side current phase aggregation; immutable event ingestion primarily uses sequence/idempotency.  | Preserve valid late evidence; reconciliation policy pending.                                                                        |
| User Progress               | `lock_version` for projection update/rebuild swap.                                                                               | Application-owned event transaction retries bounded infrastructure conflicts.                                                       |
| Sync Cursor                 | `lock_version` for monotonic cursor advance after safe response application.                                                     | Stale cursor follows defined resync path; never deletes outbox data.                                                                |

## Audit and temporal history

| History type            | Representation                                                                                                |
| ----------------------- | ------------------------------------------------------------------------------------------------------------- |
| Published content       | Immutable Lesson Revision, blocks, positions, assets, attributions, package material.                         |
| Editorial history       | Immutable Submissions, Decisions, Publication Records, visibility records, and restricted notes.              |
| Taxonomy history        | First-migration `taxonomy_change_records`; current Category/Topic rows remain mutable with versions.          |
| Reading history         | Reading Session plus append-only Session/Progress Events.                                                     |
| Synchronization history | Immutable Sync Receipts and original payload fingerprint/outcome.                                             |
| Privacy history         | Minimal append-only Privacy Action Records, holds, and typed target links after policy approval.              |
| Current projections     | User Progress, Daily Streak, discovery/current-publication references; rebuildable and not history authority. |

Database auditing in migration one is application-owned and transactionally persisted through typed taxonomy evidence. No universal audit table or trigger-owned audit system is proposed. FPSD-006 requires no cycle-prevention trigger; FPSD-014 approves the conceptual least-privilege and repository-only boundary, whose roles, grants, and tests remain unimplemented.

## Repository ownership summary

- `UserRepository`: `users`, `user_preferences`, current `devices`, and later direct identity treatment operations.
- Controlled actor provisioning service/repository: idempotent creation/read of immutable `actor_principals`; no public endpoint, label, direct identifier, provider subject, update, or delete. Future user/service linkage uses separate mappings and never replaces audit actor IDs.
- `TaxonomyRepository`: `languages` read access, `categories`, `topics`, and taxonomy mutation evidence. Language writes are migration/governance-only; the taxonomy persistence adapter alone owns the reviewed row-locking raw-query exception.
- `LessonRepository`: Lessons, Variants, Drafts, immutable Revisions, package material, and source attribution.
- Focused `EditorialRepository` or Lesson boundary: review/publication/visibility evidence within shared publication transactions.
- `ReadingSessionRepository`: Sessions and Session Events.
- `ProgressEventRepository`: immutable Progress Events; separate read repository for projections.
- `SyncReceiptRepository`: receipt duplicate detection/outcomes and cursor coordination.
- Restricted Privacy repository: requests, actions, holds, and anonymization workflow state.

No repository is proposed merely because a table exists, and no interface may expose Prisma-generated types.

## Ambiguities and unresolved decisions

The supplied FPSD and Sprint 2.8/Sprint 2.9 multidisciplinary decisions are closed. The proposal still leaves these as reviewer checks or later-migration gates:

1. All five named human approvals of the proposed types, keys, constraints, indexes, foreign-key actions, raw-query exception, and Sprint 2.9 amendment verification.
2. Interface-language launch coverage and localization fallback/storage; migration one intentionally represents neither.
3. Authentication provider, account lifecycle, credentials, recovery, session storage, consent, safeguarding, Device ownership, and anonymization behavior for the deferred learner identity migration.
4. Final RBAC/capability codes, administrator profile treatment, and production self-approval exception policy.
5. Physical direct-identity fields, anonymization algorithm/effectiveness, deletion timing, final retention periods, holds, backup expiry, and Privacy owner.
6. Exact lesson stable metadata, tokenization corpora, alignment generation/review, object storage, package transport, source-rights taxonomy, and canonical JSON implementation.
7. Reading interruption/timing rules, streak timezone/delayed-sync behavior, repeated attempts, and multi-device reconciliation.
8. Sync cursor format/expiry/reset, receipt retention, batch limits, and server change-feed scope.

## Consistency audit

| Authority                           | Proposal alignment                                                                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-012                             | Prisma/PostgreSQL remains infrastructure-only; repositories follow aggregates, application services own transactions, and runtime schema synchronization is prohibited.                           |
| ADR-013                             | Lesson/Variant/Draft/Revision identities remain distinct; one Draft, Variant-scoped allocation, current-published reference, and immutable Revisions are preserved.                               |
| ADR-014                             | Blocks, positions, audio alignment, attribution, profiles, and package checksums are relational or narrowly controlled hybrid data and remain exact-Revision material.                            |
| ADR-015                             | Administrative/Service principals remain distinct; Submissions, Decisions, Publications, visibility evidence, and notes are typed and append-only.                                                |
| ADR-016                             | Category-owned adjacency hierarchy, active sibling uniqueness, same-Category movement, Effective Visibility, restoration, locking, and audit evidence are preserved.                              |
| ADR-017                             | Identity/activity separation, explicit lifecycle operations, typed privacy/hold evidence, detachable identity, and the prohibition on destructive historical cascade are preserved.               |
| Canonical Domain Model and Glossary | Proposed tables map canonical concepts without promoting Guest Session, Sync Request, Approval Evidence, or Package artifacts into incorrect aggregates.                                          |
| Product Decision Log                | Guest restrictions, launch Languages, pace presets, tutorial/practice separation, registered downloads/sync, simple streaks, and published-only visibility are unchanged.                         |
| API and sync contracts              | UUID, UTC, exact Revision identity, event schema/sequence, payload fingerprint, partial outcome, and cursor opacity are retained.                                                                 |
| Offline package                     | The deferred package mapping contains immutable content, profiles, audio/alignment, attribution, and checksums while excluding identity, progress, credentials, device state, and temporary URLs. |
| Data Protection and Privacy         | Direct identity is minimized/separated; device metadata is pseudonymous; policy-dependent treatment remains explicitly unresolved.                                                                |

No stale design-decision contradiction remains among these authorities after the Sprint 2.9 amendment verification. MDR-XD-002 is resolved. The remaining later-scope items above, including the final audit-retention schedule, are explicit gates rather than silently selected defaults.

## Review decision

This proposal is **approved** by all five required perspectives as recorded in the [First Physical Schema Approval](../reviews/FIRST-PHYSICAL-SCHEMA-APPROVAL.md). The exact five-table Prisma schema is implemented and reviewed, and the initial migration SQL was finalized in the [First Migration SQL Review](../reviews/FIRST-MIGRATION-SQL-REVIEW.md). Sprint 2.15 recorded [human development-execution approval](../reviews/FIRST-MIGRATION-EXECUTION-APPROVAL.md), applied the migration once with Prisma, and passed the [post-migration verification](../reviews/FIRST-MIGRATION-EXECUTION-REPORT.md). Sprint 2.16 froze the empty, drift-free [Foundation Baseline](../reviews/FOUNDATION-BASELINE.md) and authorized repository implementation within this five-model scope. Seeds, APIs, services, additional migrations, staging/production deployment, and Flutter work remain separately blocked.
