import { jest } from '@jest/globals';

import type { LanguageRepository } from '../../domain/persistence/repositories/language.repository.js';
import type { LanguageRecord } from '../../domain/persistence/persistence.types.js';
import { PersistenceError } from '../../infrastructure/persistence/errors/persistence.errors.js';
import { InvalidLanguageQueryError } from './language-query.errors.js';
import { DefaultLanguageQueryService } from './language-query.service.js';

type FindById = LanguageRepository['findById'];
type FindByNormalizedTag = LanguageRepository['findByNormalizedTag'];
type ListContentEnabled = LanguageRepository['listContentEnabled'];

function languageFixture(overrides: Partial<LanguageRecord> = {}): LanguageRecord {
  return {
    id: 'b59a72c2-bb1d-43e2-b0ab-b3d7fdd08890',
    bcp47Tag: 'en-ZA',
    normalizedTag: 'en-za',
    isoLanguageBasis: 'eng',
    canonicalName: 'English',
    normalizedName: 'english',
    displayOrder: 1,
    isContentEnabled: true,
    retiredAt: null,
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    updatedAt: new Date('2026-07-20T10:00:00.000Z'),
    ...overrides,
  };
}

describe('DefaultLanguageQueryService', () => {
  const findById = jest.fn<FindById>();
  const findByNormalizedTag = jest.fn<FindByNormalizedTag>();
  const listContentEnabled = jest.fn<ListContentEnabled>();
  const repository = {
    findById,
    findByNormalizedTag,
    listContentEnabled,
    listGovernanceManaged: jest.fn<LanguageRepository['listGovernanceManaged']>(),
  } satisfies LanguageRepository;
  const service = new DefaultLanguageQueryService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets a Language by exact ID and returns a defensive immutable view', async () => {
    const record = languageFixture({ retiredAt: new Date('2026-07-21T10:00:00.000Z') });
    findById.mockResolvedValue(record);

    const result = await service.getById({ languageId: record.id });

    expect(findById).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(record.id);
    expect(result).toEqual(record);
    expect(result).not.toBe(record);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result?.createdAt).not.toBe(record.createdAt);
    expect(result?.updatedAt).not.toBe(record.updatedAt);
    expect(result?.retiredAt).not.toBe(record.retiredAt);
  });

  it('returns null when an ID is absent', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById({ languageId: 'missing-id' })).resolves.toBeNull();
  });

  it('rejects an empty ID without calling persistence', async () => {
    await expect(service.getById({ languageId: '' })).rejects.toMatchObject({
      code: 'INVALID_LANGUAGE_QUERY',
      field: 'languageId',
    });
    expect(findById).not.toHaveBeenCalled();
  });

  it('passes a normalized tag exactly once without trimming or case conversion', async () => {
    const record = languageFixture();
    findByNormalizedTag.mockResolvedValue(record);

    await expect(service.getByTag({ normalizedTag: ' EN-ZA ' })).resolves.toEqual(record);
    expect(findByNormalizedTag).toHaveBeenCalledTimes(1);
    expect(findByNormalizedTag).toHaveBeenCalledWith(' EN-ZA ');
  });

  it('returns null when a normalized tag is absent', async () => {
    findByNormalizedTag.mockResolvedValue(null);

    await expect(service.getByTag({ normalizedTag: 'missing' })).resolves.toBeNull();
  });

  it('rejects an empty normalized tag without calling persistence', async () => {
    await expect(service.getByTag({ normalizedTag: '' })).rejects.toBeInstanceOf(
      InvalidLanguageQueryError,
    );
    expect(findByNormalizedTag).not.toHaveBeenCalled();
  });

  it('preserves repository ordering in a defensive immutable collection', async () => {
    const english = languageFixture();
    const isiZulu = languageFixture({
      id: '70776e42-a5fa-4c85-8c00-ba1cac8dcbac',
      bcp47Tag: 'zu-ZA',
      normalizedTag: 'zu-za',
      isoLanguageBasis: 'zul',
      canonicalName: 'isiZulu',
      normalizedName: 'isizulu',
      displayOrder: 2,
    });
    const repositoryResult = [english, isiZulu];
    listContentEnabled.mockResolvedValue(repositoryResult);

    const result = await service.listContentEnabled();

    expect(listContentEnabled).toHaveBeenCalledTimes(1);
    expect(listContentEnabled).toHaveBeenCalledWith();
    expect(result.map((language) => language.id)).toEqual([english.id, isiZulu.id]);
    expect(result).not.toBe(repositoryResult);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.every((language) => Object.isFrozen(language))).toBe(true);
    expect(repositoryResult).toEqual([english, isiZulu]);
  });

  it('returns an immutable empty collection', async () => {
    listContentEnabled.mockResolvedValue([]);

    const result = await service.listContentEnabled();

    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('propagates safe persistence errors unchanged', async () => {
    const error = new PersistenceError();
    findById.mockRejectedValue(error);

    await expect(service.getById({ languageId: 'language-id' })).rejects.toBe(error);
  });
});
