# Prolific Hosting Architecture

## Provider-neutral requirements

No hosting provider is approved. A later decision must select services that satisfy:

- South African learner latency and connectivity constraints;
- encrypted HTTPS ingress and managed certificate rotation;
- isolated networks and least-privilege service identities;
- horizontally scalable stateless Core API instances;
- supported PostgreSQL with encrypted storage, backups, point-in-time/recovery capability as approved, and controlled access;
- durable package/audio storage with immutable object/version semantics and checksum-preserving delivery;
- independent environment separation;
- health/readiness checks, logs, metrics, error monitoring, and alert integration;
- documented capacity, availability, recovery, data-location, privacy, cost, and operational ownership.

## Health and traffic

Liveness reports whether an instance can run. Readiness reports whether it may receive traffic and includes safe checks of critical initialization/migration compatibility without leaking internals. Dependency degradation should not turn every endpoint into an expensive deep-health probe. Health responses contain no credentials, connection strings, versions that create avoidable exposure, or private data.

## PostgreSQL and backups

Runtime application identities cannot run migrations or destructive administration by default. Backup schedules, retention, encryption, restore objectives, provider, legal basis, and geographic treatment require approval. Restore readiness is proven through exercises, not backup-job success alone. Restores must reapply deletion/anonymization tombstones and retained privacy actions before normal service resumes.

## Package/audio delivery

Transport URLs are short-lived locators, never Lesson Revision identity or integrity evidence. Storage/CDN changes must not change Package Checksum for identical semantic content. Authorization, caching, range/resume behavior, revocation, unsafe-content withdrawal, maximum sizes, and compatibility windows are later content/deployment decisions.

## Capacity and resilience

The selected topology must scale API and content delivery independently, apply bounded timeouts/retries, protect PostgreSQL connections, and degrade safely during dependency failure. Exact availability, latency, throughput, recovery-time, recovery-point, and capacity targets are due before Sprint 11 stabilization.
