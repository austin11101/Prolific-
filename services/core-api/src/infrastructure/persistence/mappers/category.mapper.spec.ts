import {
  type Category as PrismaCategory,
  TaxonomyLifecycleState as PrismaLifecycleState,
} from '../generated/prisma/client.js';
import { CategoryMapper } from './category.mapper.js';

function categoryFixture(overrides: Partial<PrismaCategory> = {}): PrismaCategory {
  return {
    id: 'c0000000-0000-4000-8000-000000000001',
    canonicalName: 'Science',
    normalizedCanonicalName: 'science',
    lifecycleState: PrismaLifecycleState.ACTIVE,
    displayOrder: 2,
    iconKey: 'science',
    lockVersion: 3,
    hierarchyVersion: 7,
    archivedAt: null,
    createdAt: new Date('2026-07-20T10:00:00.123Z'),
    updatedAt: new Date('2026-07-20T11:00:00.456Z'),
    ...overrides,
  };
}

describe('CategoryMapper', () => {
  const mapper = new CategoryMapper();

  it('maps every approved active Category field and independent version', () => {
    expect(mapper.toDomain(categoryFixture())).toEqual({
      ...categoryFixture(),
      lifecycleState: 'active',
    });
  });

  it('maps the archived lifecycle and archival timestamp', () => {
    const archivedAt = new Date('2026-07-21T08:30:00.000Z');

    expect(
      mapper.toDomain(
        categoryFixture({ lifecycleState: PrismaLifecycleState.ARCHIVED, archivedAt }),
      ),
    ).toMatchObject({ lifecycleState: 'archived', archivedAt });
  });

  it('preserves UUID, names, order, icon, and separate lock and hierarchy versions', () => {
    expect(mapper.toDomain(categoryFixture())).toMatchObject({
      id: 'c0000000-0000-4000-8000-000000000001',
      canonicalName: 'Science',
      normalizedCanonicalName: 'science',
      displayOrder: 2,
      iconKey: 'science',
      lockVersion: 3,
      hierarchyVersion: 7,
    });
  });

  it('returns a frozen independent object with defensive Date copies', () => {
    const record = categoryFixture({ archivedAt: new Date('2026-07-21T08:30:00.000Z') });
    const mapped = mapper.toDomain(record);

    expect(mapped).not.toBe(record);
    expect(Object.isFrozen(mapped)).toBe(true);
    expect(mapped.archivedAt).not.toBe(record.archivedAt);
    expect(mapped.createdAt).not.toBe(record.createdAt);
    expect(mapped.updatedAt).not.toBe(record.updatedAt);
    expect(mapped.archivedAt?.getTime()).toBe(record.archivedAt?.getTime());
    expect(mapped.createdAt.getTime()).toBe(record.createdAt.getTime());
    expect(mapped.updatedAt.getTime()).toBe(record.updatedAt.getTime());
  });

  it('maps domain lifecycle values to explicit Prisma enum values', () => {
    expect(mapper.toPersistenceLifecycle('active')).toBe(PrismaLifecycleState.ACTIVE);
    expect(mapper.toPersistenceLifecycle('archived')).toBe(PrismaLifecycleState.ARCHIVED);
  });

  it('rejects unsupported persistence and domain lifecycle values', () => {
    expect(() =>
      mapper.toDomain(categoryFixture({ lifecycleState: 'REMOVED' as PrismaLifecycleState })),
    ).toThrow('Unsupported Category persistence lifecycle state.');
    expect(() =>
      mapper.toPersistenceLifecycle(
        'removed' as Parameters<CategoryMapper['toPersistenceLifecycle']>[0],
      ),
    ).toThrow('Unsupported Category domain lifecycle state.');
  });
});
