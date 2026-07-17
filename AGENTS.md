# Prolific Platform — Codex Instructions

## Project Overview

Prolific is a mobile-first South African knowledge and reading-fluency platform.

Users select a language, topic, lesson, difficulty, and reading pace. A tutorial voice reads the lesson once while words are highlighted. The voice then stops, and the user practises reading independently while the words continue to move at the selected pace.

The platform must support offline lesson downloads and delayed progress synchronization.

## Source of Truth

Before implementing a feature, read the relevant documents under `/docs`.

Important starting documents:

* `/docs/01-product-vision/vision.md`
* `/docs/02-requirements/mvp-scope.md`
* `/docs/03-user-stories/learner-stories.md`
* `/docs/04-ui-ux-design/user-flows.md`
* `/docs/05-mobile-app/flutter-architecture.md`
* `/docs/06-core-backend/backend-architecture.md`
* `/docs/07-database/database-overview.md`
* `/docs/08-api-specification/api-overview.md`
* `/docs/14-roadmap/mvp-roadmap.md`

Do not invent requirements that conflict with these documents.

When documentation is incomplete, record the assumption in `/docs/decisions/` before implementing it.

## Platform Components

The platform contains:

1. Flutter mobile application.
2. Core backend REST API.
3. PostgreSQL database.
4. Content scripting engine.
5. Web-based administration dashboard.
6. Offline cache and synchronization system.

## Initial Technology Decisions

* Mobile: Flutter and Dart.
* Backend: Node.js with NestJS and TypeScript.
* Database: PostgreSQL.
* API style: versioned REST APIs.
* Mobile networking: Dio.
* Mobile local database: Drift or Isar, based on the architecture decision document.
* Audio playback: just_audio.
* Authentication: access and refresh tokens.
* API documentation: OpenAPI.
* Infrastructure: Docker for local services.
* Version control: Git.

Do not change a technology decision without updating the relevant architecture decision record.

## Product Rules

* Mobile first.
* Offline first.
* South African first.
* Every lesson must teach meaningful knowledge.
* The tutorial voice plays once by default.
* Practice mode must contain no application audio; the learner may still read aloud independently.
* The reading player must work without internet after a lesson is downloaded.
* Only published lessons that have passed approval may be visible to learners.
* Content produced by the scripting engine enters the main platform as a draft.
* The content engine must not publish directly.
* AI-generated content will not be required for the MVP.
* Do not add live AI calls to the learner experience.

## Development Rules

* Work in small, reviewable increments.
* Do not build multiple major modules in one task.
* Before editing code, inspect the existing repository and relevant documentation.
* State which files will change before making broad architectural changes.
* Prefer clear code over clever abstractions.
* Keep controllers thin.
* Put business rules in application services.
* Keep database access behind repositories.
* Validate all external input.
* Never commit secrets, access tokens, passwords, or API keys.
* Add tests for business-critical behaviour.
* Run formatting, static analysis, and tests before declaring a task complete.
* Do not silently ignore failing tests.
* Do not delete working code merely to simplify an implementation.
* Do not introduce a package without explaining why it is required.

## API Rules

* All public routes must begin with `/api/v1`.
* Use consistent JSON response and error formats.
* Support idempotency for offline synchronization events.
* Use UUIDs for records that may be created offline.
* Use UTC timestamps in API payloads.
* Use ISO 8601 timestamp formatting.
* Paginate collection endpoints.
* Do not expose internal database errors to clients.
* Generate and maintain an OpenAPI specification.

## Offline Rules

* The app must open when the network is unavailable.
* Downloaded lessons must include text, metadata, version, checksum, and local audio.
* Reading progress must first be written locally.
* Unsynced events must remain in an outbox queue.
* Every sync event must have a unique event ID.
* The server must safely accept retries without creating duplicate sessions.
* Failed sync attempts must not delete local data.
* Conflict handling must be documented and tested.

## Reading Player Rules

The reading player must support:

* Tutorial mode.
* Silent practice mode.
* Learner-initiated tutorial replay that remains separate from practice and completion.
* Play, pause, restart, and exit.
* Easy, medium, and hard pace presets.
* Internal words-per-minute values.
* Word or phrase highlighting.
* Smooth automatic movement.
* Font-size adjustment.
* Local tutorial-audio playback.
* Restoration after temporary app interruption.

Do not calculate lesson completion from audio playback alone. Tutorial listening and user practice are separate session states.

## Content Rules

Every lesson must include:

* Title.
* Category.
* Topic.
* Language.
* Difficulty.
* Content.
* Word count.
* Estimated reading time.
* Status.
* Version.
* Source metadata.
* Review status.
* Created and updated timestamps.

Allowed publication states:

* `draft`
* `in_review`
* `approved`
* `published`
* `archived`

## Testing Expectations

At minimum, add:

* Unit tests for business rules.
* API integration tests for important endpoints.
* Repository tests where database behaviour matters.
* Flutter widget tests for important screens.
* Offline synchronization tests.
* Reading-player timing tests.
* Duplicate sync-event tests.
* Authorization tests for admin operations.

## Git Rules

* Create focused commits.
* Use descriptive commit messages.
* Never force-push unless explicitly instructed.
* Do not commit generated build folders.
* Do not commit environment files containing secrets.
* Show a summary of changed files after completing a task.

## Task Completion Format

At the end of each task, report:

1. What was implemented.
2. Files created or modified.
3. Commands that were run.
4. Test results.
5. Assumptions made.
6. Remaining risks or follow-up work.
