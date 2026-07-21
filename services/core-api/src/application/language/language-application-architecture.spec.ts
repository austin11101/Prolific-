import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const LANGUAGE_APPLICATION_ROOT = dirname(fileURLToPath(import.meta.url));

describe('Language application architecture', () => {
  it('remains transport, framework, transaction, and infrastructure neutral', () => {
    const sources = readdirSync(LANGUAGE_APPLICATION_ROOT)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
      .map((file) => readFileSync(join(LANGUAGE_APPLICATION_ROOT, file), 'utf8'));

    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/@prisma|generated\/prisma/u);
      expect(source).not.toMatch(/\/infrastructure\//u);
      expect(source).not.toMatch(/@nestjs|HttpException|Controller|Resolver/u);
      expect(source).not.toMatch(/class-validator|swagger|openapi/u);
      expect(source).not.toMatch(/TransactionManager|TransactionContext/u);
      expect(source).not.toMatch(/CategoryRepository|TopicRepository|ActorPrincipalRepository/u);
      expect(source).not.toMatch(/TaxonomyChangeRecordRepository/u);
    }
  });
});
