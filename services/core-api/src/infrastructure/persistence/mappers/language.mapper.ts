import { Injectable } from '@nestjs/common';

import type { LanguageRecord } from '../../../domain/persistence/persistence.types.js';
import type { Language as PrismaLanguage } from '../generated/prisma/client.js';

@Injectable()
export class LanguageMapper {
  toDomain(record: PrismaLanguage): LanguageRecord {
    return Object.freeze({
      id: record.id,
      bcp47Tag: record.bcp47Tag,
      normalizedTag: record.normalizedTag,
      isoLanguageBasis: record.isoLanguageBasis,
      canonicalName: record.canonicalName,
      normalizedName: record.normalizedName,
      displayOrder: record.displayOrder,
      isContentEnabled: record.isContentEnabled,
      retiredAt: record.retiredAt === null ? null : new Date(record.retiredAt.getTime()),
      createdAt: new Date(record.createdAt.getTime()),
      updatedAt: new Date(record.updatedAt.getTime()),
    });
  }
}
