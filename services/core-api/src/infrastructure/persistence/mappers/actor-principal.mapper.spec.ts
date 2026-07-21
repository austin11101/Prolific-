import type { ActorPrincipal as PrismaActorPrincipal } from '../generated/prisma/client.js';
import { ActorPrincipalMapper } from './actor-principal.mapper.js';

function actorPrincipalFixture(
  overrides: Partial<PrismaActorPrincipal> = {},
): PrismaActorPrincipal {
  return {
    id: 'a0000000-0000-4000-8000-000000000001',
    actorKind: 'administrative',
    createdAt: new Date('2026-07-20T12:00:00.123Z'),
    ...overrides,
  };
}

describe('ActorPrincipalMapper', () => {
  const mapper = new ActorPrincipalMapper();

  it.each(['administrative', 'service', 'system'] as const)(
    'maps every approved field for the %s kind',
    (actorKind) => {
      const persistenceRecord = actorPrincipalFixture({ actorKind });

      expect(mapper.toDomain(persistenceRecord)).toEqual(persistenceRecord);
    },
  );

  it('preserves the UUID and returns a frozen independent object with a defensive Date copy', () => {
    const persistenceRecord = actorPrincipalFixture();
    const mapped = mapper.toDomain(persistenceRecord);

    expect(mapped.id).toBe(persistenceRecord.id);
    expect(mapped).not.toBe(persistenceRecord);
    expect(Object.isFrozen(mapped)).toBe(true);
    expect(mapped.createdAt).not.toBe(persistenceRecord.createdAt);
    expect(mapped.createdAt.getTime()).toBe(persistenceRecord.createdAt.getTime());
  });

  it('rejects an unsupported persistence actor kind', () => {
    expect(() => mapper.toDomain(actorPrincipalFixture({ actorKind: 'learner' }))).toThrow(
      'Unsupported Actor Principal kind in persistence record.',
    );
  });
});
