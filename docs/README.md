# Prolific Documentation Index

This directory is the source of truth for the Prolific platform. Begin with the master roadmap, then follow the detailed requirements and contracts relevant to the current sprint.

**Current phase:** Sprint 2 started on 2026-07-17. Sprint 2.16 froze the PostgreSQL 16.13 [Foundation Baseline](./reviews/FOUNDATION-BASELINE.md), Sprint 2.17 through Sprint 2.22 completed all five repository adapters, and Sprint 2.23 recorded [Persistence Layer Final Review](./reviews/PERSISTENCE-LAYER-FINAL-REVIEW.md) `PASS WITH RESTRICTIONS`. Sprint 2.24 through Sprint 2.26 implemented read-only taxonomy queries, Sprint 2.27 implemented [Actor Principal Provisioning](./reviews/ACTOR-PROVISIONING-SERVICE-REVIEW.md), Sprint 2.28 implemented [Category Ordinary Mutation](./reviews/CATEGORY-MUTATION-SERVICE-REVIEW.md), and Sprint 2.29 implements [Topic Ordinary Mutation](./reviews/TOPIC-MUTATION-SERVICE-REVIEW.md) with Category, parent, and display-order preservation. The development database remains empty. Governed hierarchy, taxonomy-audit orchestration, authentication/authorization, controllers/APIs, seeds, additional migrations, deployment, and Flutter remain unauthorized or unimplemented.

## Start here

- [Prolific Platform Master Roadmap](./14-roadmap/master-roadmap.md) - official milestone and sprint sequence.
- [Product Requirements Document](./01-product-vision/product-requirements-document.md) - primary functional specification for the platform and MVP.
- [Product Decision Log](./product-decision-log.md) - approved product-behaviour decisions, rationale, consequences, and traceability.
- [Canonical Domain Model](./architecture/canonical-domain-model.md) - canonical entities, aggregates, invariants, events, use cases, and relationships.
- [Domain Glossary](./02-requirements/domain-glossary.md) - canonical short-form terminology reference.
- [Core Backend Architecture](./06-core-backend/backend-architecture.md) - approved Core API dependency, repository, transaction, and persistence boundaries.
- [Persistence Architecture](./04-architecture/persistence-architecture.md) - implemented Prisma lifecycle, opaque transaction context, repository contracts, error and DI policies, tests, and current authority boundary.
- [Governed Topic Hierarchy Command](./04-architecture/governed-topic-hierarchy-command.md) - blocked future hierarchy command, transaction, locking, audit, and test design.
- [Persistence Layer Final Review](./reviews/PERSISTENCE-LAYER-FINAL-REVIEW.md) - complete repository, transaction, dependency, error, test, database, and application-service readiness gate.
- [Language Query Service Review](./reviews/LANGUAGE-QUERY-SERVICE-REVIEW.md) - first transport-neutral application service, immutable output, DI, error, test, and no-mutation evidence.
- [Category Query Service Review](./reviews/CATEGORY-QUERY-SERVICE-REVIEW.md) - read-only Category application contract, immutable output, lifecycle validation, DI, tests, and no-mutation evidence.
- [Topic Query Service Review](./reviews/TOPIC-QUERY-SERVICE-REVIEW.md) - read-only Topic application contract, flat hierarchy semantics, immutable output, DI, tests, and no-mutation evidence.
- [Actor Provisioning Service Review](./reviews/ACTOR-PROVISIONING-SERVICE-REVIEW.md) - controlled transaction-owned Actor Principal provisioning, validation, idempotency boundary, DI, rollback, and no-authentication evidence.
- [Category Ordinary Mutation Service Review](./reviews/CATEGORY-MUTATION-SERVICE-REVIEW.md) - internal metadata/archive/restore contract, application-owned transaction, dual-version concurrency, DI, rollback, and scope evidence.
- [Topic Ordinary Mutation Service Review](./reviews/TOPIC-MUTATION-SERVICE-REVIEW.md) - narrow repository-contract resolution, atomic metadata/lifecycle mutation, relationship/order preservation, DI, rollback, and scope evidence.
- [Flutter Mobile Architecture](./05-mobile-app/flutter-architecture.md) - feature-first mobile layers, dependency direction, offline-first storage, restoration, and test boundaries.
- [Synchronization Service Design](./06-core-backend/sync-service.md) - local-first outbox, idempotency, partial-success, cursor, retry, and deleted-account replay rules.
- [Offline Lesson Package](./05-mobile-app/offline-lesson-package.md) - approved immutable package contents, exclusions, integrity states, and compatibility boundary.
- [Shared Contract Specifications](../packages/shared-contracts/README.md) - strict JSON Schemas for packages, sync requests/responses, and API errors.
- [Database Overview](./07-database/database-overview.md) - approved PostgreSQL, Prisma, migration, integrity, seed, and deployment policies.
- [Database Privilege Model](./07-database/database-privilege-model.md) - approved provider-neutral migration/runtime/admin separation, prohibited privileges, secret handling, tests, and incident boundary.
- [Conceptual ERD](./07-database/erd.md) - persistence candidates and conceptual cardinalities derived from the domain model.
- [Architecture Gate 001](./reviews/ARCHITECTURE-GATE-001.md) - final review outcome `PASS`; Product Owner human verification is recorded for AG-001 through AG-006.
- [Sprint 2 Entry Checklist](./reviews/SPRINT-2-ENTRY-CHECKLIST.md) - governance, physical-design prerequisites, first implementation order, and controls before the first migration.
- [Sprint 2 Persistence Implementation Decisions](./reviews/SPRINT-2-IMPLEMENTATION-DECISIONS.md) - authoritative version, naming, UUID, timestamp, storage, index, extension, migration, seed, test, repository, and transaction decisions.
- [First Migration Readiness Checklist](./reviews/FIRST-MIGRATION-CHECKLIST.md) - evidence gate that must pass before the first Prisma migration is created.
- [First Migration SQL Review](./reviews/FIRST-MIGRATION-SQL-REVIEW.md) - finalized SQL catalogue, validation evidence, execution recommendation, and remaining human authorization boundary.
- [First Migration Execution Approval](./reviews/FIRST-MIGRATION-EXECUTION-APPROVAL.md) - supplied human authority for one execution against the configured local development database.
- [First Migration Execution Report](./reviews/FIRST-MIGRATION-EXECUTION-REPORT.md) - preflight, Prisma deployment, migration-history, live-catalogue, drift, and remaining-gate evidence.
- [Foundation Baseline](./reviews/FOUNDATION-BASELINE.md) - frozen checksums, live catalogues, migration policy, repository starting assumptions, and bounded repository authority.
- [Language Repository Review](./reviews/LANGUAGE-REPOSITORY-REVIEW.md) - read-only contract implementation, mapping/query/error/DI behavior, isolated PostgreSQL evidence, and remaining boundaries.
- [Actor Principal Repository Review](./reviews/ACTOR-PRINCIPAL-REPOSITORY-REVIEW.md) - controlled provisioning, idempotency, concurrency, rollback, authentication-boundary, and isolated PostgreSQL evidence.
- [Category Repository Review](./reviews/CATEGORY-REPOSITORY-REVIEW.md) - lifecycle reads, atomic versioned persistence, lock/hierarchy conflict semantics, constraints, rollback, concurrency, and isolated PostgreSQL evidence.
- [Topic Repository Review](./reviews/TOPIC-REPOSITORY-REVIEW.md) - exact-contract reads and ordinary versioned persistence, immutable relationship guard, uniqueness, rollback, concurrency, PostgreSQL evidence, and explicit hierarchy deferral.
- [Taxonomy Change Record Repository Review](./reviews/TAXONOMY-CHANGE-RECORD-REPOSITORY-REVIEW.md) - immutable append/correction behavior, target integrity, strict duplicate semantics, linear-chain validation, concurrency, and final token binding.
- [First Physical Schema Approval](./reviews/FIRST-PHYSICAL-SCHEMA-APPROVAL.md) - supplied five-discipline human approvals, approved scope, implementation authority, and remaining prohibitions.
- [First Physical Schema Proposal](./07-database/first-physical-schema-proposal.md) - authoritative proposed PostgreSQL mapping, first-migration scope, deferred tables, actions, constraints, and indexes.
- [First Seed Data Proposal](./07-database/first-seed-data-proposal.md) - approved deterministic three-row Language identity/value proposal and explicit seed exclusions; execution remains blocked.
- [First Physical Schema Review](./reviews/FIRST-PHYSICAL-SCHEMA-REVIEW.md) - completed five-discipline review and human approval record.
- [First Physical Schema Multidisciplinary Review](./reviews/FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md) - historical five-perspective advisory assessments, all 22 finding outcomes, and Sprint 2.9 final amendment verification.
- [First Physical Schema Decision Brief](./reviews/FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md) - approved five-table scope, closed FPSD decisions, deferred boundaries, and remaining migration gates.
- [First Physical Schema Decision Register](./reviews/FIRST-PHYSICAL-SCHEMA-OPEN-DECISIONS.md) - stable FPSD record distinguishing resolved, deferred, superseded, and open decisions.
- [Taxonomy Normalization Decision](./07-database/taxonomy-normalization-decision.md) - approved Unicode comparison profile and the TN-001–TN-022 corpus that must become automated tests.
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
- [Sprint 1 Closure Review](./reviews/SPRINT-1-CLOSURE-REVIEW.md) - historical foundation and milestone outcome; its environment entry conditions were cleared at Sprint 2 start.
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
