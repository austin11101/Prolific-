# Mobile Testing Guide

This guide applies the [central testing strategy](./testing-strategy.md) to Flutter. The [Flutter architecture](../05-mobile-app/flutter-architecture.md) defines the boundaries under test.

## Test map

| Boundary                       | Primary evidence                                                           |
| ------------------------------ | -------------------------------------------------------------------------- |
| Domain values and player rules | Pure Dart unit tests                                                       |
| Use-case orchestration         | Fakes for repositories, clock, identifiers, and transaction ports          |
| JSON/local mapping             | Adapter tests with valid, missing, incompatible, and unknown values        |
| Widgets/routes                 | Widget tests for states, semantics, navigation, and restoration actions    |
| Local database/files           | Migration, transaction, checksum, promotion, and cleanup integration tests |
| Platform lifecycle/audio       | Focused device/emulator tests                                              |

## Critical cases

- Guest activity stays temporary; guests cannot download, sync, save durable progress, or maintain streaks.
- Tutorial auto-play occurs once by default, replay is allowed, and neither completes a lesson.
- Practice is application-silent and uses Easy/Medium/Hard at 100/150/200 WPM.
- A process interruption restores the exact Revision, profile, mode, pace, position, and eligible timing state.
- Cached data remains available after refresh failure; corrupt/incompatible packages never open.
- Progress and its outbox event commit atomically.
- Accepted/duplicate outcomes clear delivery work; rejected/retryable outcomes retain recoverable evidence.

Tests use a controllable clock and fake audio position source. Golden tests may supplement but never replace semantics, scaling, and behavior assertions. The state-management and local database packages are selected later; test contracts must remain valid across that choice.
