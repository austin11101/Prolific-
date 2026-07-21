import type { Language as PrismaLanguage } from '../generated/prisma/client.js';
import { LanguageMapper } from './language.mapper.js';

function languageFixture(overrides: Partial<PrismaLanguage> = {}): PrismaLanguage {
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
    createdAt: new Date('2026-07-20T10:00:00.123Z'),
    updatedAt: new Date('2026-07-20T11:00:00.456Z'),
    ...overrides,
  };
}

describe('LanguageMapper', () => {
  const mapper = new LanguageMapper();

  it('maps every approved Language field', () => {
    const persistenceRecord = languageFixture();

    expect(mapper.toDomain(persistenceRecord)).toEqual(persistenceRecord);
  });

  it('preserves content-enabled and retired lifecycle representations', () => {
    const retiredAt = new Date('2026-07-21T08:30:00.000Z');

    expect(mapper.toDomain(languageFixture({ isContentEnabled: false, retiredAt }))).toMatchObject({
      isContentEnabled: false,
      retiredAt,
    });
  });

  it('returns a frozen independent object with defensive Date copies', () => {
    const persistenceRecord = languageFixture({
      retiredAt: new Date('2026-07-21T08:30:00.000Z'),
    });
    const mapped = mapper.toDomain(persistenceRecord);

    expect(mapped).not.toBe(persistenceRecord);
    expect(Object.isFrozen(mapped)).toBe(true);
    expect(mapped.createdAt).not.toBe(persistenceRecord.createdAt);
    expect(mapped.updatedAt).not.toBe(persistenceRecord.updatedAt);
    expect(mapped.retiredAt).not.toBe(persistenceRecord.retiredAt);
    expect(mapped.createdAt.getTime()).toBe(persistenceRecord.createdAt.getTime());
    expect(mapped.updatedAt.getTime()).toBe(persistenceRecord.updatedAt.getTime());
    expect(mapped.retiredAt?.getTime()).toBe(persistenceRecord.retiredAt?.getTime());
  });
});
