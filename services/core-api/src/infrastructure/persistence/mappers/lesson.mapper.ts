import { Injectable } from '@nestjs/common';

import type {
  ContentBlockRecord,
  ContentBlockType as DomainContentBlockType,
  LessonDifficulty as DomainLessonDifficulty,
  LessonRevisionRecord,
  LessonVariantRecord,
  PackageManifestRecord,
  ReadingPositionRecord,
  TaxonomyLifecycleState as DomainLifecycleState,
  TutorialAudioMetadataRecord,
} from '../../../domain/persistence/persistence.types.js';
import {
  type ContentBlock as PrismaContentBlock,
  ContentBlockType as PrismaContentBlockType,
  LessonDifficulty as PrismaLessonDifficulty,
  type LessonRevision as PrismaLessonRevision,
  type LessonVariant as PrismaLessonVariant,
  type PackageManifest as PrismaPackageManifest,
  type ReadingPosition as PrismaReadingPosition,
  TaxonomyLifecycleState as PrismaLifecycleState,
  type TutorialAudioMetadata as PrismaTutorialAudioMetadata,
} from '../generated/prisma/client.js';

@Injectable()
export class LessonMapper {
  toVariantDomain(record: PrismaLessonVariant): LessonVariantRecord {
    return Object.freeze({
      id: record.id,
      lessonId: record.lessonId,
      languageId: record.languageId,
      difficulty: this.toDomainDifficulty(record.difficulty),
      lifecycleState: this.toDomainLifecycle(record.lifecycleState),
      createdAt: new Date(record.createdAt.getTime()),
      updatedAt: new Date(record.updatedAt.getTime()),
    });
  }

  toRevisionDomain(record: PrismaLessonRevision): LessonRevisionRecord {
    return Object.freeze({
      id: record.id,
      variantId: record.variantId,
      revisionNumber: record.revisionNumber,
      title: record.title,
      wordCount: record.wordCount,
      estimatedReadingTimeSeconds: record.estimatedReadingTimeSeconds,
      isPublished: record.isPublished,
      schemaVersion: record.schemaVersion,
      createdAt: new Date(record.createdAt.getTime()),
    });
  }

  toContentBlockDomain(record: PrismaContentBlock): ContentBlockRecord {
    return Object.freeze({
      id: record.id,
      revisionId: record.revisionId,
      blockType: this.toDomainBlockType(record.blockType),
      canonicalDisplayText: record.canonicalDisplayText,
      isReadable: record.isReadable,
      displayOrder: record.displayOrder,
      createdAt: new Date(record.createdAt.getTime()),
    });
  }

  toReadingPositionDomain(record: PrismaReadingPosition): ReadingPositionRecord {
    return Object.freeze({
      id: record.id,
      revisionId: record.revisionId,
      blockId: record.blockId,
      unitId: record.unitId,
      positionIndex: record.positionIndex,
      spanStart: record.spanStart,
      spanEnd: record.spanEnd,
      surfaceText: record.surfaceText,
      normalizedText: record.normalizedText,
      createdAt: new Date(record.createdAt.getTime()),
    });
  }

  toAudioMetadataDomain(record: PrismaTutorialAudioMetadata): TutorialAudioMetadataRecord {
    return Object.freeze({
      id: record.id,
      revisionId: record.revisionId,
      audioStoragePath: record.audioStoragePath,
      durationSeconds: record.durationSeconds,
      fileSizeBytes: record.fileSizeBytes,
      mimeType: record.mimeType,
      createdAt: new Date(record.createdAt.getTime()),
    });
  }

  toPackageManifestDomain(record: PrismaPackageManifest): PackageManifestRecord {
    return Object.freeze({
      id: record.id,
      revisionId: record.revisionId,
      packageChecksum: record.packageChecksum,
      schemaVersion: record.schemaVersion,
      tokenizationProfile: record.tokenizationProfile,
      tokenizationProfileVersion: record.tokenizationProfileVersion,
      createdAt: new Date(record.createdAt.getTime()),
    });
  }

  toPersistenceLifecycle(lifecycleState: DomainLifecycleState): PrismaLifecycleState {
    switch (lifecycleState) {
      case 'active':
        return PrismaLifecycleState.ACTIVE;
      case 'archived':
        return PrismaLifecycleState.ARCHIVED;
      default:
        throw new Error('Unsupported LessonVariant domain lifecycle state.');
    }
  }

  private toDomainLifecycle(lifecycleState: PrismaLifecycleState): DomainLifecycleState {
    switch (lifecycleState) {
      case PrismaLifecycleState.ACTIVE:
        return 'active';
      case PrismaLifecycleState.ARCHIVED:
        return 'archived';
      default:
        throw new Error('Unsupported LessonVariant persistence lifecycle state.');
    }
  }

  private toDomainDifficulty(difficulty: PrismaLessonDifficulty): DomainLessonDifficulty {
    switch (difficulty) {
      case PrismaLessonDifficulty.BEGINNER:
        return 'beginner';
      case PrismaLessonDifficulty.INTERMEDIATE:
        return 'intermediate';
      case PrismaLessonDifficulty.ADVANCED:
        return 'advanced';
      default:
        throw new Error('Unsupported LessonVariant persistence difficulty.');
    }
  }

  private toDomainBlockType(blockType: PrismaContentBlockType): DomainContentBlockType {
    switch (blockType) {
      case PrismaContentBlockType.HEADING:
        return 'heading';
      case PrismaContentBlockType.PARAGRAPH:
        return 'paragraph';
      case PrismaContentBlockType.CALLOUT:
        return 'callout';
      case PrismaContentBlockType.FACT:
        return 'fact';
      case PrismaContentBlockType.QUOTE:
        return 'quote';
      default:
        throw new Error('Unsupported ContentBlock persistence block type.');
    }
  }
}
