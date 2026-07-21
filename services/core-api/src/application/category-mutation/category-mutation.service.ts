import type {
  CategoryMutationResult,
  CategoryRepository,
} from '../../domain/persistence/repositories/category.repository.js';
import type {
  CategoryRecord,
  ExpectedVersion,
  TaxonomyLifecycleState,
} from '../../domain/persistence/persistence.types.js';
import type { TransactionManager } from '../../domain/persistence/transactions/transaction-manager.js';
import { InvalidCategoryMutationCommandError } from './category-mutation.errors.js';
import type { CategoryMutationInputField } from './category-mutation.errors.js';
import type {
  CategoryMutationService,
  CategoryOrdinaryMutationOperation,
  CategoryOrdinaryMutationState,
  CategoryOrdinaryMutationView,
  PersistCategoryOrdinaryChangeCommand,
  PersistCategoryOrdinaryChangeResult,
} from './category-mutation.types.js';

const OPERATIONS = new Set<CategoryOrdinaryMutationOperation>([
  'update_metadata',
  'archive',
  'restore',
]);
const LIFECYCLE_STATES = new Set<TaxonomyLifecycleState>(['active', 'archived']);

export class DefaultCategoryMutationService implements CategoryMutationService {
  constructor(
    private readonly categories: CategoryRepository,
    private readonly transactions: TransactionManager,
  ) {}

  async persistOrdinaryChange(
    command: PersistCategoryOrdinaryChangeCommand,
  ): Promise<PersistCategoryOrdinaryChangeResult> {
    this.validate(command);

    return this.transactions.execute(async (transaction) => {
      const mutation = await this.categories.persistVersionedChange(
        {
          category: this.toRecord(command),
          expectedLockVersion: command.expectedLockVersion,
          expectedHierarchyVersion: command.expectedHierarchyVersion,
        },
        { transaction },
      );
      return this.toResult(mutation);
    });
  }

  private validate(command: PersistCategoryOrdinaryChangeCommand): void {
    if (typeof command.categoryId !== 'string' || command.categoryId.length === 0) {
      this.invalid('categoryId');
    }
    this.assertVersion(command.expectedLockVersion, 'expectedLockVersion');
    this.assertVersion(command.expectedHierarchyVersion, 'expectedHierarchyVersion');
    if (!OPERATIONS.has(command.operation)) {
      this.invalid('operation');
    }
    this.assertState(command.current, 'current');
    this.assertState(command.resulting, 'resulting');

    if (command.current.createdAt.getTime() !== command.resulting.createdAt.getTime()) {
      this.invalid('resulting');
    }

    if (command.operation === 'update_metadata') {
      if (!this.sameLifecycle(command.current, command.resulting)) {
        this.invalid('operation');
      }
      if (!this.metadataChanged(command.current, command.resulting)) {
        this.invalid('change');
      }
      return;
    }

    if (!this.sameMetadata(command.current, command.resulting)) {
      this.invalid('operation');
    }
    if (
      command.operation === 'archive' &&
      !(
        command.current.lifecycleState === 'active' &&
        command.current.archivedAt === null &&
        command.resulting.lifecycleState === 'archived' &&
        command.resulting.archivedAt !== null
      )
    ) {
      this.invalid('operation');
    }
    if (
      command.operation === 'restore' &&
      !(
        command.current.lifecycleState === 'archived' &&
        command.current.archivedAt !== null &&
        command.resulting.lifecycleState === 'active' &&
        command.resulting.archivedAt === null
      )
    ) {
      this.invalid('operation');
    }
  }

  private assertVersion(value: ExpectedVersion, field: CategoryMutationInputField): void {
    if (!Number.isSafeInteger(value) || value <= 0) {
      this.invalid(field);
    }
  }

  private assertState(state: CategoryOrdinaryMutationState, field: 'current' | 'resulting'): void {
    if (
      typeof state !== 'object' ||
      state === null ||
      typeof state.canonicalName !== 'string' ||
      state.canonicalName.length === 0 ||
      typeof state.normalizedCanonicalName !== 'string' ||
      state.normalizedCanonicalName.length === 0 ||
      !LIFECYCLE_STATES.has(state.lifecycleState) ||
      !Number.isSafeInteger(state.displayOrder) ||
      state.displayOrder < 0 ||
      (state.iconKey !== null && typeof state.iconKey !== 'string') ||
      !(state.createdAt instanceof Date) ||
      !Number.isFinite(state.createdAt.getTime()) ||
      !(state.updatedAt instanceof Date) ||
      !Number.isFinite(state.updatedAt.getTime()) ||
      (state.archivedAt !== null &&
        (!(state.archivedAt instanceof Date) || !Number.isFinite(state.archivedAt.getTime()))) ||
      (state.lifecycleState === 'active' && state.archivedAt !== null) ||
      (state.lifecycleState === 'archived' && state.archivedAt === null)
    ) {
      this.invalid(field);
    }
  }

  private metadataChanged(
    current: CategoryOrdinaryMutationState,
    resulting: CategoryOrdinaryMutationState,
  ): boolean {
    return !this.sameMetadata(current, resulting);
  }

  private sameMetadata(
    current: CategoryOrdinaryMutationState,
    resulting: CategoryOrdinaryMutationState,
  ): boolean {
    return (
      current.canonicalName === resulting.canonicalName &&
      current.normalizedCanonicalName === resulting.normalizedCanonicalName &&
      current.displayOrder === resulting.displayOrder &&
      current.iconKey === resulting.iconKey
    );
  }

  private sameLifecycle(
    current: CategoryOrdinaryMutationState,
    resulting: CategoryOrdinaryMutationState,
  ): boolean {
    return (
      current.lifecycleState === resulting.lifecycleState &&
      this.sameDate(current.archivedAt, resulting.archivedAt)
    );
  }

  private sameDate(left: Date | null, right: Date | null): boolean {
    return left === null ? right === null : right !== null && left.getTime() === right.getTime();
  }

  private toRecord(command: PersistCategoryOrdinaryChangeCommand): CategoryRecord {
    return {
      id: command.categoryId,
      canonicalName: command.resulting.canonicalName,
      normalizedCanonicalName: command.resulting.normalizedCanonicalName,
      lifecycleState: command.resulting.lifecycleState,
      displayOrder: command.resulting.displayOrder,
      iconKey: command.resulting.iconKey,
      lockVersion: command.expectedLockVersion,
      hierarchyVersion: command.expectedHierarchyVersion,
      archivedAt: this.copyNullableDate(command.resulting.archivedAt),
      createdAt: new Date(command.resulting.createdAt.getTime()),
      updatedAt: new Date(command.resulting.updatedAt.getTime()),
    };
  }

  private toResult(mutation: CategoryMutationResult): PersistCategoryOrdinaryChangeResult {
    return Object.freeze({
      category: this.toView(mutation.entity),
      previousLockVersion: mutation.previousLockVersion,
      resultingLockVersion: mutation.resultingLockVersion,
      previousHierarchyVersion: mutation.previousHierarchyVersion,
      resultingHierarchyVersion: mutation.resultingHierarchyVersion,
    });
  }

  private toView(category: CategoryRecord): CategoryOrdinaryMutationView {
    return Object.freeze({
      id: category.id,
      canonicalName: category.canonicalName,
      normalizedCanonicalName: category.normalizedCanonicalName,
      lifecycleState: category.lifecycleState,
      displayOrder: category.displayOrder,
      iconKey: category.iconKey,
      lockVersion: category.lockVersion,
      hierarchyVersion: category.hierarchyVersion,
      archivedAt: this.copyNullableDate(category.archivedAt),
      createdAt: new Date(category.createdAt.getTime()),
      updatedAt: new Date(category.updatedAt.getTime()),
    });
  }

  private copyNullableDate(value: Date | null): Date | null {
    return value === null ? null : new Date(value.getTime());
  }

  private invalid(field: CategoryMutationInputField): never {
    throw new InvalidCategoryMutationCommandError(field);
  }
}
