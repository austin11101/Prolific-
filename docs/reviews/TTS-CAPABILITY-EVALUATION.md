# TTS Capability Evaluation

## 1. Outcome

**Result:** `PASS WITH BLOCKERS` for the Sprint 3.5 evaluation scope.

Sprint 3.6 subsequently implemented the Azure adapter and offline capability model,
but live Azure proofs remained blocked by missing credentials and, for isiZulu,
missing approved text. See the
[Azure TTS Proof and Multilingual Evaluation](./AZURE-TTS-PROOF-AND-MULTILINGUAL-EVALUATION.md).

The controlled English gTTS proof, metadata inspection, provider-neutral boundary,
capability CLI, provider research, and automated tests are complete. No provider is
approved for production. English and isiZulu have cloud candidates; no evaluated
provider has verified coverage for all three launch languages. Sepedi, human voice
quality, and canonical word alignment remain blocking decisions.

## 2. English live-proof result

One authorized request used the original, non-sensitive text:

> Pangolins are shy mammals covered in protective scales. They curl into a ball when
> they feel threatened.

| Field                    | Evidence                 |
| ------------------------ | ------------------------ |
| Requested language       | `en-ZA`                  |
| gTTS language            | `en`                     |
| Proof lesson ID          | `proof-english-pangolin` |
| Proof revision           | `1`                      |
| Result                   | Successful               |
| Live generation attempts | One                      |

This is prototype evidence only, not production content or quality approval.

## 3. Proof file metadata

| Field                    | Value                                                                       |
| ------------------------ | --------------------------------------------------------------------------- |
| Local path               | `services/tutorial-audio/proof-output/lesson_proof-english-pangolin_v1.mp3` |
| File size                | `63,552` bytes                                                              |
| SHA-256                  | `4b7591014a19c3b3fc1fcd50ddc098436281332a36290359db7def7e2547a4d9`          |
| Container/MIME           | Valid MP3 header; `audio/mpeg`                                              |
| Generation timestamp     | `2026-08-05T13:16:04.442852+00:00`                                          |
| Windows media length     | `00:00:07`                                                                  |
| Windows-reported bitrate | `64 kbps`                                                                   |
| Programmatic duration    | `null`                                                                      |

The dependency-free inspector validates the header, hashes the bytes, and records
file metadata. Windows reports a coarse seven-second length, but the application
duration field remains unset because no precise, cross-platform MP3 duration parser
was approved. No duration was invented.

## 4. Overwrite verification

A second CLI invocation with the same proof identity exited `1` with
`AudioFileExistsError` before provider invocation. The MP3 count remained one and the
recorded hash remained authoritative. Explicit `--overwrite` was not used.

## 5. Human listening review

**Status: pending human listening.** No reviewer or result is inferred.

- [ ] Intelligibility
- [ ] Pronunciation
- [ ] Pace
- [ ] Sentence boundaries
- [ ] Punctuation handling
- [ ] Volume consistency
- [ ] Educational suitability
- [ ] Robotic quality
- [ ] South African English suitability
- [ ] Obvious mispronunciations

The permitted outcomes are `accepted for prototype`, `rejected`, or
`requires provider comparison`. Production approval is not an outcome of this proof.

## 6. gTTS capability findings

| Launch language   | Mapping | Status                     | Finding                                                  |
| ----------------- | ------- | -------------------------- | -------------------------------------------------------- |
| English (`en-ZA`) | `en`    | Supported for prototype    | Live MP3 proof succeeded; not an `en-ZA` voice guarantee |
| isiZulu (`zu-ZA`) | `zu`    | Configured but unavailable | gTTS 2.5.4 catalogue omits `zu`                          |
| Sepedi (`nso-ZA`) | None    | Requires verification      | gTTS 2.5.4 catalogue omits `nso`; no mapping approved    |

Unsupported-language substitution and `lang_check=False` bypasses remain prohibited.

## 7. Provider research method

Research used current official voice catalogues, SDK/API documentation, timing
documentation, pricing pages, and official source repositories as primary evidence.
An absent exact locale is recorded as unverified or unsupported for this evaluation,
not inferred from a related language name. No cloud account, SDK, credentials, or
paid API call was used.

Primary evidence:

- [Google Cloud supported voices and API](https://cloud.google.com/text-to-speech/docs/voices)
- [Google Cloud SSML timepoints](https://cloud.google.com/text-to-speech/docs/ssml)
- [Google Cloud pricing](https://cloud.google.com/text-to-speech/pricing)
- [Azure Speech language and voice support](https://learn.microsoft.com/en-us/azure/ai-services/speech-service/language-support)
- [Azure word-boundary events](https://learn.microsoft.com/en-sg/azure/ai-services/speech-service/how-to-speech-synthesis)
- [Amazon Polly languages](https://docs.aws.amazon.com/polly/latest/dg/supported-languages.html)
- [Amazon Polly available voices](https://docs.aws.amazon.com/polly/latest/dg/available-voices.html)
- [Amazon Polly speech marks](https://docs.aws.amazon.com/polly/latest/dg/speechmarks.html)
- [Amazon Polly pricing](https://aws.amazon.com/polly/pricing/)
- [Piper voice catalogue](https://github.com/OHF-Voice/piper1-gpl/blob/main/docs/VOICES.md)

## 8. Language-by-provider table

| Provider         | English                                                                   | isiZulu                                    | Sepedi/Northern Sotho            | Exact voice evidence                                       |
| ---------------- | ------------------------------------------------------------------------- | ------------------------------------------ | -------------------------------- | ---------------------------------------------------------- |
| gTTS 2.5.4       | Generic `en`; live proof                                                  | No catalogue entry                         | No catalogue entry               | No selectable South African voice identity                 |
| Google Cloud TTS | Broad English support; exact `en-ZA` not verified in accessible catalogue | No verified `zu-ZA` voice found            | No verified `nso-ZA` voice found | Must re-check authenticated `voices:list` before trial     |
| Azure AI Speech  | `en-ZA-LeahNeural`, `en-ZA-LukeNeural`                                    | `zu-ZA-ThandoNeural`, `zu-ZA-ThembaNeural` | No `nso-ZA` entry found          | Four exact neural voices documented                        |
| Amazon Polly     | `en-ZA` `Ayanda`, neural/generative                                       | Not in published language list             | Not in published language list   | One exact South African English voice                      |
| Piper            | `en_GB`, `en_US`; no `en_ZA`                                              | No official voice                          | No official voice                | Offline model catalogue; per-model licence review required |

Verified facts do not show one provider covering all three launch languages.

## 9. Word-boundary capability table

| Provider        | Timing evidence                                                  | Alignment implication                                      |
| --------------- | ---------------------------------------------------------------- | ---------------------------------------------------------- |
| gTTS            | None                                                             | Cannot drive tutorial highlighting                         |
| Google Cloud    | Timepoints for explicit SSML `<mark>` elements                   | Candidate marker experiment; not automatic word boundaries |
| Azure AI Speech | SDK `WordBoundary` events include audio offset and text position | Strong candidate for Reading Position mapping tests        |
| Amazon Polly    | Separate word/sentence speech-mark JSON with millisecond offsets | Strong candidate, but only for supported voices            |
| Piper           | No provider-level word-boundary contract verified                | Requires independent alignment tooling                     |

Provider timing must be validated against exact text normalization and immutable
Reading Positions; it is not accepted merely because an API emits offsets.

## 10. Provider decision matrix

Scores are evaluation judgments from `1` (weak) to `5` (strong), not measured voice
quality. Weights were assigned before scoring and total 100.

| Criterion                       |  Weight |     gTTS | Google Cloud | Azure Speech | Amazon Polly |    Piper |
| ------------------------------- | ------: | -------: | -----------: | -----------: | -----------: | -------: |
| Launch-language coverage        |      25 |        2 |            2 |            4 |            2 |        1 |
| Pronunciation-quality potential |      15 |        2 |            4 |            4 |            4 |        2 |
| Word-boundary/timing            |      15 |        1 |            3 |            5 |            5 |        1 |
| Production reliability          |      10 |        2 |            5 |            5 |            5 |        3 |
| Cost                            |       8 |        5 |            3 |            3 |            3 |        5 |
| Python integration              |       7 |        5 |            5 |            5 |            5 |        4 |
| Offline-package compatibility   |       5 |        5 |            5 |            5 |            5 |        5 |
| Operational simplicity          |       5 |        4 |            3 |            3 |            3 |        2 |
| Low vendor lock-in              |       5 |        4 |            3 |            2 |            2 |        4 |
| Privacy control                 |       5 |        2 |            3 |            3 |            3 |        5 |
| **Weighted result / 100**       | **100** | **53.0** |     **66.8** |     **81.8** |     **71.8** | **49.6** |

Azure's score makes it the next trial candidate, not an approved provider. It covers
two launch locales and has timing evidence, but does not solve Sepedi and has not
passed human, privacy, legal, regional, or cost review.

## 11. Architecture recommendation

Retain the provider-neutral boundary. Run a future controlled Azure trial for
South African English and isiZulu after account/cost approval. In parallel, evaluate
human-recorded Sepedi and specialist/custom-voice options with qualified language
reviewers. Multiple narration sources are likely unless new verified provider
evidence emerges. Do not reduce launch-language scope without product governance.

## 12. Provider-neutral abstraction

`TutorialSpeechProvider` exposes provider name, language capability, generation, and
capability summary. `GttsSpeechProvider` contains all current gTTS mapping and client
logic. `TutorialAudioGenerator` owns filenames, temporary output, and overwrite
policy while depending only on that contract. No plugin framework or cloud adapter
placeholder was added.

## 13. Capability model

`SpeechCapability` preserves requested language, mapped provider language, provider,
status, reason code, and safe explanation. Supported statuses are:

- `supported`;
- `unsupported`;
- `requires_verification`;
- `configured_but_unavailable`; and
- `provider_error`.

Provider failures discard raw response details and lesson text before crossing the
adapter boundary.

## 14. CLI changes

`python -m app.cli.capabilities` prints deterministic tabular output without a
network call. `--json` prints deterministic JSON. The current gTTS command exits `2`
because required launch-language coverage is incomplete. The existing generation CLI
remains compatible.

## 15. Test results

Thirty-two automated tests pass without network access. Coverage includes provider
abstraction, adapter invocation, all capability states, zero-call rejection, safe
errors, deterministic CLI JSON, proof filename policy, MP3 hashing/header validation,
overwrite behavior, configuration, and existing generator/CLI regressions.

## 16. Security and privacy review

- No credentials, analytics, telemetry, personal data, or production lesson ID were used.
- Lesson text is not logged or included in normalized provider exceptions.
- Provider response bodies are not exposed.
- The proof MP3 remains ignored and local.
- Cloud synthesis sends approved lesson text to a third party and requires privacy,
  legal, safeguarding, retention, regional, and secret-management approval.
- Production identity should use least privilege and managed identity/service roles;
  secrets must never enter source control or Flutter.

## 17. Cost and operability review

Google Cloud, Azure, and Amazon Polly use metered cloud pricing, generally based on
processed characters and voice tier; rates, free allocations, regions, quotas, and
egress must be revalidated during procurement. Amazon publishes distinct standard,
neural, long-form, and generative rates. gTTS has no production SLA or formal billing
contract. Piper avoids per-request cloud charges but transfers compute, model,
licensing, monitoring, and voice-training responsibility to Prolific.

Generated assets suit offline packaging once publication, checksum, storage, and
alignment gates are implemented; learners should not invoke paid providers directly.

## 18. Findings and severities

| ID      | Severity | Finding                                                                    | Status   |
| ------- | -------- | -------------------------------------------------------------------------- | -------- |
| TTS-001 | Blocker  | No verified provider covers all three launch languages                     | Open     |
| TTS-002 | Blocker  | Sepedi narration source is unresolved                                      | Open     |
| TTS-003 | Blocker  | Canonical word alignment is unresolved                                     | Open     |
| TTS-004 | Major    | No candidate voice has human educational-quality approval                  | Open     |
| TTS-005 | Major    | Cloud privacy, legal, identity, region, and budget controls are unapproved | Open     |
| TTS-006 | Minor    | Cross-platform precise MP3 duration remains unavailable                    | Open     |
| TTS-007 | Major    | gTTS-specific logic previously sat in the generator                        | Resolved |
| TTS-008 | Major    | Boolean-like language handling could not represent provider state          | Resolved |

## 19. Resolved findings

Provider logic is isolated, capability states are explicit, unsupported languages
make zero provider calls, proof names are visibly non-production, metadata is hashed,
provider errors are safe, and CLI capability reporting is deterministic.

## 20. Unresolved findings

Multilingual voice quality, Sepedi sourcing, word alignment, precise duration,
cloud governance, budget, retry/reproducibility, object storage, publication, and
Flutter delivery remain unresolved.

## 21. Decision required

Human approval is required to authorize:

1. an Azure account and bounded English/isiZulu voice trial;
2. qualified listening reviewers and acceptance criteria;
3. the Sepedi human-recorded/provider/custom-voice evaluation path;
4. a timing/alignment proof; and
5. privacy, legal, security, region, and budget controls.

ADR-018 remains `Proposed — pending multilingual voice evaluation and human approval`.

## 22. Next recommended sprint

Run a governance-approved multilingual voice evaluation: Azure South African English
and isiZulu samples plus a separately sourced Sepedi plan, human listening rubrics,
and a disposable word-boundary-to-Reading-Position experiment. Do not integrate
Flutter or backend delivery until those results are approved.
