import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import type { TopicRecord } from '../../domain/persistence/persistence.types.js';
import { InvalidTopicQueryError, type TopicQueryInputField } from './topic-query.errors.js';
import type {
  GetTopicByIdQuery,
  ListChildTopicsQuery,
  ListRootTopicsByCategoryQuery,
  LoadTopicHierarchyQuery,
  TopicQueryService,
  TopicView,
} from './topic-query.types.js';

export class DefaultTopicQueryService implements TopicQueryService {
  constructor(private readonly topics: TopicRepository) {}

  async getById(query: GetTopicByIdQuery): Promise<TopicView | null> {
    this.assertNonEmpty(query.topicId, 'topicId');
    const topic = await this.topics.findById(query.topicId);
    return topic === null ? null : this.toView(topic);
  }

  async listRootsByCategory(query: ListRootTopicsByCategoryQuery): Promise<readonly TopicView[]> {
    this.assertNonEmpty(query.categoryId, 'categoryId');
    const topics = await this.topics.listRootsByCategory(query.categoryId);
    return this.toViews(topics);
  }

  async listChildren(query: ListChildTopicsQuery): Promise<readonly TopicView[]> {
    this.assertNonEmpty(query.parentTopicId, 'parentTopicId');
    const topics = await this.topics.listChildren(query.parentTopicId);
    return this.toViews(topics);
  }

  async loadHierarchy(query: LoadTopicHierarchyQuery): Promise<readonly TopicView[]> {
    this.assertNonEmpty(query.categoryId, 'categoryId');
    const topics = await this.topics.loadHierarchy(query.categoryId);
    return this.toViews(topics);
  }

  private assertNonEmpty(value: string, field: TopicQueryInputField): void {
    if (typeof value !== 'string' || value.length === 0) {
      throw new InvalidTopicQueryError(field);
    }
  }

  private toViews(topics: readonly TopicRecord[]): readonly TopicView[] {
    return Object.freeze(topics.map((topic) => this.toView(topic)));
  }

  private toView(topic: TopicRecord): TopicView {
    return Object.freeze({
      id: topic.id,
      categoryId: topic.categoryId,
      parentTopicId: topic.parentTopicId,
      canonicalName: topic.canonicalName,
      normalizedCanonicalName: topic.normalizedCanonicalName,
      lifecycleState: topic.lifecycleState,
      displayOrder: topic.displayOrder,
      lockVersion: topic.lockVersion,
      archivedAt: topic.archivedAt === null ? null : new Date(topic.archivedAt.getTime()),
      createdAt: new Date(topic.createdAt.getTime()),
      updatedAt: new Date(topic.updatedAt.getTime()),
    });
  }
}
