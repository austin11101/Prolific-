# Prolific Environments

## Environment model

| Environment | Purpose                                            | Data and access boundary                                                                         |
| ----------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Local       | Individual development and deterministic checks    | Local containers/files; synthetic non-secret data                                                |
| Test        | Automated isolated component/integration execution | Ephemeral or resettable synthetic data; no shared credentials                                    |
| Development | Integrated current changes                         | Non-production accounts/data; developer access is audited as applicable                          |
| Staging     | Production-like release rehearsal                  | Production-shaped synthetic data; production network/config shape without production secrets     |
| Production  | Approved learner service                           | Restricted least-privilege access, approved retention, backup, monitoring, and incident controls |

Environments have separate databases, credentials, signing material, storage, queues/caches if introduced, observability access, and external integrations. Production data and secrets never flow down to lower environments by default.

## Configuration and secrets

- Environment variables or provider-neutral secret references supply runtime configuration.
- `.env.example` documents names and safe local defaults only. Real `.env` files, tokens, passwords, keys, connection strings, signing material, and credentials are not committed.
- Secrets are distinct per environment, encrypted at rest/in transit, least-privilege, rotatable, and never printed in logs or build output.
- Startup validation fails safely for missing/invalid required values. It reports variable names, not values.
- Public mobile configuration is not treated as a secret; privileged credentials are never embedded in the app.

## Database and migration isolation

Every environment has an explicit supported PostgreSQL version and migration state. Test databases are isolated per run. Development/staging rehearse the same committed Prisma migrations intended for production. Production migrations use a restricted deployment identity separate from the normal runtime identity where practical. `prisma db push`, runtime synchronization, and unreviewed manual DDL are prohibited in production.

## Data handling

Synthetic fixtures use no real personal data. Any exceptional production-data diagnostic/export requires documented authority, minimization, encryption, access logging, retention, and disposal. Backup/restore exercises target isolated controlled environments and reapply deletion/retention tombstones as required by ADR-017.

## Promotion gates

Promotion requires the previous environment's checks, contract compatibility, migration readiness, health/smoke evidence, and approved limitations. Staging must be sufficiently production-like to reveal configuration, migration, and operational failures; it must not claim production readiness merely because functional tests pass.
