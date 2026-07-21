import { jest } from '@jest/globals';

import type { TopicRepository } from '../../domain/persistence/repositories/topic.repository.js';
import type { TopicRecord } from '../../domain/persistence/persistence.types.js';
import { PersistenceError } from '../../infrastructure/persistence/errors/persistence.errors.js';
import { InvalidTopicQueryError } from './topic-query.errors.js';
import { DefaultTopicQueryService } from './topic-query.service.js';

function topicFixture(overrides: Partial<TopicRecord> = {}): TopicRecord {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    categoryId: '22222222-2222-4222-8222-222222222222',
    parentTopicId: null,
    canonicalName: 'Astronomy',
    normalizedCanonicalName: 'astronomy',
    lifecycleState: 'active',
    displayOrder: 1,
    lockVersion: 1,
    archivedAt: null,
    createdAt: new Date('2026-07-20T10:00:00.000Z'),
    updatedAt: new Date('2026-07-20T10:00:00.000Z'),
    ...overrides,
  };
}

describe('DefaultTopicQueryService', () => {
  const findById = jest.fn<TopicRepository['findById']>();
  const findActiveByScopedName = jest.fn<TopicRepository['findActiveByScopedName']>();
  const listRootsByCategory = jest.fn<TopicRepository['listRootsByCategory']>();
  const listChildren = jest.fn<TopicRepository['listChildren']>();
  const loadHierarchy = jest.fn<TopicRepository['loadHierarchy']>();
  const persistVersionedChange = jest.fn<TopicRepository['persistVersionedChange']>();
  const persistOrdinaryChange = jest.fn<TopicRepository['persistOrdinaryChange']>();
  const repository = {
    findById,
    findActiveByScopedName,
    listRootsByCategory,
    listChildren,
    loadHierarchy,
    persistVersionedChange,
    persistOrdinaryChange,
  } satisfies TopicRepository;
  const service = new DefaultTopicQueryService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('gets a Topic by exact ID and returns a defensive immutable view', async () => {
    const record = topicFixture({
      lifecycleState: 'archived',
      archivedAt: new Date('2026-07-21T10:00:00.000Z'),
    });
    findById.mockResolvedValue(record);

    const result = await service.getById({ topicId: record.id });

    expect(findById).toHaveBeenCalledTimes(1);
    expect(findById).toHaveBeenCalledWith(record.id);
    expect(result).toEqual(record);
    expect(result).not.toBe(record);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result?.createdAt).not.toBe(record.createdAt);
    expect(result?.updatedAt).not.toBe(record.updatedAt);
    expect(result?.archivedAt).not.toBe(record.archivedAt);
    expectUnapprovedMethodsNotCalled();
  });

  it('returns null when a Topic ID is absent', async () => {
    findById.mockResolvedValue(null);

    await expect(service.getById({ topicId: 'missing-id' })).resolves.toBeNull();
  });

  it('rejects an empty Topic ID without calling persistence', async () => {
    await expect(service.getById({ topicId: '' })).rejects.toMatchObject({
      code: 'INVALID_TOPIC_QUERY',
      field: 'topicId',
    });
    expect(findById).not.toHaveBeenCalled();
  });

  it('lists roots for the exact Category and preserves repository ordering', async () => {
    const first = topicFixture();
    const second = topicFixture({
      id: '33333333-3333-4333-8333-333333333333',
      canonicalName: 'Biology',
      normalizedCanonicalName: 'biology',
      displayOrder: 2,
    });
    const repositoryResult = [first, second];
    listRootsByCategory.mockResolvedValue(repositoryResult);

    const result = await service.listRootsByCategory({ categoryId: first.categoryId });

    expect(listRootsByCategory).toHaveBeenCalledTimes(1);
    expect(listRootsByCategory).toHaveBeenCalledWith(first.categoryId);
    expect(result.map((topic) => topic.id)).toEqual([first.id, second.id]);
    expectImmutableCollection(result, repositoryResult);
    expectUnapprovedMethodsNotCalled();
  });

  it('returns an immutable empty root collection', async () => {
    listRootsByCategory.mockResolvedValue([]);

    const result = await service.listRootsByCategory({ categoryId: 'category-id' });

    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('rejects an empty root Category ID without calling persistence', async () => {
    await expect(service.listRootsByCategory({ categoryId: '' })).rejects.toBeInstanceOf(
      InvalidTopicQueryError,
    );
    expect(listRootsByCategory).not.toHaveBeenCalled();
  });

  it('lists direct children for the exact parent and preserves both lifecycle states', async () => {
    const parentId = '44444444-4444-4444-8444-444444444444';
    const active = topicFixture({ parentTopicId: parentId });
    const archived = topicFixture({
      id: '55555555-5555-4555-8555-555555555555',
      parentTopicId: parentId,
      lifecycleState: 'archived',
      archivedAt: new Date('2026-07-21T10:00:00.000Z'),
      displayOrder: 2,
    });
    const repositoryResult = [active, archived];
    listChildren.mockResolvedValue(repositoryResult);

    const result = await service.listChildren({ parentTopicId: parentId });

    expect(listChildren).toHaveBeenCalledTimes(1);
    expect(listChildren).toHaveBeenCalledWith(parentId);
    expect(result.map((topic) => topic.lifecycleState)).toEqual(['active', 'archived']);
    expectImmutableCollection(result, repositoryResult);
    expectUnapprovedMethodsNotCalled();
  });

  it('rejects an empty parent Topic ID without calling persistence', async () => {
    await expect(service.listChildren({ parentTopicId: '' })).rejects.toMatchObject({
      code: 'INVALID_TOPIC_QUERY',
      field: 'parentTopicId',
    });
    expect(listChildren).not.toHaveBeenCalled();
  });

  it('loads the exact flat hierarchy without traversal or structural rewriting', async () => {
    const root = topicFixture();
    const child = topicFixture({
      id: '66666666-6666-4666-8666-666666666666',
      parentTopicId: root.id,
      displayOrder: 2,
    });
    const secondRoot = topicFixture({
      id: '77777777-7777-4777-8777-777777777777',
      displayOrder: 3,
    });
    const repositoryResult = [root, child, secondRoot];
    loadHierarchy.mockResolvedValue(repositoryResult);

    const result = await service.loadHierarchy({ categoryId: root.categoryId });

    expect(loadHierarchy).toHaveBeenCalledTimes(1);
    expect(loadHierarchy).toHaveBeenCalledWith(root.categoryId);
    expect(result.map(({ id, parentTopicId }) => ({ id, parentTopicId }))).toEqual([
      { id: root.id, parentTopicId: null },
      { id: child.id, parentTopicId: root.id },
      { id: secondRoot.id, parentTopicId: null },
    ]);
    expectImmutableCollection(result, repositoryResult);
    expectUnapprovedMethodsNotCalled();
  });

  it('returns an immutable empty hierarchy', async () => {
    loadHierarchy.mockResolvedValue([]);

    const result = await service.loadHierarchy({ categoryId: 'category-id' });

    expect(result).toEqual([]);
    expect(Object.isFrozen(result)).toBe(true);
  });

  it('rejects an empty hierarchy Category ID without calling persistence', async () => {
    await expect(service.loadHierarchy({ categoryId: '' })).rejects.toMatchObject({
      code: 'INVALID_TOPIC_QUERY',
      field: 'categoryId',
    });
    expect(loadHierarchy).not.toHaveBeenCalled();
  });

  it('forwards non-empty identifiers byte-for-byte without trimming', async () => {
    listRootsByCategory.mockResolvedValue([]);
    listChildren.mockResolvedValue([]);

    await service.listRootsByCategory({ categoryId: ' category-id ' });
    await service.listChildren({ parentTopicId: ' parent-id ' });

    expect(listRootsByCategory).toHaveBeenCalledWith(' category-id ');
    expect(listChildren).toHaveBeenCalledWith(' parent-id ');
  });

  it('propagates safe persistence errors unchanged', async () => {
    const error = new PersistenceError();
    loadHierarchy.mockRejectedValue(error);

    await expect(service.loadHierarchy({ categoryId: 'category-id' })).rejects.toBe(error);
  });

  function expectUnapprovedMethodsNotCalled(): void {
    expect(findActiveByScopedName).not.toHaveBeenCalled();
    expect(persistVersionedChange).not.toHaveBeenCalled();
  }
});

function expectImmutableCollection(
  result: readonly unknown[],
  repositoryResult: readonly TopicRecord[],
): void {
  expect(result).not.toBe(repositoryResult);
  expect(Object.isFrozen(result)).toBe(true);
  expect(result.every((topic) => Object.isFrozen(topic))).toBe(true);
}
