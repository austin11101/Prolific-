/**
 * JWT capability claim strings for Prolific resource-server authorization.
 *
 * Provider assignment of these values to principals remains unresolved.
 * Controllers must reference these constants rather than ad hoc strings.
 *
 * @see docs/decisions/ASSUMPTION-003-authorization-capability-matrix.md
 */

/** Public catalog reads available to guests and authenticated learners. */
export const CatalogReadPublic = 'catalog:read:public' as const;

/** Full learner library catalog beyond the guest free selection. */
export const CatalogReadFull = 'catalog:read:full' as const;

/** Download immutable lesson packages for offline use. */
export const LessonsDownload = 'lessons:download' as const;

/** Read the authenticated learner profile. */
export const ProfileRead = 'profile:read' as const;

/** Update the authenticated learner profile and preferences. */
export const ProfileWrite = 'profile:write' as const;

/** Read server-acknowledged progress summaries. */
export const ProgressRead = 'progress:read' as const;

/** Submit idempotent offline synchronization events. */
export const SyncWrite = 'sync:write' as const;

/** Create and edit Working Draft content. */
export const LessonDraftWrite = 'lesson:draft:write' as const;

/** Submit a Working Draft for human review. */
export const LessonSubmit = 'lesson:submit' as const;

/** Review submissions, request changes, reject, or approve. */
export const LessonReview = 'lesson:review' as const;

/** Approve an exact submitted draft for publication eligibility. */
export const LessonApprove = 'lesson:approve' as const;

/** Publish an approved unchanged draft as an immutable Revision. */
export const LessonPublish = 'lesson:publish' as const;

/** Archive a Lesson Variant or withdraw published visibility. */
export const LessonArchive = 'lesson:archive' as const;

/** Manage internal administrative accounts and capability assignments. */
export const AdminActorsManage = 'admin:actors:manage' as const;

/** Ingest or update Working Draft content from the content engine. */
export const ContentIngest = 'content:ingest' as const;

/** Query restricted operational audit records. */
export const AuditRead = 'audit:read' as const;

export const LearnerCapabilities = [
  CatalogReadPublic,
  CatalogReadFull,
  LessonsDownload,
  ProfileRead,
  ProfileWrite,
  ProgressRead,
  SyncWrite,
] as const;

export const EditorialCapabilities = [
  LessonDraftWrite,
  LessonSubmit,
  LessonReview,
  LessonApprove,
  LessonPublish,
  LessonArchive,
] as const;

export const ServiceCapabilities = [ContentIngest] as const;

export const PlatformAdminCapabilities = [AdminActorsManage, AuditRead] as const;

export type LearnerCapability = (typeof LearnerCapabilities)[number];
export type EditorialCapability = (typeof EditorialCapabilities)[number];
export type ServiceCapability = (typeof ServiceCapabilities)[number];
export type PlatformAdminCapability = (typeof PlatformAdminCapabilities)[number];
export type ProlificCapability =
  | LearnerCapability
  | EditorialCapability
  | ServiceCapability
  | PlatformAdminCapability
  | typeof CatalogReadPublic;
