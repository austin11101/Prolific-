import type {
  EntityId,
  TaxonomyLifecycleState,
} from '../../domain/persistence/persistence.types.js';

export interface GetTopicByIdQuery {
  readonly topicId: EntityId;
}

export interface ListRootTopicsByCategoryQuery {
  readonly categoryId: EntityId;
}

export interface ListChildTopicsQuery {
  readonly parentTopicId: EntityId;
}

export interface LoadTopicHierarchyQuery {
  readonly categoryId: EntityId;
}

export interface TopicView {
  readonly id: EntityId;
  readonly categoryId: EntityId;
  readonly parentTopicId: EntityId | null;
  readonly canonicalName: string;
  readonly normalizedCanonicalName: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly displayOrder: number;
  readonly lockVersion: number;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface TopicQueryService {
  getById(query: GetTopicByIdQuery): Promise<TopicView | null>;

  listRootsByCategory(query: ListRootTopicsByCategoryQuery): Promise<readonly TopicView[]>;

  listChildren(query: ListChildTopicsQuery): Promise<readonly TopicView[]>;

  /** Returns the repository-defined flat hierarchy in its deterministic order. */
  loadHierarchy(query: LoadTopicHierarchyQuery): Promise<readonly TopicView[]>;
}
