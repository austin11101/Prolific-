# Flutter UI Foundation Review

## Document control

| Item             | Value                                                 |
| ---------------- | ----------------------------------------------------- |
| Sprint           | 3.1 - Flutter UI Foundation and Learner Entry Flow    |
| Status           | Complete                                              |
| Review date      | 2026-08-05                                            |
| Scope            | Presentation-only Flutter learner entry flow          |
| Backend baseline | `v0.2.0-backend-foundation`; unchanged by this sprint |

## 1. Outcome

Sprint 3.1 establishes a Material 3 Flutter presentation foundation and a navigable learner entry flow from Splash through Topic Discovery. All content is deterministic local preview data. No authentication, network, persistence, lesson player, audio, synchronization, analytics, backend, Prisma, migration, seed, or PostgreSQL behavior is present.

## 2. Sprint scope

The implemented scope is Splash, Welcome, guest/account choice, guest Home, Topic Discovery, centralized navigation, a light visual system, responsive layout primitives, reusable visual components, and widget/navigation tests. Account actions and Topic selection end in explicit unavailable/next-step presentation states.

## 3. Authorization boundary

Only `apps/mobile` presentation code/tests and the required documentation were changed. There are no new dependencies. Backend and database integration remain outside this increment.

## 4. Inspected existing Flutter architecture

Before this sprint, the mobile project contained `lib/main.dart` with one `MaterialApp`/`Hello World` widget and one smoke test. Material 3 was not explicitly enabled. There were no routes, theme files, assets, state-management packages, routing packages, feature directories, or shared components. `pubspec.yaml` contained only the Flutter SDK and existing test/lint dependencies.

## 5. Final folder structure

```text
lib/
  app/
    app.dart
    navigation/
    theme/
  core/presentation/
    layout/
    widgets/
  features/
    launch/presentation/
    onboarding/presentation/
    home/presentation/
    topics/presentation/
```

Features own screens and feature-specific preview models. Cross-feature visual primitives live under `core/presentation`. No empty application, domain, or data layers were created.

## 6. Design direction

The interface uses calm green growth tones, warm supporting accents, broad surfaces, generous spacing, clear cards, large headings, and obvious actions. It is intended to feel welcoming and educational without copying another product or relying on flag styling.

## 7. Colour system

The light Material 3 `ColorScheme` defines primary/on-primary, containers, surface hierarchy, outline, error, inverse, and supporting semantic colors. Success, warning, error, and text roles are centralized. Feature screens consume theme colors rather than embedding visual color values.

## 8. Typography

The default platform font is retained. Central roles cover display, screen heading, section heading, large body, body, supporting text, and button/label text. Line heights and minimum supporting sizes favor reading clarity, and system text scaling is not suppressed.

## 9. Spacing and shape system

Central tokens define the used spacing scale, small/medium/large/pill radii, borders, icon sizes, 48-pixel minimum touch target, elevations, motion timings, maximum content width, and a tablet-width breakpoint.

## 10. Shared components

Implemented shared primitives are `ProlificScaffold`, `PrimaryButton`, `SecondaryButton`, `AppCard`, `StatePanel`, and `LoadingPlaceholder`. Buttons support disabled and loading states. Shared components use theme colors, semantic roles, predictable sizing, and narrow-screen-safe layout.

## 11. Navigation design

Built-in Flutter navigation is sufficient and avoids a new dependency. `AppRoutes` centrally owns stable route names; `AppRouter` maps Splash, Welcome, Access Choice, Home, and Topics. Guest entry clears onboarding history before Home, ordinary Home-to-Topics navigation preserves predictable back behavior, and unknown routes return a safe Welcome notice. There is no guard, deep link, backend redirect, or duplicated route string.

## 12. Splash screen

Splash displays the Prolific text identity, `Read. Learn. Grow.` tagline, and local progress indicator. It replaces itself with Welcome after a testable 650 ms timer. It performs no startup integration checks. When the platform requests disabled animations, the indeterminate animated indicator is omitted while all identity information remains visible.

## 13. Welcome screen

Welcome presents the reading-confidence message, a Flutter icon/shape illustration, concise guided-practice copy, and a prominent `Get Started` action. Its content scrolls so large text and short screens remain usable.

## 14. Access Choice screen

Access Choice implements the approved optional-account boundary. `Continue as Guest` enters Home. `Sign In` and `Create Free Account` open non-blocking coming-later sheets; no forms or fake authentication state exist.

## 15. Home screen

Home provides a neutral greeting, Continue Reading placeholder, Browse Topics action, English preview-language display, the approved Easy 100/Medium 150/Hard 200 WPM summary, an honest guest progress state, and a restrained account-benefit prompt. It fabricates no progress, percentage, streak count, or learner name.

## 16. Topic Discovery screen

Topic Discovery provides a heading, local search, category filters, adaptive topic cards, difficulty/language indicators, accessible empty results, and a lesson-selection-next placeholder. It implements no lesson inventory, player, backend availability claim, or persistence.

## 17. Guest-mode behaviour

Guests can explore preview topics. The UI explains that guest progress is temporary and that saved progress, streaks, downloads, and synchronization require a free account. It does not imply full-library, download, or durable-progress entitlement.

## 18. Placeholder account behaviour

Account actions remain presentation-only modal sheets with a route back to guest exploration. They collect no credentials, identity, personal information, or consent data.

## 19. Responsive behaviour

`ProlificScaffold` respects safe areas, constrains content to 760 logical pixels, and centers it at wider widths. Screens use scrolling for short/large-text layouts. Topic cards use one column on narrow layouts and two above the central breakpoint. Search/filter content stays reachable and keyboard dismissal is explicit.

## 20. Accessibility review

The implementation uses semantic labels for the splash, illustration, guest information action, topic cards, state panels, and primary action. Material controls provide focus order and states; minimum button height is 48 logical pixels. Status messages include text and icons, not color alone. System text scaling remains enabled, Welcome is tested at 200%, decorative illustration children are excluded from duplicate semantics, and Splash respects disabled animations.

## 21. Presentation mock-data policy

`topic_preview.dart` labels its constant list as temporary deterministic presentation data. It is feature-owned, not shaped as an API payload, does not use production UUIDs, creates no seed data, and performs no storage or network work.

## 22. State-management decision

No state-management package was selected. The only mutable state is Topic screen search/filter input, held locally by its widget. Navigation uses Flutter's framework state. Guest account architecture, global application state, and the approved state-management decision remain deferred.

## 23. Loading, empty, and error patterns

Splash supplies a realistic local loading presentation. Topic filtering uses `StatePanel` for actionable empty results. Account and Topic selection use the unavailable/coming-soon variant. Unknown-route fallback provides a recoverable human-readable notice. `LoadingPlaceholder` and the error variant establish reusable patterns without exposing technical messages.

## 24. Widget-test results

Focused screen tests cover Splash identity/transition, 200% Welcome text, guest restrictions, account placeholders, guest Home and pace values, deterministic Topics, local filtering/empty recovery, Topic selection, and button loading/disabled states. Final result: PASS.

## 25. Navigation-test results

The complete Splash -> Welcome -> Access Choice -> Home -> Topics path passes. Home-to-Topics back behavior passes, account actions remain modal presentation states, and there is no integration dependency. Final result: PASS.

## 26. Golden-test readiness

Screens use deterministic constants, no random content, one controllable Splash delay, and isolated animation. No golden dependency or baseline was added. Recommended future matrix: 360x640 and 430x932 phones, 800x1280 tablet, 1x/2x text scaling, and light-theme empty/content/placeholder states.

## 27. Architecture audit

- Feature screens import only Flutter, app theme/navigation, and shared presentation code.
- No HTTP, database, authentication, AI, audio, analytics, generated API, backend, or Prisma import exists.
- Navigation remains presentation-owned.
- No new package or global mutable singleton exists.
- Preview data is visibly temporary and feature-owned.
- Files remain bounded by route, screen, component, tokens, or preview-data responsibility.

## 28. Findings and severities

| Severity    | Finding                                                                                             | Outcome                                                                                                     |
| ----------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| MAJOR       | Initial Topic card and compact empty-state layouts overflowed at the standard widget-test viewport. | Resolved by increasing adaptive card extent and making state content scroll-safe.                           |
| MINOR       | The roadmap originally described Flutter as wholly gated behind the Core Content Read API.          | Reconciled: presentation-only Sprint 3.1 is active/completed while integration dependencies remain blocked. |
| OBSERVATION | Full golden baselines and localized interface strings do not yet exist.                             | Deferred to a later approved UI/localization increment.                                                     |

## 29. Resolved findings

All blocker and major findings identified in this sprint are resolved. The corrected focused widget/navigation suites pass without overflow.

## 30. Unresolved findings

There are no unresolved blockers or majors. Golden baselines, full interface localization, state-management selection, and integration contracts remain planned/deferred work rather than defects in this presentation-only scope.

## 31. Remaining UI work

Future authorized Flutter work includes launch-language selection UI, lesson/library selection against an approved contract, expanded device/accessibility validation, localization, golden baselines, and later reading-player/offline screens.

## 32. Remaining blocked integration work

Authentication, backend catalog integration, HTTP, durable progress, lesson package storage, local database selection, downloads, audio/player behavior, synchronization, analytics, and database changes remain unimplemented and unauthorized by this sprint.

## 33. Recommendation for the next Flutter sprint

Review this shell on representative Android devices and approve the interface-localization and state-management boundaries. Then implement the next presentation increment or resume the roadmap's backend contract work before any mobile integration. Do not connect these preview models to persistence or transport implicitly.
