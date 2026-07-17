# Prolific Offline Lesson Package

## Document control

| Item               | Value                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------ |
| Status             | Approved conceptual package boundary; implementation pending                                                 |
| Decision authority | [ADR-014](../decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md)                       |
| Revision authority | [ADR-013](../decisions/ADR-013-use-lesson-variants-and-immutable-revisions.md)                               |
| Domain authority   | [Canonical Domain Model](../architecture/canonical-domain-model.md)                                          |
| Gate status        | [Architecture Gate 001 PASS; AG-003 human-verified](../reviews/ARCHITECTURE-GATE-001.md#required-conditions) |
| Review date        | YYYY-MM-DD                                                                                                   |

The strict specification is [lesson-package.schema.json](../../packages/shared-contracts/specifications/lesson-package.schema.json). This document defines semantics; the schema defines the interoperable JSON shape.

## Purpose and scope

This document defines the immutable, self-contained learner package for one published Lesson Revision and its conceptual local lifecycle. It does not select a Flutter local database, archive/compression format, object-storage provider, download protocol, audio format, or implementation classes.

A verified package must support learner discovery context, tutorial playback and alignment, lyric-style highlighting, application-silent practice, source attribution, completion evidence, and historical interpretation without network access.

## Package identity and boundary

One package represents exactly one Lesson Revision. Revision identity, Package Checksum, Asset Checksum, and Transport URL have separate meanings:

| Concept            | Meaning                                                                           |
| ------------------ | --------------------------------------------------------------------------------- |
| Lesson Revision ID | Stable historical identity of the immutable published content snapshot.           |
| Package Checksum   | SHA-256 integrity value over the canonical package-relevant representation.       |
| Asset Checksum     | SHA-256 integrity value over the exact bytes of one packaged file.                |
| Transport URL      | Temporary or replaceable locator; never identity, version, or integrity evidence. |

## Required package contents

### Manifest

The Manifest contains:

- positive-integer Package Schema Version;
- Lesson ID;
- Lesson Variant ID;
- Lesson Revision ID;
- positive Variant-scoped Revision Number;
- title;
- Language;
- Difficulty;
- publication timestamp in UTC ISO 8601;
- Package Checksum;
- Tokenization Profile and positive-integer version;
- Alignment Profile and positive-integer version;
- minimum compatible app/package-reader schema version when required;
- generation timestamp for operational provenance; and
- deterministic references to required package files/assets.

The generation timestamp is not a checksum input because rebuilding semantically identical package content must reproduce the same Package Checksum.

### Structured content

The package contains:

- ordered Content Blocks using only `heading`, `paragraph`, `callout`, `fact`, and `quote` for the MVP;
- stable Revision-local block IDs;
- block type, explicit order, readable flag, and Canonical Display Text;
- ordered zero-based Reading Positions with Reading Unit IDs, Block IDs, Unicode-scalar Display Spans, canonical surface text, and Normalized Comparison Text;
- reproducible word count;
- estimated reading time; and
- supported MVP pace presets: Easy 100 WPM, Medium 150 WPM, and Hard 200 WPM.

Only readable blocks create positions. Paragraphs are primary; headings count only when readable, while readable facts, quotes, and callouts participate normally. Decorative metadata produces no Reading Positions.

### Tutorial audio and alignment

The package contains:

- audio asset ID;
- package-relative audio file name;
- format/MIME placeholder;
- duration;
- byte size when known;
- SHA-256 Asset Checksum;
- Alignment Profile/version;
- ordered timing entries with audio start/end offsets and referenced Reading Position or contiguous range; and
- optional alignment confidence/review status when approved.

The package stores the local-playable audio file. Alignment is precomputed and references immutable Reading Positions; silent practice uses those positions without playing audio.

### Attribution

Learner/offline attribution includes, where applicable:

- source names;
- source URLs or canonical references;
- licence or permission labels;
- attribution text; and
- review/quality metadata explicitly approved for learner display.

Source material and the adapted Canonical Display Text remain distinct. Server-only review notes and internal audit details are excluded.

### Integrity and compatibility metadata

The package includes:

- per-file SHA-256 Asset Checksums;
- Package Checksum;
- Package Schema Version;
- generation timestamp;
- Tokenization and Alignment Profile versions; and
- minimum compatibility metadata needed to prevent unsafe interpretation.

## Explicit package exclusions

The package must not contain:

- user progress or User Progress projections;
- bookmarks;
- Reading Session state or Reading Session Events;
- account/access/refresh tokens;
- guest analytics identifiers/events;
- mutable learner preferences;
- server-only review notes;
- administrative audit details not required for learner attribution;
- secrets, API keys, storage credentials, or signed long-lived access material;
- temporary download URLs, mutable CDN query parameters, or CDN hostnames as integrity inputs; or
- device-specific paths, identifiers, or cache state.

## Local package model

The conceptual local boundary is:

```text
Local Lesson Package Record
-> Manifest
-> Structured Content
-> Tutorial Audio File
-> Download State
-> Integrity State
```

The Local Lesson Package Record indexes package identity and operational state. It does not become the authoritative Lesson Revision or contain learner progress.

### Download states

| State              | Meaning                                                                                 |
| ------------------ | --------------------------------------------------------------------------------------- |
| `not_downloaded`   | No usable local package is present.                                                     |
| `queued`           | Download is authorized and waiting to start.                                            |
| `downloading`      | Manifest/assets are transferring into isolated temporary storage.                       |
| `verifying`        | Required files and canonical integrity values are being checked.                        |
| `available`        | Manifest and every required asset verified and were atomically promoted.                |
| `update_available` | A different Current Published Revision/package is available; existing package may work. |
| `corrupt`          | Required data failed integrity or structural validation and is quarantined/unusable.    |
| `deletion_pending` | Removal is scheduled but must respect an active/incomplete Reading Session.             |
| `removed`          | Local package bytes/index are removed; history and server Revision remain.              |

### Integrity states

| State      | Meaning                                                             |
| ---------- | ------------------------------------------------------------------- |
| `unknown`  | Verification has not completed for the current local candidate.     |
| `verified` | Canonical manifest and every required asset passed validation.      |
| `failed`   | A checksum, structure, completeness, or compatibility check failed. |

## Download and verification rules

- Transfer occurs in isolated temporary storage.
- A package becomes `available` only after the Manifest, structured content, required audio, per-file checksums, Package Checksum, and compatibility checks succeed.
- Incomplete downloads are never displayed as available.
- Interrupted downloads may resume or restart under the later approved protocol.
- Corrupt packages are quarantined or removed and cannot open in the player.
- A failed update preserves the previous verified package unless a later safety/expiry policy marks it unusable.
- Atomic promotion prevents mixing content/audio/alignment from different Revisions.
- The app rejects or defers an unsupported Package Schema Version or unknown required/readable block type with a compatibility result; it never silently drops readable content.
- An application update must interpret an old package using its recorded profile/schema versions and must not silently retokenize it.

## Package checksum boundary

The Package Checksum uses the canonical SHA-256 policy in ADR-014. It covers Revision identity and immutable semantic package content: ordered blocks/positions, readable flags, word count, profiles, pace metadata, audio identity/checksum, alignment, learner attribution, schema, and interpretation-affecting compatibility data.

It excludes local paths, transfer/cache timestamps, generation timestamp, operational state, device/user/session data, temporary URLs, CDN data, credentials, and the checksum field itself.

Arrays retain meaningful order. Canonical JSON object keys are recursively lexicographically ordered, insignificant whitespace is absent, and exact Canonical Display Text code-point sequences are preserved.

## Package schema evolution

- Package Schema Version is a positive integer independent of Lesson Revision Number.
- Additive backward-compatible evolution is preferred.
- Breaking interpretation changes require a new Package Schema Version.
- Unknown required/readable blocks cause compatibility rejection or deferral.
- Optional decorative blocks may be ignored only when explicitly marked safe.
- Old verified packages remain interpreted using their recorded schema/profile versions.
- Local metadata migration never changes Lesson Revision ID or historical Reading Positions.

## Reading Session and update behavior

- A Reading Session uses the exact installed Lesson Revision and records its Package Schema Version, Tokenization Profile/version, Reading Position, eligible units, pace, duration, and outcome.
- A newer Current Published Revision never rewrites active or historical sessions.
- Multiple Revisions need not remain downloaded simultaneously unless an active or incomplete session requires the older Revision.
- Package deletion never deletes local reading history, queued progress, or server-side Revision history.
- Sync retries preserve the original Lesson Revision and final Reading Position.

### Account deletion and privacy

- Account deletion does not delete public Lesson Revision/package history from the server.
- Local account-restricted downloads may be removed under a later approved device policy; local package removal never deletes Reading Session or server history.
- Pending outbox events are assessed before local cleanup and are not silently discarded where warning/recovery is possible.
- A deactivated/deleted account cannot use an old Device or outbox event to restore the account or reattach anonymized activity.
- Withdrawn or unsafe content may require a future forced-expiry/removal policy; exact download expiry and offline-account behavior remain unresolved.

## Content evolution

Future package versions may add block types, but the MVP supports only the approved five textual types. New readable content can never be silently omitted by an older client. Images, quizzes, video, interactive questions, and rich embedded media are outside the MVP package unless separately approved.

## Implementation details still open

- Flutter local database and package-index representation.
- Exact archive/compression and package-relative file layout.
- Download resume/range protocol and quarantine mechanism.
- Exact audio format, bitrate, and alignment-generation method.
- Object-storage/CDN provider and authorized delivery mechanism.
- Exact Language-specific Tokenization Profile algorithms.
- Maximum package/audio/content size and storage-reservation policy.
- Supported Package Schema Version compatibility window.

These details do not change the approved immutable package boundary and do not authorize implementation.
