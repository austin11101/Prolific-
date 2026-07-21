# First Physical Schema Decision Register

## Status and governance

**Status:** `ALL MIGRATION-ONE DECISIONS CLOSED; FIRST PHYSICAL SCHEMA APPROVED; MIGRATION GENERATION BLOCKED`.

Decision IDs are stable. The Sprint 2.5 supplied decision definitions are authoritative. The earlier draft FPSD-006 corpus row is merged into FPSD-005, the earlier cycle row is superseded by FPSD-006, and the earlier audit-note row is superseded by FPSD-007. FPSD-008 is retained as a superseded historical identifier and must not be reused.

The supplied governance decisions reduce migration one to `actor_principals`, `languages`, `categories`, `topics`, and `taxonomy_change_records`. The required multidisciplinary human approval is now recorded in the [review](./FIRST-PHYSICAL-SCHEMA-REVIEW.md) and [approval record](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md). Prisma schema implementation is authorized for this exact scope; migration generation remains blocked.

## Decision register

| ID       | Decision                                                      | Owner                                   | Required reviewers                                     | Migration-one effect                                                        | Final status                        |
| -------- | ------------------------------------------------------------- | --------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------- | ----------------------------------- |
| FPSD-001 | Learner identity shells in migration one                      | Product Owner / architecture governance | Architecture, Backend, Security, Privacy, Product      | Defer `users`, `user_preferences`, and `devices`                            | Resolved 2026-07-17                 |
| FPSD-002 | Audit actor strategy                                          | Product Owner / architecture governance | Architecture, Backend, Data, Security                  | Include strict pseudonymous `actor_principals`                              | Resolved 2026-07-17                 |
| FPSD-003 | Account-state representation                                  | Architecture and Privacy                | Backend, Data, Security                                | Non-blocking because `users` is deferred                                    | Deferred, not resolved              |
| FPSD-004 | Device state and ownership                                    | Security Architecture                   | Backend, Privacy, Data                                 | Non-blocking because `devices` is deferred                                  | Deferred, not resolved              |
| FPSD-005 | Taxonomy normalization and acceptance corpus                  | Product Owner / architecture governance | Product/Content, Data, Backend, Security, Architecture | Profile approved; TN-001–TN-022 tests required before repository acceptance | Resolved 2026-07-17                 |
| FPSD-006 | Topic cycle prevention                                        | Product Owner / architecture governance | Architecture, Backend, Data, Security, Operations      | Application-owned strategy approved with mandatory controls                 | Resolved with conditions 2026-07-17 |
| FPSD-007 | Taxonomy audit narrative data                                 | Product Owner / architecture governance | Security, Privacy, Product/Governance, Backend, Data   | Structured fields only; unrestricted notes prohibited                       | Resolved 2026-07-17                 |
| FPSD-008 | Earlier draft audit-note identifier                           | Not applicable                          | Not applicable                                         | Superseded by authoritative FPSD-007                                        | Superseded 2026-07-17               |
| FPSD-009 | Launch Language labels and BCP 47/ISO relationships           | Product Owner / architecture governance | Linguistic reviewer, Data, Architecture                | Approves exact three-row content-language values                            | Resolved 2026-07-17                 |
| FPSD-010 | Fixed Language seed UUID ownership                            | Product Owner / architecture governance | Data, Architecture, Backend                            | Approves immutable governance-owned UUIDv4 identities                       | Resolved 2026-07-17                 |
| FPSD-011 | `user_preferences` timing                                     | Software Architecture                   | Product, Backend, Privacy                              | Non-blocking because FPSD-001 defers it                                     | Deferred, not resolved              |
| FPSD-012 | Interface-language status                                     | Product Owner                           | Content/Localization, Mobile, Architecture             | Non-blocking while interface-use fields remain absent                       | Open, non-blocking                  |
| FPSD-013 | First-migration lifecycle-state representation                | Product Owner / architecture governance | Product, Backend, Architecture                         | Approves `ACTIVE`/`ARCHIVED`; no actor lifecycle field                      | Resolved 2026-07-17                 |
| FPSD-014 | Database privilege model for repository-only hierarchy writes | Product Owner / architecture governance | Backend, Data, Operations                              | Approves migration/runtime/admin separation and least privilege             | Resolved 2026-07-17                 |

## Resolved decision records

### FPSD-001 — Defer learner identity shells

- **Status:** Resolved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Defer `users`, `user_preferences`, and `devices` from migration one.
- **Reason:** Authentication, account lifecycle, consent, safeguarding, device ownership, and anonymization policy are unresolved.
- **Required implementation conditions:** Retain the entities in the canonical domain model and submit them to a later physical-schema review only after the named policy and lifecycle dependencies are sufficiently finalized.
- **Consequence:** Migration one is a five-table pseudonymous actor-and-taxonomy foundation. Account/device design moves to a later reviewed migration.
- **Evidence:** [Decision Brief](./FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md), [schema proposal](../07-database/first-physical-schema-proposal.md), and the Sprint 2.5 supplied decision package.

### FPSD-002 — Include a strictly pseudonymous audit actor

- **Status:** Resolved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Include `actor_principals`; remove `reference_label`.
- **Prohibition:** Do not store names, email addresses, phone numbers, provider subjects, usernames, credentials, tokens, unrestricted labels, or other direct identifiers.
- **Required implementation conditions:** Keep the record pseudonymous and exclude telephone numbers, authentication-provider subjects, access tokens, refresh tokens, unrestricted display/reference labels, and all direct personal identifiers in addition to the prohibited data above.
- **Consequence:** Taxonomy audit records retain a stable actor foreign key without defining learner identity, authentication, or RBAC.
- **Evidence:** [Decision Brief](./FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md), [schema proposal](../07-database/first-physical-schema-proposal.md), and the Sprint 2.5 supplied decision package.

### FPSD-005 — Approve taxonomy normalization

- **Status:** Resolved with an implementation acceptance condition.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Use NFKC, locale-independent full case fold, trim/collapse whitespace, canonical apostrophe/dash variants, and preserve meaningful punctuation and diacritics. Reject controls, bidi controls, zero-width characters, soft hyphen, and default-ignorables. Keep display values, comparison keys, slugs, and UUIDs separate.
- **Required implementation conditions:** TN-001 through TN-022 must be executable automated tests before the taxonomy repository is accepted. They must prove intended collisions, intended distinctions, prohibited-character rejection, determinism, and shared implementation across create, rename, reparent, import, and seed validation.
- **Consequence:** Category/Topic uniqueness has an approved comparison contract; implementation cannot be accepted on documentation examples alone.
- **Evidence:** [Normalization Decision](../07-database/taxonomy-normalization-decision.md), [schema proposal](../07-database/first-physical-schema-proposal.md), and the Sprint 2.5 supplied decision package.

### FPSD-006 — Approve application-owned cycle prevention

- **Status:** Resolved with mandatory controls.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Approve application-owned cycle prevention. No database trigger or hierarchy procedure is required in migration one.
- **Required implementation conditions:** All taxonomy writes use the approved repository/application-service boundary; direct application database writes outside it are prohibited; production privileges follow least privilege; the Category row is locked before mutation; expected `hierarchy_version` and affected Topic `lock_version` values are verified; self-parenting, ancestor cycles, and cross-Category parenting are rejected; sibling normalized-name uniqueness is revalidated; hierarchy/entity versions and `taxonomy_change_records` evidence are updated in one transaction; concurrent reparenting integration tests are mandatory; and unsupported direct database writes are operationally prohibited because they can bypass cycle enforcement.
- **Consequence:** The application owns the cross-row invariant; FPSD-014 supplies its approved conceptual privilege boundary, with implementation evidence still required before deployment.
- **Evidence:** [Decision Brief](./FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md), [schema proposal](../07-database/first-physical-schema-proposal.md), and the Sprint 2.5 supplied decision package.

### FPSD-007 — Prohibit unrestricted taxonomy audit notes

- **Status:** Resolved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** `taxonomy_change_records` contains structured fields only. It must not contain sensitive/free-text notes, arbitrary JSON, credentials, tokens, contact details, provider identifiers, or unrestricted labels.
- **Required implementation conditions:** Where applicable, structured evidence may include actor principal, command identifier, target type/identifier, operation, structured reason code, previous/resulting lifecycle state, previous/resulting parent identifier, previous/resulting version, and occurrence timestamp. It must exclude credentials, tokens, request/response bodies, direct identifiers, arbitrary JSON metadata, learner activity, sensitive allegations, and unrestricted free-text notes. Narrative notes require a later separately reviewed protected design.
- **Consequence:** Audit evidence remains minimal and machine-reviewable; a future protected narrative mechanism would require a new decision and retention/access policy.
- **Evidence:** [Decision Brief](./FIRST-PHYSICAL-SCHEMA-DECISION-BRIEF.md), [schema proposal](../07-database/first-physical-schema-proposal.md), and the Sprint 2.5 supplied decision package.

### FPSD-009 — Approve launch content-language values

- **Status:** Resolved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Approve English (`en-ZA`, ISO basis `eng`, order 1), isiZulu (`zu-ZA`, ISO basis `zul`, order 2), and Sepedi (`nso-ZA`, ISO basis `nso`, order 3) as the three launch content-language records.
- **Required implementation conditions:** Store canonical labels and BCP 47 tags independently. Represent each row as active and content-enabled. Do not infer or represent interface-language support in migration one.
- **Consequence:** The production Language seed has exactly three approved value rows and no localization-interface commitment.
- **Evidence:** [Seed Proposal](../07-database/first-seed-data-proposal.md), [Product Decision Log](../product-decision-log.md), and the Sprint 2.6 supplied decision package.

### FPSD-010 — Approve fixed Language UUID ownership

- **Status:** Resolved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Prolific platform governance owns English `b59a72c2-bb1d-43e2-b0ab-b3d7fdd08890`, isiZulu `70776e42-a5fa-4c85-8c00-ba1cac8dcbac`, and Sepedi `0bee1a85-35bf-4096-ac2a-b6ac12c58382` as immutable UUIDv4 reference identities.
- **Required implementation conditions:** Use each UUID unchanged in every environment, never regenerate it, never reuse a retired UUID, and never reassign it to another Language.
- **Consequence:** Fixtures, contracts, and future approved seed execution share stable platform-owned identities.
- **Evidence:** [Seed Proposal](../07-database/first-seed-data-proposal.md), [Product Decision Log](../product-decision-log.md), and the Sprint 2.6 supplied decision package.

### FPSD-013 — Approve taxonomy lifecycle states

- **Status:** Resolved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Category and Topic use the stable conceptual enum values `ACTIVE` and `ARCHIVED`. There is no `DELETED` state; archive is reversible; withdrawal is not a taxonomy state. Do not add a broad account-state enum or unused lifecycle field to `actor_principals`.
- **Required implementation conditions:** Default new taxonomy rows to `ACTIVE`; record archive time; protect transitions with expected versions; make archived ancestry affect Effective Visibility without rewriting descendants; on restoration, revalidate uniqueness, parent validity, Category consistency, and Effective Visibility. Prisma enum/schema implementation is authorized only within the approved five-table scope.
- **Consequence:** Taxonomy predicates and restoration rules now have a closed two-state contract while actor identity remains narrow.
- **Evidence:** [Schema Proposal](../07-database/first-physical-schema-proposal.md), [ERD](../07-database/erd.md), and the Sprint 2.6 supplied decision package.

### FPSD-014 — Approve database privilege separation

- **Status:** Resolved.
- **Date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Final decision:** Separate a controlled migration role, least-privilege application role, optional explicitly scoped read-only operational role, and reserved database owner/admin role. The NestJS runtime never uses migration, owner/admin, schema-owner, or superuser credentials.
- **Required implementation conditions:** Separate migration/runtime secrets; supply secrets through deployment secret management; deny runtime schema/role/extension administration; deny restricted audit/personal access to operational readers by default; route taxonomy writes through approved repositories; and require production-parity privilege tests before deployment. Local development may use simplified credentials only within this boundary.
- **Consequence:** FPSD-006 has an approved privilege boundary, but roles, grants, and tests still require separately authorized implementation.
- **Evidence:** [Database Privilege Model](../07-database/database-privilege-model.md), [Implementation Decisions](./SPRINT-2-IMPLEMENTATION-DECISIONS.md), and the Sprint 2.6 supplied decision package.

## Multidisciplinary amendment decision

### MDR-XD-002 — Limit direct supersession to one successor

- **Status:** Resolved 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied through the review process.
- **Decision:** A taxonomy change record may have at most one direct successor. Nullable `supersedes_change_record_id` forms a deterministic linear chain and may be reused by no second correction.
- **Rationale:** Prevent ambiguous correction branches while permitting any finite sequence of later corrections.
- **Consequences:** Add a nullable unique predecessor constraint/backing index; preserve the restrictive self-FK and self check; validate terminal, earlier, same-target, and acyclic relationships transactionally; translate competing successors to one stable conflict.
- **Implementation conditions:** Original/predecessor links are immutable; correction and audit insertion are atomic; one concurrent successor commits; no recursive trigger, stored procedure, or extra raw-query exception is required.
- **Evidence:** [Physical proposal](../07-database/first-physical-schema-proposal.md#taxonomy_change_records), [Sprint 2.9 amendment verification](./FIRST-PHYSICAL-SCHEMA-MULTIDISCIPLINARY-REVIEW.md#sprint-29-final-amendment-verification), and the supplied Sprint 2.9 decision package.

## Remaining implementation requirements

The physical-schema review has passed. The following conditions remain:

1. No migration-one FPSD decision blocker remains. FPSD-003, FPSD-004, and FPSD-011 remain deferred with identity tables; FPSD-012 remains non-blocking because interface-language fields are absent.
2. Software Architecture, Backend, Data/Database, Security and Privacy, and Product/Governance decisions are recorded as `APPROVED` on 2026-07-17.
3. TN-001 through TN-022 must become executable automated tests before taxonomy repository acceptance.
4. Prisma schema implementation is authorized, but the [First Migration Checklist](./FIRST-MIGRATION-CHECKLIST.md) must receive separate migration-generation authorization before any migration is created.
