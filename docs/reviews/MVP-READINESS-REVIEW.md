# Prolific MVP Readiness Review

**Review date:** 2026-07-13

**Status:** Not ready for implementation-oriented Sprint 0

**Scope reviewed:** `AGENTS.md`, the root `README.md`, `docs/README.md`, and every file under `docs/`

## Review Basis

The repository currently contains high-level project rules in `AGENTS.md`, a one-sentence root `README.md`, and a documentation index in `docs/README.md`. All fourteen numbered documentation directories contain only `.gitkeep` placeholders. None of the product, requirements, user-story, UX, architecture, security, testing, deployment, or roadmap documents linked from the documentation index currently exist.

This review therefore assesses the readiness of the documented intent, not an implementable specification. Recommendations below identify decisions and documentation that must be completed; they do not replace or modify existing product decisions.

## 1. Product Summary

Prolific is a mobile-first, offline-first South African knowledge and reading-fluency platform. A learner selects a language, topic, lesson, difficulty, and reading pace. In tutorial mode, locally available audio reads the lesson while words or phrases are highlighted. The learner then practises silently while the text continues moving at the selected pace. Downloaded lessons must work without a network connection, and locally recorded progress must synchronize later without duplication or data loss.

The content workflow is controlled: a scripting engine creates draft content, administrators review it, and only approved learner-facing content may be exposed. Live AI calls are explicitly outside the MVP learner experience.

## 2. Proposed Platform Components

The documented platform consists of:

1. A Flutter and Dart mobile application.
2. A NestJS and TypeScript versioned REST API under `/api/v1`.
3. A PostgreSQL database accessed through repositories.
4. A content scripting engine that creates drafts but cannot publish directly.
5. A web-based administration dashboard for content and administrative operations.
6. A mobile offline cache and outbox-based synchronization system.
7. Shared API contracts and an OpenAPI specification.
8. Docker-based local infrastructure.

The repository layout anticipates these components under `apps/`, `services/`, `packages/`, and `infrastructure/`, but no component architecture or boundary definitions are documented yet.

## 3. Contradictions and Inconsistencies Between Documents

There are too few substantive documents to perform a full cross-document contradiction review. No direct contradiction exists between the root `README.md` and `AGENTS.md`, but the following inconsistencies and tensions must be resolved:

| Area                   | Evidence                                                                                                                                              | Readiness impact                                                                       |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Source of truth        | `docs/README.md` declares `docs/` the source of truth, but all linked source documents are absent; the only substantive decisions are in `AGENTS.md`. | There is no usable product or architecture source of truth.                            |
| Publication visibility | `AGENTS.md` says only approved lessons may be visible, while the lifecycle separately defines `approved` and `published`.                             | It is unclear whether learners can see `approved` content or only `published` content. |
| Tutorial replay        | The tutorial voice plays once by default, while the player must support restart and restoration after interruption.                                   | Restart, interruption recovery, and replay entitlement are ambiguous.                  |
| Local persistence      | The technology list names “Drift or Isar,” while also stating that technology decisions must not change without an architecture decision record.      | Mobile persistence is not actually decided, and no decision record exists.             |
| ADR location           | `AGENTS.md` requires assumptions in `/docs/decisions/`, and `docs/README.md` specifies ADR naming, but the directory does not exist.                  | The mandated decision process cannot currently be followed as documented.              |

## 4. Missing Requirements That Block Implementation

### Product and scope

- Defined MVP boundary, exclusions, success metrics, and acceptance criteria.
- Target learner profiles, age ranges, literacy assumptions, and supported South African languages at launch.
- Roles and permissions for learners, guardians or educators if applicable, content reviewers, publishers, and administrators.
- Account creation, sign-in, recovery, consent, deletion, and anonymous or guest-use requirements.
- Complete learner, content-review, publication, and administration user stories.
- Analytics, reporting, notifications, moderation, and support requirements or explicit MVP exclusions.

### Content and reading experience

- Lesson schema details, field constraints, identifiers, language representation, version semantics, and source provenance rules.
- Review and publication transition rules, including who may approve, publish, archive, or restore content.
- Definition of lesson completion, reading-session start and end, pause, abandonment, retry, and resumed-session behaviour.
- Exact easy, medium, and hard words-per-minute values and whether pacing varies by language, difficulty, punctuation, or phrase boundaries.
- Audio-to-text alignment format and generation process.
- Download, update, expiry, deletion, storage-limit, and corrupted-asset recovery behaviour.
- Accessibility acceptance criteria, including screen readers, dynamic text, contrast, reduced motion, and audio alternatives.

### API and data

- Resource model, endpoint catalogue, request and response schemas, error envelope, pagination format, and API compatibility policy.
- Database entities, relationships, constraints, indexes, retention rules, and migration strategy.
- Authentication and authorization flows, token lifetime and rotation, device/session management, and administrative access controls.
- Offline event schema, ordering rules, acknowledgement protocol, retry policy, conflict resolution, and reconciliation behaviour.
- Contract ownership and versioning between mobile, API, content engine, and admin dashboard.

### Delivery and operations

- Supported mobile operating systems and minimum versions.
- Environments, configuration strategy, secret management, deployment topology, observability, backup, restore, and disaster-recovery requirements.
- Performance, availability, scalability, download-size, storage, battery, and bandwidth targets.
- Test strategy, quality gates, release criteria, rollout approach, and rollback process.
- MVP roadmap, dependencies, Sprint 0 exit criteria, and ownership.

Until these items are documented and prioritized, implementation estimates and acceptance tests would rely on invented requirements.

## 5. Unclear Technical Decisions

The following require architecture decision records or architecture documents before implementation:

- Choose Drift or Isar for mobile persistence based on query, migration, transaction, testing, and long-term maintenance needs.
- Define monorepo tooling, package boundaries, dependency direction, shared-contract generation, and versioning.
- Define the content engine runtime, input and output formats, validation process, and integration boundary with the core API.
- Select the admin dashboard framework and its authentication model.
- Define whether audio and lesson packages are served by the API, object storage, or a content-delivery layer.
- Select and document the audio-text alignment representation and player scheduling model.
- Define the canonical session and progress event model, including server authority and client-generated UUID rules.
- Define sync transport, batch limits, ordering, idempotency retention, acknowledgements, and conflict handling.
- Define access-token and refresh-token storage, rotation, revocation, expiry, and offline-expiry behaviour.
- Define API error, pagination, date-time, checksum, and content-version conventions.
- Define database migration, backup, restore, audit-log, and data-retention approaches.
- Define supported deployment environments and the production hosting model.

## 6. Security and Privacy Concerns

No security overview, privacy model, threat model, or data classification currently exists. Before handling learner data, the project should document:

- Whether learners include children and what consent, guardian, safeguarding, and age-assurance obligations apply.
- Applicable South African privacy and data-protection obligations, including a formal assessment of POPIA applicability by an appropriate owner.
- The minimum personal data required and whether reading behaviour, audio usage, device identifiers, or progress data are sensitive in context.
- Data retention, deletion, export, correction, consent withdrawal, and account-closure behaviour across server and offline copies.
- Encryption requirements in transit and at rest, including local databases, downloaded lessons, tokens, backups, and administrator sessions.
- Secure token storage on mobile, refresh-token rotation, session revocation, brute-force protection, and lost-device handling.
- Role-based access control and separation of content authoring, review, approval, and publication duties.
- Audit logging for administrative access and content-state changes, with tamper resistance and retention limits.
- Input validation, file and audio upload controls, malware handling, rate limiting, abuse prevention, dependency scanning, and secret management.
- Data residency, subprocessors, backup locations, breach response, and privacy-safe telemetry.

The content engine must also be technically prevented—not merely instructed—from bypassing review and publishing directly.

## 7. Offline-Synchronization Risks

The outbox and idempotency principles are appropriate but insufficiently specified. Principal risks are:

- Duplicate progress or session records when retries cross device restarts, reinstalls, token refreshes, or server timeouts.
- Event loss if local progress and outbox insertion are not atomic.
- Incorrect ordering when pause, resume, completion, or correction events arrive late or in separate batches.
- Conflicts when the same account uses multiple devices or when lesson versions change while a learner is offline.
- Unbounded outbox growth, battery drain, bandwidth usage, and retry storms during prolonged outages.
- Premature deletion if the client treats transport success as durable server acknowledgement.
- Idempotency records expiring before delayed clients reconnect.
- Clock skew if client timestamps determine ordering or completion.
- Authentication expiry preventing sync without a defined reauthentication and data-preservation path.
- Partial or corrupted lesson downloads being treated as available offline.
- Content updates invalidating local audio, checksum, highlighting, or progress references.
- Account logout or deletion leaving unsynced personal data or downloaded content on the device.

Before implementation, define a durable event envelope, atomic local transaction boundary, server deduplication key and retention period, acknowledgement protocol, retry/backoff rules, multi-device policy, lesson-version policy, and explicit conflict outcomes. These behaviours require deterministic integration tests, including process termination and network-failure cases.

## 8. Reading-Player Timing Risks

The player is the core product experience, but its timing contract is not defined. Key risks are:

- Audio duration, word timestamps, phrase boundaries, and displayed text drifting apart.
- Words-per-minute pacing producing unnatural timing around punctuation, long words, headings, or languages with different tokenization rules.
- UI timers losing accuracy under frame drops, backgrounding, audio buffering, device power-saving, or low-end hardware load.
- Pause, resume, seek, restart, and interruption recovery restoring audio, highlight, scroll position, and session state inconsistently.
- Font-size, orientation, and screen-size changes altering layout while timing continues.
- Tutorial completion being confused with learner practice completion.
- Restart unintentionally replaying tutorial audio despite the once-by-default rule.
- Downloaded text and audio versions becoming mismatched.
- Accessibility settings such as reduced motion or screen-reader use conflicting with automatic movement.
- Tests relying on wall-clock delays and becoming slow or nondeterministic.

The architecture should use one explicit playback timeline or monotonic clock as the source of truth, derive UI position from elapsed state rather than accumulating timer ticks, and make interruption transitions a documented state machine. Tokenization, alignment, pace presets, completion semantics, and acceptable drift tolerances must be specified before building the player. Timing logic should be testable with a controllable clock.

## 9. Recommended Implementation Order

1. **Complete product foundations:** Write the vision, problem statement, positioning, principles, MVP scope, exclusions, success metrics, target users, and launch-language decisions.
2. **Define journeys and acceptance criteria:** Complete learner and administrator stories, screen list, user flows, accessibility criteria, and reading-session semantics.
3. **Resolve architecture decisions:** Create the decisions directory and ADRs for mobile persistence, monorepo boundaries, authentication, offline outbox synchronization, lesson versioning, audio alignment, content storage and delivery, and admin technology.
4. **Specify domain and content lifecycle:** Define entities, identifiers, lesson schema, publication state machine, roles, permissions, versioning, and audit requirements.
5. **Specify contracts:** Write the API overview and OpenAPI-first conventions, sync event envelope, error format, pagination, timestamps, checksums, and compatibility policy.
6. **Design the offline and player state machines:** Document atomic local writes, retry and conflict behaviour, download integrity, timeline ownership, interruption handling, and completion rules.
7. **Complete security and privacy design:** Produce data classification, threat model, consent and retention rules, token design, authorization matrix, audit plan, and operational security requirements.
8. **Define quality and delivery:** Establish supported platforms, non-functional targets, test strategy, CI quality gates, environments, deployment, observability, backups, release, and rollback plans.
9. **Create the MVP roadmap:** Sequence vertical slices, dependencies, owners, acceptance gates, and Sprint 0 exit criteria.
10. **Only then scaffold implementation:** Establish the monorepo and shared contracts first, then build a thin end-to-end slice covering approved lesson retrieval, verified offline download, tutorial playback, silent practice, local progress recording, and idempotent synchronization before expanding administrative and content-engine features.

## 10. Sprint 0 Readiness Checklist

| Readiness criterion                                                 | Status  | Evidence or required action                                                                       |
| ------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------- |
| Product vision and problem are documented                           | No      | Linked documents are absent.                                                                      |
| MVP scope and explicit exclusions are approved                      | No      | `mvp-scope.md` and `future-scope.md` are absent.                                                  |
| Target users, launch languages, and roles are defined               | No      | No user or role requirements exist.                                                               |
| User stories and critical flows have acceptance criteria            | No      | User-story and UX documents are absent.                                                           |
| Reading-player semantics and pace values are defined                | No      | Only a feature list exists in `AGENTS.md`.                                                        |
| Offline-sync protocol and conflict policy are defined               | No      | Only high-level outbox and idempotency rules exist.                                               |
| Domain model and lesson lifecycle are defined                       | Partial | Required lesson fields and state names exist, but transitions, constraints, and ownership do not. |
| Mobile, backend, database, and API architectures are documented     | No      | All linked architecture documents are absent.                                                     |
| Material technology choices have ADRs                               | No      | No `docs/decisions/` directory or ADRs exist; mobile persistence remains undecided.               |
| Security, privacy, and authorization requirements are approved      | No      | Security documentation and role matrix are absent.                                                |
| Non-functional targets are measurable                               | No      | No performance, availability, device, storage, or bandwidth targets exist.                        |
| Testing strategy and quality gates are defined                      | Partial | Test categories are listed, but tooling, scope, environments, and pass criteria are absent.       |
| Deployment and operational model are documented                     | No      | Deployment, observability, backup, and recovery documents are absent.                             |
| MVP roadmap, dependencies, owners, and Sprint 0 exit criteria exist | No      | Roadmap and release-plan documents are absent.                                                    |
| Repository boundaries and shared-contract strategy are defined      | No      | The directory layout exists, but component contracts and dependency rules do not.                 |
| Documentation links resolve                                         | No      | All indexed documents except `docs/README.md` are missing.                                        |

### Readiness Decision

The repository is **not ready for an implementation-oriented Sprint 0**. It is ready for a documentation-and-decision Sprint 0 whose exit criteria are completion and approval of the blocking product, UX, architecture, data, API, offline-sync, reading-player, security, testing, deployment, and roadmap documents identified above. Application scaffolding should wait until those foundations are sufficiently concrete to avoid encoding invented requirements.
