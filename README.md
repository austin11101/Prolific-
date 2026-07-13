# Prolific

Prolific is a South African knowledge and reading fluency platform designed to help users improve their reading pace, confidence, and comprehension through guided reading lessons.

The app focuses on South African users and supports English and South African languages. Users learn through structured topics such as animals, psychology, speeches, facts, history, technology, health, and South African knowledge.

## Core Idea

Prolific helps users read better while learning useful knowledge.

The main reading experience works like lyric-style reading:

1. The user selects a topic and difficulty.
2. A paragraph appears.
3. The AI/tutorial voice reads once.
4. Words are highlighted at the selected pace.
5. The voice stops.
6. The user practises silently or aloud.
7. Progress is saved.
8. Offline progress syncs when internet returns.

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
- Download lessons
- Play tutorial audio once
- Practise reading with moving/highlighted words
- Track progress
- Use downloaded lessons offline
- Sync progress when online

## Long-Term Vision

Prolific will become a South African digital knowledge library that helps users read, learn, and grow in English and South African languages.
# Prolific Platform

Monorepo for the Prolific mobile application, administration dashboard, content engine, core API, shared contracts, and supporting infrastructure.

Sprint 0 establishes tooling and executable scaffolds only. Product features, authentication, database entities, lesson APIs, and reading-player behaviour are not implemented.

## Repository Structure

```text
apps/
  mobile/             Flutter Android and iOS scaffold
  admin-web/          Reserved administration dashboard workspace
  content-engine/     Reserved content scripting engine workspace
services/
  core-api/           NestJS API scaffold
packages/
  shared-contracts/   Reserved shared contracts workspace
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

Start with [the documentation index](docs/README.md). Repository-wide agent guidance is in [AGENTS.md](AGENTS.md).
