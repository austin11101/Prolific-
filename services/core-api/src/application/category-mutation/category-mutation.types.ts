import type {
  EntityId,
  ExpectedVersion,
  TaxonomyLifecycleState,
} from '../../domain/persistence/persistence.types.js';

export type CategoryOrdinaryMutationOperation = 'update_metadata' | 'archive' | 'restore';

export interface CategoryOrdinaryMutationState {
  readonly canonicalName: string;
  readonly normalizedCanonicalName: string;
  readonly lifecycleState: TaxonomyLifecycleState;
  readonly displayOrder: number;
  readonly iconKey: string | null;
  readonly archivedAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface PersistCategoryOrdinaryChangeCommand {
  readonly operation: CategoryOrdinaryMutationOperation;
  readonly categoryId: EntityId;
  readonly expectedLockVersion: ExpectedVersion;
  readonly expectedHierarchyVersion: ExpectedVersion;
  readonly current: CategoryOrdinaryMutationState;
  readonly resulting: CategoryOrdinaryMutationState;
}

export interface CategoryOrdinaryMutationView {
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

export interface PersistCategoryOrdinaryChangeResult {
  readonly category: CategoryOrdinaryMutationView;
  readonly previousLockVersion: ExpectedVersion;
  readonly resultingLockVersion: ExpectedVersion;
  readonly previousHierarchyVersion: ExpectedVersion;
  readonly resultingHierarchyVersion: ExpectedVersion;
}

export interface CategoryMutationService {
  persistOrdinaryChange(
    command: PersistCategoryOrdinaryChangeCommand,
  ): Promise<PersistCategoryOrdinaryChangeResult>;
}
