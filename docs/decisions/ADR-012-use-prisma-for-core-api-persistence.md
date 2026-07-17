# ADR-012: Use Prisma for Core API Persistence

## Status

Accepted

## Decision date

YYYY-MM-DD

## Owner

TBD

## Review date

YYYY-MM-DD

## Related records

- Architecture Gate condition: [AG-001](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)
- Related ADR: [ADR-011: MVP Product Access and Reading Rules](./ADR-011-mvp-product-access-and-reading-rules.md)
- Domain authority: [Canonical Domain Model](../architecture/canonical-domain-model.md)
- Database design: [Database Overview](../07-database/database-overview.md) and [Conceptual ERD](../07-database/erd.md)
- Backend design: [Core Backend Architecture](../06-core-backend/backend-architecture.md)

## Context

The Core API needs typed access to PostgreSQL, a controlled and reviewable migration history, clear transaction ownership, and maintainable NestJS integration. Persistence must support idempotent synchronization, immutable published Lesson Revision history, audit-safe content publication, and multi-repository use cases without allowing database concerns to leak into controllers or domain objects.

The architecture therefore needs a database-access technology and migration system while preserving the Canonical Domain Model as the business authority. Generated persistence types cannot define the domain or public API. Migration ownership, transaction boundaries, repository mapping, production deployment, and PostgreSQL-specific escape hatches must be explicit before physical implementation begins.

## Decision

### Persistence technology

- PostgreSQL is the primary relational database and authoritative persisted-data store.
- Prisma ORM is the Core API database-access technology.
- Prisma-generated client types are infrastructure types. They must not become domain models or public API DTOs.
- Prisma access is confined to infrastructure adapters. Controllers and domain objects must not import Prisma or Prisma-generated types.

### Migration ownership and history

- Prisma Migrate manages schema migrations.
- The Core API owns all PostgreSQL migrations for the Prolific platform.
- Migration SQL is committed to version control and reviewed before use.
- Every schema change requires a migration. Runtime schema synchronization and production schema push are prohibited.
- Production migrations run as a controlled deployment step, not automatically during ordinary application startup.
- Production schema changes use a forward-safe `expand -> migrate/backfill -> switch -> contract` strategy. Destructive one-step changes are not approved.

### Repository boundaries

- Application services depend on explicit, persistence-independent repository interfaces.
- Prisma infrastructure adapters implement those interfaces and map between persistence records and domain models.
- Repositories are designed around aggregate or use-case needs. The design must not create a generic repository abstraction or one repository automatically for every table.
- Dedicated read repositories may serve reporting, administrative, or projection queries.

### Transaction ownership

- The application service or use case owns the transaction boundary.
- Repositories participating in one transactional use case share the same transaction-scoped Prisma client.
- A repository must not silently open a separate transaction when participating in an existing use-case transaction.
- Controllers do not own transactions.
- Database transactions must not remain open while calling external services, uploading files, generating audio, or waiting for user input.

### Database logic

- Normal business workflows remain in NestJS application and domain services.
- PostgreSQL constraints enforce structural and transactional integrity, including keys, uniqueness, nullability, checks, indexes, and appropriate immutable-history protection.
- Views may support read projections and operational reporting.
- Stored procedures are exceptional and require evidence that complex bulk synchronization, performance-critical reporting, controlled maintenance, or another operation is demonstrably safer near the data.
- Triggers remain minimal and must not implement ordinary reading, progress, lesson, streak, or publication workflows.

## Alternatives considered

### TypeORM

TypeORM provides mature NestJS integration and supports multiple mapping styles. It was not selected for the MVP because Prisma's generated client, schema workflow, and migration tooling provide a more consistent typed developer workflow for the planned team. TypeORM remains a capable alternative, but selecting it would create two competing persistence conventions after this decision.

### Drizzle ORM

Drizzle offers a lightweight, SQL-oriented TypeScript model with strong type inference and close control over queries. It was not selected because the MVP benefits more from Prisma's integrated schema, client-generation, and migration workflow. Drizzle may provide more direct SQL visibility in some cases, but that benefit did not outweigh standardizing on Prisma for this project.

### Raw SQL with `node-postgres`

Direct `node-postgres` access provides maximum PostgreSQL control and avoids an additional schema representation. It was not selected as the default because it would require more hand-written mapping, query typing, migration integration, and consistency discipline across the Core API. Targeted reviewed raw SQL remains a possible escape hatch where Prisma cannot express required PostgreSQL behaviour.

### Stored-procedure-first architecture

A stored-procedure-first design can centralize complex data operations and reduce network round trips. It was not selected for the MVP because it would move ordinary product workflows away from the NestJS application/domain layers and increase database-specific implementation and testing overhead. Exceptional procedures remain possible when documented evidence justifies them.

## Consequences

### Benefits

- A generated typed client reduces routine database-access boilerplate.
- Committed migration SQL creates an explicit, reviewable schema history.
- One approved schema and migration workflow improves predictability across development and deployment.
- Infrastructure adapters provide clean NestJS integration without coupling controllers or domain objects to Prisma.
- Explicit repositories and application-owned transactions preserve domain boundaries.
- A standardized structure makes assisted implementation and review easier without allowing generated models to define product behaviour.

### Costs and trade-offs

- The Prisma schema becomes an additional representation that must remain aligned with migrations, PostgreSQL, and the Canonical Domain Model.
- Generated Prisma types must be mapped explicitly and must not become domain or API types.
- Some PostgreSQL-specific constraints, indexes, extensions, or data changes may require reviewed raw SQL migrations.
- Repository mapping remains deliberate work even though Prisma reduces query boilerplate.
- Prisma limitations may require targeted escape hatches; their approval policy remains an implementation detail.

## Implementation implications

### Planned location

The following structure is planned for Sprint 2; it is not created by this ADR:

```text
services/core-api/prisma/
|-- schema.prisma
|-- migrations/
`-- seed/
```

### Migration workflow

1. Model a reviewed physical change in the Prisma schema during an authorized implementation task.
2. Generate a development migration locally with Prisma Migrate.
3. Review generated SQL for correctness, PostgreSQL behaviour, data safety, indexes, constraints, and forward compatibility.
4. Add any justified PostgreSQL-specific SQL to the migration and review it explicitly.
5. Apply the migration to a clean temporary PostgreSQL database and an existing-schema test path.
6. Commit the Prisma schema and complete SQL migration history together.
7. Reconcile any exceptional manual database change through migration history before the environment is treated as healthy.

Production evolution follows:

```text
Expand
-> migrate or backfill
-> switch compatible application behaviour
-> contract only after verification
```

### Repository rules

Candidate interfaces include `UserRepository`, `TaxonomyRepository`, `LessonRepository`, `ReadingSessionRepository`, `ProgressEventRepository`, and `SyncReceiptRepository`. Candidate adapters include `PrismaUserRepository`, `PrismaLessonRepository`, `PrismaReadingSessionRepository`, `PrismaProgressEventRepository`, and `PrismaSyncReceiptRepository`.

Interfaces expose domain or application types only. Adapters own persistence mapping. Read-specific repositories may bypass aggregate-shaped loading for approved projections, but controllers still access them through application services.

### Transaction rules

The transaction mechanism must supply every participating adapter with the same transaction-scoped Prisma client. The concrete transaction-context or unit-of-work API remains to be designed.

Transactional use cases include:

- completing a Reading Session, recording its Progress Event, creating or reserving its Outbox Event, and preserving idempotency identifiers;
- publishing a Lesson Revision after checking the exact approved unchanged submission, recording the Administrative Actor and immutable Publication Record, allocating the next Variant-scoped number, and switching Current Published Revision under ADR-015; and
- processing a synchronization event by detecting duplicates, applying accepted progress, writing the Sync Receipt, and updating required projections.

### CI expectations

Future Core API validation must include Prisma schema formatting and validation, migration-history validation, drift checks against temporary PostgreSQL, integration tests, transaction tests, and idempotency tests. This ADR does not modify CI.

### Deployment expectations

The planned production order is:

```text
Confirm backup and restore readiness
-> apply approved migrations
-> deploy compatible Core API
-> run health checks
-> monitor database and application errors
```

Migration execution requires controlled deployment authorization and must not occur implicitly during application startup.

### Seed-data policy

Development seed data may contain English, isiZulu, Sepedi, the fixed Easy/Medium/Hard pace presets, and safe development-only sample categories and topics. Seed scripts must not publish production lesson content. Production content enters through the approved review and publication workflow.

### Database logic policy

Application/domain services own normal business logic. PostgreSQL owns declarative integrity. Views, stored procedures, triggers, and raw SQL require the bounded uses and review standards defined in the Database Overview.

## Deferred implementation details

- Exact Prisma package and CLI version.
- Connection-pool configuration and deployment-specific connection limits.
- Approved PostgreSQL extensions.
- Exact migration-drift tooling and CI environment.
- Test-database provisioning, isolation, and cleanup strategy.
- Raw SQL query and migration escape-hatch approval policy.
- Concrete transaction-context or unit-of-work API.
- Prisma schema naming, mapping, and module composition conventions.

These details do not reopen the Prisma selection and are not Architecture Gate blockers unless later evidence shows that one prevents safe implementation.

## Review triggers

Review this ADR if Prisma cannot meet an approved PostgreSQL, transaction, migration, performance, or operational requirement; if the Core API no longer owns the database schema; if a second service needs write ownership; or if the persistence boundary would otherwise expose Prisma types to domain or API layers.
