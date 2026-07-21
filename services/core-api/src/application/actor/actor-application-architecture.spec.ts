import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ACTOR_APPLICATION_ROOT = dirname(fileURLToPath(import.meta.url));

describe('Actor application architecture', () => {
  it('remains transport, framework, identity-system, and infrastructure neutral', () => {
    const sources = readdirSync(ACTOR_APPLICATION_ROOT)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
      .map((file) => readFileSync(join(ACTOR_APPLICATION_ROOT, file), 'utf8'));

    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/@prisma|generated\/prisma/u);
      expect(source).not.toMatch(/\/infrastructure\//u);
      expect(source).not.toMatch(/@nestjs|HttpException|Controller|Resolver/u);
      expect(source).not.toMatch(/class-validator|swagger|openapi|graphql/u);
      expect(source).not.toMatch(/passport|jsonwebtoken|@nestjs\/jwt|oauth|oidc|saml/u);
      expect(source).not.toMatch(/LanguageRepository|CategoryRepository|TopicRepository/u);
      expect(source).not.toMatch(/TaxonomyChangeRecordRepository/u);
    }
  });
});
