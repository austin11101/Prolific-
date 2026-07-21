import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const CATEGORY_MUTATION_ROOT = dirname(fileURLToPath(import.meta.url));

describe('Category mutation application architecture', () => {
  it('uses only the Category repository and transaction abstraction', () => {
    const sources = readdirSync(CATEGORY_MUTATION_ROOT)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
      .map((file) => readFileSync(join(CATEGORY_MUTATION_ROOT, file), 'utf8'));

    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/@prisma|generated\/prisma/u);
      expect(source).not.toMatch(/\/infrastructure\//u);
      expect(source).not.toMatch(/@nestjs|HttpException|Controller|Resolver/u);
      expect(source).not.toMatch(/class-validator|swagger|openapi|graphql/u);
      expect(source).not.toMatch(/LanguageRepository|TopicRepository|ActorPrincipalRepository/u);
      expect(source).not.toMatch(/TaxonomyChangeRecordRepository/u);
      expect(source).not.toMatch(/Authentication|Authorization|Jwt|OAuth|Session/u);
    }
  });

  it('does not expose hierarchy movement, a generic patch, or transport DTOs', () => {
    const sources = readdirSync(CATEGORY_MUTATION_ROOT)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
      .map((file) => readFileSync(join(CATEGORY_MUTATION_ROOT, file), 'utf8'))
      .join('\n');

    expect(sources).not.toMatch(/parentTopic|moveHierarchy|reparent|incrementHierarchy/u);
    expect(sources).not.toMatch(/PatchCategory|Record<string, unknown>|Dto/u);
  });
});
