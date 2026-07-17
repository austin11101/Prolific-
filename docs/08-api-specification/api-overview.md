# Prolific API Overview

## Purpose

This document defines the MVP-level conventions and resource boundaries for the Prolific core REST API. It covers API versioning, request and response formats, authentication, pagination, errors, idempotency, content versioning, offline synchronization events, and endpoint groups.

The OpenAPI document will be the machine-readable contract. This overview defines the rules that the OpenAPI document and future controllers must follow; it does not implement controllers or settle product policies that remain explicitly unresolved elsewhere.

## API Principles

The MVP API must be:

- **Versioned:** Every public route begins with `/api/v1`.
- **Contract first:** Public operations and schemas are maintained in OpenAPI and reviewed before implementation diverges from them.
- **Offline safe:** Client-created records use stable UUIDs, delayed events can be retried, and acknowledgements are explicit.
- **Consistent:** Success, pagination, validation, and error structures do not vary by controller.
- **Secure by default:** Authentication and authorization are enforced at resource and action boundaries, and internal failures are not exposed.
- **Revision aware:** Learner content, alignment data, source attribution, and audio are tied to one immutable Lesson Revision within a Language/Difficulty Lesson Variant.
- **Observable:** Every response has a request identifier suitable for support and server-side correlation without exposing sensitive data.

## Base URL and Versioning

All public MVP endpoints use this path prefix:

```text
/api/v1
```

Rules:

- The major API version is encoded in the URL.
- Additive, backward-compatible changes may be released within `v1`.
- Removing a field, changing its meaning or type, tightening a previously valid input, or changing a state transition requires a new major version unless an explicitly documented migration preserves compatibility.
- Clients must ignore unknown response fields but must not send undocumented request fields.
- Deprecated fields and operations remain documented for their support period and include a documented replacement.
- Versioning of the API is separate from lesson content versioning and sync event schema versioning.

## Transport and Serialization Conventions

### Protocol and media types

- Production traffic uses HTTPS only.
- JSON requests use `Content-Type: application/json`.
- Clients send `Accept: application/json` for JSON resources.
- Binary lesson or audio delivery may use an appropriate immutable media type or a time-limited download location, as defined by the content-delivery architecture.
- JSON is encoded as UTF-8.

### Naming and values

- JSON property names use `camelCase`.
- URL path segments use lowercase plural resource names and kebab-case only when multiple words are required.
- Resource identifiers are UUID strings in canonical hyphenated form.
- Client-created offline identifiers use UUIDs generated before the first submission.
- Timestamps use UTC ISO 8601 with a `Z` suffix, for example `2026-07-13T09:15:30.000Z`.
- Date-only values, if introduced, use `YYYY-MM-DD` and must not be interpreted as timestamps.
- Language identifiers use documented BCP 47 language tags. The launch set is English, isiZulu, and Sepedi; not every lesson is required in every launch language.
- Enumerations use lowercase `snake_case` values and are closed unless the schema explicitly states otherwise.
- Monetary floating-point values are not part of the MVP. Other decimal values must define precision in OpenAPI and must not rely on binary floating-point equality.
- Boolean values are JSON `true` or `false`, never strings or integers.
- Absent optional data is omitted unless the schema requires an explicit `null`. A client must not treat omitted and `null` values as interchangeable unless the field contract says so.

### Request headers

| Header                                 | Use                                                                                              |
| -------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `Authorization: Bearer <access-token>` | Required for authenticated operations.                                                           |
| `Accept`                               | Requested response media type.                                                                   |
| `Content-Type`                         | Request-body media type.                                                                         |
| `X-Request-Id`                         | Optional caller-generated UUID for correlation; the server validates or replaces invalid values. |
| `Idempotency-Key`                      | Stable UUID for supported retryable mutation operations outside the sync envelope.               |
| `If-Match`                             | Required where an administrative update uses optimistic concurrency.                             |
| `Accept-Language`                      | Optional interface-message preference; it does not replace explicit lesson-language filters.     |

### Response headers

| Header                     | Use                                                                               |
| -------------------------- | --------------------------------------------------------------------------------- |
| `X-Request-Id`             | Server-confirmed request identifier returned on success and error responses.      |
| `ETag`                     | Version identifier for cacheable or concurrency-controlled resources.             |
| `Cache-Control`            | Explicit caching policy for metadata, immutable content, and sensitive responses. |
| `Retry-After`              | Delay before retry when applicable to throttling or temporary unavailability.     |
| `Deprecation` and `Sunset` | Deprecation metadata when an operation has a planned retirement.                  |

## Standard Success Responses

### Single resource

Successful JSON operations return a top-level `data` member:

```json
{
  "data": {
    "id": "4bf2f788-62d7-4a7f-bf24-bdc1079d7d13",
    "title": "Example lesson"
  }
}
```

### No response body

An operation that succeeds without returning a resource uses `204 No Content`. A `204` response has no JSON body.

### Creation

A newly created server resource uses `201 Created`, returns the resource in `data`, and provides its canonical location when applicable.

### Mutation results

State-changing operations return the resulting resource representation or a documented action result. They must not return an ambiguous success message without the resulting identifier and state.

## Pagination

All collection endpoints are paginated. The default model is opaque cursor pagination because lesson catalogs and audit collections can change while a client traverses them.

### Request parameters

| Parameter | Type    | Rule                                                                                               |
| --------- | ------- | -------------------------------------------------------------------------------------------------- |
| `limit`   | Integer | Optional page size; default `20`, minimum `1`, maximum `100`.                                      |
| `cursor`  | String  | Optional opaque cursor returned by the preceding response. Clients must not parse or construct it. |

Collection-specific filters and sort options must be documented in OpenAPI. A cursor is valid only for the same endpoint, authenticated scope, filters, and ordering that produced it.

### Response structure

```json
{
  "data": [
    {
      "id": "4bf2f788-62d7-4a7f-bf24-bdc1079d7d13",
      "title": "Example lesson"
    }
  ],
  "page": {
    "limit": 20,
    "nextCursor": "opaque-value-or-null",
    "hasMore": false
  }
}
```

Rules:

- `data` is always an array, including when empty.
- `nextCursor` is `null` when no next page exists.
- `hasMore` indicates whether another page was known at response time.
- Ordering must be deterministic and include a unique tie-breaker.
- The API does not promise a total count unless a specific endpoint documents one.
- Invalid, expired, or mismatched cursors return a safe `400` error with code `invalid_cursor`.
- Clients deduplicate accumulated items by stable resource ID; the server must not intentionally repeat items within one cursor traversal.

## Filtering, Sorting, and Search

- Filters use explicit query parameters such as `language`, `topicId`, `difficulty`, and `status` where authorized.
- Repeating a documented filter parameter represents multiple allowed values only when the endpoint schema explicitly supports it.
- Sort fields use `sort`, with a leading `-` for descending order, for example `sort=-updatedAt`. Every endpoint exposes only an allow-list of sort fields.
- Learner catalog operations expose only learner-eligible content and do not accept administrative status overrides.
- Free-text search is not assumed for the MVP unless added to the approved endpoint contract.

### Taxonomy hierarchy contract expectations

- Category and Topic resources use stable UUIDs, explicit lifecycle state, Canonical Taxonomy Name, localized display metadata when available, and deterministic display order.
- Topic representations expose `categoryId`, nullable `parentTopicId`, and sufficient ancestry/breadcrumb data for navigation without requiring clients to assume a fixed maximum depth. The launch UI normally presents no more than three visible levels.
- Learner catalog responses include only taxonomy with Effective Visibility and published eligible content; `draft`, `hidden`, `archived`, or ancestor-ineligible taxonomy is excluded.
- Administrative taxonomy mutations are explicit create/update/hide/archive/restore/reparent/reassign commands with authenticated server actor context and optimistic concurrency. Request bodies never supply trusted actor identity.
- Reparenting is same-Category only, moves the complete subtree, rejects direct or indirect cycles, and returns a conflict for stale hierarchy state or scoped-name collision. Cross-Category moves and destructive taxonomy `DELETE` operations are not part of the approved contract.
- Exact routes, DTO fields, ancestry encoding, localization representation, and error codes remain unfrozen until the physical/API design is reviewed; these expectations do not create an API implementation.

### Privacy and deletion contract expectations

- Account deletion is an explicit authenticated/otherwise verified command, not generic resource `DELETE` semantics. It may be asynchronous and represents `requested`, `pending`, `blocked`, `completed`, or `failed`; cancellation exists only if later policy permits it.
- Deactivation, content/taxonomy archive, Revision withdrawal, identity anonymization, Retention Hold, and purge are distinct authorized operations. Administrators cannot arbitrarily hard-delete historical content or activity.
- Trusted request subject and acting identity come from server authentication context. Privacy operations require dedicated authorization and must not expose whether another person's account or retained history exists.
- After deactivation/deletion, learner APIs stop returning progress/history and Devices cannot submit new sync events. Late outbox replay returns a safe authorization/account-deleted outcome and cannot recreate identity or reattach anonymized activity.
- Privacy Action Records and hold details are internal, restricted, data-minimized responses and are excluded from learner catalog/package contracts.
- Responses do not expose retained anonymized history to a deleted learner and do not promise immediate physical removal from bounded backups.
- Exact endpoint paths, verification mechanism, response DTOs, timing, cancellation, legal outcomes, and retention schedules remain unfrozen.

## Authentication and Authorization

### Token model

The API uses access and refresh tokens:

- An access token is short-lived and is sent as a bearer token to authenticated resource endpoints.
- A refresh token is longer-lived, used only at the refresh operation, rotated after successful use, and revocable.
- Refresh tokens are never accepted as bearer credentials for ordinary API operations.
- Token material must not appear in URLs, logs, error details, analytics, or response bodies outside the authentication operations that issue it.
- Stored server-side refresh credentials or token families must be protected so a database read does not expose reusable plaintext tokens.
- Reuse of an invalidated rotated refresh token must follow the approved session-compromise policy.

Token format, signing or reference-token design, issuer, audience, access lifetime, refresh lifetime, rotation grace, and device/session limits require a security decision before implementation.

### Authentication operations

The MVP authentication group provides the operations required by the approved account model:

| Operation                    | Purpose                                                                                   |
| ---------------------------- | ----------------------------------------------------------------------------------------- |
| `POST /api/v1/auth/register` | Create an optional free learner account using the approved credential and consent policy. |
| `POST /api/v1/auth/login`    | Exchange approved credentials for an access and refresh token pair.                       |
| `POST /api/v1/auth/refresh`  | Rotate a valid refresh token and issue a new token pair.                                  |
| `POST /api/v1/auth/logout`   | Revoke the current refresh token or session.                                              |
| `GET /api/v1/auth/session`   | Return the current authenticated actor and authorized role context.                       |

Credential fields, recovery, verification, guardian consent, and external identity endpoints remain undefined until their policies are approved. Social login and paid account tiers are not part of the MVP.

### Authorization

- Authentication and authorization are separate checks.
- Every protected endpoint declares its permitted actor types, roles, and resource scope in OpenAPI and the authorization matrix.
- Learners can access only their own progress and the learner-visible content catalog.
- Public guest access is limited to active categories/topics and the designated limited selection of published free lessons. Downloads, durable progress, synchronization, history, streaks, and the complete eligible library require a free account.
- Administrative content actions require authenticated internal context plus the capability assigned to the exact lifecycle command. Platform Administrator status alone does not bypass editorial separation of duties.
- Trusted actor identity and actor type come from server authentication context, never request path/query/body data.
- The content engine uses a distinct Service Actor identity with draft-ingestion permission only; it cannot approve or publish.
- Object-level authorization is enforced even when a caller knows a valid UUID.
- Authorization failures do not reveal whether an inaccessible resource exists when doing so would disclose sensitive information.

### Authentication failures and offline data

- Missing or invalid access credentials return `401 Unauthorized` with a stable machine-readable code.
- Valid authentication without permission returns `403 Forbidden`.
- A refresh failure does not instruct the mobile client to delete downloaded lessons or unsynced progress.
- Continued offline access after token expiry follows the separately approved offline-authentication policy.

### Guest analytics boundary

Limited guest analytics may record category/topic views, lesson starts/completions, player errors, and performance events using a non-identifying session or installation identifier. The API must not accept guest PII without deliberate registration or consent, and must not silently merge the guest identifier into an authenticated identity. Provider, retention, deletion, safeguarding, and consent details require privacy approval.

## Error Responses

All JSON errors use the strict [shared API error schema](../../packages/shared-contracts/specifications/api-error.schema.json):

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The request could not be processed.",
    "validationDetails": [
      {
        "field": "events[0].eventId",
        "code": "invalid_uuid",
        "message": "Must be a valid UUID."
      }
    ],
    "correlationId": "9715aa3e-aed3-4da8-bf4a-50e939a68d8d",
    "retryable": false,
    "timestamp": "2026-07-15T09:16:02.000Z"
  }
}
```

Rules:

- `code` is stable, machine-readable, and uses lowercase `snake_case`.
- `message` is safe for display or support context but is not the sole basis for client logic.
- `validationDetails` is optional and contains only safe structured information.
- Validation fields use a documented path notation and never echo secrets or unsafe raw input.
- `correlationId` matches the `X-Request-Id` response header.
- `retryable` indicates whether the request-level failure may be retried unchanged; per-event sync outcomes remain authoritative for an enumerable batch.
- Optional `conflictMetadata` contains only safe structured recovery context.
- `timestamp` is the server UTC error timestamp.
- Stack traces, SQL, table names, internal hostnames, dependency errors, token contents, and secrets are never exposed.
- Unknown server failures use code `internal_error` and a generic message.

### Status-code conventions

| Status                       | Meaning                                                                                    |
| ---------------------------- | ------------------------------------------------------------------------------------------ |
| `400 Bad Request`            | Malformed JSON, invalid query syntax, invalid cursor, or request-level validation failure. |
| `401 Unauthorized`           | Authentication is missing, invalid, or expired.                                            |
| `403 Forbidden`              | The actor is authenticated but not authorized.                                             |
| `404 Not Found`              | The resource is absent or its existence must not be disclosed.                             |
| `409 Conflict`               | State transition, idempotency payload, version, or concurrency conflict.                   |
| `412 Precondition Failed`    | An `If-Match` precondition does not match the current resource.                            |
| `413 Payload Too Large`      | Request or sync batch exceeds its documented limit.                                        |
| `415 Unsupported Media Type` | Request media type is unsupported.                                                         |
| `422 Unprocessable Content`  | JSON is structurally valid but violates domain rules that are not request-syntax errors.   |
| `429 Too Many Requests`      | Rate limit exceeded; include `Retry-After` when known.                                     |
| `500 Internal Server Error`  | Unexpected server failure with no internal detail exposed.                                 |
| `503 Service Unavailable`    | Temporary dependency or service outage; include retry guidance when safe.                  |

## Idempotency

### Offline synchronization events

The sync event's `eventId` is its idempotency key. The mobile client generates the UUID once, persists it in the outbox, and reuses it for every retry.

The server must atomically:

1. Determine whether the event ID has already been processed for the authenticated scope.
2. Validate that a repeated event ID has the same canonical payload fingerprint.
3. Persist the new event's domain outcome and idempotency record together.
4. Return the same durable outcome for a valid retry.

A repeated event ID with a different canonical payload returns `409 Conflict` with code `idempotency_conflict`. It must not alter the original outcome.

### Other mutation operations

Creation or action endpoints that may be retried after timeouts declare support for `Idempotency-Key` in OpenAPI. For those endpoints:

- The key is a caller-generated UUID scoped to the authenticated actor and operation.
- The same key and canonical request returns the original status and response.
- The same key with a different request returns `409 idempotency_conflict`.
- The server stores no raw secret-bearing request data merely to support idempotency.
- Operations using `If-Match` for concurrency control may also require an idempotency key when a network retry could repeat a side effect.

### Retention

Idempotency records must be retained longer than the maximum supported offline delay and retry period. The actual retention duration, cleanup strategy, storage limits, and behaviour for an event older than the supported window are release-blocking sync-policy decisions.

## Lesson Variants and Revisions

### Identity model

- `lessonId` is the stable UUID for the educational Lesson across all adaptations.
- `lessonVariantId` is the stable UUID for one Language/Difficulty stream.
- `lessonRevisionId` is the stable UUID for one immutable published snapshot.
- `revisionNumber` is a positive integer scoped to the Variant and assigned atomically at publication; it is not global identity.
- A Lesson Revision's ordered Content Blocks, Reading Units/Positions, profile versions, metadata, alignment data, source attribution, and audio references are immutable after publication.
- Correcting learner-visible content creates a new Working Draft and Lesson Revision; it does not mutate a downloaded Revision.
- `packageChecksum` is SHA-256 over ADR-014's canonical semantic package inputs; it is distinct from Revision identity and transport URL.
- Every binary asset exposes its own SHA-256 `assetChecksum`, whether embedded or transferred separately.
- `packageSchemaVersion`, Tokenization Profile/version, Alignment Profile/version, supported block types, and compatibility requirements allow the client to reject an uninterpretable package before use.

### Published lesson descriptor

```json
{
  "data": {
    "lessonId": "4bf2f788-62d7-4a7f-bf24-bdc1079d7d13",
    "lessonVariantId": "76b6bdcc-fc2b-4332-b4bc-a12d32621f30",
    "lessonRevisionId": "0b82b6ca-e4bd-4218-a728-86a0696d9957",
    "revisionNumber": 3,
    "title": "Example lesson",
    "language": "en-ZA",
    "difficulty": "beginner",
    "wordCount": 320,
    "estimatedReadingSeconds": 160,
    "package": {
      "packageSchemaVersion": 1,
      "tokenizationProfile": "prolific-word-en-za",
      "tokenizationProfileVersion": 1,
      "alignmentProfile": "prolific-position-timeline",
      "alignmentProfileVersion": 1,
      "checksum": "sha256:0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef",
      "contentLength": 123456,
      "downloadUrl": "https://download-location.example/immutable-package"
    },
    "publishedAt": "2026-07-13T09:15:30.000Z"
  }
}
```

The example illustrates identity and contract shape, not a final DTO, endpoint, production hostname, or package transport. SHA-256 and the checksum boundary are approved; the content-delivery architecture must still decide whether the API streams packages or returns time-limited download locations.

An exact package response or manifest must carry Lesson/Variant/Revision identity, Revision Number, Package Schema Version, Language/Difficulty and display metadata, ordered supported Content Blocks, Reading Units/Positions and spans, word count, pace metadata, Tokenization and Alignment Profile names/versions, tutorial-audio identity/metadata/Asset Checksum, alignment entries, source attribution, Package Checksum, and interpretation-affecting compatibility data. It must not carry credentials, learner progress/sessions, analytics, preferences, device state, local paths, generation/cache timestamps, or temporary transport URLs inside the checksum boundary.

Package delivery must surface stable compatibility/integrity outcomes without exposing storage internals. An unsupported required schema/block/profile returns or records a compatibility failure suitable for client recovery. A server-known corrupt package is not served as valid; a client-detected Package or Asset Checksum mismatch rejects or quarantines the candidate, preserves any prior verified Revision, and may report a privacy-safe diagnostic through a later approved contract. Final endpoint paths and transport-specific status mapping remain open.

### Download and cache rules

- The learner catalog resolves each eligible Lesson Variant's Current Published Revision.
- A client requests an explicit Lesson Revision, rejects unsupported required schema/block/profile semantics, verifies the Package Checksum and every Asset Checksum, and only then marks it offline-ready.
- Revision-specific resources use immutable caching and stable `ETag` values.
- A Current Published Revision lookup may change and must use revalidation-appropriate cache headers.
- The client never combines text, alignment, metadata, attribution, or audio from different Revisions.
- A failed update does not invalidate the last verified local Revision unless policy explicitly marks it unusable.
- Sync events always include the exact `lessonRevisionId` originally used during the Reading Session.
- Archival removes a lesson from new learner discovery but does not silently make an existing local package or unsynced event uninterpretable; revocation behaviour for safety or legal removal requires a documented policy.

### Publication visibility

Learner endpoints return only published Lesson Revisions. A Working Draft follows `draft` to `in_review` to `approved`, with `in_review` to `changes_requested` to `draft` for correction. Publication atomically creates the immutable Revision and updates the Variant's Current Published Revision. Approval alone does not make content learner-visible. Public guest responses are further limited to the designated free selection, while registered learners receive the complete eligible published catalog.

Administrative APIs expose Working Draft and Lesson Variant lifecycle status only to authorized roles. The content engine can create or update Working Drafts but cannot approve or publish.

Editorial commands operate on immutable evidence. Submission returns a `reviewSubmissionId` and submitted integrity reference. Changes-requested, rejection, and approval address that exact ID and return a `reviewDecisionId`. Publication verifies the approved unchanged submission and returns exact `lessonRevisionId` and `publicationRecordId`. Review notes, capability snapshots, Administrative Actor details, and server-only audit evidence are excluded from learner responses and Offline Lesson Packages.

## Synchronization Event Contract

### Event envelope

Every event is immutable after it enters the local outbox. The [shared sync request schema](../../packages/shared-contracts/specifications/sync-request.schema.json) is canonical. Its event envelope is:

```json
{
  "eventId": "8d8ecce8-c932-4512-a2d0-840a2b40c8ee",
  "eventSchemaVersion": 1,
  "eventType": "practice_completed",
  "entityId": "82db7834-b45a-49eb-86b8-ef34f3a8bb81",
  "eventTimestamp": "2026-07-13T09:15:30.000Z",
  "sessionId": "82db7834-b45a-49eb-86b8-ef34f3a8bb81",
  "sequence": 4,
  "lessonId": "4bf2f788-62d7-4a7f-bf24-bdc1079d7d13",
  "lessonVariantId": "76b6bdcc-fc2b-4332-b4bc-a12d32621f30",
  "lessonRevisionId": "0b82b6ca-e4bd-4218-a728-86a0696d9957",
  "revisionNumber": 3,
  "payload": {
    "mode": "practice",
    "pacePreset": "medium",
    "wordsPerMinute": 150,
    "positionIndex": 319,
    "elapsedMilliseconds": 162500,
    "completed": true
  }
}
```

The medium pace value is the approved 150 WPM default. The example position and elapsed-time values do not define a completion threshold or timing tolerance.

### Envelope fields

| Field                | Requirement                                                                            |
| -------------------- | -------------------------------------------------------------------------------------- |
| `eventId`            | Required client-generated UUID and stable idempotency key.                             |
| `eventSchemaVersion` | Required positive integer, independent of API, package, and Revision numbering.        |
| `eventType`          | Required closed enumeration defined below.                                             |
| `entityId`           | Required UUID of the session/activity aggregate addressed by the event.                |
| `eventTimestamp`     | Required client-observed UTC timestamp; informative, not the sole ordering authority.  |
| `sessionId`          | Required client-generated UUID shared by one tutorial or practice session.             |
| `sequence`           | Required non-negative session-local sequence; delivery may still be late or repeated.  |
| `lessonId`           | Stable Lesson UUID.                                                                    |
| `lessonVariantId`    | UUID of the Language/Difficulty stream.                                                |
| `lessonRevisionId`   | Required UUID of the exact immutable Revision used offline.                            |
| `revisionNumber`     | Positive Variant-scoped display/audit number; never identity.                          |
| `retryCount`         | Optional non-negative delivery diagnostic; it is outside the immutable domain meaning. |
| `payload`            | Strict event-specific object; its `mode` must agree with `eventType`.                  |

### Event types

The MVP event-type set is:

- `tutorial_started`
- `tutorial_progressed`
- `tutorial_completed`
- `practice_started`
- `practice_progressed`
- `practice_completed`

Tutorial completion and practice completion remain distinct. A `tutorial_completed` event must never be interpreted as lesson completion.

### Progress payload

The initial event schema supports:

| Field                 | Requirement                                                                                                                                                                                                                 |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `mode`                | Required `tutorial` or `practice`; must agree with the event type.                                                                                                                                                          |
| `pacePreset`          | Required `easy`, `medium`, or `hard`.                                                                                                                                                                                       |
| `wordsPerMinute`      | Required positive integer containing the actual internal pace used for this session.                                                                                                                                        |
| `positionIndex`       | Required zero-based index into the exact Lesson Revision's contiguous Reading Position sequence.                                                                                                                            |
| `elapsedMilliseconds` | Required non-negative active elapsed time according to the approved player timing model.                                                                                                                                    |
| `completed`           | Required boolean. It may be `true` only for practice that started, reached the Lesson Revision's final eligible Reading Position, and was not abandoned or exited before that end; tutorial events never complete a lesson. |

Additional event-specific fields must be added through a schema-versioned, backward-compatible contract. Free-form arbitrary payload properties are not accepted.

### Batch submission

The mobile client submits one or more events with pseudonymous Device, request, cursor, clock, and local-schema context:

```json
{
  "deviceId": "bd9678f3-6c04-4cc5-b3bd-20eb1f86ac2d",
  "clientRequestId": "c0fd523b-1b5e-4f93-bd3d-71bc9af0101d",
  "previousSyncCursor": null,
  "clientTimestamp": "2026-07-13T09:15:30.000Z",
  "localSchemaVersion": 1,
  "events": [
    {
      "eventId": "8d8ecce8-c932-4512-a2d0-840a2b40c8ee",
      "eventSchemaVersion": 1,
      "eventType": "practice_completed",
      "entityId": "82db7834-b45a-49eb-86b8-ef34f3a8bb81",
      "eventTimestamp": "2026-07-13T09:15:30.000Z",
      "sessionId": "82db7834-b45a-49eb-86b8-ef34f3a8bb81",
      "sequence": 4,
      "lessonId": "4bf2f788-62d-4a7f-bf24-bdc1079d7d13",
      "lessonVariantId": "76b6bdcc-fc2b-4332-b4bc-a12d32621f30",
      "lessonRevisionId": "0b82b6ca-e4bd-4218-a728-86a0696d9957",
      "revisionNumber": 3,
      "payload": {
        "mode": "practice",
        "pacePreset": "medium",
        "wordsPerMinute": 150,
        "positionIndex": 319,
        "elapsedMilliseconds": 162500,
        "completed": true
      }
    }
  ]
}
```

The maximum batch count and byte size must be defined in OpenAPI and aligned with supported offline duration, mobile bandwidth, and server limits.

### Batch acknowledgement

A structurally valid batch returns every submitted event exactly once across the outcome arrays in the [shared sync response schema](../../packages/shared-contracts/specifications/sync-response.schema.json):

```json
{
  "serverTimestamp": "2026-07-13T09:16:02.000Z",
  "nextCursor": "opaque-cursor-example",
  "acceptedEvents": [
    {
      "eventId": "8d8ecce8-c932-4512-a2d0-840a2b40c8ee",
      "acknowledgedAt": "2026-07-13T09:16:02.000Z",
      "sessionRecordId": "6d35df55-1daf-4071-a599-998ca6560801"
    }
  ],
  "duplicateEvents": [],
  "rejectedEvents": [],
  "retryableEvents": [],
  "updatedProgressSummary": {
    "completedLessonCount": 4,
    "totalPracticeMilliseconds": 650000,
    "currentStreakDays": 2,
    "lastUpdatedAt": "2026-07-13T09:16:02.000Z"
  },
  "accountState": "active",
  "deviceState": "active"
}
```

Per-event outcome groups are:

| Group       | Meaning                                                                                           | Client outbox action                                                                |
| ----------- | ------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `accepted`  | A new event and its domain outcome were durably stored.                                           | Mark synchronized.                                                                  |
| `duplicate` | The same event and payload were already durably processed.                                        | Mark synchronized using the returned original outcome.                              |
| `rejected`  | The event is permanently invalid under the current contract.                                      | Preserve until the documented rejection workflow records or resolves the loss risk. |
| `retryable` | Processing could not safely complete yet, including a transient or safely reconcilable condition. | Preserve with the original event ID and retry under the documented policy.          |

Rules:

- A valid batch request uses `200 OK` even when individual results include `rejected` or `retryable`; the client relies on each result.
- A malformed batch envelope that cannot be safely enumerated uses the standard request-level error response.
- Every submitted event ID appears in exactly one outcome group; clients match by ID, never array position.
- `acknowledgedAt` is the server's durable acknowledgement timestamp.
- A duplicate returns the same effective domain outcome as the original processing.
- A server must not return `accepted` before the event, domain outcome, and idempotency record are durably committed.
- Partial infrastructure failure leaves uncertain events safe to retry with their original IDs.

### Ordering and conflicts

- `sequence` provides device-session intent but is not proof that all earlier events will arrive first.
- The server records its own receipt and processing timestamps.
- The server must not use `eventTimestamp` as its sole ordering or authorization authority because device clocks can be wrong.
- Events from multiple sessions or Devices remain distinct through UUIDs.
- Out-of-order events, missing earlier sequence values, superseded Current Published Revisions, repeated completions, multiple devices, and permanently rejected events require safe deterministic reconciliation that maps to one of the four per-event outcomes. A retry retains its original `lessonRevisionId`.
- Complex user-facing conflict resolution is not an MVP feature. No reconciliation policy may silently discard local progress.

## Optimistic Concurrency

Working Draft updates and administrative lifecycle transitions must prevent accidental overwrites:

- A resource representation exposes an `ETag` derived from its current server version.
- A protected update or transition requires `If-Match` when concurrent edits are possible.
- A stale `If-Match` returns `412 Precondition Failed` without applying the change.
- Review commands identify the exact Review Submission and applicable integrity/version evidence; they never accept a client-asserted trusted reviewer actor ID.
- A stale Working Draft update is a concurrency conflict; the caller reloads current state, and silent last-write-wins is prohibited.
- Review approval conflicts when the submitted content changed, the submission was superseded, or separation/authorization validation fails.
- Publication verifies the exact approved Review Decision and unchanged checksums. Concurrent attempts cannot produce duplicate Revision Numbers or Publication Records; the losing request returns the documented conflict result.
- A domain-invalid transition returns `409 Conflict` or `422 Unprocessable Content` according to the documented state-machine contract.
- Successful lifecycle changes record actor, previous state, resulting state, and UTC timestamp in the audit trail.

## Endpoint Groups

The table defines the MVP resource groups. Exact request and response schemas, filters, permissions, and operation IDs belong in OpenAPI.

| Group             | Route prefix                        | Purpose                                                                                            | Authentication                                                                   |
| ----------------- | ----------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Service status    | `/api/v1/health`                    | Liveness or readiness information appropriate for the caller.                                      | Public exposure must be minimal; detailed readiness is operationally restricted. |
| Authentication    | `/api/v1/auth`                      | Free registration, login, token refresh, logout, and current-session context.                      | Varies by operation.                                                             |
| Languages         | `/api/v1/languages`                 | Launch languages that currently have learner-eligible content.                                     | Public guest catalog.                                                            |
| Topics            | `/api/v1/topics`                    | Paginated active topics filtered by language.                                                      | Public guest catalog.                                                            |
| Lessons           | `/api/v1/lessons`                   | Paginated published catalog and lesson metadata; guests receive only the limited free selection.   | Public catalog with access-state filtering.                                      |
| Learner profile   | `/api/v1/me`                        | Current learner identity and approved preferences.                                                 | Authenticated learner.                                                           |
| Learner progress  | `/api/v1/me/progress`               | Server-acknowledged progress summaries; not a replacement for sync submission.                     | Authenticated learner, own data only.                                            |
| Synchronization   | `/api/v1/sync/events`               | Idempotent batch submission and per-event durable acknowledgement.                                 | Authenticated learner.                                                           |
| Admin lessons     | `/api/v1/admin/lessons`             | Lesson/Variant creation, Working Draft editing/review, Revision publication, and Variant archival. | Authorized administrative role.                                                  |
| Admin audit       | `/api/v1/admin/audit-events`        | Paginated administrative audit records.                                                            | Restricted administrative or audit role.                                         |
| Content ingestion | `/api/v1/content-ingestion/lessons` | Validated creation or update of drafts by the content engine.                                      | Dedicated service identity; draft-only authorization.                            |

### Representative lesson operations

| Operation                               | Purpose                                                                               |
| --------------------------------------- | ------------------------------------------------------------------------------------- |
| List languages                          | List supported Languages with learner-eligible content.                               |
| List topics by language                 | List paginated learner-visible Topics for a Language.                                 |
| List published lessons                  | List learner-visible Lesson/Variant metadata using documented filters.                |
| Read a current published lesson         | Return a selected Variant's Current Published Revision identity and learner metadata. |
| Read an exact published Lesson Revision | Return the immutable Revision descriptor and package integrity metadata.              |
| Retrieve an exact Revision package      | For a registered learner, return or authorize retrieval of the immutable package.     |

Exact revision-oriented endpoint paths remain pending OpenAPI review; this table does not finalize route shapes.

### Representative synchronization operations

| Method and path            | Purpose                                                                     |
| -------------------------- | --------------------------------------------------------------------------- |
| `POST /api/v1/sync/events` | Submit a batch of immutable offline events and receive per-event results.   |
| `GET /api/v1/me/progress`  | Read server-acknowledged progress summaries for reconciliation and display. |

No endpoint is required to check an event before submitting it; safely retrying the same event ID is the normal recovery path. A separate event-status lookup may be added only if a documented recovery case requires it.

### Representative administrative operations

| Operation                             | Purpose                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| List administrative content           | List Lessons, Variants, Working Drafts, and Revisions visible to the authorized role.                   |
| Create Lesson                         | Create stable educational identity without learner-facing content.                                      |
| Create Lesson Variant                 | Create one unique Language/Difficulty stream.                                                           |
| Create or update Working Draft        | Save permitted editable fields with validation and expected-version concurrency control.                |
| Submit/request changes/reject/approve | Create immutable Review Submission/Decision evidence against exact content without creating a Revision. |
| Publish Lesson Revision               | Atomically create the next immutable Revision and switch Current Published Revision.                    |
| Archive Lesson Variant                | Remove the Variant from new discovery while preserving Revision/session history.                        |
| Withdraw Lesson Revision              | Append restricted evidence and remove exact published content from discovery without mutation.          |
| Restore Lesson Publication            | Append a permitted restoration record without rewriting original publication history.                   |
| List audit events                     | List paginated audit evidence under restricted authorization.                                           |
| Ingest draft content                  | Create or update a Working Draft; no approval or publication action exists for the service identity.    |

Exact administrative endpoint paths remain pending OpenAPI and authorization review. Published Revisions are created by publication and are not updated through ordinary `PATCH` operations.

The Content Author, Content Reviewer, Publisher, and Platform Administrator capability boundary and default separation policy are approved by ADR-015. Exact provider/RBAC library, assigned production principals, and self-approval exception configuration remain open. Only published, non-withdrawn eligible Lesson Revisions are learner-visible.

## Caching and Conditional Requests

- Authentication responses, learner progress, sync responses, and administrative data use `Cache-Control: no-store` unless a reviewed exception exists.
- Immutable Lesson Revision descriptors and packages may use long-lived immutable caching when addressed by explicit Revision identity and Package Checksum.
- Current lesson metadata uses revalidation and does not claim immutability.
- `ETag` identifies a representation or resource version as documented; clients must not assume it equals the lesson's integer `version`.
- Authorization is evaluated before serving a protected cached representation.

## Rate Limiting and Abuse Handling

- Authentication, content ingestion, administrative actions, catalog reads, downloads, and sync submissions may have different rate limits.
- Rate limits are scoped using the safest available combination of actor, service identity, installation, and network signals without relying on a single spoofable value.
- `429 Too Many Requests` includes a stable error code and `Retry-After` when the server can provide a safe delay.
- Legitimate delayed synchronization must be accommodated through batch and retry policies so ordinary offline recovery is not treated as abuse.
- Exact limits are measurable operational requirements and must be defined before load and release testing.

## OpenAPI Requirements

The maintained OpenAPI specification must include:

- All public MVP routes under `/api/v1`.
- Operation IDs, summaries, authentication requirements, and authorization notes.
- Request and response schemas with examples.
- Required and optional fields, closed enumerations, formats, numeric bounds, and maximum payload sizes.
- Standard success, pagination, and error envelopes.
- Every documented status code.
- Cursor and filtering semantics.
- Idempotency and concurrency headers where supported or required.
- Sync event discriminators, event-specific payload schemas, batch limits, and per-event result schemas.
- Lesson/Variant/Revision, Package Schema Version, profile-version, Reading Position, Package Checksum, and Asset Checksum fields.
- Deprecation markers and compatibility notes.

Generated documentation and shared contracts must be checked for drift from the reviewed OpenAPI source in continuous integration.

## Security and Privacy Requirements

- Validate all path, query, header, and body input at the API boundary.
- Apply object-level and action-level authorization after authentication.
- Use least-privilege service identities; the content engine is draft-only.
- Do not place tokens, credentials, learner data, or full sync payloads in routine logs.
- Protect authentication and administrative endpoints against brute force and abuse.
- Restrict cross-origin access to explicitly approved administration origins; mobile clients do not justify permissive browser CORS.
- Encrypt production traffic and protect token, event, backup, and audit data according to the approved security design.
- Apply documented retention and deletion rules to progress, idempotency records, sessions, audit records, and pseudonymous installation identifiers.
- Return only fields required by the caller's role and workflow.

## Release-Blocking API Decisions

The following must be approved before affected controllers or contracts are implemented:

- Registration credential/provider details, recovery, consent, deletion/retention, and offline-authentication policies.
- Token format, storage, issuer, audience, lifetimes, rotation, revocation, reuse detection, and device/session limits.
- Final lesson package and audio delivery mechanism.
- Exact Language-specific Tokenization Profile rules/test corpora, alignment-generation representation, language-specific pace adjustments, interruption/background handling, and timing tolerances. The zero-based Reading Position and profile-version boundaries are approved by ADR-014.
- Supported Package Schema Version window, canonical-JSON implementation, maximum package/asset sizes, and unsupported-package recovery contract.
- Sync batch size, retry ceilings, idempotency retention, schema evolution, event rejection recovery, event ordering, and multi-device conflict policy.
- Whether server progress summaries are event-derived, session-derived, or separately materialized.
- Exact administrative authentication provider, RBAC/permission library, production capability assignments, self-approval exception configuration, audit-query access, and review-note retention. ADR-015 fixes the actor/workflow boundary.
- Rate limits, payload limits, cache durations, and measurable availability and performance targets.

These decisions must be recorded in the appropriate requirements, architecture documents, security design, or ADRs. They do not authorize application code or controller scaffolding through this document.
