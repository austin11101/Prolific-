# ADR-016: Use Category and Hierarchical Topic Taxonomy

## Status

Accepted; taxonomy lifecycle amended by FPSD-013 on 2026-07-17

## Decision date

YYYY-MM-DD

## Owner

TBD

## Review date

YYYY-MM-DD

## Related records

- Architecture Gate condition: [AG-005](../reviews/ARCHITECTURE-GATE-001.md#required-conditions)
- Product requirements: [Product Requirements Document](../01-product-vision/product-requirements-document.md)
- Domain authority: [Canonical Domain Model](../architecture/canonical-domain-model.md)
- Terminology: [Domain Glossary](../02-requirements/domain-glossary.md)
- Database design: [Conceptual ERD](../07-database/erd.md) and [Database Overview](../07-database/database-overview.md)
- API guidance: [API Overview](../08-api-specification/api-overview.md)
- Gate evidence: [Architecture Gate 001](../reviews/ARCHITECTURE-GATE-001.md)

## Context

Taxonomy identity cannot safely depend on mutable names or path strings. Without explicit ownership, naming scope, cycle prevention, reparenting, lifecycle, and restoration rules, Topic moves can corrupt ancestry, duplicate sibling names, expose retired content, or silently rewrite historical Lesson and Reading Session interpretation. Multilingual display names must evolve without creating duplicate taxonomy identities, and learner discovery must remain simple even when the domain permits future growth.

## Decision

The taxonomy model is:

```text
Category
-> Topic
-> optional child Topic
-> Lesson
```

- Category is the top-level knowledge grouping and never stores Lesson content directly.
- Every Topic belongs to exactly one Category and has zero or one Parent Topic.
- Parent and child Topics belong to the same Category.
- The Topic hierarchy is an acyclic tree/forest of arbitrary finite depth.
- MVP interfaces normally expose no more than three visible levels for usability, but clients never assume fixed depth.
- Every Lesson belongs to exactly one Topic.

### Category identity, metadata, and naming

A Category has stable Category ID, Canonical Taxonomy Name, localized display names/descriptions, icon reference, explicit display order, lifecycle state, UTC created/updated timestamps, and optional archive metadata.

- Category ID, not name, is the relationship key.
- Canonical Taxonomy Name is stable internal metadata; changing a localized name or icon does not change identity or historical references.
- Localized names do not create new Categories.
- Active normalized canonical Category names are unique.
- Canonical-name normalization is case-insensitive and whitespace-normalized. Exact punctuation/diacritic handling is deterministic implementation work.
- Localized display-name uniqueness may vary by locale and does not replace canonical uniqueness.

### Topic identity, metadata, and naming

A Topic has stable Topic ID, Category ID, optional Parent Topic ID, Canonical Taxonomy Name, localized display names/descriptions, sibling display order, lifecycle state, UTC timestamps, and optional archive metadata.

- Rename/reparent operations never change Topic ID.
- Topic names are not globally unique.
- Active top-level Topics have unique normalized canonical names within their Category.
- Active child Topics have unique normalized canonical names within their Parent Topic sibling scope.
- Conceptual uniqueness is `category_id + parent_topic_id + normalized_canonical_name`.
- Localized display names may repeat in distinct branches where navigation context is unambiguous.

This ADR does not select database collation or index syntax.

### Hierarchy depth and ancestry

The authoritative model is the Category reference plus optional parent reference. API/read models may expose parent ID and ancestry. Cached paths, materialized paths, closure structures, or projections are derived optimizations and never the sole authority. Architecture supports arbitrary finite depth; product design normally limits visible MVP navigation to three levels.

### Cycle prevention

- A Topic cannot parent itself.
- A Topic cannot be reparented beneath any descendant.
- Parent and child must share Category.
- The graph within each Category remains acyclic.
- Create/reparent validates the complete ancestry path transactionally.
- Stale concurrent hierarchy mutations conflict instead of silently corrupting ancestry.

Potential later enforcement combines application-level validation inside the application-owned transaction with a recursive PostgreSQL query and feasible constraints. A materialized path or closure structure may optimize reads later without changing the parent-reference domain model.

### Topic reparenting

An authorized audited command may move a Topic and its complete descendant subtree to another parent or the top level within the same Category.

- The command includes expected concurrency state.
- Source/target existence, same-Category ownership, acyclicity, destination sibling uniqueness, and ordering are validated before commit.
- A failed move leaves the original hierarchy unchanged.
- Destination sibling display order may be reassigned deterministically.
- Lesson, Lesson Variant/Revision, package, and Reading Session identities remain unchanged.
- Future discovery uses new ancestry; reporting may later preserve both current and historical taxonomy context.
- Cross-Category Topic moves are prohibited for MVP and require an explicit migration workflow or future ADR.

### Lesson reassignment

An authorized audited command may reassign a Lesson to another active Topic only within the same Category. Lesson identity, Revisions, packages, and Reading Sessions remain unchanged. Future discovery uses the new Topic; historical analytics are not silently rewritten. Cross-Category Lesson moves are deferred.

### Lifecycle states

FPSD-013 amends the taxonomy lifecycle to exactly two conceptual values:

| State      | Meaning                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------ |
| `ACTIVE`   | Default; eligible for discovery when ancestry and published-content conditions are satisfied.    |
| `ARCHIVED` | Reversible retirement from active use; identity, descendants, content, and history are retained. |

`DELETED`, hidden, and withdrawal are not taxonomy lifecycle states. Archived restoration requires an explicit audited action. Direct historical resolution remains subject to later product policy.

### Archive propagation and effective visibility

Archiving a Category removes it and all descendant paths from discovery, prevents new active Topic/Lesson assignment until restoration, and preserves every Topic, Lesson, Revision, Reading Session, and audit record.

Archiving a Topic removes its complete subtree from discovery and prevents new active assignment beneath it while preserving descendants and history.

Archive propagation uses Effective Visibility: an inactive ancestor makes descendants effectively unavailable without overwriting descendant lifecycle states. Restoring the ancestor restores only eligibility; each descendant's own state still applies. Cascade state rewriting is prohibited.

### Restoration

- Restoration is authorized and audited.
- Restoring a Category never sets descendants to `ACTIVE` automatically.
- Restoring a Topic requires its Category and required ancestors to be `ACTIVE` or restored.
- Restoration revalidates active normalized sibling uniqueness and cannot create duplicate active taxonomy.
- Stable IDs and original creation timestamps remain unchanged; restoration actor/time/reason are appended.
- Historical Lesson Revisions remain immutable.

### Deletion policy

Normal retirement uses archive, never hard delete. Hard deletion is prohibited for Categories or Topics with descendants, Lessons, Revisions, Reading Sessions, packages, or audit history. Destructive cascades and broader deletion/retention boundaries follow [ADR-017](./ADR-017-use-history-safe-deletion-and-anonymization.md).

### Display ordering

Categories have explicit order; Topics have explicit order among siblings. Ordering is mutable administrative metadata and does not change identity/history. Values need not be globally unique, but APIs use deterministic tie-breaking for stable results. Fractional, integer-gap, and renumbering strategies remain implementation choices.

### Localized taxonomy metadata

Taxonomy identity is language-neutral. Localized display names/descriptions are metadata separate from Lesson Variants. Translation does not create a Category/Topic or Lesson Revision. Missing-localization fallback remains a later approved policy. Flags never represent languages. Physical localization storage remains Sprint 2 design work.

### Discovery eligibility

A Category is eligible for ordinary discovery when it is `active`, contains at least one eligible Topic path, and that path reaches a published learner-visible Lesson Revision for the selected language/browsing mode.

A Topic is eligible when it is `active`, its Category and all ancestors are `active`, and it or a descendant reaches published learner-visible content. Effective Visibility combines own and ancestor state. Read models/projections may serve this efficiently rather than traversing deeply for each request.

### Taxonomy audit evidence

Every taxonomy command records stable operation ID, server-derived Administrative Actor, UTC timestamp, target, prior/resulting state, old/new parent when applicable, reason/note, concurrency evidence, and operation type. Candidate operations are:

- `CategoryCreated`, `CategoryRenamed`, `CategoryHidden`, `CategoryArchived`, `CategoryRestored`;
- `TopicCreated`, `TopicRenamed`, `TopicReparented`, `TopicHidden`, `TopicArchived`, `TopicRestored`; and
- `LessonReassignedToTopic`.

These are domain events backed by append-only audit evidence where an administrative change occurs. They are not automatically transport events and do not require event sourcing or a message broker. Stable command/operation IDs make retries safe where required.

### Transaction boundaries

#### Create Topic

One transaction verifies authorization, Category lifecycle, optional Parent Topic ownership/state, normalized sibling uniqueness, and ordering; creates the Topic and audit evidence; and commits both or neither.

#### Reparent Topic

One transaction verifies authorization and expected concurrency, loads source/target ancestry, enforces same Category/no cycle/destination uniqueness, changes parent/order, appends audit evidence, and commits the subtree move atomically.

#### Archive, hide, or restore taxonomy

One transaction verifies authorization/current state, restoration prerequisites and uniqueness where applicable, changes the target's own lifecycle state without rewriting descendants, appends audit evidence, and invalidates/updates discovery projections after commit.

#### Reassign Lesson

One transaction verifies authorization, same Category, active destination, and expected concurrency; changes the Lesson's current Topic reference and appends audit evidence without rewriting Revision/Reading history.

### API implications

- Taxonomy responses expose stable IDs, state-appropriate localized metadata, parent ID, useful ancestry, and stable order.
- Clients cannot assume fixed depth.
- Learner APIs return only discovery-eligible taxonomy and no internal audit details.
- Administrative actor identity is derived by the server.
- Mutations require concurrency evidence; stale hierarchy updates conflict.
- Reparenting and Lesson reassignment reject cross-Category destinations for MVP.
- Archive/restore are explicit commands, not generic delete.
- Referenced taxonomy has no ordinary hard-delete contract.

Endpoint paths remain outside this ADR.

## Alternatives considered

### Flat Category/Topic model

Rejected because optional paths such as Animals -> Mammals -> Pangolins improve organization.

### Fixed three-level hierarchy

Rejected because content areas need different finite depths; three levels is a UI guideline, not a domain invariant.

### Arbitrary graph with multiple parents

Rejected for MVP because it complicates ownership, navigation, uniqueness, cycle prevention, and discovery.

### Path string as identity

Rejected because rename/reparent operations would break identity and references.

### Cascade archive by overwriting descendants

Rejected because it destroys independent descendant lifecycle state.

### Hard deletion as normal retirement

Rejected because it threatens Lesson, Reading Session, analytics, and audit history.

### Cross-Category reparenting in MVP

Deferred because it changes ownership, discovery, and reporting semantics.

## Consequences

### Benefits

- Stable taxonomy identity survives rename, localization, reorder, reparent, hide, and archive.
- Cycle/uniqueness rules keep navigation deterministic.
- Effective Visibility preserves descendant states and historical references.
- Shallow MVP navigation coexists with future finite growth.

### Costs and trade-offs

- Reparent/restore require ancestry and uniqueness validation in transactions.
- Discovery likely needs projections as content grows.
- Historical taxonomy reporting may require later contextual snapshots.

## Implementation implications

- Physical design must support stable UUIDs, optional parent reference, same-Category integrity, normalized scoped uniqueness, concurrency, explicit order, lifecycle state, restricted audit evidence, and non-destructive foreign-key actions.
- Tests must cover self-parenting, descendant cycles, same-Category enforcement, normalized duplicates, concurrent moves, subtree moves, archive Effective Visibility, restoration conflicts, stable ordering, and historical Lesson/Session preservation.

## Deferred implementation details

- Exact recursive query, materialized-path, closure, or projection strategy.
- Exact punctuation/diacritic normalization and database collation for canonical-name uniqueness.
- Physical localization representation and missing-translation fallback.
- Display-order allocation/renumbering algorithm and tie-breaker fields.
- Discovery projection refresh/invalidation implementation.
- Maximum recommended product depth beyond the normal three-level MVP guideline.
- Any future exceptional treatment of erroneous never-referenced taxonomy.
- Historical taxonomy snapshot requirements for analytics/reporting.

These details do not reopen Category ownership, single-parent acyclic hierarchy, scoped uniqueness, same-Category movement, Effective Visibility, restoration, or non-destructive history rules.

## Review triggers

Review this ADR if multiple parents/tags replace the tree, cross-Category migration becomes routine, product navigation needs substantially deeper structures, or legal policy requires destructive taxonomy removal.
