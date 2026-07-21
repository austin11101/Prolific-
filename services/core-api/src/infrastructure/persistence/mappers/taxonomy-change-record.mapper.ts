import { Injectable } from '@nestjs/common';

import type {
  TaxonomyChangeRecordView,
  TaxonomyLifecycleState,
} from '../../../domain/persistence/persistence.types.js';
import type { TaxonomyChangeRecord as PrismaTaxonomyChangeRecord } from '../generated/prisma/client.js';

const TAXONOMY_OPERATIONS = new Set([
  'category_create',
  'category_update',
  'category_archive',
  'category_restore',
  'topic_create',
  'topic_update',
  'topic_reparent',
  'topic_archive',
  'topic_restore',
]);

@Injectable()
export class TaxonomyChangeRecordMapper {
  toDomain(record: PrismaTaxonomyChangeRecord): TaxonomyChangeRecordView {
    return Object.freeze({
      id: record.id,
      commandId: record.commandId,
      actorPrincipalId: record.actorPrincipalId,
      categoryId: record.categoryId,
      topicId: record.topicId,
      operation: this.toPersistenceOperation(record.operation),
      reasonCode: record.reasonCode,
      previousLifecycleState: this.toLifecycle(record.previousLifecycleState),
      resultingLifecycleState: this.toLifecycle(record.resultingLifecycleState),
      previousParentTopicId: record.previousParentTopicId,
      resultingParentTopicId: record.resultingParentTopicId,
      previousVersion: record.previousVersion,
      resultingVersion: record.resultingVersion,
      supersedesChangeRecordId: record.supersedesChangeRecordId,
      occurredAt: new Date(record.occurredAt.getTime()),
      createdAt: new Date(record.createdAt.getTime()),
    });
  }

  toPersistenceOperation(operation: string): string {
    if (!TAXONOMY_OPERATIONS.has(operation)) {
      throw new Error('Unsupported Taxonomy Change Record operation.');
    }
    return operation;
  }

  toPersistenceLifecycle(
    lifecycleState: TaxonomyLifecycleState | null,
  ): TaxonomyLifecycleState | null {
    return this.toLifecycle(lifecycleState);
  }

  private toLifecycle(value: string | null): TaxonomyLifecycleState | null {
    if (value === null || value === 'active' || value === 'archived') {
      return value;
    }
    throw new Error('Unsupported Taxonomy Change Record lifecycle state.');
  }
}
