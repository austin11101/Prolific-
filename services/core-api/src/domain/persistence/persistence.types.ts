import type { TransactionContext } from './transactions/transaction-manager.js';

export type EntityId = string;
export type ExpectedVersion = number;
export type TaxonomyLifecycleState = 'active' | 'archived';
export type ActorPrincipalKind = 'administrative' | 'service' | 'system';

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
