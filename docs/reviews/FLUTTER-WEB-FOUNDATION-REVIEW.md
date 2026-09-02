# Flutter Web Foundation Review

## Document control

| Item             | Value                                                   |
| ---------------- | ------------------------------------------------------- |
| Sprint           | 3.2W - Flutter Web Foundation and Responsive Learner UI |
| Status           | Complete                                                |
| Review date      | 2026-08-05                                              |
| Scope            | Shared Android/Web Flutter presentation                 |
| Backend baseline | `v0.2.0-backend-foundation`; unchanged                  |

## 1. Outcome

Prolific now builds and launches as one shared Flutter application on Android and Web. The UI supports compact, medium, and expanded widths, desktop primary navigation, responsive Home and Topic layouts, browser-safe presentation routes, keyboard/pointer interaction, and a local lesson-setup preview. At the time of Sprint 3.2W this ended at a non-functional placeholder; Sprint 3.7 superseded that placeholder with the presentation-only [Reading Player shell](./FLUTTER-READING-PLAYER-SHELL-REVIEW.md).

## 2. Shared-codebase decision

Android and Web use the same `lib` application root, feature screens, theme, design tokens, components, presentation models, and deterministic preview data. There is no separate frontend framework, `dart:html` import, platform-specific feature screen, or scattered platform check.

## 3. Inspected web support

Chrome 150 and Edge 151 were available. `apps/mobile/web` did not exist, so a minimal reviewed web bootstrap was created manually rather than regenerating unrelated Flutter files or adding default branding assets. Sprint 3.1 provided built-in routes, responsive-safe screens, Material 3, and no mobile-only bottom navigation. No Sprint 3.2 lesson-setup review existed.

## 4. Responsive breakpoints

Central breakpoints live in `design_tokens.dart` and classification lives in `responsive_layout.dart`:

- compact: below 600 logical pixels;
- medium: 600 through 1023 logical pixels;
- expanded: 1024 logical pixels and above.

Viewport width selects the shell class. Available content width separately selects one, two, or three Topic columns so navigation width never makes cards unreadably narrow.

## 5. Responsive shell

`ProlificScaffold` constrains main content to 1200 logical pixels and accepts a narrower per-screen maximum. At expanded viewport widths, authorized learner screens receive a persistent Navigation Rail; compact and medium layouts retain the existing app bar and route flow. Safe areas, scrolling, and width constraints remain shared.

## 6. Mobile navigation

Compact and medium views preserve the Sprint 3.1 flow and app-bar navigation. No bottom navigation was added. Topic selection now opens a local Topic Details preview and proceeds through the presentation-only setup sequence.

## 7. Desktop navigation

Expanded screens show Home, Topics, Progress, and Settings destinations. Home and Topics are routed. Progress and Settings are visibly labelled learner destinations but produce a `coming later` message; no account, admin, or unapproved feature page exists. Selecting the active routed destination is a no-op, avoiding duplicate stacking.

## 8. Browser routing

Stable routes cover Welcome, Access Choice, Home, Topics, Topic Details, Language Selection, Difficulty Selection, Pace Selection, Lesson Preview, and `/player`. Built-in Flutter routing remains adequate and dependency-free. Browser-style back is tested. Unknown routes recover to Welcome. Topic Details and the later Reading Player safely handle missing route arguments.

The current built-in web configuration uses Flutter's default hash URL strategy. Hash-route refresh is compatible with a static host, while future clean-path URLs would require host fallback configuration and a separately reviewed routing decision. No claim of clean-path deep-link support is made.

## 9. Home web layout

Expanded Home balances Continue Reading, honest guest-progress, reading-setup, and account-benefit cards in two columns beneath a constrained header/action region. Compact Home remains single-column. It displays no learner name, fabricated progress, percentage, or streak count.

## 10. Topic web layout

Topic Discovery uses one column when compact, two where content width permits, and three only above a readable content threshold. Search and filters remain keyboard-reachable. Cards expose theme-based hover/focus states and a click cursor without hiding information on hover.

## 11. Lesson-setup web layout

The local preview sequence is Topic Details -> Language -> Difficulty -> Pace -> Lesson Preview -> Reading Player. Expanded setup uses a left progress list and a centred selection panel; compact/medium setup uses a linear step indicator above the same content. Selected states are textual/semantic and visual, Continue remains disabled until selection, and all approved values remain unchanged. Reading Player behavior belongs to Sprint 3.7 and does not alter the historical Sprint 3.2W build evidence.

## 12. Reading-width policy

Reading and selection content uses a shared 720-logical-pixel maximum. The app shell uses a separate 1200-pixel maximum. This avoids screen-wide paragraphs while leaving room for desktop grids and navigation.

## 13. Keyboard support

Material buttons, text fields, filters, Navigation Rail destinations, InkWell cards, and selection cards remain in normal focus traversal. A dedicated test proves an explicitly focused setup card activates with Enter. Search accepts keyboard input, and disabled Continue buttons remain disabled until a choice is made.

## 14. Focus support

Theme focus colors remain distinct from hover and pressed colors. The implementation does not suppress focus outlines or reorder focus independently of visual order. Modal placeholder behavior continues to use Flutter's focus-managed material surfaces.

## 15. Hover and pointer support

Clickable `AppCard` instances use `SystemMouseCursors.click`, Material hover color, and a separate focus color. Non-clickable cards keep the deferred cursor. Essential labels and states never depend on hover.

## 16. Web metadata

`web/index.html` defines an `en-ZA` document, accessible Prolific page title, PRD-aligned description, viewport, and theme color. `manifest.json` provides matching name, short name, description, standalone presentation, colors, and orientation. No favicon was invented because there was no approved asset.

## 17. Asset review

The current UI uses bundled Material Icons and Flutter-rendered shapes only. There are no remote images, external fonts, CDNs, Windows paths, case-sensitive asset references, analytics scripts, external scripts, or font licensing additions.

## 18. Widget-test results

The final 19-test suite passes. Web-focused coverage includes compact/expanded shells, Navigation Rail, two/three-column Topic grids, Home columns, pointer cursor, setup steps/selections, keyboard activation, safe missing arguments, browser-style back, route fallback, and representative overflow checks.

## 19. Mobile regression results

All Sprint 3.1 smoke, navigation, access-choice, Home, Topic, semantic, loading/disabled, empty-state, and 200%-text tests remain green after the responsive changes.

## 20. Web build result

`flutter build web` passes and produces `apps/mobile/build/web/`. The compiler's Wasm dry run also succeeds. Flutter reports a non-blocking expected-font warning mentioning Cupertino Icons even though project code and `pubspec.yaml` contain no Cupertino Icon reference or dependency; Material Icons are bundled and the build completes.

## 21. Android build result

`flutter build apk --debug` passes and produces `apps/mobile/build/app/outputs/flutter-apk/app-debug.apk`.

## 22. Local browser-preview result

`flutter run -d chrome --no-resident --web-port 0` launches, connects to the Chrome debug service, and exits successfully without a console-breaking tool error. Navigation, resize classes, route recovery, keyboard activation, and pointer behavior are additionally deterministic widget tests. There are no application assets to fail loading.

## 23. Findings and severities

| Severity    | Finding                                                                                                  | Outcome                                                                                                     |
| ----------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| MAJOR       | Initial expanded three-column cards became too narrow beside long Navigation Rail labels and overflowed. | Resolved with a bounded rail, concise labels, content-width column selection, and taller scale-aware cards. |
| MAJOR       | The original test harness replaced MediaQuery size while setting text scale, hiding responsive behavior. | Resolved by preserving viewport MediaQuery data and changing only `textScaler`.                             |
| MINOR       | Built-in routing cannot promise clean-path refresh without hosting configuration.                        | Accepted and documented; default hash routes remain the dependency-free foundation.                         |
| OBSERVATION | Web build prints a non-blocking Cupertino Icon font expectation despite no Cupertino project reference.  | Build, launch, and asset audit pass; no unnecessary package was added.                                      |

## 24. Resolved findings

All blocker and major findings are resolved. Final analysis, tests, Web build, Android build, and Chrome launch pass.

## 25. Unresolved findings

No blockers or majors remain. Clean-path deep linking, golden baselines, interface localization, and an approved favicon/brand asset remain later decisions. The compiler font warning is retained as an observation.

## 26. Deployment readiness

The generated Web artifact is suitable for local review only. Public deployment, hosting configuration, clean-path fallbacks, cache policy, production security headers, release metadata, and deployment approval were not performed and remain required before publication.

## 27. Remaining blocked integration work

Backend/API integration, authentication, accounts, progress persistence, local database selection, lesson downloads, real lesson content, reading-player logic, audio, synchronization, analytics, AI, database/schema work, and public deployment remain absent and unauthorized by this sprint.

## 28. Recommendation for the next UI sprint

Review the shared shell in Chrome, Edge, and the Android emulator at representative widths and zoom. Then approve interface localization, golden baselines, and the next presentation scope. Do not add clean-path routing, network data, authentication, or persistence without their owning decisions and integration gates.
