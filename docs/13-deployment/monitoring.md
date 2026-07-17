# Prolific Monitoring and Observability

## Objectives

Monitoring must detect learner-impacting failures, support privacy-safe diagnosis, and prove release health. Provider selection and numeric service-level targets remain later decisions.

## Signals

| Area       | Minimum signals                                                                                                                                       |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| API        | request rate, latency, status/stable error code, saturation, dependency timeouts                                                                      |
| PostgreSQL | connectivity, pool use, query latency, locks, storage, replication/backup health where applicable, migration status                                   |
| Sync       | batch/event rate, accepted/duplicate/rejected/retryable counts, idempotency conflicts, cursor resets, oldest pending age, late deleted-account replay |
| Packages   | generation/delivery failures, checksum/compatibility rejection, download latency/size, prior-package fallback                                         |
| Mobile     | crash-free sessions, app startup, ANR/hang, package corruption, player restoration, sync failures by safe class                                       |
| Deployment | artifact/version, rollout progress, health/readiness, smoke result, rollback/run-forward state                                                        |

## Logs and correlation

Every inbound API request receives or is assigned a correlation ID returned in the response and propagated through application, database, sync, and package operations. Structured logs use UTC timestamps, environment, service/version, severity, stable event/error code, and privacy-safe identifiers. Mobile diagnostics may include the correlation ID returned by the server.

Logs never contain access/refresh tokens, passwords, secrets, raw connection strings, unrestricted request/event payloads, tutorial content text, direct personal identifiers, or internal errors in client responses. Access and retention are restricted and approved under the data-class policy.

## Errors and performance

Error monitoring groups failures by stable code/component/version and supports release comparison without collecting unnecessary learner data. Performance monitoring covers API latency, database pressure, package delivery, mobile startup/player smoothness, and sync backlog. Sampling and device identifiers require privacy review and consent where applicable.

## Alerts and response

Alerts are actionable, severity-classified, routed to an owned response path, and include a runbook link. Critical candidates include unavailable API/database, failed migrations, restore/backup failure, high crash rate, sustained checksum failures, growing retryable sync backlog, unusual permanent rejection, and security/privacy events. Exact thresholds, on-call ownership, incident communications, and escalation are operational decisions before production.

## Release and rollback observation

Each rollout has a defined observation window comparing error, latency, crash, sync, and database signals with baseline. Automated or manual rollback occurs only when database compatibility permits; otherwise the run-forward plan is invoked. Monitoring continues across rollback to verify recovery.

## Data retention and access

Telemetry is classified, minimized, pseudonymized where possible, encrypted, access-controlled, and retained only for an approved period. Guest analytics is anonymous only. Exact vendors, consent, sampling, periods, deletion behavior, and jurisdictional requirements need privacy/security approval before instrumentation or production use.
