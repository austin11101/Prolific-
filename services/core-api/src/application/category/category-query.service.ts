import type { CategoryRepository } from '../../domain/persistence/repositories/category.repository.js';
import type {
  CategoryRecord,
  TaxonomyLifecycleState,
} from '../../domain/persistence/persistence.types.js';
import {
  InvalidCategoryQueryError,
  type CategoryQueryInputField,
} from './category-query.errors.js';
import type {
  CategoryQueryService,
  CategoryView,
  FindCategoryByNormalizedNameQuery,
  GetCategoryByIdQuery,
  ListCategoriesByLifecycleQuery,
} from './category-query.types.js';

const CATEGORY_LIFECYCLE_STATES = new Set<TaxonomyLifecycleState>(['active', 'archived']);

export class DefaultCategoryQueryService implements CategoryQueryService {
  constructor(private readonly categories: CategoryRepository) {}

  async getById(query: GetCategoryByIdQuery): Promise<CategoryView | null> {
    this.assertNonEmpty(query.categoryId, 'categoryId');
    const category = await this.categories.findById(query.categoryId);
    return category === null ? null : this.toView(category);
  }

  async findActiveByNormalizedName(
    query: FindCategoryByNormalizedNameQuery,
  ): Promise<CategoryView | null> {
    this.assertNonEmpty(query.normalizedName, 'normalizedName');
    const category = await this.categories.findActiveByNormalizedName(query.normalizedName);
    return category === null ? null : this.toView(category);
  }

  async listByLifecycle(query: ListCategoriesByLifecycleQuery): Promise<readonly CategoryView[]> {
    this.assertLifecycle(query.lifecycleState);
    const categories = await this.categories.listByLifecycle(query.lifecycleState);
    return Object.freeze(categories.map((category) => this.toView(category)));
  }

  private assertNonEmpty(value: string, field: CategoryQueryInputField): void {
    if (typeof value !== 'string' || value.length === 0) {
      throw new InvalidCategoryQueryError(field);
    }
  }

  private assertLifecycle(value: TaxonomyLifecycleState): void {
    if (!CATEGORY_LIFECYCLE_STATES.has(value)) {
      throw new InvalidCategoryQueryError('lifecycleState');
    }
  }

  private toView(category: CategoryRecord): CategoryView {
    return Object.freeze({
      id: category.id,
      canonicalName: category.canonicalName,
      normalizedCanonicalName: category.normalizedCanonicalName,
      lifecycleState: category.lifecycleState,
      displayOrder: category.displayOrder,
      iconKey: category.iconKey,
      lockVersion: category.lockVersion,
      hierarchyVersion: category.hierarchyVersion,
      archivedAt: category.archivedAt === null ? null : new Date(category.archivedAt.getTime()),
      createdAt: new Date(category.createdAt.getTime()),
      updatedAt: new Date(category.updatedAt.getTime()),
    });
  }
}
