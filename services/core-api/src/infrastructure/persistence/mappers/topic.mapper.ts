import { Injectable } from '@nestjs/common';

import type {
  TaxonomyLifecycleState as DomainLifecycleState,
  TopicRecord,
} from '../../../domain/persistence/persistence.types.js';
import {
  TaxonomyLifecycleState as PrismaLifecycleState,
  type Topic as PrismaTopic,
} from '../generated/prisma/client.js';

@Injectable()
export class TopicMapper {
  toDomain(record: PrismaTopic): TopicRecord {
    return Object.freeze({
      id: record.id,
      categoryId: record.categoryId,
      parentTopicId: record.parentTopicId,
      canonicalName: record.canonicalName,
      normalizedCanonicalName: record.normalizedCanonicalName,
      lifecycleState: this.toDomainLifecycle(record.lifecycleState),
      displayOrder: record.displayOrder,
      lockVersion: record.lockVersion,
      archivedAt: record.archivedAt === null ? null : new Date(record.archivedAt.getTime()),
      createdAt: new Date(record.createdAt.getTime()),
      updatedAt: new Date(record.updatedAt.getTime()),
    });
  }

  toPersistenceLifecycle(lifecycleState: DomainLifecycleState): PrismaLifecycleState {
    switch (lifecycleState) {
      case 'active':
        return PrismaLifecycleState.ACTIVE;
      case 'archived':
        return PrismaLifecycleState.ARCHIVED;
      default:
        throw new Error('Unsupported Topic domain lifecycle state.');
    }
  }

  private toDomainLifecycle(lifecycleState: PrismaLifecycleState): DomainLifecycleState {
    switch (lifecycleState) {
      case PrismaLifecycleState.ACTIVE:
        return 'active';
      case PrismaLifecycleState.ARCHIVED:
        return 'archived';
      default:
        throw new Error('Unsupported Topic persistence lifecycle state.');
    }
  }
}
