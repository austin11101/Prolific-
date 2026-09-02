import type { LessonRepository } from '../../domain/persistence/repositories/lesson.repository.js';
import type {
  CatalogItem,
  CatalogPage,
  ContentBlockView,
  GetLessonRevisionQuery,
  GetPublishedCatalogQuery,
  LessonQueryService,
  PackageManifestView,
  PublishedLessonDescriptor,
  ReadingPositionView,
  TutorialAudioMetadataView,
} from './lesson-query.types.js';
import type {
  ContentBlockRecord,
  PackageManifestRecord,
  ReadingPositionRecord,
  TutorialAudioMetadataRecord,
} from '../../domain/persistence/persistence.types.js';
import { InvalidLessonQueryError } from './lesson-query.errors.js';

const MAX_PAGE_LIMIT = 100;
const DEFAULT_PAGE_LIMIT = 20;

export class DefaultLessonQueryService implements LessonQueryService {
  constructor(private readonly lessons: LessonRepository) {}

  async getCatalog(query: GetPublishedCatalogQuery): Promise<CatalogPage> {
    const limit = this.clampLimit(query.limit);
    const offset = Math.max(0, query.offset ?? 0);

    const result = await this.lessons.listPublishedCatalog({
      limit,
      offset,
      languageId: query.languageId,
    });

    const items: CatalogItem[] = result.entries.map((entry) =>
      Object.freeze({
        revisionId: entry.revision.id,
        variantId: entry.variant.id,
        languageId: entry.variant.languageId,
        difficulty: entry.variant.difficulty,
        revisionNumber: entry.revision.revisionNumber,
        title: entry.revision.title,
        wordCount: entry.revision.wordCount,
        estimatedReadingTimeSeconds: entry.revision.estimatedReadingTimeSeconds,
        schemaVersion: entry.revision.schemaVersion,
        publishedAt: new Date(entry.revision.createdAt.getTime()),
      }),
    );

    return Object.freeze({
      items: Object.freeze(items),
      pagination: Object.freeze({
        total: result.total,
        count: items.length,
        limit,
        offset,
      }),
    });
  }

  async getLessonRevision(
    query: GetLessonRevisionQuery,
  ): Promise<PublishedLessonDescriptor | null> {
    if (typeof query.revisionId !== 'string' || query.revisionId.length === 0) {
      throw new InvalidLessonQueryError('revisionId');
    }

    const detail = await this.lessons.findPublishedRevisionById(query.revisionId);
    if (detail === null) {
      return null;
    }

    return Object.freeze({
      revisionId: detail.revision.id,
      variantId: detail.variant.id,
      languageId: detail.variant.languageId,
      difficulty: detail.variant.difficulty,
      revisionNumber: detail.revision.revisionNumber,
      title: detail.revision.title,
      wordCount: detail.revision.wordCount,
      estimatedReadingTimeSeconds: detail.revision.estimatedReadingTimeSeconds,
      schemaVersion: detail.revision.schemaVersion,
      createdAt: new Date(detail.revision.createdAt.getTime()),
      contentBlocks: Object.freeze(detail.contentBlocks.map((b) => this.toContentBlockView(b))),
      readingPositions: Object.freeze(
        detail.readingPositions.map((p) => this.toReadingPositionView(p)),
      ),
      audioMetadata:
        detail.audioMetadata === null ? null : this.toAudioMetadataView(detail.audioMetadata),
      packageManifest:
        detail.packageManifest === null ? null : this.toPackageManifestView(detail.packageManifest),
    });
  }

  private clampLimit(value: number | undefined): number {
    if (typeof value !== 'number' || value <= 0) {
      return DEFAULT_PAGE_LIMIT;
    }
    return Math.min(value, MAX_PAGE_LIMIT);
  }

  private toContentBlockView(record: ContentBlockRecord): ContentBlockView {
    return Object.freeze({
      id: record.id,
      blockType: record.blockType,
      canonicalDisplayText: record.canonicalDisplayText,
      isReadable: record.isReadable,
      displayOrder: record.displayOrder,
    });
  }

  private toReadingPositionView(record: ReadingPositionRecord): ReadingPositionView {
    return Object.freeze({
      id: record.id,
      blockId: record.blockId,
      unitId: record.unitId,
      positionIndex: record.positionIndex,
      spanStart: record.spanStart,
      spanEnd: record.spanEnd,
      surfaceText: record.surfaceText,
      normalizedText: record.normalizedText,
    });
  }

  private toAudioMetadataView(record: TutorialAudioMetadataRecord): TutorialAudioMetadataView {
    return Object.freeze({
      id: record.id,
      audioStoragePath: record.audioStoragePath,
      durationSeconds: record.durationSeconds,
      fileSizeBytes: record.fileSizeBytes,
      mimeType: record.mimeType,
    });
  }

  private toPackageManifestView(record: PackageManifestRecord): PackageManifestView {
    return Object.freeze({
      id: record.id,
      packageChecksum: record.packageChecksum,
      schemaVersion: record.schemaVersion,
      tokenizationProfile: record.tokenizationProfile,
      tokenizationProfileVersion: record.tokenizationProfileVersion,
    });
  }
}
