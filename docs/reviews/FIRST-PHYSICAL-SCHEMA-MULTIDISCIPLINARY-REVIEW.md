# First Physical Schema Multidisciplinary Review

> **Sprint 2.10 governance closure:** The five supplied human approvals are recorded below and in the [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md). Prisma schema implementation is now authorized for the exact approved five-table scope. The historical finding register remains unchanged; migration generation and execution remain blocked.

## Executive summary

**Overall advisory recommendation:** `RECOMMEND APPROVAL`.

**Implementation readiness:** `FIRST PHYSICAL SCHEMA APPROVED — PRISMA SCHEMA IMPLEMENTATION AUTHORIZED`.

**Migration readiness:** `BLOCKED`.

The five-table boundary remains independently coherent and does not introduce learner identity, authentication, lessons, activity, synchronization, or privacy workflow tables. Sprint 2.8 resolved every original actionable finding, and Sprint 2.9 resolves MDR-XD-002 through a nullable unique predecessor constraint and transactional terminal-chain validation. Technical blockers, open major findings, and design-decision blockers are zero. The amended proposal has 17 non-primary indexes, eight FKs, 26 checks, five non-primary-key unique constraints, and five primary keys (44 named constraints overall).

The original review records 2 BLOCKER, 8 MAJOR, 6 MINOR, and 5 OBSERVATION findings. All 16 actionable original findings remain resolved and all five observations remain accepted. MDR-XD-002, the one additional MAJOR finding, is now resolved. All 22 findings are therefore RESOLVED or ACCEPTED. Sprint 2.10 records the five supplied human approvals.

## Scope reviewed

Migration one remains exactly:

1. `actor_principals`
2. `languages`
3. `categories`
4. `topics`
5. `taxonomy_change_records`

`users`, `user_preferences`, `devices`, authentication/direct identity, RBAC, lesson/editorial structures, reading activity, synchronization persistence, and privacy/retention workflows remain deferred.

## Evidence reviewed

- [Product Decision Log](../product-decision-log.md), [PRD](../01-product-vision/product-requirements-document.md), [Canonical Domain Model](../architecture/canonical-domain-model.md), and [Domain Glossary](../02-requirements/domain-glossary.md)
- [Database Overview](../07-database/database-overview.md), [Database Privilege Model](../07-database/database-privilege-model.md), [ERD](../07-database/erd.md), [Physical Schema Proposal](../07-database/first-physical-schema-proposal.md), [Seed Proposal](../07-database/first-seed-data-proposal.md), and [Normalization Decision](../07-database/taxonomy-normalization-decision.md)
- [Backend Architecture](../06-core-backend/backend-architecture.md), [API Overview](../08-api-specification/api-overview.md), testing, security, privacy, synchronization, offline, and deployment documents
- [Sprint 2 Implementation Decisions](./SPRINT-2-IMPLEMENTATION-DECISIONS.md), [Decision Brief](./FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md), [Decision Register](./FIRST-PHYSICAL-SCHEMA-OPEN-DECISIONS.md), and [First Migration Checklist](./FIRST-MIGRATION-CHECKLIST.md)
- ADR-012 through ADR-017, the model-free Prisma configuration, the PostgreSQL adapter/service skeleton, PostgreSQL 16.13 runtime evidence, and the zero-object database audit

The following five discipline assessments preserve the Sprint 2.7 findings as reviewed. Their risks/required-amendment text is historical; current closure evidence and consequences are authoritative in [Sprint 2.8 finding reconciliation](#sprint-28-finding-reconciliation).

## Software Architecture assessment

### Strengths

- The five-table boundary is cohesive: pseudonymous audit identity, stable Languages, authoritative taxonomy, and typed taxonomy evidence can exist without learner identity.
- `actor_principals` is deliberately narrower than User, authentication identity, RBAC, or a mutable profile. Later mappings can reference its stable UUID without replacing historical actor references.
- Category owns the Topic hierarchy and its concurrency version. Taxonomy changes and append-only evidence share one repository/transaction boundary.
- Deferred identity, lesson, editorial, activity, sync, and privacy structures retain safe extension points without Prisma types leaking into domain/application layers.

### Risks and contradictions

- The audit table's Category/Topic target shape is internally contradictory and therefore does not yet provide a stable aggregate ownership rule (MDR-DD-001).
- Actor provisioning and later identity/profile linkage have no named owning write boundary, although the stable-ID direction is sound (MDR-SA-001).
- The documented correction behavior promises a superseding record without a physical linkage mechanism (MDR-XD-001).

### Required amendments

- Define one audit ownership/target shape and enforce it consistently through nullability, checks, FKs, indexes, and repository commands.
- Name the actor-principal provisioning owner and future mapping boundary without adding identity fields to `actor_principals`.
- Define how immutable audit corrections link to the superseded fact.

### Advisory recommendation

`RECOMMEND APPROVAL WITH AMENDMENTS`.

## Backend Engineering assessment

### Strengths

- The installed Prisma 7 adapter/client boundary supports interactive transactions, isolation configuration, parameterized raw queries, and generated-client isolation below repositories.
- Optimistic `lock_version`, Category `hierarchy_version`, unique `command_id`, partial uniqueness, and atomic audit insertion map cleanly to application-service transactions.
- Same-Category parenting and self-parent rejection are declarative; recursive ancestry and cycle freedom are correctly assigned to the authoritative transaction.
- Retryable infrastructure conflicts are distinguished from stale business-version conflicts.

### Risks and contradictions

- Prisma does not provide a model-level `SELECT ... FOR UPDATE` operation; the required Category row lock needs a narrowly governed parameterized raw-query path or another reviewed locking mechanism. Raw SQL escape-hatch governance is currently listed as unresolved (MDR-BE-001).
- `languages` contains mutable order/use/retirement fields and `updated_at` but has neither a concurrency token nor a named mutation owner (MDR-BE-002).
- Operation-specific audit row checks and error mappings are not fully enumerated (MDR-DD-005).

### Required amendments

- Approve the exact repository-owned locking mechanism and its test/error boundary before implementation.
- Decide whether Language mutation is migration/governance-only or concurrency-protected through an explicit command/repository policy.
- Catalogue operation-specific validation for Category versus Topic commands.

### Advisory recommendation

`RECOMMEND APPROVAL WITH AMENDMENTS`.

## Data/Database assessment

### Strengths

- Native UUID, `timestamptz`, integer versions/order, explicit nullability/defaults, no-extension baseline, and no destructive cascade are PostgreSQL 16.13-compatible.
- The composite Topic self-FK plus `parent_topic_id <> id` correctly enforces same-Category parenthood and self-parent rejection.
- Separate root and child partial unique indexes avoid PostgreSQL nullable-parent uniqueness gaps.
- The 13-row non-primary index catalogue contains no speculative GIN, BRIN, trigram, full-text, or covering index.
- Integrity is clearly divided among declarative constraints, transactions, repository rules, tests, and operational controls.

### Risks and contradictions

- `taxonomy_change_records.category_id`/`topic_id` are both nullable; the text requires exactly one target while also requiring a Topic record to carry its Category owner. The check, FK shape, and stated seven-FK count cannot all be verified until this is resolved (MDR-DD-001).
- `languages` claims `uq__languages__canonical_name`, but the 13-index catalogue contains no such constraint/index (MDR-DD-002).
- `previous_parent_topic_id` and `resulting_parent_topic_id` are described as `RESTRICT` FKs but lack leading-column indexes for parent deletion/history-protection checks (MDR-DD-003).
- The normalized-key indexes do not explicitly prohibit nondeterministic collation or otherwise pin byte-stable comparison semantics (MDR-DD-004).
- The ISO basis/tag mapping has approved values but no named declarative or transactional validation rule (MDR-DD-006).

### Required amendments

- Resolve the audit target/owner columns first, then recalculate the FK and index catalogues.
- Either add/catalogue canonical Language-name uniqueness or remove the unsupported uniqueness claim.
- Add supporting indexes for audit parent FKs or document a measured, reviewed exception.
- Require deterministic normalized-key comparison independent of provider/database locale.
- Catalogue tag/ISO-basis validation and its owner.

### Advisory recommendation

`RECOMMEND APPROVAL WITH AMENDMENTS`.

## Security and Privacy assessment

### Strengths

- `actor_principals` contains only opaque UUID identity, constrained kind, and creation time; direct identifiers, credentials, provider subjects, labels, tokens, and roles are excluded.
- The actor and taxonomy audit classifications now explicitly state that pseudonymous data is not anonymous and is unavailable to learner/discovery/analytics/ordinary operational paths.
- Taxonomy evidence is structured, append-only, and excludes unrestricted notes, arbitrary JSON, request/response bodies, learner activity, and sensitive allegations.
- Migration/runtime/admin credentials are separated, operational-read access is deny-by-default, and taxonomy writes remain repository-owned.
- The privilege model now explicitly denies update/delete on immutable actor and taxonomy-audit rows (MDR-SP-001 resolved).

### Risks and contradictions

- No approved retention period/class, deletion prohibition duration, reason-code vocabulary/format, or complete audit-reader capability is documented for `taxonomy_change_records` (MDR-SP-002).
- A globally unique `command_id` can become a correlation identifier if reused in logs or external contexts; the proposal now makes it opaque/non-semantic but operational correlation boundaries still need tests (MDR-SP-003).
- Future human-profile linkage can re-identify actor UUIDs, so access to actor/time audit history remains pseudonymous personal/security data even without labels.
- The pre-existing local Compose bootstrap role `prolific` is a login superuser with role/database creation capability. This is permitted only as simplified local development and is not evidence of FPSD-014 production separation (MDR-SP-005).

### Required amendments

- Obtain Security/Privacy/Governance agreement on audit access, reason-code controls, correction access, and retention treatment before schema approval.
- Add negative tests proving command IDs contain no embedded meaning and are not exposed through learner or unrestricted logging paths.

### Advisory recommendation

`RECOMMEND APPROVAL WITH AMENDMENTS`.

## Product/Governance assessment

### Strengths

- The three records exactly match PD-004/FPSD-009/FPSD-010, including labels, tags, ISO bases, order, and immutable UUIDs.
- The proposal clearly separates content-language support from interface-language support.
- `ACTIVE`/`ARCHIVED`, reversible restoration, Effective Visibility, and stable taxonomy identity match FPSD-013.
- No learner account, Device, lesson, activity, sync, privacy, or privileged seed data enters migration one.
- The foundation is understandable and meaningful Sprint 2 progress: it establishes governed content-language and taxonomy identity without prematurely implementing learner features.

### Risks and contradictions

- `languages.is_tutorial_audio_enabled` defaults true, but FPSD-009's approved seed values do not authorize that field's production value or governance owner (MDR-PG-001).
- Seed “ACTIVE” status was previously ambiguous; the seed now explicitly maps it to `retired_at IS NULL` plus content enabled and distinguishes it from the taxonomy enum (MDR-PG-002 resolved).

### Required amendments

- Product/Governance must approve, defer, or remove the tutorial-audio enablement value before the Language seed/schema is approved.

### Advisory recommendation

`RECOMMEND APPROVAL WITH AMENDMENTS`.

## Historical Sprint 2.7 finding register

The descriptions below are retained as the immutable Sprint 2.7 review record. Their original status cells show the state at discovery; the authoritative current status and amendment consequence are in the Sprint 2.8 reconciliation table that follows.

| Finding ID  | Severity    | Discipline            | Affected table/document                                                | Description                                                                                                                     | Consequence                                                                                      | Required action                                                                                                        | Evidence                                                                                                                                              | Status                                    |
| ----------- | ----------- | --------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| MDR-BE-001  | BLOCKER     | Backend Engineering   | `categories`, `topics`; backend/database docs                          | Required Category row locking has no approved Prisma/raw-query implementation path while raw SQL governance remains unresolved. | Cycle/reparent concurrency cannot be implemented under the approved boundary.                    | Approve a repository-confined parameterized locking mechanism, isolation/error behavior, and integration tests.        | [Proposal](../07-database/first-physical-schema-proposal.md), [Database Overview](../07-database/database-overview.md), installed Prisma client types | OPEN                                      |
| MDR-DD-001  | BLOCKER     | Data/Database         | `taxonomy_change_records`                                              | Category/Topic columns are nullable, “exactly one” is required, yet Topic evidence must also carry its Category owner.          | Nullability, check constraints, ownership, FKs, and the seven-FK count are indeterminate.        | Define one target/owner row shape and update every dependent catalogue/count.                                          | [Proposal table and FK matrix](../07-database/first-physical-schema-proposal.md)                                                                      | OPEN                                      |
| MDR-DD-002  | MAJOR       | Data/Database         | `languages`; index catalogue                                           | Table text claims `uq__languages__canonical_name`; the 13-index catalogue omits it.                                             | Physical uniqueness and index count disagree.                                                    | Add/catalogue the constraint and recalculate count, or remove the unsupported claim.                                   | [Proposal](../07-database/first-physical-schema-proposal.md)                                                                                          | OPEN                                      |
| MDR-DD-003  | MAJOR       | Data/Database         | `taxonomy_change_records`; index catalogue                             | Previous/resulting parent FKs have no leading-column supporting indexes.                                                        | Parent protection/deletion checks may scan the entire audit table.                               | Add justified indexes or approve a measured exception after final FK shape.                                            | [FK and index catalogues](../07-database/first-physical-schema-proposal.md)                                                                           | OPEN                                      |
| MDR-DD-004  | MAJOR       | Data/Database         | Category/Topic normalized-name indexes                                 | Deterministic normalized keys are approved, but index collation determinism is not explicit.                                    | Provider/database collation could alter intended equality behavior.                              | Require deterministic byte-stable comparison and test the selected database collation.                                 | [Normalization Decision](../07-database/taxonomy-normalization-decision.md), [Proposal](../07-database/first-physical-schema-proposal.md)             | OPEN                                      |
| MDR-BE-002  | MAJOR       | Backend Engineering   | `languages`                                                            | Mutable order/flags/retirement lack a concurrency token or mutation-owner policy.                                               | Concurrent governance updates or seed repair can silently overwrite state.                       | Declare migration-only governance or add an approved concurrency/command policy.                                       | [Proposal](../07-database/first-physical-schema-proposal.md), [Seed Proposal](../07-database/first-seed-data-proposal.md)                             | OPEN                                      |
| MDR-SP-001  | MAJOR       | Security and Privacy  | [Database Privilege Model](../07-database/database-privilege-model.md) | Generic CRUD wording did not expressly deny update/delete on immutable actor/audit rows.                                        | Runtime compromise could rewrite/delete evidence despite repository intent.                      | Specify object-specific insert/read and deny update/delete.                                                            | FPSD-007/FPSD-014, privilege model                                                                                                                    | RESOLVED BY DOCUMENTATION AMENDMENT       |
| MDR-SP-002  | MAJOR       | Security and Privacy  | `taxonomy_change_records`                                              | Audit access capability, controlled reason-code vocabulary/format, correction access, and retention treatment are incomplete.   | Restricted evidence may become overexposed, unbounded, or accept disguised narrative data.       | Obtain Security/Privacy/Governance policy and catalogue enforcement before approval.                                   | [Proposal](../07-database/first-physical-schema-proposal.md), [Privilege Model](../07-database/database-privilege-model.md)                           | OPEN                                      |
| MDR-XD-001  | MAJOR       | Cross-discipline      | `taxonomy_change_records`                                              | Corrections are said to use a superseding record, but no link or alternate deterministic association is proposed.               | Auditors cannot reliably relate correction to superseded evidence.                               | Define a typed self-reference or another reviewed immutable correction association; update FK/index counts.            | [Proposal](../07-database/first-physical-schema-proposal.md), ADR-015/ADR-017                                                                         | OPEN                                      |
| MDR-PG-001  | MAJOR       | Product/Governance    | `languages`, seed proposal                                             | Tutorial-audio enablement defaults true but is absent from the supplied seed approval.                                          | Migration/seed could encode unapproved Language availability behavior.                           | Approve, defer, or remove the field/default/value before schema approval.                                              | [Proposal](../07-database/first-physical-schema-proposal.md), [Seed Proposal](../07-database/first-seed-data-proposal.md), FPSD-009                   | OPEN                                      |
| MDR-DD-005  | MINOR       | Data/Database         | `taxonomy_change_records`                                              | Category-versus-Topic applicability checks for operation/state/parent/version fields are described generally, not catalogued.   | Invalid but structurally non-null audit combinations may reach transaction logic inconsistently. | Add an operation/target validation matrix and enforcement owner.                                                       | [Proposal](../07-database/first-physical-schema-proposal.md)                                                                                          | OPEN                                      |
| MDR-DD-006  | MINOR       | Data/Database         | `languages`                                                            | Exact BCP 47/ISO basis relationships are approved but their validation/check owner is unnamed.                                  | Future rows or repair operations may accept inconsistent mappings.                               | Catalogue application validation and any safe DB checks.                                                               | FPSD-009, [Seed Proposal](../07-database/first-seed-data-proposal.md)                                                                                 | OPEN                                      |
| MDR-SA-001  | MINOR       | Software Architecture | `actor_principals`                                                     | The immutable actor is coherent, but provisioning and future identity/profile-link ownership are unnamed.                       | Implementers may create a generic actor CRUD or duplicate identity directory.                    | Name a narrow provisioning/mapping boundary before repository implementation.                                          | ADR-015, FPSD-002, [Proposal](../07-database/first-physical-schema-proposal.md)                                                                       | OPEN                                      |
| MDR-SP-003  | MINOR       | Security and Privacy  | `taxonomy_change_records.command_id`                                   | Command-ID generation/correlation privacy was implicit.                                                                         | Cross-log/external reuse could create an unintended correlation key.                             | Keep UUID opaque/non-semantic and add exposure/correlation negative tests.                                             | [Proposal](../07-database/first-physical-schema-proposal.md)                                                                                          | RESOLVED IN DESIGN; TEST EVIDENCE PENDING |
| MDR-DOC-001 | MINOR       | Cross-discipline      | Physical proposal                                                      | Category text retained the removed “hide” transition after FPSD-013.                                                            | Lifecycle documentation contradicted the two-state model.                                        | Remove stale wording.                                                                                                  | FPSD-013                                                                                                                                              | RESOLVED BY DOCUMENTATION AMENDMENT       |
| MDR-PG-002  | MINOR       | Product/Governance    | Seed proposal                                                          | “ACTIVE” Language seed status did not state its physical mapping.                                                               | Readers could confuse Language retirement with the taxonomy enum.                                | Map active Language to null retirement plus content enabled.                                                           | FPSD-009, [Seed Proposal](../07-database/first-seed-data-proposal.md)                                                                                 | RESOLVED BY DOCUMENTATION AMENDMENT       |
| MDR-SA-002  | OBSERVATION | Software Architecture | Five-table scope                                                       | Actor/reference/taxonomy/audit form a coherent bounded foundation independent of learner identity.                              | Supports later migrations without replacement identities.                                        | Preserve the boundary.                                                                                                 | ADR-012–ADR-017, proposal                                                                                                                             | ACCEPTED OBSERVATION                      |
| MDR-BE-003  | OBSERVATION | Backend Engineering   | Prisma/NestJS boundary                                                 | Prisma 7 transactions and parameterized raw-query capability make the design feasible once locking governance closes.           | No ORM replacement is indicated.                                                                 | Keep raw access infrastructure-local and purpose-specific.                                                             | Installed Prisma client types and service skeleton                                                                                                    | ACCEPTED OBSERVATION                      |
| MDR-SP-004  | OBSERVATION | Security and Privacy  | `actor_principals`                                                     | Removing labels/direct identifiers materially reduces directory risk, but stable audit linkage remains pseudonymous.            | Access must remain restricted after future identity linkage.                                     | Preserve the explicit classification.                                                                                  | FPSD-002, proposal                                                                                                                                    | ACCEPTED OBSERVATION                      |
| MDR-PG-003  | OBSERVATION | Product/Governance    | Seed proposal                                                          | Labels, tags, ISO bases, order, UUIDs, and content-only meaning match approved decisions exactly.                               | Seed identity is stable across environments without interface-language inference.                | Preserve exact values.                                                                                                 | PD-004, FPSD-009/FPSD-010                                                                                                                             | ACCEPTED OBSERVATION                      |
| MDR-SP-005  | OBSERVATION | Security and Privacy  | Local PostgreSQL environment                                           | The pre-existing `prolific` login role is a superuser with role/database creation capability.                                   | Local development does not demonstrate the approved production privilege separation.             | Keep it local-only; create and test separated non-superuser identities only in a later authorized implementation task. | `compose.yaml`, read-only `pg_roles` verification                                                                                                     | ACCEPTED OBSERVATION                      |

## Sprint 2.8 finding reconciliation

The supplied packet's headings `MDR-SP-003` (reason-code policy) and `MDR-SP-004` (append-only corrections) do not match the already-stable Sprint 2.7 finding subjects. Stable IDs are preserved: those decisions substantively resolve MDR-SP-002 and MDR-XD-001, while the original MDR-SP-003 command-ID finding is resolved through the supplied opaque UUIDv4/access/logging requirements and the original MDR-SP-004 pseudonymity observation remains accepted.

| Finding ID  | Current status | Amendment evidence                                                                                                                        | Resulting consequence                                                                                                                                          |
| ----------- | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| MDR-BE-001  | RESOLVED       | [Raw-query locking exception](../07-database/first-physical-schema-proposal.md#taxonomy-raw-query-locking-exception)                      | One parameterized, static-identifier Category lock is permitted only in the taxonomy adapter/interactive transaction with bounded retries and mandatory tests. |
| MDR-DD-001  | RESOLVED       | [Audit definition and nullability matrix](../07-database/first-physical-schema-proposal.md#taxonomy_change_records)                       | Exactly one target FK is populated; target type is derived; counts are now determinate.                                                                        |
| MDR-DD-002  | RESOLVED       | [Language definition](../07-database/first-physical-schema-proposal.md#languages)                                                         | Separate normalized name and tag values are independently unique; canonical display label is not the comparison key.                                           |
| MDR-DD-003  | RESOLVED       | [Index catalogue](../07-database/first-physical-schema-proposal.md#index-catalogue)                                                       | Separate leading-column indexes support both nullable parent FKs; a composite was rejected as insufficient.                                                    |
| MDR-DD-004  | RESOLVED       | [Normalization decision](../07-database/taxonomy-normalization-decision.md#storage-and-uniqueness-scope)                                  | Future normalized equality/uniqueness columns use explicit PostgreSQL `"C"` collation; migration customization remains review-visible.                         |
| MDR-BE-002  | RESOLVED       | [Language governance policy](../07-database/first-physical-schema-proposal.md#languages)                                                  | Runtime Language mutation is prohibited, so no migration-one lock/version field is required; later amendments preserve UUIDs.                                  |
| MDR-SP-001  | RESOLVED       | [Privilege model](../07-database/database-privilege-model.md#role-responsibilities)                                                       | Immutable actor/audit update/delete is explicitly denied and audit read is deny-by-default.                                                                    |
| MDR-SP-002  | RESOLVED       | [Audit access/retention policy](../07-database/first-physical-schema-proposal.md#taxonomy_change_records)                                 | Restricted access, bounded reason codes, interim preservation, and no automated deletion/expiry are explicit; final legal retention remains later policy.      |
| MDR-XD-001  | RESOLVED       | [Correction relationship](../07-database/first-physical-schema-proposal.md#taxonomy_change_records)                                       | A restrictive nullable self-FK supports immutable same-target acyclic corrections; multiplicity is separated into MDR-XD-002.                                  |
| MDR-PG-001  | RESOLVED       | [Seed proposal](../07-database/first-seed-data-proposal.md#approved-language-records)                                                     | Tutorial-audio and related capability fields/values are absent from migration-one Language schema and seed.                                                    |
| MDR-DD-005  | RESOLVED       | [Operation/nullability matrix](../07-database/first-physical-schema-proposal.md#audit-operation-and-nullability-matrix)                   | Category/Topic target, lifecycle, parent, and version applicability are unambiguous.                                                                           |
| MDR-DD-006  | RESOLVED       | [Shared validation ownership](../07-database/taxonomy-normalization-decision.md#validation-ownership)                                     | One backend component validates BCP 47/ISO/name mappings and normalization across seeds and taxonomy writes.                                                   |
| MDR-SA-001  | RESOLVED       | [Actor provisioning boundary](../architecture/canonical-domain-model.md#identity-and-access-model)                                        | Controlled idempotent provisioning owns immutable actor IDs; future linkage uses separate mappings.                                                            |
| MDR-SP-003  | RESOLVED       | [Raw-query observability and audit classification](../07-database/first-physical-schema-proposal.md#taxonomy-raw-query-locking-exception) | Command IDs are opaque/non-semantic UUIDv4 values and exposure/correlation negative tests are required.                                                        |
| MDR-DOC-001 | RESOLVED       | [Backend taxonomy transactions](../06-core-backend/backend-architecture.md#taxonomy-transactions)                                         | Stale `hide` terminology is removed from the migration-one taxonomy command set.                                                                               |
| MDR-PG-002  | RESOLVED       | [Seed physical mapping](../07-database/first-seed-data-proposal.md#approved-language-records)                                             | Language `ACTIVE` explicitly means unretired and content-enabled, not the taxonomy enum.                                                                       |
| MDR-SA-002  | ACCEPTED       | [Five-table proposal](../07-database/first-physical-schema-proposal.md#migration-scope)                                                   | The bounded foundation remains preserved.                                                                                                                      |
| MDR-BE-003  | ACCEPTED       | [Shared validation/raw-query boundaries](../06-core-backend/backend-architecture.md#taxonomy-transactions)                                | Prisma remains suitable; the observation now has an approved narrow implementation boundary.                                                                   |
| MDR-SP-004  | ACCEPTED       | [Actor classification](../07-database/first-physical-schema-proposal.md#actor_principals)                                                 | Actor UUIDs remain restricted pseudonymous data after future linkage.                                                                                          |
| MDR-PG-003  | ACCEPTED       | [Exact seed values](../07-database/first-seed-data-proposal.md#approved-language-records)                                                 | The three stable content-language identities remain unchanged.                                                                                                 |
| MDR-SP-005  | ACCEPTED       | [Privilege environment policy](../07-database/database-privilege-model.md#environment-expectations)                                       | The local superuser remains local-only evidence and does not demonstrate production separation.                                                                |
| MDR-XD-002  | RESOLVED       | [One-successor decision and correction relationship](../07-database/first-physical-schema-proposal.md#taxonomy_change_records)            | Nullable predecessor uniqueness prohibits branching; terminal/same-target/acyclic validation is atomic and competing successors yield one stable conflict.     |

## Finding totals

| Severity    | Historical/new total |  Open | Resolved | Accepted | Deferred |
| ----------- | -------------------: | ----: | -------: | -------: | -------: |
| BLOCKER     |                    2 |     0 |        2 |        0 |        0 |
| MAJOR       |                    9 |     0 |        9 |        0 |        0 |
| MINOR       |                    6 |     0 |        6 |        0 |        0 |
| OBSERVATION |                    5 |     0 |        0 |        5 |        0 |
| **Total**   |               **22** | **0** |   **17** |    **5** |    **0** |

The original 21 findings reconcile to 16 RESOLVED and five ACCEPTED. MDR-XD-002 is also RESOLVED, giving 17 RESOLVED and five ACCEPTED findings. Technical blockers and open major findings are zero.

## Cross-discipline review

- **Architecture versus database constraints:** MDR-DD-001 is resolved by explicit mutually exclusive target FKs and derived target type.
- **Normalization versus PostgreSQL uniqueness:** The application profile plus explicit PostgreSQL `"C"` collation aligns deterministic values with database equality; TN-001–TN-022 remain mandatory implementation evidence.
- **Repository cycle prevention versus privilege/locking:** MDR-BE-001 is resolved by the taxonomy-adapter-only interactive-transaction locking exception and mandatory integration tests.
- **Pseudonymous actor versus audit usefulness:** Controlled provisioning creates only immutable pseudonymous principals; future resolution/linkage stays separate.
- **Immutable evidence versus correction:** MDR-XD-001 is resolved by the restrictive self-FK and same-target/acyclic repository rules; MDR-XD-002 adds one-successor uniqueness and terminal-chain concurrency behavior without modifying originals.
- **Archive restoration versus uniqueness:** The two partial unique index strategy and mandatory restoration revalidation agree; no contradiction found.
- **Conceptual versus physical lifecycle terms:** Documentation now distinguishes domain/Prisma `ACTIVE`/`ARCHIVED` from approved lowercase PostgreSQL enum values. No additional lifecycle decision is required.
- **Seed identity versus localization:** Canonical labels and BCP 47 tags remain independent, UUIDs remain immutable, and localization/interface-language support remains separate.

No discipline recommends expanding migration-one scope.

## Sprint 2.9 pre-approval requirements

1. Human reviewers must record decisions; completed in Sprint 2.10.
2. Confirm the proposed 17-index, eight-FK, 26-check, five-unique-constraint, and five-primary-key catalogues.
3. Confirm the one-successor correction invariant, raw-query exception, explicit `"C"` collation/customization visibility, interim audit preservation, and privilege test boundaries.
4. Keep first-migration creation blocked until later authorization; Prisma schema implementation is separately authorized by Sprint 2.10 approval.

## Sprint 2.9 final amendment verification

### Amendment scope

The focused amendment replaces the non-unique supersession index with a nullable unique constraint/backing index on `supersedes_change_record_id`. The FK count remains eight, check count remains 26, and total non-primary indexes remain 17. Non-primary-key unique constraints increase from four to five, unique indexes from seven to eight, non-unique indexes decrease from ten to nine, and named table constraints increase from 43 to 44. No table, field, enum, migration, SQL, role, privilege, or runtime component is added.

### Finding verification

- The two original BLOCKER findings remain RESOLVED.
- All eight original MAJOR findings remain RESOLVED.
- All six original MINOR findings remain RESOLVED.
- All five original OBSERVATION findings remain ACCEPTED.
- MDR-XD-002 is RESOLVED by the one-direct-successor decision.
- No new blocker, major issue, contradiction, or scope expansion was found.

### Independent perspective verification

| Perspective           | Verification conclusion                                                                                                                                                                        | Updated advisory recommendation |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------- |
| Software Architecture | Linear immutable correction history preserves aggregate ownership, append-only evidence, and future extension without a branching-resolution concept.                                          | `RECOMMEND APPROVAL`            |
| Backend Engineering   | Terminal/same-target/acyclic validation fits the existing repository transaction; nullable uniqueness provides deterministic concurrent conflict behavior without another raw-query exception. | `RECOMMEND APPROVAL`            |
| Data/Database         | PostgreSQL nullable uniqueness directly enforces one successor, supplies the needed lookup index, avoids redundancy, and leaves the eight-FK/26-check/17-index catalogues coherent.            | `RECOMMEND APPROVAL`            |
| Security and Privacy  | Originals remain immutable, access remains restricted, and deterministic chains reduce ambiguous audit interpretation without adding identity or payload data.                                 | `RECOMMEND APPROVAL`            |
| Product/Governance    | The decision records one unambiguous correction history, changes no learner behavior or MVP scope, and preserves the human approval gate.                                                      | `RECOMMEND APPROVAL`            |

### Final verification outcome

- Technical blockers: **zero**.
- Open major findings: **zero**.
- Design-decision blockers: **zero**.
- Human reviewer decisions: **approved (five) on 2026-07-17**.
- Updated overall advisory recommendation: **`RECOMMEND APPROVAL`**.
- Implementation-readiness recommendation: **Prisma schema implementation authorized for the exact approved five-table scope**.
- Migration-readiness recommendation: **blocked pending focused implemented-schema verification, checklist completion, and later explicit migration authorization**.

## Human decision fields

### Software Architecture

- Advisory recommendation: `RECOMMEND APPROVAL`
- Human decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Date: 2026-07-17
- Required amendments accepted: None
- Evidence/signature: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Backend Engineering

- Advisory recommendation: `RECOMMEND APPROVAL`
- Human decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Date: 2026-07-17
- Required amendments accepted: None
- Evidence/signature: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Data/Database

- Advisory recommendation: `RECOMMEND APPROVAL`
- Human decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Date: 2026-07-17
- Required amendments accepted: None
- Evidence/signature: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Security and Privacy

- Advisory recommendation: `RECOMMEND APPROVAL`
- Human decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Date: 2026-07-17
- Required amendments accepted: None
- Evidence/signature: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

### Product/Governance

- Advisory recommendation: `RECOMMEND APPROVAL`
- Human decision: `APPROVED`
- Reviewer: Project Product Owner / Architecture Governance
- Date: 2026-07-17
- Required amendments accepted: None
- Evidence/signature: [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md)

## Final readiness statement

The supplied amendments resolve every technical and design-decision finding without expanding scope or replacing the approved architecture. All five human decisions are approved. Prisma schema implementation is authorized for the exact five-table scope, but first-migration generation/execution and every downstream activity remain blocked until later explicit authorization. This review creates no physical model, enum, migration, SQL, seed, role, privilege, repository, service, API, or database object.
