# First Physical Schema Review

## Status

**Decision:** `APPROVED`.

The supplied Sprint 2.5/Sprint 2.6 governance decisions, Sprint 2.8 amendments, and Sprint 2.9 one-successor decision close all migration-one FPSD and multidisciplinary design findings. The evidence-based [final amendment verification](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#sprint-29-final-amendment-verification) preserves all 22 findings and reconciles them to 17 RESOLVED and five ACCEPTED. Technical blockers and open major findings are zero. On 2026-07-17, the Project Product Owner / Architecture Governance authority approved the schema from all five required perspectives. The [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md) authorizes only Prisma schema implementation; migration generation and execution remain blocked. The database and model-free Prisma schema remain unchanged by this approval task.

## Recorded governance decisions

| ID       | Recorded outcome                                                          | Date       | Authority                                                           |
| -------- | ------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------- |
| FPSD-001 | Defer `users`, `user_preferences`, and `devices`                          | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-002 | Include strict pseudonymous `actor_principals` without direct identifiers | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-005 | Approve normalization; require executable TN-001–TN-022 tests             | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-006 | Approve application-owned cycle prevention with mandatory controls        | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-007 | Structured taxonomy audit fields only; unrestricted notes prohibited      | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-009 | Approve exact launch content-language values                              | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-010 | Approve immutable governance-owned Language UUIDv4 identities             | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-013 | Approve `ACTIVE`/`ARCHIVED` taxonomy lifecycle and no actor state         | 2026-07-17 | Product Owner / architecture governance decision supplied in review |
| FPSD-014 | Approve provider-neutral least-privilege role separation                  | 2026-07-17 | Product Owner / architecture governance decision supplied in review |

These records are governance inputs, not reviewer signatures or authorization to implement.

## Review instructions

Reviewers must record evidence, requested changes, and an explicit decision. An unchecked box is not approval. A conditional approval must name the condition and the governance owner who will verify it. Approval of this document permits only the separately authorized implementation of the reviewed first-migration scope; it does not authorize later deferred tables.

## Product alignment

- [x] The five-table scope supports governed taxonomy without changing Guest restrictions or optional registration.
- [x] English, isiZulu, and Sepedi are the only proposed production Language seed records.
- [x] Difficulty and pace remain separate; Easy/Medium/Hard remain 100/150/200 WPM.
- [x] Tutorial and silent-practice behavior is not encoded incorrectly by the foundation.
- [x] No future teacher, classroom, AI, social, payment, or analytics feature is pulled into migration one.
- [x] FPSD-009/FPSD-010 record the language labels, tag/ISO relationships, order, and fixed UUID ownership.

## Canonical domain model alignment

- [x] Guest Session remains outside persistent User identity.
- [x] User is a stable non-identifying registered learner subject.
- [x] Administrative/Service Actors remain separate from learner Users.
- [x] Language, Category, Topic, Lesson/Variant/Revision, Reading Session, and sync meanings remain distinct.
- [x] Proposed table names do not create new product entities or collapse approved concepts.

## ADR alignment

- [x] ADR-012 repository, transaction, migration-owner, and no-runtime-sync boundaries are preserved.
- [x] ADR-013 stable Variant identity, one Working Draft, immutable Revision, and Variant-scoped numbering are preserved in deferred mapping.
- [x] ADR-014 relational blocks/positions/alignment and controlled-hybrid package boundary are preserved.
- [x] ADR-015 typed append-only human/service editorial evidence and separation of duties are preserved.
- [x] ADR-016 same-Category acyclic hierarchy, lifecycle, restoration, concurrency, and audit rules are preserved.
- [x] ADR-017 identity/activity separation, non-destructive history, typed holds, and privacy evidence are preserved.

## First-migration table scope

- [x] FPSD-001 defers `users`, `user_preferences`, and `devices` from migration one.
- [x] `actor_principals` provides audit identity without prematurely defining RBAC.
- [x] `languages`, `categories`, and `topics` are required foundation reference/taxonomy tables.
- [x] `taxonomy_change_records` is necessary typed evidence and does not become a generic audit table.
- [x] Every other proposed table is clearly deferred to a bounded later migration.

## Naming and identifiers

- [x] Table, column, constraint, index, enum, join, and migration naming follows the approved conventions.
- [x] Every identity uses native PostgreSQL `uuid` and an approved application/client generation owner.
- [x] No database UUID extension/default, sequential shadow identity, ambiguous SQL name, or arbitrary varchar length is proposed.

## Types and defaults

- [x] Every first-migration column has an explicit PostgreSQL type, nullability, default, and mutability rule.
- [x] `timestamptz`, integer/bigint duration/count, numeric font scale, boolean, text, and checksum choices match their domain meaning.
- [x] Database defaults represent persistence facts only and do not manufacture domain event times.
- [x] No array, bytea, decimal, generic metadata, or first-migration JSONB is unjustified.

## Lifecycle and immutability

- [x] Language, Category, and Topic lifecycle states/timestamps are coherent; actor principal remains immutable and state-free.
- [x] No universal `deleted_at` or generic soft-delete behavior exists.
- [x] Immutable evidence cannot be changed through ordinary repositories.
- [x] Deferred Lesson Revision content, attribution, audio/alignment, and package material are fully immutable after publication.
- [x] Withdrawal/archive is append-only/current-visibility behavior, not Revision mutation.

## Privacy and anonymization safety

- [x] Learner identity, User Preferences, and Devices are deferred from migration one.
- [x] Identity/profile/authentication tables remain deferred until policy/provider approval.
- [x] Activity can later detach or pseudonymize identity without changing Session/Revision identity.
- [x] Privacy records and Retention Holds are typed, minimal, restricted, and deferred pending policy.
- [x] Exact legal periods, consent, child safeguarding, anonymization effectiveness, and backup treatment are not falsely resolved.

## Foreign-key actions

- [x] Every proposed FK appears in the action matrix with required/nullability semantics.
- [x] `RESTRICT`/`NO ACTION` preserves aggregate and immutable-history boundaries.
- [x] No User/Device/actor/taxonomy/content lifecycle can cascade-delete reading, publication, review, source, sync, privacy, or audit evidence.
- [x] No `CASCADE` is proposed without an approved strictly owned non-historical justification.
- [x] Typed Retention Hold targets do not rely solely on polymorphic strings.

## Uniqueness and normalization

- [x] Language, Variant, Revision, Device, event, cursor, and projection uniqueness scopes are correct.
- [x] Active Category and root/child Topic uniqueness matches ADR-016.
- [x] Root Topic uniqueness is not weakened by PostgreSQL null semantics.
- [x] FPSD-005 approves the Unicode/case/whitespace/punctuation/diacritic comparison contract.
- [x] TN-001 through TN-022 are executable automated tests before taxonomy repository acceptance.
- [x] `citext` remains absent.

## Taxonomy hierarchy

- [x] Adjacency list is approved as migration-one authority.
- [x] Composite FK enforces same-Category parenthood.
- [x] Self-parent and cycle handling are complete and testable.
- [x] Category hierarchy-version locking makes reparenting/restoration concurrency-safe.
- [x] Effective visibility preserves descendant state; restoration revalidates ancestors and uniqueness.
- [x] Closure/path/nested-set optimization remains deferred and rebuildable.
- [x] FPSD-006 records application-owned cycle prevention and its mandatory controls.

## Indexes and constraints

- [x] Every first-migration index supports a named invariant, FK, audit, traversal, authorization, or discovery workload.
- [x] Write/storage costs are proportionate and no duplicate primary-key index exists.
- [x] Partial unique predicates are stable and match lifecycle semantics.
- [x] FPSD-013 records `ACTIVE` and `ARCHIVED` as the only taxonomy lifecycle values and defines restoration validation.
- [x] Constraint catalogue clearly separates row checks, FKs, unique indexes, transactions, repository logic, and possible future triggers.
- [x] No speculative GIN, BRIN, trigram, full-text, covering, or analytics index is included.

## Synchronization and offline compatibility

- [x] Stable UUIDs and exact Revision identity support offline creation and retry.
- [x] Device identity remains pseudonymous and cannot be reassigned to recreate identity.
- [x] Sync Receipt uniqueness and payload fingerprint proposal preserves idempotency.
- [x] Mobile outbox and Sync Request remain local/transport concerns, not accidental PostgreSQL authorities.
- [x] Deferred package tables can reconstruct one immutable offline package without learner state or temporary URLs.

## Seed data

- [x] Exactly three launch content Languages are proposed for the production baseline.
- [x] FPSD-009/FPSD-010 approve fixed UUIDs, tags, ISO bases, names, order, active status, and content-language status.
- [x] Interface-language coverage is not inferred or represented in migration one.
- [x] Categories/Topics remain development/test fixtures unless separately approved.
- [x] No users, credentials, Devices, Lessons, activity, audit, privacy, or editorial evidence is seeded.

## Testability and migration safety

- [x] Every first-migration check, unique rule, FK action, concurrency token, and audit invariant has an identified PostgreSQL integration test.
- [x] Empty-database application, migration status/drift, failure recovery, and run-forward plans are testable.
- [x] No extension, unsafe default, destructive cascade, unbounded backfill, or implicit startup migration is proposed.
- [x] Rollback implications are understood: application rollback requires backward compatibility; database recovery is run-forward unless a lossless rollback is proven.
- [x] Repository ownership and transaction boundaries are sufficient to enforce cross-row invariants.

## Review closure basis

The authoritative [Decision Register](./FIRST-PHYSICAL-SCHEMA-OPEN-DECISIONS.md) records all migration-one FPSD and MDR-XD-002 decisions. No FPSD, technical, open-major, or design-decision blocker remains. The completed decisions below approve the amended physical mapping, raw-query exception, one-successor correction chain, counts, and audit policy within the exact scope of the [approval record](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md).

## Reviewer decision sections

### Software Architecture

**Multidisciplinary evidence:** [Software Architecture assessment](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#software-architecture-assessment).

**Amendment-verification evidence:** [Software Architecture conclusion](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#independent-perspective-verification).

**Advisory recommendation:** `RECOMMEND APPROVAL`.

- Resolved: MDR-DD-001, MDR-XD-001, MDR-XD-002, and MDR-SA-001 through the exact target, linear correction, and provisioning definitions.
- Open blocker/major findings: none.

- [x] Aggregate boundaries and canonical identities remain aligned.
- [x] The selected migration-one boundary is cohesive and minimal.
- [x] Deferred tables remain implementable without weakening current integrity.
- [x] FPSD-001/FPSD-002 record the identity-shell and actor strategy.
- [x] Adjacency-list authority and the FPSD-006 cycle strategy are acceptable in the physical design.
- [x] Future authentication, content, activity, sync, and privacy migrations have safe extension points.

**Decision record**

- Decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Signature: Approval supplied through the governance review process
- Decision date: 2026-07-17
- Required amendments: None
- Evidence/reference: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Backend Engineering

**Multidisciplinary evidence:** [Backend Engineering assessment](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#backend-engineering-assessment).

**Amendment-verification evidence:** [Backend Engineering conclusion](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#independent-perspective-verification).

**Advisory recommendation:** `RECOMMEND APPROVAL`.

- Resolved: MDR-BE-001, MDR-BE-002, and MDR-DD-005 through the raw-query policy, governance-only Language policy, and operation matrix.
- Open technical blockers: none.

- [x] Repository ownership matches User, Taxonomy, Lesson, Reading, Sync, and Privacy boundaries.
- [x] Category/Topic and audit evidence can be written atomically.
- [x] Optimistic concurrency predicates and idempotent command behavior are feasible.
- [x] Category-first locking, recursive cycle checks, retries, and failure mapping are implementable.
- [x] Proposed names/types/FKs map coherently through Prisma without leaking generated types.
- [x] Unit, PostgreSQL integration, concurrent reparent, uniqueness, lifecycle, and audit tests are practical.

**Decision record**

- Decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Signature: Approval supplied through the governance review process
- Decision date: 2026-07-17
- Required amendments: None
- Evidence/reference: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Data/Database

**Multidisciplinary evidence:** [Data/Database assessment](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#datadatabase-assessment).

**Amendment-verification evidence:** [Data/Database conclusion](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#independent-perspective-verification).

**Advisory recommendation:** `RECOMMEND APPROVAL`.

- Resolved: MDR-DD-001 through MDR-DD-006 through the amended target, Language, index, collation, operation, and validation catalogues.
- Counts for review: 17 non-primary indexes, eight FKs, 26 checks, five non-primary-key unique constraints, and five primary keys (44 named constraints overall).

- [x] PostgreSQL types, nullability, defaults, and immutable/mutable classifications are appropriate.
- [x] Checks, partial uniqueness, composite Topic FK, and state/timestamp consistency are complete.
- [x] FPSD-005 approves normalization and makes TN-001–TN-022 executable tests an acceptance condition.
- [x] FPSD-013 approves the two-value taxonomy lifecycle contract; its physical mapping remains subject to this review.
- [x] Every FK action preserves history and no cascade is unjustified.
- [x] Migration-one indexes are sufficient without speculative write cost.
- [x] PostgreSQL 16 supports every proposed type, predicate, FK, and locking expectation.
- [x] Empty apply, failure recovery, drift, forward evolution, and rollback implications are safe.

**Decision record**

- Decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Signature: Approval supplied through the governance review process
- Decision date: 2026-07-17
- Required amendments: None
- Evidence/reference: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Security and Privacy

**Multidisciplinary evidence:** [Security and Privacy assessment](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#security-and-privacy-assessment).

**Amendment-verification evidence:** [Security and Privacy conclusion](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#independent-perspective-verification).

**Advisory recommendation:** `RECOMMEND APPROVAL`.

- Resolved: MDR-SP-001, MDR-SP-002, and MDR-SP-003 through deny-by-default access, interim preservation, bounded reason codes, opaque command IDs, and negative-test requirements.
- Accepted: MDR-SP-004 and MDR-SP-005 remain observations; final legal retention and production role implementation remain later gates.

- [x] Learner, Device, and actor personal data is minimized and correctly classified.
- [x] Credentials, provider subjects, tokens, direct identifiers, hardware IDs, and arbitrary payloads are excluded.
- [x] Internal User identity remains separate from login identity and retained activity.
- [x] Deactivation/anonymization can preserve historical Revision, session, sync, and audit meaning.
- [x] FPSD-007 prohibits unrestricted taxonomy notes and arbitrary sensitive payloads.
- [x] Future actor profile/access treatment cannot erase or rewrite audit evidence; no unused actor lifecycle field is added.
- [x] FPSD-014 records the least-privilege and repository-only conceptual boundary.
- [x] The proposed physical access and privilege test plan makes the no-trigger guarantee acceptable.

**Decision record**

- Decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Signature: Approval supplied through the governance review process
- Decision date: 2026-07-17
- Required amendments: None
- Evidence/reference: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Product/Governance

**Multidisciplinary evidence:** [Product/Governance assessment](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#productgovernance-assessment).

**Amendment-verification evidence:** [Product/Governance conclusion](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#independent-perspective-verification).

**Advisory recommendation:** `RECOMMEND APPROVAL`.

- Resolved: MDR-PG-001 and MDR-PG-002; Language schema/seed is content-only and the physical `ACTIVE` mapping is explicit.
- Resolved governance item: MDR-XD-002 requires one direct successor and prohibits branching.
- Open blocker/major findings: none.

- [x] The selected migration-one table scope is acceptable and does not imply unapproved product behavior.
- [x] English, isiZulu, and Sepedi remain the only launch seed Languages.
- [x] FPSD-009/FPSD-010 approve labels, tags, ISO bases, order, and stable seed UUID ownership.
- [x] FPSD-001 defers learner identity, preferences, and devices.
- [x] Interface-language support is not approved and is absent from migration one without contradiction.
- [x] Authentication, RBAC, localization, lessons, activity, sync, privacy workflows, analytics, and future content generation are acceptably deferred.
- [x] Seed exclusions preserve the human editorial publication workflow and prohibit privileged/personal data.

**Decision record**

- Decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Signature: Approval supplied through the governance review process
- Decision date: 2026-07-17
- Required amendments: None
- Evidence/reference: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

## Gate outcome

All migration-one FPSD decisions and all 22 multidisciplinary findings are RESOLVED or ACCEPTED. The five supplied human decisions are `APPROVED` as of 2026-07-17. Review status is therefore **approved**, and the governance phase is complete. Prisma schema implementation is **authorized** for the exact five-table scope. Migration generation and execution, seeds, repositories, APIs, Flutter implementation, and PostgreSQL changes remain **unauthorized**.
