# First Migration Readiness Checklist

## Status

**Decision:** `FOUNDATION BASELINE VERIFIED AND FROZEN; REPOSITORY IMPLEMENTATION AUTHORIZED; OTHER DOWNSTREAM WORK BLOCKED`.

The persistence rules, environment entry evidence, Prisma tooling, and all migration-one FPSD decisions are documented. Sprint 2.10 through Sprint 2.14 completed approval, schema implementation/review, candidate generation, SQL finalization, and isolated validation. On 2026-07-20, Sprint 2.15 recorded the [supplied development execution approval](./FIRST-MIGRATION-EXECUTION-APPROVAL.md), applied the exact approved checksum once with Prisma, and passed the [post-migration verification](./FIRST-MIGRATION-EXECUTION-REPORT.md). Sprint 2.16 froze that verified state in the [Foundation Baseline](./FOUNDATION-BASELINE.md) and authorized bounded repository implementation. Seeds, APIs, services, additional migrations, production privileges, staging/production deployment, and Flutter implementation remain unauthorized.

The Sprint 2.7 through Sprint 2.10 sections below are historical checkpoint evidence. Their model-free and migration-blocked statements describe those checkpoints rather than the current repository state.

## Sprint 2.7 multidisciplinary review

- [x] Software Architecture, Backend Engineering, Data/Database, Security and Privacy, and Product/Governance evidence assessments were performed independently.
- [x] Every finding has a stable ID, severity, discipline, affected scope, consequence, required action, evidence, and status.
- [x] Finding totals are 2 BLOCKER, 8 MAJOR, 6 MINOR, and 5 OBSERVATION.
- [x] MDR-SP-001, MDR-DOC-001, MDR-PG-002, and the design portion of MDR-SP-003 received documentation-only amendments.
- [x] MDR-BE-001 resolves the governed Category-row-lock implementation path through the taxonomy-adapter-only raw-query policy.
- [x] MDR-DD-001 resolves taxonomy audit target ownership/nullability/check/FK semantics.
- [x] The original seven open major and three open minor findings are resolved through supplied decisions and documented amendments.
- [x] All five human reviewer decision records are completed.
- [x] Physical implementation remained blocked at the Sprint 2.7 review checkpoint.
- [x] Migration creation remains blocked.
- [x] At the Sprint 2.7 checkpoint, `schema.prisma` was model-free and PostgreSQL had zero application objects.

## Sprint 2.8 amendment reconciliation

- [x] Technical blocker count is zero; MDR-BE-001 and MDR-DD-001 are resolved.
- [x] All 21 original stable findings have authoritative RESOLVED or ACCEPTED statuses and linked amendment evidence.
- [x] MDR-XD-002 is resolved by the supplied one-direct-successor decision; linear sequential corrections are allowed and branching is prohibited.
- [x] `taxonomy_change_records` has one unambiguous field/nullability/operation definition, no `target_type`, and a restrictive supersession relationship.
- [x] The complete five-table proposal records 17 non-primary indexes, eight FKs, 26 checks, five non-primary-key unique constraints, and five primary keys (44 named constraints overall).
- [x] The raw-query locking exception, explicit `"C"` collation, shared validation ownership, Language runtime immutability, restricted audit access/interim preservation, tutorial-audio exclusion, and controlled actor provisioning are documented.
- [x] MDR-XD-002 is resolved by an authorized supplied Product Owner / architecture governance decision dated 2026-07-17.
- [x] Five-perspective independent amendment verification is complete and recommends approval.
- [x] All five human decision records are completed.
- [x] Physical implementation and migration creation remain blocked.

## Sprint 2.9 final amendment verification

- [x] All migration-one FPSD decisions are closed.
- [x] All 22 multidisciplinary findings are RESOLVED or ACCEPTED: 17 resolved and five accepted.
- [x] Technical blockers, open major findings, and design-decision blockers are zero.
- [x] The nullable supersession unique constraint enforces at most one direct successor and replaces the redundant non-unique supersession index.
- [x] Correction-chain terminal, same-target, earlier-record, acyclic, immutable-link, concurrency, rollback, and atomicity requirements are documented.
- [x] Final amendment verification is complete from Software Architecture, Backend Engineering, Data/Database, Security and Privacy, and Product/Governance perspectives.
- [x] All five human reviewer decision records are completed.
- [x] At the Sprint 2.9 checkpoint, `schema.prisma` was model-free.
- [x] Physical implementation, migration creation, and seed execution remain blocked.
- [x] PostgreSQL contains zero application relations, custom types, or routines.

## FPSD decision reconciliation

- [x] Migration one contains `actor_principals`, `languages`, `categories`, `topics`, and `taxonomy_change_records` only.
- [x] `users`, `user_preferences`, and `devices` are explicitly deferred by FPSD-001.
- [x] `actor_principals` is strictly pseudonymous and has no `reference_label` or direct identifier.
- [x] FPSD-005 approves the normalization contract; TN-001–TN-022 automated tests remain an implementation acceptance condition.
- [x] FPSD-006 approves application-owned cycle prevention subject to repository, privilege, lock/version, atomicity, revalidation, and concurrency-test controls.
- [x] FPSD-007 limits taxonomy audit evidence to structured fields and prohibits unrestricted notes.
- [x] FPSD-009 approves the three canonical labels, BCP 47/ISO relationships, display order, active/content status, and content-only boundary.
- [x] FPSD-010 approves three immutable Prolific-governance UUIDv4 identities shared by every environment.
- [x] FPSD-013 approves `ACTIVE`/`ARCHIVED`, reversible archive/restoration rules, and no actor lifecycle field.
- [x] FPSD-014 approves migration/runtime/admin separation and the provider-neutral least-privilege boundary.
- [x] No migration-one FPSD decision blocker remains.
- [x] Required multidisciplinary reviewers approve or accept amendments.

## Sprint 2.10 physical-schema approval

- [x] Software Architecture records `APPROVED`.
- [x] Backend Engineering records `APPROVED`.
- [x] Data / Database records `APPROVED`.
- [x] Security & Privacy records `APPROVED`.
- [x] Product / Governance records `APPROVED`.
- [x] Approval date is 2026-07-17 and authority is Project Product Owner / Architecture Governance.
- [x] The First Physical Schema is approved.
- [x] Prisma schema implementation for the exact five-table scope is authorized.
- [x] At the Sprint 2.10 checkpoint, `schema.prisma` was intentionally model-free pending the separately authorized implementation task.
- [x] PostgreSQL remains unchanged with zero application relations, custom types, or routines.
- [x] Migration generation, migration execution, seed execution, repository implementation, API implementation, and Flutter implementation remain unauthorized.

## Sprint 2.11 through Sprint 2.14 implementation and SQL review

- [x] Sprint 2.11 implemented only the approved five-model Prisma schema.
- [x] Sprint 2.12 completed the line-by-line Prisma schema review and approved migration generation for Sprint 2.13.
- [x] Sprint 2.13 generated `20260717_initial_foundation/migration.sql` as an unapplied review candidate.
- [x] Sprint 2.14 preserved original candidate SHA-256 `CD64A3CA1976F6608B28681FD72382BCE799AF9D42A4594BA4D77FAA8EDA2CB3`.
- [x] Sprint 2.14 finalized 26 checks, three partial unique indexes, four explicit `"C"` collations, five non-primary unique constraints, and Prisma migration metadata.
- [x] Final migration SHA-256 is `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`.
- [x] PostgreSQL 16.13 isolated clean-database application and catalogue inspection passed.
- [x] The disposable validation database was removed.
- [x] The configured development database retains zero application relations, custom types, and routines.
- [x] A human Product Owner / Architecture Governance authority approved one local development migration execution on 2026-07-20.
- [x] Migration execution received and consumed its separate local-development authority.
- [x] Repository implementation received its separate Sprint 2.16 authority within the five-model foundation boundary.
- [ ] Seeds, APIs, services, additional migrations, staging/production deployment, and Flutter implementation receive their separately required authority.

## Sprint 2.15 migration execution and verification

- [x] The approved and immediate pre-execution SHA-256 values both equal `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D`.
- [x] PostgreSQL 16.13, healthy container state, connection readiness, target `localhost:5432/prolific`, empty public application catalogue, absent `_prisma_migrations`, migration package, lock provider, schema validation, and zero staged files were verified before execution.
- [x] `npx prisma migrate deploy --config ./prisma.config.ts` applied `20260717_initial_foundation` successfully on the first attempt.
- [x] Prisma history contains one finished, non-rolled-back, one-step migration with the approved checksum and no failure logs.
- [x] The live catalogue matches five tables, one enum, 26 checks, eight FKs, five primary keys, five non-primary unique constraints, three partial unique indexes, nine non-unique indexes, 17 total non-primary indexes, and four `"C"` collations.
- [x] UUID defaults, cascade actions, non-internal triggers, application routines, generated columns, JSONB columns, extra application tables/types, and application rows are absent.
- [x] Prisma format, validation, generation, migration status, and live-to-schema drift comparison pass; the drift comparison is empty.
- [x] Initial migration execution is `COMPLETE`; post-migration verification is `PASS`.
- [ ] Seed execution remains blocked.
- [x] Sprint 2.16 verified and froze the foundation baseline and authorized bounded repository implementation.
- [ ] APIs, services, additional migrations, staging/production deployment, and Flutter implementation remain blocked.

## Governance and environment

- [x] Sprint 1 is complete with the conditions recorded in the [Sprint 1 Closure Review](./SPRINT-1-CLOSURE-REVIEW.md).
- [x] [Architecture Gate 001](./ARCHITECTURE-GATE-001.md) records `PASS` and AG-001 through AG-006 are human-verified.
- [x] ADR-012 through ADR-017 are accepted and reflected in the [implementation decisions](./SPRINT-2-IMPLEMENTATION-DECISIONS.md).
- [x] Sprint 2 formal start is recorded as 2026-07-17 in roadmap/status governance.
- [x] Docker Desktop responds through the `desktop-linux` context; client/server version `28.3.2` was verified.
- [x] `docker compose ps` reports `prolific-platform-postgres-1` running and healthy.
- [x] `pg_isready` reports PostgreSQL is accepting connections.
- [x] PostgreSQL runtime `16.13` and image digest `postgres@sha256:20edbde7749f822887a1a022ad526fde0a47d6b2be9a8364433605cf65099416` are recorded.
- [x] Flutter resolves from `C:\Development\flutter`, and active Dart processes resolve from `C:\Development\flutter\bin\cache\dart-sdk`.
- [x] No active Dart, Flutter, CMD-hosted Flutter, or VS Code command line references the legacy OneDrive/Brewnest Flutter SDK.

## Tooling readiness

- [x] Verified PostgreSQL `16.13`, Prisma `7.8.0`, observed compatible Node `22.17.1`, and recommended Node `22.22.2` are documented.
- [x] Runtime packages `@prisma/client@7.8.0`, `@prisma/adapter-pg@7.8.0`, and `pg@8.22.0` are installed as exact Core API dependencies.
- [x] Development/tooling packages `prisma@7.8.0`, `dotenv@17.4.2`, and `@types/pg@8.20.0` are installed as exact Core API development dependencies.
- [x] Prisma 7 ESM, generated-client output, environment loading, connection-pool, timeout, and lockfile decisions are implemented and validated.
- [x] At the Sprint 2.2 tooling checkpoint, the model-free Prisma schema contained only the approved generator and PostgreSQL datasource; generated output remains infrastructure-only and Git-ignored.
- [x] The Sprint 2.2 tooling task created no physical model, enum, relation, constraint, index, migration directory, migration SQL, seed, or database object.

## Physical-design approval

- [x] Table, column, relation, constraint, index, enum, join-table, and migration naming conventions are approved.
- [x] Application-generated UUIDv4 and native PostgreSQL `uuid` usage are approved.
- [x] UTC `timestamptz`, domain timestamp names, and generic `deleted_at` prohibition are approved.
- [x] `lock_version`, Revision numbering, hierarchy concurrency, conflict, and retry policies are approved.
- [x] Relational/hybrid/JSONB choices and JSONB governance are approved.
- [x] Conceptual integrity, lookup, traversal, publication, sync, session, progress, audit, and uniqueness indexes are approved.
- [x] The no-extension baseline and `pgcrypto`/`uuid-ossp`/`pg_trgm`/`citext` decisions are approved.
- [x] Append-only editorial/taxonomy/privacy evidence and the prohibition on unrestricted taxonomy notes are approved.
- [x] Anonymization-compatible foreign keys and the no-destructive-historical-cascade rule are approved.

## Proposal readiness

- [x] The first physical schema proposal documents the proposed first-migration scope and deferred table boundaries.
- [x] Every proposed first-migration table has columns, PostgreSQL types, nullability, defaults, mutability, keys, constraints, indexes, lifecycle, audit, privacy, sync, and repository implications.
- [x] The amended proposal provides operation-specific audit nullability and exact five-table FK/check/unique/index counts.
- [x] Deferred target tables are mapped without adding them to the first-migration scope.
- [x] Enum, hierarchy, Revision immutability, JSONB, foreign-key, normalization, index, constraint, concurrency, audit, and repository strategies are documented.
- [x] The deterministic launch-Language seed proposal is documented without creating a seed implementation.
- [x] The multidisciplinary review checklist exists and remains pending.
- [x] The concise decision brief records the five-table scope, deferred identity boundary, cycle-prevention guarantees, approved Language identities, lifecycle, privileges, and taxonomy audit-data boundaries.
- [x] Stable FPSD decision IDs distinguish resolved, deferred, superseded, and non-blocking choices.
- [x] The taxonomy normalization profile is approved and its representative corpus is defined for conversion into automated tests.
- [x] The provider-neutral database privilege model documents migration/runtime separation, prohibited privileges, secret ownership, tests, rotation, incidents, and taxonomy-boundary implications.
- [x] Each required reviewer role has an explicit `APPROVE`, `APPROVE WITH AMENDMENTS`, or `REJECT` decision record, all left pending.
- [x] The physical-design portion of the ERD distinguishes conceptual entities, first-migration tables, and deferred tables.
- [x] At the Sprint 2.10 proposal checkpoint, physical schema implementation had not started and no migration, SQL, seed, or database object existed.

## Migration, seed, and test approval

- [x] Initial baseline, incremental history, expand-migrate-contract, drift, review, and run-forward expectations are approved.
- [x] Deterministic production-language, development/demo, and test seed boundaries are approved.
- [x] Production users, credentials, personal data, learner history, publication evidence, and production lesson content are prohibited from seeds.
- [x] PostgreSQL test-database provisioning, worker isolation, migration verification, deterministic fixtures, and cleanup are approved.
- [x] Shared package/sync/error schemas are specification inputs; the first persistence increment must preserve their UUID, UTC, checksum, Revision, and idempotency semantics.

## Physical schema review before migration creation

- [x] The proposed first migration is reduced to one five-table actor-and-taxonomy increment.
- [x] Every table/column maps to a canonical concept or documented infrastructure need.
- [x] Every foreign-key action is listed and checked against ADR-017.
- [x] Every unique/check constraint and index is justified by an invariant or named query.
- [x] The proposed physical schema preserves repository ownership, transaction boundaries, append-only evidence, exact Revision history, and detachable identity.
- [x] Software Architecture, Backend, and Data reviewers approve the proposed first physical schema or record an accepted focused exception.
- [x] Sprint 2.13 supplied Product Owner/delegated-governance authority for first-migration creation only.

## Migration acceptance after approved creation

- [x] Generated SQL has been reviewed; no unapproved extension, destructive cascade, implicit cast, or unsafe default exists.
- [x] Clean disposable PostgreSQL 16.13 application and resulting catalogue inspection pass.
- [x] Configured empty-development-database deployment, Prisma status, history, live catalogue, and drift verification pass.
- [ ] Supported-existing-schema apply, drift/status, rollback/run-forward, and failure-recovery checks pass before any non-empty target execution where applicable.
- [ ] Repository, transaction, concurrency, immutability, idempotency, and PostgreSQL integration tests for the increment pass.
- [ ] Formatting, lint, build, documentation links, and `git diff --check` pass.

## Readiness decision rule

Prisma tooling, the approved five-model schema, migration generation, SQL finalization, metadata, supplied human development-execution approval, Prisma deployment, migration history, live catalogue, no-drift verification, and Sprint 2.16 baseline freeze are complete. Initial migration execution is `COMPLETE`, post-migration verification is `PASS`, and repository implementation is `AUTHORIZED` within the five-model foundation boundary. Seeds, APIs, services, additional migrations, staging/production deployment, Flutter changes, and production privilege work remain separately blocked.
