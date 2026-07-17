# Prolific CI/CD Architecture

## Continuous integration

Pull-request and protected-branch validation should run:

1. dependency installation from lockfiles;
2. secret and forbidden-artifact checks;
3. formatting and static analysis;
4. unit, widget, repository, API, contract, and applicable integration tests;
5. JSON Schema and embedded-example validation;
6. migration validation/drift checks once Prisma exists;
7. API/mobile builds and artifact metadata generation;
8. documentation link, heading, fence, Mermaid, and status-consistency checks.

Current CI is a scaffold and does not yet provide PostgreSQL migration, shared-schema, deployment, security, signing, or release promotion automation. These are added in their owning sprints.

## Continuous delivery

- CI produces traceable immutable artifacts; deployment never rebuilds from a mutable branch.
- Environments use scoped deployment identities and approval controls appropriate to risk.
- Migration execution is a distinct controlled step with status capture and one active migration runner.
- Application rollout uses readiness gates and progressive traffic where the selected platform supports it.
- Production promotion, mobile signing/store submission, and emergency actions require named operational authority; no authority is invented in Sprint 1.

## Migration controls

Only reviewed committed Prisma Migrate SQL is deployable. Before execution, automation verifies target environment, expected migration history, backup/recovery readiness, lock/concurrency conditions, and application compatibility. After execution it records status and runs smoke checks. Failed migrations stop promotion and follow the approved run-forward/rollback procedure. Production schema push is never a recovery shortcut.

## Rollback and compatibility

Application rollback is permitted only when the previous artifact remains compatible with the current database and contracts. Database rollback is not assumed safe. Expand/migrate/contract changes keep old/new application versions compatible during rolling deployment, and contract removal waits through the supported mobile/offline window.

Lesson packages and sync events are versioned independently from the API and database. A release must not invalidate verified offline packages or retained outbox events without an approved compatibility/withdrawal policy and recovery path.

## Supply chain and artifacts

Lockfiles are authoritative; package upgrades are explicit. Artifacts record source revision and checksums, are access-controlled, and are retained under approved policy. CI logs and caches exclude secrets. Dependency, provenance, vulnerability, and mobile-signing controls are Sprint 11/release requirements unless earlier risk demands them.
