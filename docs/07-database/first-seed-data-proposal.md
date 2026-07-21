# First Seed Data Proposal

## Document control

| Item                 | Value                                                                      |
| -------------------- | -------------------------------------------------------------------------- |
| Status               | Language identities and physical values approved; implementation blocked   |
| Scope                | Deterministic reference data associated with the proposed first migration  |
| Implementation state | No seed script or database rows created                                    |
| Related schema       | [First Physical Schema Proposal](./first-physical-schema-proposal.md)      |
| Review package       | [First Physical Schema Review](../reviews/FIRST-PHYSICAL-SCHEMA-REVIEW.md) |

## Seed boundary

The first production baseline seed contains only the three Product-approved launch lesson-content Languages. It contains no Categories, Topics, users, actors, credentials, Devices, Lessons, activity, synchronization evidence, privacy evidence, or production editorial data.

The future seed must be deterministic, idempotent, environment-independent, and safe to re-run. FPSD-010 fixes each UUID once under Prolific platform governance. No database-generated, regenerated, or environment-derived identity is allowed.

## Approved language records

| Stable UUIDv4                          | Canonical label | Normalized name | BCP 47 tag | Normalized tag | ISO basis | Display order | Status   | Content language |
| -------------------------------------- | --------------- | --------------- | ---------- | -------------- | --------- | ------------: | -------- | ---------------- |
| `b59a72c2-bb1d-43e2-b0ab-b3d7fdd08890` | English         | `english`       | `en-ZA`    | `en-za`        | `eng`     |             1 | `ACTIVE` | yes              |
| `70776e42-a5fa-4c85-8c00-ba1cac8dcbac` | isiZulu         | `isizulu`       | `zu-ZA`    | `zu-za`        | `zul`     |             2 | `ACTIVE` | yes              |
| `0bee1a85-35bf-4096-ac2a-b6ac12c58382` | Sepedi          | `sepedi`        | `nso-ZA`   | `nso-za`       | `nso`     |             3 | `ACTIVE` | yes              |

PD-004 approves the launch list. FPSD-009 approves the canonical labels, tags, ISO language bases, display order, active/content status, and content-only boundary. FPSD-010 approves the immutable governance-owned UUIDs. Canonical labels and BCP 47 tags remain independently stored display/standards fields; normalized name and tag values are their stored deterministic comparison keys. No interface-language, tutorial-audio, text-to-speech, voice, or lesson-availability capability is inferred or represented in migration one.

For the proposed `languages` mapping, seed status `ACTIVE` means `retired_at IS NULL` and `is_content_enabled = true`; it is not the taxonomy lifecycle enum. Tutorial-audio enablement is excluded from both the Language table and this seed.

## Upsert and immutability behavior

The future seed operation must:

- identify each row by its fixed UUID and verify the expected canonical/normalized name, BCP 47/normalized tag, ISO basis, order, and content-only state;
- insert a missing row only under the approved initial seed; any later controlled change requires a reviewed governance decision and approved migration or seed amendment;
- fail on UUID/tag/name/ISO cross-mapping, duplicate normalized tag, duplicate normalized name, normalization collision, unknown mapping, or a conflicting historical identity;
- never replace a Language UUID after it has been referenced;
- never reuse a retired Language UUID for another Language;
- never infer a Language from a flag, device locale, Category, or Lesson title; and
- record no secrets, environment URLs, timestamps supplied by a developer machine, or generated identifiers.

The shared backend validation component owns the mapping and normalization checks used by seed validation and taxonomy writes. Repositories receive validated normalized values, while future database uniqueness under explicit `"C"` collation remains the final safeguard. Collision output must identify the conflicting fixed UUIDs and fields without silently choosing, renaming, or replacing a row. The exact seed command, implementation file, and deployment execution order are not authorized by this proposal.

## Explicit exclusions

| Excluded data                                                                    | Reason                                                                                                                         |
| -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Categories and Topics                                                            | Production curriculum taxonomy is not Product-approved seed data. Deterministic samples remain development/test fixtures only. |
| Difficulty levels                                                                | Proposed stable database enum/application contract, not mutable rows.                                                          |
| Pace presets                                                                     | Versioned Product/application configuration: Easy/Medium/Hard at 100/150/200 WPM, not seed rows.                               |
| Roles, permissions, capabilities                                                 | RBAC mapping is unresolved; no privileged account may be seeded.                                                               |
| Users, identity profiles, actors, credentials, and Devices                       | Personal/security data and operational identities are prohibited.                                                              |
| Lessons, Variants, Revisions, sources, audio, packages, and publication evidence | Production content must enter the approved human review/publication workflow.                                                  |
| Reading Sessions, progress, streaks, sync receipts, and cursors                  | Private learner activity and operational evidence are prohibited.                                                              |
| Privacy Actions, Retention Holds, and audit history                              | Evidence must arise from real governed actions, never seeds.                                                                   |
| URLs, tokens, passwords, environment values, and operational flags               | Secrets and environment configuration are outside reference data.                                                              |

## Development and test fixtures

Development/test fixtures may create clearly labelled sample Categories, Topics, Lessons, actors, and activity only in disposable non-production databases. They use fixed valid UUIDs and UTC timestamps, remain separate from the production language seed, and must never imply approved curriculum or use copied personal data.

## Readiness and blockers

- Launch content-language list and physical values: **approved by PD-004, FPSD-009, and FPSD-010**.
- Stable UUID ownership: **Prolific platform governance; immutable across environments**.
- Production row count: **exactly three**.
- Interface-language support: **not approved and not represented in migration one**.
- Seed implementation and execution: **blocked until physical schema and migration approval**.

No seed file, command, migration, SQL, or database row was created by this proposal.
