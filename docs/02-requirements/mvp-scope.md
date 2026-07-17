# Prolific MVP Scope

## Purpose

This document defines the minimum product scope required to release the first usable version of Prolific. It establishes what the MVP must do, what it will not do, the essential learner workflows, offline expectations, acceptance criteria, and release gates.

Prolific is a mobile-first, offline-first South African knowledge and reading-fluency platform. The MVP lets a guest try a limited published free lesson before registration. A free registered learner can access the complete eligible library, download lessons, hear or replay synchronized tutorial audio, complete silent practice at an approved pace, retain basic progress and streaks, and synchronize safely when connectivity is available.

This document defines product scope, not detailed architecture. Where an implementation choice or policy is not yet documented, it is identified as a release-blocking decision rather than assumed here.

## MVP Outcomes

The MVP is successful as a product release when it demonstrates that:

1. Guests can experience the core reading journey before registration, and registered learners can retain its full value.
2. A downloaded lesson remains usable without an internet connection.
3. Tutorial listening and silent practice are recorded as separate session states.
4. Reading progress survives application restarts and network outages.
5. Delayed synchronization can be retried without losing progress or creating duplicate sessions.
6. Only content that has passed the required review and learner-visibility controls can be discovered by learners.
7. Administrators can move lesson content through the minimum controlled review and publication workflow.

Quantitative adoption and learning-outcome targets are not yet documented. They must be defined before release but are not invented in this scope.

## Features Included in the MVP

### 1. Learner mobile application

The Flutter mobile application must provide:

- Guest access to active categories/topics, a limited selection of published free lessons, tutorial/replay, silent practice, and temporary current-session progress.
- Optional free learner registration and sign-in using the approved access/refresh token model; the authentication provider remains unresolved.
- English, isiZulu, and Sepedi language selection plus Category, optionally nested Topic, Lesson, difficulty, and reading pace selection from effectively visible learner content. The UI normally presents no more than three taxonomy levels but does not encode a fixed hierarchy depth.
- Easy at 100 WPM, medium at 150 WPM, and hard at 200 WPM. Custom paces are post-MVP; language-specific adjustments remain unresolved.
- A lesson detail or equivalent pre-reading view that shows enough metadata for the learner to make a selection.
- Registered-user download of a complete lesson package for offline use. Guests cannot download lessons.
- A local view of downloaded lessons.
- Tutorial mode with tutorial audio, synchronized word/phrase highlighting, and learner-initiated replay.
- Silent practice mode in which text continues to move at the selected pace without tutorial audio.
- Play, pause, restart, and exit controls.
- Font-size adjustment.
- Restoration of the reading experience after a temporary application or device interruption.
- Registered-user local recording of tutorial/practice progress, lessons completed, total reading time, total words read, recent sessions, current daily streak, and longest daily streak.
- Deferred synchronization of unsynced progress.
- Clear user-visible handling of unavailable, incomplete, corrupted, or outdated lesson downloads.

Registration is optional until an account-only capability is requested. Guests cannot use the complete library, downloads, durable progress, synchronization, history, or streaks. Account deletion is conceptually supported through verified deactivation and history-safe privacy treatment; exact recovery, consent/safeguarding, legal basis, timing, retention periods, supported devices/ages, and offline account-expiry policy remain unresolved.

### 2. Reading player

The MVP reading player must:

- Treat tutorial listening and learner practice as separate session states.
- Play the tutorial voice before practice and allow learner-initiated replay, including before practice restarts.
- Highlight the current Reading Position in synchronization with tutorial playback.
- Continue progression through the same Reading Positions without audio during practice.
- Apply easy at 100 WPM, medium at 150 WPM, or hard at 200 WPM consistently unless a future language-specific adjustment is approved.
- Keep the current session state coherent across play, pause, restart, exit, and supported temporary interruptions.
- Allow font-size changes without losing the learner's logical position.
- Use the downloaded Revision's matching Content Blocks, Reading Positions, profiles, metadata, Package/Asset Checksums, attribution, and audio.
- Complete a lesson only when practice has started, reaches the final eligible Reading Position, and is not abandoned or exited before that end. Pause/resume may still complete; tutorial playback never does.

The structured-block, zero-based Reading Position, profile-version, SHA-256, and package boundaries are approved by ADR-014. Exact Language-specific tokenization rules, alignment generation, language-specific timing, interruption/background tolerance, and acceptable timing drift remain unresolved. The pace defaults, tutorial replay, silent application audio during practice, and practice-only completion rule are approved by ADR-011.

### 3. Offline lesson access and synchronization

The MVP must provide:

- Registered-user offline application startup and continued access to previously verified downloads during temporary connectivity loss, subject to future account/content-expiry policy.
- Offline discovery and opening of lessons already downloaded to the device.
- Local lesson packages containing the exact immutable learner content and interpretation/integrity metadata defined in the [Offline Lesson Package](../05-mobile-app/offline-lesson-package.md), including local tutorial audio and attribution.
- Package Schema/block/profile compatibility plus Package and Asset Checksum verification before a downloaded lesson is marked available offline.
- Local-first progress persistence.
- An outbox queue for progress events awaiting synchronization.
- A unique UUID event ID for every synchronization event.
- Safe retry of synchronization events without duplicate server-side sessions.
- Preservation of local events after failed or interrupted synchronization attempts.
- Explicit handling of Lesson Revision/package mismatches and other synchronization conflicts.
- Synchronization attempts when connectivity and a valid registered session are available, without blocking offline reading.
- Per-event accepted, duplicate, rejected, and retryable outcomes with partial-success support.

### 4. Core backend API

The NestJS core API must provide the minimum endpoints required to:

- Expose the approved public guest catalog/free-lesson boundary and support optional free-account registration/sign-in with access and refresh tokens.
- Return only Categories/Topics with Effective Visibility and eligible published content, a limited published free-lesson catalog to guests, and the eligible complete published catalog to registered learners.
- Return or authorize retrieval of versioned lesson packages and tutorial audio.
- Accept progress and session events idempotently.
- Return durable acknowledgements for accepted synchronization events.
- Support the minimum administrative content workflow.
- Enforce role-based authorization for administrative operations.

All public routes must begin with `/api/v1`. Payload timestamps must use UTC and ISO 8601 formatting. API responses and errors must use documented consistent formats, and the public contract must be maintained in OpenAPI.

### 5. Data storage

The PostgreSQL data model must support at least:

- Users, authenticated sessions, and administrative roles required by the approved account model.
- Lesson metadata and content.
- Lesson Variant and immutable Lesson Revision identities, Variant-scoped Revision Numbers, Package Schema Version, profile versions, and SHA-256 checksums.
- Ordered Content Blocks, Reading Units/Positions, tutorial-audio metadata, and alignment references.
- Content review and publication status.
- Tutorial and practice session records.
- Idempotent synchronization event processing.
- Administrative audit records for security-sensitive content-state changes.

The content model collectively provides stable Lesson/Topic identity, one Language and Difficulty per Lesson Variant, and immutable Lesson Revision title, ordered Content Blocks, Reading Positions, word count, estimated reading time, source attribution, tutorial/alignment metadata, schema/profile versions, checksums, Revision Number, review/publication evidence, and timestamps. Learner-facing content does not live directly on Lesson.

### 6. Content scripting engine

The MVP content engine must:

- Produce lesson content and metadata in a format accepted by the platform's validation boundary.
- Submit all produced content as `draft`.
- Preserve required source metadata.
- Report validation failures without publishing incomplete content.
- Have no permission or technical path to publish directly to learners.

AI-generated content and live AI services are not required for the MVP.

### 7. Administration dashboard

The MVP web administration dashboard must provide the smallest workflow needed to:

- Authenticate authorized administrative users.
- View lesson drafts and their required metadata.
- Identify validation errors or missing required fields.
- Move eligible lessons through the documented review and learner-publication lifecycle.
- Prevent unauthorized users and the content engine from approving or publishing content.
- Archive content so it is no longer learner-visible.
- Record immutable Review Submissions, human Review Decisions, Publication Records, and append-only archive/withdrawal/restoration evidence with stable actor references.

The lifecycle is `draft` to `in_review` to `approved` to `published` to `archived`, with changes-requested/rejected and withdrawal/restoration evidence where applicable. Approval records passed review but does not make content visible; only eligible published content is learner-visible. Internal Content Author, Content Reviewer, Publisher, and Platform Administrator capabilities follow ADR-015. Author self-approval is denied by default, Service Actors cannot approve or publish, and exact provider/RBAC assignments remain unresolved.

### 8. Minimum delivery foundation

The MVP includes:

- Docker-based local services needed for development and integration testing.
- Version-controlled database migrations.
- Shared, versioned API contracts where required by more than one component.
- Automated formatting, static analysis, unit tests, integration tests, and application-level tests appropriate to each component.
- Environment-specific configuration without committed secrets.
- A documented deployment, migration, rollback, backup, restore, logging, and monitoring path for the release environment.

## Explicitly Excluded From the MVP

The following are outside the MVP unless this scope is deliberately revised:

- Live AI calls in the learner experience.
- AI-generated lesson content as a release dependency.
- Direct publication by the content scripting engine.
- A learner-facing web or desktop application.
- Social feeds, chat, comments, learner-to-learner messaging, and community features.
- Gamification beyond approved basic daily streaks, including points, badges, achievements, leaderboards, social challenges, competitive rankings, and competitions.
- Personalized recommendation engines or adaptive difficulty driven by learner analytics.
- Real-time collaborative reading or live tutoring.
- Teacher, school, guardian, or district management portals unless separately approved as required for the launch audience.
- Payments, subscriptions, advertising, sponsorship placement, and marketplace features.
- User-authored or publicly submitted lessons.
- Automated translation, speech recognition, pronunciation scoring, and learner microphone recording.
- Streaming-only lesson playback; the required offline experience depends on a complete local lesson package.
- Advanced business-intelligence dashboards, cohort analytics, or custom report builders.
- Push notifications, email campaigns, and marketing automation.
- Integrations with external learning-management systems or identity providers.
- Guaranteed simultaneous multi-device progress merging beyond the documented MVP conflict policy.
- Features intended only for future scale, high availability, or geographic expansion that are not required by approved MVP non-functional targets.

Essential security, privacy, accessibility, observability, backup, recovery, and data-integrity work is not optional and may not be classified as a post-MVP feature.

## Learner Workflows

### Workflow 1: Start and authenticate

1. The learner opens the mobile application.
2. The application restores a valid authenticated session or continues in guest mode; registration is optional until the learner requests an account-only capability.
3. A guest may browse active categories/topics and a limited selection of published free lessons. When the guest requests durable progress, downloads, synchronization, streaks, history, or the complete library, the application displays: "Create a free account to save your progress and unlock offline reading."
4. If a registered learner is offline, the application still opens and allows access to verified downloads and unsynced progress, subject to the documented offline-authentication policy.
5. Authentication failure must not silently delete downloaded lessons or unsynced progress.

### Workflow 2: Discover and select a lesson online

1. The learner selects English, isiZulu, or Sepedi when eligible content is available in that language.
2. The learner selects a topic and lesson from learner-visible content.
3. The learner selects difficulty and an easy, medium, or hard reading pace.
4. The application displays the selected lesson's relevant metadata and download state.
5. Content that has not passed the required review and visibility controls is never shown.

### Workflow 3: Download a lesson

1. A registered learner requests a lesson download while online. A guest is shown the free-account prompt instead.
2. The application downloads the exact Revision package containing Content Blocks, Reading Positions, profiles, metadata, attribution, integrity data, alignment data, and local tutorial audio.
3. The application verifies completeness, supported interpretation, Package Checksum, and every Asset Checksum.
4. Only a verified package is marked available offline.
5. A failed, cancelled, or corrupted download is not presented as ready and does not replace a valid existing version.

### Workflow 4: Complete the tutorial

1. The learner opens an eligible online or downloaded lesson.
2. The learner starts tutorial mode.
3. Local tutorial audio plays while the corresponding word or phrase is highlighted and the text moves smoothly.
4. The learner can play, pause, restart, replay, or exit; replay never counts as practice or completion.
5. A temporary interruption restores a coherent position and state.
6. Tutorial state is recorded locally but does not by itself mark practice complete.

### Workflow 5: Practise reading silently

1. After the tutorial, the learner starts silent practice.
2. Tutorial audio remains stopped.
3. Highlighting and automatic movement continue at the selected pace.
4. The learner can play, pause, restart, exit, and adjust font size.
5. The application records completion only after practice starts, reaches the final eligible Reading Position, and is not abandoned or exited before that end.

### Workflow 6: Resume offline

1. A registered learner opens the application without connectivity.
2. The learner sees and opens a previously verified downloaded lesson.
3. The learner completes tutorial or practice actions supported by the local package.
4. The application writes progress locally and adds required events to the outbox.
5. The learner is informed that progress is stored locally and awaits synchronization, without being blocked from reading.

### Workflow 7: Synchronize progress

1. Connectivity and a valid authenticated session become available.
2. The application submits queued events with their original event IDs.
3. The server durably accepts each new event once and safely recognizes retries.
4. The application removes or marks an event complete only after a durable server acknowledgement.
5. Failed or unacknowledged events remain queued for a later retry.
6. Each event receives an `accepted`, `duplicate`, `rejected`, or `retryable` outcome; partial batch success is supported and local progress is not silently discarded.

## Offline Behaviour Requirements

### Local lesson integrity

- A lesson is offline-ready only when all required package elements are present, its schema/block/profile semantics are supported, and its Package and Asset Checksums are valid.
- Text, metadata, alignment data, source attribution, and audio used in one session must belong to the same exact Lesson Revision.
- An interrupted update must not corrupt or replace the last valid local version.
- The application must explain when a lesson is unavailable because its package is incomplete or invalid.

### Local progress durability

- Reading progress must be persisted before the interface reports the action as saved.
- Progress state and its outbox event must be created within a failure-safe local operation so that application termination cannot save one without the other.
- Unsynced events must survive application restart, device restart, failed authentication, and failed synchronization attempts within the supported storage lifecycle.
- Logging out, removing an account, or deleting local data must follow an approved policy for pending unsynced progress; the application must not silently discard it.

### Synchronization safety

- Every event must use a stable, client-generated UUID that is reused for every retry of that event.
- The server must process a repeated event ID idempotently and must not create a duplicate reading session or progress record.
- A transport response alone is not sufficient to delete an event; the client requires a durable acknowledgement.
- Retries must use bounded backoff and must not block the reading experience.
- Client clock values must not be the sole authority for ordering or acceptance.
- The server and client must preserve the exact Lesson Revision, Package Schema Version, Tokenization Profile/version, and Reading Position context needed to interpret delayed events correctly.
- Conflict outcomes for multiple devices, superseded Current Published Revisions, rejected events, and expired authentication must be documented and tested before release; retries retain the exact original Lesson Revision identity.

### Offline limitations

While offline, a registered learner may use verified downloaded lessons and create local progress. A guest has no download entitlement or durable offline-progress entitlement. No learner can discover new server content, download new lessons, receive lesson updates, complete server-required account changes, or confirm server synchronization until connectivity returns.

## MVP Acceptance Criteria

### Learner content and selection

- Given a learner with network access, when eligible lesson content is requested, then the learner can select from the supported languages, topics, lessons, difficulties, and pace presets.
- Given a guest with network access, when the public catalog is requested, then only taxonomy whose own state and ancestors are active, which has eligible published content, and the limited published free-lesson selection are returned.
- Given a Topic hierarchy deeper than the currently presented navigation, when catalog data is processed, then the client remains correct without assuming a fixed maximum depth.
- Given a registered learner, when the eligible catalog is requested, then the complete published library available to that account is returned.
- Given content that has not passed required review and learner-visibility controls, when the learner catalog is requested, then that content is not returned or displayed.
- Given more lessons than fit in one API response, when the catalog is requested, then results are paginated using the documented API convention.

### Lesson download

- Given a guest, when download is requested, then no package is downloaded and the free-account prompt is displayed.
- Given a complete valid lesson package, when download finishes, then its immutable content, positions, metadata, profile/schema versions, attribution, checksums, alignment, and audio are stored and it is marked available offline.
- Given a checksum mismatch, missing file, cancellation, or interrupted download, when validation runs, then the package is not marked available and a previously valid version remains usable.
- Given a downloaded lesson, when the device loses connectivity and the application restarts, then the learner can still open the lesson.

### Tutorial and practice

- Given a valid lesson package, when tutorial mode starts, then local audio plays and the corresponding text is highlighted on the same defined timeline within the approved drift tolerance.
- Given tutorial mode, when the learner pauses and resumes, then audio, highlighting, movement, and session state resume coherently.
- Given a supported interruption, when the learner returns, then the player restores a coherent lesson, mode, position, and playback state.
- Given tutorial completion, when the learner has not completed silent practice, then the lesson is not marked complete solely because the audio ended.
- Given tutorial mode, when replay is requested, then the synchronized tutorial may play again without creating practice progress or lesson completion.
- Given silent practice, when playback begins, then no tutorial audio plays and text movement follows the selected pace.
- Given practice that reaches the final eligible Reading Position without abandonment or early exit, when the final state is persisted, then the lesson is marked complete.
- Given practice abandoned or exited before the final position, when state is persisted, then progress may be retained but the lesson is not marked complete.
- Given a font-size change, when the player relayouts, then the learner's logical reading position and session state are preserved.

### Local progress and synchronization

- Given any tutorial or practice progress event, when it is recorded, then the local state and outbox entry survive an immediate application restart.
- Given no connectivity, when the learner reads a downloaded lesson, then progress is stored locally and the reading experience remains usable.
- Given a queued event, when synchronization fails or is interrupted before acknowledgement, then the event remains available for retry.
- Given the same event ID submitted multiple times, when the server processes the retries, then it creates no duplicate session or progress outcome.
- Given a durable server acknowledgement, when the client updates its outbox, then only the acknowledged event is marked synchronized or removed.
- Given a documented conflict case, when synchronization occurs, then the approved deterministic outcome is applied and local data is not silently discarded.

### Content workflow and administration

- Given content created by the scripting engine, when it enters the platform, then its initial state is `draft` and it is not learner-visible.
- Given invalid or incomplete content, when an administrative transition is attempted, then validation prevents an ineligible transition and reports the reason.
- Given an unauthorized user or the content engine, when approval or publication is attempted, then access is denied and no content state changes.
- Given an authorized state transition, when it succeeds, then the new state, actor, and UTC timestamp are recorded in the audit trail.
- Given archived content, when a learner catalog is requested, then that content is not learner-visible.

### API and security

- All public API endpoints used by the MVP are versioned under `/api/v1` and represented in the maintained OpenAPI specification.
- Invalid external input receives the documented safe error response without exposing internal database errors.
- Administrative endpoints enforce the approved authorization matrix.
- Access and refresh tokens follow the approved storage, expiry, rotation, and revocation design.
- No secret, access token, password, API key, or secret-bearing environment file is committed to the repository or exposed in application logs.

## Release Readiness Criteria

The MVP may be released only when all of the following are true.

### Product and policy readiness

- MVP scope and exclusions have product approval.
- Target learner groups, age assumptions, supported operating systems, and minimum device versions are documented and approved; the launch languages are English, isiZulu, and Sepedi.
- Account recovery, consent, exact retention/deletion policy, and offline authentication are approved before release; history-safe architecture follows ADR-017 and the guest/free-account boundary follows ADR-011.
- Only `published` content is learner-visible.
- The canonical block/position/profile/package/checksum model is approved; exact Language-specific tokenization, alignment generation, language-specific pacing adjustments, interruption handling, and timing-drift rules remain to be approved. Replay, base pace values, and completion semantics follow ADR-011.
- Quantitative product success measures and measurable non-functional targets are approved.

### Architecture and contract readiness

- Required architecture documents and architecture decision records are approved, including mobile persistence, authentication, offline outbox synchronization, Lesson Variant/Revision handling, audio alignment, content delivery, and component boundaries.
- Database schema and migrations support all required MVP data and constraints.
- The versioned OpenAPI contract is complete, reviewed, and consistent with implemented endpoints.
- Offline event envelopes, acknowledgements, idempotency retention, retry behaviour, conflicts, and multi-device policy are documented.
- Content lifecycle transitions and the administrative authorization matrix are documented and enforced.

### Security, privacy, and accessibility readiness

- Security and privacy reviews cover data classification, applicable South African obligations, learner age and consent considerations, retention, deletion, export, encryption, token handling, audit logging, and incident response.
- No unresolved critical or high-severity security finding remains without explicit release acceptance by the accountable owner.
- Administrative access and content publication controls have passed authorization tests.
- Accessibility requirements and acceptance tests are defined and pass on supported devices and configurations.
- The content engine is technically unable to publish directly.

### Quality readiness

- Formatting and static analysis pass for every implemented component.
- Unit tests cover business-critical rules.
- API integration and repository tests cover important endpoint and database behaviour.
- Flutter widget and application tests cover the critical learner workflows.
- Offline tests cover startup, verified downloads, local durability, application termination, retries, duplicate events, conflicts, and recovery from partial failure.
- Reading-player tests cover pace calculation, audio alignment, pause and resume, restart, interruption, font-size changes, tutorial/practice separation, and completion semantics using deterministic timing controls.
- End-to-end tests demonstrate the core journey from eligible lesson discovery through download, tutorial, silent practice, local save, and idempotent synchronization.
- All release-blocking tests pass; failures are not ignored or waived without documented approval.

### Content and operational readiness

- The approved launch lesson set contains complete metadata, source information, matching versioned text and audio, valid checksums, and completed review records.
- Deployment, database migration, rollback, backup, restore, logging, monitoring, alerting, and incident-response procedures have been exercised in a release-like environment.
- The release environment contains no default credentials or repository-stored secrets.
- Performance, storage, bandwidth, battery, reliability, and recovery targets pass on the approved supported-device and network matrix.
- Release ownership, support responsibilities, known limitations, rollback authority, and post-release monitoring are documented.

## Remaining Scope Decisions

This MVP boundary does not resolve the following missing product and architecture decisions:

- Launch learner age ranges, operating systems, and device versions.
- Registration credential/provider details, recovery, consent, exact deletion timeframe/legal basis/retention/anonymization policy, and offline authentication. ADR-017 resolves non-destructive architecture and the retention framework.
- Exact administrative authentication/RBAC implementation, production capability assignments, self-approval exception configuration, audit-query access, and review-note retention. The actor and lifecycle capability boundary is approved by ADR-015.
- Language-specific pacing adjustments.
- Tutorial/practice interruption, background, restoration, and timing-drift limits.
- Mobile local database choice between Drift and Isar.
- Exact audio-alignment generation/format, Language-specific tokenizer rules, content-package transport/archive/compatibility window, sync conflict policy, and multi-device behaviour. The conceptual AG-003 boundary is approved by ADR-014.
- Measurable product, performance, accessibility, availability, storage, bandwidth, and reliability targets.

These decisions must be recorded in their relevant requirements, architecture documents, or ADRs before the affected implementation begins. They are not authorization to expand the MVP beyond this document.
