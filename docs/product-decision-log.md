# Prolific Platform Product Decision Log

## Purpose

This log records why approved Prolific product behaviour exists. It complements Architecture Decision Records (ADRs): product decisions define the experience and policy the platform must deliver, while ADRs define how the software is designed to deliver it.

The [Product Requirements Document](./01-product-vision/product-requirements-document.md) remains the primary functional specification. This log provides decision history and rationale; it does not replace acceptance criteria, architecture, security, privacy, or implementation specifications.

## Decision status vocabulary

- **Proposed:** Under consideration and not authoritative.
- **Approved:** Authoritative product behaviour.
- **Superseded:** Replaced by a later approved product decision.
- **Withdrawn:** Rejected before approval or intentionally removed without a replacement.

## Approved decisions

### PD-001: Guest mode exists

- **Decision ID:** PD-001
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** People may try Prolific as guests before creating an account. Guest mode includes active category/topic browsing, a limited selection of published free lessons, tutorial playback and replay, silent practice, and temporary progress for the current application session.
- **Reason:** People should experience the core reading value before deciding whether to register. This reduces account friction while preserving a clear path to durable and offline capabilities.
- **Alternatives considered:** Require registration before any lesson; provide only a non-interactive preview; remove guest access entirely.
- **Consequences:** Public catalog and free-lesson access must work without an account. Guest state must remain visibly temporary, and presentation and authorization must distinguish guests from registered learners.
- **Related PRD sections:** [1. Executive summary](./01-product-vision/product-requirements-document.md#1-executive-summary), [4. Core features](./01-product-vision/product-requirements-document.md#4-core-features), [5.1 Onboarding](./01-product-vision/product-requirements-document.md#51-onboarding)
- **Related ADRs:** [ADR-011: MVP Product Access and Reading Rules](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-002: Guest capabilities are restricted

- **Decision ID:** PD-002
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Guests cannot access the complete lesson library, download lessons, save progress permanently, synchronize progress, maintain streaks, use account history, receive personal recommendations, or access future bookmark or achievement features.
- **Reason:** Durable progress, downloads, synchronization, and personalization require stable ownership and recovery boundaries. Guest mode is a trial of the core experience, not an anonymous substitute for an account.
- **Alternatives considered:** Give guests every registered capability using device-local identity; permit downloads without an account; persist guest history indefinitely.
- **Consequences:** Restricted actions must show the free-account prompt documented in the PRD. Guest progress must not be represented as durable, synchronized, or recoverable account data.
- **Related PRD sections:** [5.1 Onboarding](./01-product-vision/product-requirements-document.md#51-onboarding), [5.6 Lesson downloads](./01-product-vision/product-requirements-document.md#56-lesson-downloads), [5.11 Progress tracking](./01-product-vision/product-requirements-document.md#511-progress-tracking), [5.13 Offline mode](./01-product-vision/product-requirements-document.md#513-offline-mode)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-003: The MVP uses an optional free-account model

- **Decision ID:** PD-003
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Registration is optional until a person requests account-only capabilities. The MVP supports free registration and sign-in; no paid tier, subscription, or social-login model is approved.
- **Reason:** An optional free account preserves low-friction product trial while giving learners a clear way to retain progress, download lessons, synchronize, and maintain history and streaks.
- **Alternatives considered:** Mandatory registration at first launch; paid access tiers; social-login-only registration; a permanently anonymous product.
- **Consequences:** Onboarding must not block public lesson trial. Authentication implementation remains a separate unresolved technical decision, and documentation must not imply paid or social options.
- **Related PRD sections:** [5.1 Onboarding](./01-product-vision/product-requirements-document.md#51-onboarding), [5.15 Profile](./01-product-vision/product-requirements-document.md#515-profile), [7. MVP scope](./01-product-vision/product-requirements-document.md#7-mvp-scope)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-004: The MVP launches in three languages

- **Decision ID:** PD-004
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** The MVP launch languages are English, isiZulu, and Sepedi. Content availability may differ by language, and the platform must remain extensible to additional South African languages after the MVP.
- **Reason:** The launch set makes the South African-first product principle concrete while keeping initial content preparation and review bounded.
- **Alternatives considered:** English-only launch; require every lesson in all three languages; launch with all South African languages immediately.
- **Consequences:** Language availability must be communicated honestly, and no lesson may be silently substituted from another language. Content, localization, and architecture must not assume identical inventories across languages.
- **Related PRD sections:** [2. Product goals](./01-product-vision/product-requirements-document.md#2-product-goals), [5.2 Language selection](./01-product-vision/product-requirements-document.md#52-language-selection), [6.9 Localization](./01-product-vision/product-requirements-document.md#69-localization)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-005: The MVP uses three reading-pace presets

- **Decision ID:** PD-005
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Easy is 100 words per minute, Medium is 150 words per minute, and Hard is 200 words per minute. These are default MVP values; custom pace selection is post-MVP.
- **Reason:** Three named presets offer understandable choice and deterministic player behaviour without the complexity of arbitrary pace configuration.
- **Alternatives considered:** A custom WPM slider; more or fewer presets; unlabelled pace values; one fixed pace.
- **Consequences:** Player and session records must retain the selected preset and actual WPM. The design must allow future approved configuration, while language-specific adjustments remain unresolved.
- **Related PRD sections:** [4. Core features](./01-product-vision/product-requirements-document.md#4-core-features), [5.9 Pace selection](./01-product-vision/product-requirements-document.md#59-pace-selection), [10. Decisions and assumptions](./01-product-vision/product-requirements-document.md#10-decisions-and-assumptions)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-006: Tutorial playback precedes application-silent practice

- **Decision ID:** PD-006
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Tutorial audio plays once by default before practice with synchronized highlighting or advancement. Learner-initiated replay is allowed. During practice, the application produces no tutorial audio; the learner may read aloud independently.
- **Reason:** The tutorial demonstrates the lesson before independent reading, while replay supports learners who need another example. Removing application audio during practice preserves the distinction between guided listening and learner practice.
- **Alternatives considered:** Disable replay; continue tutorial audio during practice; make tutorial and practice one undifferentiated mode; require the learner to remain physically silent.
- **Consequences:** Replay must remain a tutorial state and must never create practice completion. The player needs explicit tutorial/practice transitions and must prevent application audio from continuing into practice.
- **Related PRD sections:** [5.7 Tutorial voice](./01-product-vision/product-requirements-document.md#57-tutorial-voice), [5.8 Silent practice](./01-product-vision/product-requirements-document.md#58-silent-practice), [5.10 Lyric-style reading player](./01-product-vision/product-requirements-document.md#510-lyric-style-reading-player)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-007: Only eligible practice completes a lesson

- **Decision ID:** PD-007
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** A lesson completes only after practice has started, reaches the final eligible Reading Position, and is not abandoned or exited before that end. Tutorial playback or replay never completes a lesson. Pause and resume may still lead to completion.
- **Reason:** Completion must represent learner practice rather than passive tutorial listening or a partially attempted session.
- **Alternatives considered:** Complete a lesson when tutorial audio ends; use a partial-position threshold; count lesson opening or time spent alone; treat tutorial and practice completion as equivalent.
- **Consequences:** Tutorial and practice require separate session states. Completion validation must use the practice mode and canonical final position; interruption tolerance and background timing remain separate architecture decisions.
- **Related PRD sections:** [5.7 Tutorial voice](./01-product-vision/product-requirements-document.md#57-tutorial-voice), [5.8 Silent practice](./01-product-vision/product-requirements-document.md#58-silent-practice), [5.11 Progress tracking](./01-product-vision/product-requirements-document.md#511-progress-tracking)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-008: Offline downloads require a registered account

- **Decision ID:** PD-008
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Only registered learners may download published lesson packages for offline use. Verified downloads remain usable during temporary connectivity loss, subject to future account and content-expiry policies.
- **Reason:** Offline packages and durable offline progress need an account entitlement and ownership boundary while guest mode remains a limited trial.
- **Alternatives considered:** Permit anonymous downloads; make all lessons streaming-only; require connectivity for every lesson opening.
- **Consequences:** Guests requesting a download receive the free-account prompt. Registered learners must be able to use verified text, metadata, alignment, and local tutorial audio offline and synchronize progress later.
- **Related PRD sections:** [5.6 Lesson downloads](./01-product-vision/product-requirements-document.md#56-lesson-downloads), [5.13 Offline mode](./01-product-vision/product-requirements-document.md#513-offline-mode), [6.8 Offline capability](./01-product-vision/product-requirements-document.md#68-offline-capability)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-009: Only published lessons are learner-visible

- **Decision ID:** PD-009
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Lesson content follows `draft` to `in_review` to `approved` to `published` to `archived`. Only `published` lessons are learner-visible; approval alone does not publish a lesson. Imported, generated, translated, or adapted content requires human review, and the content engine cannot publish directly.
- **Reason:** Review approval and deliberate release are separate controls. This protects content quality, source integrity, and operational control over what learners can discover.
- **Alternatives considered:** Make approved content immediately visible; allow draft previews in the learner catalog; let the content engine publish directly; use one combined approval/publication state.
- **Consequences:** Learner catalog queries exclude draft, in-review, approved-only, withdrawn, and archived content and also exclude Lessons beneath taxonomy without Effective Visibility. Administration uses immutable submissions/decisions/publication evidence, stable actor references, and an authorized publication transition; Service Actors remain draft-only. Taxonomy behavior is an architecture/domain integrity decision recorded in ADR-016, not a new product decision.
- **Related PRD sections:** [5.5 Lesson library](./01-product-vision/product-requirements-document.md#55-lesson-library), [7. MVP scope](./01-product-vision/product-requirements-document.md#7-mvp-scope), [10. Decisions and assumptions](./01-product-vision/product-requirements-document.md#10-decisions-and-assumptions)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md), [ADR-015](./decisions/ADR-015-persist-editorial-workflow-and-admin-actor-audit.md), [ADR-016](./decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md)

### PD-010: Live AI is excluded from the MVP learner experience

- **Decision ID:** PD-010
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Normal MVP reading must not require live AI. Future AI-assisted content may be generated outside the learner flow only when it is human-reviewed, stored, and published through the ordinary content lifecycle. Pronunciation scoring, speech analysis, and live tutoring are post-MVP.
- **Reason:** Stored, reviewed content protects offline reliability, predictable learner behaviour, content quality, and publication governance.
- **Alternatives considered:** Generate lessons live in the learner application; use live AI tutoring or pronunciation analysis in the MVP; prohibit any future AI-assisted content workflow.
- **Consequences:** The learner experience has no runtime dependency on an AI service. AI-assisted material, if later approved, cannot bypass human review or publication controls.
- **Related PRD sections:** [1. Executive summary](./01-product-vision/product-requirements-document.md#1-executive-summary), [7. MVP scope](./01-product-vision/product-requirements-document.md#7-mvp-scope), [11. Out of scope for the MVP](./01-product-vision/product-requirements-document.md#11-out-of-scope-for-the-mvp)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-011: Simple daily streaks are included in the MVP

- **Decision ID:** PD-011
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Registered learners receive current and longest daily streaks. A qualifying local calendar day contains at least one completed practice lesson. Badges, achievements, leaderboards, social challenges, and competitive rankings are deferred.
- **Reason:** A simple streak supports a daily reading habit without expanding the MVP into a broad or competitive gamification system.
- **Alternatives considered:** Exclude streaks entirely; include a complete achievements and badges system; use points or leaderboards as the primary engagement model.
- **Consequences:** Progress must distinguish qualifying practice completion and calculate local days while storing timestamps in UTC. Timezone-change and delayed-sync policy remain unresolved and must be decided before implementation.
- **Related PRD sections:** [5.11 Progress tracking](./01-product-vision/product-requirements-document.md#511-progress-tracking), [7. MVP scope](./01-product-vision/product-requirements-document.md#7-mvp-scope), [8. Success metrics](./01-product-vision/product-requirements-document.md#8-success-metrics)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-012: Bookmarks are post-MVP

- **Decision ID:** PD-012
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** Bookmarks are excluded from the MVP and retained only as a possible future capability.
- **Reason:** Bookmarks add storage, synchronization, ownership, and user-experience requirements that are not necessary to validate the MVP reading journey.
- **Alternatives considered:** Include synchronized bookmarks in the MVP; provide device-only bookmarks; remove bookmarks from all future consideration.
- **Consequences:** MVP scope, progress, and synchronization models must not require bookmark state. Future bookmark work requires separate approval and requirements.
- **Related PRD sections:** [4. Core features](./01-product-vision/product-requirements-document.md#4-core-features), [5.12 Bookmarks - future](./01-product-vision/product-requirements-document.md#512-bookmarks---future), [7. MVP scope](./01-product-vision/product-requirements-document.md#7-mvp-scope)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md)

### PD-013: Guest analytics are anonymous and limited

- **Decision ID:** PD-013
- **Status:** Approved
- **Date:** YYYY-MM-DD
- **Decision:** The MVP may collect limited guest analytics for category/topic views, lesson starts/completions, reading-player errors, and application performance using a non-identifying device or session identifier. Personally identifying information requires deliberate registration or consent.
- **Reason:** Limited analytics help evaluate the guest journey and product reliability without treating an unregistered person as an identified learner.
- **Alternatives considered:** Collect no guest analytics; collect the same identified profile as a registered learner; use unrestricted device fingerprinting or third-party tracking.
- **Consequences:** Guest telemetry must be data-minimized and separated from authenticated learner identity. Provider, consent, child safeguarding, retention, deletion, and identifier lifecycle require privacy and security approval.
- **Related PRD sections:** [6.5 Security and privacy](./01-product-vision/product-requirements-document.md#65-security-and-privacy), [6.7 Observability](./01-product-vision/product-requirements-document.md#67-observability), [8. Success metrics](./01-product-vision/product-requirements-document.md#8-success-metrics)
- **Related ADRs:** [ADR-011](./decisions/ADR-011-mvp-product-access-and-reading-rules.md), [ADR-017](./decisions/ADR-017-use-history-safe-deletion-and-anonymization.md)

## Approved first-migration governance decisions

These FPSD records define approved product/governance constraints for the first physical schema. The detailed evidence history remains in the [First Physical Schema Decision Register](./reviews/FIRST-PHYSICAL-SCHEMA-OPEN-DECISIONS.md).

### FPSD-009: Launch content-language identities

- **Status:** Approved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Decision:** The three launch content-language records are English (`en-ZA`, ISO basis `eng`, order 1), isiZulu (`zu-ZA`, ISO basis `zul`, order 2), and Sepedi (`nso-ZA`, ISO basis `nso`, order 3). Canonical labels and tags are independently stored. Migration one does not infer or enable interface-language support.
- **Consequences:** The production reference-data proposal contains exactly these three active content languages. Interface localization remains a separate decision.
- **Implementation conditions:** Enforce exact tag and ISO-basis relationships, deterministic ordering, immutable Language identity, and the explicit absence of an interface-language flag in migration one.
- **Evidence:** [Seed proposal](./07-database/first-seed-data-proposal.md), [schema decision brief](./reviews/FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md), and the supplied Sprint 2.6 decision package.

### FPSD-010: Governance-owned Language UUIDs

- **Status:** Approved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Decision:** Prolific platform governance owns these immutable UUIDv4 reference identities: English `b59a72c2-bb1d-43e2-b0ab-b3d7fdd08890`; isiZulu `70776e42-a5fa-4c85-8c00-ba1cac8dcbac`; Sepedi `0bee1a85-35bf-4096-ac2a-b6ac12c58382`.
- **Consequences:** Every environment and future approved seed must use the same values.
- **Implementation conditions:** Never regenerate the values per environment, never reassign a retired UUID, and never replace a UUID after reference.
- **Evidence:** [Seed proposal](./07-database/first-seed-data-proposal.md), [decision register](./reviews/FIRST-PHYSICAL-SCHEMA-OPEN-DECISIONS.md), and the supplied Sprint 2.6 decision package.

### FPSD-013: Taxonomy lifecycle

- **Status:** Approved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Decision:** Category and Topic have exactly two conceptual lifecycle values: `ACTIVE` and `ARCHIVED`. There is no `DELETED` state; withdrawal is not a taxonomy state. Archive is reversible.
- **Consequences:** Archived ancestry affects Effective Visibility without rewriting descendants. Restoration must revalidate uniqueness, parent validity, Category consistency, and Effective Visibility.
- **Implementation conditions:** Default new Category/Topic state to `ACTIVE`, record archive time, apply optimistic concurrency, and do not add an actor-principal lifecycle enum or unused actor lifecycle field.
- **Evidence:** [Physical schema proposal](./07-database/first-physical-schema-proposal.md), [ADR-016](./decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md), and the supplied Sprint 2.6 decision package.

### FPSD-014: Database privilege separation

- **Status:** Approved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Decision:** Separate a controlled migration role, least-privilege application role, optional explicitly scoped read-only operational role, and reserved database owner/admin role. NestJS never uses migration, owner, admin, or superuser credentials.
- **Consequences:** Migration and runtime secrets are separate; taxonomy writes remain behind the approved repository/application-service boundary.
- **Implementation conditions:** Supply secrets through deployment secret management, prohibit schema/role/extension administration from the application role, deny restricted audit access by default to operational readers, and prove production parity with privilege tests before deployment.
- **Evidence:** [Database Privilege Model](./07-database/database-privilege-model.md), [ADR-012](./decisions/ADR-012-use-prisma-for-core-api-persistence.md), and the supplied Sprint 2.6 decision package.

## Approved multidisciplinary schema amendments

The following supplied human decisions approve proposal amendments only. They do not constitute any of the five final physical-schema reviewer approvals and do not authorize Prisma models, migrations, SQL, roles, privileges, seeds, or database objects.

| Supplied decision              | Approved product/governance effect                                                                                                                                                            | Evidence                                                                                                                   |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| MDR-BE-001                     | Permit one narrowly scoped, parameterized Category-row locking primitive inside the taxonomy persistence adapter and Prisma interactive transaction; unrestricted raw SQL remains prohibited. | [Physical proposal raw-query policy](./07-database/first-physical-schema-proposal.md#taxonomy-raw-query-locking-exception) |
| MDR-DD-001                     | Audit rows populate exactly one nullable Category/Topic target FK and derive target type; no `target_type` field.                                                                             | [Audit definition](./07-database/first-physical-schema-proposal.md#taxonomy_change_records)                                |
| MDR-DD-002                     | Language stores separate canonical and normalized names; normalized name and BCP 47 tag are independently unique while UUID remains immutable identity.                                       | [Language proposal](./07-database/first-physical-schema-proposal.md#languages)                                             |
| MDR-DD-003                     | Previous/resulting audit parent FKs receive separate supporting indexes.                                                                                                                      | [Index catalogue](./07-database/first-physical-schema-proposal.md#index-catalogue)                                         |
| MDR-DD-004                     | Normalized equality/uniqueness fields use explicit PostgreSQL `"C"` collation in the future reviewed migration.                                                                               | [Normalization Decision](./07-database/taxonomy-normalization-decision.md#storage-and-uniqueness-scope)                    |
| MDR-BE-002                     | Migration-one Language data is governance-owned and immutable through normal runtime paths; controlled changes preserve UUIDs through reviewed seed/migration amendments.                     | [Seed proposal](./07-database/first-seed-data-proposal.md#upsert-and-immutability-behavior)                                |
| MDR-SP-001 and MDR-SP-002      | Taxonomy audit is restricted operational audit data with deny-by-default access and interim preservation without automated expiry/deletion pending a final retention policy.                  | [Privilege model](./07-database/database-privilege-model.md)                                                               |
| Supplied reason-code amendment | Use an application-owned bounded reason-code registry; no arbitrary narrative/user input or PostgreSQL enum.                                                                                  | [Audit definition](./07-database/first-physical-schema-proposal.md#taxonomy_change_records)                                |
| Supplied correction amendment  | Corrections append a restrictive nullable self-reference, preserve the original, and require same-target/acyclic repository validation.                                                       | [Audit definition](./07-database/first-physical-schema-proposal.md#taxonomy_change_records)                                |
| MDR-PG-001                     | Exclude tutorial-audio, voice, text-to-speech, interface-language, and broader availability capability fields from migration-one Language schema/seed.                                        | [Seed exclusions](./07-database/first-seed-data-proposal.md#explicit-exclusions)                                           |
| MDR-BE-003                     | One shared backend domain/application component owns seed and taxonomy normalization/validation.                                                                                              | [Validation ownership](./07-database/taxonomy-normalization-decision.md#validation-ownership)                              |
| MDR-SA-001                     | Actor principals are provisioned idempotently through a controlled backend service/repository, contain no identity payload, and are linked later only through separate mappings.              | [Canonical Domain Model](./architecture/canonical-domain-model.md#identity-and-access-model)                               |
| MDR-XD-002                     | Every taxonomy change record has at most one direct successor; corrections form a deterministic linear chain rather than a branching graph.                                                   | [Correction-chain proposal](./07-database/first-physical-schema-proposal.md#taxonomy_change_records)                       |

The supplied Sprint 2.8 packet used labels `MDR-SP-003` for the reason-code policy and `MDR-SP-004` for correction behavior, while those stable Sprint 2.7 finding IDs already identify command-ID privacy and pseudonymous-actor observations. The stable finding register is not rewritten: the supplied policies are mapped by substance to MDR-SP-002 and MDR-XD-001, and command-ID privacy remains resolved through the explicit opaque UUIDv4/access/logging rules. Sprint 2.9 resolves MDR-XD-002 separately.

### MDR-XD-002: One direct successor per taxonomy change record

- **Status:** Approved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied through the review process.
- **Decision:** A taxonomy change record may be directly superseded at most once. Corrections form a deterministic linear chain: each record references zero or one predecessor and has zero or one direct successor. Sequential corrections may extend the chain; branching is prohibited.
- **Rationale:** A single successor prevents ambiguous competing correction histories and makes the terminal correction deterministic for governance, audit, and support interpretation.
- **Alternatives considered:** Permit branching corrections and require readers to choose a winner; prohibit correction chaining after one correction; update the original audit row. These alternatives create ambiguity, unnecessarily restrict legitimate later corrections, or violate append-only evidence.
- **Consequences:** `supersedes_change_record_id` remains nullable and immutable, receives a nullable unique constraint plus restrictive self-FK, and supports forward/backward linear traversal. Originals remain unchanged. One concurrent correction succeeds; a competing or stale direct-successor attempt returns a stable conflict.
- **Implementation conditions:** PostgreSQL enforces the FK, unique non-null predecessor use, and self-reference check. The repository transaction validates an earlier terminal predecessor, same effective target, acyclicity, atomic insertion, and stable concurrency/error behavior. No recursive trigger, stored procedure, or additional raw-query exception is approved.
- **Evidence:** [First Physical Schema Proposal](./07-database/first-physical-schema-proposal.md#taxonomy_change_records), [Multidisciplinary Review amendment verification](./reviews/FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#sprint-29-final-amendment-verification), and the supplied Sprint 2.9 decision package.

## Decision governance

### Approval authority

The accountable product owner or explicitly delegated product authority may approve product decisions. Product, design, content, privacy, security, and engineering contributors may propose or review a decision, but an unresolved proposal does not become approved product behaviour through implementation, roadmap placement, or documentation repetition alone. Decisions affecting regulated, privacy, safeguarding, or security obligations also require the appropriate specialist approval before release.

### Adding a decision

1. Assign the next unused sequential `PD-###` identifier.
2. Record every required field in this log and link the affected PRD sections and ADRs.
3. Mark the entry `Proposed` until explicit product approval is recorded.
4. After approval, update the PRD, roadmap, scope, user flows, and other affected source documents in the same reviewable change.
5. Validate that the decision introduces no undocumented contradiction or accidental MVP expansion.

Decision IDs are permanent and are never reused, even when a decision is withdrawn or superseded.

### Superseding a decision

Approved history is not deleted or silently rewritten. A replacement receives a new Product Decision ID. The old entry changes to `Superseded`, links to the replacement, and retains its original decision, rationale, and consequences. The replacement identifies every decision it supersedes and updates affected requirements and roadmap documents.

### Product decisions and ADRs

| Product Decision Log                                                                  | Architecture Decision Record                                                            |
| ------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Explains why the product behaves a particular way.                                    | Explains why the software is structured or implemented a particular way.                |
| Owns user capability, policy, scope, and product-rule choices.                        | Owns technology, component, data, integration, and implementation-boundary choices.     |
| Approved by the accountable product authority, with specialist review where required. | Approved through the architecture and engineering governance defined by the repository. |
| May constrain one or more architectures without selecting a technical solution.       | Must satisfy approved product decisions and may not redefine product behaviour.         |

Some topics require both records. For example, the product decision that downloads require an account does not select the local database, package format, or authorization implementation; those technical choices belong in ADRs.

## Traceability and maintenance

- The PRD remains the canonical functional specification; this log must remain consistent with it.
- The Master Roadmap sequences delivery but does not approve or change product behaviour by itself.
- ADR-011 currently consolidates architecture implications of PD-001 through PD-013 without replacing their product rationale.
- Review this log whenever MVP scope, access boundaries, reading behaviour, progress, content visibility, analytics, or AI policy changes.
