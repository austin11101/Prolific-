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

Migration-one taxonomy tests must additionally cover the taxonomy-adapter-only parameterized Category lock, static identifiers/minimum columns, wrong-Category and stale Category/Topic rejection, concurrent reparenting, recognized deadlock/retry boundaries and exhaustion, rollback/audit atomicity, exact-one audit target, operation-specific nullability, parent/supersession FKs and indexes, self/cyclic/cross-target correction rejection, unknown reason codes, opaque command-ID exposure/logging, Language normalized-name/tag collisions under `"C"` comparison, BCP 47/ISO mapping, runtime Language-mutation denial, and controlled actor provisioning without identity payloads. TN-001–TN-022 execute against the one shared validation implementation.

Correction-chain cases include an uncorrected original, one direct correction, multiple sequential corrections, rejected duplicate and concurrent direct successors, rejected self/cross-target/cyclic links, stale-terminal conflict, transaction rollback, correction/audit atomicity, immutable predecessor linkage, backward/forward retrieval, and proof that one database uniqueness conflict becomes one stable domain conflict without exposing provider errors.

Sprint 2 must document database provisioning, isolation, reset, seed boundaries, and drift checks before relying on integration results. Failure injection must demonstrate rollback, not merely thrown errors.
