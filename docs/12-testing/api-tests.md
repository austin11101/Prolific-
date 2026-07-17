# API Testing Guide

This guide applies the [central testing strategy](./testing-strategy.md) to REST and shared contracts. The [API Overview](../08-api-specification/api-overview.md) remains the behavioral authority.

## Contract coverage

- All public routes begin `/api/v1` and use JSON/UTC ISO 8601 conventions.
- Requests reject unknown or invalid external input according to their contract.
- Standard errors validate against `api-error.schema.json` and expose no internal details.
- Authentication, authorization, guest library limits, administrative capabilities, and published-only visibility are explicit.
- Pagination/cursor, filtering, conditional requests, conflict, and rate-limit behavior are tested where supported.
- Idempotent retries return the original outcome; reuse with a changed canonical payload returns `idempotency_conflict`.
- A valid sync batch returns one outcome per event, including partial success.

Schema tests compile every Draft 2020-12 document, validate embedded examples, reject representative additional properties, and assert unique `$id` values. OpenAPI/runtime DTO generation is later work; when introduced, drift tests must compare it with the approved shared specifications.
