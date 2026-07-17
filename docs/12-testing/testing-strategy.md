# Prolific Testing Strategy

## Purpose

This strategy defines the evidence required to change Prolific safely. It sets architecture-level expectations and Sprint 2 minimums; it does not implement tests or select new tools.

## Principles and pyramid

```text
                Exploratory and release acceptance
             End-to-end and deployment smoke tests
          API, repository, migration, and integration tests
     Domain, application, contract, widget, and component tests
```

Most rules should be proven by fast deterministic unit/domain tests. Integration tests prove boundaries that mocks cannot: PostgreSQL constraints and transactions, migrations, serialization, files, Flutter lifecycle, and network failure. A small end-to-end layer proves critical journeys. Test count is not a quality target; risk coverage, determinism, and actionable failures are.

## Test layers

### Unit and domain-rule tests

Pure tests cover value validation, state transitions, guest restrictions, tutorial/practice separation, completion eligibility, pace presets, exact Revision identity, taxonomy lifecycle, revision numbering, editorial separation of duties, privacy lifecycle, error mapping, and retry disposition. Business time and identifiers use injected controls.

### Repository and PostgreSQL integration tests

Repository contracts run against a real supported PostgreSQL version. They cover mappings, uniqueness, foreign keys, non-destructive delete actions, immutable history, optimistic concurrency, ordering, pagination, and persistence-independent interfaces. Tests must not substitute an in-memory database for PostgreSQL-specific behavior.

### Migration and transaction tests

Every migration path is tested from an empty database and from the last supported schema. CI detects drift, validates committed SQL, and proves repeatable deployment. Transaction tests inject failure at meaningful steps and verify all-or-nothing publication, progress-plus-outbox writes, sync receipt/domain outcome, taxonomy changes, and privacy workflows. Production schema push is prohibited.

### API and contract tests

API tests cover `/api/v1`, authentication/authorization, validation, pagination, idempotency, optimistic concurrency, stable errors, safe response bodies, published-only learner visibility, and per-event partial success. JSON Schema documents and all embedded examples validate under Draft 2020-12. Consumer/provider fixtures must preserve exact field names, UUID/timestamp formats, strict additional-property behavior, and version compatibility.

### Flutter tests

Pure Dart tests cover domain/application behavior; widget tests cover rendering, navigation, semantics, loading/offline/error states, and restoration actions. Storage/network/file adapters have focused integration tests. Device/emulator journeys cover lifecycle and platform behavior only where lower layers cannot.

### Reading-player timing tests

A controllable monotonic clock drives tutorial alignment, silent pacing, pause/resume, restart, interruption, final-position completion, and speed changes. Tests cover boundary positions, drift tolerance once approved, and exact Revision/profile restoration. Wall-clock sleeps and audio completion as a lesson-completion proxy are prohibited.

### Offline package integrity tests

Tests validate strict schema compatibility, ordered blocks/positions, Unicode scalar spans, contiguous zero-based indexes, Package/Asset Checksum success and corruption, atomic promotion, interrupted updates, quarantine, old verified-package preservation, unknown required blocks, and exclusion of secrets/progress/device data.

### Synchronization and idempotency tests

Tests cover local atomic progress-plus-outbox creation, stable event IDs, retries after lost responses, duplicate same/different payloads, partial success, retry retention/backoff decisions, permanent rejection retention, event ordering, stale cursors, multi-device evidence preservation, and deleted-account late replay rejection. No test may accept silent event loss.

### Security, privacy, and authorization tests

Cover guest/account boundaries, token failures, administrative capability checks, separation of duties, service-actor prohibition on approval/publication, learner/public data minimization, injection/input limits, error redaction, log redaction, identity detachment, non-destructive history, and audit access. Specialist security testing supplements rather than replaces automated checks.

### Accessibility tests

Automated semantics, contrast, text scaling, focus order, touch target, and reduced-motion checks are paired with manual screen-reader and keyboard/switch testing on the supported device matrix. The exact standard/version and matrix must be approved before Sprint 4 UI acceptance.

### Deployment smoke tests

Each deployed environment proves health/readiness, database connectivity, migration status, public API basics, authentication boundary, safe configuration, log correlation, and rollback/run-forward readiness. Staging exercises backup restoration and critical mobile/API compatibility before production promotion.

## Test data and isolation

- Fixtures are deterministic, minimal, non-secret, and contain no real personal data.
- Every integration test owns an isolated database/schema boundary and cleans it reliably.
- UUIDs and UTC timestamps are explicit where history matters.
- Published Revisions and checksums are immutable fixtures; draft and production data are never copied into tests.
- Flaky tests are defects. Quarantine requires an owner, reason, expiry, and replacement evidence.

## CI quality gates

Required checks are formatting, static analysis, unit tests, integration/contract tests applicable to the changed component, build, schema/example validation, migration validation when present, and documentation links. Protected-branch policy and exact coverage thresholds are delivery-governance decisions; reduced coverage in a business-critical rule is not acceptable merely because a numeric threshold passes.

## Minimum Sprint 2 expectations

Before Sprint 2 exits:

- PostgreSQL/Prisma versions and test-database lifecycle are approved and reproducible.
- Each repository has contract/integration tests against PostgreSQL.
- Initial migrations deploy cleanly, report status, detect drift, and are tested from empty state.
- Domain invariants in the first physical model have unit and database-constraint evidence.
- Publication, revision allocation, optimistic concurrency, and applicable audit transactions have rollback/concurrency tests.
- History-safe foreign keys and deletion/anonymization mappings have explicit tests.
- Shared JSON Schemas and examples validate in CI.
- API scaffold format, lint, unit/e2e, and build checks remain green.

Sprint 2 does not need to implement later mobile, player, content, or full sync test suites; it must preserve seams that allow them.

## Ownership and evidence

Feature owners maintain tests with implementation. Reviewers verify failure meaning and boundary coverage. CI results are retained with the change. Release owners assemble smoke, migration, backup/restore, security/privacy, accessibility, content-quality, and mobile compatibility evidence. Known limitations have an owner, impact, expiry/target sprint, and documented compensating control.

## Component guides

- [Mobile tests](./mobile-tests.md)
- [Backend tests](./backend-tests.md)
- [API tests](./api-tests.md)
- [Offline and sync tests](./offline-sync-tests.md)

These guides apply this strategy and do not redefine domain behavior.
