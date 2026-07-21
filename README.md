# Prolific

Prolific is a South African knowledge and reading fluency platform designed to help users improve their reading pace, confidence, and comprehension through guided reading lessons.

The app focuses on South African users. The MVP launches with English, isiZulu, and Sepedi; lesson availability may differ by language. Users learn through structured topics such as animals, psychology, speeches, facts, history, technology, health, and South African knowledge.

## Core Idea

Prolific helps users read better while learning useful knowledge.

The main reading experience works like lyric-style reading:

1. The user selects a topic and difficulty.
2. A paragraph appears.
3. The tutorial voice reads while words or phrases are highlighted and may be replayed.
4. The application then becomes silent for independent practice at easy (100 WPM), medium (150 WPM), or hard (200 WPM).
5. The learner may read silently or aloud.
6. A registered learner's progress is saved locally and synchronizes when internet access returns.

Guests can browse active categories/topics and try a limited selection of published free lessons. Creating an optional free account unlocks the complete eligible library, downloads, durable progress, synchronization, history, and daily streaks.

## Platform Components

- Flutter Mobile App
- Core Backend API
- Database
- Content Engine
- Admin Dashboard
- Offline Cache and Sync System

## MVP Goal

The MVP should allow users to:

- Select a language
- Browse topics and lessons
- Try a limited free lesson without registration
- Create an optional free account for the complete eligible library
- Download lessons with a free account
- Play and replay tutorial audio
- Practise reading with moving/highlighted words
- Track basic progress and daily streaks with a free account
- Use downloaded lessons offline
- Sync progress when online

## Long-Term Vision

Prolific will become a South African digital knowledge library that helps users read, learn, and grow in English and South African languages.

## Repository and Development

Monorepo for the Prolific mobile application, administration dashboard, content engine, core API, shared contracts, and supporting infrastructure.

Sprint 0 established the tooling and executable scaffolds. Sprint 1 completed the reviewed architecture baseline, and Sprint 2 formally started on 2026-07-17 after its environment conditions cleared. Sprint 2.5 through Sprint 2.16 established the verified, empty, drift-free [Foundation Baseline](docs/reviews/FOUNDATION-BASELINE.md); Sprint 2.17 through Sprint 2.22 implemented all five repository adapters; and Sprint 2.23 recorded [Persistence Layer Final Review](docs/reviews/PERSISTENCE-LAYER-FINAL-REVIEW.md) `PASS WITH RESTRICTIONS`. Sprint 2.24 through Sprint 2.26 implemented read-only [Language](docs/reviews/LANGUAGE-QUERY-SERVICE-REVIEW.md), [Category](docs/reviews/CATEGORY-QUERY-SERVICE-REVIEW.md), and [Topic](docs/reviews/TOPIC-QUERY-SERVICE-REVIEW.md) queries. Sprint 2.27 implemented [Actor Principal Provisioning](docs/reviews/ACTOR-PROVISIONING-SERVICE-REVIEW.md), Sprint 2.28 implemented [Category Ordinary Mutation](docs/reviews/CATEGORY-MUTATION-SERVICE-REVIEW.md), and Sprint 2.29 implements [Topic Ordinary Mutation](docs/reviews/TOPIC-MUTATION-SERVICE-REVIEW.md) through a narrow atomic repository operation that preserves Category, parent, and display order. [Governed Topic Hierarchy](docs/04-architecture/governed-topic-hierarchy-command.md), taxonomy-audit orchestration, authentication, authorization, APIs, seeds, additional migrations, deployment, and Flutter remain blocked or unimplemented.

## Project Status

- Planning: complete at the product-scope level; detailed decisions continue through the roadmap.
- Environment: complete and verified outside OneDrive.
- Sprint 0: complete.
- Sprint 1: documentation/architecture complete; its historical `PASS WITH CONDITIONS` environment conditions are cleared.
- Sprint 2: started 2026-07-17; the [Foundation Baseline](docs/reviews/FOUNDATION-BASELINE.md) freezes the applied database state. Read-only taxonomy queries, Actor provisioning, and ordinary Category mutation are complete. Topic ordinary mutation is implemented with final disposable/live revalidation pending.
- Persistence architecture: [ADR-012](docs/decisions/ADR-012-use-prisma-for-core-api-persistence.md) approves Prisma ORM, Prisma Migrate, Core API migration ownership, explicit repository interfaces, and application-service transaction ownership. The [Persistence Architecture](docs/04-architecture/persistence-architecture.md) records the implemented lifecycle, opaque transaction context, contracts, errors, and DI boundary. The local database retains the approved empty five-table foundation.
- Content architecture: [ADR-013](docs/decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md) approves stable Lessons, Language/Difficulty Lesson Variants, immutable published Lesson Revisions, Variant-scoped numbering, one Working Draft, and optimistic concurrency.
- Package architecture: [ADR-014](docs/decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md) approves structured Content Blocks, Revision-scoped Reading Positions, versioned profiles, SHA-256 integrity, and the immutable learner package boundary.
- Editorial architecture: [ADR-015](docs/decisions/ADR-015-persist-editorial-workflow-and-admin-actor-audit.md) approves distinct Administrative/Service Actors, immutable review/publication evidence, separation of duties, and append-only visibility history.
- Taxonomy architecture: [ADR-016](docs/decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md) approves Category-scoped hierarchical Topics, naming, cycle prevention, reparenting, lifecycle, Effective Visibility, audit, and historical integrity.
- Privacy architecture: [ADR-017](docs/decisions/ADR-017-use-history-safe-deletion-and-anonymization.md) approves history-safe deletion/anonymization, identity/activity separation, retention extension points, non-destructive references, backup/sync boundaries, and minimal privacy audit evidence.
- Architecture gate: [Architecture Gate 001](docs/reviews/ARCHITECTURE-GATE-001.md) records final `PASS`; AG-001 through AG-006 are `Satisfied — Human verified` by the Product Owner.
- Sprint 2 governance: [Sprint 2 Entry Checklist](docs/reviews/SPRINT-2-ENTRY-CHECKLIST.md) records formal start and cleared environment conditions. The [Sprint 2 Persistence Implementation Decisions](docs/reviews/SPRINT-2-IMPLEMENTATION-DECISIONS.md), [First Migration Checklist](docs/reviews/FIRST-MIGRATION-CHECKLIST.md), [Execution Approval](docs/reviews/FIRST-MIGRATION-EXECUTION-APPROVAL.md), [Execution Report](docs/reviews/FIRST-MIGRATION-EXECUTION-REPORT.md), and [Foundation Baseline](docs/reviews/FOUNDATION-BASELINE.md) record the completed migration boundary, frozen live baseline, repository authority, and remaining downstream gates.
- Sprint 1 closure: [Sprint 1 Closure Review](docs/reviews/SPRINT-1-CLOSURE-REVIEW.md) records the completed deliverables, technical validation, and remaining later-sprint decisions.
- Current implementation guide: [Prolific Platform Master Roadmap](docs/14-roadmap/master-roadmap.md).

## Repository Structure

```text
apps/
  mobile/             Flutter Android and iOS scaffold
  admin-web/          Reserved administration dashboard workspace
  content-engine/     Reserved content scripting engine workspace
services/
  core-api/           NestJS API scaffold
packages/
  shared-contracts/   Language-neutral JSON Schema specifications
infrastructure/       Infrastructure documentation and future definitions
scripts/              Repository automation scripts
docs/                 Product and architecture documentation
```

## Prerequisites

- Node.js 22 or later.
- npm 11 or later.
- Flutter 3.41 or a compatible stable release.
- Docker with Docker Compose v2.

## Initial Setup

1. Copy `.env.example` to `.env` and change local values if necessary.
2. Install Node dependencies with `npm install`.
3. Resolve Flutter dependencies with `cd apps/mobile && flutter pub get`.
4. Start PostgreSQL with `npm run db:up`.

Never commit `.env` or any file containing real credentials.

## Root Development Commands

| Command                | Purpose                                                      |
| ---------------------- | ------------------------------------------------------------ |
| `npm run dev:api`      | Start the NestJS API in watch mode.                          |
| `npm run dev:mobile`   | Run the Flutter mobile scaffold on a selected device.        |
| `npm run db:up`        | Start local PostgreSQL.                                      |
| `npm run db:down`      | Stop local services without deleting the named volume.       |
| `npm run db:logs`      | Follow PostgreSQL logs.                                      |
| `npm run format`       | Format root files, API TypeScript, and Flutter Dart.         |
| `npm run format:check` | Verify formatting without modifying files.                   |
| `npm run lint`         | Run API ESLint and Flutter static analysis.                  |
| `npm test`             | Run API unit/e2e tests and Flutter tests.                    |
| `npm run build:api`    | Compile the NestJS scaffold.                                 |
| `npm run ci`           | Run the same format, lint, test, and API-build checks as CI. |

## Documentation

Start with the [Prolific Platform Master Roadmap](docs/14-roadmap/master-roadmap.md), then review the [Canonical Domain Model](docs/architecture/canonical-domain-model.md), [Core Backend Architecture](docs/06-core-backend/backend-architecture.md), and [Database Overview](docs/07-database/database-overview.md). Use the [documentation index](docs/README.md) for detailed requirements and architecture. Repository-wide agent guidance is in [AGENTS.md](AGENTS.md).
