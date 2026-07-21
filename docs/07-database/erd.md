# Prolific Conceptual Entity-Relationship Model

## Document control

| Item          | Value                                                               |
| ------------- | ------------------------------------------------------------------- |
| Status        | Draft for Architecture Gate Review; not a physical schema           |
| Owner         | TBD                                                                 |
| Review date   | YYYY-MM-DD                                                          |
| Domain source | [Canonical Domain Model](../architecture/canonical-domain-model.md) |
| Terminology   | [Domain Glossary](../02-requirements/domain-glossary.md)            |

## Purpose

This conceptual ERD shows persistence candidates and cardinalities derived from the canonical domain model. It does not approve table names, column types, indexes, normalization, partitions, ORM mappings, migrations, or SQL. Conceptual attribute types exist only to make identities and relationships legible.

## Conceptual ERD

```mermaid
erDiagram
    USERS ||--o{ DEVICES : associates
    USERS o|--o{ READING_SESSIONS : current_or_detached_owner
    USERS ||--o| USER_PROGRESS : summarizes
    ADMINISTRATIVE_ACTORS ||--o{ REVIEW_SUBMISSIONS : submits
    ADMINISTRATIVE_ACTORS ||--o{ REVIEW_DECISIONS : decides
    ADMINISTRATIVE_ACTORS ||--o{ PUBLICATION_RECORDS : publishes
    ADMINISTRATIVE_ACTORS ||--o{ VISIBILITY_RECORDS : changes_visibility
    SERVICE_ACTORS ||--o{ WORKING_DRAFTS : imports
    LANGUAGES ||--o{ LESSON_VARIANTS : classifies
    CATEGORIES ||--o{ TOPICS : contains
    TOPICS o|--o{ TOPICS : parents
    TOPICS ||--o{ LESSONS : organizes
    LESSONS ||--o{ LESSON_VARIANTS : adapts
    LESSON_VARIANTS ||--o| WORKING_DRAFTS : edits
    LESSON_VARIANTS ||--o{ LESSON_REVISIONS : publishes
    LESSON_VARIANTS ||--o| LESSON_REVISIONS : current_revision
    LESSON_REVISIONS ||--|{ CONTENT_BLOCKS : contains
    CONTENT_BLOCKS ||--o{ READING_POSITIONS : yields
    LESSON_REVISIONS ||--o| TUTORIAL_AUDIO : guides
    TUTORIAL_AUDIO ||--o{ AUDIO_ALIGNMENT_ENTRIES : aligns
    LESSON_REVISIONS ||--|{ LESSON_SOURCES : attributes
    SOURCES ||--o{ LESSON_SOURCES : cited_by
    WORKING_DRAFTS ||--o{ REVIEW_SUBMISSIONS : submitted_as
    REVIEW_SUBMISSIONS ||--o{ REVIEW_DECISIONS : decided_by
    REVIEW_DECISIONS ||--o| PUBLICATION_RECORDS : authorizes
    LESSON_REVISIONS ||--|| PUBLICATION_RECORDS : created_with
    LESSON_VARIANTS ||--o{ VISIBILITY_RECORDS : visibility_history
    LESSON_REVISIONS ||--o{ READING_SESSIONS : used_by
    READING_SESSIONS ||--o{ READING_SESSION_EVENTS : records
    READING_SESSIONS ||--o{ PROGRESS_EVENTS : produces
    USERS o|--o{ PROGRESS_EVENTS : current_or_detached_owner
    PROGRESS_EVENTS ||--o| SYNC_RECEIPTS : acknowledged_by
    USERS o|--o{ PRIVACY_ACTION_RECORDS : privacy_subject
    ADMINISTRATIVE_ACTORS o|--o{ PRIVACY_ACTION_RECORDS : performs

    USERS {
        uuid user_id
        string account_state
        instant created_at_utc
    }

    PRIVACY_ACTION_RECORDS {
        uuid privacy_action_id
        string action_type
        string target_data_class
        string internal_subject_ref
        string outcome
        string policy_version
        string retention_hold_ref
        string acting_actor_ref
        instant requested_at_utc
        instant completed_at_utc
    }

    ADMINISTRATIVE_ACTORS {
        uuid administrative_actor_id
        string actor_state
        instant created_at_utc
    }

    SERVICE_ACTORS {
        uuid service_actor_id
        string service_kind
        string actor_state
    }

    DEVICES {
        uuid device_id
        uuid user_id
        string pseudonymous_installation_ref
    }

    LANGUAGES {
        string language_tag
        string canonical_name
        boolean active_for_content
    }

    CATEGORIES {
        uuid category_id
        string canonical_name
        string lifecycle_state
        int display_order
        instant created_at_utc
        instant updated_at_utc
    }

    TOPICS {
        uuid topic_id
        uuid category_id
        uuid parent_topic_id
        string canonical_name
        string lifecycle_state
        int display_order
        instant created_at_utc
        instant updated_at_utc
    }

    LESSONS {
        uuid lesson_id
        uuid topic_id
        instant created_at_utc
    }

    LESSON_VARIANTS {
        uuid lesson_variant_id
        uuid lesson_id
        string language_tag
        string difficulty
        string variant_state
        uuid current_published_revision_id
    }

    WORKING_DRAFTS {
        uuid working_draft_id
        uuid lesson_variant_id
        string workflow_state
        string concurrency_token
        string created_by_actor_ref
        string last_modified_by_actor_ref
        string ingestion_origin
        uuid current_review_submission_id
    }

    LESSON_REVISIONS {
        uuid lesson_revision_id
        uuid lesson_variant_id
        int revision_number
        int package_schema_version
        string tokenization_profile
        int tokenization_profile_version
        string package_checksum
        instant published_at_utc
    }

    CONTENT_BLOCKS {
        uuid content_block_id
        uuid lesson_revision_id
        int block_order
        string block_type
        boolean readable
        string canonical_display_text
    }

    READING_POSITIONS {
        uuid reading_position_id
        uuid content_block_id
        int position_index
        string reading_unit_id
        int display_span_start
        int display_span_end
        string normalized_comparison_text
    }

    TUTORIAL_AUDIO {
        uuid tutorial_audio_id
        uuid lesson_revision_id
        string language_tag
        string asset_reference
        string asset_checksum
        string alignment_profile
        int alignment_profile_version
    }

    AUDIO_ALIGNMENT_ENTRIES {
        uuid alignment_entry_id
        uuid tutorial_audio_id
        int position_index
        int start_milliseconds
        int end_milliseconds
    }

    SOURCES {
        uuid source_id
        string source_kind
        string canonical_reference
    }

    LESSON_SOURCES {
        uuid lesson_source_id
        uuid lesson_revision_id
        uuid source_id
        string attribution_text
    }

    REVIEW_SUBMISSIONS {
        uuid review_submission_id
        uuid working_draft_id
        uuid lesson_variant_id
        string submitted_by_actor_ref
        string submitted_version_token
        string submitted_content_checksum
        string source_attribution_checksum
        instant submitted_at_utc
        string submission_status
    }

    REVIEW_DECISIONS {
        uuid review_decision_id
        uuid review_submission_id
        uuid reviewer_actor_id
        string decision_type
        string reviewed_content_checksum
        instant decided_at_utc
    }

    PUBLICATION_RECORDS {
        uuid publication_record_id
        uuid lesson_revision_id
        uuid review_submission_id
        uuid approving_review_decision_id
        uuid publishing_actor_id
        string package_checksum
        string content_checksum
        instant published_at_utc
    }

    VISIBILITY_RECORDS {
        uuid visibility_record_id
        uuid lesson_variant_id
        uuid lesson_revision_id
        string actor_ref
        string action_type
        string prior_state
        string resulting_state
        instant occurred_at_utc
    }

    READING_SESSIONS {
        uuid reading_session_id
        uuid nullable_user_id
        string pseudonymous_subject_ref
        uuid lesson_revision_id
        string learning_phase
        string pace_preset
        int actual_wpm
        int package_schema_version
        string tokenization_profile
        int tokenization_profile_version
        int final_position_index
        boolean completed
    }

    READING_SESSION_EVENTS {
        uuid session_event_id
        uuid reading_session_id
        string event_type
        int position_index
        instant occurred_at_utc
    }

    PROGRESS_EVENTS {
        uuid progress_event_id
        uuid reading_session_id
        uuid user_id
        string schema_version
        instant occurred_at_utc
    }

    USER_PROGRESS {
        uuid user_id
        int lessons_completed
        int total_practice_milliseconds
        int total_words_read
        int current_streak
        int longest_streak
    }

    SYNC_RECEIPTS {
        uuid progress_event_id
        string payload_fingerprint
        string outcome
        instant acknowledged_at_utc
    }
```

## Proposed physical design

The conceptual diagram above remains the domain authority. The physical diagrams below are review proposals only. They do not represent current PostgreSQL objects or Prisma models. Full columns, actions, constraints, indexes, and deferrals are defined in the [First Physical Schema Proposal](./first-physical-schema-proposal.md).

### Proposed first-migration foundation

```mermaid
erDiagram
    CATEGORIES ||--o{ TOPICS : "owns"
    TOPICS o|--o{ TOPICS : "same-category parent"
    ACTOR_PRINCIPALS ||--o{ TAXONOMY_CHANGE_RECORDS : "performs"
    CATEGORIES ||--o{ TAXONOMY_CHANGE_RECORDS : "category evidence"
    TOPICS ||--o{ TAXONOMY_CHANGE_RECORDS : "topic evidence"
    TAXONOMY_CHANGE_RECORDS o|--o| TAXONOMY_CHANGE_RECORDS : "linear correction successor"

    ACTOR_PRINCIPALS {
        uuid id PK
        text actor_kind
        timestamptz created_at
    }
    LANGUAGES {
        uuid id PK
        text bcp47_tag
        text normalized_tag UK
        text iso_language_basis
        text canonical_name
        text normalized_name UK
        boolean is_content_enabled
    }
    CATEGORIES {
        uuid id PK
        text normalized_canonical_name
        text lifecycle_state
        integer lock_version
        integer hierarchy_version
    }
    TOPICS {
        uuid id PK
        uuid category_id FK
        uuid parent_topic_id FK
        text normalized_canonical_name
        text lifecycle_state
        integer lock_version
    }
    TAXONOMY_CHANGE_RECORDS {
        uuid id PK
        uuid command_id UK
        uuid actor_principal_id FK
        uuid category_id FK
        uuid topic_id FK
        text operation
        text reason_code
        text previous_lifecycle_state
        text resulting_lifecycle_state
        uuid previous_parent_topic_id FK
        uuid resulting_parent_topic_id FK
        integer previous_version
        integer resulting_version
        uuid supersedes_change_record_id FK, UK
        timestamptz occurred_at
        timestamptz created_at
    }
```

The Topic parent relationship is an adjacency list. A composite `(category_id, parent_topic_id)` foreign key enforces same-Category parenthood. Exactly one audit target FK is populated; target type is derived and no `target_type` is stored. The three audit Topic-parent/supersession references are restrictive and indexed. A nullable unique constraint on `supersedes_change_record_id` gives every record at most one direct successor, so corrections form a sequential same-target chain rather than a branch; repository logic validates the terminal predecessor and acyclicity atomically. FPSD-006 approves application-owned cycle prevention with repository-only writes, least-privilege database access, the narrowly governed taxonomy-adapter Category-row lock, hierarchy/Topic version checks, atomic audit/version changes, revalidation, and concurrent reparent tests. No trigger, closure, materialized-path, or nested-set table is required in migration one.

### Deferred learner identity shell

```mermaid
flowchart LR
    U["users"] --> P["user_preferences"]
    U --> D["devices"]
```

FPSD-001 defers all three tables until authentication, account lifecycle, consent, safeguarding, device ownership, and anonymization policy are resolved. They are conceptual extension points, not migration-one objects.

### Deferred lesson, editorial, and package tables

```mermaid
flowchart LR
    T["topics"] --> L["lessons"]
    L --> V["lesson_variants"]
    V --> D["working_drafts + working_draft_blocks"]
    D --> S["review_submissions"]
    S --> Q["review_decisions"]
    Q --> P["publication_records"]
    P --> R["lesson_revisions"]
    R --> B["lesson_content_blocks + reading_positions"]
    R --> A["tutorial_audio_assets + alignment_entries"]
    R --> C["content_sources + attributions"]
    R --> M["offline_package_manifests + assets"]
    R --> W["lesson_visibility_records"]
```

All nodes in this diagram are deferred. Publication atomically creates one immutable Revision and Publication Record from one exact approved unchanged Submission/Decision. Approval alone is not visibility, and withdrawal/archive never mutates Revision material.

### Deferred activity, synchronization, and privacy tables

```mermaid
flowchart LR
    U["users"] --> RS["reading_sessions"]
    REV["lesson_revisions"] --> RS
    RS --> RSE["reading_session_events"]
    RS --> PE["progress_events"]
    PE --> UP["user_progress projection"]
    PE --> DS["daily_streaks projection"]
    PE --> SR["sync_receipts"]
    DEV["devices"] --> SR
    U --> SC["sync_cursors"]
    U --> DR["account_deletion_requests"]
    DR --> PA["privacy_action_records"]
    RH["retention_holds"] --> RHT["typed retention_hold_targets"]
    PA --> AW["anonymization_work_items"]
```

These tables are deferred pending timing, sync reconciliation/cursor/retention, authentication, anonymization, legal retention, and Privacy approvals. Identity treatment must not change Reading Session or Lesson Revision identity.

## Persistence interpretation

- `READING_SESSION_EVENTS` is justified as an append-only history candidate because tutorial/practice separation, pause/resume timing, completion evidence, and interruption recovery require chronology. Physical design may instead use a hybrid event/state representation if it preserves the same facts.
- `REVIEW_SUBMISSIONS`, `REVIEW_DECISIONS`, `PUBLICATION_RECORDS`, and `VISIBILITY_RECORDS` are append-only typed evidence. A current workflow/visibility field may optimize commands but must remain derivable from this chronology.
- `ADMINISTRATIVE_ACTORS` and `SERVICE_ACTORS` show distinct security contexts and stable references. The ERD does not approve physical inheritance, polymorphic-key syntax, credential storage, or actor-profile snapshots.
- Review notes and capability snapshots are required conceptually but omitted from the compact diagram; their restricted physical representation remains controlled design work.
- One Publication Record creates exactly one Lesson Revision in the same transaction and references the exact approved Review Submission/Decision and checksums.
- `CATEGORIES` and `TOPICS` have stable UUIDs and exactly two conceptual lifecycle values: `ACTIVE` and `ARCHIVED`. New rows default to `ACTIVE`; `DELETED`, hidden, and withdrawal are not taxonomy lifecycle states. Localized display names are conceptually required but their physical representation is deferred.
- Every Topic belongs to exactly one Category; an optional parent belongs to that same Category. Cycle prevention and same-Category subtree reparenting require transactional validation against authoritative relationships.
- Active Category canonical names are normalized-unique. Active Topic canonical names are normalized-unique within `(category_id, parent_topic_id)` sibling scope. FPSD-005 approves the comparison profile; TN-001 through TN-022 must become executable automated tests before taxonomy repository acceptance.
- Taxonomy display order is explicit. Effective visibility, ancestry paths, and discovery eligibility may be projections, but they cannot authorize hierarchy mutation or replace lifecycle truth.
- Referenced taxonomy is archived, never cascade-deleted. Archived ancestry removes Effective Visibility without rewriting descendants. Restoration revalidates uniqueness, parent validity, Category consistency, Effective Visibility, and concurrency. Taxonomy audit evidence for rename, reorder, reparent, state change, restoration, and Lesson reassignment is required conceptually.
- `LESSON_VARIANTS` provides the stable Language/Difficulty stream. Conceptual uniqueness is one active Variant per Lesson, Language, and Difficulty unless a later ADR introduces parallel editions.
- `WORKING_DRAFTS` represents zero or one active editable draft per Variant. Its concurrency token is conceptual; exact representation and whether drafts use a dedicated physical structure remain open.
- `LESSON_REVISIONS` represents immutable published snapshots with UUID identity and a positive, monotonically allocated number unique within one Variant. The current-revision relationship is conceptual and must be efficient without making historical Revisions mutable.
- `CONTENT_BLOCKS` and `READING_POSITIONS` expose the minimum conceptual structure required for deterministic order, stable block identity, exact display reconstruction, highlighting, completion, and historical interpretation. They do not decide between normalized relations and immutable JSON storage.
- Reading Position indexes are zero-based, contiguous within one Revision, and backed by block-relative Unicode-scalar half-open spans. Tokenization/Alignment Profile names and positive versions preserve the interpretation used at publication.
- Package and Asset Checksums use SHA-256 under ADR-014. A Package Manifest remains a value object/artifact unless delivery evidence justifies a separate record.
- `USER_PROGRESS` is a derived read model and may be rebuilt. It is not authoritative session history.
- `SYNC_RECEIPTS` is authoritative idempotency evidence for server processing and must outlive ordinary request execution according to an approved retention period.
- `USERS` holds learner identity/account lifecycle separately from activity. Retained Reading Sessions and Progress Events support nullable or replaceable learner linkage while preserving stable session, event, and Lesson Revision identity; exact anonymization mapping is deferred.
- `PRIVACY_ACTION_RECORDS` is restricted, append-only, and data-minimized. A Retention Hold reference is conceptual and may later map to a protected related structure; exact physical mapping and policy are not approved here.
- Administrative/Service Actor deactivation never cascades into editorial, taxonomy, or privacy evidence. Mutable actor profiles may be minimized while stable or pseudonymous historical attribution remains.
- No relationship shown authorizes destructive cascade into Revisions, Sessions, Progress Events, Sync Receipts, editorial/publication/taxonomy audit, or Privacy Action Records.
- Exact legal basis, anonymization algorithm, identity/activity detachment representation, and all retention periods remain external specialist policy/physical-design decisions under ADR-017.
- Nullable conceptual references do not approve an exact physical mapping. A registered Reading Session begins linked to a User; approved anonymization may later detach or replace that linkage without changing session or Revision identity.

## Concepts intentionally not represented as their own central tables

| Concept                             | Reason                                                                                                                                                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Guest Session                       | Temporary, non-account, non-synchronized context. Limited anonymous analytics may use a separate minimized telemetry identifier under privacy policy.                                                       |
| User Preferences                    | Deferred by FPSD-001 with the learner identity shell; the conceptual classification remains an aggregate member.                                                                                            |
| Offline Lesson Package and Manifest | The package remains a transport artifact/value object. Deferred manifest/asset descriptor tables are proposed only to support deterministic reconstruction/delivery evidence; binary bytes remain external. |
| Outbox Event                        | Durable mobile-local queue record. It is not necessarily a server table; Progress Event and Sync Receipt represent the server-relevant concepts.                                                            |
| Sync Request                        | Transport envelope only.                                                                                                                                                                                    |
| Sync Cursor                         | A deferred server-side table is proposed, but its opaque representation, expiry, and reset lifecycle remain unresolved.                                                                                     |
| Daily Streak                        | A deferred rebuildable projection table is proposed only if the approved streak query/update workload justifies separate storage.                                                                           |
| Approval Evidence                   | Evidentiary relationship/value object derived from exact approved Review Decision, Review Submission, checksums, actor, time, and authorization evidence.                                                   |
| Superseding Record                  | Corrective relationship between immutable audit records; physical representation may be a self-reference or typed companion structure.                                                                      |
| Taxonomy localization and audit     | Localization remains deferred; typed `taxonomy_change_records` are proposed in migration one because governed mutations require append-only evidence.                                                       |

## Physical-design questions still deferred

- The first five-table Prisma/PostgreSQL mapping is human-approved in the [First Physical Schema Approval](../reviews/FIRST-PHYSICAL-SCHEMA-APPROVAL.md). Prisma schema implementation is authorized; migration generation/execution remains separately gated. Later physical mappings in this ERD remain deferred.
- Exact Working Draft concurrency-token representation, physical storage, and locking strategy. Variant uniqueness, one active draft, Variant-scoped revision numbering, atomic publication, and immutable Revisions are approved by [ADR-013](../decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md).
- Exact revision-number allocation query and current-published-revision access implementation.
- Physical JSON-versus-relational mapping for blocks, positions, and alignment; exact Language-specific tokenizer rules; and exact canonical-JSON library. Their conceptual boundary is approved by [ADR-014](../decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md).
- Package archive/layout, compression, delivery, asset storage, and compatibility-window mechanics.
- Exact actor-table/inheritance/reference mapping, permitted minimal profile snapshots, role/capability persistence, restricted review-note storage, and superseding-record mapping. Their conceptual boundary is approved by [ADR-015](../decisions/ADR-015-persist-editorial-workflow-and-admin-actor-audit.md).
- Taxonomy localization storage, ordering allocation, optional recursive-query/materialized-ancestry projections, projection refresh, and never-referenced temporary-data treatment. Normalization, cycle prevention, `ACTIVE`/`ARCHIVED` lifecycle semantics, and conceptual privilege separation are approved by FPSD-005/FPSD-006/FPSD-013/FPSD-014.
- Local database schema, outbox transaction design, and Sync Cursor storage.
- Exact identity/activity detachment, Privacy Action Record/Retention Hold mapping, anonymization implementation, deletion tombstones, and backup-restore reapplication mechanics within [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md).
- Multi-device ordering/reconciliation and idempotency-retention periods.
- Indexes, partitioning, JSON versus relational fields, foreign-key actions, and timestamp precision.
