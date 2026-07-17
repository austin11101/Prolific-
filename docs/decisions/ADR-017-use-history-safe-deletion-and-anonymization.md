# ADR-017: Use History-Safe Deletion and Anonymization

## Status

Accepted

## Decision date

YYYY-MM-DD

## Owner

TBD

## Review date

YYYY-MM-DD

## Related records

- Architecture Gate condition: [AG-006](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)
- Product requirements: [Product Requirements Document](../01-product-vision/product-requirements-document.md)
- Domain authority: [Canonical Domain Model](../architecture/canonical-domain-model.md)
- Terminology: [Domain Glossary](../02-requirements/domain-glossary.md)
- Persistence: [Conceptual ERD](../07-database/erd.md) and [Database Overview](../07-database/database-overview.md)
- Security and privacy: [Data Protection](../11-security/data-protection.md), [Privacy](../11-security/privacy.md), and [Security Overview](../11-security/security-overview.md)
- Related decisions: [ADR-013](./ADR-013-use-lesson-variants-and-immutable-revisions.md), [ADR-015](./ADR-015-persist-editorial-workflow-and-admin-actor-audit.md), and [ADR-016](./ADR-016-use-category-and-hierarchical-topic-taxonomy.md)
- Gate evidence: [Architecture Gate 001](../reviews/ARCHITECTURE-GATE-001.md)

## Context

Ordinary cascade deletion would make immutable Lesson Revisions and offline packages irreproducible, invalidate Reading Sessions and Progress Events, destroy synchronization receipts, erase editorial/publication/taxonomy evidence, and weaken fraud, abuse, and operational investigations. Keeping every identifier forever would also conflict with data minimization and future privacy obligations. The architecture must support future POPIA and specialist privacy decisions without claiming legal compliance or choosing statutory retention periods here.

## Decision

The governing lifecycle is:

```text
Active data
-> deactivated or archived state
-> privacy review
-> anonymized, retained, or purged where legally and operationally permitted
```

Deactivation prevents new use while preserving records. Archive retires content/taxonomy while retaining history. Withdrawal removes a published Revision from visibility without mutation. Anonymization irreversibly removes or replaces identifying links under an approved policy. Pseudonymization replaces direct identifiers while controlled re-identification remains possible. Retention preserves data for an approved purpose. A Retention Hold prevents purge. Purge permanently deletes explicitly eligible physical data. These terms are not interchangeable, and a generic `deleted_at` field cannot replace them.

### Data classifications

| Class                     | Examples                                                                         | Default treatment                                                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Public content records    | Categories, Topics, Lessons, Variants, Revisions, sources, Publication Records   | Archive/withdraw; retain referenced immutable history; purge only never-published unreferenced drafts under strict policy. |
| Learner identity data     | Name, email, credentials/provider refs, preferences, timezone, account status    | Deactivate first; delete/anonymize direct identifiers where permitted; structurally separate from activity.                |
| Learner activity data     | Reading Sessions, Progress Events, streaks, Sync Receipts, Device associations   | Preserve exact Revision meaning; detach or pseudonymize learner linkage; do not rewrite history.                           |
| Editorial/admin audit     | Submissions, Decisions, Publication Records, taxonomy audit, capability evidence | Append-only; stable actor references retained or pseudonymized; no cascade from actor deletion.                            |
| Security/operational data | Authentication/abuse events, logs, correlation IDs, monitoring, backups          | Minimized, restricted, separately retained; not permanent by default.                                                      |
| Local device data         | Packages, outbox, preferences, Guest Session state                               | Removable independently; local removal is not server deletion; pending progress is not silently discarded where avoidable. |

### Learner account deletion workflow

```text
Deletion requested
-> identity verified
-> account restricted or deactivated
-> pending-sync and device implications assessed
-> retention holds checked
-> direct identifiers removed, anonymized, or scheduled for purge
-> retained historical activity detached or pseudonymized
-> completion recorded
```

Account deletion is an explicit verified command, not immediate cascade deletion. Deactivation occurs early; credentials/refresh sessions are revoked; Devices lose future synchronization authority; retained Reading Sessions keep exact Lesson Revision identity; unnecessary direct identifiers are removed; and completion is auditable without recreating deleted personal data. Exact timing is privacy/legal policy.

Guest Sessions remain temporary non-account data. Guest analytics use non-identifying identifiers, have a shorter policy target than registered history, are not silently attached to registration, and do not require account creation to request applicable deletion. Exact retention is pending.

### Learner history anonymization

Reading Sessions may survive deletion only when lawful and useful in anonymized or aggregated form. Direct User linkage must be removable/replaceable while session and Revision identity remain stable. WPM, duration, completion, pace, and position may remain only when permitted. Device, IP, sync, and rare-behaviour combinations require re-identification risk review. Deleted users receive no progress/history view. Pseudonymization alone is not legal anonymization.

### Actors and audit

Administrative Actors are deactivated without erasing review/publication history. Mutable profiles may be minimized/anonymized; stable references and authorization-at-action evidence survive, optionally with a pseudonymous label. Service Actors are disabled or credentials rotated; stable service audit identity survives and audit never stores secrets. Exact administrator treatment remains policy work.

### Content boundaries

- Published/downloaded/referenced Lesson Revisions are never hard-deleted; use withdrawal/archive.
- A Lesson Variant with publication, review, package, session, or audit history is archived, not deleted.
- A Lesson owning historically referenced Variants/Revisions is archived, not deleted.
- A Working Draft may be purged only if never published, not under review, unnecessary for immutable evidence, dependency-free, and not held.
- Category/Topic retirement uses archive; purge is limited to never-used unreferenced drafts under controlled policy.

### Historical references and cascades

Historical records use stable IDs. Reading Sessions retain exact Revision IDs; Publication Records retain exact actor/submission/Revision references; rendering uses immutable Revision/package material rather than current names. Anonymization may make identity linkage nullable or pseudonymous without invalidating history.

Cascade delete is prohibited from User to Sessions/Progress, Lesson to Variants, Variant to Revisions, Revision to Sessions, Administrative Actor to Decisions/Publications, Category/Topic to Lessons, Device to sync history, and Service Actor to audit. A cascade may be considered only for strictly dependent non-historical temporary data, with explicit physical-design justification. Default: **no cascade delete across an aggregate boundary or into immutable history**.

### Retention framework

Every data class must define purpose, legal/operational basis, minimum and maximum period, trigger, deletion/anonymization action, hold conditions, review owner, and audit evidence. Each item is classified as an approved architecture requirement, pending privacy/legal policy, or pending operational implementation. Exact durations are not approved here.

### Backups, synchronization, and offline packages

Backups are encrypted, access-restricted, non-ordinary storage; identifiers may remain until documented backup expiry. Restore runbooks must not reactivate deleted accounts/withdrawn content and must reapply deletion/anonymization tombstones. Provider/duration remain deployment decisions.

Deactivated/deleted accounts cannot submit new sync events. Late Devices receive authorization/account-deleted outcomes; old events cannot recreate or reattach anonymized state. Historical receipts may remain for bounded idempotency. Client outbox treatment is explicit and warns before unavoidable loss.

Account deletion does not delete public packages/server Revision history. Future policy may remove account-restricted local downloads or force-expire unsafe withdrawn content. Local package removal does not delete history.

### Privacy Action Record

A Privacy Action Record is append-only evidence of deletion request, deactivation, anonymization, hold/release, or purge. It contains only action ID/type, non-identifying target class/internal reference, request/completion timestamps, authorized actor/system, outcome, policy version, optional hold reference, non-sensitive reason code, and error/retry state. It excludes passwords, credentials, private activity, and copied profiles; corrections supersede; access is restricted; learner APIs/packages exclude it.

### Privacy by design

Separate identity from activity where practical; avoid duplicating names/emails into activity; minimize free text; restrict administrative activity access; avoid personal data in immutable content/checksums; treat device/network metadata as potentially identifying; document denormalized personal-data copies; and prevent logs becoming uncontrolled personal-data storage.

### Transaction boundaries

- **Deactivate account:** verify authority, change state, revoke stored authorization, record privacy evidence, and prevent sync acceptance atomically where database state participates.
- **Anonymize identity:** controlled retryable workflow checks holds, treats identifiers and activity linkage consistently, preserves Revision references, records evidence, and avoids partial completion.
- **Purge eligible draft:** one transaction verifies no historical dependency/review/audit/hold, deletes only permitted temporary records, and records evidence.

External/file cleanup occurs outside database transactions through retryable orchestration.

### API implications

Account deletion is an explicit potentially asynchronous command with requested/pending/completed/blocked/failed states and authenticated identity. Archive, withdrawal, deactivation, anonymization, and purge remain distinct commands. Deleted learners cannot query retained history; administrators cannot arbitrarily delete history; Privacy Action Records are internal; stale Devices cannot restore account state. Endpoint paths remain unfrozen.

## Alternatives considered

- **Immediate cascade delete:** rejected because it destroys history, audit, package interpretation, and sync safety.
- **Keep all personal data forever:** rejected because it violates minimization and blocks future privacy compliance.
- **Generic soft delete everywhere:** rejected because lifecycle meanings differ.
- **Delete identity and all activity together:** rejected as the only rule because lawful anonymized retention may be necessary.
- **Copy names/emails into history:** rejected because it expands privacy risk.
- **Event sourcing:** deferred as unnecessary MVP complexity.

## Consequences

The schema must separate identity/activity, support detachable references, preserve immutable history, avoid destructive foreign-key actions, represent holds and lifecycle explicitly, and retain minimal append-only privacy evidence. Workflows and tests are more complex, and privacy/legal owners must still approve exact policy, duration, and anonymization effectiveness.

## Deferred decisions

Exact legal bases/periods, child consent/safeguarding, completion timeframe, anonymization algorithm, IP/device treatment, backup/receipt/guest-analytics retention, unsafe-download removal, physical identity/activity mapping, privacy-review owner, and jurisdiction-specific review remain open.

## Review triggers

Review this ADR when privacy/legal policy changes, new learner free text or biometric/speech data is introduced, jurisdictions expand, audit evidence requirements change, or anonymization risk testing shows retained data is reasonably re-identifiable.
