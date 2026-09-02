# Tutorial Audio Generation Foundation Review

## Review outcome

**Status:** Foundation implemented; production and platform integration not
authorized.

Sprint 3.5 subsequently validated one English proof and moved gTTS behind the
provider-neutral boundary documented in the
[TTS Capability Evaluation](./TTS-CAPABILITY-EVALUATION.md) and proposed
[ADR-018](../decisions/ADR-018-tutorial-speech-provider-strategy.md). This document
remains the Sprint 3.4 foundation record.

Sprint 3.4 establishes a standalone Python 3.12 and gTTS generation boundary at
`services/tutorial-audio`. It creates deterministic local MP3 assets from explicitly
supplied lesson text without changing Flutter, the Core API, Prisma, migrations, or
PostgreSQL.

The requested `FLUTTER-READING-PLAYER-SHELL-REVIEW.md` input did not exist at review
time. This foundation therefore makes no claim that a functional reading-player
shell, audio integration, or highlighting contract has been approved.

## Architecture and responsibilities

The service contains four explicit layers:

| Area         | Responsibility                                                                       |
| ------------ | ------------------------------------------------------------------------------------ |
| `config`     | Immutable environment-backed output, speed, overwrite, and default-language settings |
| `models`     | Transport-neutral request/result values and narrow expected errors                   |
| `generators` | Input validation, gTTS invocation, collision protection, and result creation         |
| `cli`        | Argument parsing and JSON console output for a single generation request             |
| `utils`      | Deterministic filename, explicit language mapping, and structured local logging      |

The gTTS client is injected into the generator. Unit tests replace it with a local
fake and do not make network requests.

## Input and output contract

`TutorialAudioGenerator.generate()` accepts a lesson ID, lesson version, BCP 47
language code, lesson title, and text. It returns immutable metadata containing the
filename, absolute output path, nullable duration placeholder, requested language,
and success state.

The canonical filename is:

```text
lesson_<lessonId>_v<lessonVersion>.mp3
```

Lesson identifiers and versions are validated rather than silently rewritten.
Existing output is rejected by default. A replacement occurs only when overwrite is
explicitly enabled by the caller or environment. Generation uses a temporary file,
and non-overwrite publication reserves the destination before the final atomic
replacement to reduce collision risk.

Duration remains `null` because metadata inspection is outside this foundation.

## Language mapping

| Prolific language | Provider code | Foundation behavior                               |
| ----------------- | ------------- | ------------------------------------------------- |
| English (`en-ZA`) | `en`          | Enabled                                           |
| isiZulu (`zu-ZA`) | `zu`          | Candidate mapping recorded but disabled           |
| Sepedi (`nso-ZA`) | None          | Recorded placeholder and rejected until validated |

The installed gTTS 2.5.4 language catalogue lists neither `zu` nor `nso`. isiZulu
and Sepedi are launch languages, but their provider availability, voice selection,
and pronunciation quality have not been verified. Both are rejected in this
foundation, and the generator never substitutes another language or disables gTTS
language validation to rely on undocumented behavior.

## Security, privacy, and operational boundaries

gTTS is network backed and transmits supplied text to external Google Translate
text-to-speech infrastructure. Only approved, non-confidential lesson text may be
used. This implementation has no secrets, user data, analytics, telemetry, database
access, upload capability, publication authority, retries, queue, rate limiting,
provider service-level agreement, or production approval.

Structured logs describe lifecycle outcomes only. They do not include lesson text,
titles, identifiers, local paths, or personal information.

## Future platform integration

The future approved flow is expected to be:

```text
Approved lesson content
  -> tutorial-audio generator
  -> versioned MP3 asset
  -> approved content storage and immutable lesson package
  -> authenticated/offline-capable Flutter download
  -> local Flutter tutorial playback
```

This sprint implements only the generator-to-local-MP3 step. Publication must remain
an application-owned workflow that validates the unchanged approved revision,
alignment data, asset checksum, and package checksum before learner visibility. File
paths from this local tool must never become public API or package identifiers.

## Highlighting and alignment limitation

gTTS returns audio, not authoritative word-level timestamps. The generated MP3
cannot by itself support synchronized word or phrase highlighting. A later approved
alignment process must bind timing entries to the exact immutable Lesson Revision's
Reading Positions and audio checksum. Approximate WPM movement must not be presented
as provider-derived alignment.

## Deferred work

- Validate isiZulu and Sepedi providers and pronunciation quality.
- Approve external-provider privacy, legal, safeguarding, and operational terms.
- Define voice selection and South African pronunciation acceptance criteria.
- Add audio duration and format inspection.
- Design retry, failure quarantine, rate-limit, and batch-generation behavior.
- Define object storage, immutable asset identity, checksums, and access control.
- Implement revision-bound alignment generation and review.
- Integrate publication, package assembly, Core API delivery, and Flutter downloads.
- Implement local tutorial playback and restoration in the reading player.

Sprint 3.5 resolved provider isolation, capability-state modeling, English proof
metadata, and capability CLI reporting. isiZulu/Sepedi sourcing, human listening,
production provider approval, and word-level alignment remain deferred.

## Validation scope

The service validation covers formatting, language mapping, deterministic filenames,
overwrite protection, invalid language, empty text, configuration defaults, CLI
parsing, and mocked generation. It deliberately excludes live gTTS network calls.

No Flutter, NestJS, Prisma schema, migration, SQL, PostgreSQL, root Node dependency,
or lockfile change is part of Sprint 3.4.
