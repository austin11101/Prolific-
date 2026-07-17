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

## Verification expectations

Future testing covers authorization, actor separation, credential/session revocation, late-device replay rejection, destructive-cascade absence, anonymization consistency, Retention Holds, privacy-action audit access, safe logging, backup/restore tombstones, and failure/retry behavior.

## Required specialist work

Threat modelling, incident response, secrets/key management, vulnerability management, authentication provider selection, child safeguarding, consent, legal/privacy review, retention schedules, backup provider/duration, and production access governance remain required before launch.
