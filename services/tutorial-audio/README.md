# Prolific Tutorial Audio Service

Standalone Python 3.12 foundation for generating deterministic tutorial MP3 files
from approved lesson text. It is a development/content-pipeline tool, not a web
service, API, publication workflow, or Flutter integration.

## Responsibilities

- Validate a bounded tutorial-audio request.
- Resolve approved BCP 47 lesson languages through a provider-neutral capability model.
- Generate one deterministic MP3 filename per lesson version.
- Protect existing output unless overwrite is explicitly enabled.
- Return file metadata without storing records or publishing content.

The service does not approve lessons, write to PostgreSQL, create lesson packages,
upload assets, or modify the Flutter application. Azure word-boundary output is
provider-specific proof evidence and is not canonical reading-player alignment.

## Setup

Use Python 3.12. A workspace-local virtual environment keeps the service isolated:

```powershell
cd services/tutorial-audio
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

## CLI

```powershell
python -m app.cli.generate `
  --lesson-id 4bf2f788-62d7-4a7f-bf24-bdc1079d7d13 `
  --version 1 `
  --language en-ZA `
  --title "Example lesson" `
  --text "Approved lesson text"
```

The command prints a JSON result. Add `--overwrite` only when replacing the exact
lesson-version asset is deliberate. Generated files are ignored under `output/`.

Inspect current launch-language capability without a network call:

```powershell
python -m app.cli.capabilities
python -m app.cli.capabilities --json
python -m app.cli.capabilities --provider azure
python -m app.cli.capabilities --provider azure --json
```

The command exits `2` while any required launch language is unsupported. Proof files
must use an ID beginning with `proof-` and remain under ignored `proof-output/`.

## Configuration

| Environment variable              | Default                          | Meaning                                   |
| --------------------------------- | -------------------------------- | ----------------------------------------- |
| `TUTORIAL_AUDIO_OUTPUT_DIR`       | `services/tutorial-audio/output` | MP3 destination                           |
| `TUTORIAL_AUDIO_SLOW`             | `false`                          | gTTS slow-speaking mode                   |
| `TUTORIAL_AUDIO_OVERWRITE`        | `false`                          | Allow replacement of an existing asset    |
| `TUTORIAL_AUDIO_DEFAULT_LANGUAGE` | `en-ZA`                          | CLI language when the argument is omitted |

Boolean values accept `true`, `false`, `1`, `0`, `yes`, and `no`.

Azure proof configuration is environment-only:

| Environment variable       | Default              | Meaning                           |
| -------------------------- | -------------------- | --------------------------------- |
| `AZURE_SPEECH_KEY`         | None                 | Azure Speech subscription key     |
| `AZURE_SPEECH_REGION`      | None                 | Azure Speech resource region      |
| `AZURE_SPEECH_ENDPOINT`    | None                 | Optional explicit Speech endpoint |
| `AZURE_SPEECH_VOICE_EN_ZA` | `en-ZA-LeahNeural`   | South African English proof voice |
| `AZURE_SPEECH_VOICE_ZU_ZA` | `zu-ZA-ThandoNeural` | isiZulu proof voice               |

Never place credentials in commands, fixtures, source, or committed files. Copy the
empty `.env.example` values into a locally ignored environment only when a bounded
proof has been authorized. The CLI does not automatically load `.env` files.

An authorized Azure proof command must select the provider and proof-only policy:

```powershell
python -m app.cli.generate `
  --provider azure `
  --proof-only `
  --lesson-id proof-azure-english `
  --version 1 `
  --language en-ZA `
  --voice en-ZA-LeahNeural `
  --title "English proof" `
  --text "Approved proof text"
```

Missing credentials and unsupported languages or voices fail before synthesis.
Successful Azure proofs may create a deterministic `.alignment.json` beside the MP3.
Both proof artifacts remain ignored under `proof-output/`.

## Language support

| Prolific tag | gTTS code | Status                                                     |
| ------------ | --------- | ---------------------------------------------------------- |
| `en-ZA`      | `en`      | Enabled                                                    |
| `zu-ZA`      | `zu`      | Candidate mapping; disabled in gTTS 2.5.4                  |
| `nso-ZA`     | None      | Placeholder; gTTS support and pronunciation are unverified |

`zu-ZA` and `nso-ZA` are intentionally rejected until validation approves a
working provider mapping. No language value is silently substituted. The installed
gTTS 2.5.4 language catalogue contains neither `zu` nor `nso`; setting gTTS
`lang_check=False` to bypass that catalogue is not an approved workaround.

`TutorialAudioGenerator` depends on the narrow `TutorialSpeechProvider` contract.
`GttsSpeechProvider` owns gTTS-specific mappings and calls. Capability results retain
the requested language, provider mapping, provider name, status, reason code, and a
safe explanation. Raw provider responses are not propagated.

## Privacy and production limitations

gTTS is an external network-backed provider: lesson text is transmitted to Google
Translate text-to-speech infrastructure. Do not send confidential, personal, draft,
or otherwise unapproved text. This foundation has no production provider approval,
voice guarantee, service-level guarantee, retry policy, object storage, alignment,
or word-level timestamp support. gTTS output alone cannot drive synchronized word
highlighting.

The Sprint 3.5 gTTS English proof is retained locally for pending human listening and
is ignored by Git. Sprint 3.6 added the Azure adapter, but its live proofs were
blocked by missing credentials and, for isiZulu, missing approved text. Evidence is
recorded in `docs/reviews/AZURE-TTS-PROOF-AND-MULTILINGUAL-EVALUATION.md`. No
production provider is approved.

## Validation

```powershell
python -m black --check app tests
python -m pytest
python -m pip check
```

Tests mock both provider boundaries and make no network requests.
