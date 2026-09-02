# Azure TTS Proof and Multilingual Voice Evaluation

## 1. Outcome

**Status:** `IMPLEMENTATION COMPLETE — LIVE PROOFS BLOCKED`.

The Azure Speech adapter, credential model, voice configuration, offline capability
reporting, proof/alignment pipeline, and mocked tests are complete. No Azure
credentials were present on 2026-08-05, so no paid or live Azure request was made.
No human-approved isiZulu proof passage was supplied, which independently blocks the
isiZulu proof. Azure is not approved for production.

## 2. Authorization boundary

This sprint changed only the standalone tutorial-audio service and documentation.
It did not add Flutter playback, NestJS integration, APIs, persistence, object
storage, offline packaging, schema changes, migrations, analytics, or production
generation. Sepedi synthesis and language substitution remained prohibited.

## 3. Azure SDK decision

The official `azure-cognitiveservices-speech==1.50.0` Python package is required for
Azure synthesis, MP3 output configuration, result handling, and `WordBoundary`
events. It is pinned directly in `requirements.txt`; no other cloud SDK was added.
The locally resolved transitive packages are `azure-core==1.41.0` and
`typing-extensions==4.16.0`. Because this small service has no lock file, only direct
dependencies are reproducibly pinned and future transitive resolution can drift.
A later production packaging decision should introduce an approved hash/lock policy.

The package is Microsoft's official SDK and uses proprietary Microsoft Speech SDK
licence terms. See the [official setup guidance](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/quickstarts/setup-platform?pivots=programming-language-python)
and [PyPI release](https://pypi.org/project/azure-cognitiveservices-speech/1.50.0/).

## 4. Credential model

`AzureSpeechSettings` reads only:

- `AZURE_SPEECH_KEY`;
- `AZURE_SPEECH_REGION`;
- optional `AZURE_SPEECH_ENDPOINT`;
- `AZURE_SPEECH_VOICE_EN_ZA`; and
- `AZURE_SPEECH_VOICE_ZU_ZA`.

The key is excluded from object representations. Synthesis aborts before SDK/network
use unless a key and either region or endpoint exist. `.env.example` contains empty
placeholders only; local `.env` files remain ignored. Errors cross the adapter as
safe normalized capability failures without raw Azure details or proof text.

Credential status during validation:

| Variable                | Present |
| ----------------------- | ------- |
| `AZURE_SPEECH_KEY`      | No      |
| `AZURE_SPEECH_REGION`   | No      |
| `AZURE_SPEECH_ENDPOINT` | No      |

## 5. Provider adapter

`AzureSpeechProvider` implements the existing provider-neutral contract. It owns
official capability mapping, candidate-voice validation, SDK configuration, MP3
output selection, result normalization, and word-boundary capture. The outer
`TutorialAudioGenerator` continues to own deterministic names, proof directory,
overwrite policy, audio publication, and alignment JSON serialization.

No automatic fallback, upload, database call, raw error propagation, lesson-text
logging, or general plugin system was introduced.

## 6. Proof voices

Official Azure documentation currently lists the following standard neural voices:

| Locale  | Candidates                                 | Selected proof default |
| ------- | ------------------------------------------ | ---------------------- |
| `en-ZA` | `en-ZA-LeahNeural`, `en-ZA-LukeNeural`     | `en-ZA-LeahNeural`     |
| `zu-ZA` | `zu-ZA-ThandoNeural`, `zu-ZA-ThembaNeural` | `zu-ZA-ThandoNeural`   |

The first documented candidate is the deterministic default, not a gender or product
preference. Both defaults can be changed explicitly through environment or `--voice`.
Only listed candidates are accepted during this proof phase. Official listing is not
proof of locale quality or successful synthesis. See [Azure language support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support).

## 7. English proof

**Status:** `BLOCKED — MISSING CREDENTIALS`.

The approved pangolin passage and pipeline are ready for proof ID
`proof-azure-english`, version `1`, voice `en-ZA-LeahNeural`. The command was not run
because credential preflight failed. Therefore there is no Azure English file,
metadata, hash, duration, alignment, overwrite result, or live listening evidence.
The existing gTTS English proof remains the only live synthesis artifact.

## 8. isiZulu proof

**Status:** `BLOCKED — MISSING CREDENTIALS AND APPROVED TEXT`.

The `zu-ZA`/`zu-ZA-ThandoNeural` pipeline is ready, but no human-reviewed isiZulu
passage was supplied. The English proof was not machine-translated. There is no
isiZulu Azure file, metadata, alignment, or listening evidence.

## 9. Sepedi status

**Status:** `UNSUPPORTED AND UNRESOLVED`; no request was made.

Conceptual decision paths requiring Product Owner, educational, accessibility,
language, privacy, and cost review are:

| Option                           | Educational/accessibility risk                      | Cost/operations                                    | Product implication                                      |
| -------------------------------- | --------------------------------------------------- | -------------------------------------------------- | -------------------------------------------------------- |
| Specialist commercial provider   | Quality and locale still require human evidence     | Contract, credentials, metering, integration       | Could preserve synthesized tutorial parity               |
| Human narration                  | Reviewer/reader consistency and re-recording burden | Recording, consent, editing, alignment, versioning | Strong language authenticity candidate                   |
| Commissioned voice dataset/model | Dataset bias, consent, pronunciation governance     | Highest setup, compute, licensing, maintenance     | Strategic control but not near-term                      |
| Delay Sepedi tutorial audio      | Removes guided example for one launch language      | Lower immediate implementation cost                | Accessibility and feature-parity concern                 |
| Practice-only Sepedi launch      | Core tutorial requirement would differ              | Operationally simpler                              | Requires explicit MVP/product change                     |
| Revise launch-language scope     | Excludes an approved South African language         | Reduces content/audio burden                       | Requires formal product governance; not technical choice |

No option is selected automatically.

## 10. Output metadata

No Azure proof files exist. The implemented metadata/result path records provider,
provider locale, selected voice, file size, MIME/container, SHA-256, generation time,
and proof identity when a future authorized proof succeeds. Existing dependency-free
duration behavior remains conservative.

## 11. Word-boundary evidence

The adapter connects to Azure `synthesis_word_boundary`, normalizing each event as:

- text offset and word length in SDK-reported text units;
- audio offset and duration in 100-nanosecond ticks;
- proof word text;
- provider event type.

Offsets must be monotonic. The generator writes deterministic, provider-specific
`*.alignment.json` with an explicit schema and time-unit label. This was proven only
with mocked SDK events. There is no live alignment file and no claim that Azure
events equal canonical Reading Positions. Azure documents `WordBoundary` as reporting
audio offset and input text position; see [speech synthesis events](https://learn.microsoft.com/en-sg/azure/ai-services/speech-service/how-to-speech-synthesis).

## 12. Listening-review status

No reviewer outcomes are invented.

### gTTS English proof

**Status:** `pending review`.

### Azure English proof

**Status:** `blocked — no audio`.

### Azure isiZulu proof

**Status:** `blocked — no approved text or audio`.

For each available proof, review intelligibility, pronunciation, naturalness,
sentence rhythm, punctuation, educational suitability, locale suitability,
consistency, mispronunciations, and learner comfort. Permitted outcomes are
`pending review`, `accepted for prototype`, `accepted with concerns`, or `rejected`.

## 13. gTTS comparison

| Evidence                   | gTTS English | Azure English                   | Azure isiZulu                   |
| -------------------------- | ------------ | ------------------------------- | ------------------------------- |
| Official configured locale | Generic `en` | `en-ZA` listed                  | `zu-ZA` listed                  |
| Live synthesis             | Successful   | Blocked                         | Blocked                         |
| Exact selected voice       | None         | Leah candidate                  | Thando candidate                |
| Word boundaries            | None         | SDK supports; not live-verified | SDK supports; not live-verified |
| Human listening            | Pending      | No audio                        | No audio                        |
| Production approval        | No           | No                              | No                              |

## 14. Updated provider matrix

Sprint 3.5's weighted provider matrix remains unchanged because this sprint produced
engineering readiness, not live Azure quality evidence. Azure remains the leading
trial candidate based on official English/isiZulu locale coverage and word-boundary
support. It does not cover Sepedi and has not passed human review.

## 15. Security and privacy review

- No credentials were present, printed, committed, or placed in fixtures.
- No Azure network request or paid operation occurred.
- No proof text, raw provider response, analytics, telemetry, or personal data is logged.
- Proof and alignment outputs remain local and ignored.
- Future Azure use transmits approved lesson text to a third party.
- Secret storage, managed identity, key rotation, region/data processing, retention,
  legal terms, and incident controls remain pending.

## 16. Cost and operability review

Azure is a metered cloud dependency with region, quota, identity, SDK-native-binary,
monitoring, failure, and budget implications. Exact rates and South African resource
availability must be verified at account provisioning. Generated-and-packaged audio
avoids learner-time cloud calls, but content revisions incur repeat synthesis and
alignment review. The pinned SDK improves direct reproducibility while its transitive
packages and native wheels still require supply-chain policy.

## 17. Findings and severities

| ID        | Severity | Finding                                             | Status   |
| --------- | -------- | --------------------------------------------------- | -------- |
| AZTTS-001 | Blocker  | Azure credentials unavailable                       | Open     |
| AZTTS-002 | Blocker  | Approved isiZulu proof text unavailable             | Open     |
| AZTTS-003 | Blocker  | Sepedi narration path unresolved                    | Open     |
| AZTTS-004 | Blocker  | No live Azure word-boundary evidence                | Open     |
| AZTTS-005 | Major    | No Azure voice has human quality approval           | Open     |
| AZTTS-006 | Major    | Privacy/legal/region/budget controls unapproved     | Open     |
| AZTTS-007 | Major    | Azure adapter and safe credential preflight missing | Resolved |
| AZTTS-008 | Major    | Voice/capability/alignment model incomplete         | Resolved |

## 18. Resolved findings

The official SDK is pinned, credentials are environment-only and redacted, candidate
voices are explicit, unsupported voices/languages make zero SDK calls, provider
errors are normalized, capability reporting is offline, and mocked word boundaries
produce deterministic validated alignment JSON.

## 19. Unresolved findings

Live English and isiZulu synthesis, file metadata, live word boundaries, listening,
region validation, privacy/legal approval, cost controls, Sepedi, canonical alignment,
production publication, and Flutter/backend integration remain unresolved.

## 20. Human decisions required

1. Provision a bounded Azure Speech evaluation resource and secure credentials.
2. Supply/approve a short human-reviewed isiZulu proof passage.
3. Approve reviewers and voice-quality criteria.
4. Select a Sepedi evaluation track.
5. Approve privacy, legal, data-region, secret-management, and budget controls.

## 21. Recommendation

Keep ADR-018 `Proposed`. Once the five decisions above are satisfied, run exactly one
English and one isiZulu Azure proof, inspect metadata and word boundaries, and conduct
blind human comparison against the gTTS proof. Do not start Flutter integration or
production generation.

## 22. Next sprint

Complete the blocked live proof gate using supplied credentials and approved isiZulu
text, then perform human listening and a disposable mapping of Azure boundaries to
canonical Reading Positions. A separate governed Sepedi decision must proceed in
parallel.

## UI integration boundary update

Sprint 3.7 implemented a visual Reading Player shell without importing this service,
playing either provider's output, or consuming Azure word-boundary proof data. Manual
highlighting is temporary presentation behavior, not provider timing or canonical
Reading Position alignment. All Sprint 3.6 findings and production gates remain
unchanged. See the
[Reading Player Shell Review](./FLUTTER-READING-PLAYER-SHELL-REVIEW.md).
