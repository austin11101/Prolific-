import { jest } from '@jest/globals';

import type { CategoryRepository } from '../../domain/persistence/repositories/category.repository.js';
import type { CategoryRecord } from '../../domain/persistence/persistence.types.js';
import { PersistenceError } from '../../infrastructure/persistence/errors/persistence.errors.js';
import { InvalidCategoryQueryError } from './category-query.errors.js';
import { DefaultCategoryQueryService } from './category-query.service.js';

function categoryFixture(overrides: Partial<CategoryRecord> = {}): CategoryRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    canonicalName: 'Science',
    normalizedCanonicalName: 'science',
    lifecycleState: 'active',
    displayOrder: 1,
    iconKey: 'science',
    lockVersion: 1,
    hierarchyVersion: 1,
    archivedAt: null,
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    updatedAt: new Date('2026-07-20T10:00:00.000Z'),
    ...overrides,
  };
}

describe('DefaultCategoryQueryService', () => {
  const findById = jest.fn<CategoryRepository['findById']>();
  const findActiveByNormalizedName = jest.fn<CategoryRepository['findActiveByNormalizedName']>();
  const listByLifecycle = jest.fn<CategoryRepository['listByLifecycle']>();
  const persistVersionedChange = jest.fn<CategoryRepository['persistVersionedChange']>();
  const repository = {
    findById,
    findActiveByNormalizedName,
    listByLifecycle,
    persistVersionedChange,
  } satisfies CategoryRepository;
  const service = new DefaultCategoryQueryService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets a Category by exact ID and returns a defensive immutable view', async () => {
    const record = categoryFixture({
      lifecycleState: 'archived',
      archivedAt: new Date('2026-07-21T10:00:00.000Z'),
    });
    findById.mockResolvedValue(record);

    const result = await service.getById({ categoryId: record.id });

    expect(findById).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(record.id);
    expect(result).toEqual(record);
    expect(result).not.toBe(record);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result?.createdAt).not.toBe(record.createdAt);
    expect(result?.updatedAt).not.toBe(record.updatedAt);
    expect(result?.archivedAt).not.toBe(record.archivedAt);
    expect(persistVersionedChange).not.toHaveBeenCalled();
  });

  it('returns null when an ID is absent', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById({ categoryId: 'missing-id' })).resolves.toBeNull();
  });

  it('rejects an empty ID without calling persistence', async () => {
    await expect(service.getById({ categoryId: '' })).rejects.toMatchObject({
      code: 'INVALID_CATEGORY_QUERY',
      field: 'categoryId',
    });
    expect(findById).not.toHaveBeenCalled();
  });

  it('passes an active normalized name exactly once without rewriting it', async () => {
    const record = categoryFixture();
    findActiveByNormalizedName.mockResolvedValue(record);

    await expect(
      service.findActiveByNormalizedName({ normalizedName: ' Science ' }),
    ).resolves.toEqual(record);
    expect(findActiveByNormalizedName).toHaveBeenCalledTimes(1);
    expect(findActiveByNormalizedName).toHaveBeenCalledWith(' Science ');
    expect(persistVersionedChange).not.toHaveBeenCalled();
  });

  it('returns null when an active normalized name is absent', async () => {
    findActiveByNormalizedName.mockResolvedValue(null);

    await expect(
      service.findActiveByNormalizedName({ normalizedName: 'missing' }),
    ).resolves.toBeNull();
  });

  it('rejects an empty normalized name without calling persistence', async () => {
    await expect(service.findActiveByNormalizedName({ normalizedName: '' })).rejects.toBeInstanceOf(
      InvalidCategoryQueryError,
    );
    expect(findActiveByNormalizedName).not.toHaveBeenCalled();
  });

  it('delegates the exact lifecycle and preserves deterministic repository ordering', async () => {
    const science = categoryFixture();
    const history = categoryFixture({
      id: '22222222-2222-4222-8222-222222222222',
      canonicalName: 'History',
      normalizedCanonicalName: 'history',
      displayOrder: 2,
    });
    const repositoryResult = [science, history];
    listByLifecycle.mockResolvedValue(repositoryResult);

    const result = await service.listByLifecycle({ lifecycleState: 'active' });

    expect(listByLifecycle).toHaveBeenCalledTimes(1);
    expect(listByLifecycle).toHaveBeenCalledWith('active');
    expect(result.map((category) => category.id)).toEqual([science.id, history.id]);
    expect(result).not.toBe(repositoryResult);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.every((category) => Object.isFrozen(category))).toBe(true);
    expect(repositoryResult).toEqual([science, history]);
    expect(persistVersionedChange).not.toHaveBeenCalled();
  });

  it('supports the approved archived lifecycle exactly', async () => {
    listByLifecycle.mockResolvedValue([]);

    await service.listByLifecycle({ lifecycleState: 'archived' });

    expect(listByLifecycle).toHaveBeenCalledWith('archived');
  });

  it('rejects an empty or unsupported lifecycle without calling persistence', async () => {
    await expect(service.listByLifecycle({ lifecycleState: '' as 'active' })).rejects.toMatchObject(
      {
        code: 'INVALID_CATEGORY_QUERY',
        field: 'lifecycleState',
      },
    );
    await expect(
      service.listByLifecycle({ lifecycleState: 'retired' as 'active' }),
    ).rejects.toBeInstanceOf(InvalidCategoryQueryError);
    expect(listByLifecycle).not.toHaveBeenCalled();
  });

  it('returns an immutable empty collection', async () => {
    listByLifecycle.mockResolvedValue([]);

    const result = await service.listByLifecycle({ lifecycleState: 'active' });

    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('propagates safe persistence errors unchanged', async () => {
    const error = new PersistenceError();
    findById.mockRejectedValue(error);

    await expect(service.getById({ categoryId: 'category-id' })).rejects.toBe(error);
  });
});
