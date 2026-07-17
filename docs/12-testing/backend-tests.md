# Backend Testing Guide

This guide applies the [central testing strategy](./testing-strategy.md) to the NestJS Core API and PostgreSQL persistence.

## Boundaries

- Domain/application unit tests run without NestJS or Prisma types.
- Controller tests prove validation, mapping, authorization delegation, and safe errors; business rules remain application-service tests.
- Repository contract tests run every Prisma adapter against real PostgreSQL.
- Transaction/concurrency tests prove atomic publication, revision allocation, hierarchy changes, editorial decisions, sync processing, and privacy workflows.
- Migration tests use committed migrations from clean and previous supported states; no runtime schema synchronization or production schema push is permitted.

## Critical persistence cases

Cover active Variant and sibling taxonomy uniqueness, acyclic same-Category Topic hierarchy, one Working Draft, immutable published Revisions, positive Variant-scoped revision numbering, stale concurrency rejection, exact Reading Session Revision references, append-only audit evidence, detachable learner identity, late Device rejection, Retention Holds, and absence of destructive historical cascades.

Sprint 2 must document database provisioning, isolation, reset, seed boundaries, and drift checks before relying on integration results. Failure injection must demonstrate rollback, not merely thrown errors.
