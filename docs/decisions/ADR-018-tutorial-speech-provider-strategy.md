# ADR-018: Tutorial Speech Provider Strategy

## Status

**Proposed — pending multilingual voice evaluation and human approval.**

Sprint 3.6 implemented the Azure adapter with official SDK version `1.50.0`, explicit
English/isiZulu candidate voices, safe environment credential preflight, and mocked
word-boundary normalization. No Azure credentials or approved isiZulu passage were
available, so no live Azure synthesis or alignment evidence exists. The ADR remains
Proposed.

## Context

Prolific requires revision-bound tutorial narration for English (`en-ZA`), isiZulu
(`zu-ZA`), and Sepedi (`nso-ZA`) at launch. Generated audio must be downloadable for
offline use and must eventually have reviewed timing data tied to canonical Reading
Positions. Silent practice remains application-silent.

Sprint 3.4 proved that gTTS 2.5.4 lists its generic English code `en`, but not `zu`
or `nso`, and supplies no word-level timing. Sprint 3.5 generated one English proof
and evaluated current official provider documentation. Language names and codes are
not treated as interchangeable without explicit provider evidence.

## Evidence summary

- gTTS remains a prototype-only, undocumented Google Translate client dependency;
  only the approved-set English mapping is usable in the installed catalogue.
- [Azure Speech language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
  lists `en-ZA-LeahNeural`, `en-ZA-LukeNeural`, `zu-ZA-ThandoNeural`, and
  `zu-ZA-ThembaNeural`; it does not list `nso-ZA`.
- [Azure synthesis events](https://learn.microsoft.com/en-sg/azure/ai-services/speech-service/how-to-speech-synthesis)
  include word-boundary offsets and text positions suitable for later alignment
  evaluation.
- [Amazon Polly voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html)
  list South African English `en-ZA` voice `Ayanda`, but the published language list
  does not list isiZulu or Sepedi. [Speech marks](https://docs.aws.amazon.com/polly/latest/dg/speechmarks.html)
  provide word and sentence timing metadata.
- Google Cloud publishes a voice-list API and broad English support, but exact
  `en-ZA`, `zu-ZA`, and `nso-ZA` voice rows were not verified from the accessible
  official catalogue during this review. Its [SSML timepoints](https://cloud.google.com/text-to-speech/docs/ssml)
  are explicit `<mark>` offsets, not automatic word boundaries.
- [Piper's official voice catalogue](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md)
  lists offline `en_GB` and `en_US`, but no South African English, isiZulu, or
  Sepedi voice. Engine code is GPL-3.0 and each model has separate licensing terms.

## Decision

Adopt a narrow provider-neutral application boundary now. `TutorialAudioGenerator`
depends on `TutorialSpeechProvider`; gTTS is one prototype adapter. Capabilities are
normalized as `supported`, `unsupported`, `requires_verification`,
`configured_but_unavailable`, or `provider_error`. Unsupported languages fail before
provider invocation, and no provider may silently substitute another language.

Do not accept a production provider in this ADR. Azure Speech is the leading
candidate for controlled English and isiZulu voice trials because its official
catalogue covers both locales and exposes word-boundary events. Sepedi remains the
blocking language: human-recorded narration, a verified specialist provider, or a
separately governed custom/offline voice must be evaluated. Launch scope must not be
changed by implementation convenience.

The selected proof defaults are `en-ZA-LeahNeural` and `zu-ZA-ThandoNeural`, with
Luke and Themba retained as explicit candidates. Selection order is deterministic,
not a gender preference. These are officially listed capabilities, not human-approved
voices. Live proof, region, word-boundary, and listening outcomes remain unresolved.

## Alternatives considered

### Keep gTTS as the only provider

Rejected for production. It does not cover two launch languages, has no alignment
metadata or production service contract, and sends text to an external service.

### Select Azure immediately

Deferred. Catalogue coverage is promising, but no paid request, pronunciation
review, privacy/legal approval, cost validation, regional test, or human voice
approval has occurred. Sepedi remains unsupported.

### Use one of Google Cloud or Amazon Polly

Deferred as a sole-provider choice. Current verified evidence does not cover all
three launch languages. Both require cloud identity, metered use, privacy review,
and voice testing.

### Use Piper offline

Deferred. It offers local inference and strong text privacy but lacks launch-locale
voices in the current official catalogue. Training and licensing a voice would be a
separate data, consent, quality, compute, and maintenance programme.

### Human-record all launch audio

Retained as a candidate, particularly for Sepedi. It may improve linguistic quality
and avoid synthesis gaps but introduces recording, consent, editing, versioning,
alignment, storage, cost, and re-recording operations.

## Consequences

- Cloud SDKs, accounts, credentials, and paid calls remain absent.
- Flutter receives immutable audio and alignment artifacts later; it never selects
  or invokes a synthesis provider.
- Provider timing is evidence, not the canonical model. A later reviewed process
  must map it to exact Revision-scoped Reading Positions and checksums.
- Generated audio remains an external preparation step before the publication
  transaction and offline-package assembly.
- Every cloud option requires secret management, least-privilege identity,
  third-party text-transfer review, regional assessment, monitoring, quotas, and
  budget controls.
- Provider and voice changes can alter pronunciation and timing, so provider, voice,
  engine version, language, and asset checksum must become revision metadata before
  production.
- Sprint 3.8 local Flutter playback uses a copied proof MP3 only as a demonstration
  asset. It does not approve gTTS, Azure, provider selection, production audio
  storage, word-boundary alignment, or package delivery.

## Review conditions

Revisit this proposal after:

1. human listening tests of South African English and isiZulu candidate voices;
2. evidence-backed Sepedi narration trials;
3. word-boundary-to-Reading-Position alignment experiments;
4. privacy, legal, safeguarding, licensing, regional, and cost approval;
5. failure, retry, rate-limit, checksum, and reproducibility design; and
6. explicit Product Owner/Architecture Governance approval.
