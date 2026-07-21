import type {
  EntityId,
  ExpectedVersion,
  TaxonomyLifecycleState,
} from '../../domain/persistence/persistence.types.js';

export interface TopicOrdinaryMutationState {
  readonly canonicalName: string;
  readonly normalizedCanonicalName: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly archivedAt: Date | null;
  readonly updatedAt: Date;
}

export interface PersistTopicOrdinaryChangeCommand {
  readonly topicId: EntityId;
  readonly expectedLockVersion: ExpectedVersion;
  readonly current: TopicOrdinaryMutationState;
  readonly resulting: TopicOrdinaryMutationState;
}

export interface TopicMutationView {
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

export interface TopicMutationResult {
  readonly topic: TopicMutationView;
  readonly previousLockVersion: ExpectedVersion;
  readonly resultingLockVersion: ExpectedVersion;
}

export interface TopicMutationService {
  persistOrdinaryChange(command: PersistTopicOrdinaryChangeCommand): Promise<TopicMutationResult>;
}
