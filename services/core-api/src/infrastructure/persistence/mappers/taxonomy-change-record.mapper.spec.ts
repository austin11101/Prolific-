import type { TaxonomyChangeRecord as PrismaTaxonomyChangeRecord } from '../generated/prisma/client.js';
import { TaxonomyChangeRecordMapper } from './taxonomy-change-record.mapper.js';

function prismaRecord(
  overrides: Partial<PrismaTaxonomyChangeRecord> = {},
): PrismaTaxonomyChangeRecord {
  return {
    id: 'f1000000-0000-4000-8000-000000000001',
    commandId: 'f2000000-0000-4000-8000-000000000001',
    actorPrincipalId: 'f3000000-0000-4000-8000-000000000001',
    categoryId: 'f4000000-0000-4000-8000-000000000001',
    topicId: null,
    operation: 'category_archive',
    reasonCode: 'governance_archive',
    previousLifecycleState: 'active',
    resultingLifecycleState: 'archived',
    previousParentTopicId: null,
    resultingParentTopicId: null,
    previousVersion: 2,
    resultingVersion: 3,
    supersedesChangeRecordId: null,
    occurredAt: new Date('2026-07-20T10:00:00.000Z'),
    createdAt: new Date('2026-07-20T10:00:01.000Z'),
    ...overrides,
  };
}

describe('TaxonomyChangeRecordMapper', () => {
  const mapper = new TaxonomyChangeRecordMapper();

  it('maps every immutable field into a frozen independent record', () => {
    const source = prismaRecord();
    const result = mapper.toDomain(source);
    expect(result).toEqual(source);
    expect(Object.isFrozen(result)).toBe(true);
    expect(result.occurredAt).not.toBe(source.occurredAt);
    expect(result.createdAt).not.toBe(source.createdAt);
    source.occurredAt.setUTCFullYear(2030);
    source.createdAt.setUTCFullYear(2030);
    expect(result.occurredAt.getUTCFullYear()).toBe(2026);
    expect(result.createdAt.getUTCFullYear()).toBe(2026);
  });

  it('preserves Topic, parent, and correction references', () => {
    const source = prismaRecord({
      categoryId: null,
      topicId: 'f5000000-0000-4000-8000-000000000001',
      operation: 'topic_reparent',
      previousLifecycleState: null,
      resultingLifecycleState: null,
      previousParentTopicId: 'f5000000-0000-4000-8000-000000000002',
      resultingParentTopicId: 'f5000000-0000-4000-8000-000000000003',
      supersedesChangeRecordId: 'f1000000-0000-4000-8000-000000000000',
    });
    expect(mapper.toDomain(source)).toMatchObject(source);
  });

  it.each([
    'category_create',
    'category_update',
    'category_archive',
    'category_restore',
    'topic_create',
    'topic_update',
    'topic_reparent',
    'topic_archive',
    'topic_restore',
  ])('accepts approved operation %s explicitly', (operation) => {
    expect(mapper.toPersistenceOperation(operation)).toBe(operation);
  });

  it.each(['active', 'archived', null] as const)(
    'accepts approved lifecycle value %s explicitly',
    (state) => {
      expect(mapper.toPersistenceLifecycle(state)).toBe(state);
    },
  );

  it('rejects unsupported operation and lifecycle persistence values', () => {
    expect(() => mapper.toDomain(prismaRecord({ operation: 'topic_delete' }))).toThrow(
      'Unsupported Taxonomy Change Record operation.',
    );
    expect(() => mapper.toDomain(prismaRecord({ previousLifecycleState: 'removed' }))).toThrow(
      'Unsupported Taxonomy Change Record lifecycle state.',
    );
  });
});
