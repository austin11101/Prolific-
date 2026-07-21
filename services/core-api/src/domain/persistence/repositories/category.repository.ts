import type {
  CategoryRecord,
  EntityId,
  ExpectedVersion,
  RepositoryOperationContext,
  TaxonomyLifecycleState,
  TransactionalRepositoryOperationContext,
} from '../persistence.types.js';

export interface PersistCategoryChangeInput {
  readonly category: CategoryRecord;
  readonly expectedLockVersion: ExpectedVersion;
  readonly expectedHierarchyVersion: ExpectedVersion;
}

export interface CategoryMutationResult {
  readonly entity: CategoryRecord;
  readonly previousLockVersion: ExpectedVersion;
  readonly resultingLockVersion: ExpectedVersion;
  readonly previousHierarchyVersion: ExpectedVersion;
  readonly resultingHierarchyVersion: ExpectedVersion;
}

export interface CategoryRepository {
  findById(id: EntityId, context?: RepositoryOperationContext): Promise<CategoryRecord | null>;

  findActiveByNormalizedName(
    normalizedName: string,
    context?: RepositoryOperationContext,
  ): Promise<CategoryRecord | null>;

  listByLifecycle(
    lifecycleState: TaxonomyLifecycleState,
    context?: RepositoryOperationContext,
  ): Promise<readonly CategoryRecord[]>;

  persistVersionedChange(
    input: PersistCategoryChangeInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<CategoryMutationResult>;
}
