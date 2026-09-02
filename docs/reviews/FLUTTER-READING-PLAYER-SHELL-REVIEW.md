# Flutter Reading Player Shell Review

## Document control

| Item        | Value                                     |
| ----------- | ----------------------------------------- |
| Sprint      | 3.7 - Responsive Reading Player UI Shell  |
| Status      | Complete - presentation only              |
| Review date | 2026-08-05                                |
| Platforms   | Android and Web from one Flutter codebase |

## 1. Outcome

The existing `/player` placeholder is replaced by a polished responsive Reading Player shell. It displays one original local lesson preview, setup metadata, manual punctuation-preserving word highlighting, visual tutorial and application-silent practice phases, and preview-only completion. At Sprint 3.7 closure it did not play audio. Sprint 3.8 later added local bundled MP3 tutorial playback; the Sprint 3.7 scope and findings remain historical.

## 2. Authorization boundary

Only Flutter presentation code, widget tests, and documentation changed. No audio dependency, provider integration, Timer/Stopwatch, production tokenization, package parsing, persistence, network, backend, database, analytics, authentication, or deployment was introduced.

## 3. Replaced placeholder

The `/player` value is preserved and renamed in code from `playerPlaceholder` to `readingPlayer`. The deleted lesson-setup placeholder is replaced by `features/reading_player/presentation`. Lesson Preview supplies one typed immutable local argument. Direct or invalid route access recovers safely.

## 4. Folder changes

The feature contains a presentation model, screen, and small player-owned widgets. Shared design tokens, scaffold, cards, buttons, and breakpoints remain reused; no general player framework or empty architecture layers were created.

## 5. Player presentation model

`ReadingPlayerPresentationPhase` contains only `ready`, `tutorialPreview`, `tutorialPaused`, `practiceReady`, `practicePreview`, and `previewComplete`. State is screen-local and deterministic. It is explicitly not the future Reading Session domain state.

## 6. Local lesson model

`ReadingLessonPreview` contains title, Topic, Language, Difficulty, pace label, paragraph, display segments, and eligible words. `ReadingPlayerArguments` carries the lesson plus a safely clamped initial index. The landscape paragraph is original local UI copy and makes no API, publication, or package claim.

## 7. Temporary tokenization

The local function separates whitespace, eligible words, and punctuation while preserving exact display order. It exists only to demonstrate selection. It is not a Language-specific Tokenization Profile, canonical Reading Position, word-boundary alignment, or production word count.

## 8. Mobile layout

Compact and medium widths stack concise metadata, explanation, constrained reading surface, position, wrapping controls, phase actions, and exit actions inside `SafeArea` and a scroll view. Controls remain reachable instead of relying on a fixed bottom region.

## 9. Web layout

Expanded widths retain the learner Navigation Rail, place metadata before the reading content in focus/source order, constrain the paragraph to 720 logical pixels, and keep Material keyboard, hover, focus, and pointer behavior.

## 10. Metadata presentation

The shell shows the lesson title, Topic, Language, Difficulty, selected pace, current phase, and `Word n of total`. Missing required metadata makes the local lesson unusable and triggers recovery.

## 11. Tutorial state

Tutorial wording says that future audio will read once and follow approved alignment. The current experience is labelled visual-only and explicitly says no narration is playing. Start, pause, and resume change only local presentation state; pausing disables manual movement.

## 12. Practice state

Practice explicitly states that the application produces no audio and the learner may read independently. No microphone, speech recognition, fake listening state, automatic movement, or saved-progress claim exists.

## 13. Manual highlighting

Next and Previous move exactly one eligible local word. Restart returns to the first word. Indexes are clamped into bounds. The selected word uses weight, underline, and background, so selection is not colour-only. Punctuation remains in its authored position.

## 14. Controls

Material buttons supply pointer, Enter/Space, focus, and disabled semantics. Previous/Next boundaries are disabled, controls wrap at narrow widths, and no automatic advancement occurs. Pace remains informational.

## 15. Completion state

Only manual practice preview reaching the last word enters `previewComplete`. The message explicitly says saving will be added later. Restart, Change Setup, and Return Home are available. No score, streak, analytics, saved completion, or real-session claim is produced.

## 16. Accessibility

The paragraph uses a 1.65 line height and constrained measure. Metadata precedes content and controls. Phase and reading position have semantic labels. The reading surface exposes one calm summary rather than a live region on every manual change. System text scaling and browser zoom remain enabled; 200% widget coverage passes.

## 17. Responsive behaviour

Focused tests cover 390x844 compact, 1440x900 expanded, and 430x932 at 200% text. No overflow occurred, expanded navigation remained present, and reading width stayed at the shared 720-pixel maximum.

## 18. Error and recovery behaviour

Missing arguments, empty text/tokens, or missing metadata show a friendly unavailable message with Change Setup and Return Home. Initial indexes below or above bounds recover to the first or final eligible word. Raw exceptions are never shown.

## 19. Widget-test results

Focused coverage validates metadata, exact punctuation reconstruction, initial selection, movement, restart, boundaries, index recovery, tutorial pause/resume, silent practice, preview completion, recovery, responsive layouts, existing-route replacement, completion navigation, and prohibited imports. The focused file contains 11 tests and passed within the final suite.

## 20. Regression-test results

All 30 Flutter tests passed after the final navigation additions. `flutter analyze` reported no issues. The Web build completed at `apps/mobile/build/web`, and the Android debug APK completed at `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`. The build emitted a non-blocking Cupertino icon-font warning and a successful WebAssembly dry-run advisory.

## 21. Architecture audit

The feature imports Flutter plus existing app/core presentation components only. Source tests prohibit timers, audio/TTS providers, API clients, databases, persistence, analytics, authentication, and backend imports. `pubspec.yaml` receives no new dependency.

## 22. Findings and severities

| ID      | Severity | Finding                                                              | Status                               |
| ------- | -------- | -------------------------------------------------------------------- | ------------------------------------ |
| RPS-001 | Major    | Player route ended at a placeholder                                  | Resolved                             |
| RPS-002 | Major    | Real timing and alignment are unavailable                            | Open; intentionally blocked          |
| RPS-003 | Major    | Tutorial audio has no approved production integration                | Open; intentionally blocked          |
| RPS-004 | Major    | Reading Session persistence is unavailable                           | Open; intentionally blocked          |
| RPS-005 | Minor    | Current setup selections are local preview values, not durable state | Open; later application-state design |

## 23. Resolved findings

The placeholder, responsive reading composition, accessible manual selection, phase clarity, preview completion honesty, missing-route recovery, and focused architecture coverage are resolved within the authorized presentation scope.

## 24. Unresolved findings

Production package loading, Tokenization Profiles, Reading Positions, alignment, WPM timing, audio playback, interruptions, font adjustment, persistence, completion, guest/account behavior, API data, and offline restoration remain unresolved.

## 25. TTS integration boundary

At Sprint 3.7 closure, neither the retained gTTS proof nor Azure adapter was imported or played. Sprint 3.8 later copied the retained English proof into Flutter assets for local demonstration playback only. ADR-018 remains Proposed, and that later local playback still does not approve production provider integration.

## 26. Timing and alignment boundary

No Timer, Stopwatch, WPM calculation, Azure JSON, gTTS inference, automatic scroll, or canonical alignment exists. Future timing must consume an approved immutable package and testable clock under the later Reading Player design.

## 27. Remaining UI work

Future authorized presentation work includes font-size controls, interruption/restoration states, approved localized copy, detailed focus/screen-reader review on devices, real lesson loading states, and visual integration with an approved application state.

## 28. Blocked integration work

Audio, provider selection, alignment mapping, package storage, session/progress persistence, offline loading, sync, backend/API calls, authentication, analytics, and production completion remain blocked.

## 29. Next recommendation

Keep the shell as a deterministic UI reference. Before real playback, approve the production speech provider, audio/alignment package contract, Tokenization Profiles, timing/drift policy, interruption behavior, and controllable-clock application architecture. Do not infer production timing from this manual preview.
