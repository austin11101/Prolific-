# Prolific API Overview

## Purpose

This document defines the MVP-level conventions and resource boundaries for the Prolific core REST API. It covers API versioning, request and response formats, authentication, pagination, errors, idempotency, content versioning, offline synchronization events, and endpoint groups.

The OpenAPI document will be the machine-readable contract. This overview defines the rules that the OpenAPI document and future controllers must follow; it does not implement controllers or settle product policies that remain explicitly unresolved elsewhere.

## API Principles

The MVP API must be:

* **Versioned:** Every public route begins with `/api/v1`.
* **Contract first:** Public operations and schemas are maintained in OpenAPI and reviewed before implementation diverges from them.
* **Offline safe:** Client-created records use stable UUIDs, delayed events can be retried, and acknowledgements are explicit.
* **Consistent:** Success, pagination, validation, and error structures do not vary by controller.
* **Secure by default:** Authentication and authorization are enforced at resource and action boundaries, and internal failures are not exposed.
* **Content-version aware:** Lesson metadata, text, alignment data, and audio are tied to one immutable content version.
* **Observable:** Every response has a request identifier suitable for support and server-side correlation without exposing sensitive data.

## Base URL and Versioning

All public MVP endpoints use this path prefix:

```text
/api/v1
```

Rules:

* The major API version is encoded in the URL.
* Additive, backward-compatible changes may be released within `v1`.
* Removing a field, changing its meaning or type, tightening a previously valid input, or changing a state transition requires a new major version unless an explicitly documented migration preserves compatibility.
* Clients must ignore unknown response fields but must not send undocumented request fields.
* Deprecated fields and operations remain documented for their support period and include a documented replacement.
* Versioning of the API is separate from lesson content versioning and sync event schema versioning.

## Transport and Serialization Conventions

### Protocol and media types

* Production traffic uses HTTPS only.
* JSON requests use `Content-Type: application/json`.
* Clients send `Accept: application/json` for JSON resources.
* Binary lesson or audio delivery may use an appropriate immutable media type or a time-limited download location, as defined by the content-delivery architecture.
* JSON is encoded as UTF-8.

### Naming and values

* JSON property names use `camelCase`.
* URL path segments use lowercase plural resource names and kebab-case only when multiple words are required.
* Resource identifiers are UUID strings in canonical hyphenated form.
* Client-created offline identifiers use UUIDs generated before the first submission.
* Timestamps use UTC ISO 8601 with a `Z` suffix, for example `2026-07-13T09:15:30.000Z`.
* Date-only values, if introduced, use `YYYY-MM-DD` and must not be interpreted as timestamps.
* Language identifiers use documented BCP 47 language tags. The launch-language set remains a product decision.
* Enumerations use lowercase `snake_case` values and are closed unless the schema explicitly states otherwise.
* Monetary floating-point values are not part of the MVP. Other decimal values must define precision in OpenAPI and must not rely on binary floating-point equality.
* Boolean values are JSON `true` or `false`, never strings or integers.
* Absent optional data is omitted unless the schema requires an explicit `null`. A client must not treat omitted and `null` values as interchangeable unless the field contract says so.

### Request headers

| Header | Use |
| --- | --- |
| `Authorization: Bearer <access-token>` | Required for authenticated operations. |
| `Accept` | Requested response media type. |
| `Content-Type` | Request-body media type. |
| `X-Request-Id` | Optional caller-generated UUID for correlation; the server validates or replaces invalid values. |
| `Idempotency-Key` | Stable UUID for supported retryable mutation operations outside the sync envelope. |
| `If-Match` | Required where an administrative update uses optimistic concurrency. |
| `Accept-Language` | Optional interface-message preference; it does not replace explicit lesson-language filters. |

### Response headers

| Header | Use |
| --- | --- |
| `X-Request-Id` | Server-confirmed request identifier returned on success and error responses. |
| `ETag` | Version identifier for cacheable or concurrency-controlled resources. |
| `Cache-Control` | Explicit caching policy for metadata, immutable content, and sensitive responses. |
| `Retry-After` | Delay before retry when applicable to throttling or temporary unavailability. |
| `Deprecation` and `Sunset` | Deprecation metadata when an operation has a planned retirement. |

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

| Parameter | Type | Rule |
| --- | --- | --- |
| `limit` | Integer | Optional page size; default `20`, minimum `1`, maximum `100`. |
| `cursor` | String | Optional opaque cursor returned by the preceding response. Clients must not parse or construct it. |

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

* `data` is always an array, including when empty.
* `nextCursor` is `null` when no next page exists.
* `hasMore` indicates whether another page was known at response time.
* Ordering must be deterministic and include a unique tie-breaker.
* The API does not promise a total count unless a specific endpoint documents one.
* Invalid, expired, or mismatched cursors return a safe `400` error with code `invalid_cursor`.
* Clients deduplicate accumulated items by stable resource ID; the server must not intentionally repeat items within one cursor traversal.

## Filtering, Sorting, and Search

* Filters use explicit query parameters such as `language`, `topicId`, `difficulty`, and `status` where authorized.
* Repeating a documented filter parameter represents multiple allowed values only when the endpoint schema explicitly supports it.
* Sort fields use `sort`, with a leading `-` for descending order, for example `sort=-updatedAt`. Every endpoint exposes only an allow-list of sort fields.
* Learner catalog operations expose only learner-eligible content and do not accept administrative status overrides.
* Free-text search is not assumed for the MVP unless added to the approved endpoint contract.

## Authentication and Authorization

### Token model

The API uses access and refresh tokens:

* An access token is short-lived and is sent as a bearer token to authenticated resource endpoints.
* A refresh token is longer-lived, used only at the refresh operation, rotated after successful use, and revocable.
* Refresh tokens are never accepted as bearer credentials for ordinary API operations.
* Token material must not appear in URLs, logs, error details, analytics, or response bodies outside the authentication operations that issue it.
* Stored server-side refresh credentials or token families must be protected so a database read does not expose reusable plaintext tokens.
* Reuse of an invalidated rotated refresh token must follow the approved session-compromise policy.

Token format, signing or reference-token design, issuer, audience, access lifetime, refresh lifetime, rotation grace, and device/session limits require a security decision before implementation.

### Authentication operations

The MVP authentication group provides the operations required by the approved account model:

| Operation | Purpose |
| --- | --- |
| `POST /api/v1/auth/login` | Exchange approved credentials for an access and refresh token pair. |
| `POST /api/v1/auth/refresh` | Rotate a valid refresh token and issue a new token pair. |
| `POST /api/v1/auth/logout` | Revoke the current refresh token or session. |
| `GET /api/v1/auth/session` | Return the current authenticated actor and authorized role context. |

Registration, recovery, verification, guardian consent, guest access, and external identity endpoints are not defined until the account policy is approved.

### Authorization

* Authentication and authorization are separate checks.
* Every protected endpoint declares its permitted actor types, roles, and resource scope in OpenAPI and the authorization matrix.
* Learners can access only their own progress and the learner-visible content catalog.
* Administrative content actions require the role assigned to the specific lifecycle transition.
* The content engine uses a distinct service identity with draft-ingestion permission only; it cannot approve or publish.
* Object-level authorization is enforced even when a caller knows a valid UUID.
* Authorization failures do not reveal whether an inaccessible resource exists when doing so would disclose sensitive information.

### Authentication failures and offline data

* Missing or invalid access credentials return `401 Unauthorized` with a stable machine-readable code.
* Valid authentication without permission returns `403 Forbidden`.
* A refresh failure does not instruct the mobile client to delete downloaded lessons or unsynced progress.
* Continued offline access after token expiry follows the separately approved offline-authentication policy.

## Error Responses

All JSON errors use one envelope:

```json
{
  "error": {
    "code": "validation_failed",
    "message": "The request could not be processed.",
    "details": [
      {
        "field": "events[0].eventId",
        "code": "invalid_uuid",
        "message": "Must be a valid UUID."
      }
    ],
    "requestId": "9715aa3e-aed3-4da8-bf4a-50e939a68d8d"
  }
}
```

Rules:

* `code` is stable, machine-readable, and uses lowercase `snake_case`.
* `message` is safe for display or support context but is not the sole basis for client logic.
* `details` is optional and contains only safe structured information.
* Validation fields use a documented path notation and never echo secrets or unsafe raw input.
* `requestId` matches the `X-Request-Id` response header.
* Stack traces, SQL, table names, internal hostnames, dependency errors, token contents, and secrets are never exposed.
* Unknown server failures use code `internal_error` and a generic message.

### Status-code conventions

| Status | Meaning |
| --- | --- |
| `400 Bad Request` | Malformed JSON, invalid query syntax, invalid cursor, or request-level validation failure. |
| `401 Unauthorized` | Authentication is missing, invalid, or expired. |
| `403 Forbidden` | The actor is authenticated but not authorized. |
| `404 Not Found` | The resource is absent or its existence must not be disclosed. |
| `409 Conflict` | State transition, idempotency payload, version, or concurrency conflict. |
| `412 Precondition Failed` | An `If-Match` precondition does not match the current resource. |
| `413 Payload Too Large` | Request or sync batch exceeds its documented limit. |
| `415 Unsupported Media Type` | Request media type is unsupported. |
| `422 Unprocessable Content` | JSON is structurally valid but violates domain rules that are not request-syntax errors. |
| `429 Too Many Requests` | Rate limit exceeded; include `Retry-After` when known. |
| `500 Internal Server Error` | Unexpected server failure with no internal detail exposed. |
| `503 Service Unavailable` | Temporary dependency or service outage; include retry guidance when safe. |

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

* The key is a caller-generated UUID scoped to the authenticated actor and operation.
* The same key and canonical request returns the original status and response.
* The same key with a different request returns `409 idempotency_conflict`.
* The server stores no raw secret-bearing request data merely to support idempotency.
* Operations using `If-Match` for concurrency control may also require an idempotency key when a network retry could repeat a side effect.

### Retention

Idempotency records must be retained longer than the maximum supported offline delay and retry period. The actual retention duration, cleanup strategy, storage limits, and behaviour for an event older than the supported window are release-blocking sync-policy decisions.

## Content Versioning

### Identity model

* `lessonId` is the stable UUID for the logical lesson across revisions.
* `version` is an immutable positive integer that increases for each released lesson revision.
* A lesson version's text, metadata, alignment data, and audio references are immutable after learner eligibility.
* Correcting learner-eligible content creates a new version; it does not mutate a downloaded version in place.
* Every lesson package has a SHA-256 checksum represented as `sha256:<lowercase-hex>`.
* Individual binary assets expose their own integrity metadata when they are transferred separately.

### Versioned lesson descriptor

```json
{
  "data": {
    "lessonId": "4bf2f788-62d7-4a7f-bf24-bdc1079d7d13",
    "version": 3,
    "title": "Example lesson",
    "language": "en-ZA",
    "difficulty": "easy",
    "wordCount": 320,
    "estimatedReadingSeconds": 160,
    "package": {
      "checksum": "sha256:0123456789abcdef",
      "contentLength": 123456,
      "downloadUrl": "https://download-location.example/immutable-package"
    },
    "createdAt": "2026-07-13T09:15:30.000Z",
    "updatedAt": "2026-07-13T09:15:30.000Z"
  }
}
```

The example illustrates the contract shape, not a production hostname or final package transport. The content-delivery architecture must decide whether the API streams packages or returns time-limited download locations.

### Download and cache rules

* The learner catalog returns the current learner-eligible version for each logical lesson.
* A client requests an explicit version and verifies its checksum before marking it offline-ready.
* Version-specific resources use immutable caching and stable `ETag` values.
* A current-version lookup may change and must use revalidation-appropriate cache headers.
* The client never combines text, alignment, metadata, or audio from different versions.
* A failed update does not invalidate the last verified local version unless policy explicitly marks that version unusable.
* Sync events always include the exact `lessonVersion` used during the session.
* Archival removes a lesson from new learner discovery but does not silently make an existing local package or unsynced event uninterpretable; revocation behaviour for safety or legal removal requires a documented policy.

### Publication visibility

Learner endpoints return only content that satisfies the approved learner-visibility rule. The content lifecycle contains `draft`, `in_review`, `approved`, `published`, and `archived`; the exact distinction between `approved` and `published` for learner visibility remains a release-blocking product decision.

Administrative APIs expose lifecycle status only to authorized roles. The content engine can create or update drafts but cannot transition content to an approval or publication state.

## Synchronization Event Contract

### Event envelope

Every event is immutable after it enters the local outbox. The MVP envelope is:

```json
{
  "eventId": "8d8ecce8-c932-4512-a2d0-840a2b40c8ee",
  "schemaVersion": 1,
  "eventType": "practice_completed",
  "occurredAt": "2026-07-13T09:15:30.000Z",
  "installationId": "bd9678f3-6c04-4cc5-b3bd-20eb1f86ac2d",
  "sessionId": "82db7834-b45a-49eb-86b8-ef34f3a8bb81",
  "sequence": 4,
  "lessonId": "4bf2f788-62d7-4a7f-bf24-bdc1079d7d13",
  "lessonVersion": 3,
  "mode": "practice",
  "payload": {
    "pacePreset": "medium",
    "wordsPerMinute": 120,
    "positionIndex": 319,
    "elapsedMilliseconds": 162500,
    "completed": true
  }
}
```

The numerical values are examples, not approved pace or completion thresholds.

### Envelope fields

| Field | Requirement |
| --- | --- |
| `eventId` | Required client-generated UUID and stable idempotency key. |
| `schemaVersion` | Required positive integer identifying the event schema, independent of API and lesson versions. |
| `eventType` | Required closed enumeration defined below. |
| `occurredAt` | Required client-observed UTC timestamp; informative, not the sole ordering authority. |
| `installationId` | Required pseudonymous installation UUID used for device-local ordering and conflict analysis; it must not embed device hardware identifiers. |
| `sessionId` | Required client-generated UUID shared by events belonging to one tutorial or practice session. |
| `sequence` | Required non-negative integer that increases within one session; the server still handles delayed or repeated delivery. |
| `lessonId` | Required stable lesson UUID. |
| `lessonVersion` | Required exact positive integer version used by the player. |
| `mode` | Required `tutorial` or `practice`. It must agree with `eventType`. |
| `payload` | Required event-specific object validated by `eventType` and `schemaVersion`. |

### Event types

The MVP event-type set is:

* `tutorial_started`
* `tutorial_progressed`
* `tutorial_completed`
* `practice_started`
* `practice_progressed`
* `practice_completed`

Tutorial completion and practice completion remain distinct. A `tutorial_completed` event must never be interpreted as lesson completion.

### Progress payload

The initial event schema supports:

| Field | Requirement |
| --- | --- |
| `pacePreset` | Required `easy`, `medium`, or `hard`. |
| `wordsPerMinute` | Required positive integer containing the actual internal pace used for this session. |
| `positionIndex` | Required non-negative index into the lesson version's canonical alignment sequence. |
| `elapsedMilliseconds` | Required non-negative active elapsed time according to the approved player timing model. |
| `completed` | Required boolean; valid completion depends on the approved mode-specific completion rules. |

Additional event-specific fields must be added through a schema-versioned, backward-compatible contract. Free-form arbitrary payload properties are not accepted.

### Batch submission

The mobile client submits one or more events:

```json
{
  "events": [
    {
      "eventId": "8d8ecce8-c932-4512-a2d0-840a2b40c8ee",
      "schemaVersion": 1,
      "eventType": "practice_completed",
      "occurredAt": "2026-07-13T09:15:30.000Z",
      "installationId": "bd9678f3-6c04-4cc5-b3bd-20eb1f86ac2d",
      "sessionId": "82db7834-b45a-49eb-86b8-ef34f3a8bb81",
      "sequence": 4,
      "lessonId": "4bf2f788-62d-4a7f-bf24-bdc1079d7d13",
      "lessonVersion": 3,
      "mode": "practice",
      "payload": {
        "pacePreset": "medium",
        "wordsPerMinute": 120,
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

A structurally valid batch returns one result for every submitted event:

```json
{
  "data": {
    "results": [
      {
        "eventId": "8d8ecce8-c932-4512-a2d0-840a2b40c8ee",
        "status": "accepted",
        "acknowledgedAt": "2026-07-13T09:16:02.000Z",
        "sessionRecordId": "6d35df55-1daf-4071-a599-998ca6560801"
      }
    ]
  }
}
```

Per-event `status` values are:

| Status | Meaning | Client outbox action |
| --- | --- | --- |
| `accepted` | A new event and its domain outcome were durably stored. | Mark synchronized. |
| `duplicate` | The same event and payload were already durably processed. | Mark synchronized using the returned original outcome. |
| `rejected` | The event is permanently invalid under the current contract. | Preserve until the documented rejection workflow records or resolves the loss risk. |
| `conflict` | A lesson-version, ordering, identity, or policy conflict needs the documented deterministic outcome. | Preserve until resolution is durably acknowledged. |

Rules:

* A valid batch request uses `200 OK` even when individual results include `rejected` or `conflict`; the client relies on each result.
* A malformed batch envelope that cannot be safely enumerated uses the standard request-level error response.
* Results correspond to event IDs, not array position alone.
* `acknowledgedAt` is the server's durable acknowledgement timestamp.
* A duplicate returns the same effective domain outcome as the original processing.
* A server must not return `accepted` before the event, domain outcome, and idempotency record are durably committed.
* Partial infrastructure failure leaves uncertain events safe to retry with their original IDs.

### Ordering and conflicts

* `sequence` provides device-session intent but is not proof that all earlier events will arrive first.
* The server records its own receipt and processing timestamps.
* The server must not use `occurredAt` as its sole ordering or authorization authority because device clocks can be wrong.
* Events from multiple sessions or installations remain distinct through UUIDs.
* Out-of-order events, missing earlier sequence values, changed lesson versions, repeated completions, multiple devices, and permanently rejected events require a documented domain conflict policy.
* No conflict policy may silently discard local progress.

## Optimistic Concurrency

Administrative resource updates and lifecycle transitions must prevent accidental overwrites:

* A resource representation exposes an `ETag` derived from its current server version.
* A protected update or transition requires `If-Match` when concurrent edits are possible.
* A stale `If-Match` returns `412 Precondition Failed` without applying the change.
* A domain-invalid transition returns `409 Conflict` or `422 Unprocessable Content` according to the documented state-machine contract.
* Successful lifecycle changes record actor, previous state, resulting state, and UTC timestamp in the audit trail.

## Endpoint Groups

The table defines the MVP resource groups. Exact request and response schemas, filters, permissions, and operation IDs belong in OpenAPI.

| Group | Route prefix | Purpose | Authentication |
| --- | --- | --- | --- |
| Service status | `/api/v1/health` | Liveness or readiness information appropriate for the caller. | Public exposure must be minimal; detailed readiness is operationally restricted. |
| Authentication | `/api/v1/auth` | Login, token refresh, logout, and current-session context. | Varies by operation. |
| Languages | `/api/v1/languages` | Supported languages that currently have learner-eligible content. | Authenticated learner or approved public catalog policy. |
| Topics | `/api/v1/topics` | Paginated learner-visible topics filtered by language. | Authenticated learner. |
| Lessons | `/api/v1/lessons` | Paginated learner catalog, lesson metadata, current version, and version-specific download descriptor. | Authenticated learner. |
| Learner profile | `/api/v1/me` | Current learner identity and approved preferences. | Authenticated learner. |
| Learner progress | `/api/v1/me/progress` | Server-acknowledged progress summaries; not a replacement for sync submission. | Authenticated learner, own data only. |
| Synchronization | `/api/v1/sync/events` | Idempotent batch submission and per-event durable acknowledgement. | Authenticated learner. |
| Admin lessons | `/api/v1/admin/lessons` | Draft review, validation, lifecycle transitions, version management, and archival. | Authorized administrative role. |
| Admin audit | `/api/v1/admin/audit-events` | Paginated administrative audit records. | Restricted administrative or audit role. |
| Content ingestion | `/api/v1/content-ingestion/lessons` | Validated creation or update of drafts by the content engine. | Dedicated service identity; draft-only authorization. |

### Representative lesson operations

| Method and path | Purpose |
| --- | --- |
| `GET /api/v1/languages` | List supported languages with learner-eligible content. |
| `GET /api/v1/topics?language={tag}` | List paginated learner-visible topics for a language. |
| `GET /api/v1/lessons` | List paginated learner-visible lesson metadata using documented filters. |
| `GET /api/v1/lessons/{lessonId}` | Return learner-visible metadata and the current eligible version. |
| `GET /api/v1/lessons/{lessonId}/versions/{version}` | Return the immutable version descriptor and package integrity metadata. |
| `GET /api/v1/lessons/{lessonId}/versions/{version}/download` | Return or authorize retrieval of the immutable package. |

### Representative synchronization operations

| Method and path | Purpose |
| --- | --- |
| `POST /api/v1/sync/events` | Submit a batch of immutable offline events and receive per-event results. |
| `GET /api/v1/me/progress` | Read server-acknowledged progress summaries for reconciliation and display. |

No endpoint is required to check an event before submitting it; safely retrying the same event ID is the normal recovery path. A separate event-status lookup may be added only if a documented recovery case requires it.

### Representative administrative operations

| Method and path | Purpose |
| --- | --- |
| `GET /api/v1/admin/lessons` | List content visible to the authorized administrative role. |
| `POST /api/v1/admin/lessons` | Create a draft through an authorized administrative workflow. |
| `GET /api/v1/admin/lessons/{lessonId}` | Read full administrative lesson metadata and lifecycle state. |
| `PATCH /api/v1/admin/lessons/{lessonId}` | Update permitted draft fields with validation and concurrency control. |
| `POST /api/v1/admin/lessons/{lessonId}/transitions` | Request an authorized lifecycle transition with idempotency and `If-Match`. |
| `GET /api/v1/admin/audit-events` | List paginated audit events under restricted authorization. |
| `POST /api/v1/content-ingestion/lessons` | Ingest validated content as `draft`; no approval or publication action exists for the service identity. |

The exact lifecycle-transition role matrix and the learner-visibility distinction between `approved` and `published` must be approved before these administrative operations are implemented.

## Caching and Conditional Requests

* Authentication responses, learner progress, sync responses, and administrative data use `Cache-Control: no-store` unless a reviewed exception exists.
* Immutable lesson-version descriptors and packages may use long-lived immutable caching when addressed by explicit version and checksum.
* Current lesson metadata uses revalidation and does not claim immutability.
* `ETag` identifies a representation or resource version as documented; clients must not assume it equals the lesson's integer `version`.
* Authorization is evaluated before serving a protected cached representation.

## Rate Limiting and Abuse Handling

* Authentication, content ingestion, administrative actions, catalog reads, downloads, and sync submissions may have different rate limits.
* Rate limits are scoped using the safest available combination of actor, service identity, installation, and network signals without relying on a single spoofable value.
* `429 Too Many Requests` includes a stable error code and `Retry-After` when the server can provide a safe delay.
* Legitimate delayed synchronization must be accommodated through batch and retry policies so ordinary offline recovery is not treated as abuse.
* Exact limits are measurable operational requirements and must be defined before load and release testing.

## OpenAPI Requirements

The maintained OpenAPI specification must include:

* All public MVP routes under `/api/v1`.
* Operation IDs, summaries, authentication requirements, and authorization notes.
* Request and response schemas with examples.
* Required and optional fields, closed enumerations, formats, numeric bounds, and maximum payload sizes.
* Standard success, pagination, and error envelopes.
* Every documented status code.
* Cursor and filtering semantics.
* Idempotency and concurrency headers where supported or required.
* Sync event discriminators, event-specific payload schemas, batch limits, and per-event result schemas.
* Lesson-version and integrity fields.
* Deprecation markers and compatibility notes.

Generated documentation and shared contracts must be checked for drift from the reviewed OpenAPI source in continuous integration.

## Security and Privacy Requirements

* Validate all path, query, header, and body input at the API boundary.
* Apply object-level and action-level authorization after authentication.
* Use least-privilege service identities; the content engine is draft-only.
* Do not place tokens, credentials, learner data, or full sync payloads in routine logs.
* Protect authentication and administrative endpoints against brute force and abuse.
* Restrict cross-origin access to explicitly approved administration origins; mobile clients do not justify permissive browser CORS.
* Encrypt production traffic and protect token, event, backup, and audit data according to the approved security design.
* Apply documented retention and deletion rules to progress, idempotency records, sessions, audit records, and pseudonymous installation identifiers.
* Return only fields required by the caller's role and workflow.

## Release-Blocking API Decisions

The following must be approved before affected controllers or contracts are implemented:

* Account registration, recovery, guest, consent, deletion, and offline-authentication policies.
* Token format, storage, issuer, audience, lifetimes, rotation, revocation, reuse detection, and device/session limits.
* Learner-visible interpretation of `approved` and `published` content.
* Final lesson package and audio delivery mechanism.
* Alignment representation, canonical position indexing, pace values, and completion rules.
* Sync batch size, retry ceilings, idempotency retention, schema evolution, event rejection recovery, event ordering, and multi-device conflict policy.
* Whether server progress summaries are event-derived, session-derived, or separately materialized.
* Administrative roles and permitted content lifecycle transitions.
* Rate limits, payload limits, cache durations, and measurable availability and performance targets.

These decisions must be recorded in the appropriate requirements, architecture documents, security design, or ADRs. They do not authorize application code or controller scaffolding through this document.
