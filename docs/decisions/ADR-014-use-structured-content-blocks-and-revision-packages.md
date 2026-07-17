# ADR-014: Use Structured Content Blocks and Revision Packages

## Status

Accepted

## Decision date

YYYY-MM-DD

## Owner

TBD

## Review date

YYYY-MM-DD

## Related records

- Architecture Gate condition: [AG-003](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)
- Product requirements: [Product Requirements Document](../01-product-vision/product-requirements-document.md)
- Domain authority: [Canonical Domain Model](../architecture/canonical-domain-model.md)
- Terminology: [Domain Glossary](../02-requirements/domain-glossary.md)
- Database design: [Conceptual ERD](../07-database/erd.md) and [Database Overview](../07-database/database-overview.md)
- API contract guidance: [API Overview](../08-api-specification/api-overview.md)
- Revision identity: [ADR-013: Use Lesson Variants and Immutable Revisions](./ADR-013-use-lesson-variants-and-immutable-revisions.md)
- Offline boundary: [Offline Lesson Package](../05-mobile-app/offline-lesson-package.md)
- Gate evidence: [Architecture Gate 001](../reviews/ARCHITECTURE-GATE-001.md)

## Context

One undifferentiated paragraph string cannot reliably support Prolific's lyric-style highlighting, stable reading positions, reviewed tutorial-audio synchronization, silent pace-controlled practice, structured rendering, source attribution, deterministic checksums, or historically reproducible offline sessions. Raw character offsets alone are fragile when normalization or presentation changes, and audio timing cannot be the only position source because practice must work without application audio.

The content model must preserve learner-visible punctuation, capitalization, diacritics, and paragraph boundaries across English, isiZulu, and Sepedi. It must also permit future rendering evolution without changing an already published Lesson Revision. Packages must be self-contained, verifiable, compatible with the app, and distinguish immutable Revision identity from integrity values and transport locations.

## Decision

A published Lesson Revision is represented for delivery as:

```text
Lesson Revision
-> Content Blocks
-> Reading Units
-> Display Spans
-> Tutorial Audio Metadata
-> Source Attribution
-> Package Manifest
```

These are conceptual and package boundaries. This ADR does not require one database table per nested concept.

### Content Blocks

The MVP supports these Content Block types:

- `heading`
- `paragraph`
- `callout`
- `fact`
- `quote`

Every block has a non-empty ID unique within its Lesson Revision, an explicit deterministic display order, a block type, Canonical Display Text where textual, and a readable flag. Learner-facing reading content is stored in ordered blocks. Paragraphs are the primary MVP readable block. A heading contributes to pace and word count only when marked readable; decorative headings do not. Facts, quotes, and callouts contribute when marked readable. Decorative metadata does not create Reading Positions.

Images, quizzes, video, interactive questions, and rich embedded media are not part of the MVP package. Future package schema versions may add block types without changing published Revisions. Unknown required/readable block types must never be silently ignored; an optional decorative type may be ignored only when its schema metadata explicitly says that doing so is safe.

### Canonical Display Text

Each readable block stores the exact learner-visible Canonical Display Text. It preserves punctuation, capitalization, Unicode code points and diacritics, and block/paragraph boundaries. It is immutable after publication and is the source for rendering, Reading Units, word count, checksum input, tutorial alignment, and historical session interpretation.

Normalized Comparison Text may be derived for comparison or search. It does not replace or alter Canonical Display Text. Tokenization never changes what the learner sees, and source material remains distinct from the adapted canonical lesson text.

### Reading Units and Display Spans

A Reading Unit is the smallest pace-controlled element advanced by the player. Most MVP Reading Units represent one orthographic word. Whitespace is not a Reading Unit, and standalone punctuation is not normally counted as a word. Punctuation remains visible in the Reading Unit's Display Span.

Each Reading Unit has an ID unique within the Lesson Revision and references one Content Block. Its Display Span is a zero-based, block-relative, half-open range `[start, end)` over Unicode scalar values in the block's immutable Canonical Display Text. The span identifies the exact canonical surface to highlight. Implementations may map these offsets to platform-native string indexes but must reproduce the same surface boundaries.

### Reading Positions

A Reading Position is a stable ordered location within one Lesson Revision used by tutorial alignment, silent practice, session tracking, and completion.

Every position records at least:

- a zero-based Revision-relative position index;
- Content Block ID;
- Reading Unit ID;
- zero-based half-open Display Span start/end;
- canonical surface text;
- Normalized Comparison Text; and
- readable classification where needed.

Readable position indexes are contiguous from `0` and scoped to exactly one Lesson Revision. Position identity never spans Revisions. Canonical text or position changes require a new Revision. A Reading Session may store the final reached position and eligible units completed. Tutorial alignment references Reading Positions or contiguous position ranges, never mutable draft positions or raw offsets alone.

### Tokenization Profile

Every Lesson Revision records `tokenization_profile` and positive-integer `tokenization_profile_version`. Together with Language and immutable Canonical Display Text, they deterministically reproduce Reading Units, Reading Positions, and word count.

The MVP baseline rules are:

- split primarily on Unicode whitespace;
- preserve punctuation in Canonical Display Text and highlighted spans;
- remove surrounding punctuation only when deriving Normalized Comparison Text and word-count eligibility;
- preserve internal apostrophes and hyphens when they form one lexical unit;
- handle decimal numerals and common abbreviations deterministically within the profile;
- use a documented Unicode-aware normalization form for Normalized Comparison Text while preserving Canonical Display Text exactly;
- preserve Unicode diacritics and do not remove accents by default;
- never lowercase Canonical Display Text;
- allow case folding only in Normalized Comparison Text where linguistically safe; and
- produce identical results for the same canonical text, Language, profile, and profile version.

Exact language-specific contraction, abbreviation, punctuation, grapheme, and lexical rules remain implementation work. The architecture does not claim one universal tokenizer solves every South African language.

### Word count

Lesson Revision word count is derived from readable Reading Units:

- readable paragraphs, facts, quotes, and callouts count;
- headings count only when included in the paced sequence;
- decorative blocks and whitespace do not count;
- punctuation does not count independently;
- the immutable package stores the resulting count; and
- the count must be reproducible from its blocks, positions, and Tokenization Profile Version.

Practice reading-speed calculations use eligible Reading Units completed and practice duration. Tutorial duration never contributes. Any change to eligible Reading Units changes the Package Checksum and requires a new Lesson Revision.

### Tutorial audio and Alignment Profile

Tutorial Audio Metadata belongs to one exact Lesson Revision and includes audio asset identity, package-relative file name, format/MIME placeholder, duration, byte size where available, Asset Checksum, Alignment Profile and version, alignment timing entries, and optional confidence/review status.

Alignment entries reference a Reading Position or a contiguous position range and provide non-negative start/end offsets within the audio timeline. They never reference mutable draft positions. Changing published audio semantics or alignment timing requires a new Lesson Revision unless a future ADR explicitly permits an operationally equivalent replacement.

Audio format, alignment-generation method, and provider remain unresolved. The MVP may use reviewed precomputed alignment; no real-time alignment or TTS provider is selected.

### Offline Lesson Package

One immutable Offline Lesson Package represents one published Lesson Revision. Its exact required contents and local lifecycle are defined in the [Offline Lesson Package](../05-mobile-app/offline-lesson-package.md).

The package includes a Manifest, ordered structured content, Reading Positions, Tokenization/Alignment Profile identities and versions, word-count and pace metadata, tutorial audio plus integrity/alignment metadata, learner-required source attribution, per-file Asset Checksums, a Package Checksum, and compatibility metadata.

It excludes learner progress, bookmarks, Reading Session state, tokens, credentials, guest analytics, mutable preferences, server-only review notes, unnecessary administrative audit data, secrets, temporary URLs, and storage credentials.

### Package Checksum

SHA-256 is the approved algorithm for Package Checksums and Asset Checksums. Values use lowercase hexadecimal prefixed with `sha256:`.

The Package Checksum hashes UTF-8 canonical JSON representing package-relevant immutable fields. Canonical serialization recursively orders object keys lexicographically, emits no insignificant whitespace, preserves meaningful array order and exact string code-point sequences, and uses deterministic JSON primitive representations. The `package_checksum` field itself is omitted from the hashed representation to avoid circularity.

The checksum covers:

- package schema version;
- Lesson, Lesson Variant, and Lesson Revision IDs;
- Revision Number, title, Language, Difficulty, and publication timestamp;
- ordered Content Blocks, block IDs/types/order, readable flags, and Canonical Display Text;
- ordered Reading Units/Positions, spans, surface/normalized forms, and word count;
- Tokenization Profile and version;
- supported pace metadata stored in the package;
- tutorial audio identity, package-relative file name, semantic metadata, and Asset Checksum;
- Alignment Profile/version and ordered timing entries;
- learner-required source attribution; and
- compatibility metadata that affects interpretation.

It excludes:

- the Package Checksum field itself;
- local/remote file paths outside the package-relative layout;
- download or cache timestamps;
- package generation timestamp;
- download/integrity state;
- device-specific metadata;
- user progress or session state;
- temporary URLs, CDN hostnames, storage credentials, and mutable query parameters; and
- operational availability/health state.

An Asset Checksum covers the exact bytes of one packaged asset. Revision identity identifies historical content. Package Checksum verifies the package-relevant representation. Asset Checksum verifies a file. A Transport URL only locates bytes and is never identity or integrity evidence.

### Checksum and Revision change rules

Any package-relevant field change produces a different Package Checksum. A new Lesson Revision is required for changes to learner-visible text; block structure/order/readability; Reading Units/Positions; word count; Language or Difficulty adaptation; source attribution; tutorial-audio semantics; alignment timing; Tokenization/Alignment Profile identity/version; or package interpretation.

CDN hostname, temporary URL, local path, download time, operational availability, and local integrity state changes require neither a new Lesson Revision nor a different Package Checksum. Repackaging identical semantic content under the same canonical package representation produces the same Package Checksum.

### Package Schema Version

Every package records a positive-integer Package Schema Version, separate from Lesson Revision ID and Revision Number. The app rejects or defers a package requiring an unsupported schema version and must not present it as available. Additive backward-compatible evolution is preferred; a breaking interpretation change increments the schema version. Existing downloads remain interpreted under their recorded version, and local metadata migration never mutates historical Revision identity.

### Session and analytics history

A Reading Session records at minimum the Lesson Revision ID, Package Schema Version, Tokenization Profile/version, selected pace and actual WPM, final reached Reading Position, eligible Reading Units completed, practice duration, and completion outcome.

Historical WPM uses the Reading Unit count stored/reproducible for that Revision. A newer tokenizer or package never recalculates an old session. Analytics and synchronization preserve the original Revision and final position rather than interpreting history with current content.

## Alternatives considered

### Plain paragraph string only

Not selected because it cannot reliably support structured rendering, stable positions, alignment, attribution, or reproducible offline history.

### Raw character offsets only

Not selected because offsets without Revision, Block, Unit, and profile identity are fragile across normalization and rendering changes.

### Sentence-only pacing

Not selected because Prolific's signature reading experience requires finer word-level progression.

### Fully linguistic token model

Deferred because it is too complex for the MVP across all South African languages. Versioned deterministic profiles preserve an upgrade path.

### Audio timing as the only position source

Not selected because silent practice must use the same stable positions without audio.

### Mutable package with stable Revision ID

Not selected because it breaks integrity, cached/offline reproducibility, auditability, and historical analytics.

## Consequences

### Benefits

- Tutorial and silent practice share one stable Revision-scoped position model.
- Canonical learner text remains exact while normalized forms support deterministic comparison.
- Packages can be verified, cached, interpreted offline, and reproduced historically.
- Profile/schema versions permit controlled multilingual and package evolution.
- Integrity values have explicit meanings and do not become content identity.

### Costs and trade-offs

- Publication must generate and validate blocks, units, positions, profiles, manifest, alignment, and checksums deterministically.
- Multilingual tokenization requires reviewed profile-specific implementation and tests.
- Package compatibility and unsupported block behavior require explicit client handling.
- Physical JSON-versus-relational storage and archive/compression transport remain open.

## Implementation implications

- Draft preparation and external audio/alignment generation occur outside the publication transaction.
- Publication validates prepared immutable inputs, assembles the canonical package representation, computes SHA-256 checksums, and creates the Lesson Revision atomically with its content identity.
- Package verification occurs before local availability; incomplete/corrupt data is never promoted.
- Reading Sessions and sync events store original Revision/profile/schema/position evidence.
- Tests must cover deterministic tokenization by profile, Unicode/punctuation cases, zero-based contiguous positions, canonical checksum inclusions/exclusions, corrupted assets, unsupported schema/block types, and historical session reproduction.

## Deferred implementation details

- Exact Language-specific tokenizer rules and test corpora.
- Exact tutorial-alignment generation method and review workflow.
- Tutorial audio format/bitrate and provider.
- Physical JSON versus normalized relational storage for blocks/positions/alignment.
- Package compression/archive format and package-relative file layout.
- Download resume/range protocol and quarantine implementation.
- CDN/object storage provider and authorization mechanism.
- Maximum Lesson Revision/package/audio sizes.
- Supported Package Schema Version compatibility window.
- Exact canonical-JSON implementation/library, which must satisfy this ADR's deterministic rules.

These details do not reopen the structured content, Reading Position, profile-versioning, package-boundary, or checksum decisions and are not AG-003 blockers unless later evidence shows that one prevents their guarantees.

## Review triggers

Review this ADR if MVP content adds interactive/media blocks, word-level pacing is replaced, published package semantics become mutable, SHA-256 is no longer acceptable, package compatibility cannot preserve historical interpretation, or an approved Language requires a position model the current profile boundary cannot express.
