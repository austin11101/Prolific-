# Privacy Architecture

## Purpose

Define privacy-by-design boundaries for the MVP without prescribing legal advice, statutory timeframes, or implementation tooling.

## Principles

- Collect the minimum data needed for an approved purpose.
- Separate learner identity from learning activity where practical.
- Prefer lifecycle state, detachment, aggregation, and anonymization to destructive history loss.
- Pseudonymization is reversible under controlled conditions and is not automatically anonymization.
- Preserve exact content/history meaning while removing unnecessary personal attribution.
- Guest data remains non-account data, short-lived by policy, and is never silently attached to registration.
- Privacy evidence proves treatment without copying the deleted profile or private activity.

## Account deletion expectations

A verified request deactivates the account early, revokes sessions/device authority, checks unsynchronized data and Retention Holds, treats direct identifiers, detaches or pseudonymizes lawfully retained activity, and records completion. The workflow may be asynchronous and expose requested, pending, blocked, completed, or failed status. Deleted learners no longer receive progress/history views.

Late offline events cannot recreate the account or reattach activity. Client behavior must explain pending outbox consequences without silently discarding data where avoidable.

## Access and transparency

Learners access only their own active-account data. Administrative access to learner activity is not implied by content roles and requires a separately approved purpose/capability with access logging. Internal Privacy Action Records, audit notes, and retained anonymized activity are excluded from learner catalog/package APIs.

`taxonomy_change_records` is restricted operational audit data and may remain pseudonymous through its stable actor reference. It is excluded from public APIs, learners, anonymous users, normal content reads, analytics, default operational-reader access, and unauthorized exports. It contains no arbitrary narrative/JSON, identity labels, request/response bodies, or personal-data-bearing reason/command values. Corrections form a one-successor linear chain and preserve every original record. Migration one preserves it without automated deletion or expiry while the final governance/legal retention schedule remains pending; this interim rule does not claim permanent retention and must later cover backups and operational copies.

## Unresolved policy

Consent and child safeguarding, legal basis, request verification/recovery, export/correction procedure, completion timeframe, exact retention, anonymization testing, IP/device treatment, backup expiry, guest analytics, and accountable privacy owner require specialist approval before affected release work.
