# Local Tutorial Audio Playback Foundation

## Document control

| Item | Value |
| --- | --- |
| Sprint | 3.8 - Local Tutorial Audio Playback Foundation |
| Status | Complete - local demonstration only |
| Review date | 2026-08-07 |
| Platforms | Android and Web from one Flutter codebase |

## 1. Outcome

Sprint 3.8 adds local tutorial MP3 playback to the Flutter Reading Player. The app plays one bundled demonstration asset through a narrow audio service, while word highlighting remains manual and independent from audio.

## 2. Scope

Only Flutter local asset playback was implemented. There is no Python execution, gTTS generation, Azure playback, NestJS/API call, PostgreSQL access, Docker use, lesson download, offline package parsing, synchronization, Reading Session persistence, analytics, authentication, WPM timing, or production alignment.

## 3. Audio service boundary

`TutorialAudioService` exposes only:

- `load`
- `play`
- `pause`
- `resume`
- `stop`
- `seekToStart`
- `dispose`

Widgets depend on this interface only. The concrete `JustAudioTutorialAudioService` hides `just_audio` in `core/audio` and uses only local asset playback.

## 4. Dependency decision

`just_audio` 0.10.6 was added because it supports Flutter local asset playback on Android and Web. The implementation does not expose the package's streaming, playlist, caching, URL, background playback, notification, Bluetooth, headset-control, or download capabilities.

## 5. Demonstration asset

`assets/audio/tutorial_sample.mp3` was copied from the prior English proof at `services/tutorial-audio/proof-output/lesson_proof-english-pangolin_v1.mp3`.

| Property | Value |
| --- | --- |
| Size | 63,552 bytes |
| SHA-256 | `4b7591014a19c3b3fc1fcd50ddc098436281332a36290359db7def7e2547a4d9` |
| Source | Previously generated English proof |
| Flutter asset path | `assets/audio/tutorial_sample.mp3` |

Flutter does not generate or modify audio.

## 6. Reading Player behavior

The tutorial phase now loads, plays, pauses, resumes, restarts, stops, and disposes local audio. The UI states plainly: "Audio is playing independently." Practice mode stops tutorial audio and remains application-silent.

## 7. Highlighting boundary

Highlighted words do not synchronize with audio. Manual Next, Previous, and Restart controls remain the only highlighting mechanism. No Timer, Stopwatch, WPM calculation, word-boundary JSON, Reading Position, or alignment profile is consumed.

## 8. State handling

Duplicate play requests are ignored while audio is already playing. Repeated pause and stop calls are safe. Playing after disposal fails through the safe audio exception. Load or playback failure returns the UI to the ready state and allows retry.

## 9. Lifecycle

Leaving the Reading Player stops and disposes the service. Change Setup, Return Home, and widget disposal all stop local playback. Route names and route shape remain unchanged.

## 10. Tests

Widget tests inject a fake `TutorialAudioService`; they do not require real audio playback. Coverage verifies load, play, pause, resume, stop, dispose, restart, screen lifecycle, load failure recovery, silent practice, route preservation, responsive layouts, and architecture boundaries.

## 11. Architecture audit

Only `core/audio/tutorial_audio_service.dart` imports `just_audio`. Reading Player widgets do not import the plugin. No runtime source imports Python, tutorial-audio service code, Azure provider code, gTTS provider code, NestJS, Prisma, database, analytics, authentication, or network clients.

## 12. Validation evidence

Final validation is recorded in the task completion report and includes:

- `flutter analyze`
- `flutter test`
- `flutter build apk --debug`
- `flutter build web`
- architecture audit
- dependency audit
- `git diff --check`

## 13. Known limitations

The demo audio is not revision-bound, language-reviewed for production, package-owned, checksummed as an offline package member, or aligned to Reading Positions. Browser autoplay policies may still require learner interaction before playback. The UI does not track duration, progress, or completion from audio.

## 14. Future work

Before production playback, approve provider choice, audio asset identity, package storage, checksums, alignment format, timing tolerance, interruption behavior, local persistence, Reading Session rules, and offline synchronization.
