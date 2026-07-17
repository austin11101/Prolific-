# Architecture Gate 001: Canonical Domain Model Readiness

| Item               | Value                                                               |
| ------------------ | ------------------------------------------------------------------- |
| Status             | PASS                                                                |
| Review basis date  | YYYY-MM-DD                                                          |
| Closure date       | YYYY-MM-DD                                                          |
| Human verification | Product Owner approved AG-001 through AG-006                        |
| Candidate model    | [Canonical Domain Model](../architecture/canonical-domain-model.md) |
| Canonical glossary | [Domain Glossary](../02-requirements/domain-glossary.md)            |
| Conceptual ERD     | [Conceptual ERD](../07-database/erd.md)                             |
| Overall score      | 47/50                                                               |

## Purpose

This gate evaluates whether the canonical domain foundation is coherent enough to begin Sprint 2 database-foundation work without inventing product behaviour. The final outcome is `PASS`: all six conditions have complete evidence and explicit Product Owner human verification. This closes the gate prohibition; Sprint 2 work must still satisfy the ADRs, canonical model, before-first-migration checklist, and unresolved physical-design controls.

## Evidence reviewed

- [Product Requirements Document](../01-product-vision/product-requirements-document.md)
- [Product Decision Log](../product-decision-log.md)
- [MVP Scope](../02-requirements/mvp-scope.md)
- [Master Roadmap](../14-roadmap/master-roadmap.md)
- [ADR-011: MVP Product Access and Reading Rules](../decisions/ADR-011-mvp-product-access-and-reading-rules.md)
- [Canonical Domain Model](../architecture/canonical-domain-model.md)
- [Domain Glossary](../02-requirements/domain-glossary.md)
- [Conceptual ERD](../07-database/erd.md)
- [ADR-012: Use Prisma for Core API Persistence](../decisions/ADR-012-use-prisma-for-core-api-persistence.md)
- [ADR-013: Use Lesson Variants and Immutable Revisions](../decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md)
- [ADR-014: Use Structured Content Blocks and Revision Packages](../decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md)
- [ADR-015: Persist Editorial Workflow and Administrative Actor Audit](../decisions/ADR-015-persist-editorial-workflow-and-admin-actor-audit.md)
- [ADR-016: Use Category and Hierarchical Topic Taxonomy](../decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md)
- [ADR-017: Use History-Safe Deletion and Anonymization](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md)
- [Data Protection Architecture](../11-security/data-protection.md), [Privacy Architecture](../11-security/privacy.md), and [Security Overview](../11-security/security-overview.md)
- [Offline Lesson Package](../05-mobile-app/offline-lesson-package.md)
- [Database Overview](../07-database/database-overview.md)
- [Core Backend Architecture](../06-core-backend/backend-architecture.md)
- [API Overview](../08-api-specification/api-overview.md)
- [MVP User Flows](../04-ui-ux-design/user-flows.md)
- [Sprint 1 Open Questions](./SPRINT-1-OPEN-QUESTIONS.md)
- Repository-wide active terminology, link, heading, Markdown-fence, Mermaid-block, and source-change audits.

### Closure evidence completeness

| Evidence set                                                     | Result                                                                                                          |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| ADR-012 through ADR-017                                          | Complete; files and links verified.                                                                             |
| PRD, Product Decision Log, canonical model, and glossary         | Complete and consistent for gate scope.                                                                         |
| Conceptual ERD, Database Overview, and Core Backend Architecture | Complete for conceptual/architecture closure; exact physical design intentionally deferred to Sprint 2.         |
| API Overview and Offline Lesson Package                          | Complete for resource/package identity and invariants; final transport/local implementation remains later work. |
| Security Overview, Data Protection, and Privacy Architecture     | Complete for history-safe design; no privacy/legal compliance claim.                                            |
| Master Roadmap, Open Questions, and Sprint 2 Entry Checklist     | Linked and current after closure review.                                                                        |

No required closure evidence is missing or broken.

No complete mobile architecture or sync-service specification currently exists. The approved Offline Lesson Package now defines the AG-003 package boundary, while the Core Backend Architecture records the AG-001 persistence, AG-002 Lesson application, and AG-003 package-assembly boundaries without completing the broader backend design. These gaps do not prevent conceptual Sprint 2 design, but they remain separate Sprint 1 deliverables and later-sprint gates.

## Executive finding

The approved product rules are consistent across the PRD, Product Decision Log, MVP Scope, roadmap, ADR-011, domain model, glossary, ERD, API overview, and user flows. The six core entities are sufficiently defined, supporting concepts are classified without forcing table-per-concept persistence, historical identity is explicit, and the ERD is directly derivable.

Sprint 2 does not need to invent product behaviour. AG-001 through AG-006 have complete documentary evidence and Product Owner human approval. No critical architecture blocker remains. Physical design and implementation may proceed only through the controlled Sprint 2 entry requirements; this gate does not claim privacy/legal compliance or resolve later-sprint choices.

## Scorecard

| Review section             |     Score | Evidence                                                                         | Findings                                                                                                                                                                                                                                             | Required action                                                                    |
| -------------------------- | --------: | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Product alignment          |       5/5 | PRD, PD-001–PD-013, MVP Scope, roadmap, ADR-011                                  | Guest/account boundaries, three languages, 100/150/200 WPM, replay, application-silent practice, practice-only completion, registered downloads, published-only visibility, AI exclusion, simple streaks, and deferred bookmarks/achievements agree. | None before conceptual Sprint 2 design.                                            |
| Domain completeness        |       5/5 | Canonical model core-entity tables, supporting classifications, events, commands | User, Language, Category, Topic, Lesson, Lesson Variant, Lesson Revision, and Reading Session responsibilities provide the information required to derive physical candidates.                                                                       | Preserve unresolved items as design inputs, not implicit decisions.                |
| Terminology consistency    |       5/5 | Glossary and repository terminology sweep                                        | Required distinctions are explicit; historical review notes are clearly historical.                                                                                                                                                                  | Use glossary names in all new designs.                                             |
| Invariant completeness     |       5/5 | Canonical invariant section and aggregate rules                                  | All mandatory invariants have a conceptual owner and plausible enforcement boundary.                                                                                                                                                                 | Allocate concrete enforcement layers during Sprint 2 design.                       |
| Aggregate boundaries       |       5/5 | User, Lesson, Publishing, Reading, Taxonomy, and Privacy boundaries              | Aggregate ownership, append-only evidence, exact historical references, identity/activity separation, and cross-boundary transaction responsibilities are approved.                                                                                  | Preserve boundaries in physical mappings and repositories.                         |
| ERD derivability           |       5/5 | Conceptual Mermaid ERD, ADR-012–ADR-017, persistence interpretation              | Every required persistence candidate and non-destructive relationship is derivable; physical mapping choices are intentionally Sprint 2 work rather than missing domain behavior.                                                                    | Record each physical choice before its first migration.                            |
| API readiness              |       4/5 | API Overview, ADR-014, and Offline Lesson Package                                | API resource design can proceed without new product concepts; exact Revision identity, content/position semantics, profile versions, and checksum/package boundaries are explicit while transport remains open.                                      | Human-verify AG-003 before final Lesson Revision/package contracts.                |
| Offline readiness          |       4/5 | Offline package, Reading aggregate, outbox/receipt model, API sync outcomes      | Local-first, exact-version, idempotency, partial outcome, and guest restrictions are explicit. Local storage, package, and sync limits remain later decisions.                                                                                       | Keep later-sprint questions open; do not hard-code unresolved formats in Sprint 2. |
| Security/privacy readiness |       4/5 | ADR-017, security/privacy baseline, identity model, open questions               | History-safe deletion, identity/activity separation, cascade prohibition, privacy evidence, retention framework, backup and late-sync boundaries are approved; exact legal/privacy policy remains a pre-launch dependency.                           | Obtain specialist legal/privacy approvals before affected release gates.           |
| Documentation traceability |       5/5 | Cross-links among PRD, decisions, model, glossary, ERD, API, gate, roadmap       | Source documents are linked and active contradictions were not found.                                                                                                                                                                                | Maintain traceability in Sprint 2 design records.                                  |
| **Total**                  | **47/50** |                                                                                  | **PASS; all six architecture conditions are approved and no critical blocker remains.**                                                                                                                                                              | Execute controlled Sprint 2 physical design; retain later-policy gates.            |

## Product alignment review

- [x] Guest access and limited public published lesson trial match PD-001.
- [x] Guest restrictions and registered capabilities match PD-002 and PD-003.
- [x] Launch languages are English, isiZulu, and Sepedi.
- [x] Easy, Medium, and Hard are 100, 150, and 200 WPM.
- [x] Tutorial replay is allowed and practice contains no application audio.
- [x] Only eligible practice reaches completion; tutorial never completes a lesson.
- [x] Offline downloads require a registered account.
- [x] Only published content is learner-visible and the content engine cannot publish.
- [x] Live AI is excluded from the MVP learner flow.
- [x] Simple streaks are MVP; bookmarks, achievements, and broader gamification are deferred.

**Conflicts found:** None in active source documents.

## Domain completeness review

| Core entity     | Definition/identity | Lifecycle/ownership                                | Attributes/invariants | Relationships/actions/events | History/offline/privacy | Finding                                                                                                                     |
| --------------- | ------------------- | -------------------------------------------------- | --------------------- | ---------------------------- | ----------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| User            | Complete            | Complete; policy transitions unresolved explicitly | Complete              | Complete                     | Complete                | Sufficient for physical design subject to AG-006.                                                                           |
| Language        | Complete            | Complete                                           | Complete              | Complete                     | Complete                | Sufficient; interface coverage and timing adjustments are later decisions.                                                  |
| Category        | Complete            | Complete                                           | Complete              | Complete                     | Complete                | Hierarchy, lifecycle, naming, audit, and historical boundaries approved and human-verified under ADR-016/AG-005.            |
| Topic           | Complete            | Complete                                           | Complete              | Complete                     | Complete                | Same-Category ancestry, acyclicity, reparenting, and Effective Visibility approved and human-verified under ADR-016/AG-005. |
| Lesson          | Complete            | Complete                                           | Complete              | Complete                     | Complete                | Lesson/Variant/Revision/package/editorial model is sufficient subject to AG-001–AG-004 verification.                        |
| Reading Session | Complete            | Complete                                           | Complete              | Complete                     | Complete                | Sufficient; timing/interruption and multi-device policies block later sprints only.                                         |

Lesson is stable educational identity; Lesson Variant is a unique Language/Difficulty stream with at most one Working Draft; Lesson Revision is the exact immutable published snapshot. ADR-013 defines identity/publication numbering, ADR-014 defines structured packages, and ADR-015 defines typed editorial evidence and stable actor references. Their gate conditions are human-verified.

**Missing Sprint 2 domain concept:** None.

## Supporting-concept review

| Concept                   | Reviewed classification                      | Suitability for conceptual physical design                          |
| ------------------------- | -------------------------------------------- | ------------------------------------------------------------------- |
| Guest Session             | Temporary supporting entity                  | Suitable; central durable table is not implied.                     |
| Device                    | Supporting entity                            | Suitable for registered provenance and future multi-device work.    |
| User Preferences          | User aggregate member/value set              | Suitable; embedding versus relation remains physical design.        |
| Administrative Actor      | Separate authenticated human actor           | Stable audit identity and capabilities defined by ADR-015.          |
| Service Actor             | Separate authenticated non-human actor       | Draft-only service boundary; cannot approve or publish.             |
| Lesson Variant            | Lesson aggregate member/entity               | Suitable stable Language/Difficulty stream; exact mapping deferred. |
| Working Draft             | Lesson aggregate working member              | Suitable zero-or-one editable copy; exact persistence deferred.     |
| Lesson Revision           | Lesson aggregate member/entity               | Suitable immutable historical snapshot with exact identity.         |
| Tutorial Audio            | Lesson Revision metadata plus external asset | Suitable; binary storage and format remain later choices.           |
| Content Source            | Supporting entity                            | Suitable and independently reusable.                                |
| Lesson Source Attribution | Lesson aggregate member/value                | Suitable; supports multiple sources and offline attribution.        |
| Offline Lesson Package    | Value object/transport artifact              | Suitable; not automatically a central table.                        |
| Reading Session Event     | Aggregate member/domain fact                 | Suitable; conceptual ERD justifies a history candidate.             |
| Progress Event            | Domain event and sync payload                | Suitable; distinct from Reading Session and queue envelope.         |
| User Progress             | Read model                                   | Suitable; not authoritative history.                                |
| Daily Streak              | Derived read model/value                     | Suitable; no achievement table implied.                             |
| Outbox Event              | Mobile-local supporting entity/envelope      | Suitable; not automatically a server table.                         |
| Sync Request              | Transport contract                           | Suitable; not persisted as a domain aggregate.                      |
| Sync Receipt              | Supporting entity/transport result           | Suitable idempotency evidence.                                      |
| Sync Cursor               | Value object/transport checkpoint            | Suitable; lifecycle deferred to Sprint 8.                           |
| Review Submission         | Immutable typed audit record                 | Exact submitted draft/checksum and submitter evidence.              |
| Review Decision           | Immutable typed audit record                 | Exact human decision; changes use superseding evidence.             |
| Approval Evidence         | Evidentiary relationship/value object        | Exact approval; distinct from Publication and visibility.           |
| Publication Record        | Immutable transactional audit record         | Exactly one creates a Lesson Revision and learner visibility.       |
| Archive/Withdrawal Record | Immutable visibility/audit record            | Compensating chronology preserves publication/history.              |

## Naming and terminology review

- [x] Lesson is stable educational identity; Lesson Variant is one Language/Difficulty stream; Working Draft is editable; Lesson Revision is exact immutable published content.
- [x] Tutorial is guided audio; Practice is independent application-silent reading.
- [x] Difficulty classifies content; reading pace controls WPM/player movement.
- [x] Approved means review passed; Published means learner-visible.
- [x] Reading Session Event is internal chronology; Progress Event is a learner progress fact; Sync Event is its transfer representation.
- [x] User is a persistent registered learner; Guest Session is temporary context.
- [x] Administrative Actor is human internal identity; Service Actor is non-human and neither is a learner User role.
- [x] Review Submission/Decision, Approval Evidence, and Publication Record are distinct typed concepts.
- [x] Content Source is an origin; Lesson Source Attribution is a Revision-specific use/citation.
- [x] Outbox Event is the local durable queue envelope; Sync Receipt is server acknowledgement/idempotency evidence.
- [x] Category is a broad knowledge area; Topic is a focused subject within one Category.

**Conflicting active terminology found:** None. Historical findings remain only in documents explicitly marked historical.

## Invariant ownership and enforcement review

| Invariant                                      | Primary owner            | Expected enforcement layers                                               | Gate finding                              |
| ---------------------------------------------- | ------------------------ | ------------------------------------------------------------------------- | ----------------------------------------- |
| Guest cannot save/synchronize durable progress | Identity/Learning        | Authorization, application use case, local persistence boundary           | Clear.                                    |
| Guest cannot download                          | Identity/Content         | Authorization and download use case                                       | Clear.                                    |
| Unpublished content never reaches learners     | Publishing/Content       | Exact approval/publication transaction, visibility evidence, query policy | Clear; ADR-015, pending verification.     |
| Content Engine cannot approve or publish       | Publishing/Authorization | Service Actor capability boundary and command-time authorization          | Clear; ADR-015, pending verification.     |
| Editorial evidence is immutable                | Publishing/Data          | Append-only repositories, constraints, superseding/compensating records   | Clear; ADR-015, pending verification.     |
| Author self-approval denied by default         | Publishing/Authorization | Actor comparison, configurable explicit exception, restricted audit       | Clear; ADR-015, pending verification.     |
| Published Revisions are not edited in place    | Lesson aggregate         | Application service plus database immutability constraints                | Clear; ADR-013, pending verification.     |
| Tutorial cannot complete a lesson              | Reading aggregate        | Session state machine and completion validator                            | Clear.                                    |
| Completed session references exact Revision    | Reading aggregate        | Required Lesson Revision UUID and completion validation                   | Clear.                                    |
| Practice speed excludes tutorial time          | Reading aggregate        | Phase-specific timing calculation                                         | Clear.                                    |
| Sync event is not processed twice              | Synchronization          | Stable event ID, payload fingerprint, unique receipt, transaction         | Clear.                                    |
| Content engine cannot publish                  | Publishing/Identity      | Service authorization and lifecycle command boundary                      | Clear.                                    |
| Archive/deletion preserves history             | Content/Data governance  | Restrictive FK/action policy, archival state, retention design            | Clear conceptually; AG-006 before schema. |
| Lesson Variant has one Language/Difficulty     | Lesson aggregate         | Model validation, active uniqueness, and physical reference constraints   | Clear; ADR-013, pending verification.     |
| Difficulty and pace remain separate            | Content/Learning         | Separate attributes/value types and validation                            | Clear.                                    |
| Source attribution stays attached              | Lesson aggregate         | Publication validation and package manifest                               | Clear.                                    |
| Registered progress is local-first             | Reading/Sync             | Failure-safe local session/progress/outbox transaction                    | Clear; local implementation later.        |

No required invariant lacks a conceptual owner. ADR-012 through ADR-016 allocate AG-001 through AG-005 responsibilities; ADR-017 allocates history-safe deletion/anonymization, retention extension points, backup/sync implications, and privacy evidence under AG-006. All are human-verified.

## Aggregate and transaction-boundary review

- **User aggregate:** Reasonable and bounded to account identity, preferences, and device references. Reading history remains outside the growing aggregate.
- **Lesson/Publishing boundary:** Reasonable. The Lesson aggregate owns draft/Revision invariants while Publishing owns immutable Review Submissions/Decisions, Publication Records, and visibility evidence. Publication atomically verifies exact approval/checksums/actor authorization, creates the Revision and Publication Record, and switches Current Published Revision.
- **Reading aggregate:** Reasonable. Reading Session owns phase facts; failure-safe local persistence may atomically write session progress and the Outbox Event without making synchronization part of the conceptual aggregate.
- **Language, Category, Topic:** Independent Language/Category identities and a Category-scoped Topic hierarchy are appropriate. ADR-016 requires same-Category acyclic authoritative relationships; catalog/ancestry projections may update eventually but cannot authorize writes.
- **Eventual consistency:** Appropriate for User Progress, Daily Streak, catalogs, analytics, and acknowledged projections. It is not used for published-version mutation, completion evidence, or idempotency receipts.

**Boundary revisions required before conceptual design:** None. **Physical decisions required:** Exact deferred physical/policy details remain controlled Sprint 2 or later work within the human-verified AG-001 through AG-006 boundaries.

## ERD derivation review

- [x] Every persistence candidate maps to a documented concept.
- [x] No unexplained table-like concept exists.
- [x] Lesson, Lesson Variant, Working Draft, and Lesson Revision responsibilities are separate.
- [x] Reading Session references the exact Lesson Revision.
- [x] Lesson Source Attribution supports multiple Content Sources.
- [x] Ordered Content Blocks and contiguous Reading Positions derive from one immutable Lesson Revision.
- [x] Tutorial alignment points reference the same Revision-scoped positions used by silent practice.
- [x] Category/Topic and optional parent Topic hierarchy are represented.
- [x] Sync Receipt supports stable event identity, payload fingerprint, and outcome.
- [x] Device supports registered provenance and later multi-device design.
- [x] Archive/deletion rules prohibit destruction of historical references.
- [x] Concepts intentionally omitted as central tables are documented.
- [x] Human Administrative Actors and Service Actors are distinct conceptual persistence candidates.
- [x] Review Submission, Review Decision, Publication Record, and visibility history relationships are derivable without fixing polymorphic actor syntax.

The ERD is directly derivable. It is not a final physical schema and correctly defers types, indexes, ORM syntax, normalization, and migration design.

## API readiness review

The current model and API overview provide names and boundaries for published catalog browsing, the limited guest library, registered package downloads, tutorial/practice sessions, completion, Progress Events, outbox synchronization, four per-event outcomes with partial success, administrative review/publication, and draft-only content ingestion.

No missing product request/response concept blocks API design. ADR-015 defines server-derived actor identity, exact Review Submission/Decision IDs, immutable audit identifiers, conflicts, internal-only notes/actors, and publication response evidence. Final provider/RBAC and physical contracts remain controlled implementation decisions.

## Offline and synchronization review

- [x] Registered progress is written locally first.
- [x] Offline packages contain one exact published Lesson Revision, supported interpretation metadata, attribution, verified SHA-256 package/assets, and locally playable tutorial audio.
- [x] Operational, credential, learner, device, session, analytics, preference, and temporary transport state is excluded from the immutable package.
- [x] Outbox/Progress Events use stable IDs and retain retryable/failed outcomes.
- [x] Accepted, duplicate, rejected, and retryable outcomes and partial batch success are explicit.
- [x] Duplicate processing and duplicate Reading Sessions are prohibited.
- [x] Device provenance exists for later multi-device reconciliation.
- [x] Event timestamps are UTC and streak qualification uses an applicable local day.

Local database, audio/package format, sync limits, cursor policy, background scheduling, timezone detail, and multi-device reconciliation are implementation/later-sprint blockers, not domain blockers for Sprint 2.

## Security and privacy review

Guest, registered learner, Administrative Actor, and Service Actor boundaries are explicit. Private Reading Sessions, progress, devices, and sync metadata are separate from public content and editorial operations. Administrative capabilities do not automatically grant learner-activity access; guest analytics identity remains separate from User identity.

Child safeguarding, consent, recovery, exact legal basis/timeframes/retention periods, analytics provider, and administrator access policy remain unresolved. ADR-017 supplies the non-destructive deletion/anonymization architecture and extensibility boundary, but this gate approves no legal/privacy policy.

## Open-question classification

| Open question                                                                                  | Classification                       | Gate rationale                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Flutter state management                                                                       | Blocks a later sprint only           | Required before Sprint 4, not database foundation.                                                                                                                               |
| Mobile local database                                                                          | Blocks a later sprint only           | Required before Sprint 5 local persistence.                                                                                                                                      |
| Background sync scheduling                                                                     | Blocks a later sprint only           | Required before Sprint 8.                                                                                                                                                        |
| Backend ORM/database access approach                                                           | Resolved and human-verified          | ADR-012 selects Prisma ORM and Prisma Migrate, Core API migration ownership, explicit repository interfaces with Prisma adapters, and application-service transaction ownership. |
| Object/file storage and delivery                                                               | Blocks a later sprint only           | Required before Sprint 3/package delivery.                                                                                                                                       |
| Sync batch/retention/retry/cursor limits                                                       | Blocks a later sprint only           | Required before Sprint 8.                                                                                                                                                        |
| Multi-device reconciliation                                                                    | Blocks a later sprint only           | Device/provenance concepts already preserve design space.                                                                                                                        |
| Lesson Variant/Revision numbering and concurrency                                              | Resolved and human-verified          | ADR-013 defines Variant-scoped numbers, one Working Draft, optimistic concurrency, atomic publication, uniqueness, and immutable Revisions.                                      |
| Content blocks/Reading Positions/profiles/checksums/package boundary                           | Resolved and human-verified          | ADR-014 defines the extensible Lesson Revision/package boundary; exact Language-specific algorithms and alignment generation remain later.                                       |
| Editorial review/publication/visibility evidence                                               | Resolved and human-verified          | ADR-015 defines typed append-only evidence and atomic Publication Record/Revision creation.                                                                                      |
| Administrative and Service Actor references                                                    | Resolved and human-verified          | ADR-015 defines distinct stable actor references; provider and physical mapping remain later.                                                                                    |
| Exact taxonomy normalization, localization, ordering, ancestry-query, and projection mechanics | Blocks affected physical design only | ADR-016 resolves hierarchy/lifecycle behavior; these implementation choices must remain inside its approved boundary.                                                            |
| Guest activity after registration                                                              | Blocks a later sprint only           | Required before Sprint 4 onboarding; Sprint 2 must not persist guest progress.                                                                                                   |
| Tutorial audio format/bitrate                                                                  | Blocks a later sprint only           | Required before Sprint 5 package implementation.                                                                                                                                 |
| Exact Language tokenization/audio-alignment generation                                         | Blocks a later sprint only           | Required before Sprint 5/6 contracts; ADR-014 preserves the approved versioned interpretation boundary.                                                                          |
| Language-specific pace adjustments                                                             | Blocks a later sprint only           | Required before Sprint 6; defaults remain approved.                                                                                                                              |
| Interruption/background/timing tolerance                                                       | Blocks a later sprint only           | Required before Sprint 6 player completion implementation.                                                                                                                       |
| Source-quality/moderation/attribution display                                                  | Blocks a later sprint only           | Required before Sprint 3 content workflow.                                                                                                                                       |
| Lesson images/package inclusion                                                                | Blocks a later sprint only           | Required before package contract, not core database foundation.                                                                                                                  |
| Authentication provider/credentials                                                            | Blocks a later sprint only           | Product identity exists; provider choice belongs to authentication implementation.                                                                                               |
| Password recovery                                                                              | Blocks a later sprint only           | Required before account recovery release.                                                                                                                                        |
| Child consent/safeguarding                                                                     | Blocks a later sprint only           | Required before affected registration release; no unsafe assumption is made now.                                                                                                 |
| Deletion, analytics, event, receipt, progress, backup retention periods                        | Blocks a later sprint only           | Exact periods need specialist approval; AG-006 requires history-safe extensibility before schema.                                                                                |
| Analytics provider/SDK                                                                         | Blocks a later sprint only           | Required before instrumentation.                                                                                                                                                 |
| Applicable timezone source/change                                                              | Blocks a later sprint only           | Required before Sprint 7 streak implementation.                                                                                                                                  |
| Timezone/clock/delayed-sync streak behaviour                                                   | Blocks a later sprint only           | Required before Sprint 7.                                                                                                                                                        |
| Accessibility standard/device matrix                                                           | Blocks a later sprint only           | Required before Sprint 4 acceptance/release gates.                                                                                                                               |
| Performance/availability/storage/bandwidth/KPI targets                                         | Informational or operational         | Required for stabilization/release measurement, not Sprint 2 entry.                                                                                                              |
| Custom pace, bookmarks, achievements, institutional roles, live AI                             | Informational or operational         | Explicitly deferred/post-MVP product scope.                                                                                                                                      |
| Subscription/payment model                                                                     | Informational or operational         | No paid model is approved; it must not influence MVP schema.                                                                                                                     |

No open question is an unresolved product/domain blocker that requires `FAIL`. AG-001 through AG-006 are human-verified; exact privacy/legal policy remains a release dependency.

## Critical blockers

**None at the product or canonical-domain level.** The gate prohibition is removed. Remaining blockers are milestone sequencing and explicit before-first-migration physical-design decisions, not missing product/domain behavior.

### Remaining-work classification

- **Architecture blockers:** None for Architecture Gate 001.
- **Physical-design decisions:** Exact Prisma/PostgreSQL versions, naming/extensions, JSON/relational mappings, constraints/concurrency, audit mapping, anonymization-compatible foreign keys, migration baseline, test database, and seed boundary. These are Sprint 2 entry tasks.
- **Later-sprint decisions:** Flutter state/local database, package/audio delivery, content/tokenization detail, player timing, synchronization limits/reconciliation, timezone/streak behavior, and accessibility implementation.
- **Privacy/legal policy decisions:** Consent/safeguarding, legal bases, exact retention/deletion periods, anonymization effectiveness, metadata treatment, data-subject procedure, and jurisdiction review before affected releases.
- **Operational/deployment decisions:** Backup/provider expiry, restore runbooks, monitoring/analytics, performance/reliability targets, incident/access governance, and unsafe-download response.

## Required conditions

| Condition ID | Owner                                       | Deadline/checkpoint                                                  | Verification evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                | Work prohibited until resolved                                                                                              | Status                     |
| ------------ | ------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------- |
| AG-001       | Backend and Data Architecture               | Before first physical persistence change                             | [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md), [Database Overview](../07-database/database-overview.md), [Core Backend Architecture](../06-core-backend/backend-architecture.md), and [Canonical Domain Model](../architecture/canonical-domain-model.md)                                                                                                                                                                                                                                                   | Sprint 2 implementation must follow the approved persistence boundary and entry checklist                                   | Satisfied — Human verified |
| AG-002       | Data and Software Architecture              | Before Lesson/Variant/Revision physical schema approval              | [ADR-013](../decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md), [Canonical Domain Model](../architecture/canonical-domain-model.md), [Domain Glossary](../02-requirements/domain-glossary.md), [Conceptual ERD](../07-database/erd.md), [Database Overview](../07-database/database-overview.md), and [Core Backend Architecture](../06-core-backend/backend-architecture.md)                                                                                                                                        | Physical design must preserve Variant-scoped immutable Revision history                                                     | Satisfied — Human verified |
| AG-003       | Content, API, Mobile, and Data Architecture | Before Lesson Revision content/package schema approval               | [ADR-014](../decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md), [Offline Lesson Package](../05-mobile-app/offline-lesson-package.md), [Canonical Domain Model](../architecture/canonical-domain-model.md), [Domain Glossary](../02-requirements/domain-glossary.md), [Conceptual ERD](../07-database/erd.md), [Database Overview](../07-database/database-overview.md), [Core Backend Architecture](../06-core-backend/backend-architecture.md), and [API Overview](../08-api-specification/api-overview.md) | Physical/shared contracts must preserve approved block, position, profile, package, and checksum semantics                  | Satisfied — Human verified |
| AG-004       | Backend, Data, and Security Architecture    | Before lifecycle/audit persistence approval                          | [ADR-015](../decisions/ADR-015-persist-editorial-workflow-and-admin-actor-audit.md), [Canonical Domain Model](../architecture/canonical-domain-model.md), [Domain Glossary](../02-requirements/domain-glossary.md), [Conceptual ERD](../07-database/erd.md), [Database Overview](../07-database/database-overview.md), [Core Backend Architecture](../06-core-backend/backend-architecture.md), and [API Overview](../08-api-specification/api-overview.md)                                                                          | Physical design must preserve actor separation, append-only evidence, and transactional publication                         | Satisfied — Human verified |
| AG-005       | Content and Data Architecture               | Before taxonomy write-schema approval                                | [ADR-016](../decisions/ADR-016-use-category-and-hierarchical-topic-taxonomy.md), [Canonical Domain Model](../architecture/canonical-domain-model.md), [Domain Glossary](../02-requirements/domain-glossary.md), [Conceptual ERD](../07-database/erd.md), [Database Overview](../07-database/database-overview.md), [Core Backend Architecture](../06-core-backend/backend-architecture.md), and [API Overview](../08-api-specification/api-overview.md)                                                                              | Physical design must preserve same-Category acyclic hierarchy, scoped uniqueness, lifecycle, and audit                      | Satisfied — Human verified |
| AG-006       | Data and Security/Privacy Review            | Before User/Reading Session foreign-key and deletion-action approval | [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md), [Canonical Domain Model](../architecture/canonical-domain-model.md), [Domain Glossary](../02-requirements/domain-glossary.md), [Conceptual ERD](../07-database/erd.md), [Database Overview](../07-database/database-overview.md), [Core Backend Architecture](../06-core-backend/backend-architecture.md), [API Overview](../08-api-specification/api-overview.md), and [Security/Privacy](../11-security/data-protection.md)                        | Physical design must support detachable identity, non-destructive history, holds, privacy evidence, and late-sync rejection | Satisfied — Human verified |

ADR-012 through ADR-017 supply complete evidence for AG-001 through AG-006. The Product Owner explicitly approved all six conditions with closure date `YYYY-MM-DD`. This gate records but does not replace those decisions.

## Human verification record

| Condition | Human verification | Approver      | Date       | Approved decision summary                                                                                                                                                             |
| --------- | ------------------ | ------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AG-001    | Approved           | Product Owner | YYYY-MM-DD | PostgreSQL, Prisma ORM/Migrate, Core API migration ownership, application-service transactions, explicit Prisma adapters, no runtime schema synchronization.                          |
| AG-002    | Approved           | Product Owner | YYYY-MM-DD | Lesson/Variant/immutable Revision, Variant-scoped numbering, optimistic editorial concurrency, exact Revision history references.                                                     |
| AG-003    | Approved           | Product Owner | YYYY-MM-DD | Structured blocks, zero-based Revision positions, versioned profiles, deterministic counts, immutable packages, SHA-256, schema versioning.                                           |
| AG-004    | Approved           | Product Owner | YYYY-MM-DD | Persistent submissions, immutable decisions, exact approval, transactional publication, stable actor refs, append-only audit, no engine approval/publication.                         |
| AG-005    | Approved           | Product Owner | YYYY-MM-DD | Category/hierarchical Topic, optional same-Category parent, cycle prevention, sibling uniqueness, audited reparenting, history-safe lifecycle.                                        |
| AG-006    | Approved           | Product Owner | YYYY-MM-DD | History-safe deletion, no destructive historical cascade, identity/activity separation, anonymization-compatible design, retention framework, privacy evidence, late-sync prevention. |

### AG-001 verification criteria

- [x] Prisma ORM is formally approved for Core API persistence.
- [x] Prisma Migrate is approved, and the Core API owns committed SQL migration history.
- [x] Application services or use cases own transaction boundaries.
- [x] Repository interfaces are persistence-independent and implemented by Prisma infrastructure adapters.
- [x] Runtime schema synchronization and production schema push are prohibited.
- [x] Production migrations are controlled, reviewed, and committed.
- [x] Product Owner human verification is recorded below.

### AG-002 verification criteria

- [x] Lesson, Lesson Variant, Working Draft, and Lesson Revision responsibilities are distinct.
- [x] Revision Numbers are positive, monotonically allocated, never reused, and scoped to one Lesson Variant.
- [x] Draft saves, rejected drafts, and abandoned drafts do not consume Revision Numbers.
- [x] Editorial updates require optimistic concurrency; silent last-write-wins is prohibited.
- [x] Publication numbering and Current Published Revision switching are atomic and concurrency-safe.
- [x] Active Variant uniqueness and per-Variant Revision uniqueness are defined.
- [x] Published Lesson Revisions are immutable and retained for history.
- [x] Reading Sessions and Offline Lesson Packages reference exact Lesson Revision identity.
- [x] Product Owner human verification is recorded below.

### AG-003 verification criteria

- [x] MVP Content Block types, stable IDs, deterministic ordering, readable flags, and exact Canonical Display Text are defined.
- [x] Canonical Display Text is preserved exactly and remains distinct from derived Normalized Comparison Text.
- [x] Reading Units, zero-based contiguous Revision-scoped Reading Positions, and Unicode-scalar half-open Display Spans are defined.
- [x] Tokenization and Alignment Profiles use explicit positive versions; word count is reproducible from readable units under the recorded profile.
- [x] Tutorial alignment and silent practice share Reading Positions without making practice dependent on audio.
- [x] SHA-256 Package and Asset Checksum meanings, canonical package inputs, exclusions, and reproducibility rules are defined.
- [x] Offline package identity, manifest, schema-version, required learner content, explicit exclusions, integrity states, and compatibility behavior are defined.
- [x] Historical sessions retain exact Revision/schema/profile/position evidence and are never reinterpreted with a newer tokenizer or package.
- [x] Exact Language-specific algorithms, physical storage, canonical-JSON library, archive/delivery, and compatibility-window details remain clearly deferred without reopening the boundary.
- [x] Product Owner human verification is recorded below.

### AG-004 verification criteria

- [x] Administrative Actors and Service Actors are distinct from each other and from learner Users.
- [x] Audit actor identity uses stable immutable references and is derived from authenticated server context.
- [x] Review Submission is immutable and preserves exact submitted version/content/source integrity evidence.
- [x] Review Decision is immutable, human-authored, and corrections use superseding records.
- [x] Approval references exact content, actor, time, authorization evidence, and unchanged submission.
- [x] Approval and learner-visible Publication remain distinct.
- [x] Publication Record is created transactionally with exactly one immutable Lesson Revision.
- [x] Archive, withdrawal, and restoration append evidence and preserve original publication/session history.
- [x] Content Engine and other Service Actors cannot approve or publish.
- [x] Editorial audit is append-only, access-restricted, and excluded from learner APIs and Offline Lesson Packages.
- [x] Product Owner human verification is recorded below.

### AG-005 verification criteria

- [x] Category to Topic to optional child Topic to Lesson hierarchy and stable identities are defined without a fixed client depth.
- [x] Every Topic has exactly one Category and at most one same-Category parent.
- [x] Direct and indirect cycles are prohibited and checked transactionally against authoritative relationships.
- [x] Active Category and sibling Topic Canonical Taxonomy Name uniqueness scopes are defined; exact normalization/collation is explicitly deferred.
- [x] Same-Category subtree reparenting, stale-write conflicts, atomic audit, and cross-Category prohibition are defined.
- [x] Lesson reassignment is same-Category and active-Topic only and preserves Revision, Reading Session, progress, and audit history.
- [x] Taxonomy lifecycle states, Effective Visibility, archive propagation without child-state rewriting, and restoration revalidation are defined.
- [x] Hard deletion/destructive cascades of referenced taxonomy are prohibited; append-only actor/time/reason/state audit evidence is required.
- [x] Discovery eligibility, deterministic order, localization separation, and projection-versus-authority boundaries are defined.
- [x] Exact query/index, normalization, localization, ordering, concurrency, and projection mechanics remain clearly deferred without reopening the boundary.
- [x] Product Owner human verification is recorded below.

### AG-006 verification criteria

- [x] Deletion, deactivation, archive, withdrawal, anonymization, pseudonymization, retention, hold, and purge are distinct.
- [x] Destructive cascades into immutable or historical data are prohibited.
- [x] Learner identity can detach from retained activity without changing Reading Session or exact Lesson Revision identity.
- [x] Administrative and Service Actor history survives deactivation/credential removal.
- [x] Privacy actions are auditable through data-minimized append-only evidence.
- [x] Deactivated/deleted accounts and late Devices cannot restore identity or reattach anonymized history.
- [x] A data-class retention framework exists without inventing legal durations or bases.
- [x] Backup expiry, restore tombstone reapplication, encryption, and restricted access implications are documented.
- [x] Purge is limited to eligible non-historical, dependency-free, unheld data.
- [x] Exact legal basis, periods, timeframe, algorithm, metadata treatment, and physical mapping remain clearly deferred.
- [x] Product Owner human verification is recorded below.

## Non-blocking risks

- Mobile local persistence and failure-safe progress/outbox transactions remain undesigned.
- Exact Language-specific tokenization/alignment, package archive/audio format, and compatibility policy may require later schema evolution within ADR-014's versioned boundaries.
- Sync limits, receipt retention, cursor lifecycle, and multi-device reconciliation remain Sprint 8 risks.
- Timezone changes and delayed sync may affect streak correctness in Sprint 7.
- Child safeguarding, consent, recovery, retention, analytics, and administrator access require specialist approval before affected releases.
- The mobile/offline/sync architecture and shared-contract gaps recorded at gate closure were subsequently completed by the [Sprint 1 Closure Review](./SPRINT-1-CLOSURE-REVIEW.md).

## Final outcome

- [x] **PASS**
- [ ] **PASS WITH CONDITIONS**
- [ ] **FAIL**

**Outcome rationale:** Product Owner approval is recorded for AG-001 through AG-006, all evidence links exist, the score is 47/50, and no critical architecture blocker requires Sprint 2 to invent product/domain behavior. Exact physical, later-sprint, operational, and privacy/legal decisions remain controlled non-blocking work.

## Approval checklist

| Review authority             | Name          | Decision               | Date       | Conditions or reference                                                                    |
| ---------------------------- | ------------- | ---------------------- | ---------- | ------------------------------------------------------------------------------------------ |
| Product Owner                | Product Owner | Approved               | YYYY-MM-DD | Explicitly approved AG-001 through AG-006 and final `PASS` closure.                        |
| Software Architecture Review | Not recorded  | Advisory follow-up     | —          | Review physical mappings against ADR-012 through ADR-017 during Sprint 2.                  |
| Backend Review               | Not recorded  | Implementation review  | —          | Review persistence adapters, transactions, migrations, and audit implementation.           |
| Mobile Review                | Not recorded  | Later-sprint review    | —          | Review local database, offline package lifecycle, player, and synchronization integration. |
| Data Review                  | Not recorded  | Implementation review  | —          | Review PostgreSQL constraints, indexes, foreign-key actions, and migration safety.         |
| Security/Privacy Review      | Not recorded  | Pre-launch requirement | —          | Approve exact privacy/legal policy; this gate does not claim legal compliance.             |

Only Product Owner approval is asserted by this closure review. No personal reviewer names or signatures are invented.

## Next permitted work

Architecture Gate 001 no longer prohibits Sprint 2 code. Once the repository formally completes remaining Sprint 1 deliverables and satisfies the [Sprint 2 Entry Checklist](./SPRINT-2-ENTRY-CHECKLIST.md), Sprint 2 may select/pin Prisma, install approved packages, create `schema.prisma`, define the PostgreSQL physical schema, create initial migrations, implement adapters/test-database infrastructure, and validate migrations.

Before the first migration, Sprint 2 must record exact PostgreSQL/Prisma versions, naming/extension policy, JSON-versus-relational mappings, uniqueness/concurrency/audit/anonymization-compatible foreign-key design, migration baseline, test-database strategy, and seed boundary. Runtime schema synchronization, destructive historical cascades, unpublished learner queries, and deviations from ADR-012 through ADR-017 remain prohibited.

This gate did not itself close Sprint 1 because non-gate deliverables were incomplete at the time. Those deliverables were subsequently completed or formally re-scoped in the [Sprint 1 Deliverable Audit](./SPRINT-1-DELIVERABLE-AUDIT.md). The later [Sprint 1 Closure Review](./SPRINT-1-CLOSURE-REVIEW.md) is the authority for current milestone readiness.
