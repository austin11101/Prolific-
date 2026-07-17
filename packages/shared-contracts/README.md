# Prolific Shared Contract Specifications

This workspace contains language-neutral JSON Schema specifications. It does not contain generated Dart or TypeScript models and is not an npm workspace.

## Specifications

| Contract                                                      | Schema identifier                                             | Purpose                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| [Lesson package](./specifications/lesson-package.schema.json) | `https://prolific.example/schemas/lesson-package.schema.json` | One immutable, verified published Lesson Revision package  |
| [Sync request](./specifications/sync-request.schema.json)     | `https://prolific.example/schemas/sync-request.schema.json`   | One registered Device's bounded outbox submission          |
| [Sync response](./specifications/sync-response.schema.json)   | `https://prolific.example/schemas/sync-response.schema.json`  | Per-event partial-success outcomes and safe server updates |
| [API error](./specifications/api-error.schema.json)           | `https://prolific.example/schemas/api-error.schema.json`      | Stable machine-readable API failure envelope               |

The `$id` host is a stable namespace, not a production endpoint or hosting-provider choice. All schemas use JSON Schema Draft 2020-12, reject unspecified properties, and include examples. UUIDs are strings with `format: uuid`; timestamps are UTC `date-time` strings and must use a `Z` suffix where the schema pattern requires it.

## Authority and evolution

- Product and domain meaning comes from the [PRD](../../docs/01-product-vision/product-requirements-document.md), [canonical model](../../docs/architecture/canonical-domain-model.md), and ADR-011 through ADR-017.
- Package semantics and checksum inclusions/exclusions come from [ADR-014](../../docs/decisions/ADR-014-use-structured-content-blocks-and-revision-packages.md) and the [Offline Lesson Package](../../docs/05-mobile-app/offline-lesson-package.md).
- Synchronization behavior comes from the [API Overview](../../docs/08-api-specification/api-overview.md) and [Sync Service](../../docs/06-core-backend/sync-service.md).
- A schema change is reviewed for backward compatibility. Breaking interpretation changes increment the relevant positive schema version; changing a JSON Schema file alone never mutates a published Lesson Revision.
- Examples are illustrative valid instances, not test credentials, production identifiers, or final capacity limits.

## Validation

Sprint 1 validates schema documents against Draft 2020-12 meta-schema rules and validates each embedded example against its containing schema. Sprint 2 must select and pin the repository validator before generated/runtime contract validation is added. Duplicate `$id` values are prohibited.
