import type {
  EntityId,
  TaxonomyLifecycleState,
} from '../../domain/persistence/persistence.types.js';

export interface GetCategoryByIdQuery {
  readonly categoryId: EntityId;
}

export interface FindCategoryByNormalizedNameQuery {
  /** Already-normalized taxonomy name. It is matched exactly and is never rewritten. */
  readonly normalizedName: string;
}

export interface ListCategoriesByLifecycleQuery {
  readonly lifecycleState: TaxonomyLifecycleState;
}

export interface CategoryView {
  readonly id: EntityId;
  readonly canonicalName: string;
  readonly normalizedCanonicalName: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly displayOrder: number;
  readonly iconKey: string | null;
  readonly lockVersion: number;
  readonly hierarchyVersion: number;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface CategoryQueryService {
  getById(query: GetCategoryByIdQuery): Promise<CategoryView | null>;

  findActiveByNormalizedName(
    query: FindCategoryByNormalizedNameQuery,
  ): Promise<CategoryView | null>;

  listByLifecycle(query: ListCategoriesByLifecycleQuery): Promise<readonly CategoryView[]>;
}
