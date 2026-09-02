import type { EntityId, LessonDifficulty } from '../../domain/persistence/persistence.types.js';

export interface ContentBlockView {
  readonly id: EntityId;
  readonly blockType: string;
  readonly canonicalDisplayText: string;
  readonly isReadable: boolean;
  readonly displayOrder: number;
}

export interface ReadingPositionView {
  readonly id: EntityId;
  readonly blockId: EntityId;
  readonly unitId: EntityId;
  readonly positionIndex: number;
  readonly spanStart: number;
  readonly spanEnd: number;
  readonly surfaceText: string;
  readonly normalizedText: string;
}

export interface TutorialAudioMetadataView {
  readonly id: EntityId;
  readonly audioStoragePath: string;
  readonly durationSeconds: number;
  readonly fileSizeBytes: bigint;
  readonly mimeType: string;
}

export interface PackageManifestView {
  readonly id: EntityId;
  readonly packageChecksum: string;
  readonly schemaVersion: string;
  readonly tokenizationProfile: string;
  readonly tokenizationProfileVersion: string;
}

export interface PublishedLessonDescriptor {
  readonly revisionId: EntityId;
  readonly variantId: EntityId;
  readonly languageId: EntityId;
  readonly difficulty: LessonDifficulty;
  readonly revisionNumber: number;
  readonly title: string;
  readonly wordCount: number;
  readonly estimatedReadingTimeSeconds: number;
  readonly schemaVersion: string;
  readonly createdAt: Date;
  readonly contentBlocks: readonly ContentBlockView[];
  readonly readingPositions: readonly ReadingPositionView[];
  readonly audioMetadata: TutorialAudioMetadataView | null;
  readonly packageManifest: PackageManifestView | null;
}

export interface CatalogItem {
  readonly revisionId: EntityId;
  readonly variantId: EntityId;
  readonly languageId: EntityId;
  readonly difficulty: LessonDifficulty;
  readonly revisionNumber: number;
  readonly title: string;
  readonly wordCount: number;
  readonly estimatedReadingTimeSeconds: number;
  readonly schemaVersion: string;
  readonly publishedAt: Date;
}

export interface PaginationMeta {
  readonly total: number;
  readonly count: number;
  readonly limit: number;
  readonly offset: number;
}

export interface CatalogPage {
  readonly items: readonly CatalogItem[];
  readonly pagination: PaginationMeta;
}

export interface GetPublishedCatalogQuery {
  readonly limit: number;
  readonly offset: number;
  readonly languageId?: EntityId;
}

export interface GetLessonRevisionQuery {
  readonly revisionId: EntityId;
}

export interface LessonQueryService {
  getCatalog(query: GetPublishedCatalogQuery): Promise<CatalogPage>;
  getLessonRevision(query: GetLessonRevisionQuery): Promise<PublishedLessonDescriptor | null>;
}
