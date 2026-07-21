import type {
  EntityId,
  RepositoryOperationContext,
  TaxonomyChangeRecordView,
  TransactionalRepositoryOperationContext,
} from '../persistence.types.js';

export interface AppendTaxonomyChangeRecordInput {
  readonly record: TaxonomyChangeRecordView;
}

export interface AppendTaxonomyCorrectionInput {
  readonly record: TaxonomyChangeRecordView;
  readonly expectedTerminalRecordId: EntityId;
}

export interface TaxonomyChangeRecordRepository {
  findById(
    id: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView | null>;

  findByCommandId(
    commandId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView | null>;

  append(
    input: AppendTaxonomyChangeRecordInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView>;

  listForCategory(
    categoryId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TaxonomyChangeRecordView[]>;

  listForTopic(
    topicId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly TaxonomyChangeRecordView[]>;

  findTerminalCorrection(
    recordId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView>;

  appendCorrection(
    input: AppendTaxonomyCorrectionInput,
    context: TransactionalRepositoryOperationContext,
  ): Promise<TaxonomyChangeRecordView>;
}
