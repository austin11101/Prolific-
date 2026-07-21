# First Physical Schema Decision Brief

**Status:** `FIRST PHYSICAL SCHEMA APPROVED; PRISMA SCHEMA IMPLEMENTATION AUTHORIZED; FIRST MIGRATION BLOCKED`.

This brief condenses the [First Physical Schema Proposal](../07-database/first-physical-schema-proposal.md), [Seed Proposal](../07-database/first-seed-data-proposal.md), [Normalization Decision](../07-database/taxonomy-normalization-decision.md), and [Decision Register](./FIRST-PHYSICAL-SCHEMA-OPEN-DECISIONS.md). The five supplied human decisions are recorded in the [First Physical Schema Approval](./FIRST-PHYSICAL-SCHEMA-APPROVAL.md). They approve the reviewed five-table design and authorize only Prisma schema implementation.

## Approved migration-one boundary

Migration one is reduced from eight proposed tables to five:

1. `actor_principals`
2. `languages`
3. `categories`
4. `topics`
5. `taxonomy_change_records`

FPSD-001 defers `users`, `user_preferences`, and `devices` until authentication, account lifecycle, consent, safeguarding, device ownership, and anonymization policies are resolved.

## Table decision matrix

| Table                     | Migration-one purpose                           | Recorded governance outcome                             | Approval status |
| ------------------------- | ----------------------------------------------- | ------------------------------------------------------- | --------------- |
| `actor_principals`        | Stable pseudonymous actor for taxonomy evidence | Controlled idempotent provisioning; no identity payload | Approved        |
| `languages`               | Stable launch content-language identity         | Unique normalized name/tag; runtime mutation prohibited | Approved        |
| `categories`              | Top-level taxonomy authority                    | `ACTIVE`/`ARCHIVED` lifecycle approved                  | Approved        |
| `topics`                  | Same-Category adjacency-list hierarchy          | `ACTIVE`/`ARCHIVED`; cycle strategy approved            | Approved        |
| `taxonomy_change_records` | Structured append-only taxonomy evidence        | Exactly one target and one-successor linear corrections | Approved        |

## Recorded decisions

| ID       | Outcome                                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FPSD-001 | Defer learner identity shells from migration one.                                                                                                                                 |
| FPSD-002 | Include strictly pseudonymous `actor_principals`; prohibit direct identifiers, credentials, tokens, provider subjects, and unrestricted labels.                                   |
| FPSD-005 | Approve the documented normalization profile; TN-001–TN-022 automated tests are required before repository acceptance.                                                            |
| FPSD-006 | Approve application-owned cycle prevention with repository-only writes, least privilege, locks/version checks, atomic audit/version updates, revalidation, and concurrency tests. |
| FPSD-007 | Omit unrestricted narrative notes; taxonomy audit uses structured fields only.                                                                                                    |
| FPSD-009 | Approve English/en-ZA/eng/1, isiZulu/zu-ZA/zul/2, and Sepedi/nso-ZA/nso/3 as content-only Language records.                                                                       |
| FPSD-010 | Approve the three immutable Prolific-governance UUIDv4 Language identities.                                                                                                       |
| FPSD-013 | Approve `ACTIVE` and `ARCHIVED` as the only taxonomy lifecycle values; no actor lifecycle field.                                                                                  |
| FPSD-014 | Approve separated migration, application, optional read-only operational, and owner/admin privilege boundaries.                                                                   |

## Normalization contract

Taxonomy/reference comparison keys use NFKC, locale-independent full case fold, trimmed/collapsed whitespace, and canonical apostrophe/dash variants where applicable. Meaningful punctuation and diacritics remain significant. Controls, bidi controls, zero-width characters, soft hyphen, and default-ignorables are rejected. Display values, comparison keys, slugs, and UUIDs remain separate. Future normalized equality/uniqueness columns use explicit PostgreSQL `"C"` collation; display sorting does not use the normalized keys.

The TN-001–TN-022 corpus must become executable automated tests across create, rename, reparent, import, and seed paths before the taxonomy repository is accepted.

## Topic cycle-prevention contract

The adjacency list remains the migration-one authority. Every hierarchy write must:

1. enter through the taxonomy repository under the least-privilege runtime role;
2. lock the Category row through the parameterized taxonomy-adapter-only Prisma interactive-transaction exception and verify Category `hierarchy_version` plus relevant Topic versions;
3. reject self-parent, descendant cycles, and cross-Category parenthood;
4. revalidate normalized sibling uniqueness;
5. update versions and structured audit evidence atomically; and
6. pass concurrent reparent integration tests.

Direct production database writes are operationally prohibited. Raw SQL outside the minimum static-identifier Category lock is prohibited. Stable error translation, bounded recognized retries, privacy-safe observability, and concurrent/stale/deadlock/rollback/audit-atomicity tests are required. No trigger or stored procedure is required by FPSD-006. FPSD-014 approves the conceptual least-privilege boundary; roles, grants, and privilege tests remain unimplemented.

## Actor and audit privacy boundary

`actor_principals` is a pseudonymous audit subject, not a learner account, login identity, credential store, or RBAC model. It is provisioned only through a controlled idempotent service/repository, has no public endpoint or runtime deletion, and may not contain names, email addresses, phone numbers, usernames, provider subjects, credentials, tokens, unrestricted labels, or other direct identifiers. Future linkage uses separate mappings and preserves every audit actor UUID.

`taxonomy_change_records` may contain only reviewed structured evidence. Exactly one Category/Topic target FK is populated; target type is derived. Corrections append a same-target acyclic restrictive self-reference. A nullable unique constraint permits each record at most one direct successor, producing a deterministic linear chain; terminal validation is transactional. It may not contain unrestricted narrative notes, arbitrary JSON, contact details, credentials, tokens, provider identifiers, or sensitive labels. It is restricted operational audit data, excluded from public/learner/ordinary-reader paths. Migration one performs no automated expiry/deletion while final retention remains policy-pending.

## Approved seed identities

| Language | UUIDv4                                 | BCP 47   | ISO basis | Order |
| -------- | -------------------------------------- | -------- | --------- | ----: |
| English  | `b59a72c2-bb1d-43e2-b0ab-b3d7fdd08890` | `en-ZA`  | `eng`     |     1 |
| isiZulu  | `70776e42-a5fa-4c85-8c00-ba1cac8dcbac` | `zu-ZA`  | `zul`     |     2 |
| Sepedi   | `0bee1a85-35bf-4096-ac2a-b6ac12c58382` | `nso-ZA` | `nso`     |     3 |

All three are active content languages. Tutorial-audio, voice, text-to-speech, interface-language, and broader lesson-availability capability fields are not approved and are not represented in migration one.

## Approved lifecycle and privilege boundaries

Category and Topic default to `ACTIVE` and may transition reversibly to `ARCHIVED`. Restoration revalidates uniqueness, parent validity, Category consistency, Effective Visibility, and expected versions. `DELETED`, hidden, and withdrawal are not taxonomy lifecycle values. `actor_principals` has no broad account state or unused lifecycle field.

The [Database Privilege Model](../07-database/database-privilege-model.md) separates migration, application, optional read-only operational, and database owner/admin identities. NestJS uses only the least-privilege application identity.

## Remaining implementation and migration gates

- No migration-one FPSD decision blocker remains.
- No multidisciplinary technical or design-decision blocker remains; the amended proposal records 17 non-primary indexes, eight FKs, 26 checks, five non-primary-key unique constraints, and five primary keys (44 named constraints overall).
- MDR-XD-002 is resolved by the one-direct-successor decision.
- Sprint 2.9 multidisciplinary amendment verification is complete.
- Software Architecture, Backend, Data/Database, Security and Privacy, and Product/Governance decisions are all `APPROVED` as of 2026-07-17.
- Prisma schema implementation is authorized for the approved five tables only.
- Separate approval of migration generation in the [First Migration Checklist](./FIRST-MIGRATION-CHECKLIST.md).

At this approval checkpoint, `schema.prisma` remains model-free because implementation has not begun. Migration generation/execution, SQL, seeds, repositories, APIs, Flutter work, and PostgreSQL changes remain unauthorized.
