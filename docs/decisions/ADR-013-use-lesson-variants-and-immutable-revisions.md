# ADR-013: Use Lesson Variants and Immutable Revisions

## Status

Accepted

## Decision date

YYYY-MM-DD

## Owner

TBD

## Review date

YYYY-MM-DD

## Related records

- Architecture Gate condition: [AG-002](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)
- Product requirements: [Product Requirements Document](../01-product-vision/product-requirements-document.md)
- Product decision: [ADR-011: MVP Product Access and Reading Rules](./ADR-011-mvp-product-access-and-reading-rules.md)
- Persistence decision: [ADR-012: Use Prisma for Core API Persistence](./ADR-012-use-prisma-for-core-api-persistence.md)
- Domain authority: [Canonical Domain Model](../architecture/canonical-domain-model.md)
- Terminology: [Domain Glossary](../02-requirements/domain-glossary.md)
- Database design: [Conceptual ERD](../07-database/erd.md) and [Database Overview](../07-database/database-overview.md)
- Delivery sequence: [Master Roadmap](../14-roadmap/master-roadmap.md)

## Context

The earlier Lesson Version concept combined three different responsibilities: the stable educational identity, the language-and-difficulty adaptation, and the editable/published content snapshot. That model is insufficient when one Lesson exists in multiple languages, each language has multiple difficulty adaptations, and only one language/difficulty combination changes.

Translations and difficulty adaptations evolve independently. Published content must remain immutable for offline integrity, reproducible reading sessions, historical analytics, and auditability. Offline packages and synchronization events must identify the exact content used. Ordinary draft saves must remain editable without creating excessive immutable history or consuming learner-facing revision numbers.

The model therefore needs separate stable identities for the educational unit and each language/difficulty stream, plus immutable published snapshots for that stream.

## Decision

Prolific uses:

```text
Lesson
-> Lesson Variant
-> Lesson Revision
```

### Lesson

A Lesson is the stable educational identity of one guided-reading unit, for example `The Pangolin`.

- It belongs to exactly one Topic.
- Its UUID remains stable across translation, difficulty adaptation, correction, and republication.
- It does not directly contain learner-facing paragraph content.
- It may have many Lesson Variants.
- It survives retirement or replacement of individual variants.

### Lesson Variant

A Lesson Variant is the stable identity of one language-and-difficulty-specific adaptation, for example `The Pangolin — English — Beginner`.

- It belongs to exactly one Lesson and one Language.
- It has exactly one Difficulty: Beginner, Intermediate, or Advanced.
- It owns an independent Working Draft and Lesson Revision history.
- It may exist before any Lesson Revision is published.
- It may be active, hidden, or archived.
- By default, only one active variant may exist for a `lesson_id + language_id + difficulty` combination. Parallel editions require a future ADR.

Translations are separate Lesson Variants. Publishing English revision 3 does not create isiZulu revision 3. Translation or adaptation lineage may reference a source Lesson Revision, but the streams remain independent and the revisions are not identical.

### Working Draft

A Working Draft is the single editable working copy for one Lesson Variant in the MVP.

- A variant has at most one active Working Draft.
- Repeated edits update the same draft and do not create a Lesson Revision or consume a revision number.
- Editing a published variant starts a Working Draft from its current published revision.
- The Working Draft is never learner-visible and has no public revision number.
- Submission, changes requested, and approval change workflow state on the same working copy.
- Successful publication creates an immutable Lesson Revision and closes or clears the Working Draft.

The Working Draft lifecycle is:

```text
draft
-> in_review
-> approved
-> published
```

The changes-requested path is:

```text
in_review
-> changes_requested
-> draft
```

`approved` means human review passed; it does not make content learner-visible.

### Lesson Revision

A Lesson Revision is an immutable, publishable snapshot of one Lesson Variant.

It contains the title, content blocks, normalized reading positions or tokens, word count, estimated reading time, source attribution, tutorial-audio metadata, checksum, revision number, review/publication evidence, timestamps, and approved creator/reviewer references.

- It belongs to exactly one Lesson Variant.
- Its UUID is the authoritative revision identity.
- It becomes learner-visible only after successful publication.
- It is never edited in place after publication.
- It remains available for historical Reading Session references.
- It is the exact unit referenced by Offline Lesson Packages, completed Reading Sessions, package updates, and synchronization retries.

### Revision numbering

- Revision numbers are positive integers scoped to one Lesson Variant.
- The first published revision is `1`.
- Later published revisions increment monotonically by `1`.
- Draft edits, rejected drafts, and abandoned drafts do not consume numbers.
- Numbers are never reused.
- The publication transaction assigns the next number atomically.
- Conceptual uniqueness is `lesson_variant_id + revision_number`.
- No global revision counter exists.

### Publication and concurrency

The application service owns one publication transaction. It must:

1. verify the expected Working Draft state and concurrency token;
2. verify that the draft has not changed since approval;
3. lock or atomically verify the Lesson Variant and relevant draft state;
4. allocate the next variant-scoped revision number;
5. create the immutable Lesson Revision;
6. update the Lesson Variant's Current Published Revision reference;
7. record the publishing Administrative Actor and immutable Publication Record required by ADR-015; and
8. close or clear the Working Draft.

A failed transaction creates no partial revision. Two simultaneous publication attempts cannot create the same revision number: only one succeeds; the loser receives a conflict and reloads current state.

Editorial commands use optimistic concurrency. The Working Draft carries a persistence-safe concurrency token, and edit commands provide the expected token. Stale updates are rejected; silent last-write-wins is prohibited. This ADR does not prescribe the token representation, lock primitive, Prisma syntax, or allocation query.

### Uniqueness and current state

- One active Lesson Variant exists by default for each `lesson_id + language_id + difficulty` combination.
- Archiving does not permit a second active duplicate unless a future ADR introduces editions.
- Each Lesson Variant has zero or one Current Published Revision, many historical published revisions, and at most one active Working Draft.
- Each `lesson_variant_id + revision_number` pair is unique.
- A checksum identifies package-relevant content for one immutable revision but does not replace revision identity.

### Immutability and archival

- Learner content, normalized reading positions, source attribution, tutorial-audio metadata, checksum inputs, and other package-relevant fields are immutable after publication.
- Corrections require a new Working Draft and Lesson Revision.
- Historical Lesson Revisions are not deleted merely because a newer revision exists.
- Archival removes content from new discovery while preserving historical references and audit evidence.
- Reading Sessions and Offline Lesson Packages retain their exact Lesson Revision identity.
- Previously downloaded revisions may remain usable according to later expiry or safety policy.
- Audit metadata is not silently rewritten.

Only narrowly defined non-content operational metadata may be considered for later mutation through a separate documented policy. This ADR does not approve any such field.

### Difficulty and pace

Difficulty belongs to the Lesson Variant. The MVP values are Beginner, Intermediate, and Advanced.

Reading pace belongs to the Reading Session. The MVP presets are Easy at 100 WPM, Medium at 150 WPM, and Hard at 200 WPM. One Lesson Variant can be practised at any approved pace. Changing pace creates neither a Lesson Variant nor a Lesson Revision; changing language or difficulty selects a different Lesson Variant.

### Offline packages and Reading Sessions

Each Offline Lesson Package identifies the Lesson ID, Lesson Variant ID, Lesson Revision ID, Revision Number, Language, Difficulty, Package Schema/profile versions, Package Checksum, Asset Checksums, and publication timestamp. Package update checks compare Revision identity and checksums.

A Reading Session references exactly one Lesson Revision. Lesson and Lesson Variant data may be denormalized for reads but cannot replace the historical revision reference. Completion, word counts, reading-speed calculations, and sync retries use the revision originally recorded offline. Downloading a newer revision cannot rewrite historical sessions. Multiple revisions need not remain downloaded simultaneously unless an active or incomplete session requires one, and local package deletion never deletes server-side revision history.

[ADR-014](./ADR-014-use-structured-content-blocks-and-revision-packages.md) defines package contents, Reading Position representation, profile versioning, and checksum rules under AG-003.

## Alternatives considered

### Single Lesson Version stream

Not selected because it couples language and difficulty streams that need independent editorial and publication histories.

### Global version numbering

Not selected because a global sequence provides little editorial meaning within one variant and adds coordination unrelated to content correctness.

### Every save creates a version

Not selected because ordinary editing would create excessive immutable records and consume learner-facing numbers before publication.

### Mutable published content

Not selected because in-place mutation breaks offline integrity, reproducibility, historical analytics, and publication auditability.

### Language-only variants

Not selected because difficulty adaptations within one language also evolve independently.

### Difficulty-only variants

Not selected because translations and language adaptations evolve independently.

## Consequences

### Benefits

- Language and difficulty adaptations evolve independently without losing one stable Lesson identity.
- Revision numbers are meaningful within an editorial stream.
- Published content remains reproducible for offline use, synchronization, analytics, and audit.
- Draft editing remains simple and does not create noisy revision history.
- Exact revision identity prevents newer content from rewriting historical Reading Sessions.

### Costs and trade-offs

- The domain and persistence model gain separate Variant, Working Draft, and Revision concepts.
- Publication requires concurrency-safe number allocation and atomic current-revision switching.
- Adapters must map immutable revisions separately from editable drafts.
- Discovery and package queries must efficiently resolve the Current Published Revision.
- Translation lineage and correction/withdrawal policies still require later design.

## Implementation implications

- `LessonRepository` operations must preserve the Lesson aggregate's variant, draft, and immutable-revision invariants without exposing Prisma types.
- Working Draft updates return an explicit concurrency conflict when the expected token is stale.
- PostgreSQL uniqueness and the application-owned publication transaction both protect variant/revision uniqueness.
- Destructive cascades from Lesson or Lesson Variant to historical revisions are prohibited.
- Learner APIs, packages, Reading Sessions, progress events, and sync retries carry exact Lesson Revision identity.
- Published revisions are created, never updated through ordinary content-edit operations.
- Tests must cover variant uniqueness, one active draft, stale edits, concurrent publication, atomic revision allocation, immutability, exact session/package references, and independent language/difficulty streams.

## Deferred implementation details

- Exact concurrency-token representation.
- Exact database locking and atomic-check strategy.
- Whether Working Draft uses a dedicated physical structure.
- Exact revision-number allocation query.
- Detailed translation-lineage representation.
- Physical block/position/alignment storage, Language-specific tokenizer rules, canonical-JSON library, and package transport/archive implementation under the approved AG-003 boundary.
- Physical actor/reference, capability, and audit-record mapping within the approved ADR-015/AG-004 boundary.
- Correction, withdrawal, and downloaded-revision expiry/safety policy.

These details do not reopen the Lesson/Variant/Revision decision and are not AG-002 blockers unless later evidence shows that one prevents its guarantees.

## Review triggers

Review this ADR if parallel editions are required for one lesson/language/difficulty combination, published content must become mutable, revision numbering needs a different scope, a variant needs multiple active drafts, or an approved package/session requirement cannot retain exact Lesson Revision identity.
