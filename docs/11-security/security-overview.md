# Security Overview

## Status

Sprint 1 architecture baseline. Detailed threat models, provider configuration, incident runbooks, and release evidence remain future controlled work.

## Security boundaries

- Authentication establishes User, Administrative Actor, or Service Actor context; request payloads never establish trusted actor identity.
- Authorization is capability- and resource-scoped. Editorial capability does not grant learner-activity access.
- Deactivation revokes active sessions/credentials and prevents new synchronization acceptance.
- Service credentials are rotated/disabled without deleting stable service audit identity; secrets never enter audit records.
- Immutable content, editorial evidence, Reading Sessions, Sync Receipts, and Privacy Action Records have purpose-specific write paths and no generic destructive repository delete.
- Logs, metrics, traces, and correlation IDs are minimized, protected, and retention-bound.
- Backups are encrypted, access-restricted, and restored through runbooks that preserve deletion, anonymization, and withdrawal state.
- Migration-one taxonomy audit data is restricted operational evidence: unavailable to public/learner/ordinary content paths and operational readers by default, append-only, and excluded from unrestricted exports/logging. Command IDs are opaque UUIDv4 values and reason codes are bounded application-owned values.
- Audit corrections append immutable same-target links in one-successor linear chains. Database uniqueness prevents branching; repository validation prevents stale terminal, cross-target, and cyclic corrections without modifying original evidence.
- The only approved migration-one raw-query exception is the parameterized, static-identifier Category row lock inside the taxonomy persistence adapter and Prisma interactive transaction. It returns minimum columns, receives dedicated review/tests, and never logs SQL text, parameters, taxonomy names, actor data, or audit payloads.

## Verification expectations

Future testing covers authorization, actor separation, credential/session revocation, late-device replay rejection, destructive-cascade absence, anonymization consistency, Retention Holds, privacy-action/taxonomy-audit access, command-ID exposure, raw-query boundaries, safe logging, backup/restore tombstones, and failure/retry behavior.

## Required specialist work

Threat modelling, incident response, secrets/key management, vulnerability management, authentication provider selection, child safeguarding, consent, legal/privacy review, retention schedules, backup provider/duration, and production access governance remain required before launch.
