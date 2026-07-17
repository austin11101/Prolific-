# Prolific Domain Glossary

## Document control

| Item            | Value                                                               |
| --------------- | ------------------------------------------------------------------- |
| Status          | Draft for Architecture Gate Review                                  |
| Owner           | TBD                                                                 |
| Review date     | YYYY-MM-DD                                                          |
| Canonical model | [Canonical Domain Model](../architecture/canonical-domain-model.md) |

## Purpose

This is the canonical short-form terminology reference for Prolific. Product, architecture, API, database, mobile, synchronization, analytics, and test documents must use these names consistently. A term's fuller invariants and relationships live in the Canonical Domain Model.

## Actors and access

| Term                   | Canonical definition                                                                                                  | Distinction                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| User                   | Persistent registered learner identity that owns durable learner data and registered capabilities.                    | A Guest Session is not a User. Administrative Actor is not a learner role.                           |
| Registered learner     | Learner represented by a User who may save progress, maintain streaks, download, work offline, and synchronize.       | Registration is optional until an account-only capability is requested.                              |
| Guest learner          | Person using selected public product capabilities without a permanent User account.                                   | Guest progress is temporary and guests cannot download or synchronize.                               |
| Guest Session          | Temporary non-account identity/context for guest trial and current-session state.                                     | It is not a User, registered account, durable progress owner, or synchronization identity.           |
| Administrative Actor   | Authenticated human internal identity with a stable ID and defined administrative capabilities.                       | Separate security context from User; mutable profile/role changes do not rewrite historical actions. |
| Service Actor          | Authenticated non-human identity for a bounded internal service such as the Content Engine.                           | Audited separately from humans; cannot satisfy human review or publication authority.                |
| Content Author         | Internal capability to create Lessons/Variants, edit Working Drafts, attach sources, and submit review.               | Cannot publish or self-approve by default.                                                           |
| Content Reviewer       | Internal capability to decide an exact Review Submission.                                                             | May request changes, reject, or approve; cannot publish without Publisher capability.                |
| Publisher              | Internal capability to publish approved unchanged content and perform authorized visibility actions.                  | Publication authority is separate from review and Platform Administrator status.                     |
| Platform Administrator | Internal capability to manage accounts/roles and permitted platform operations.                                       | Does not automatically bypass editorial separation of duties.                                        |
| Device                 | Pseudonymous application installation association used for registered session context and synchronization provenance. | Not a User, hardware fingerprint, or guest analytics identity.                                       |
| User Preferences       | Validated settings associated with a User, such as language, pace, and accessibility preferences.                     | Preferences do not establish a separate role or account tier.                                        |

## Privacy, deletion, and retention

| Term                     | Canonical definition                                                                                                                      | Distinction                                                                                        |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Data Subject             | Person to whom personal data relates under the applicable approved policy.                                                                | A technical User, Device, or actor record is not automatically the complete person.                |
| Deactivation             | State change preventing new account/actor/service use while preserving required records and references.                                   | Not archive, anonymization, or purge.                                                              |
| Account Deletion Request | Verified privacy workflow request to treat a learner account and associated data under approved policy.                                   | Not an immediate cascade delete; may be pending, blocked, completed, failed, or later cancellable. |
| Anonymization            | Irreversible approved treatment making remaining data not reasonably attributable to the original person.                                 | Pseudonymization alone does not establish anonymization or legal compliance.                       |
| Pseudonymization         | Replacement of direct identifiers while controlled re-identification remains technically possible.                                        | Still potentially personal data; distinct from anonymization.                                      |
| Purge                    | Permanent physical deletion of explicitly eligible data after dependency, audit, policy, and hold checks.                                 | Reserved for genuinely deletable data; not ordinary content/account retirement.                    |
| Retention                | Controlled preservation of data for an approved legal, security, audit, fraud, operational, or product purpose.                           | Does not mean keeping all data forever.                                                            |
| Retention Hold           | Authorized control preventing purge for a documented legal, security, fraud, audit, or operational reason.                                | Does not reactivate or expose the held data.                                                       |
| Privacy Action Record    | Restricted append-only, data-minimized evidence that a privacy request/action, hold, anonymization, deactivation, or purge occurred.      | Excludes copied profiles, credentials, private activity, learner APIs, and offline packages.       |
| Destructive Cascade      | Automatic deletion of dependent records that destroys an aggregate boundary or immutable/historical evidence.                             | Prohibited for historical relationships; temporary dependent data requires explicit justification. |
| Historical Reference     | Stable-ID relationship needed to interpret or prove a past session, publication, review, taxonomy state, sync outcome, or privacy action. | Must survive relevant lifecycle and privacy treatment without relying on mutable names.            |
| Withdrawal               | Authorized removal of a published Lesson Revision from learner visibility through append-only evidence.                                   | Does not mutate/delete the Revision and differs from Variant/taxonomy archive.                     |
| Backup Expiry            | Documented point after which a backup set is destroyed under its separate retention policy.                                               | Backup presence does not make data ordinary queryable product storage.                             |
| Data Minimization        | Limiting collection, duplication, access, and retention to what an approved purpose requires.                                             | Applies to product records, audit, device/network metadata, logs, and backups.                     |

## Taxonomy and language

| Term                    | Canonical definition                                                                                                    | Distinction                                                                                            |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Language                | Supported human language identified canonically by a BCP 47 tag.                                                        | Flags must not represent languages.                                                                    |
| Interface language      | Language used for application controls, navigation, validation, and status messages.                                    | Independent from Lesson Variant content language.                                                      |
| Lesson-content language | Exactly one Language assigned to a Lesson Variant and inherited by its Revisions.                                       | Not every Lesson has a Variant in every active language/difficulty.                                    |
| Tutorial-audio language | Language spoken by Tutorial Audio associated with a Lesson Revision.                                                    | Must match its Variant unless a future reviewed exception is approved.                                 |
| Category                | Stable broad knowledge-area identity used to organize one Topic hierarchy.                                              | Contains Topics, not lesson text directly; its name and lifecycle may change without changing ID.      |
| Topic                   | Stable focused-subject identity in exactly one Category, with zero or one same-Category Parent Topic.                   | May organize child Topics and Lessons; hierarchy depth is finite but not fixed at three.               |
| Canonical Taxonomy Name | Language-neutral Category or Topic name used for governed identity, normalization, and scoped uniqueness.               | Separate from localized learner-visible names and stable UUID identity.                                |
| Localized Display Name  | Language-specific learner-visible label for a Category or Topic.                                                        | Taxonomy localization is separate from Lesson Variant language/content.                                |
| Parent Topic            | Optional immediate Topic above another Topic in the same Category hierarchy.                                            | A Topic has at most one; it cannot be itself or one of its descendants.                                |
| Sibling Topic           | Topic with the same Category and same Parent Topic, including root Topics whose parent is absent.                       | Active Canonical Taxonomy Names are unique within this scope after approved normalization.             |
| Topic Subtree           | A Topic and all of its direct and indirect descendants.                                                                 | Reparenting moves the whole subtree without rewriting Lesson or Reading history.                       |
| Reparenting             | Moving a Topic Subtree beneath a different Parent Topic, or to the root, within the same Category.                      | Cross-Category reparenting is prohibited in the approved boundary.                                     |
| Cycle                   | Invalid Topic ancestry in which a Topic is its own direct or indirect ancestor.                                         | Must be prevented transactionally; path/closure projections are not hierarchy authority.               |
| Discovery Eligibility   | Derived permission for taxonomy/content to appear in learner discovery based on own state, ancestor state, and content. | Not identical to a stored lifecycle state.                                                             |
| Hidden Taxonomy         | Category or Topic intentionally excluded from discovery while retained and referenceable.                               | Hidden is reversible and does not rewrite descendants or history.                                      |
| Archived Taxonomy       | Retired Category or Topic retained for reference and historical integrity.                                              | Normal replacement for deletion once referenced.                                                       |
| Taxonomy Restoration    | Authorized return of hidden or archived taxonomy to a permitted lifecycle state.                                        | Re-evaluates current names, ancestors, descendants, and rules; it does not restore visibility blindly. |
| Effective Visibility    | Derived availability of a Category or Topic after combining its own state with every ancestor's state.                  | An unavailable ancestor does not overwrite a descendant's stored lifecycle state.                      |

## Learning content and publishing

| Term                         | Canonical definition                                                                                                     | Distinction                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| Lesson                       | Stable educational identity of the smallest independently completable guided-reading unit.                               | Does not directly contain learner-facing paragraphs; owns language/difficulty Variants.                |
| Lesson Variant               | Stable identity of one Lesson adaptation in exactly one Language and one Difficulty.                                     | Owns an independent Working Draft and Revision sequence; pace is not part of Variant identity.         |
| Lesson Revision              | Immutable published snapshot of one Lesson Variant, identified by UUID and Variant-scoped revision number.               | Reading Sessions and Offline Lesson Packages reference exactly one Revision.                           |
| Working Draft                | At most one active editable working copy for a Lesson Variant in the MVP.                                                | Saves do not create Revisions or consume Revision Numbers; never learner-visible.                      |
| Review Submission            | Immutable evidence that one exact Working Draft version/checksum was submitted for human review.                         | Later draft edits supersede it; historical submissions are never overwritten.                          |
| Review Decision              | Immutable human reviewer action against one exact Review Submission.                                                     | Types include `changes_requested`, `approved`, `rejected`, and permitted `withdrawn`.                  |
| Approval Evidence            | Exact approved submission/decision, checksums, reviewer, timestamp, and authorization-at-decision evidence.              | Editorial approval is not learner visibility.                                                          |
| Publication Record           | Immutable transactional evidence linking an approval, publishing actor, checksums, and one created Lesson Revision.      | Exactly one creates a Revision; failed publication creates none.                                       |
| Withdrawal Record            | Append-only authorized evidence that published content was removed from discovery or visibility.                         | Does not mutate the Revision or erase original publication/history.                                    |
| Superseding Record           | New immutable record correcting or compensating for an earlier audit fact.                                               | Original evidence remains unchanged and linked.                                                        |
| Separation of Duties         | Policy requiring distinct authorization checks for authoring, review, approval, and publication.                         | Author self-approval is denied by default; explicit exceptions are audited.                            |
| Revision Number              | Positive integer assigned atomically at publication and scoped to one Lesson Variant.                                    | Starts at 1, increments monotonically, is never reused, and is not global identity.                    |
| Current Published Revision   | Zero-or-one Lesson Revision currently exposed for one Lesson Variant.                                                    | Historical Revisions remain immutable and referenceable after the current pointer changes.             |
| Lesson Version               | Superseded term that previously combined Lesson Variant, Working Draft, and Lesson Revision responsibilities.            | Do not use in active design; identify the intended canonical concept instead.                          |
| Difficulty                   | Content-level challenge assigned to a Lesson Variant: Beginner, Intermediate, or Advanced in the MVP.                    | Separate from reading pace/WPM.                                                                        |
| Reading pace                 | Player movement rate selected per Reading Session: Easy 100, Medium 150, or Hard 200 WPM in the MVP.                     | Does not change Variant Difficulty or create a Variant/Revision.                                       |
| Content Block                | Stable-ID ordered unit of Lesson Revision content: `heading`, `paragraph`, `callout`, `fact`, or `quote`.                | Contains exact Canonical Display Text and states whether it participates in reading.                   |
| Canonical Display Text       | Exact learner-visible Unicode text stored in a Content Block.                                                            | Preserved exactly; normalization never replaces it.                                                    |
| Normalized Comparison Text   | Derived form used for deterministic comparison and language-specific tokenization checks.                                | Not learner-visible and not an independent source of content.                                          |
| Reading Unit                 | Word-oriented unit derived from one readable Content Block by a recorded Tokenization Profile.                           | Whitespace is not a unit; eligible units determine word count.                                         |
| Reading Position             | Zero-based contiguous Revision-scoped index for one Reading Unit and its block-relative Display Span.                    | Tutorial alignment, practice progression, completion, and history share this position model.           |
| Display Span                 | Zero-based half-open `[start, end)` range over Unicode scalar values in one block's Canonical Display Text.              | It is block-relative and must reproduce the unit's exact visible text.                                 |
| Tokenization Profile         | Named, Language-aware deterministic rules for deriving Reading Units, normalized forms, positions, and word count.       | Stored with a positive Tokenization Profile Version on the Revision/package.                           |
| Tokenization Profile Version | Positive integer identifying one immutable interpretation of a Tokenization Profile.                                     | Changes when rules would change units, positions, normalized forms, or word count.                     |
| Alignment Profile            | Named and versioned rules/data mapping Tutorial Audio time points to Reading Positions.                                  | Uses the same positions as silent practice; generation details remain deferred.                        |
| Tutorial Audio               | Revision-matched local-playable guided-reading asset and its domain-relevant metadata.                                   | Tutorial time is not practice time and cannot complete a Lesson.                                       |
| Content Source               | Stable description of an origin used to substantiate lesson content.                                                     | Exists independently from how a Lesson Revision cites or adapts it.                                    |
| Lesson Source Attribution    | Contextual link from a Lesson Revision to a Content Source, including citation/rights details for that use.              | Must remain with the immutable Revision and its Offline Lesson Package.                                |
| Package Manifest             | Canonical descriptor of package identity, schema/profile versions, semantic content, assets, attribution, and checksums. | Excludes transport locations and learner/device operational state.                                     |
| Package Schema Version       | Positive integer identifying how an Offline Lesson Package must be interpreted.                                          | Independent of Lesson Revision Number and API/event schema versions.                                   |
| Offline Lesson Package       | Complete immutable learner artifact for one published Lesson Revision, defined by its Package Manifest.                  | A partial or unverified transfer is not available offline; learner state and credentials are excluded. |
| Draft                        | Workflow state of an editable Working Draft.                                                                             | Content engine may create/update drafts but cannot approve or publish.                                 |
| In review                    | Working Draft state awaiting human review.                                                                               | Not learner-visible.                                                                                   |
| Changes Requested            | Immutable Review Decision returning editorial work to editable draft state.                                              | Does not create a Revision or consume a number; resubmission creates new evidence.                     |
| Approved                     | Human review outcome indicating the unchanged Working Draft passed review.                                               | Approval does not make content learner-visible.                                                        |
| Published                    | Successful creation and release of an immutable Lesson Revision from an approved Working Draft.                          | Only published Revisions are learner-visible.                                                          |
| Archived                     | Lesson Variant state removed from new learner discovery while historical Revision references remain.                     | Archive is not destructive deletion.                                                                   |
| Publication                  | Authorized atomic creation of the next Lesson Revision and switch of Current Published Revision.                         | Content engine cannot perform it directly.                                                             |

## Learning activity and progress

| Term                  | Canonical definition                                                                                                       | Distinction                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Reading Session       | Learner attempt involving one exact Lesson Revision through tutorial and practice activity.                                | It is the attempt aggregate, not a Progress Event or sync envelope. |
| Tutorial phase        | Guided audio/highlight activity before practice, including permitted replay.                                               | Never counts as practice or lesson completion.                      |
| Practice phase        | Independent reading activity with no application audio and pace-controlled movement/highlighting.                          | Learner may read aloud independently.                               |
| Completed practice    | Practice that started, reached the final supported token/content position, and was not abandoned or exited early.          | Tutorial completion and partial practice do not qualify.            |
| Reading Session Event | Append-only phase, position, or state fact inside one Reading Session.                                                     | Not automatically sent through synchronization.                     |
| Progress Event        | Immutable registered-learner progress fact produced from learning activity and eligible for synchronization.               | Not the Reading Session itself and not the Outbox Event envelope.   |
| User Progress         | Derived registered-learner read model of lessons completed, practice reading time, words read, and recent sessions.        | Not authoritative immutable session history.                        |
| Daily Streak          | Derived current/longest consecutive local-day qualification from at least one completed practice per applicable local day. | Not a badge, achievement, leaderboard, or competitive rank.         |

## Synchronization

| Term         | Canonical definition                                                                                        | Distinction                                                                        |
| ------------ | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Outbox Event | Durable local record wrapping an immutable Progress Event with stable ID, retry, and acknowledgement state. | It is the local queue entity, not the domain attempt.                              |
| Sync Event   | A Progress Event represented in the synchronization contract with a stable event ID.                        | Reuses the same ID on retry; it is not a generic Reading Session Event.            |
| Sync Request | Transport batch containing one or more immutable sync event envelopes.                                      | Not a domain aggregate or evidence of acceptance.                                  |
| Sync Receipt | Durable server evidence of the outcome for one event ID.                                                    | Enables accepted, duplicate, rejected, or retryable per-event results.             |
| Sync Cursor  | Opaque checkpoint for incremental synchronization/reconciliation.                                           | Not a timestamp or completion indicator unless the contract explicitly defines it. |
| Accepted     | New event and domain outcome were durably stored.                                                           | Client may mark that event synchronized.                                           |
| Duplicate    | Same event ID and payload were already durably processed.                                                   | Returns the same effective outcome without duplicate session/progress creation.    |
| Rejected     | Event is permanently invalid under the current contract/policy.                                             | Must remain durable until the documented recovery/loss-risk workflow resolves it.  |
| Retryable    | Event could not safely complete yet but may be retried with its original ID.                                | Per-event outcome, not only a transport failure.                                   |
| Synchronized | Server durably acknowledged the specific event as accepted or duplicate.                                    | A sent request or transport success alone is not synchronized.                     |

## Integrity and modelling

| Term                   | Canonical definition                                                                             | Distinction                                                                           |
| ---------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Package Checksum       | `sha256:<lowercase-hex>` integrity value over ADR-014's canonical semantic package inputs.       | Reproducible for identical inputs; never substitutes for Revision identity.           |
| Asset Checksum         | `sha256:<lowercase-hex>` integrity value over the exact bytes of one package asset.              | Verified separately from the Package Checksum.                                        |
| Integrity State        | Local verification result: `unverified`, `verifying`, `verified`, `corrupt`, or `unsupported`.   | Only `verified` packages may become offline-ready.                                    |
| Checksum               | General integrity-value category.                                                                | Use Package Checksum or Asset Checksum when the exact meaning matters.                |
| Optimistic Concurrency | Edit policy requiring a command to supply the Working Draft version it expects before mutation.  | Prevents silent last-write-wins; exact token representation is deferred.              |
| Concurrency Conflict   | Explicit result when an expected draft version/state is stale or a concurrent publication loses. | Caller must reload current state; the rejected operation creates no partial Revision. |
| Aggregate              | Consistency boundary whose root protects invariants for changes made together.                   | Does not imply one table, one module, or loading every related record.                |
| Domain event           | Immutable statement that a meaningful domain fact occurred.                                      | Does not require a message broker or event-sourced database.                          |
| Read model             | Derived query/display view rebuildable from authoritative facts.                                 | Must not replace immutable history or idempotency receipts.                           |
| Transport contract     | Request/response representation crossing device or service boundaries.                           | Must not be treated automatically as a domain entity or database table.               |

## Usage rules

- Use **Lesson** for stable educational identity, **Lesson Variant** for one Language/Difficulty stream, **Working Draft** for editable content, and **Lesson Revision** for exact published content.
- Use **difficulty** for content challenge and **reading pace** for WPM/player movement.
- Use **approved** for passed review and **published** for learner visibility.
- Use **tutorial** for guided audio and **practice** for independent application-silent reading.
- Use **Reading Session Event** for internal attempt chronology, **Progress Event** for learner progress facts, and **Sync Event/Outbox Event** for transfer/queue representations.
- Use **User** only for a persistent registered learner; use **Guest Session** for temporary guest context.
- Use **Content Source** for the origin and **Lesson Source Attribution** for its Revision-specific citation/use.
