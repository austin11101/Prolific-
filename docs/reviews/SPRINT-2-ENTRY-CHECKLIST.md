# Sprint 2 Entry Checklist

## Status

Architecture Gate 001 is `PASS`; the Sprint 1 Closure Review remains the historical `PASS WITH CONDITIONS`. The Docker/PostgreSQL and legacy OneDrive process conditions were re-verified and cleared. Sprint 2 formally started on **2026-07-17**. Prisma tooling and the model-free persistence skeleton are installed under the approved package/ESM plan; physical schema and migration work remains governed by the [First Migration Checklist](./FIRST-MIGRATION-CHECKLIST.md).

## Governance

- [x] [Architecture Gate 001](./ARCHITECTURE-GATE-001.md) records `PASS`.
- [x] [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md) through [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md) are accepted and Product Owner human verification is recorded.
- [x] Product decisions PD-001 through PD-013 remain unchanged.
- [x] The [Master Roadmap](../14-roadmap/master-roadmap.md) records gate closure, Sprint 1 completion, cleared environment conditions, and Sprint 2 formal start.
- [x] Remaining Sprint 1 deliverables and acceptance criteria are complete or explicitly re-scoped through the [deliverable audit](./SPRINT-1-DELIVERABLE-AUDIT.md).
- [x] Sprint 2 start is formally recorded as 2026-07-17 in the roadmap/status documents.
- [x] Docker Desktop responds through `desktop-linux`; `docker compose ps` reports PostgreSQL running and healthy, and `pg_isready` accepts connections.
- [x] Flutter resolves from `C:\Development\flutter`; active Dart processes use its cached Dart SDK, with no OneDrive/Brewnest process reference.

## Persistence baseline

- [x] PostgreSQL is the authoritative relational database.
- [x] Prisma ORM and Prisma Migrate are approved for the Core API.
- [x] Core API migration ownership and application-service transaction ownership are defined.
- [x] Runtime schema synchronization and production schema push are prohibited.
- [x] Destructive cascades across aggregate boundaries or into immutable history are prohibited.
- [x] Explicit repository interfaces with Prisma infrastructure adapters are required.
- [x] Local PostgreSQL is running as `16.13`; image digest `postgres@sha256:20edbde7749f822887a1a022ad526fde0a47d6b2be9a8364433605cf65099416` is recorded.

## Domain baseline

- [x] Lesson → Lesson Variant → immutable Lesson Revision responsibilities and Variant-scoped numbering are approved.
- [x] Reading Sessions and Offline Lesson Packages preserve exact Lesson Revision identity.
- [x] Category-scoped hierarchical Topic rules, cycle prevention, scoped uniqueness, reparenting, and lifecycle are approved.
- [x] Review Submission, Review Decision, Publication Record, actor separation, and append-only audit boundaries are approved.
- [x] Structured Content Blocks, Reading Positions, profiles, checksums, and package boundaries are approved.
- [x] History-safe deletion/anonymization, identity/activity separation, retention extension points, and Privacy Action evidence are approved.

## Before the first migration

- [x] Select and record the exact Prisma CLI/client recommendation; explain package additions before installation.
- [x] Select and record the exact PostgreSQL recommendation for development, CI, and supported deployment targets; the supplied PostgreSQL 16.13 runtime and image-digest verification is complete.
- [x] Approve physical table, column, relation, constraint, index, enum, and migration naming conventions.
- [x] Approve the PostgreSQL extension policy; the first migration uses no extensions.
- [x] Record JSON-versus-relational choices for immutable blocks, positions, alignment, audit evidence, and package reconstruction.
- [x] Record exact active uniqueness, null/sibling uniqueness, revision allocation, optimistic concurrency, and hierarchy concurrency strategies.
- [x] Record exact append-only editorial/taxonomy/privacy audit persistence and restricted-note treatment.
- [x] Record anonymization-compatible User/activity, actor/audit, Device/sync, and Retention Hold foreign-key mappings with no destructive historical cascade.
- [x] Record the initial migration baseline, clean-database deployment, rollback/run-forward, and drift-detection plan.
- [x] Approve integration test-database provisioning, isolation, reset, migration, and cleanup strategy.
- [x] Approve seed-data boundaries: deterministic non-secret reference/test data only; no production users, credentials, personal data, or learner history.
- [x] Confirm shared contract/JSON Schema dependencies required by the first persistence increment.

The decisions above are approved and recorded in the [Sprint 2 Persistence Implementation Decisions](./SPRINT-2-IMPLEMENTATION-DECISIONS.md). Environment entry, formal start, Prisma package installation, model-free configuration, and ESM/adapter skeleton validation are complete. Physical schema review and first-migration evidence remain tracked in the [First Migration Readiness Checklist](./FIRST-MIGRATION-CHECKLIST.md).

The checked decisions complete the persistence-policy and tooling baseline but do not authorize physical schema content or a migration. The current `schema.prisma` is intentionally model-free; models, enums, relations, constraints, indexes, and first-migration creation remain blocked until the proposed physical schema passes the [First Migration Checklist](./FIRST-MIGRATION-CHECKLIST.md) review gate.

## First implementation scope and order

1. Pin Prisma and approved database tooling. **Completed in Sprint 2.2.**
2. Add model-free Core API database configuration without secrets or runtime schema synchronization. **Completed in Sprint 2.2.**
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
- Environment entry conditions: **cleared on 2026-07-17**.
- Sprint 2 status: **started on 2026-07-17**.
- Prisma tooling installation: **completed and validated under the approved exact package and ESM/adapter plan**.
- Database schema implementation: **not started and not yet permitted**.
- First migration: **not permitted until the physical schema review and applicable First Migration Checklist approval are recorded**.
