# Prolific Platform Product Requirements Document

## Document control

| Item                  | Value                                                                    |
| --------------------- | ------------------------------------------------------------------------ |
| Product               | Prolific                                                                 |
| Tagline               | Read. Learn. Grow.                                                       |
| Status                | Approval-ready product baseline; architecture and privacy review pending |
| Scope                 | Prolific MVP and explicitly identified future capabilities               |
| Product mission       | Build South Africa's leading knowledge and reading fluency platform.     |
| Planning authority    | [Master Roadmap](../14-roadmap/master-roadmap.md)                        |
| Detailed MVP boundary | [MVP Scope](../02-requirements/mvp-scope.md)                             |
| Learner journeys      | [MVP User Flows](../04-ui-ux-design/user-flows.md)                       |
| API conventions       | [API Overview](../08-api-specification/api-overview.md)                  |

This PRD is the primary functional specification. It does not approve unresolved technology or policy choices and does not replace lower-level architecture, security, privacy, accessibility, OpenAPI, or sprint acceptance documents. When documents conflict, the conflict must be resolved explicitly rather than implemented by assumption.

## 1. Executive summary

### What Prolific is

Prolific is a mobile-first, offline-first South African knowledge and reading-fluency platform. It combines short, meaningful knowledge lessons with a guided reading experience. A learner selects a language, topic, lesson, difficulty, and pace; listens to tutorial audio while words or phrases are highlighted; then practises independently while the application remains silent and continues highlighting and moving the text at the selected pace. A guest can try a limited published free lesson before registration. A free registered account unlocks the complete library, durable progress, offline downloads, synchronization, recent history, and streaks.

### Who it serves

The primary audience is people in South Africa who want to improve reading fluency while learning useful knowledge. Candidate segments include learners, university students, and adults improving English or another supported language. Parents, NGOs, and libraries may support access or discovery. Teachers and school-focused experiences are future scope until their roles, safeguarding responsibilities, and workflows are approved.

The MVP launches in English, isiZulu, and Sepedi. The primary MVP role is learner; parents, teachers, NGOs, and libraries remain personas or stakeholders rather than account roles. Exact launch ages, literacy levels, supported devices, child-safeguarding details, and institutional models remain unresolved.

### The problem

People who want to improve reading confidence and pace may face limited access to engaging, level-appropriate material, reliable connectivity, affordable data, local-language content, or guided practice. Many digital products assume permanent internet access or separate skill practice from meaningful learning.

### Why Prolific is different

- Reading practice teaches useful knowledge rather than using meaningless drills.
- The experience is designed for South African learners and languages first.
- A registered learner can keep a complete verified lesson usable without internet.
- Guests can experience a limited public lesson before creating a free account.
- Tutorial listening and independent practice are deliberately separate.
- Progress is written locally first and synchronized later without duplicate sessions or silent data loss.
- Content follows a controlled draft, review, approval, and publication workflow.

### Long-term vision

Prolific aims to become a South African digital knowledge library that helps people read, learn, and grow across English and South African languages. Future expansion may include school and teacher services, reading communities, carefully governed AI-assisted content workflows, broader audio content, web access, and additional countries or institutions. These are not MVP commitments.

## 2. Product goals

Product goals must be measured consistently, but numeric targets require product approval and a baseline. This PRD therefore defines the measures and release gates without inventing target values.

| Goal                                   | Intended outcome                                                                              | Measure                                                                                                                                       | MVP target status                                                                         |
| -------------------------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Improve reading confidence             | Learners willingly complete independent practice and return for further lessons.              | Practice completion rate, repeat-practice rate, retention, and an approved confidence measure if collected with appropriate privacy controls. | Numeric target and confidence instrument not approved.                                    |
| Improve reading pace                   | Learners can practise at controlled paces and demonstrate progress over time.                 | Completion at the approved 100, 150, and 200 WPM defaults by language/difficulty.                                                             | Presets approved; improvement target and language-specific adjustments remain unapproved. |
| Encourage daily learning               | Learners form a repeat pattern of reading meaningful lessons.                                 | DAU, active days per learner, lessons completed per active day, and D1/D7/D30 retention.                                                      | Numeric adoption and retention targets not approved.                                      |
| Support South African languages        | Learners can discover and use quality content in English, isiZulu, and Sepedi at launch.      | Published lessons and completion by launch language, plus language-specific content-review pass rate.                                         | Languages approved; minimum inventory and language-specific pacing remain unapproved.     |
| Operate offline                        | Learners can use verified downloads and preserve progress during poor or absent connectivity. | Offline session success, verified-download success, local-save success, sync recovery, and data-loss incidents.                               | Data-loss tolerance is zero by rule; other numeric targets not approved.                  |
| Provide meaningful educational content | Each lesson teaches useful, reviewed knowledge with source metadata.                          | Publication review pass rate, required metadata completeness, source coverage, corrections, and learner completion.                           | Quality rubric and inventory targets not approved.                                        |
| Deliver a dependable mobile experience | Core journeys work on the approved device/network matrix.                                     | Crash-free sessions, startup and player performance, sync reliability, and accessibility conformance.                                         | Device matrix and numeric non-functional targets not approved.                            |

Product impact claims must not be presented as proven learning outcomes until the measurement method, baseline, evaluation window, and evidence support them.

## 3. Target users

The personas below guide discovery and requirements; they do not establish the launch audience or create unapproved account roles.

### 3.1 Learner improving reading fluency

**Context:** A school-age or independent learner seeking clearer, faster, more confident reading. Exact launch age and safeguarding requirements are unresolved.

**Needs:** Simple guidance, appropriate difficulty, understandable controls, meaningful topics, offline access, visible local progress, and accessible text/audio presentation.

**Frustrations:** Limited data, unstable connectivity, material that feels childish or irrelevant, anxiety about mistakes, unclear progress, and applications that lose work offline.

**Success criteria:** Can find an appropriate lesson, download it, complete tutorial and silent practice, resume after interruption, and trust that progress is saved.

### 3.2 University student

**Context:** A tertiary learner who wants to read academic or general-knowledge material more confidently and efficiently.

**Needs:** Credible topics, flexible pace and difficulty, short sessions, language choice, and offline use during commuting or campus connectivity gaps.

**Frustrations:** Dense text, time pressure, inconsistent access, and practice tools that do not teach useful content.

**Success criteria:** Completes relevant lessons regularly, selects a comfortable pace, and sees a trustworthy history of practice without needing continuous connectivity.

### 3.3 Adult improving English

**Context:** An adult developing English reading fluency for work, study, daily life, or personal growth; future languages may support other fluency goals.

**Needs:** Respectful adult-oriented content, clear language labels, adjustable font and pace, repeatable practice, and private progress.

**Frustrations:** Stigma, content aimed only at children, expensive data, inaccessible interfaces, and fear of public mistakes.

**Success criteria:** Uses the application independently, understands lesson and sync status, completes practice at an appropriate level, and returns voluntarily.

### 3.4 Parent or caregiver

**Context:** A person helping a learner discover or access reading material. A parent account, guardian consent, and progress-sharing model are not approved for the MVP.

**Needs:** Confidence that content is reviewed, age-appropriate under an approved policy, privacy-conscious, and usable on limited data.

**Frustrations:** Unsafe or low-quality material, unclear costs, excessive data use, intrusive data collection, and no indication that progress was saved.

**Success criteria:** Can help the learner get started without needing an unapproved monitoring dashboard and trusts the content and privacy controls.

### 3.5 Teacher - future persona

**Context:** An educator recommending lessons or supporting reading development. Teacher portals and classroom management are outside the MVP.

**Needs:** Curriculum or topic relevance, accessible content, clear difficulty, learner consent, and reliable aggregate insight if a future school product is approved.

**Frustrations:** Administrative burden, tools that require constant internet, unverified content, and systems that expose learner data unnecessarily.

**Success criteria:** Future criteria require a separate teacher/school PRD, role model, consent policy, and authorization design.

### 3.6 NGO programme stakeholder

**Context:** An organization supporting literacy or digital learning. The NGO is a potential adoption or content partner, not an MVP administrative role by default.

**Needs:** Offline reliability, supported-device clarity, deployable onboarding, local-language content, privacy safeguards, and evidence-based outcome reporting.

**Frustrations:** High data requirements, fragile tools, opaque data practices, and products that do not reflect local context.

**Success criteria:** Can support learner access under an approved partnership model and evaluate agreed privacy-safe measures without receiving unrestricted learner data.

### 3.7 Library stakeholder

**Context:** A public, community, school, or university library that may help learners discover Prolific or use shared connectivity. Library-specific accounts are not in the MVP.

**Needs:** Low-bandwidth access, clear device requirements, broad knowledge topics, multilingual content, and straightforward support material.

**Frustrations:** Limited devices or bandwidth, complex setup, licensing uncertainty, and content with weak source information.

**Success criteria:** Can help learners obtain verified lessons and understand offline use without managing unapproved institutional dashboards.

## 4. Core features

| Feature                    | Description                                                                                                                              | User value                                                                 | Business value                                                        | Key dependencies                                                                   | MVP status                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| Onboarding                 | Lets a guest try a limited free lesson, then explains optional free-account benefits at restricted actions.                              | Experiences core value before registration.                                | Reduces registration friction while creating a clear conversion path. | Consent, age, authentication implementation, and guest privacy.                    | Included; guest/free-account model approved.       |
| Language selection         | Filters available online lessons and registered-user downloads across English, isiZulu, and Sepedi.                                      | Finds understandable content and sees unavailable-language states clearly. | Supports South African-first positioning.                             | BCP 47 identifiers, content availability, and localization.                        | Included; three launch languages approved.         |
| Categories                 | Stable broad knowledge groupings that organize one hierarchy of topics.                                                                  | Makes the library easier to explore.                                       | Supports scalable content organization.                               | Governed taxonomy, localization, lifecycle, and eligible content.                  | Included as part of discovery.                     |
| Topics                     | Stable focused subjects within one category, optionally nested beneath another topic, that organize lessons.                             | Finds content matching an interest through simple progressive navigation.  | Improves content discovery and catalog management.                    | Acyclic same-category hierarchy, lifecycle, ordering, and learner-visible content. | Included; UI normally shows at most three levels.  |
| Lesson library             | Paginated online catalog plus a local downloaded library.                                                                                | Discovers eligible lessons and understands availability.                   | Core acquisition path to reading sessions.                            | Content API, publication rules, local package index.                               | Included.                                          |
| Lesson downloads           | Lets a registered learner transfer and verify a complete published versioned package with local audio.                                   | Reads without internet.                                                    | Differentiates the product in low-connectivity contexts.              | Account authorization, package contract, checksums, file storage, local database.  | Included for registered learners; guests excluded. |
| Tutorial voice             | Reads before practice with synchronized highlighting and allows learner-initiated replay.                                                | Receives or repeats a guided example before practising.                    | Establishes the guided-learning experience.                           | Audio format, alignment, interruption policy, `just_audio`.                        | Included; replay approved.                         |
| Silent practice            | Runs highlighting and movement without application audio.                                                                                | Practises independently at a chosen pace.                                  | Delivers the core reading-fluency value.                              | Player timing, completion policy, tokens.                                          | Included.                                          |
| Pace selection             | Offers Easy at 100 WPM, Medium at 150 WPM, and Hard at 200 WPM.                                                                          | Chooses a manageable challenge.                                            | Supports varied ability and repeat use.                               | Configurable architecture and unresolved language adjustments.                     | Included; values approved.                         |
| Lyric-style reading player | Keeps the current word or phrase highlighted and visible with playback controls and font adjustment.                                     | Focuses attention and supports smooth practice.                            | Core differentiated interaction.                                      | Tokenization, timeline, layout, audio alignment, accessibility.                    | Included.                                          |
| Progress tracking          | Registered users retain completion, reading time, words read, recent sessions, and daily streaks; guests see temporary session progress. | Trusts account progress and understands guest limitations.                 | Enables continuity, engagement, and product measurement.              | Completion rule, local-day timezone, sync contract, privacy.                       | Included; basic metrics and streaks approved.      |
| Bookmarks                  | Lets a learner save a lesson for later beyond the downloaded-library state.                                                              | Returns quickly to content of interest.                                    | May improve repeat engagement.                                        | Bookmark semantics, storage, sync, UX, privacy.                                    | Future; excluded from MVP.                         |
| Offline mode               | Lets a registered learner use previously verified downloads, local tutorial audio, practice, and durable progress without internet.      | Continues learning with no connection.                                     | Essential South African market fit.                                   | Registered account, local package/index, expiry policy, outbox.                    | Included for registered learners.                  |
| Synchronization            | Sends pending events with stable UUIDs and applies durable per-event outcomes.                                                           | Moves locally saved progress to the server safely.                         | Enables reliable cross-session data and future services.              | Authentication, outbox, idempotency, conflict/retention policy.                    | Included.                                          |
| Profile                    | Holds the minimum approved learner identity and preferences.                                                                             | Maintains a consistent personal experience.                                | Supports authorization and progress ownership.                        | Account, consent, deletion, token, and data policies.                              | Included at minimum; exact fields unresolved.      |
| Settings                   | Provides approved language, font, pace defaults, download/storage, accessibility, and account controls.                                  | Controls comfort, data, and local experience.                              | Improves usability and supportability.                                | Approved preference set, accessibility and retention policies.                     | Included only where required by MVP flows.         |

## 5. Functional requirements

Requirement identifiers are stable references for planning. Detailed transport and UI specifications may add constraints but may not weaken these rules.

### 5.1 Onboarding

**Inputs:** First-launch state, connectivity, guest or registered session state, English/isiZulu/Sepedi availability, and approved consent requirements.

**Outputs:** Locally persisted onboarding completion, selected language, guest access to a limited public lesson, and optional free-account prompts for restricted capabilities.

**Business rules:** Registration is not required before a guest tries a public lesson. Explain that a free account unlocks the complete library, permanent progress, downloads, offline reading, synchronization, history, and streaks. A restricted action displays: “Create a free account to save your progress and unlock offline reading.” Do not invent paid or social-login options.

**Validations:** Language must be English, isiZulu, or Sepedi and available in the current context. Account/consent input follows the approved policy. A guest session must not receive registered-only authorization.

**Edge cases:** First launch offline; interrupted onboarding; public lesson unavailable in a language; guest selects download/save/history/streak; failed registration/sign-in; returning registered installation with unsynced data.

**Acceptance criteria:** A connected guest can browse active categories/topics and try a limited published free lesson without registration; restricted actions show the free-account prompt; a registered offline learner reaches verified downloads; no failure deletes registered-user downloads or unsynced progress.

### 5.2 Language selection

**Inputs:** English, isiZulu, and Sepedi server availability when online; languages represented by registered-user verified downloads when offline; current preference.

**Outputs:** Locally persisted language preference and a library filtered to that language/context.

**Business rules:** English, isiZulu, and Sepedi are the only launch languages. Use documented BCP 47 tags. Content coverage may differ by language; explain unavailability and never substitute another language silently. Preserve registered-user downloads, progress, and outbox data from other languages.

**Validations:** Selection must be one of the three launch languages and exist in the presented context. Server values must match the contract.

**Edge cases:** No eligible online lessons; no downloads in the selected language; refresh failure; a previously supported language becomes unavailable.

**Acceptance criteria:** The library accurately reflects the selected language; other-language data remains intact; empty/offline states explain the next action.

### 5.3 Categories

**Inputs:** Active category data for the selected launch language, current filters, and guest/registered access mode.

**Outputs:** Ordered category options that lead to eligible topics or lessons.

**Business rules:** A Category is a stable broad knowledge grouping, not a Lesson. Guests and registered learners may browse only `ACTIVE` Categories with Effective Visibility and eligible published content. `ARCHIVED` or ancestor-ineligible taxonomy is excluded. Rename, reorder, archive, and restore preserve stable identity and history.

**Validations:** Stable UUID, Canonical Taxonomy Name, localized display name, deterministic ordering, active normalized-name uniqueness, valid lifecycle, and no unauthorized status override.

**Edge cases:** Empty category, localized name missing, category archived while browsing, duplicate pagination results.

**Acceptance criteria:** Selecting a category shows only eligible related content; empty or removed content does not expose drafts or internal errors.

### 5.4 Topics

**Inputs:** Selected category/launch language, guest/registered access mode, and paginated active topic data.

**Outputs:** Topic options and related eligible lesson summaries.

**Business rules:** Each Topic belongs to exactly one Category and may have one Parent Topic in that same Category. The hierarchy is finite and acyclic; client behavior does not assume a fixed depth, although the launch UI normally presents no more than three visible levels. Only Topics with Effective Visibility and eligible published content appear. Lesson availability still depends on publication and account eligibility.

**Validations:** Stable UUID, same-Category parent, no direct or indirect cycle, active sibling-name uniqueness after approved normalization, valid lifecycle, language availability, and deterministic ordering/pagination.

**Edge cases:** Topic has no current published lessons; parent is archived; hierarchy changes during browsing; missing localization; stale cursor; duplicate items; network failure.

**Acceptance criteria:** Nested Topics navigate without a fixed-depth client assumption; only effectively visible ancestry and eligible lessons are returned; failures preserve access to verified downloads.

### 5.5 Lesson library

**Inputs:** Connectivity, guest/registered access mode, selected language/category/topic, difficulty, pagination cursor, and registered-user local download index.

**Outputs:** Paginated online library or verified downloaded library with clear download/version states.

**Business rules:** Learner endpoints return only eligible `published` content that has passed approval. Guests receive a limited selection of published free lessons; registered learners may access the complete published library under approved eligibility. Draft, in-review, approved-but-not-published, withdrawn, and archived content are not learner-visible. An opened lesson detail remains tied to a specific Revision.

**Validations:** UUIDs, access mode, free-lesson eligibility for guests, allowed filters, cursor scope, difficulty value, publication eligibility, and safe source metadata.

**Edge cases:** Empty results, invalid/expired cursor, mid-browse publication change, package incomplete/corrupt/outdated, offline state, request failure.

**Acceptance criteria:** Catalog pagination is deterministic; a guest sees only the limited published free selection; a registered learner receives eligible full-library results; ineligible content never appears; registered-user downloads remain discoverable offline; every empty/error state is actionable.

### 5.6 Lesson downloads

**Inputs:** Explicit Lesson, Lesson Variant, and Lesson Revision identity; package descriptor; network; storage availability; expected sizes and Package/Asset Checksums.

**Outputs:** A verified offline-ready package or a recoverable failure that preserves the last valid version.

**Business rules:** A package includes the exact Lesson Revision's ordered Content Blocks, Reading Positions, schema/profile versions, metadata, attribution, Package/Asset Checksums, alignment data, and local tutorial audio. Download into isolated temporary storage, verify compatibility and integrity, then promote atomically. Never combine Revisions.

**Validations:** Required components, Lesson/Variant/Revision identity, supported Package Schema/block/profile/media semantics, content length where available, SHA-256 Package and Asset Checksums, and sufficient storage.

**Edge cases:** Cancellation, timeout, app termination, storage exhaustion, checksum mismatch, missing audio, newer version during transfer, deletion during active session.

**Acceptance criteria:** Only complete valid packages become ready; interrupted/corrupt updates do not replace the previous valid version; a ready lesson opens after restart without internet.

### 5.7 Tutorial voice

**Inputs:** Verified lesson package, local audio, matching alignment/tokens, player state, selected pace where relevant to presentation.

**Outputs:** Local narrated playback with synchronized highlight/movement and separately stored tutorial-session state.

**Business rules:** Tutorial audio reads before practice and may be replayed by the learner, including before restarting practice. Audio drives one explicit timeline. Tutorial playback is not practice and never completes the lesson.

**Validations:** Matching exact Lesson Revision, playable asset, alignment coverage, valid tutorial mode, and a replay transition that cannot be interpreted as practice completion.

**Edge cases:** Audio unavailable/corrupt, interruption, pause/restart, layout/font change, app backgrounding, audio ends early, replay request.

**Acceptance criteria:** Audio/highlight remain within approved drift; replay restarts tutorial coherently; interruption restores coherent state; any tutorial play/replay is recorded separately and never marks the lesson complete.

### 5.8 Silent practice

**Inputs:** Eligible Lesson Revision, its canonical Reading Positions and recorded profiles, selected approved pace, and practice session state.

**Outputs:** Silent application playback, highlight/movement, locally durable practice state, and completion event when eligible.

**Business rules:** Application audio stays stopped. The learner may read silently or aloud independently. Practice advances through the same Revision-scoped Reading Positions as the tutorial but is independent of audio. Completion requires practice to start, reach the final eligible Reading Position, and remain un-abandoned through that end. Pause/resume may still complete; exit/abandon before the end does not.

**Validations:** Mode must be practice; pace must be exactly Easy 100, Medium 150, or Hard 200 WPM; lesson package must be verified; position must reference the contiguous Revision sequence; completion is valid only at the final eligible position without abandonment.

**Edge cases:** Early exit, restart, interruption, font/layout change, repeated attempt, invalid completion, device clock change.

**Acceptance criteria:** No application audio plays; pace and position remain coherent; pause/resume can reach completion; early exit preserves registered-user progress without false completion; final-position completion is saved locally for a registered user or shown temporarily for a guest.

### 5.9 Pace selection

**Inputs:** Easy, Medium, or Hard preset and any future approved language adjustment.

**Outputs:** Locally retained selection and actual WPM recorded with the reading session/event.

**Business rules:** Easy is 100 WPM, Medium is 150 WPM, and Hard is 200 WPM. These defaults must be configurable later without enabling custom MVP pace selection. Do not infer a learning outcome solely from selecting a faster pace.

**Validations:** Closed three-value preset enumeration and exact default WPM mapping. No additional or custom MVP pace is valid.

**Edge cases:** Future configuration changes, language-specific adjustment not yet approved, resumed session created under an older mapping, learner changes pace mid-session.

**Acceptance criteria:** Easy produces 100 WPM, Medium 150 WPM, and Hard 200 WPM before any future approved language adjustment; session/history records retain the actual value used; custom values are unavailable.

### 5.10 Lyric-style reading player

**Inputs:** Mode, canonical content sequence, timeline, logical position, pace/audio state, viewport, font size, controls, interruption events.

**Outputs:** Highlighted current word/phrase, smooth automatic movement, accessible controls/status, and recoverable logical position.

**Business rules:** Use elapsed timeline state rather than accumulating UI ticks. Support play, pause, restart, exit, easy/medium/hard pace, font adjustment, and temporary interruption restoration.

**Validations:** Position bounds, mode/timeline agreement, package version, control transition legality, accessibility semantics.

**Edge cases:** Frame drops, orientation/layout change, large text, reduced motion, screen reader, backgrounding, low-end hardware, very long tokens or punctuation.

**Acceptance criteria:** Current content stays understandable and visible; controls result in valid state transitions; logical position survives relayout; deterministic timing tests pass within approved tolerance.

### 5.11 Progress tracking

**Inputs:** Tutorial/practice session ID, exact Lesson Revision identity, mode, pace, position, elapsed active time, completion state, and client-observed timestamp.

**Outputs:** For registered learners: durable progress, immutable outbox event, sync status, lessons completed, total reading time, total words read, recent sessions, current streak, and longest streak. For guests: temporary current-session progress only.

**Business rules:** Registered progress and its outbox event use one failure-safe local operation and client-generated UUIDs. A streak day requires at least one completed practice lesson on the learner's applicable local calendar day while timestamps remain UTC. Guests do not persist progress, history, or streaks. Tutorial and practice are separate.

**Validations:** Registered event UUIDs, lesson/session association, mode, sequence, non-negative position/time/word totals, final-position practice completion, and local-day streak qualification.

**Edge cases:** Immediate process termination, duplicate save, clock/timezone change, delayed offline sync across a local-day boundary, logout, account expiry, guest registration after a temporary session, version change, storage failure, multiple attempts.

**Acceptance criteria:** Registered-user confirmation follows local commit; restart retains registered progress/events; guest progress disappears when the app session ends; tutorial alone never completes or qualifies a streak; one or more completed practices on the same local day increase the streak by at most one day; unresolved events remain recoverable.

### 5.12 Bookmarks - future

**Inputs:** Would require learner identity, lesson ID, desired bookmark state, and optional local/sync context.

**Outputs:** Would provide a durable saved-for-later state separate from download and progress.

**Business rules:** Not defined for the MVP. Downloaded, in-progress, and bookmarked must not be treated as synonyms.

**Validations:** Require an approved feature scope, ownership/privacy model, offline behaviour, deletion rules, and contract before implementation.

**Edge cases:** Lesson archival, offline toggle, duplicate state, account deletion, cross-device conflict.

**Acceptance criteria:** None for the MVP. Future acceptance criteria require a separate approved change to scope and roadmap.

### 5.13 Offline mode

**Inputs:** Registered account state, verified package index, local preferences/progress/outbox, current connectivity hint, and future expiry-policy state.

**Outputs:** Working downloaded library, tutorial/practice experience, durable local progress, and clear pending-sync status.

**Business rules:** Offline downloads require a registered account. The app opens without network access and previously verified downloads remain usable during temporary connectivity loss, subject to future account/content-expiry policy. Only verified packages open. Guests cannot create downloads. Authentication expiry must not silently erase local data.

**Validations:** Package readiness/checksum, local schema compatibility, session eligibility under approved offline-auth policy.

**Edge cases:** Guest requests a download, first launch with no local state, corrupt package, expired registered token, future content/account expiry, no downloads, storage repair, connectivity changes mid-session.

**Acceptance criteria:** A registered returning learner can open a verified lesson, hear local tutorial audio, practise, save, close, and reopen offline; a guest receives the free-account prompt instead of a download; temporary network loss does not block a valid existing download.

### 5.14 Synchronization

**Inputs:** Device/installation identity, client request ID, local schema version, optional last successful sync/cursor, and pending immutable events with original IDs.

**Outputs:** Per-event accepted, duplicate, rejected, or retryable outcomes; server timestamp; next cursor when supported; updated acknowledged progress. Internal safe reconciliation may record conflict context without requiring a complex MVP user flow.

**Business rules:** Event ID is the idempotency key. Persist a new outcome and receipt atomically. Same ID/same payload returns the durable outcome; same ID/different canonical payload conflicts. Apply acknowledgements by event ID.

**Validations:** Authentication/ownership, UUIDs, schema/event type, batch limits, payload fingerprint, exact Lesson Revision, and safe timestamp formats.

**Edge cases:** Lost acknowledgement, mixed accepted/duplicate/rejected/retryable partial success, timeout, `429`/`5xx`, token expiry, out-of-order sequence, multiple devices, a superseded but historically valid Lesson Revision, and cursor invalidation.

**Acceptance criteria:** Retries do not duplicate sessions; partial success applies by event ID; accepted/duplicate outcomes mark only matching events synchronized; rejected/retryable/unknown events remain durable for safe handling; reading is never blocked by sync.

### 5.15 Profile

**Inputs:** Guest or free registered account/session identity, permitted preferences, and approved consent/account-management actions.

**Outputs:** No durable guest profile; minimum authorized registered learner profile and locally usable preference state.

**Business rules:** Registration is optional until an account-only capability is requested. Return only fields required by the learner workflow and protect ownership. A verified deletion request deactivates access early and begins the ADR-017 privacy workflow rather than cascading deletion; retained permitted activity may be anonymized/detached and is no longer learner-visible. Parent, teacher, NGO, library, classroom, and school roles are not inferred.

**Validations:** Guest capability restrictions, registered authentication, object authorization, field allow-list, language/preference values, and approved consent policy.

**Edge cases:** Guest-to-account conversion, offline token expiry, password recovery, deletion with unsynced data, shared device, learner age/guardian requirements.

**Acceptance criteria:** A guest can try a public lesson without a profile; a registered learner accesses only their profile; restricted guest actions prompt registration; invalid changes fail safely; deletion has explicit status and does not silently lose pending local data; completed deletion removes profile/history access.

### 5.16 Settings

**Inputs:** Approved language, font size, pace default, accessibility preferences, download/storage actions, and account controls.

**Outputs:** Validated local preferences and explicit results for destructive or server-required actions.

**Business rules:** Essential controls must work offline when local. Status cannot rely on colour alone. Destructive actions require clarity and follow retention rules. Settings cannot bypass content, authentication, or privacy policy.

**Validations:** Allowed ranges/enumerations, storage availability, authorization for account actions, and supported accessibility combinations.

**Edge cases:** Very large text, reduced motion, offline account action, deletion with pending events, unsupported language, corrupted preference state.

**Acceptance criteria:** Valid local preferences survive restart; invalid values are rejected or safely reset; pending data is not silently destroyed; accessibility controls remain usable.

## 6. Non-functional requirements

### 6.1 Performance

- The approved startup, library, player, download, sync, and API latency targets must be specified by percentile and tested on the supported device/network matrix.
- Player timing must use a monotonic/controllable timeline and meet an approved audio-highlight drift tolerance.
- Automatic movement must remain usable under expected frame pressure and large text.
- Exact numeric thresholds are release-blocking and currently unapproved.

### 6.2 Scalability

- APIs paginate collections and use deterministic ordering.
- Storage/index design must support the approved user, lesson, download, session, event, and administrative-audit volumes.
- Synchronization uses bounded batches and idempotency retention longer than the supported offline delay.
- Capacity targets, growth model, batch limits, and load-test thresholds remain unapproved.

### 6.3 Reliability

- A verified lesson remains usable without internet.
- Progress and its outbox event are written atomically.
- Failed downloads preserve the last verified version; failed sync attempts preserve local events.
- Backups, restore, migrations, rollback, and incident recovery must be exercised before release.
- Availability, recovery-time, recovery-point, and crash-free targets remain unapproved; silent progress loss is never acceptable.

### 6.4 Accessibility

- Essential actions and statuses must not depend only on colour, motion, sound, gesture, or time pressure.
- Support screen readers, semantic labels, keyboard/focus behaviour where applicable, dynamic/large text, contrast, reduced motion, and alternatives for audio-dependent instruction.
- Font changes preserve logical reading position.
- The target standard/version, test matrix, and numeric conformance gates require approval.

### 6.5 Security and privacy

- Validate all external input and enforce object/action authorization.
- Use access and refresh tokens under an approved storage, rotation, revocation, and reuse policy.
- Never expose stack traces, SQL, internal hostnames, tokens, secrets, or unnecessary learner data.
- Encrypt production traffic and protect tokens, local data, backups, events, and administrative sessions according to approved classifications.
- Assess POPIA applicability, learner age/consent, retention, deletion, export, data residency, subprocessors, and incident obligations with accountable owners.
- Follow [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md): separate identity/activity, prohibit destructive historical cascades, retain minimal Privacy Action evidence, and distinguish deactivation, archive, withdrawal, anonymization, and purge without claiming legal compliance.
- Content ingestion uses a distinct Service Actor with draft-only authority. Human Review Decisions and publication require authorized Administrative Actors; author self-approval is denied by default.
- Guest analytics are limited to category/topic views, lesson starts/completions, player errors, and performance events through a non-identifying session/device identifier. Do not collect guest PII without deliberate registration or consent. Provider, retention, safeguarding, and deletion rules require privacy review.

### 6.6 Maintainability

- Respect documented presentation/application/domain/data and controller/service/repository boundaries once architecture documents are approved.
- Keep controllers thin and persistence behind repositories.
- Maintain OpenAPI and shared contracts without drift.
- Record material technology changes in ADRs.
- Require automated formatting, analysis, tests, and builds for implemented components.

### 6.7 Observability

- Return and log a safe request/correlation ID on API success and error responses.
- Record operation, outcome, duration, and safe resource identifiers without logging raw tokens or unnecessary learner/sync content.
- Distinguish liveness, readiness, client crashes, download failures, sync outcomes, and administrative audit events.
- Monitoring, alert thresholds, crash-reporting provider, privacy controls, and retention remain unapproved.

### 6.8 Offline capability

- Registered-user application startup, downloaded-library access, local tutorial audio, silent practice, preference use, progress writes, and outbox queuing work without internet.
- Guests may try online public lessons but cannot download lessons or persist progress for offline use.
- New discovery, new downloads, server account changes, publication refresh, and synchronization acknowledgement require connectivity.
- Connectivity signals are hints, not proof that the API is reachable.

### 6.9 Localization

- MVP lesson languages are English, isiZulu, and Sepedi and use documented BCP 47 tags.
- Interface strings, status language, accessibility labels, and content metadata must be localizable rather than embedded in business logic.
- Tokenization, pace, audio alignment, typography, and layout must be validated per approved language.
- Translation workflow, fallback rules, review ownership, language-specific pacing, and quality thresholds remain unapproved. The architecture must support later South African language expansion.

## 7. MVP scope

### Included

- Guest access to active categories/topics, a limited selection of published free lessons, tutorial/replay, silent practice, and temporary current-session progress.
- Optional free learner registration/sign-in, durable progress, full-library eligibility, offline downloads, synchronization, history, and streaks.
- English, isiZulu, and Sepedi language selection; category, topic, lesson, difficulty, and pace selection.
- Paginated published learner-visible library with guest/free-lesson restrictions.
- Registered-user verified offline lesson packages with local tutorial audio.
- Tutorial mode with synchronized highlighting and learner-initiated replay.
- Silent practice with pace-controlled highlighting/movement.
- Easy 100 WPM, Medium 150 WPM, and Hard 200 WPM default presets.
- Play, pause, restart, exit, font adjustment, and supported interruption restoration.
- Separate local tutorial and practice sessions.
- Registered-user local-first progress/outbox persistence and basic progress totals, recent sessions, current streak, and longest streak.
- Idempotent delayed synchronization with partial accepted, duplicate, rejected, and retryable per-event outcomes.
- Minimum learner profile/settings required by the approved flows.
- Controlled content ingestion as draft and authorized administration lifecycle.
- PostgreSQL, versioned REST API, OpenAPI, Docker development services, testing, security, accessibility, and operational foundations.

### Not included

- Bookmarks.
- Achievements, badges, points, leaderboards, competitive rankings, and social gamification. Basic daily streaks are included.
- Teacher, classroom, school, guardian, or district portals.
- Social feeds, chat, comments, learner messaging, reading clubs, and community challenges.
- Live AI in the learner experience or AI-generated content as an MVP dependency.
- Speech recognition, pronunciation scoring, automated translation, or microphone recording.
- Payments, advertising, marketplace, personalized recommendation engines, push/email marketing, and external LMS/identity integrations.
- Learner web/desktop reader and advanced business intelligence.

### Future features

Future candidates include bookmarks, teacher/school services, parent/guardian experiences, reading clubs, badges/achievements/leaderboards, community challenges, AI-assisted content with human governance, expanded audio library, content marketplace, web reader, advanced institutional reporting, custom paces, and additional languages/countries. Each requires separate approval and cannot bypass content review, privacy, accessibility, or offline rules.

## 8. Success metrics

Metric collection must be privacy-minimized, documented, and resilient to delayed offline synchronization. Product reporting distinguishes the client-observed event time from server receipt time.

| KPI                       | Definition                                                                                                                         | Reporting considerations                                                                  | Target status                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Daily active users        | Unique registered learners plus separately reported non-identifying guest sessions/installations with qualifying activity per day. | Do not merge guest identifiers with people; define shared devices and late events.        | Target unapproved.                                       |
| Lessons completed         | Count of practice completions meeting the approved rule; tutorial completion alone is excluded.                                    | Deduplicate by event/session identity and report by event time with late-sync adjustment. | Target unapproved.                                       |
| Average reading sessions  | Qualifying tutorial plus practice sessions per active learner over the reporting period, also reported separately by mode.         | Define abandoned/very-short session treatment.                                            | Target unapproved.                                       |
| Completion rate           | Eligible practice completions divided by approved practice starts within a defined window.                                         | Window, denominator, retry/repeated-attempt rules require approval.                       | Target unapproved.                                       |
| Lesson downloads          | Number and success rate of packages promoted to verified offline-ready state.                                                      | Separate attempts, verified successes, updates, corruption, and cancellations.            | Target unapproved.                                       |
| Offline usage             | Share of qualifying reading sessions started without API reachability and completed using a verified local package.                | Connectivity definition and delayed sync reconciliation require approval.                 | Target unapproved.                                       |
| Retention                 | Percentage of a defined new-user cohort active on D1, D7, and D30 or approved alternatives.                                        | Cohort event, timezone, guest/account rules, and late events require approval.            | Target unapproved.                                       |
| Crash-free sessions       | Application sessions without an unhandled crash divided by measured sessions.                                                      | Provider, consent, offline upload, platform coverage, and target require approval.        | Target unapproved.                                       |
| Local save reliability    | Qualifying progress writes whose local transaction succeeds without data loss.                                                     | Failure injection and support telemetry must avoid sensitive payloads.                    | Zero silent data-loss incidents; rate target unapproved. |
| Sync recovery             | Pending events eventually reaching accepted/duplicate outcome after retry.                                                         | Report retryable, rejected, reconciliation cases, age, and abandonment separately.        | Target unapproved.                                       |
| Language/content coverage | Published, reviewed lesson count and completion by approved language/category/topic.                                               | Minimum inventory and quality rubric require approval.                                    | Target unapproved.                                       |
| Current/longest streaks   | Consecutive local calendar days with at least one completed practice lesson for registered learners.                               | Define timezone source/change, delayed offline sync, and anti-manipulation behaviour.     | Qualification rule approved; target unapproved.          |

Numeric targets, baselines, owners, data definitions, collection consent, retention, and dashboards must be approved before they become release gates.

## 9. Risks and mitigations

| Risk                                                | Type               | Impact                                                               | Mitigation                                                                                                                            |
| --------------------------------------------------- | ------------------ | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Launch age/device audience remains undefined.       | Product            | Consent, accessibility, and device decisions cannot be finalized.    | Approve ages, literacy profiles, safeguarding, and supported matrix before affected implementation.                                   |
| Fixed default paces need language adjustment.       | Product/technical  | 100/150/200 WPM may feel unnatural in one launch language.           | Validate English, isiZulu, and Sepedi; retain approved defaults until an adjustment is separately approved.                           |
| Tutorial and practice are conflated.                | Product/data       | Audio listening falsely appears as reading completion.               | Keep explicit modes/sessions/events and test completion boundaries.                                                                   |
| Partial or mismatched downloads appear ready.       | Technical          | Offline reading fails or audio/text drift.                           | Temporary Revision-specific storage, completeness/checksum validation, atomic promotion, and preservation of the last valid Revision. |
| Progress event loss.                                | Technical          | Learner trust and data integrity failure.                            | Atomic progress-plus-outbox transaction, restart/termination tests, never delete before durable acknowledgement.                      |
| Duplicate or out-of-order sync.                     | Technical          | Duplicate sessions or incorrect summaries.                           | Stable event UUIDs, canonical fingerprints, atomic receipts/outcomes, per-event results, explicit conflict policy.                    |
| Multiple-device conflicts are unresolved.           | Product/technical  | Inconsistent progress and silent overwrites.                         | Preserve provenance; prohibit device-clock last-write-wins; approve deterministic reconciliation before sync release.                 |
| Authentication expiry blocks offline learners.      | Product/security   | Learners lose access or fear data loss.                              | Define offline-authentication and reauthentication policy; never silently erase downloads/events.                                     |
| Child/learner privacy obligations are unclear.      | Legal/security     | Harm, non-compliance, and launch blockage.                           | Complete POPIA/age/consent/data-classification review with accountable legal/privacy owners.                                          |
| Content quality or sources are weak.                | Product/reputation | Learners receive incorrect or unsuitable knowledge.                  | Required source metadata, validation, human review, separate approval/publication, audit trail, correction/version policy.            |
| Accessibility is delayed until polish.              | Product/technical  | Core player becomes unusable for some learners and expensive to fix. | Define accessibility acceptance early and test semantics, text scaling, contrast, reduced motion, and audio alternatives throughout.  |
| Low-end device/storage constraints.                 | Technical/product  | Downloads/player fail for intended users.                            | Approve representative device matrix, storage limits, package budgets, performance tests, and user-controlled deletion.               |
| Metric targets are invented or gamed.               | Product            | Misleading decisions and privacy overcollection.                     | Approve definitions, baselines, owners, counter-metrics, and privacy controls before targets.                                         |
| Scope expands through future personas/features.     | Delivery           | MVP delay and architecture churn.                                    | Preserve explicit MVP statuses; require PRD/roadmap/ADR change for expansion.                                                         |
| Guest analytics identify or over-track people.      | Privacy/product    | Privacy harm and loss of trust before registration.                  | Use a non-identifying session/device ID, minimize events, avoid PII, and complete consent/retention/safeguarding review.              |
| Streaks are wrong across timezones or delayed sync. | Product/data       | Learners unfairly lose or gain streak days.                          | Store UTC, define applicable local day/timezone rules, test timezone change and delayed offline completion before implementation.     |

## 10. Decisions and assumptions

### 10.1 Confirmed decisions

- Prolific is mobile first, offline first, and South African first.
- Flutter/Dart is the mobile technology; NestJS/TypeScript is the backend; PostgreSQL is the primary database.
- Public API routes use `/api/v1`; offline-created identifiers use UUIDs; payload timestamps use UTC ISO 8601.
- Mobile networking uses Dio; local tutorial playback uses `just_audio`.
- The MVP supports guest trial and optional free learner registration. Guests receive only the approved limited public experience; durable progress, downloads, synchronization, history, and streaks require an account.
- MVP launch languages are English, isiZulu, and Sepedi; content availability may differ by language.
- Downloaded lessons identify the stable Lesson, Language/Difficulty Lesson Variant, and exact immutable Lesson Revision and include matching Content Blocks, Reading Positions, profiles, metadata, attribution, SHA-256 integrity values, alignment, and local audio.
- Easy is 100 WPM, Medium is 150 WPM, and Hard is 200 WPM; custom paces are post-MVP.
- Tutorial audio reads before practice and may be replayed; application audio is silent during practice.
- A lesson completes only when practice reaches the final supported position without abandonment. Tutorial playback never completes it.
- Registered progress includes lessons completed, total reading time, total words read, recent sessions, current streak, and longest streak. One completed practice lesson qualifies a local calendar day.
- Progress is written locally first; pending events remain in an outbox; retries are idempotent.
- Synchronization supports accepted, duplicate, rejected, and retryable per-event outcomes and partial success.
- The content engine produces drafts and cannot publish directly.
- Learner-visible content must be published after passing approval; draft, in-review, approved-but-unpublished, and archived content are hidden.
- Live AI calls in the learner experience and AI-generated content as an MVP dependency are excluded.

### 10.2 Planning assumptions requiring validation

- Candidate primary segments will find short knowledge lessons motivating enough to practise repeatedly.
- Intended learners have access to a supported mobile device with enough storage for at least one complete lesson package.
- Local tutorial audio can be produced and reviewed for approved launch languages within content budgets.
- Organizations such as NGOs and libraries may support adoption without requiring institutional product roles in the MVP.
- Essential profile/settings can remain minimal until account, consent, and deletion policies are approved.
- Privacy-safe delayed event data can support useful product metrics without collecting unnecessary learner content.

### 10.3 Unresolved decisions

- Launch ages, literacy profiles, operating systems, minimum devices, and lesson inventory per English/isiZulu/Sepedi.
- Authentication provider, password recovery, consent/safeguarding, exact deletion timeframe/legal basis/retention periods/anonymization method, and detailed offline account-expiry policies. The history-safe boundary is approved by ADR-017.
- Exact administrative authentication/RBAC implementation, production capability assignments, self-approval exception configuration, audit access, and note retention. Content Author/Reviewer/Publisher/Platform Administrator boundaries and published-only learner visibility are resolved by ADR-015.
- Exact Language-specific tokenization profiles/test corpora, alignment generation, pacing adjustments, interruption/background handling, and timing tolerances. The block, Reading Position, profile-version, checksum, and package boundaries are resolved by ADR-014; pace defaults, replay, and practice completion are resolved by ADR-011.
- Flutter state management and local database; exact Prisma implementation details; object/file storage; audio format. Prisma ORM and Prisma Migrate are approved for Core API persistence by [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md).
- Sync batch/retry/retention/cursor and detailed multiple-device reconciliation. Complex user-facing conflict resolution is not an MVP requirement.
- Streak timezone source/change and delayed-offline-sync rules beyond one completion per local day.
- Accessibility standard, measurable non-functional targets, success-metric targets, guest analytics provider, consent, retention, and deletion governance.
- Source-quality rubric, moderation workflow, lesson image support, and source-attribution display.

## 11. Out of scope for the MVP

- Live AI lesson generation or any live AI learner interaction.
- AI-generated content as a release dependency.
- Direct publication by the content engine.
- Teacher dashboard, school dashboard, classroom management, guardian portal, or district portal.
- Bookmarks and expanded personal statistics.
- Speech recognition, pronunciation scoring, learner microphone recording, and automated translation.
- Social networking, feeds, chat, comments, messaging, reading clubs, and community challenges.
- Points, badges, achievements, leaderboards, competitions, social challenges, and broad gamification. Basic current/longest daily streaks remain included.
- Personalized recommendations or adaptive difficulty driven by learner analytics.
- Payments, subscriptions, advertising, marketplace, and marketing automation.
- Push notifications and email campaigns.
- User-authored/publicly submitted lessons.
- Learner-facing web or desktop application.
- External LMS or identity-provider integrations.
- Advanced BI, cohort dashboards, and custom report builders.
- Guaranteed simultaneous multi-device merging beyond the approved MVP conflict policy.
- Streaming-only lesson playback that prevents full offline use.

Security, privacy, accessibility, observability, backup, recovery, content integrity, and data integrity are mandatory release work and are not out of scope.

## 12. Glossary and terminology

The [Domain Glossary](../02-requirements/domain-glossary.md) is the canonical short-form terminology reference and is aligned with the [Canonical Domain Model](../architecture/canonical-domain-model.md). Both remain draft until Architecture Gate 001 review. This PRD, the [MVP Scope](../02-requirements/mvp-scope.md), [User Flows](../04-ui-ux-design/user-flows.md), and [API Overview](../08-api-specification/api-overview.md) must use the same meanings.

Terminology constraints:

- A Lesson is the stable educational identity; a Lesson Variant is one Language/Difficulty stream; a Lesson Revision is one exact immutable published snapshot. “Lesson Version” is superseded terminology.
- A verified lesson package is the complete offline unit; a partial transfer is not a download.
- Tutorial session and practice session are distinct reading-session modes.
- A progress event records local reading progress; an outbox event is its durable pending synchronization representation.
- Approved means review passed; published means deliberately released to learner endpoints. Published content must have passed approval.
- Review Submission, Review Decision, Publication Record, and later visibility actions are immutable audit evidence tied to stable Administrative or Service Actor references; learner APIs/packages exclude internal details.
- Synchronized means the server durably acknowledged the event, not merely that a request was sent.

Changes to these meanings require coordinated updates to the glossary, canonical model, PRD, and every affected source document.

## 13. PRD approval gates

Before this approval-ready product baseline is considered fully approved:

- Product owners approve launch ages/literacy profiles, lesson inventory, and numeric MVP success targets. Guest/free-account access, three launch languages, pace defaults, replay, completion, progress/streaks, downloads, synchronization outcomes, lifecycle, and AI boundaries are already approved by [ADR-011](../decisions/ADR-011-mvp-product-access-and-reading-rules.md).
- Privacy/security owners approve learner data, consent, retention, deletion, telemetry, and POPIA-related requirements.
- Content owners approve taxonomy, source-quality, difficulty, language review, and publication rules.
- Design/accessibility owners approve the supported accessibility standard and critical user-flow criteria.
- Engineering owners confirm feasibility against the completed Sprint 1 architecture, ERD, ADRs, and shared contracts.
- Related source documents are reconciled with ADR-011, including published-only visibility and per-event retryable synchronization.
- The canonical domain model, glossary, and conceptual ERD pass Architecture Gate 001 or receive an approved conditional outcome.
