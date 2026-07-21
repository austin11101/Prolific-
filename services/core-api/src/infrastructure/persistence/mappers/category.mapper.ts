import { Injectable } from '@nestjs/common';

import type {
  CategoryRecord,
  TaxonomyLifecycleState as DomainLifecycleState,
} from '../../../domain/persistence/persistence.types.js';
import {
  type Category as PrismaCategory,
  TaxonomyLifecycleState as PrismaLifecycleState,
} from '../generated/prisma/client.js';

@Injectable()
export class CategoryMapper {
  toDomain(record: PrismaCategory): CategoryRecord {
    return Object.freeze({
      id: record.id,
      canonicalName: record.canonicalName,
      normalizedCanonicalName: record.normalizedCanonicalName,
      lifecycleState: this.toDomainLifecycle(record.lifecycleState),
      displayOrder: record.displayOrder,
      iconKey: record.iconKey,
      lockVersion: record.lockVersion,
      hierarchyVersion: record.hierarchyVersion,
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
        throw new Error('Unsupported Category domain lifecycle state.');
    }
  }

  private toDomainLifecycle(lifecycleState: PrismaLifecycleState): DomainLifecycleState {
    switch (lifecycleState) {
      case PrismaLifecycleState.ACTIVE:
        return 'active';
      case PrismaLifecycleState.ARCHIVED:
        return 'archived';
      default:
        throw new Error('Unsupported Category persistence lifecycle state.');
    }
  }
}
