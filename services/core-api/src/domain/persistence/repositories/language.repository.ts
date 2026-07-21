import type { EntityId, LanguageRecord, RepositoryOperationContext } from '../persistence.types.js';

export interface LanguageRepository {
  findById(id: EntityId, context?: RepositoryOperationContext): Promise<LanguageRecord | null>;

  findByNormalizedTag(
    normalizedTag: string,
    context?: RepositoryOperationContext,
  ): Promise<LanguageRecord | null>;

  listContentEnabled(context?: RepositoryOperationContext): Promise<readonly LanguageRecord[]>;

  listGovernanceManaged(context?: RepositoryOperationContext): Promise<readonly LanguageRecord[]>;
}
