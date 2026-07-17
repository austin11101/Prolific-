# Prolific Documentation Index

This directory is the source of truth for the Prolific platform. Begin with the master roadmap, then follow the detailed requirements and contracts relevant to the current sprint.

## Start here

- [Prolific Platform Master Roadmap](./14-roadmap/master-roadmap.md) - official milestone and sprint sequence.
- [Product Requirements Document](./01-product-vision/product-requirements-document.md) - primary functional specification for the platform and MVP.
- [Product Decision Log](./product-decision-log.md) - approved product-behaviour decisions, rationale, consequences, and traceability.
- [Canonical Domain Model](./architecture/canonical-domain-model.md) - canonical entities, aggregates, invariants, events, use cases, and relationships.
- [Domain Glossary](./02-requirements/domain-glossary.md) - canonical short-form terminology reference.
- [Core Backend Architecture](./06-core-backend/backend-architecture.md) - approved Core API dependency, repository, transaction, and persistence boundaries.
- [Flutter Mobile Architecture](./05-mobile-app/flutter-architecture.md) - feature-first mobile layers, dependency direction, offline-first storage, restoration, and test boundaries.
- [Synchronization Service Design](./06-core-backend/sync-service.md) - local-first outbox, idempotency, partial-success, cursor, retry, and deleted-account replay rules.
- [Offline Lesson Package](./05-mobile-app/offline-lesson-package.md) - approved immutable package contents, exclusions, integrity states, and compatibility boundary.
- [Shared Contract Specifications](../packages/shared-contracts/README.md) - strict JSON Schemas for packages, sync requests/responses, and API errors.
- [Database Overview](./07-database/database-overview.md) - approved PostgreSQL, Prisma, migration, integrity, seed, and deployment policies.
- [Conceptual ERD](./07-database/erd.md) - persistence candidates and conceptual cardinalities derived from the domain model.
- [Architecture Gate 001](./reviews/ARCHITECTURE-GATE-001.md) - final review outcome `PASS`; Product Owner human verification is recorded for AG-001 through AG-006.
- [Sprint 2 Entry Checklist](./reviews/SPRINT-2-ENTRY-CHECKLIST.md) - governance, physical-design prerequisites, first implementation order, and controls before the first migration.
- [Data Protection Architecture](./11-security/data-protection.md), [Privacy Architecture](./11-security/privacy.md), and [Security Overview](./11-security/security-overview.md) - history-safe privacy/security baseline and unresolved specialist policy.
- [MVP Scope](./02-requirements/mvp-scope.md) - approved MVP boundaries and release gates.
- [MVP User Flows](./04-ui-ux-design/user-flows.md) - core learner journeys and offline branches.
- [API Overview](./08-api-specification/api-overview.md) - API conventions and planned resource boundaries.
- [Testing Strategy](./12-testing/testing-strategy.md) - central quality model and Sprint 2 minimum evidence.
- [Deployment Architecture](./13-deployment/deployment-overview.md) - provider-neutral environments, delivery, hosting, migration, rollback, and observability controls.

## Reviews and temporary decisions

- [MVP Readiness Review](./reviews/MVP-READINESS-REVIEW.md) - historical review that identified the missing documentation foundation.
- [Sprint 1 Open Questions](./reviews/SPRINT-1-OPEN-QUESTIONS.md) - unresolved product, architecture, privacy, accessibility, and non-functional decisions.
- [Sprint 1 Deliverable Audit](./reviews/SPRINT-1-DELIVERABLE-AUDIT.md) - formal completion, deferral, sprint ownership, and duplicate-path classification.
- [Sprint 1 Closure Review](./reviews/SPRINT-1-CLOSURE-REVIEW.md) - final foundation, architecture, technical validation, and milestone outcome.
- [Sprint 0 Scope Assumption](./decisions/ASSUMPTION-001-sprint-0-scope.md) - temporary authority used for the completed scaffold; it remains until the planned MVP roadmap supersedes it.
- [ADR-011: MVP Product Access and Reading Rules](./decisions/ADR-011-mvp-product-access-and-reading-rules.md) - approved guest/account, language, pace, tutorial, completion, progress, download, sync, visibility, AI, analytics, and persona rules.
- [ADR-012: Use Prisma for Core API Persistence](./decisions/ADR-012-use-prisma-for-core-api-persistence.md) - approved ORM, migration ownership, repository boundaries, transaction ownership, and production schema-evolution policy.
- [ADR-013: Use Lesson Variants and Immutable Revisions](./decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md) - approved Lesson/Variant/Revision responsibilities, Working Draft workflow, optimistic concurrency, Variant-scoped numbering, and historical identity.
- [ADR-014: Use Structured Content Blocks and Revision Packages](./decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md) - approved Content Blocks, Reading Positions, versioned tokenization/alignment, SHA-256 integrity, and offline package boundary.
- [ADR-015: Persist Editorial Workflow and Administrative Actor Audit](./decisions/ADR-015-persist-editorial-workflow-and-admin-actor-audit.md) - approved human/service actor separation, immutable submissions/decisions/publications, separation of duties, and visibility audit.
- [ADR-016: Use Category and Hierarchical Topic Taxonomy](./decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md) - approved Category-scoped Topic hierarchy, naming, cycle prevention, reparenting, lifecycle, visibility, audit, and historical-integrity boundary.
- [ADR-017: Use History-Safe Deletion and Anonymization](./decisions/ADR-017-use-history-safe-deletion-and-anonymization.md) - approved lifecycle distinctions, non-destructive references, identity/activity separation, privacy evidence, retention framework, and backup/sync boundaries.

## Sprint 1 architecture set

Sprint 1 is complete. The documents above plus the [component testing guides](./12-testing/), [deployment guides](./13-deployment/), ADR-011 through ADR-017, and four [shared schemas](../packages/shared-contracts/README.md) form its implementation foundation.

The [deliverable audit](./reviews/SPRINT-1-DELIVERABLE-AUDIT.md) formally retires duplicate planned paths and assigns learner stories, detailed UX/accessibility, admin, content-engine, and release-plan documents to their owning implementation sprint. Missing placeholders are not part of the source of truth.

## Decision records

Major technical decisions must be recorded in `docs/decisions` using:

`ADR-###-short-decision-name.md`

An ADR states its status, context, decision, alternatives, consequences, implementation implications, and review date. An unresolved technology choice must not be treated as approved merely because it appears in a roadmap.

Approved product-behaviour decisions are recorded in the [Product Decision Log](./product-decision-log.md). Product decisions explain why the product behaves a particular way; ADRs explain why the software is designed a particular way.
