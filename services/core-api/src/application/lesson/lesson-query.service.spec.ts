import { jest } from '@jest/globals';

import type {
  CatalogEntry,
  LessonRepository,
  LessonRevisionDetail,
  ListPublishedCatalogOptions,
  ListPublishedCatalogResult,
} from '../../domain/persistence/repositories/lesson.repository.js';
import type {
  ContentBlockRecord,
  LessonRevisionRecord,
  LessonVariantRecord,
  ReadingPositionRecord,
} from '../../domain/persistence/persistence.types.js';
import { PersistenceError } from '../../infrastructure/persistence/errors/persistence.errors.js';
import { InvalidLessonQueryError } from './lesson-query.errors.js';
import { DefaultLessonQueryService } from './lesson-query.service.js';

function variantFixture(overrides: Partial<LessonVariantRecord> = {}): LessonVariantRecord {
  return {
    id: '60000000-0000-4000-8000-000000000001',
    lessonId: '50000000-0000-4000-8000-000000000001',
    languageId: '10000000-0000-4000-8000-000000000001',
    difficulty: 'beginner',
    lifecycleState: 'active',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    updatedAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

function revisionFixture(overrides: Partial<LessonRevisionRecord> = {}): LessonRevisionRecord {
  return {
    id: '70000000-0000-4000-8000-000000000001',
    variantId: '60000000-0000-4000-8000-000000000001',
    revisionNumber: 1,
    title: 'Animals of South Africa',
    wordCount: 50,
    estimatedReadingTimeSeconds: 30,
    isPublished: true,
    schemaVersion: '1.0',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

function blockFixture(overrides: Partial<ContentBlockRecord> = {}): ContentBlockRecord {
  return {
    id: 'b0000000-0000-4000-8000-000000000001',
    revisionId: '70000000-0000-4000-8000-000000000001',
    blockType: 'paragraph',
    canonicalDisplayText: 'A paragraph of text.',
    isReadable: true,
    displayOrder: 0,
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

function positionFixture(overrides: Partial<ReadingPositionRecord> = {}): ReadingPositionRecord {
  return {
    id: 'p0000000-0000-4000-8000-000000000001',
    revisionId: '70000000-0000-4000-8000-000000000001',
    blockId: 'b0000000-0000-4000-8000-000000000001',
    unitId: 'u0000000-0000-4000-8000-000000000001',
    positionIndex: 0,
    spanStart: 0,
    spanEnd: 1,
    surfaceText: 'A',
    normalizedText: 'a',
    createdAt: new Date('2026-08-01T10:00:00.000Z'),
    ...overrides,
  };
}

function revisionDetailFixture(
  overrides: Partial<LessonRevisionDetail> = {},
): LessonRevisionDetail {
  return {
    revision: revisionFixture(),
    variant: variantFixture(),
    contentBlocks: [blockFixture()],
    readingPositions: [positionFixture()],
    audioMetadata: null,
    packageManifest: null,
    ...overrides,
  };
}

describe('DefaultLessonQueryService', () => {
  const findPublishedRevisionById = jest.fn<LessonRepository['findPublishedRevisionById']>();
  const listPublishedRevisionsByVariant =
    jest.fn<LessonRepository['listPublishedRevisionsByVariant']>();
  const listPublishedCatalog = jest.fn<LessonRepository['listPublishedCatalog']>();

  const repository = {
    findPublishedRevisionById,
    listPublishedRevisionsByVariant,
    listPublishedCatalog,
  } satisfies LessonRepository;

  const service = new DefaultLessonQueryService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── getCatalog ───────────────────────────────────────────────────────

  describe('getCatalog', () => {
    it('returns a paginated catalog page with correct pagination metadata', async () => {
      const variant = variantFixture();
      const revision = revisionFixture();
      const entry: CatalogEntry = { revision, variant };
      const repoResult: ListPublishedCatalogResult = { entries: [entry], total: 1 };
      listPublishedCatalog.mockResolvedValue(repoResult);

      const result = await service.getCatalog({ limit: 10, offset: 0 });

      expect(listPublishedCatalog).toHaveBeenCalledTimes(1);
      expect(listPublishedCatalog).toHaveBeenCalledWith({
        limit: 10,
        offset: 0,
        languageId: undefined,
      } satisfies ListPublishedCatalogOptions);
      expect(result.pagination).toEqual({ total: 1, count: 1, limit: 10, offset: 0 });
      expect(result.items).toHaveLength(1);
      expect(result.items[0]?.revisionId).toBe(revision.id);
      expect(result.items[0]?.languageId).toBe(variant.languageId);
      expect(result.items[0]?.difficulty).toBe('beginner');
      expect(Object.isFrozen(result)).toBe(true);
      expect(Object.isFrozen(result.items)).toBe(true);
    });

    it('passes an optional languageId filter to the repository', async () => {
      listPublishedCatalog.mockResolvedValue({ entries: [], total: 0 });
      const langId = '10000000-0000-4000-8000-000000000001';

      await service.getCatalog({ limit: 5, offset: 0, languageId: langId });

      expect(listPublishedCatalog).toHaveBeenCalledWith(
        expect.objectContaining({ languageId: langId }),
      );
    });

    it('clamps limit to 100 and uses default 20 for invalid values', async () => {
      listPublishedCatalog.mockResolvedValue({ entries: [], total: 0 });

      await service.getCatalog({ limit: 9999, offset: 0 });
      expect(listPublishedCatalog).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));

      jest.clearAllMocks();
      listPublishedCatalog.mockResolvedValue({ entries: [], total: 0 });
      await service.getCatalog({ limit: 0, offset: 0 });
      expect(listPublishedCatalog).toHaveBeenCalledWith(expect.objectContaining({ limit: 20 }));
    });

    it('coerces negative offsets to zero', async () => {
      listPublishedCatalog.mockResolvedValue({ entries: [], total: 0 });

      await service.getCatalog({ limit: 10, offset: -5 });
      expect(listPublishedCatalog).toHaveBeenCalledWith(expect.objectContaining({ offset: 0 }));
    });

    it('returns an empty frozen page when repository returns nothing', async () => {
      listPublishedCatalog.mockResolvedValue({ entries: [], total: 0 });

      const result = await service.getCatalog({ limit: 20, offset: 0 });

      expect(result.items).toEqual([]);
      expect(result.pagination.total).toBe(0);
      expect(Object.isFrozen(result.items)).toBe(true);
    });

    it('propagates persistence errors unchanged', async () => {
      const error = new PersistenceError();
      listPublishedCatalog.mockRejectedValue(error);

      await expect(service.getCatalog({ limit: 10, offset: 0 })).rejects.toBe(error);
    });
  });

  // ── getLessonRevision ────────────────────────────────────────────────

  describe('getLessonRevision', () => {
    it('returns a fully mapped descriptor for a published revision', async () => {
      const detail = revisionDetailFixture();
      findPublishedRevisionById.mockResolvedValue(detail);

      const result = await service.getLessonRevision({ revisionId: detail.revision.id });

      expect(findPublishedRevisionById).toHaveBeenCalledWith(detail.revision.id);
      expect(result).not.toBeNull();
      expect(result?.revisionId).toBe(detail.revision.id);
      expect(result?.variantId).toBe(detail.variant.id);
      expect(result?.languageId).toBe(detail.variant.languageId);
      expect(result?.difficulty).toBe('beginner');
      expect(result?.contentBlocks).toHaveLength(1);
      expect(result?.contentBlocks[0]?.blockType).toBe('paragraph');
      expect(result?.readingPositions).toHaveLength(1);
      expect(result?.audioMetadata).toBeNull();
      expect(result?.packageManifest).toBeNull();
      expect(Object.isFrozen(result)).toBe(true);
    });

    it('returns null when revision is not found or not published', async () => {
      findPublishedRevisionById.mockResolvedValue(null);

      const result = await service.getLessonRevision({ revisionId: 'missing-id' });

      expect(result).toBeNull();
    });

    it('rejects empty revisionId without calling persistence', async () => {
      await expect(service.getLessonRevision({ revisionId: '' })).rejects.toMatchObject({
        code: 'INVALID_LESSON_QUERY',
        field: 'revisionId',
      });
      expect(findPublishedRevisionById).not.toHaveBeenCalled();
    });

    it('rejects invalid (non-string) revisionId without calling persistence', async () => {
      await expect(
        service.getLessonRevision({ revisionId: null as unknown as string }),
      ).rejects.toBeInstanceOf(InvalidLessonQueryError);
      expect(findPublishedRevisionById).not.toHaveBeenCalled();
    });

    it('does not expose the revision createdAt Date instance from the record', async () => {
      const detail = revisionDetailFixture();
      findPublishedRevisionById.mockResolvedValue(detail);

      const result = await service.getLessonRevision({ revisionId: detail.revision.id });

      expect(result?.createdAt).not.toBe(detail.revision.createdAt);
      expect(result?.createdAt.getTime()).toBe(detail.revision.createdAt.getTime());
    });

    it('propagates persistence errors unchanged', async () => {
      const error = new PersistenceError();
      findPublishedRevisionById.mockRejectedValue(error);

      await expect(service.getLessonRevision({ revisionId: 'some-id' })).rejects.toBe(error);
    });
  });
});
