# Sprint 2 Persistence Implementation Decisions

## Document control

| Item               | Value                                                                                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Status             | Foundation/adapters complete; Sprint 2.29 implemented with final disposable revalidation pending                                                              |
| Scope              | Core API PostgreSQL persistence and first-migration preparation                                                                                               |
| Decision authority | [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md) through [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md) |
| Domain authority   | [Canonical Domain Model](../architecture/canonical-domain-model.md)                                                                                           |
| Readiness evidence | [First Migration Checklist](./FIRST-MIGRATION-CHECKLIST.md)                                                                                                   |
| Recorded           | 2026-07-17                                                                                                                                                    |
| Governance update  | Sprint 2.15 human approval, Prisma deployment, live-catalogue verification, and empty drift result complete; seeds/repositories blocked                       |

## Purpose and decision boundary

This document is the authoritative physical-design guide for the first Prolific persistence increments. Sprint 2.11 through Sprint 2.16 froze the five-table [Foundation Baseline](./FOUNDATION-BASELINE.md), Sprint 2.17 through Sprint 2.22 implemented all repository adapters, and Sprint 2.23 granted `PASS WITH RESTRICTIONS` for bounded application services. Sprint 2.24 through Sprint 2.26 implemented taxonomy queries, Sprint 2.27 implemented [Actor Principal provisioning](./ACTOR-PROVISIONING-SERVICE-REVIEW.md), Sprint 2.28 implemented [Category ordinary mutation](./CATEGORY-MUTATION-SERVICE-REVIEW.md), and Sprint 2.29 implements [Topic ordinary mutation](./TOPIC-MUTATION-SERVICE-REVIEW.md). The original full-record Topic method was unsuitable for a command prohibited from controlling Category, parent, and display order, so revised authority adds a narrow persistence-neutral `persistOrdinaryChange` operation while retaining the existing method. Its atomic update advances only the Topic lock and omits every relationship/order column. It introduces no authorization, audit workflow, transport, hierarchy mutation, schema change, or development-data insertion.

Where this guide defers a later optimization or specialist policy, the first migration must preserve the approved boundary and must not encode an assumption that makes the later decision unsafe.

## Verified environment baseline

The environment entry evidence was re-verified on 2026-07-17:

| Evidence             | Verified result                                                                                                      |
| -------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Docker context       | `desktop-linux`                                                                                                      |
| Docker Engine        | Client and server `28.3.2`; Linux engine operational                                                                 |
| PostgreSQL service   | `prolific-platform-postgres-1` is running and healthy                                                                |
| PostgreSQL readiness | `/var/run/postgresql:5432 - accepting connections`                                                                   |
| PostgreSQL runtime   | `postgres (PostgreSQL) 16.13`                                                                                        |
| Image tag            | `postgres:16-alpine`                                                                                                 |
| Image digest         | `postgres@sha256:20edbde7749f822887a1a022ad526fde0a47d6b2be9a8364433605cf65099416`                                   |
| Local image ID       | `sha256:108b27c919e6e7bc124350fb265deea9adac58e118eade428c6d1ad44b90debe`                                            |
| Flutter resolution   | `C:\Development\flutter\bin\flutter.bat`                                                                             |
| Active Dart runtime  | `C:\Development\flutter\bin\cache\dart-sdk`                                                                          |
| Legacy process audit | No active Dart, Flutter, CMD-hosted Flutter, or VS Code command line references OneDrive or the Brewnest Flutter SDK |

Docker/PostgreSQL health and the legacy OneDrive Flutter/Dart process are cleared entry conditions. PostgreSQL `16.13` is the exact verified development runtime for the current Sprint 2 start. Updating to a later PostgreSQL 16 minor remains routine environment maintenance and does not reopen physical persistence decisions.

## Persistence stack

The approved stack remains unchanged from [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md):

- PostgreSQL is the authoritative relational store.
- Prisma ORM is the Core API database-access technology.
- Prisma Migrate owns committed, reviewable migration history.
- Application services depend on persistence-independent repository interfaces.
- Infrastructure adapters implement those interfaces with Prisma.
- Prisma-generated types remain inside infrastructure and never become domain models or public DTOs.
- The application service or use case owns each transaction boundary and supplies one transaction-scoped client to participating adapters.
- Runtime schema synchronization, production `db push`, implicit startup migration, and unversioned manual schema changes are prohibited.
- Prisma schema changes and their reviewed migration SQL are committed together.

## Installed version baseline

These are the approved exact baselines installed by Sprint 2.2. The installation changed only the Core API manifest and root lockfile dependency graph.

| Component             | Recommendation                                                                                   | Rationale and implementation condition                                                                                                                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PostgreSQL            | Verified development runtime `16.13` at the recorded immutable image digest                      | Preserves the repository's PostgreSQL 16 baseline and is supported by Prisma. CI must reproduce the recorded major/runtime baseline until an explicit PostgreSQL 16 minor-image update is reviewed; deployment must use a supported PostgreSQL 16 minor. |
| Prisma CLI and Client | Pin `prisma`, `@prisma/client`, and `@prisma/adapter-pg` to exactly `7.8.0`                      | `7.8.0` is the current stable release reviewed on 2026-07-17. Prisma 7 is the current major and avoids beginning new persistence work on the previous major. CLI, Client, and adapter versions must match exactly.                                       |
| PostgreSQL driver     | Pin `pg` to exactly `8.22.0`                                                                     | Prisma 7 requires a driver adapter for direct PostgreSQL connections. `@prisma/adapter-pg@7.8.0` declares compatibility with `pg ^8.16.3`; `8.22.0` is the exact reviewed registry version.                                                              |
| Node.js               | Standardize development and CI on `22.22.2` LTS                                                  | The repository already requires Node 22. Prisma 7 supports Node `^22.12.0`; the currently observed `22.17.1` is compatible but is not the recommended exact patch. Node 22 avoids an unrelated major-runtime change.                                     |
| TypeScript            | Retain the repository's `5.7.x` line for the first increment, subject to the actual lockfile pin | Prisma 7 requires TypeScript 5.4 or later. The existing line is compatible; no TypeScript change is required merely to start persistence.                                                                                                                |
| NestJS                | Retain NestJS 11 and its exact lockfile-resolved packages                                        | NestJS 11 and Node 22 are compatible. Persistence stays behind providers/adapters, so Prisma does not define controllers, DTOs, or domain types.                                                                                                         |

Prisma 7 requires ESM-compatible configuration, an explicit generated-client output, explicit environment loading for CLI configuration, and a PostgreSQL driver adapter. Sprint 2.2 implemented these requirements by making the Core API package ESM while retaining TypeScript NodeNext, adding an explicit bounded `pg` pool, and validating the NestJS/Jest toolchain. Physical persistence behavior remains deferred.

Version evidence: [PostgreSQL versioning policy](https://www.postgresql.org/support/versioning/), [Prisma system requirements](https://docs.prisma.io/docs/orm/reference/system-requirements), [Prisma 7 upgrade guide](https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7), [Prisma releases](https://github.com/prisma/prisma/releases), and [Node.js releases](https://nodejs.org/en/about/previous-releases).

## Approved Prisma 7 package plan

### Runtime dependencies

| Package              | Exact version | Purpose                                                                                        |
| -------------------- | ------------- | ---------------------------------------------------------------------------------------------- |
| `@prisma/client`     | `7.8.0`       | Runtime client API and generated-client support. Generated types remain infrastructure-only.   |
| `@prisma/adapter-pg` | `7.8.0`       | Required Prisma 7 direct-PostgreSQL driver adapter. Its version matches Prisma CLI and Client. |
| `pg`                 | `8.22.0`      | PostgreSQL network driver used by the adapter and its connection pool.                         |

### Development and deployment-tooling dependencies

| Package     | Exact version | Purpose                                                                                                                       |
| ----------- | ------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `prisma`    | `7.8.0`       | Prisma CLI, Client generation, schema validation, and Prisma Migrate commands. Production runtime startup must not invoke it. |
| `dotenv`    | `17.4.2`      | Explicit environment loading for `prisma.config.ts`; it is tooling-only, and no secret file is committed.                     |
| `@types/pg` | `8.20.0`      | Direct TypeScript typing pin for PostgreSQL driver configuration instead of relying on a transitive type version.             |

The exact commands executed by the authorized Sprint 2.2 tooling task were:

```powershell
npm install --workspace @prolific/core-api --save-exact @prisma/client@7.8.0 @prisma/adapter-pg@7.8.0 pg@8.22.0
npm install --workspace @prolific/core-api --save-dev --save-exact prisma@7.8.0 dotenv@17.4.2 @types/pg@8.20.0
```

These commands updated `services/core-api/package.json` and the root `package-lock.json`. No other workspace package manifest changed, and no unrelated dependency was intentionally upgraded.

### Generated client and ESM implications

- Prisma 7 uses the `prisma-client` generator. Its explicit output is `services/core-api/src/infrastructure/persistence/generated/prisma/`. The output is generated, ignored by Git, and recreated deterministically before build/test; controllers, DTOs, domain models, and repository interfaces must not import it.
- The Core API package now declares `"type": "module"` while TypeScript retains `module` and `moduleResolution` as `nodenext`. Source imports use Node-compatible `.js` specifiers, and Jest/ts-jest runs the TypeScript suites in ESM mode. The root workspace package remains CommonJS-compatible for root scripts.
- `services/core-api/prisma.config.ts` imports `dotenv/config`, points to `prisma/schema.prisma` and `prisma/migrations`, and reads `DATABASE_URL` from the environment. Secrets remain uncommitted. The migration directory now contains the finalized initial candidate and PostgreSQL provider lock metadata.
- The non-global NestJS `PrismaModule` owns one `PrismaService`; the service constructs one bounded `pg.Pool`, supplies it through `@prisma/adapter-pg`, connects on module initialization, and disconnects once on shutdown. It is validated in an isolated Nest testing module and is not yet imported into the root application module.
- Pool settings come from `DATABASE_POOL_MAX`, `DATABASE_CONNECTION_TIMEOUT_MS`, and `DATABASE_IDLE_TIMEOUT_MS`, with positive-integer validation and documented defaults.
- Observed Node `22.17.1` satisfies Prisma 7's `^22.12` engine requirement. The separately recommended Node `22.22.2` standardization is maintenance, not a tooling-install blocker.
- The migration deployment artifact must include the CLI and `dotenv` tooling even if the long-running API production image omits development dependencies.

Prisma tooling installation and model-free client generation are complete. The current schema contains no models or enums and creates no database objects. The physical schema review is approved, so the exact five-table Prisma schema may be implemented in a separate task. Migration history, SQL, repositories, and database changes remain prohibited.

## Physical naming conventions

### General mapping

| Concern               | Convention                                                | Example                            |
| --------------------- | --------------------------------------------------------- | ---------------------------------- |
| Prisma model          | Singular `PascalCase` domain term                         | `LessonRevision`                   |
| PostgreSQL table      | Plural `snake_case`, mapped explicitly                    | `lesson_revisions`                 |
| Prisma field          | `camelCase` domain term                                   | `lessonVariantId`                  |
| PostgreSQL column     | Singular `snake_case`, mapped explicitly                  | `lesson_variant_id`                |
| Primary key           | `id`; PostgreSQL type `uuid`                              | `lesson_revisions.id`              |
| Foreign-key column    | Singular referenced resource plus `_id`                   | `lesson_revision_id`               |
| Boolean               | Positive predicate prefixed with `is_`, `has_`, or `can_` | `is_readable`                      |
| Timestamp             | Event/state name plus `_at`                               | `published_at`                     |
| Version token         | `lock_version`                                            | `working_drafts.lock_version`      |
| Human revision number | `revision_number`                                         | `lesson_revisions.revision_number` |

Abbreviations are lowercase inside physical names (`api`, `url`, `wpm`, `utc`), but an identifier is not repeated in a column name when the table already provides its scope. Names use ASCII letters, digits, and underscores only. Reserved SQL words and ambiguous names such as `user`, `order`, `group`, `type`, and `key` are avoided.

### Constraints and indexes

Names are deterministic, lower-case, and double-underscore separated between the object and purpose:

| Object                  | Pattern                                     | Example                                                      |
| ----------------------- | ------------------------------------------- | ------------------------------------------------------------ |
| Primary key             | `pk__<table>`                               | `pk__lesson_revisions`                                       |
| Foreign key             | `fk__<table>__<column>__<referenced_table>` | `fk__reading_sessions__lesson_revision_id__lesson_revisions` |
| Unique constraint/index | `uq__<table>__<columns-or-purpose>`         | `uq__lesson_revisions__variant_revision_number`              |
| Check constraint        | `ck__<table>__<rule>`                       | `ck__reading_positions__non_negative_span`                   |
| Non-unique index        | `ix__<table>__<columns-or-purpose>`         | `ix__reading_sessions__account_started_at`                   |

If PostgreSQL's identifier limit would truncate a name, shorten only the purpose segment with a documented domain abbreviation; never accept two generated names that truncate to the same value. Prisma-generated migration SQL must be reviewed and renamed where needed.

### Enums, joins, and migrations

- PostgreSQL enum types use singular `snake_case` names such as `taxonomy_lifecycle_state`; values use lower-case `snake_case` such as `in_review`.
- FPSD-013 approves the taxonomy lifecycle semantics as `ACTIVE` and `ARCHIVED` only. The future Prisma/PostgreSQL mapping must expose exactly those two meanings; no enum or mapping is created until physical-schema authorization.
- Use a database enum only for a closed, architecture-approved state set. Values likely to change independently use a reference table or constrained text instead.
- Many-to-many join tables use both plural resource names in alphabetical order where no stronger domain term exists, for example `actor_permissions`; domain concepts use their canonical name instead, such as `lesson_source_attributions`.
- Join-table foreign keys follow normal naming. A pure join uses a composite primary key in stable column order; an identity-bearing relationship uses its own UUID.
- Migration directories use Prisma's timestamp plus a short lower-case imperative description, for example `20260717120000_create_persistence_baseline`. One migration has one bounded purpose.
- Audit columns use `created_at`, `created_by_actor_type`, `created_by_actor_id`, and operation-specific event fields. Mutable actor profile values are not generic audit columns.

## UUID strategy

- Use RFC 4122 random UUID version 4 for aggregate, entity, audit, command, idempotency, and externally visible identifiers in the first implementation.
- Generate UUIDs in the application or originating offline client before persistence. This supports offline creation, stable retries, and idempotency without a PostgreSQL extension.
- Store every UUID in native PostgreSQL `uuid`, never `varchar` or integer surrogate keys.
- Public API identifiers and internal foreign keys use the same stable UUID value. Sequential database IDs are not exposed or added as shadow identity.
- The Core API validates UUID syntax and authorization separately; UUID unpredictability is not access control.
- Tests use fixed valid UUIDv4 fixtures. Production code uses the platform cryptographic UUID generator through an injectable identifier port.
- A future UUIDv7 change requires a focused decision and compatibility plan. Existing UUIDv4 identifiers remain valid and are never rewritten.

Database-generated UUID defaults are not part of the baseline. A narrowly internal record may receive a database-generated UUID only through a reviewed migration that explains why application generation is unsafe; that exception must not affect offline/external IDs.

## Timestamp and lifecycle policy

- Store instants as PostgreSQL `timestamptz` and exchange ISO 8601 UTC values with a `Z` offset.
- Use microsecond database precision unless a dependency proves otherwise. API serialization may use millisecond precision but must not reinterpret the instant.
- The application clock supplies domain-event time; the database may default persistence receipt time to transaction `now()` where the distinction is explicit.
- `created_at` is immutable. Mutable current-state rows have `updated_at`; immutable evidence and revisions do not acquire a misleading `updated_at`.
- `published_at`, `archived_at`, `withdrawn_at`, `deactivated_at`, `anonymized_at`, and `completed_at` record distinct domain facts and are not aliases.
- Review records use `submitted_at` and `decided_at`; publication evidence uses `published_at`.
- Synchronization uses distinct `occurred_at`, `received_at`, `processed_at`, and optional `next_attempt_at`. Client time never substitutes for server receipt/order evidence.
- `updated_at` is audit/diagnostic information, not the optimistic concurrency token.
- A universal `deleted_at` is prohibited. Archive, withdrawal, deactivation, anonymization, retention, and purge have different meanings under ADR-017. A physical deletion timestamp may exist only as `purged_at` on retained privacy evidence or a tombstone, never as a generic soft-delete switch.

## Optimistic concurrency policy

Use a non-negative integer `lock_version`, initialized to `1`, for mutable aggregate state. A mutation compares the expected version in the same statement/transaction, increments by one on success, and returns a domain conflict when no row matches. The client reloads and makes an explicit retry decision; infrastructure never silently retries a non-idempotent business command.

| Boundary                   | Concurrency rule                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Working Draft              | Required `lock_version`; every material edit and workflow transition consumes the expected value. Submission records the version and checksums reviewed.                                                                                                                                                                                                                            |
| Lesson Variant publication | Keep `next_revision_number`, initialized to `1`, on the Variant. The publication transaction locks/compares the Variant and atomically increments the counter while returning the allocated value, then inserts under unique `(lesson_variant_id, revision_number)`. A failed transaction rolls back both changes. `revision_number` is immutable history, not a concurrency token. |
| Category                   | Required `lock_version` for metadata, lifecycle, and ordering changes.                                                                                                                                                                                                                                                                                                              |
| Topic hierarchy            | Required Topic `lock_version` plus a Category-scoped `hierarchy_version` on the authoritative hierarchy owner. Reparenting compares/increments the hierarchy version and affected Topic version in one transaction after recursive cycle checks.                                                                                                                                    |
| Editorial workflow         | Mutable Working Draft state uses its token. Review Submissions, Review Decisions, Publication Records, and visibility records are append-only and need uniqueness/idempotency constraints rather than update tokens.                                                                                                                                                                |
| User preferences           | Required `lock_version`; stale whole-object writes conflict. Disjoint field patching may later be added only with explicit merge rules.                                                                                                                                                                                                                                             |

Idempotent commands additionally carry stable command/event IDs. Retrying a transaction after a serialization or deadlock error is allowed only at the application-use-case boundary, with a bounded attempt count, jitter, and the same idempotency identity.

## JSON versus relational decision matrix

| Data                                     | Decision   | Rationale and boundary                                                                                                                                                                                                                                                                                                      |
| ---------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Lesson, Variant, Working Draft, Revision | Relational | Stable identity, lifecycle, uniqueness, current-published lookup, concurrency, and historical foreign keys require first-class columns and constraints.                                                                                                                                                                     |
| Lesson content                           | Relational | Revision title, profile/version, word count, checksums, and publication facts are queryable invariants. Learner text is reconstructed through ordered Content Blocks.                                                                                                                                                       |
| Content Blocks                           | Relational | Stable block IDs, deterministic order, type/readability, exact text, and Revision ownership need foreign keys and unique order constraints. Optional block-type-specific decorative metadata may use schema-versioned JSONB only after its validation schema exists.                                                        |
| Reading Positions/Units                  | Relational | High-cardinality ordered rows need `(revision_id, position_index)` uniqueness, block relationships, span checks, and efficient session/package reconstruction.                                                                                                                                                              |
| Tutorial alignment                       | Relational | Entries reference exact positions/ranges and require ordering, range, duration, and Revision integrity. Asset metadata is relational. Provider-specific generation diagnostics are excluded from learner packages and may later use bounded JSONB.                                                                          |
| General metadata                         | Hybrid     | Identity, state, version, query/filter, integrity, and authorization fields are relational. Only optional, versioned, non-authoritative metadata with an owned JSON Schema may use JSONB. A JSON object must not hide a foreign key or invariant.                                                                           |
| Source attribution                       | Relational | Sources and Revision-specific attributions require stable identity, ordering, learner-display selection, and immutable historical references. Source-provider raw import evidence may be restricted schema-versioned JSONB.                                                                                                 |
| User preferences                         | Relational | Known MVP language, pace, accessibility, and notification fields need validation and safe updates. An unbounded preference bag is prohibited; later optional preferences require a reviewed extension structure.                                                                                                            |
| Sync payloads                            | Hybrid     | Envelope identity, account/device, event type, schema version, fingerprint, outcome, and timestamps are relational/indexed. The exact immutable schema-versioned event body may be JSONB so retries can be compared and future event types coexist. Accepted facts are projected into typed relational records.             |
| Audit payloads                           | Hybrid     | Actor, action, target, time, command ID, policy/capability version, prior/resulting state, and typed workflow links are relational. Minimal schema-versioned supplemental evidence may be JSONB. Free-text restricted notes are stored separately with explicit access/retention controls, not inside a generic audit blob. |
| Package manifest                         | Hybrid     | Revision/package identities, schema/profile versions, checksums, publication, and asset descriptors are relational. Canonical manifest JSON may be retained as an immutable derived snapshot only if it is generated from authoritative records, schema-versioned, checksum-verified, and reproducible.                     |

JSONB columns require an owner, schema version, maximum size, validation boundary, privacy classification, and migration policy. Do not add a GIN index by default; index a JSON expression only for a demonstrated query.

## Index strategy

Indexes are justified by constraints or named query paths. Every migration review must include expected query shape and write/storage cost.

- Primary UUID keys use their primary-key B-tree; do not add duplicate UUID indexes.
- Index foreign keys used for joins, history protection, or lifecycle checks. PostgreSQL does not create these automatically.
- Enforce unique `(lesson_id, language_id, difficulty)` across all Variants. Archiving does not permit a parallel edition; that requires a future ADR.
- Enforce one active Working Draft per Variant, unique Revision number per Variant, one Publication Record per Revision, and one terminal Decision per Submission where applicable.
- Retrieve a Revision by UUID through its primary key and histories through `(lesson_variant_id, revision_number DESC)`. Index the Variant's current-published reference and learner discovery path.
- Taxonomy indexes cover Category order/state, `(category_id, parent_topic_id, display_order, id)`, parent traversal, and normalized active sibling names. Use one partial unique index for active root Topics on `(category_id, normalized_canonical_name)` where `parent_topic_id IS NULL`, and one for active child Topics on `(category_id, parent_topic_id, normalized_canonical_name)` where `parent_topic_id IS NOT NULL`; ordinary PostgreSQL `NULL` uniqueness must not leave duplicate roots. Recursive writes query authoritative parent relationships, not a stale projection.
- Publication/discovery indexes cover learner-visible status/current Revision, Language, Difficulty, Topic, and deterministic pagination. Use partial indexes for published/active subsets only when the exact predicate is stable.
- Synchronization has a unique receipt boundary on account scope plus event ID, a payload fingerprint check, and indexes for device/account receipt history and processing state/time. Never use timestamp alone for idempotency.
- Reading Sessions index learner/account plus `started_at DESC`, exact Revision, and stable session/event IDs. Progress projections use unique owner/resource scope plus last-qualified event/time.
- Migration-one taxonomy audit indexes cover separate populated Category/Topic targets, actor chronology, unique command identity, previous/resulting parent FKs, and a nullable unique supersession predecessor. The supersession unique constraint supplies both one-direct-successor enforcement and the lookup index; no redundant non-unique index, `target_type`, generic target ID, identity label, or restricted-note text index is proposed.
- BRIN, partitioning, GIN, trigram, and covering indexes are deferred until measured volume/query plans justify them.

Indexes never replace application authorization, append-only rules, or historical foreign keys. `EXPLAIN (ANALYZE, BUFFERS)` evidence is required before adding performance-only indexes after the baseline.

## PostgreSQL extension policy

The first migration enables **no PostgreSQL extensions**. Extensions require an explicit migration, environment-availability proof, ownership/security review, CI/deployment parity, backup/restore coverage, and removal/upgrade plan.

| Extension   | Decision                                            | Reason                                                                                                                                                                                                                                                                                            |
| ----------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `pgcrypto`  | Defer                                               | Application-generated UUIDs and application-computed SHA-256 avoid a baseline dependency. Reconsider only for a concrete database cryptography/digest use case; it is not a substitute for secrets management or field-encryption design.                                                         |
| `uuid-ossp` | Reject for Sprint 2                                 | UUIDs originate in the application/offline client. The extension adds no required capability and would create inconsistent generation ownership.                                                                                                                                                  |
| `pg_trgm`   | Defer                                               | Fuzzy search is not part of the first persistence increment. Add only with approved multilingual search semantics and query-plan evidence.                                                                                                                                                        |
| `citext`    | Defer; prohibited for taxonomy canonical uniqueness | Case-insensitive text alone does not resolve the approved whitespace, punctuation, diacritic, locale, or multilingual normalization policy. Store a deterministic normalized key once that algorithm is approved. Reconsider `citext` only for a separate identity field with explicit semantics. |

## Migration strategy

### Baseline and incremental history

1. The first migration creates only the smallest reviewed foundational schema and required constraints; its name identifies the bounded baseline purpose.
2. Apply the complete committed history to an empty database and verify expected objects, constraints, and seed prerequisites.
3. Every later schema change is a new forward migration. Applied migrations are never edited, reordered, squashed, or deleted.
4. Generated SQL is a draft. Review types, defaults, names, locks, scans, constraints, indexes, foreign-key actions, extension use, and data-loss warnings before acceptance.
5. PostgreSQL-specific SQL is permitted only when Prisma cannot express an approved constraint/index safely; the migration documents why and integration tests prove it.

### Production safety

- Use `prisma migrate deploy` only in a controlled deployment job with a dedicated migration identity and least privilege. Application startup never migrates.
- Validate migration status and drift against an ephemeral database in CI. Production drift is an incident; do not resolve it with `db push` or by editing migration history.
- Use `expand -> migrate/backfill -> switch -> contract` for changes crossing deployed-version compatibility.
- Backfills are bounded, restartable, idempotent, observable, and separate from long schema-locking transactions when volume requires it.
- Contract/destructive steps require backup/restore evidence, data verification, compatibility confirmation, and separate approval.

### Rollback expectation

Database rollback is not assumed. Roll back application code only while the schema remains backward compatible; otherwise run forward with a reviewed corrective migration. A migration-specific rollback may be documented only when it is demonstrably lossless and tested. Before production, record backup, restore, recovery point, recovery time, and post-restore tombstone/withdrawal reapplication procedures.

## Seed-data strategy

The baseline seed is deterministic, idempotent, non-secret, and environment-aware.

| Candidate             | First-seed decision                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Languages             | Include exactly English (`en-ZA`, `eng`, order 1, `b59a72c2-bb1d-43e2-b0ab-b3d7fdd08890`), isiZulu (`zu-ZA`, `zul`, order 2, `70776e42-a5fa-4c85-8c00-ba1cac8dcbac`), and Sepedi (`nso-ZA`, `nso`, order 3, `0bee1a85-35bf-4096-ac2a-b6ac12c58382`) as active content languages with separately unique normalized tag/name values. Tutorial-audio, voice, text-to-speech, interface-language, and broader availability capability fields are absent. |
| Categories            | Exclude from the production baseline seed. Safe deterministic sample Categories/Topics may exist in an explicit development/test seed and must never imply approved production curriculum.                                                                                                                                                                                                                                                           |
| Difficulty levels     | Represent the closed approved values `beginner`, `intermediate`, and `advanced` as a database enum/application contract, not seed rows, unless later localization metadata requires a reference table.                                                                                                                                                                                                                                               |
| Pace presets          | Keep Easy/Medium/Hard and 100/150/200 WPM as versioned product/application configuration; include them in package/config fixtures, not mutable database seed rows.                                                                                                                                                                                                                                                                                   |
| Roles and permissions | Exclude until the authentication/RBAC physical design is approved. Never seed a privileged human account. A later deterministic capability seed must contain capability identifiers only.                                                                                                                                                                                                                                                            |
| System configuration  | Exclude secrets, URLs, credentials, tokens, environment values, and operational flags. Only immutable reference values required by schema integrity may be seeded after explicit review.                                                                                                                                                                                                                                                             |

Never seed production Lessons/Revisions, publication evidence, users, administrators, credentials, personal data, learner activity, Devices, Reading Sessions, Progress Events, Sync Receipts, audit history, Privacy Action Records, Retention Holds, or generated identifiers. Production content must pass the approved human review and publication workflow.

## Test database strategy

- Use the verified PostgreSQL `16.13` baseline at the recorded image digest in an isolated container/database, never SQLite or a developer's persistent database. When the approved PostgreSQL 16 minor is updated, development and CI test baselines change together.
- CI creates a fresh database from zero, applies committed migrations with the production deployment path, runs an explicit test seed/fixtures, executes tests, and destroys the database.
- Parallel workers receive separate databases or schemas with unique generated names and credentials. Tests never share mutable fixtures across workers.
- Migration tests cover empty baseline, the immediately supported prior schema, drift/status, constraints, foreign-key actions, and a failed-migration recovery rehearsal.
- Repository/transaction integration tests run against real PostgreSQL. A transaction rollback may isolate ordinary tests, but commit/visibility, migration, concurrency, connection, and outbox tests use disposable databases because enclosing rollback would hide real behavior.
- Fixtures use fixed UUIDs, injected clocks, explicit UTC timestamps, and builders that state only relevant values. No production dump or personal data is copied into tests.
- The production language seed and development/demo seed are separate commands. Tests opt into only the minimum fixture set they own.
- Cleanup terminates connections, drops the worker database/schema, and fails the run if cleanup or migration drift fails.

## Repository ownership

Repositories align to aggregates and use cases, not tables.

| Concept                                                | Owning repository boundary                                                                                                                                                                                                                                                                                     |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| User                                                   | `UserRepository` owns learner identity/account state and preferences. It exposes explicit deactivation/anonymization-support operations but does not own historical activity deletion.                                                                                                                         |
| Device                                                 | `UserRepository` owns current account association/authorization; sync-history queries may use the Sync boundary. Device removal cannot cascade into receipts or activity.                                                                                                                                      |
| Category and Topic                                     | `TaxonomyRepository` owns the authoritative Category-scoped hierarchy, lifecycle, ordering, normalized-name checks, and governed mutations.                                                                                                                                                                    |
| Language                                               | Governance-owned reference data; read by approved taxonomy/content paths, with no migration-one runtime/admin mutation endpoint. Reviewed seed/migration amendments preserve UUIDs and use the shared validator.                                                                                               |
| Actor Principal                                        | A controlled provisioning service/repository idempotently creates/reads immutable pseudonymous principals without labels, identifiers, provider subjects, public endpoint, update, or deletion. Future linkage uses separate mappings.                                                                         |
| Lesson, Lesson Variant, Working Draft, Lesson Revision | `LessonRepository` owns the Lesson aggregate, Variant streams, editable draft, immutable revisions, package reconstruction material, and exact current-published references. Variant/Revision do not receive generic independent CRUD repositories.                                                            |
| Review and Publication                                 | Typed editorial operations are exposed through `LessonRepository` or a focused `EditorialRepository` used by editorial application services. Either mapping must share the Lesson publication transaction and cannot expose generic audit mutation. Read-heavy audit queries use a restricted read repository. |
| Reading Session                                        | `ReadingSessionRepository` owns exact-Revision session state and session events.                                                                                                                                                                                                                               |
| Progress                                               | `ProgressEventRepository` owns immutable Progress Events; a dedicated progress read repository owns rebuildable learner projections.                                                                                                                                                                           |
| Synchronization                                        | `SyncReceiptRepository` owns duplicate detection, receipt outcome, and idempotency evidence. It coordinates with activity repositories through the application-owned transaction.                                                                                                                              |

Repository interfaces accept and return domain/application types only. They expose meaningful operations, expected versions, idempotency identities, and purpose-built queries. They do not expose Prisma records, filters, includes, transaction clients, or generic `save/delete` methods. Reporting and learner discovery use dedicated read repositories where aggregate loading is inappropriate.

Taxonomy correction insertion validates the current terminal predecessor, earlier-record relationship, same effective target, and acyclicity in the owning transaction. The nullable unique predecessor constraint makes concurrent direct successors race safely: one commits and the other maps to a stable conflict. Original rows and predecessor links are immutable. No recursive trigger, stored procedure, or new raw-query exception is approved.

### Approved taxonomy raw-query exception

Migration one permits raw SQL only for the Category `FOR UPDATE` locking primitive that Prisma's normal API cannot express. It must be parameterized, use static reviewed identifiers, return minimum identifier/version columns, live only in the taxonomy persistence adapter, and execute inside the application-owned Prisma interactive transaction. The adapter verifies Category identity, expected hierarchy version, and affected Topic versions before ancestor inspection, uniqueness revalidation, mutation, version increments, and audit append. Controllers, general services, other repositories, unrestricted reads, diagnostics, and dynamic/interpolated SQL remain prohibited. Errors translate to stable persistence/domain outcomes; bounded retries apply only to recognized retryable transaction failures; observability excludes SQL text, values, taxonomy names, identity data, and audit payloads. Dedicated concurrent/stale/deadlock/rollback/atomicity tests are mandatory.

## Transaction boundaries

### Publish a Lesson Revision

After all external asset/tokenization/alignment work completes, one application-owned transaction verifies publisher authorization, separation of duties, exact approved Submission/Decision and unchanged checksums/token; concurrency-protects the Variant/draft; allocates the next Variant-scoped revision number; creates immutable Revision content/package material and exactly one Publication Record; switches Current Published Revision and visibility; closes the Working Draft; and appends required evidence. Failure commits nothing. This implements ADR-013 and ADR-015.

### Approve a review

One transaction verifies the exact current Review Submission, draft version/checksums, human reviewer capability, and self-approval policy; creates one immutable Review Decision/Approval Evidence; and transitions Working Draft state. It never publishes. A stale or duplicate decision conflicts or returns its idempotent prior result.

### Complete a Reading Session

One transaction validates silent-practice completion against the exact Revision/positions; completes the Reading Session; appends the completion/session fact; creates the immutable Progress Event; updates required server-side progress projection; and creates durable outbound intent where applicable. Tutorial playback alone cannot enter this boundary.

### Ingest a sync event

One transaction authenticates the active account/device; checks the stable event ID and payload fingerprint; returns the stored outcome for an identical duplicate; rejects mismatched reuse; applies accepted typed facts without duplication; creates the Sync Receipt; and updates projections/cursor state. Per-event outcomes remain independent within a batch as defined by the sync contract.

### Deactivate an account

One transaction verifies authority/idempotency, changes account state, revokes database-held sessions/device authorization, creates minimal Privacy Action evidence, creates the deletion/deactivation tombstone needed to reject late sync, and prevents further acceptance. It does not delete or rewrite Reading Sessions, Progress, receipts, or Revision history.

### Anonymize identity

Anonymization is a retryable stateful workflow, not one unbounded transaction. A short transaction claims the action and checks Retention Holds; bounded treatment transactions remove/replace approved identifiers and detach activity links consistently; external cleanup runs after commit; a final transaction records completion or retry-safe failure. Stable history and Revision references remain unchanged. Partial states are explicit and inaccessible to ordinary user queries. This implements ADR-017 without claiming an unapproved legal retention period or anonymization algorithm.

## Foreign-key and historical-safety rules

- Default foreign-key action is `RESTRICT`/`NO ACTION` across aggregate boundaries and into history.
- The physical User boundary separates a stable non-identifying account/subject row from a one-to-one identity/profile row containing direct identifiers. Reading Sessions, Progress Events, and Sync Receipts reference the stable subject UUID with `RESTRICT`; they never reference email, provider subject, or the removable profile row. Anonymization deletes/nulls approved profile attributes and severs authentication while retaining or pseudonymizing the subject row under policy.
- Administrative and Service identities map to stable non-secret actor-principal rows. Editorial/taxonomy/privacy evidence references the principal with `RESTRICT`; mutable profiles, credentials, and capability assignments are separate and may be deactivated without rewriting evidence. Minimal authorization-at-action snapshots remain on the typed evidence.
- Devices are deactivated/tombstoned rather than hard-deleted while synchronization evidence exists. Sync Receipts reference the stable Device UUID with `RESTRICT`; account/Device authorization changes do not delete receipts or event history.
- Retention Holds have stable UUID identity and explicit typed target-association rows. A target cannot be purged while an active association exists; target/hold foreign keys use `RESTRICT`, release appends evidence, and generic polymorphic strings are not the sole integrity mechanism.
- Lesson/Variant/Revision, taxonomy/content, Revision/session, and actor/audit relationships never cascade delete.
- `CASCADE` is allowed only for strictly owned, non-historical temporary helpers that cannot be referenced independently. Every use requires line-item migration review.
- Retention Holds and Privacy Action Records are restricted append-only evidence. A hold blocks purge; releasing it appends evidence rather than rewriting history.

## Consistency audit

| Authority                    | Result                                                                                                                                                         |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| ADR-012                      | Aligned: Prisma/PostgreSQL, migration ownership, adapters, transaction owner, and no runtime synchronization are preserved.                                    |
| ADR-013                      | Aligned: stable Lesson/Variant identity, one Working Draft, immutable Revision, Variant-scoped numbering, and optimistic concurrency are preserved.            |
| ADR-014                      | Aligned: ordered blocks/positions, exact text, profiles, SHA-256 package boundary, and historical reconstruction are preserved.                                |
| ADR-015                      | Aligned: human/service separation, exact immutable decisions/publications, restricted notes, and atomic publication are preserved.                             |
| ADR-016                      | Aligned: Category-scoped acyclic hierarchy, sibling uniqueness, effective visibility, lifecycle, and concurrency are preserved.                                |
| ADR-017                      | Aligned: no generic deletion, detachable identity, no destructive cascade, holds, tombstones, and privacy evidence are preserved.                              |
| Canonical model and ERD      | Aligned: physical decisions do not add product entities or force one table per conceptual type.                                                                |
| Backend and API architecture | Aligned: repositories/adapters stay below application services; exact Revision/UUID/UTC/idempotency semantics remain transport-safe.                           |
| Product Decision Log         | Aligned: guest restrictions, registered downloads/sync, published-only visibility, practice-only completion, launch languages, and pace presets are unchanged. |

No stale technical or design-decision blocker contradiction remains. FPSD-005 resolves taxonomy normalization, FPSD-009/FPSD-010 resolve Language identities, FPSD-013 resolves taxonomy lifecycle semantics, FPSD-014 resolves the conceptual privilege boundary, Sprint 2.8 resolves the row-locking and audit-target blockers, and Sprint 2.9 resolves MDR-XD-002 with a one-successor linear correction chain. Final audit retention, authentication, language tokenization, package transport, and later-sprint policy remain behind their explicit later-scope gates.

## Implementation authority and remaining gates

The first physical schema governance, Prisma implementation/review, migration generation, SQL finalization, development execution, and post-migration verification phases are complete for `actor_principals`, `languages`, `categories`, `topics`, and `taxonomy_change_records` only. Before any downstream implementation:

- The finalized migration and metadata must remain byte-reviewable and consistent with the approved fields, relations, constraints, indexes, enum usage, foreign-key actions, and provider-specific requirements.
- Sprint 2.9 amendment verification and all five human reviewer decisions are complete.
- The [First Migration Checklist](./FIRST-MIGRATION-CHECKLIST.md), [Execution Approval](./FIRST-MIGRATION-EXECUTION-APPROVAL.md), [Execution Report](./FIRST-MIGRATION-EXECUTION-REPORT.md), and [Foundation Baseline](./FOUNDATION-BASELINE.md) preserve the exact applied migration, repository authority, and remaining boundaries.
- The [Database Privilege Model](../07-database/database-privilege-model.md) must be implemented and tested through separately reviewed provider-specific role/grant configuration; no SQL is approved by the decision alone.
- Authentication/RBAC mapping, anonymization algorithm, retention periods, and other later-scope specialist policies remain gated; the first migration must not pretend they are settled.

Environment entry, database foundation, baseline freeze, shared persistence infrastructure, and all five foundation repository adapters are complete. Initial migration execution is `COMPLETE`, post-migration verification is `PASS`, and every persistence token resolves. Sprint 2.24 through Sprint 2.28 complete taxonomy queries, Actor provisioning, and ordinary Category mutation. Sprint 2.29 implements ordinary Topic mutation, with its corrected disposable concurrency and live-state revalidation pending. Taxonomy-audit orchestration remains unimplemented. The Topic adapter exposes no hierarchy movement, and the proposed [Governed Topic Hierarchy Command](../04-architecture/governed-topic-hierarchy-command.md) and cycle authorization remain `NOT IMPLEMENTED`.
