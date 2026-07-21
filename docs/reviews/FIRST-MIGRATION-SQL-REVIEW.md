# First Migration SQL Review

## Review outcome

| Item                            | Result                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------- |
| Review status                   | `COMPLETE`                                                                      |
| Recommendation                  | `RECOMMEND MIGRATION EXECUTION AUTHORIZATION` — accepted for development        |
| Review date                     | 2026-07-20                                                                      |
| Migration                       | `services/core-api/prisma/migrations/20260717_initial_foundation/migration.sql` |
| Configured development database | Migration applied and post-verified in Sprint 2.15                              |
| Execution authority             | Supplied for one local development execution; consumed successfully             |

This review finalized the first five-table PostgreSQL migration package. The later [Execution Approval](./FIRST-MIGRATION-EXECUTION-APPROVAL.md) and [Execution Report](./FIRST-MIGRATION-EXECUTION-REPORT.md) record its successful local development application. This review still does not authorize seeds, repositories/APIs/services, additional migrations, Flutter work, or production roles and grants.

## Sprint 2.15 execution outcome

On 2026-07-20, `npx prisma migrate deploy --config ./prisma.config.ts` applied the unchanged approved migration with SHA-256 `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D` to `localhost:5432/prolific`. Prisma history contains exactly one successful `20260717_initial_foundation` row, the live catalogue matches every reviewed count, all application tables are empty, and a live-to-schema Prisma diff is empty. See the execution report for evidence and remaining restrictions.

## Candidate provenance

Sprint 2.13 attempted:

```powershell
npx prisma migrate dev --create-only --name 20260717_initial_foundation --config ./prisma.config.ts
```

The command reached the configured PostgreSQL datasource but stopped before producing a package with the exact terminal error `Error: Schema engine error:`. Docker reported the PostgreSQL container healthy. A diagnostic retry produced the same opaque engine error. No target migration was applied and no migration file was created by either attempt.

The database-independent Prisma equivalent then generated the baseline:

```powershell
npx prisma migrate diff --from-empty --to-schema prisma/schema.prisma --script --output prisma/migrations/20260717_initial_foundation/migration.sql --config ./prisma.config.ts
```

The likely fault boundary is Prisma's Windows `migrate dev`/shadow-database engine path, not the SQL design: the offline diff succeeded and the finalized SQL subsequently applied cleanly to an isolated PostgreSQL 16.13 database. The opaque failure remains a `MINOR` development-workflow finding to resolve before future development migrations; it does not demonstrate an execution defect in this candidate.

## Hashes and preserved baseline

| State                               | SHA-256                                                            |
| ----------------------------------- | ------------------------------------------------------------------ |
| Original Prisma-generated candidate | `CD64A3CA1976F6608B28681FD72382BCE799AF9D42A4594BA4D77FAA8EDA2CB3` |
| Final reviewed migration            | `ACF58378B548F4677AABFB65260DA6E19C6D617B5162AC2BF444149E36FF837D` |

The original candidate contained the approved enum, five tables, five primary keys, five generated unique indexes, nine ordinary indexes, and eight foreign keys. The final amendment preserves every Prisma-representable column, type, default, key, index, relationship, and referential action while adding the approved PostgreSQL-only controls and reconciling ordinary uniqueness as table constraints.

## Scope

The migration creates one enum:

- `taxonomy_lifecycle_state`: `active`, `archived`

It creates exactly five tables:

1. `actor_principals`
2. `languages`
3. `categories`
4. `topics`
5. `taxonomy_change_records`

No learner, lesson, editorial, synchronization, seed, role, grant, extension, trigger, routine, generated-column, JSONB, or unrestricted narrative structure is present.

## SQL additions

Sprint 2.14 added only the approved provider-specific implementation:

- 26 named `CHECK` constraints;
- three named partial unique indexes;
- explicit column-level PostgreSQL `"C"` collation on four normalized comparison columns;
- conversion of five generated ordinary unique indexes into five named `UNIQUE` table constraints without duplicate indexes; and
- `migration_lock.toml` with provider `postgresql`.

No UUID database default, cascade action, extension, implicit identifier, trigger, stored procedure, function, generated column, or new field was added.

## CHECK constraint catalogue

| Table                     |  Count | Constraints                                                                                                                                                                                                                                                                                                                                                                |
| ------------------------- | -----: | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `actor_principals`        |      1 | `ck__actor_principals__actor_kind`                                                                                                                                                                                                                                                                                                                                         |
| `languages`               |      6 | `ck__languages__bcp47_tag_non_blank`; `ck__languages__normalized_tag_non_blank`; `ck__languages__canonical_name_non_blank`; `ck__languages__normalized_name_non_blank`; `ck__languages__display_order_non_negative`; `ck__languages__retirement_content_consistency`                                                                                                       |
| `categories`              |      6 | `ck__categories__canonical_name_non_blank`; `ck__categories__normalized_name_non_blank`; `ck__categories__display_order_non_negative`; `ck__categories__lock_version_positive`; `ck__categories__hierarchy_version_positive`; `ck__categories__lifecycle_timestamp_consistency`                                                                                            |
| `topics`                  |      6 | `ck__topics__canonical_name_non_blank`; `ck__topics__normalized_name_non_blank`; `ck__topics__display_order_non_negative`; `ck__topics__lock_version_positive`; `ck__topics__lifecycle_timestamp_consistency`; `ck__topics__no_self_parent`                                                                                                                                |
| `taxonomy_change_records` |      7 | `ck__taxonomy_change_records__exactly_one_target`; `ck__taxonomy_change_records__target_operation`; `ck__taxonomy_change_records__reason_code_shape`; `ck__taxonomy_change_records__lifecycle_applicability`; `ck__taxonomy_change_records__parent_applicability`; `ck__taxonomy_change_records__version_progression`; `ck__taxonomy_change_records__no_self_supersession` |
| **Total**                 | **26** | Exact approved semantic catalogue                                                                                                                                                                                                                                                                                                                                          |

The audit checks encode the approved operation/nullability matrix. PostgreSQL enforces exactly one typed target, target/operation compatibility, non-whitespace machine-readable reason-code shape, lifecycle evidence, parent applicability/change, version progression, and no self-supersession. The future application-owned registry remains responsible for reason-code membership and compatibility.

Recursive Topic cycle detection, parent ownership validation beyond the composite FK, correction predecessor ordering, terminal-chain validation, same-target correction validation, and correction acyclicity remain application/repository transaction rules. No trigger or stored procedure was introduced.

## Partial unique indexes

| Index                           | Columns                                                       | Predicate                                                    |
| ------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------ |
| `uq__categories__active_name`   | `normalized_canonical_name`                                   | `lifecycle_state = 'active'`                                 |
| `uq__topics__active_root_name`  | `category_id`, `normalized_canonical_name`                    | `lifecycle_state = 'active' AND parent_topic_id IS NULL`     |
| `uq__topics__active_child_name` | `category_id`, `parent_topic_id`, `normalized_canonical_name` | `lifecycle_state = 'active' AND parent_topic_id IS NOT NULL` |

The mapped lowercase enum value is used in every predicate. Archived rows do not block active-name reuse, root uniqueness does not rely on nullable equality, and child uniqueness is scoped by Category and parent.

## Collation implementation

Column-level `COLLATE "C"` is applied to:

- `languages.normalized_tag`;
- `languages.normalized_name`;
- `categories.normalized_canonical_name`; and
- `topics.normalized_canonical_name`.

Column-level collation makes every equality and uniqueness comparison over the normalized value deterministic without repeating collation expressions in each index. Display fields retain the database/default collation and are not used for human-facing linguistic sorting through normalized keys.

Prisma 7.8.0 cannot represent these explicit collations or partial-index predicates in `schema.prisma`. They therefore live in reviewed migration SQL. Future schema regeneration or drift review must preserve them explicitly; schema-only generation is not sufficient evidence that they remain present.

## Unique constraint and index representation

The five Prisma-generated ordinary unique indexes were replaced with PostgreSQL `UNIQUE` table constraints using the same approved names and columns. PostgreSQL creates one backing unique index per constraint, so no duplicate index is created. Prisma introspection represents these rules as the existing `@unique`/`@@unique` declarations.

Final catalogue:

| Object class                                                    | Count |
| --------------------------------------------------------------- | ----: |
| Primary-key constraints                                         |     5 |
| Non-primary unique table constraints                            |     5 |
| Standalone ordinary unique indexes                              |     0 |
| Standalone partial unique indexes                               |     3 |
| Non-unique indexes                                              |     9 |
| CHECK constraints                                               |    26 |
| Foreign-key constraints                                         |     8 |
| Named table constraints                                         |    44 |
| Total non-primary indexes, including constraint backing indexes |    17 |

The composite `topics(category_id, id)` unique constraint remains available before the self-referencing composite foreign key is added. The nullable supersession unique constraint permits multiple nulls, prevents branching, and supplies the successor lookup index.

## Foreign keys and safety ordering

All eight foreign keys use `ON DELETE RESTRICT` and `ON UPDATE NO ACTION`. No cascade action exists. Targets and required unique structures exist before foreign keys are added. The final ordering is:

1. public schema and enum;
2. five tables and primary keys;
3. ordinary unique constraints and indexes;
4. partial unique indexes;
5. 26 checks; and
6. eight foreign keys.

All identifiers are quoted consistently and are at most 63 UTF-8 bytes. UUID fields have no database-generated default. All timestamps use `timestamptz(6)` and approved defaults.

## Prisma migration metadata

The migration package is:

```text
services/core-api/prisma/migrations/
|-- migration_lock.toml
`-- 20260717_initial_foundation/
    `-- migration.sql
```

`migration_lock.toml` contains only Prisma's standard explanatory comments and `provider = "postgresql"`. No checksum or `_prisma_migrations` history row was fabricated. The migration directory name is stable, ordered, descriptive, and matches the Sprint 2.13 approved candidate name.

## Validation

Database-independent validation completed:

- Prisma formatting passed;
- `prisma validate` passed;
- `prisma generate` passed with Prisma Client 7.8.0;
- SQL catalogue parsing matched every approved count;
- migration/package layout validation passed;
- Markdown formatting, internal-link, heading, and status consistency checks passed;
- `git diff --check` passed; and
- nothing was staged.

Isolated database validation used only `prolific_migration_validation_20260720` in the local PostgreSQL container. The finalized SQL applied with `ON_ERROR_STOP=1` on PostgreSQL 16.13. Catalogue inspection confirmed five tables, one enum, five primary keys, five non-primary unique constraints, 26 checks, eight foreign keys, three partial unique indexes, zero standalone ordinary unique indexes, nine non-unique indexes, and four `"C"`-collated columns. It also confirmed all FK actions, zero UUID defaults, zero non-internal triggers, zero public routines, zero generated columns, and zero JSONB columns.

The disposable database was dropped after inspection. A separate read-only inspection confirmed that the configured `prolific` development database still contains zero application relations, custom types, or routines.

## Findings

| ID       | Severity    | Finding                                                                                                         | Resolution/status                                                                                                                                                                                        |
| -------- | ----------- | --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FMSR-001 | MINOR       | `migrate dev --create-only` returned only `Schema engine error` on the Windows host despite healthy PostgreSQL. | Offline Prisma generation and isolated PostgreSQL application prove the candidate SQL; diagnose the development shadow-engine workflow before later migrations. Open, non-blocking for execution review. |
| FMSR-002 | MINOR       | The approved proposal enumerated 26 check semantics but did not assign physical check names.                    | Resolved in this review with deterministic `ck__<table>__<rule>` names and an explicit catalogue.                                                                                                        |
| FMSR-003 | OBSERVATION | Prisma cannot encode partial-index predicates or explicit collations in the schema.                             | Accepted provider-specific migration SQL; future drift reviews must inspect these controls explicitly.                                                                                                   |

Blockers: zero. Major findings: zero. Open minor findings affecting candidate correctness: zero.

## Historical execution recommendation and current authority

**Recommendation:** `RECOMMEND MIGRATION EXECUTION AUTHORIZATION`.

This technical recommendation was accepted by the Project Product Owner / Architecture Governance on 2026-07-20 for one configured local development execution. That authority was consumed successfully and grants no staging, production, seed, repository, service, API, Flutter, or further-migration authority.

After the successful execution:

- seed execution is prohibited;
- repository, service, API, controller, DTO, and Flutter implementation remain prohibited; and
- production roles, grants, and privileges remain unimplemented;
- any additional migration requires a new review and approval; and
- the applied migration and its Prisma history row must not be edited or fabricated.
