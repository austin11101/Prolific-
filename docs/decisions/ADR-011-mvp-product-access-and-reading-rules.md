# ADR-011: MVP Product Access and Reading Rules

## Status

Accepted

## Date

2026-07-13

## Context

The MVP documentation previously left guest access, launch languages, reading pace values, tutorial replay, practice completion, progress summaries, streaks, download eligibility, learner visibility, and some synchronization outcomes unresolved. Those gaps prevented consistent domain and architecture modelling and produced contradictory statements across the PRD, MVP scope, user flows, API overview, and roadmap.

This ADR records the product owner's approved baseline. It establishes product behaviour but does not select implementation packages, infrastructure providers, authentication providers, analytics SDKs, or detailed algorithms.

## Approved decisions

### Guest and free-account model

- A person may use Prolific as a guest before registration.
- A guest may browse active categories and topics, view a limited set of published free lessons, use the reading player, hear and replay tutorial audio, complete silent practice, and view temporary progress for the current app session.
- A guest may not access the complete library, download lessons, save progress permanently, synchronize across devices, maintain streaks, receive personal recommendations, use account history, or use future bookmark/achievement features.
- Restricted actions show: "Create a free account to save your progress and unlock offline reading." Registration is optional until the person chooses an account-only capability.
- A free registered learner may sign in, save progress, download lessons, use downloads offline, synchronize, and maintain the approved progress summaries and streaks.
- No social login, paid tier, subscription, parent, teacher, NGO, library, classroom, or school role is approved by this decision.

### Launch languages

- The MVP launch languages are English, isiZulu, and Sepedi.
- Content availability may differ by language; the UI must state when selected content is unavailable in a language.
- The architecture must remain extensible to all South African languages.
- Additional launch languages are post-MVP unless this decision is amended.

### Pace presets

- Easy is 100 words per minute.
- Medium is 150 words per minute.
- Hard is 200 words per minute.
- These are MVP defaults and must be configurable by a future approved mechanism without adding custom pace selection to the MVP.
- Language-specific timing adjustments remain unresolved.

### Tutorial and practice

- Tutorial audio reads the lesson before practice, drives synchronized text highlighting/advancement, and may be replayed by the learner.
- Tutorial playback is not reading practice and never completes a lesson.
- The learner may replay the tutorial before restarting practice.
- Practice mode contains no application audio. A learner may read aloud independently.

### Lesson completion

- A lesson completes only through silent practice.
- Practice must have started, the reading sequence must reach its final supported token/content position, and the learner must remain in the practice session until that end.
- Exiting or abandoning before the end does not complete the lesson.
- Pausing and resuming may still lead to completion.
- Exact interruption tolerance, background behaviour, and timing thresholds remain architecture decisions.

### Progress and streaks

- Registered learners receive basic progress: lessons completed, total reading time, total words read, recent reading sessions, current daily streak, and longest daily streak.
- A qualifying streak day requires at least one completed practice lesson during the learner's applicable local calendar day.
- Timestamps remain stored in UTC; local-day calculation requires an approved timezone design.
- Guests receive temporary current-session progress only and cannot maintain streaks.
- Badges, achievements, leaderboards, social challenges, and competitive rankings are not in the MVP.
- Bookmarks are post-MVP.

### Offline downloads

- Offline downloads require a registered account.
- Registered learners may download published lessons, use locally stored tutorial audio, complete practice offline, save progress locally, and synchronize later.
- Guests cannot download lessons in the MVP.
- Existing verified downloads remain usable during temporary connectivity loss, subject to future account/content-expiry policies.

### Synchronization

- Synchronization is event-based, local-first, and idempotent.
- The client writes progress locally, enqueues immutable events with unique IDs, retries safely, retains failed/retryable events, and marks success only after server acknowledgement.
- The server prevents duplicate processing, supports partial success, and returns accepted, duplicate, rejected, or retryable per-event outcomes.
- Retried requests must not create duplicate reading sessions.
- Complex user-facing conflict resolution is not required for the MVP. Reconciliation must preserve user progress safely.

### Content lifecycle and AI

- The lifecycle is `draft` to `in_review` to `approved` to `published` to `archived`.
- Approved content passed review but is not necessarily learner-visible; only published content is learner-visible.
- Archived content is unavailable for new discovery.
- The content engine cannot publish directly. Imported, generated, translated, or adapted content requires human review.
- Live AI generation, pronunciation scoring, speech analysis, and live tutoring are not part of the MVP.
- Future AI-generated content must be produced outside the learner flow, reviewed, stored, and delivered as ordinary published content.

### Guest analytics and roles

- Limited anonymous guest analytics may include category/topic views, lesson start/completion, player errors, and performance events.
- Guest analytics use a non-identifying device/session identifier and collect no personally identifying information without deliberate registration or consent.
- Provider, SDK, retention, consent, child safeguarding, and deletion details require privacy/security review.
- Learner is the primary MVP user role. Administration is a separate internal role. Other personas/stakeholders do not automatically become system roles.

## Consequences

### Positive

- People can experience the core reading value before registration.
- Account value is clear: full library access, permanent progress, offline downloads, synchronization, history, and streaks.
- Domain modelling can distinguish guest sessions from registered learner data and can model fixed pace presets, completion, progress summaries, streaks, publication, and sync outcomes consistently.
- Content visibility and tutorial/practice completion contradictions are resolved.

### Costs and trade-offs

- The library and player must enforce a guest/free-account capability matrix.
- Guest progress is intentionally temporary and must not be presented as durable.
- Streak calculation requires local-day/timezone semantics while retaining UTC storage.
- Launch content operations must support three languages without assuming every lesson exists in each language.
- Tutorial replay increases player state and session-test coverage.

## Implementation implications

- Presentation must identify guest-restricted actions and show a clear registration prompt without blocking public lesson trial.
- Authorization must permit public catalog/free-lesson reads while protecting full-library, download, profile, progress, history, streak, and sync capabilities.
- Domain models need explicit access mode, tutorial/practice session mode, pace preset/WPM, completion state, progress summary, streak state, lesson language availability, publication status, and sync result types.
- Guest analytics identity must be separate from authenticated learner identity and designed through privacy review.
- Offline repositories and outbox processing apply to registered learners; guest current-session progress is non-durable in the MVP.
- API/OpenAPI/shared contracts must represent per-event `retryable` outcomes as well as accepted, duplicate, and rejected outcomes.
- Tests must cover guest restrictions, registration prompts, three-language availability, exact pace defaults, tutorial replay, practice-only completion, streak day boundaries, account-gated downloads, duplicate sync, partial success, and published-only discovery.

## Deferred decisions

- Flutter state-management and local-database packages.
- Backend persistence implementation details and object/file storage provider. Prisma ORM and Prisma Migrate were subsequently approved by [ADR-012](./ADR-012-use-prisma-for-core-api-persistence.md).
- Authentication provider, password recovery implementation, token details, and social identity (not approved).
- Tutorial audio format and detailed tokenization/alignment algorithm.
- Language-specific pace/timing adjustments.
- Interruption tolerance, background behaviour, and exact completion timing thresholds.
- Timezone source, timezone-change behaviour, and streak grace/reset policy beyond the one-completed-practice-per-local-day rule.
- Accessibility conformance target.
- Child consent, safeguarding, privacy retention/deletion, and account-deletion retention periods.
- Analytics provider/SDK and detailed guest-analytics governance.
- Detailed multi-device reconciliation.
- Subscription/payment model; no paid model is approved for the MVP.

## Review triggers

Review this ADR if the MVP account tiers, launch languages, pace presets, completion rule, streak qualification, offline-download eligibility, publication lifecycle, sync outcomes, or AI scope changes.
