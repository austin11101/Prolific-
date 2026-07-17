# Sprint 1 Deliverable Audit

## Review basis

This audit reconciles the Master Roadmap and documentation index after Architecture Gate 001 passed. It prevents empty files from being created merely to satisfy an old path list. Re-scoping changes schedule and ownership only; it does not reopen PD-001 through PD-013 or AG-001 through AG-006.

## Required to close Sprint 1

| Deliverable                                     | Outcome  | Evidence                                                                                                                                                                                                      |
| ----------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Product requirements and approved behavior      | Complete | [PRD](../01-product-vision/product-requirements-document.md), [MVP Scope](../02-requirements/mvp-scope.md), [Product Decision Log](../product-decision-log.md), ADR-011                                       |
| Canonical domain/database foundation            | Complete | [Domain Model](../architecture/canonical-domain-model.md), [Glossary](../02-requirements/domain-glossary.md), [ERD](../07-database/erd.md), [Database Overview](../07-database/database-overview.md)          |
| Backend, mobile, package, and sync architecture | Complete | [Backend](../06-core-backend/backend-architecture.md), [Flutter](../05-mobile-app/flutter-architecture.md), [Package](../05-mobile-app/offline-lesson-package.md), [Sync](../06-core-backend/sync-service.md) |
| Shared specification-only contracts             | Complete | [Shared Contracts](../../packages/shared-contracts/README.md) and four strict schemas                                                                                                                         |
| Cross-cutting foundation                        | Complete | [Security](../11-security/security-overview.md), [Testing](../12-testing/testing-strategy.md), [Deployment](../13-deployment/deployment-overview.md)                                                          |
| Governance and traceability                     | Complete | ADR-011 through ADR-017, [Architecture Gate](./ARCHITECTURE-GATE-001.md), this audit, [Open Questions](./SPRINT-1-OPEN-QUESTIONS.md), and [Closure Review](./SPRINT-1-CLOSURE-REVIEW.md)                      |

## Deferred and retired planned paths

| Original expected location                            | Classification                          | Reason for deferral or retirement                                                                                        | Owning sprint/stage                                       | Dependency                                | Roadmap/index updated |
| ----------------------------------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------- | --------------------- |
| `docs/01-product-vision/vision.md`                    | Duplicate/no longer necessary           | PRD executive summary, goals, and long-term vision are the approved source                                               | Retired in Sprint 1                                       | PRD                                       | Yes                   |
| `docs/01-product-vision/problem-statement.md`         | Duplicate/no longer necessary           | PRD executive summary contains the product problem                                                                       | Retired in Sprint 1                                       | PRD                                       | Yes                   |
| `docs/01-product-vision/product-positioning.md`       | Duplicate/no longer necessary           | PRD differentiation and root README cover positioning                                                                    | Retired in Sprint 1                                       | PRD                                       | Yes                   |
| `docs/01-product-vision/core-principles.md`           | Duplicate/no longer necessary           | PRD goals, product rules, and AGENTS.md are authoritative                                                                | Retired in Sprint 1                                       | PRD and AGENTS.md                         | Yes                   |
| `docs/02-requirements/functional-requirements.md`     | Duplicate/no longer necessary           | PRD section 5 is the primary functional specification                                                                    | Retired in Sprint 1                                       | PRD                                       | Yes                   |
| `docs/02-requirements/non-functional-requirements.md` | Duplicate/no longer necessary           | PRD section 6 plus testing/deployment/security documents cover this baseline                                             | Retired in Sprint 1                                       | PRD and cross-cutting docs                | Yes                   |
| `docs/03-user-stories/learner-stories.md`             | Sprint 2 design deliverable             | Detailed backlog stories should be written/refined immediately before the affected increment, not frozen as architecture | Sprint 2 initially; later features refine in their sprint | PRD, flows, sprint scope                  | Yes                   |
| `docs/04-ui-ux-design/screen-list.md`                 | Later implementation-sprint deliverable | Screen inventory depends on mobile navigation and feature slicing                                                        | Sprint 4                                                  | Flutter architecture and learner stories  | Yes                   |
| `docs/04-ui-ux-design/design-system.md`               | Later implementation-sprint deliverable | Visual tokens/components belong with mobile UI foundation                                                                | Sprint 4                                                  | accessibility target and mobile shell     | Yes                   |
| `docs/04-ui-ux-design/accessibility.md`               | Later implementation-sprint deliverable | Architecture principles exist; exact standard and assistive-technology matrix require approval before UI acceptance      | Sprint 4                                                  | standard/matrix approval                  | Yes                   |
| `docs/09-content-engine/content-engine-overview.md`   | Later implementation-sprint deliverable | Content engine is Sprint 10 and cannot publish directly                                                                  | Sprint 10                                                 | admin workflow, contracts, content rubric | Yes                   |
| `docs/10-admin-dashboard/admin-overview.md`           | Later implementation-sprint deliverable | Admin application architecture depends on Sprint 9 capability/auth decisions                                             | Sprint 9                                                  | ADR-015 and auth/RBAC design              | Yes                   |
| `docs/14-roadmap/mvp-roadmap.md`                      | Duplicate/no longer necessary           | Master Roadmap already contains the authoritative MVP sprint sequence                                                    | Retired in Sprint 1                                       | Master Roadmap                            | Yes                   |
| `docs/14-roadmap/release-plan.md`                     | Later implementation-sprint deliverable | Dates, owners, signing/store, production, and launch-content evidence do not yet exist                                   | Sprint 12                                                 | Sprint 11 exit and release approvals      | Yes                   |

## Newly classified supporting documents

The component testing guides (`mobile-tests.md`, `backend-tests.md`, `api-tests.md`, and `offline-sync-tests.md`) and deployment guides (`environments.md`, `ci-cd.md`, `hosting.md`, and `monitoring.md`) are completed Sprint 1 architecture supplements because the current task explicitly requires them. They reference a central strategy rather than duplicate it.

## Post-MVP scope

Bookmarks, achievements/badges, leaderboards/social networking, classroom/teacher dashboards, institutional account roles, live AI learner features, pronunciation scoring, live tutoring, and payments remain post-MVP. Their possible documentation paths are not Sprint 1 deliverables.

## Audit conclusion

Every previously planned Sprint 1 path is now completed, assigned to an owning sprint/approval stage, or retired as a duplicate. No empty placeholder was created. The re-scoped items do not block Sprint 2 entry; their dependencies and evidence gates remain binding before affected implementation.
