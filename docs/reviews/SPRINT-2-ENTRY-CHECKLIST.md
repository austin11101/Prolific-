# Sprint 2 Entry Checklist

## Status

Architecture Gate 001 is `PASS`; the Sprint 1 Closure Review is `PASS WITH CONDITIONS`. Sprint 2 is **architecture-ready but not started**. Docker/PostgreSQL health and the no-OneDrive process check must be re-verified before formal start. This document authorizes no implementation by itself.

## Governance

- [x] [Architecture Gate 001](./ARCHITECTURE-GATE-001.md) records `PASS`.
- [x] [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md) through [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md) are accepted and Product Owner human verification is recorded.
- [x] Product decisions PD-001 through PD-013 remain unchanged.
- [x] The [Master Roadmap](../14-roadmap/master-roadmap.md) records gate closure, Sprint 1 completion, and the Docker entry condition.
- [x] Remaining Sprint 1 deliverables and acceptance criteria are complete or explicitly re-scoped through the [deliverable audit](./SPRINT-1-DELIVERABLE-AUDIT.md).
- [ ] Sprint 2 start is formally recorded in the roadmap/status documents.
- [ ] Docker Desktop responds and `docker compose up -d postgres` followed by `docker compose ps` reports PostgreSQL healthy.
- [ ] No active Flutter/Dart process resolves to a previous OneDrive SDK; the unrelated Brewnest VS Code language server is closed or reconfigured.

## Persistence baseline

- [x] PostgreSQL is the authoritative relational database.
- [x] Prisma ORM and Prisma Migrate are approved for the Core API.
- [x] Core API migration ownership and application-service transaction ownership are defined.
- [x] Runtime schema synchronization and production schema push are prohibited.
- [x] Destructive cascades across aggregate boundaries or into immutable history are prohibited.
- [x] Explicit repository interfaces with Prisma infrastructure adapters are required.
- [ ] Local PostgreSQL is running and its exact Sprint 2 version is confirmed before tool/schema work.

## Domain baseline

- [x] Lesson → Lesson Variant → immutable Lesson Revision responsibilities and Variant-scoped numbering are approved.
- [x] Reading Sessions and Offline Lesson Packages preserve exact Lesson Revision identity.
- [x] Category-scoped hierarchical Topic rules, cycle prevention, scoped uniqueness, reparenting, and lifecycle are approved.
- [x] Review Submission, Review Decision, Publication Record, actor separation, and append-only audit boundaries are approved.
- [x] Structured Content Blocks, Reading Positions, profiles, checksums, and package boundaries are approved.
- [x] History-safe deletion/anonymization, identity/activity separation, retention extension points, and Privacy Action evidence are approved.

## Before the first migration

- [ ] Select and record the exact Prisma CLI/client version; explain package additions before installation.
- [ ] Confirm and record the exact PostgreSQL version used by development, CI, and supported deployment targets.
- [ ] Approve physical table, column, relation, constraint, index, enum, and migration naming conventions.
- [ ] Approve the PostgreSQL extension policy and document any required extension before use.
- [ ] Record JSON-versus-relational choices for immutable blocks, positions, alignment, audit evidence, and package reconstruction.
- [ ] Record exact active uniqueness, null/sibling uniqueness, revision allocation, optimistic concurrency, and hierarchy concurrency strategies.
- [ ] Record exact append-only editorial/taxonomy/privacy audit persistence and restricted-note treatment.
- [ ] Record anonymization-compatible User/activity, actor/audit, Device/sync, and Retention Hold foreign-key mappings with no destructive historical cascade.
- [ ] Record the initial migration baseline, clean-database deployment, rollback/run-forward, and drift-detection plan.
- [ ] Approve integration test-database provisioning, isolation, reset, migration, and cleanup strategy.
- [ ] Approve seed-data boundaries: deterministic non-secret reference/test data only; no production users, credentials, personal data, or learner history.
- [ ] Confirm shared contract/JSON Schema dependencies required by the first persistence increment.

No migration or production-shaped schema should be created until every applicable item above is checked or a focused ADR/design record explicitly blocks it for a later increment.

## First implementation scope and order

1. Pin Prisma and approved database tooling.
2. Add Core API database configuration without secrets or runtime schema synchronization.
3. Implement foundational identity and taxonomy physical schema.
4. Implement Lesson, Lesson Variant, Working Draft, and Lesson Revision schema.
5. Implement Content Blocks, Reading Positions, profile/version, checksum, and package reconstruction persistence.
6. Implement editorial workflow, Administrative/Service Actor references, and append-only audit evidence.
7. Implement Reading Session, Progress Event, Sync Receipt, and required persistence boundaries.
8. Add privacy-safe lifecycle fields, detachable identity references, Retention Hold, Privacy Action evidence, and late-sync protection.
9. Add migration status, deployment, drift, and validation automation.
10. Add repository, constraint, transaction, migration, and integration tests against PostgreSQL.

Each item is a focused, reviewable increment. Later items do not authorize premature API, mobile, sync, admin, or product-feature implementation.

## Non-negotiable implementation controls

- Follow AGENTS.md, the canonical model, glossary, ADR-012 through ADR-017, and applicable contracts.
- Never expose Prisma types through controllers, public DTOs, or domain interfaces.
- Never use runtime schema synchronization or unreviewed production schema push.
- Never cascade-delete immutable Revision, Reading Session, sync, editorial, taxonomy, actor, or privacy history.
- Never make unpublished content learner-visible.
- Never place credentials, secrets, direct personal identifiers, or private learner activity into seed data, immutable content, audit checksums, logs, or packages.
- Run formatting, lint, tests, migration validation, and PostgreSQL integration checks for each increment.

## Entry decision

- Architecture gate: **PASS**.
- Database architecture prohibition: **removed**.
- Sprint 1 milestone: **documentation/architecture complete; closure review PASS WITH CONDITIONS**.
- Sprint 2 status: **architecture-ready; not started; Docker runtime entry condition open**.
- Database implementation: **permitted only after formal Sprint 2 start and completion of applicable before-first-migration items**.
