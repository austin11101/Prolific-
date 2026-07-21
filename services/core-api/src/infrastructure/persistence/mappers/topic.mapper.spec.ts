import {
  type Topic as PrismaTopic,
  TaxonomyLifecycleState as PrismaLifecycleState,
} from '../generated/prisma/client.js';
import { TopicMapper } from './topic.mapper.js';

function prismaTopic(overrides: Partial<PrismaTopic> = {}): PrismaTopic {
  return {
    id: 'a0000000-0000-4000-8000-000000000001',
    categoryId: 'b0000000-0000-4000-8000-000000000001',
    parentTopicId: null,
    canonicalName: 'Physics',
    normalizedCanonicalName: 'physics',
    lifecycleState: PrismaLifecycleState.ACTIVE,
    displayOrder: 2,
    lockVersion: 3,
    archivedAt: null,
    createdAt: new Date('2026-07-20T08:00:00.000Z'),
    updatedAt: new Date('2026-07-20T09:00:00.000Z'),
    ...overrides,
  };
}

describe('TopicMapper', () => {
  const mapper = new TopicMapper();

  it('maps every root Topic field into a frozen independent record', () => {
    const source = prismaTopic();
    const result = mapper.toDomain(source);

    expect(result).toEqual({
      ...source,
      lifecycleState: 'active',
    });
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.createdAt).not.toBe(source.createdAt);
    expect(result.updatedAt).not.toBe(source.updatedAt);
  });

  it('preserves child identity, archive state, and defensively copies every date', () => {
    const archivedAt = new Date('2026-07-20T10:00:00.000Z');
    const source = prismaTopic({
      parentTopicId: 'a0000000-0000-4000-8000-000000000002',
      lifecycleState: PrismaLifecycleState.ARCHIVED,
      archivedAt,
    });
    const result = mapper.toDomain(source);

    expect(result).toMatchObject({
      id: source.id,
      categoryId: source.categoryId,
      parentTopicId: source.parentTopicId,
      lifecycleState: 'archived',
      archivedAt,
      lockVersion: 3,
    });
    expect(result.archivedAt).not.toBe(archivedAt);
    source.createdAt.setUTCFullYear(2030);
    source.updatedAt.setUTCFullYear(2030);
    archivedAt.setUTCFullYear(2030);
    expect(result.createdAt.getUTCFullYear()).toBe(2026);
    expect(result.updatedAt.getUTCFullYear()).toBe(2026);
    expect(result.archivedAt?.getUTCFullYear()).toBe(2026);
  });

  it.each([
    ['active', PrismaLifecycleState.ACTIVE],
    ['archived', PrismaLifecycleState.ARCHIVED],
  ] as const)('maps domain lifecycle %s explicitly', (domain, persistence) => {
    expect(mapper.toPersistenceLifecycle(domain)).toBe(persistence);
  });

  it('rejects unsupported persistence and domain lifecycle values', () => {
    expect(() =>
      mapper.toDomain(prismaTopic({ lifecycleState: 'REMOVED' as PrismaLifecycleState })),
    ).toThrow('Unsupported Topic persistence lifecycle state.');
    expect(() =>
      mapper.toPersistenceLifecycle(
        'removed' as Parameters<TopicMapper['toPersistenceLifecycle']>[0],
      ),
    ).toThrow('Unsupported Topic domain lifecycle state.');
  });
});
