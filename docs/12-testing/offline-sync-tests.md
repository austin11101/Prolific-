# Offline Package and Synchronization Testing Guide

This guide applies the [central testing strategy](./testing-strategy.md) to the [Offline Lesson Package](../05-mobile-app/offline-lesson-package.md) and [Sync Service](../06-core-backend/sync-service.md).

## Package matrix

Test valid packages in all launch languages and difficulties; Unicode punctuation/diacritics; zero-based contiguous positions; half-open spans; deterministic word counts; Package and Asset Checksum corruption; missing/truncated audio; unknown required block/profile/schema; interrupted download; atomic promotion; update failure with prior verified package; and exact Revision restoration.

Canonical checksum tests vary every included field and prove excluded transport/local fields do not change the semantic checksum. No fixture includes credentials, progress, analytics identifiers, Device state, or server-only audit data.

## Synchronization matrix

Test offline completion and atomic outbox creation, reconnection, request loss after server commit, duplicate same payload, duplicate changed payload, mixed accepted/duplicate/rejected/retryable batch, out-of-order session events, transient failure, cursor replay/reset, process termination during outcome application, concurrent workers, multiple Devices, account deactivation/deletion, and late replay after anonymization.

Core invariants are: reuse the original event ID, match outcomes by ID, advance the cursor only after local application, clear only accepted/payload-matching duplicate events, retain uncertain/retryable/rejected evidence, never use device time alone for reconciliation, and never restore deleted identity. Exact batch, retry, receipt-retention, cursor, and multi-device policies remain Sprint 8 test-design inputs.
