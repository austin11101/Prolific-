# Database Privilege Model

## Status and authority

**Status:** Approved conceptual boundary under FPSD-014; roles, grants, credentials, and SQL are not implemented.

- **Decision date:** 2026-07-17.
- **Approving authority:** Product Owner / architecture governance decision supplied in the review process.
- **Related authority:** [ADR-012](../decisions/ADR-012-use-prisma-for-core-api-persistence.md), [Database Overview](./database-overview.md), [Deployment Overview](../13-deployment/deployment-overview.md), and [First Migration Checklist](../reviews/FIRST-MIGRATION-CHECKLIST.md).

## Purpose

This provider-neutral model separates schema administration, application data access, operational reading, and database ownership. It defines required capabilities and prohibitions without prescribing provider role names or executable `CREATE ROLE`, `GRANT`, or `REVOKE` statements.

## Role responsibilities

| Role boundary              | Permitted purpose                                                                                             | Prohibited use                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Migration role             | Controlled schema creation and alteration through an approved migration workflow                              | NestJS runtime access, ordinary application traffic, superuser use, unrelated role administration                                   |
| Application role           | Connect and perform only the CRUD operations required on approved application objects                         | Schema ownership; `CREATE`, `ALTER`, or `DROP`; role administration; extension management; superuser or unrestricted tooling access |
| Read-only operational role | Optional `SELECT` access to explicitly approved operational objects                                           | Writes; schema changes; personal or restricted audit access by default; blanket access to every schema or future object             |
| Database owner/admin role  | Reserved database administration, ownership recovery, controlled privilege maintenance, and incident response | NestJS runtime use, routine migrations when a narrower migration role suffices, developer convenience access                        |

The database owner/admin and migration identities are not application identities. The production application credential must never be a superuser, database owner, schema owner, migration owner, or role administrator.

“CRUD rights” is object-specific, not blanket access. The application role may insert `taxonomy_change_records` only through approved taxonomy repository operations and must not update or delete those append-only rows. Restricted audit reads require an explicitly reviewed operational/governance authorization capability; they are unavailable through public APIs, learner/anonymous paths, normal content reads, analytics, ordinary application reads, audit exports without authorization, and the optional operational reader by default. The application role may insert/read immutable `actor_principals` only through the controlled provisioning boundary and must not update/delete them. Future immutable evidence tables receive the same deny-by-default treatment.

Migration-one Language rows are governance-owned reference data. The runtime application role receives only the Language reads required by approved content/taxonomy paths and no ad hoc create, update, or delete capability. Controlled Language changes require a reviewed migration or seed amendment executed through the migration workflow; stable UUIDs are preserved.

## Migration and runtime separation

- Migration and runtime credentials are distinct secrets with distinct rotation and access policies.
- Only an approved deployment/migration job may use the migration identity.
- Application startup never applies migrations and never receives migration credentials.
- The application role receives access only after an object is approved and deployed; it receives no automatic ownership of newly created objects.
- Migration workflows must preserve application access deliberately without transferring schema ownership.
- Emergency administration uses the reserved administrative path, not the NestJS runtime identity.

## Environment expectations

| Environment            | Required expectation                                                                                                                                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Local development      | Simplified credentials are permitted for developer usability, but documentation must identify where they exceed production privilege. Application behavior must not depend on those excess rights. |
| Automated tests and CI | Provision disposable databases and exercise migration and runtime identities separately. Negative privilege tests prove the runtime cannot perform prohibited schema/role operations.              |
| Staging                | Match production role separation, secret injection, object grants, taxonomy write paths, and operational-reader defaults.                                                                          |
| Production             | Enforce the complete separation in this document. No shared migration/runtime credential or schema-owner application identity is permitted.                                                        |

Local simplification is not evidence of production safety. Production-parity privilege tests must pass before deployment.

## Secret ownership and handling

- The deployment secret mechanism supplies database credentials; repository files, images, logs, fixtures, and seed data must not contain them.
- Deployment/operations owns migration and administrative secret delivery and rotation.
- The Core API runtime receives only the application secret required for its environment.
- Optional operational-reader credentials are separate, individually accountable, short-lived where supported, and denied restricted data by default.
- Secret names may identify purpose and environment, but documentation must never record secret values.
- Rotation must support overlap or coordinated replacement without silently falling back to an owner/admin credential.

## Privilege tests

Before production deployment, automated or reproducible integration evidence must prove:

1. the migration identity can execute only the approved migration workflow;
2. the application identity can connect and perform required operations on approved objects;
3. the application identity cannot create, alter, or drop schema objects, administer roles, manage extensions, assume ownership, or obtain superuser behavior;
4. the operational reader, when enabled, is read-only and can access only explicitly approved objects;
5. personal, security-sensitive, and restricted audit data is excluded from the operational-reader boundary by default;
6. the NestJS process uses the application identity rather than migration/admin credentials;
7. credential separation and secret injection match staging/production deployment configuration;
8. Language mutation is denied to the runtime role;
9. restricted taxonomy-audit reads and exports fail without the future explicit capability; and
10. the application role cannot update/delete actor principals or taxonomy audit rows and cannot invoke unrestricted raw-query paths.

Tests must fail closed when a new object lacks an explicit access decision. Role identifiers and provider mechanics may vary, but the behavioral assertions do not.

## Taxonomy-boundary implications

FPSD-006 assigns cross-row cycle prevention to the application transaction. Database privileges therefore support, but cannot alone prove, the invariant:

- taxonomy mutations enter through the approved `TaxonomyRepository` and application-service boundary;
- the application role has no unrestricted database tooling path that bypasses application commands;
- Category locking, expected `hierarchy_version`, affected Topic `lock_version`, cycle traversal, same-Category validation, sibling uniqueness revalidation, version updates, and `taxonomy_change_records` insertion occur in one transaction;
- the sole raw-query exception is a bound-parameter, static-identifier Category `FOR UPDATE` lock inside the taxonomy persistence adapter and Prisma interactive transaction; raw-query access is not exposed to controllers, general services, other repositories, or tooling;
- direct production writes outside the supported path are operationally prohibited; and
- concurrent reparent and negative privilege tests are required before deployment.

Administrative access can technically bypass application logic. Such access is exceptional, accountable, audited through the operational incident process, and must not be used for routine taxonomy mutation.

`taxonomy_change_records` is restricted operational audit data. It stores opaque UUIDv4 command references, a bounded reason code, typed state/version/parent evidence, and an optional immutable supersession link; it stores no identity labels, narrative, arbitrary JSON, request/response payload, or credential. Migration one creates no automated deletion/expiry job and grants no physical deletion path. This interim preservation rule remains subject to a future legal/governance retention schedule that must also cover authorized exports, backups, and operational copies and preserve correction/history relationships.

## Incident response and rotation

- Suspected credential exposure triggers credential revocation/rotation, connection termination where supported, access-log review, and an assessment of schema/data actions possible under that role.
- Application-credential compromise must not grant schema ownership or role administration; migration/admin compromise is treated as a higher-severity event.
- Rotation procedures must cover the application, migration, optional reader, and admin identities independently.
- Privilege drift, unexpected ownership, failed negative tests, or use of an admin credential by NestJS is a deployment-blocking incident.
- Recovery must restore the approved privilege boundary and produce evidence; it must not normalize an emergency broad grant as permanent configuration.

## Implementation gate

This document closes the FPSD-014 decision only. It does not authorize role creation, grants, SQL, secret creation, schema models, or migrations. Physical implementation remains blocked until the [First Physical Schema Review](../reviews/FIRST-PHYSICAL-SCHEMA-REVIEW.md) and [First Migration Checklist](../reviews/FIRST-MIGRATION-CHECKLIST.md) authorize the reviewed scope.
