import type {
  EntityId,
  ExpectedVersion,
  RepositoryOperationContext,
  TaxonomyLifecycleState,
  TopicRecord,
  TransactionalRepositoryOperationContext,
  VersionedMutationResult,
} from '../persistence.types.js';

export interface TopicNameScope {
  readonly categoryId: EntityId;
  readonly parentTopicId: EntityId | null;
  readonly normalizedName: string;
}

export interface PersistTopicChangeInput {
  readonly topic: TopicRecord;
  readonly expectedLockVersion: ExpectedVersion;
}

export interface PersistTopicOrdinaryChangeInput {
  readonly topicId: EntityId;
  readonly expectedLockVersion: ExpectedVersion;
  readonly canonicalName: string;
  readonly normalizedCanonicalName: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly archivedAt: Date | null;
  readonly updatedAt: Date;
}

export interface TopicRepository {
  findById(id: EntityId, context?: RepositoryOperationContext): Promise<TopicRecord | null>;

  findActiveByScopedName(
    scope: TopicNameScope,
    context?: RepositoryOperationContext,
  ): Promise<TopicRecord | null>;

  listRootsByCategory(
    categoryId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TopicRecord[]>;

  listChildren(
    parentTopicId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TopicRecord[]>;

  loadHierarchy(
    categoryId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TopicRecord[]>;

  persistVersionedChange(
    input: PersistTopicChangeInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<VersionedMutationResult<TopicRecord>>;

  persistOrdinaryChange(
    input: PersistTopicOrdinaryChangeInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<VersionedMutationResult<TopicRecord>>;
}
