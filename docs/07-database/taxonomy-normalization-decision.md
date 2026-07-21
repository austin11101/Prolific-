# Taxonomy Normalization Decision

## Status

**Status:** `APPROVED BY FPSD-005; AUTOMATED ACCEPTANCE TESTS REQUIRED`.

This document defines the FPSD-005-approved deterministic comparison profile used for active Category and sibling Topic uniqueness. It does not implement a function, constraint, index, Prisma field, test, or migration.

## Values that must remain distinct

| Value                       | Meaning                                                                                                                                                                                |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Display value               | Product/editor-approved Canonical Taxonomy Name shown to authorized interfaces. Preserve spelling, capitalization, punctuation, apostrophes, hyphens, and diacritics after validation. |
| Normalized comparison value | Deterministic stored key used only for scoped uniqueness and equality. It is not learner-visible.                                                                                      |
| Slug                        | Optional future route/search presentation value. It is not proposed for migration one, not authoritative, and may change after rename.                                                 |
| Immutable identifier        | Category or Topic UUID. Rename, normalization-profile change, slug change, or reparenting never changes it.                                                                            |

## Candidate approaches

| Option                             | Rules                                                                                                                                                                                                               | Benefits                                                                                                     | Risks                                                                                                                             |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| A. Conservative Unicode comparison | Validate display input; Unicode NFKC comparison normalization; whitespace mapping/collapse; locale-independent full case fold; canonicalize common apostrophe/hyphen variants; preserve punctuation and diacritics. | Deterministic across launch Languages, catches typography-only duplicates, preserves meaningful orthography. | Requires a pinned Unicode implementation/profile version and careful punctuation mapping.                                         |
| B. NFC plus simple lower-case      | NFC, trim/collapse spaces, locale-independent lower-case, otherwise preserve all characters.                                                                                                                        | Simple and minimally transformative.                                                                         | Compatibility characters and full case-fold equivalents may remain unintended duplicates; runtime differences are easier to miss. |
| C. Aggressive search-style folding | NFKD, remove diacritics/punctuation, collapse separators, case fold.                                                                                                                                                | Broad duplicate detection and search friendliness.                                                           | Collapses potentially meaningful isiZulu/Sepedi spelling and punctuation; unsuitable for canonical uniqueness.                    |
| D. Locale-specific profiles        | Select case/punctuation/diacritic rules from a Language context.                                                                                                                                                    | Can model language-specific semantics.                                                                       | Category/Topic identity is language-neutral and may have multilingual labels; deciding a governing locale is ambiguous.           |

## Recommended comparison profile

FPSD-005 approves **Option A**.

Apply these steps in order:

1. Reject empty input and any unpaired surrogate or invalid Unicode scalar sequence before normalization.
2. Reject C0/C1 controls other than input whitespace, bidirectional formatting/override controls, zero-width joiner/non-joiner, zero-width space, word joiner, byte-order mark, soft hyphen, and other default-ignorable format characters. They may not silently disappear.
3. Convert all permitted Unicode whitespace, including non-breaking space, to ASCII space.
4. Trim leading/trailing space and collapse each repeated internal whitespace run to one ASCII space.
5. Normalize the comparison value with Unicode NFKC.
6. Apply locale-independent Unicode full case folding. Do not use the host machine's current locale.
7. Map typographic apostrophe variants (`’`, `‘`, modifier apostrophe) to ASCII apostrophe `'`.
8. Map common dash/hyphen presentation variants (non-breaking hyphen, figure dash, en dash, em dash, minus sign) to ASCII hyphen `-` only when used inside the name; do not map a hyphen to a space.
9. Preserve remaining punctuation and all diacritics. Do not remove accents, carons, circumflexes, or other marks after normalization.
10. Re-run blank/control validation, enforce an approved normalized-byte limit, and store the result in `normalized_canonical_name`.

Display input should be stored in NFC for consistent rendering after editorial confirmation, while the comparison key follows the NFKC/full-fold profile above. The implementation must pin and document its Unicode/profile version, use the same library in write paths and data repair tools, and maintain the golden corpus below as contract tests.

## Punctuation, apostrophe, hyphen, and diacritic decisions

- Ordinary punctuation remains significant: `History: Africa` is not equal to `History Africa`.
- Apostrophe typography is insignificant: `Children’s Stories` equals `Children's Stories`.
- Hyphen typography is insignificant, but hyphen presence is significant: `Health–Care` equals `Health-Care`, while `Health Care` remains different.
- Diacritics remain significant after canonical Unicode composition: `Tšwelopele` does not equal `Tswelopele`.
- Slug transliteration, punctuation removal, and diacritic folding may be designed later for routing/search, but never drives taxonomy identity or canonical uniqueness.

## Storage and uniqueness scope

- Store both `canonical_name` and `normalized_canonical_name`; never compute uniqueness from database collation or `citext`.
- The same approved profile is used where applicable to produce `languages.normalized_name`; Language tag canonicalization remains a separate BCP 47 validation rule.
- Every normalized comparison column used for equality or uniqueness must use explicit PostgreSQL `"C"` collation in the future physical migration. The application-generated value remains authoritative; the collation is a deterministic bytewise enforcement layer, not a linguistic normalizer.
- Display values retain ordinary Unicode text. Human-facing sorting must use a separately approved display-value strategy and must not rely on normalized comparison fields.
- Active Category uniqueness is global on normalized comparison value.
- Active root Topic uniqueness is per Category.
- Active child Topic uniqueness is per Category plus Parent Topic.
- `ARCHIVED` rows do not participate in the approved partial-`ACTIVE` uniqueness predicates; restoration must revalidate active uniqueness.
- A future profile change requires a versioned migration plan that precomputes collisions, obtains Product resolution, updates keys transactionally, and never changes UUIDs.

## Golden test corpus

`U+xxxx` notation identifies otherwise invisible code points. “Equal” means the two inputs must produce the same comparison key. “Different” means both may coexist in the same uniqueness scope. “Reject” means no comparison key may be persisted.

| ID     | Language/context | Input A                       | Input B                         | Expected  | Rule exercised                                      |
| ------ | ---------------- | ----------------------------- | ------------------------------- | --------- | --------------------------------------------------- |
| TN-001 | English          | `History`                     | `history`                       | Equal     | Locale-independent full case fold                   |
| TN-002 | English          | `  South Africa  `            | `South Africa`                  | Equal     | Leading/trailing whitespace                         |
| TN-003 | English          | `South   African History`     | `South African History`         | Equal     | Repeated internal whitespace                        |
| TN-004 | English          | `Children’s Stories`          | `Children's Stories`            | Equal     | Apostrophe canonicalization                         |
| TN-005 | English          | `Health–Care`                 | `Health-Care`                   | Equal     | Dash/hyphen canonicalization                        |
| TN-006 | English          | `Health Care`                 | `Health-Care`                   | Different | Hyphen is not whitespace                            |
| TN-007 | English          | `History: Africa`             | `History Africa`                | Different | Ordinary punctuation preserved                      |
| TN-008 | English          | `Café Culture`                | `Cafe Culture`                  | Different | Diacritics preserved                                |
| TN-009 | English          | `Ａfrica` (full-width A)      | `Africa`                        | Equal     | NFKC compatibility normalization                    |
| TN-010 | isiZulu          | `IsiZulu`                     | `isizulu`                       | Equal     | Case folding without locale inference               |
| TN-011 | isiZulu          | `Ulimi lwesiZulu`             | `Ulimi  lwesiZulu`              | Equal     | Whitespace collapse                                 |
| TN-012 | isiZulu          | `i-Afrika`                    | `i Afrika`                      | Different | Hyphen presence significant                         |
| TN-013 | isiZulu          | `Izindaba Zabantwana`         | `Izindaba Zabantwana`           | Equal     | Stable ordinary text                                |
| TN-014 | Sepedi           | `Tšwelopele`                  | `Tšwelopele` (decomposed caron) | Equal     | Canonical Unicode equivalence/NFKC                  |
| TN-015 | Sepedi           | `Tšwelopele`                  | `Tswelopele`                    | Different | Diacritics significant                              |
| TN-016 | Sepedi           | `Bophelo bjo Bobotse`         | `bophelo bjo bobotse`           | Equal     | Full case fold                                      |
| TN-017 | Cross-language   | `South` + `U+00A0` + `Africa` | `South Africa`                  | Equal     | Permitted Unicode whitespace mapping                |
| TN-018 | Security         | `His` + `U+200B` + `tory`     | n/a                             | Reject    | Zero-width space                                    |
| TN-019 | Security         | `abc` + `U+202E` + `def`      | n/a                             | Reject    | Bidirectional override                              |
| TN-020 | Security         | `Learn` + `U+00AD` + `ing`    | n/a                             | Reject    | Soft hyphen/default-ignorable format                |
| TN-021 | Security         | `Topic` + newline + `Name`    | n/a                             | Reject    | Control/newline rather than accepted inline spacing |
| TN-022 | Validation       | spaces only                   | n/a                             | Reject    | Blank after normalization                           |

The corpus is the required technical acceptance baseline. Before taxonomy repository acceptance, TN-001 through TN-022 must be executable automated tests. Product/Content reviewers may improve example wording only if the approved rule and expected result remain covered.

The tests must prove that normalized-equivalent values collide, distinct values remain distinct, prohibited characters are rejected, results are deterministic, and one shared normalization implementation is used by create, rename, reparent, import, and seed validation.

## Validation ownership

- Product/Content owns Canonical Taxonomy Name suitability and reviewed examples.
- Architecture/Data owns the deterministic profile, versioning, storage, uniqueness scope, and collision migration plan.
- One shared backend domain/application component owns normalization and related reference/taxonomy validation. Seed validation, Category create/rename, Topic create/rename, Topic reparent name revalidation, imports, and future administrative tooling must call that same implementation and reject client-supplied normalized keys.
- Security reviews invisible/control rejection and spoofing risks.
- Repositories receive already validated display and normalized values. PostgreSQL stores the normalized key under explicit `"C"` collation and enforces the scoped unique indexes as the final concurrency safeguard; it does not invent locale semantics.
- Prisma schema/index syntax may not express all required collation details portably. Any future customized migration fragment must be separately visible and reviewed before execution; runtime `db push`, hidden customization, and unreviewed SQL remain prohibited.

## Required implementation evidence

- Record the pinned Unicode/library/profile version.
- Implement TN-001 through TN-022 as automated tests before `TaxonomyRepository` acceptance.
- Demonstrate identical behavior across create, rename, reparent, import, and seed validation.
- Approve the normalized-size limit before physical implementation.
- Document collision handling for restoration and future normalization-profile upgrades.

The normalization behavior is approved, and the multidisciplinary technical findings are closed. The first migration remains blocked pending all five human reviewer approvals, checklist completion, and later explicit migration authorization; taxonomy repository acceptance additionally requires the automated evidence above.
