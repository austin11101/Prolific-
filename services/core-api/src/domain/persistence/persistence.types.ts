import type { TransactionContext } from './transactions/transaction-manager.js';

export type EntityId = string;
export type ExpectedVersion = number;
export type TaxonomyLifecycleState = 'active' | 'archived';
export type ActorPrincipalKind = 'administrative' | 'service' | 'system';
export type LessonDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type WorkingDraftState =
  'draft' | 'in_review' | 'changes_requested' | 'approved' | 'published';
export type ContentBlockType = 'heading' | 'paragraph' | 'callout' | 'fact' | 'quote';

export interface RepositoryOperationContext {
  readonly transaction?: TransactionContext;
}

export interface TransactionalRepositoryOperationContext {
  readonly transaction: TransactionContext;
}

export interface VersionedMutationResult<TEntity> {
  readonly entity: TEntity;
  readonly previousVersion: ExpectedVersion;
  readonly resultingVersion: ExpectedVersion;
}

export interface ActorPrincipalRecord {
  readonly id: EntityId;
  readonly actorKind: ActorPrincipalKind;
  readonly createdAt: Date;
}

export interface LanguageRecord {
  readonly id: EntityId;
  readonly bcp47Tag: string;
  readonly normalizedTag: string;
  readonly isoLanguageBasis: string;
  readonly canonicalName: string;
  readonly normalizedName: string;
  readonly displayOrder: number;
  readonly isContentEnabled: boolean;
  readonly retiredAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CategoryRecord {
  readonly id: EntityId;
  readonly canonicalName: string;
  readonly normalizedCanonicalName: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly displayOrder: number;
  readonly iconKey: string | null;
  readonly lockVersion: ExpectedVersion;
  readonly hierarchyVersion: ExpectedVersion;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TopicRecord {
  readonly id: EntityId;
  readonly categoryId: EntityId;
  readonly parentTopicId: EntityId | null;
  readonly canonicalName: string;
  readonly normalizedCanonicalName: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly displayOrder: number;
  readonly lockVersion: ExpectedVersion;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface ContentSourceRecord {
  readonly id: EntityId;
  readonly sourceKind: string;
  readonly originTitle: string | null;
  readonly originAuthor: string | null;
  readonly originUri: string | null;
  readonly licenseCode: string | null;
  readonly attributionNote: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LessonRecord {
  readonly id: EntityId;
  readonly topicId: EntityId;
  readonly contentSourceId: EntityId | null;
  readonly canonicalTitle: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LessonVariantRecord {
  readonly id: EntityId;
  readonly lessonId: EntityId;
  readonly languageId: EntityId;
  readonly difficulty: LessonDifficulty;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface WorkingDraftRecord {
  readonly id: EntityId;
  readonly variantId: EntityId;
  readonly state: WorkingDraftState;
  readonly title: string;
  readonly bodyText: string;
  readonly wordCount: number;
  readonly estimatedReadingTimeSeconds: number;
  readonly concurrencyToken: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface LessonRevisionRecord {
  readonly id: EntityId;
  readonly variantId: EntityId;
  readonly revisionNumber: number;
  readonly title: string;
  readonly wordCount: number;
  readonly estimatedReadingTimeSeconds: number;
  readonly isPublished: boolean;
  readonly schemaVersion: string;
  readonly createdAt: Date;
}

export interface ContentBlockRecord {
  readonly id: EntityId;
  readonly revisionId: EntityId;
  readonly blockType: ContentBlockType;
  readonly canonicalDisplayText: string;
  readonly isReadable: boolean;
  readonly displayOrder: number;
  readonly createdAt: Date;
}

export interface ReadingPositionRecord {
  readonly id: EntityId;
  readonly revisionId: EntityId;
  readonly blockId: EntityId;
  readonly unitId: EntityId;
  readonly positionIndex: number;
  readonly spanStart: number;
  readonly spanEnd: number;
  readonly surfaceText: string;
  readonly normalizedText: string;
  readonly createdAt: Date;
}

export interface TutorialAudioMetadataRecord {
  readonly id: EntityId;
  readonly revisionId: EntityId;
  readonly audioStoragePath: string;
  readonly durationSeconds: number;
  readonly fileSizeBytes: bigint;
  readonly mimeType: string;
  readonly createdAt: Date;
}

export interface PackageManifestRecord {
  readonly id: EntityId;
  readonly revisionId: EntityId;
  readonly packageChecksum: string;
  readonly schemaVersion: string;
  readonly tokenizationProfile: string;
  readonly tokenizationProfileVersion: string;
  readonly createdAt: Date;
}

export interface TaxonomyChangeRecordView {
  readonly id: EntityId;
  readonly commandId: EntityId;
  readonly actorPrincipalId: EntityId;
  readonly categoryId: EntityId | null;
  readonly topicId: EntityId | null;
  readonly operation: string;
  readonly reasonCode: string;
  readonly previousLifecycleState: TaxonomyLifecycleState | null;
  readonly resultingLifecycleState: TaxonomyLifecycleState | null;
  readonly previousParentTopicId: EntityId | null;
  readonly resultingParentTopicId: EntityId | null;
  readonly previousVersion: ExpectedVersion | null;
  readonly resultingVersion: ExpectedVersion;
  readonly supersedesChangeRecordId: EntityId | null;
  readonly occurredAt: Date;
  readonly createdAt: Date;
}
