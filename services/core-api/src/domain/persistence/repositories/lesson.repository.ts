import type {
  ContentBlockRecord,
  EntityId,
  LessonRevisionRecord,
  LessonVariantRecord,
  PackageManifestRecord,
  ReadingPositionRecord,
  RepositoryOperationContext,
  TutorialAudioMetadataRecord,
} from '../persistence.types.js';

export interface LessonRevisionDetail {
  readonly revision: LessonRevisionRecord;
  readonly variant: LessonVariantRecord;
  readonly contentBlocks: readonly ContentBlockRecord[];
  readonly readingPositions: readonly ReadingPositionRecord[];
  readonly audioMetadata: TutorialAudioMetadataRecord | null;
  readonly packageManifest: PackageManifestRecord | null;
}

export interface CatalogEntry {
  readonly revision: LessonRevisionRecord;
  readonly variant: LessonVariantRecord;
}

export interface ListPublishedCatalogOptions {
  readonly limit: number;
  readonly offset: number;
  readonly languageId?: EntityId;
}

export interface ListPublishedCatalogResult {
  readonly entries: readonly CatalogEntry[];
  readonly total: number;
}

export interface LessonRepository {
  findPublishedRevisionById(
    revisionId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<LessonRevisionDetail | null>;

  listPublishedRevisionsByVariant(
    variantId: EntityId,
    context?: RepositoryOperationContext,
  ): Promise<readonly LessonRevisionRecord[]>;

  listPublishedCatalog(
    options: ListPublishedCatalogOptions,
    context?: RepositoryOperationContext,
  ): Promise<ListPublishedCatalogResult>;
}
