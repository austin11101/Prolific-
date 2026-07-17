# Data Protection Architecture

## Status and scope

Architecture baseline for [ADR-017](../decisions/ADR-017-use-history-safe-deletion-and-anonymization.md); not legal advice or a claim of POPIA compliance. Legal/privacy review is required before launch.

## Data classes and controls

| Class                 | Core controls                                                                                          | Policy still required                         |
| --------------------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| Public content        | Immutable published history, archive/withdrawal, restricted editorial mutation                         | Content-rights and final retention policy     |
| Learner identity      | Strong access control, deactivation, credential revocation, identifier minimization/anonymization      | Legal basis, consent, deletion timing         |
| Learner activity      | Identity separation, exact Revision references, restricted access, anonymization/detachment capability | Retention and re-identification thresholds    |
| Editorial/admin audit | Append-only evidence, stable/pseudonymous actor refs, restricted notes                                 | Actor-profile and note retention              |
| Security/operations   | Minimized structured logs, protected monitoring/backups, bounded retention                             | Provider-specific periods and incident policy |
| Local device          | Protected account state, explicit outbox/download cleanup behavior                                     | Offline expiry and device-removal UX          |

## Required design controls

- Stable internal IDs replace personal identifiers in domain relationships.
- Names/email are not copied into Reading Sessions, Progress Events, Sync Receipts, immutable content, or integrity checksums.
- Every denormalized personal-data copy is documented with purpose, owner, and treatment.
- Administrative learner-activity access is least-privilege, purpose-bound, and audited.
- Device/network metadata is potentially identifying; collection and retention are minimized.
- Logs use allow-listed structured fields and exclude credentials, tokens, private content, full profiles, and unnecessary identifiers.
- Retention Holds and Privacy Action Records are restricted and append-only.
- Backup restore replays effective deletion/anonymization tombstones before restored data becomes ordinarily accessible.

## Retention register requirements

Every class records purpose, legal/operational basis, minimum/maximum duration, trigger, treatment, hold conditions, owner, and audit evidence. Architecture requirements are approved; exact legal policy and operational automation remain pending.

## Release dependencies

Child safeguarding, age/guardian consent, data-subject rights procedure, cross-border/data-residency assessment, legal bases, retention periods, anonymization effectiveness, subprocessors, and incident obligations require accountable specialist approval.
