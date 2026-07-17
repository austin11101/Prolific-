# ADR-015: Persist Editorial Workflow and Administrative Actor Audit

## Status

Accepted

## Decision date

YYYY-MM-DD

## Owner

TBD

## Review date

YYYY-MM-DD

## Related records

- Architecture Gate condition: [AG-004](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)
- Product requirements: [Product Requirements Document](../01-product-vision/product-requirements-document.md)
- Domain authority: [Canonical Domain Model](../architecture/canonical-domain-model.md)
- Terminology: [Domain Glossary](../02-requirements/domain-glossary.md)
- Database design: [Conceptual ERD](../07-database/erd.md) and [Database Overview](../07-database/database-overview.md)
- API guidance: [API Overview](../08-api-specification/api-overview.md)
- Product rules: [ADR-011](./ADR-011-mvp-product-access-and-reading-rules.md)
- Revision identity: [ADR-013](./ADR-013-use-lesson-variants-and-immutable-revisions.md)
- Gate evidence: [Architecture Gate 001](../reviews/ARCHITECTURE-GATE-001.md)

## Context

Storing only a Working Draft's current status cannot prove that human review occurred, identify who requested changes, approved, or published content, or reconstruct which exact submitted content became a Lesson Revision. Mutable status alone also cannot reliably prevent the Content Engine from satisfying human-review requirements, resolve disputes and corrections, or support future compliance and operational accountability.

Prolific requires durable evidence without adopting event sourcing or copying excessive personal data into audit records. Learner Users, authenticated human administrators, non-human services, and system processes have different security and privacy boundaries. Disabling or changing an actor must not rewrite historical facts, and published-only learner visibility must remain distinct from editorial approval.

## Decision

The persistent editorial workflow is conceptually:

```text
Working Draft
-> Review Submission
-> Review Decision
-> Approval Evidence
-> Publication Record
-> Archive, Withdrawal, or Restoration Record
```

These concepts are typed domain/audit records. They do not require one table per concept, and their exact physical mapping remains Sprint 2 work.

### Administrative Actor

An Administrative Actor is an authenticated human internal identity permitted to perform defined content-management or platform-administration operations.

- Learner Users and Administrative Actors are distinct security contexts.
- Audit references use an immutable internal actor ID, never only a mutable name or email.
- A minimal display-name or email snapshot may be retained for historical readability only when approved by privacy policy.
- Deactivation, role changes, deletion, or anonymization never destroys required historical evidence.
- Authorization is evaluated at command time; later role changes do not rewrite old records.
- Administrative capability does not grant access to private learner activity unless separately authorized.

The authentication provider and physical identity-table design remain unresolved.

### Service Actor and actor references

A Service Actor is a non-human authenticated system identity, such as the Content Engine, a future import worker, or a package generator. It has an immutable ID and auditable actions but cannot satisfy human approval or publication requirements. Service credentials and secret management remain unresolved.

Audit records use the conceptual pair:

```text
actor_type
actor_id
```

Supported conceptual actor types are `administrative_user`, `service_actor`, and `system_process`. Human and service actors must be distinguishable. A system process identifies the responsible internal process and, where applicable, the initiating human or service correlation. Learner-generated actions are never represented as administrative audit actors. This decision does not select polymorphic database syntax.

### Internal capabilities

MVP internal capabilities are:

| Capability             | Permitted actions                                                                                  | Prohibited or constrained actions                                                                    |
| ---------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Content Author         | Create Lesson/Variant/Working Draft, edit draft, attach sources, submit for review.                | Cannot publish, bypass review, or approve their own draft by default.                                |
| Content Reviewer       | Review exact submissions, request changes, reject, or approve when authorized.                     | Cannot alter a published Revision; cannot publish without a separately granted Publisher capability. |
| Publisher              | Publish an approved unchanged draft as a Revision; archive or withdraw visibility when authorized. | Cannot publish an unapproved or changed submission.                                                  |
| Platform Administrator | Manage internal accounts/capabilities and perform authorized operational administration.           | Does not automatically bypass editorial separation of duties.                                        |

One person may hold multiple capabilities for MVP operation, but every action is authorized and recorded independently. These are internal roles/capabilities, not learner-facing account roles.

### Separation of duties

- Default policy prevents an author from approving their own draft.
- Reviewer identity must be representable separately from author identity.
- A reviewer may also publish only when explicitly granted Publisher capability.
- A configurable small-team self-approval exception, if enabled, must be explicit, reasoned, and audited.
- Content Engine and other Service Actors can never approve or publish.
- Direct `draft` to `published` transition is prohibited.
- Publication requires both workflow-state validation and command-time authorization against an approved unchanged submission.

The exact production exception configuration is deferred, but the default is safe separation.

### Working Draft audit boundary

A Working Draft preserves at least its ID, Lesson Variant ID, workflow state, created-by actor reference and UTC time, last-materially-modified-by actor reference and UTC time, concurrency token, source/ingestion origin, optional Service Actor identity, current Review Submission reference, and lineage from Current Published Revision when applicable.

Every keystroke need not create an immutable snapshot. The model must still identify who created and last materially changed the draft, the exact submitted content, and the approved content ultimately published.

### Review Submission

A Review Submission is an immutable record that one Working Draft state was submitted for human review. It preserves:

- Review Submission ID, Working Draft ID, and Lesson Variant ID;
- submitting Administrative or Service Actor reference and UTC timestamp;
- submitted draft concurrency/version token;
- submitted content checksum and source-attribution checksum or equivalent integrity reference;
- optional reviewer assignment;
- submission note and submission status; and
- links to later superseding submission or terminal decision where applicable.

Editing after submission invalidates or supersedes the active submission. Reviewers review the exact submitted checksums. Resubmission creates a new record; historical submissions are never overwritten.

### Review Decision and Approval Evidence

A Review Decision is an immutable human reviewer action against one exact Review Submission. Supported decisions are `changes_requested`, `approved`, `rejected`, and `withdrawn` where required. It preserves Decision ID, Review Submission ID, reviewer actor ID, decision type, UTC timestamp, review notes, reviewed content checksum, capability snapshot, optional checklist result, and optional quality-rubric version.

One active terminal decision applies to a Review Submission. Changes requested returns work to editable draft state. Approval applies only to the exact submitted checksum and becomes unusable if the draft changes. Erroneous decisions receive a new Superseding Record; history is never edited.

Approval Evidence is the approved Review Decision plus its exact Review Submission, content/source checksums, reviewer, UTC timestamp, authorization-at-decision evidence, and confirmation that no unresolved changes request or later draft change exists.

```text
Editorially approved != Published
```

Approval never makes content learner-visible.

### Publication Record

A Publication Record is immutable evidence that an approved Working Draft was converted into an immutable Lesson Revision and made learner-visible. It preserves:

- Publication Record ID;
- Lesson, Lesson Variant, and Lesson Revision IDs;
- Variant-scoped Revision Number;
- Review Submission ID and approving Review Decision ID;
- publishing Administrative Actor ID and authorization/capability snapshot;
- publication UTC timestamp;
- Package Checksum, submitted/published content checksum, and source-attribution integrity reference;
- publication status; and
- optional deployment/publication note.

Publication runs in the same database transaction that verifies the exact approval/checksums, allocates the Revision Number, creates the Lesson Revision and Publication Record, switches Current Published Revision, and establishes learner visibility. The publisher must be authorized. Exactly one Publication Record creates a Lesson Revision. Failure creates neither a partial Revision nor a Publication Record.

Learner visibility derives from successful publication and applicable visibility records, never approval alone.

### Archive, withdrawal, and restoration records

Append-only visibility records represent Variant archive, exact Revision withdrawal from discovery, permitted publication restoration, Lesson archive, and emergency safety withdrawal. Each preserves Record ID, actor reference, UTC timestamp, reason, target type/ID and exact Revision where applicable, prior state, resulting state, and authorization context.

Archival and withdrawal do not mutate or delete a Lesson Revision, Publication Record, or historical Reading Session. Restoration does not rewrite the original publication timestamp. A compensating record changes visibility while preserving the full chronology. Download expiry or forced device removal remains a later policy decision.

### Audit immutability and privacy

- Editorial records are append-only; ordinary operations cannot update or delete historical submissions, decisions, publication, or visibility records.
- Corrections use superseding or compensating records.
- Timestamps use UTC, and stable IDs plus timestamps make ordering reconstructable.
- Destructive cascade deletion of audit history is prohibited.
- Privileged audit access is restricted and itself logged.
- Learner APIs expose no internal notes or administrator identity.
- Server-only review/audit records remain outside Offline Lesson Packages.
- Audit records use stable IDs and minimal necessary snapshots; internal notes are restricted sensitive data.
- Editorial audit and learner activity are separate data classes.
- History-safe actor deactivation/anonymization and retention extension points follow [ADR-017](./ADR-017-use-history-safe-deletion-and-anonymization.md); exact treatment and periods remain privacy/legal policy.

Database triggers may later provide exceptional secondary protection, but application-service transactions and PostgreSQL constraints remain the primary enforcement boundary.

### Transaction boundaries

#### Submit for review

One transaction verifies draft concurrency/state and submitted checksums, creates the immutable Review Submission, and moves the Working Draft to `in_review`.

#### Request changes, reject, or approve

One transaction verifies the current exact Review Submission, reviewer authorization and separation policy, creates the immutable Review Decision, and transitions workflow state. Approval verifies the submitted checksum and records authorization-at-decision evidence.

#### Publish

One transaction verifies the approved Review Decision and unchanged checksums, publisher authorization, and package prerequisites; allocates the Revision Number; creates the Lesson Revision and Publication Record; switches Current Published Revision; closes the draft; and makes the Revision learner-visible.

#### Archive, withdraw, or restore

One transaction verifies authorization, appends the visibility/audit record, and changes discoverability without destroying historical evidence.

When implemented, all participating repositories share one transaction-scoped Prisma client.

### API implications

- Administrative commands require authenticated internal context and capability/workflow validation.
- Request bodies never supply a trusted actor ID; the server derives actor identity from authenticated context.
- Draft mutations require an expected concurrency token.
- Review commands address an exact Review Submission ID; changed/stale submissions conflict.
- Publication returns exact Lesson Revision and Publication Record IDs.
- Learner responses exclude review notes and administrator details.
- Future audit queries are restricted and paginated.

Endpoint paths remain outside this ADR.

### Candidate domain events

| Event                         | Classification and audit relationship                                                        | Idempotency expectation                                    |
| ----------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| LessonDraftCreated            | Domain event; Working Draft current audit attributes persist the outcome.                    | Command retry must not create duplicate drafts.            |
| LessonDraftUpdated            | Domain event; material modifier/state retained, not a full immutable snapshot per keystroke. | Expected token prevents duplicate/conflicting mutation.    |
| LessonDraftSubmittedForReview | Domain event backed by one immutable Review Submission.                                      | Stable command/submission identity prevents duplicates.    |
| LessonDraftChangesRequested   | Domain event backed by one immutable Review Decision.                                        | Stable decision identity required.                         |
| LessonDraftRejected           | Domain event backed by one immutable Review Decision.                                        | Stable decision identity required.                         |
| LessonDraftApproved           | Domain event backed by approved Review Decision/Approval Evidence.                           | Stable decision identity required.                         |
| LessonRevisionPublished       | Domain event backed by one Publication Record and Lesson Revision.                           | Transactional uniqueness makes retry safe.                 |
| LessonVariantArchived         | Domain event backed by append-only visibility record.                                        | Stable action identity required.                           |
| LessonRevisionWithdrawn       | Domain event backed by append-only withdrawal record.                                        | Stable action identity required.                           |
| LessonPublicationRestored     | Domain event backed by append-only restoration record.                                       | Stable action identity required.                           |
| AdministrativeRoleChanged     | Identity/authorization domain event backed by restricted role-change audit evidence.         | Stable change identity required.                           |
| ServiceDraftImported          | Domain event backed by Service Actor reference and draft origin.                             | Import command identity prevents duplicate drafts/updates. |

These are not transport events unless an integration later publishes them. No message broker or event-sourced persistence is required.

## Alternatives considered

### Current-state field only

Rejected because it cannot reconstruct human review, authorization, or publication history.

### Generic audit-log row only

Rejected as the sole model because critical workflow relationships and uniqueness require typed submissions, decisions, and publication evidence. A generic operational log may supplement them.

### Event sourcing for all content

Deferred because full event sourcing adds unnecessary MVP complexity.

### Mutable review and publication records

Rejected because edited history cannot provide reliable evidence.

### One undifferentiated human/service user model

Rejected because learner, administrative, service, and process permissions and accountability differ.

### Content Engine approval or publication

Rejected because approved product behavior requires human review and controlled publication.

## Consequences

### Benefits

- Human review and publication can be reconstructed against exact content.
- Approval and learner visibility remain separate and enforceable.
- Service ingestion cannot impersonate human approval.
- Actor changes, deactivation, and corrections do not erase history.
- Typed evidence supports constraints while preserving physical-design flexibility.

### Costs and trade-offs

- More records and transactional checks are required than a single status field.
- Restricted notes, actor snapshots, retention, and anonymization need privacy governance.
- Small teams need an explicit, audited exception if self-approval is permitted.

## Implementation implications

- Physical schemas must preserve append-only evidence, stable actor references, exact checksums, and one Publication Record per Lesson Revision.
- Application services own authorization, separation-of-duties, workflow, and transaction validation.
- PostgreSQL constraints provide structural integrity; triggers are exceptional secondary protection only.
- Tests must cover changed submissions, stale tokens, self-approval default denial/exception audit, unauthorized services, concurrent publication, failed atomic publication, append-only history, visibility compensation, and restricted audit access.

## Deferred implementation details

- Internal authentication provider and RBAC/permission library.
- Physical human/service/process actor-table structure and polymorphic reference syntax.
- Whether and which actor profile snapshots are retained.
- Production self-approval exception configuration.
- Review checklist and quality-rubric content/version governance.
- Review-note access, encryption, and retention policy.
- Audit-query access model and operational export tooling.
- Exact Administrative Actor anonymization presentation and editorial-evidence retention periods within ADR-017's approved boundary.

These do not reopen the typed, append-only editorial evidence, stable actor-reference, separation-of-duties, or transactional publication decisions.

## Review triggers

Review this ADR if regulations require stronger signatures, publication becomes multi-stage across legal jurisdictions, service approval is proposed, editorial event sourcing is adopted, or privacy requirements make the approved minimal actor evidence insufficient.
