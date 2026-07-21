import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const TOPIC_MUTATION_ROOT = dirname(fileURLToPath(import.meta.url));

describe('Topic mutation application architecture', () => {
  it('uses only the Topic repository and transaction abstraction', () => {
    const sources = readdirSync(TOPIC_MUTATION_ROOT)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
      .map((file) => readFileSync(join(TOPIC_MUTATION_ROOT, file), 'utf8'));

    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/@prisma|generated\/prisma|\/infrastructure\//u);
      expect(source).not.toMatch(/@nestjs|HttpException|Controller|Resolver/u);
      expect(source).not.toMatch(/class-validator|swagger|openapi|graphql/u);
      expect(source).not.toMatch(/CategoryRepository|ActorPrincipalRepository|LanguageRepository/u);
      expect(source).not.toMatch(/TaxonomyChangeRecordRepository|HierarchyRepository/u);
    }
  });

  it('exposes no hierarchy command, generic CRUD, patch, or transport DTO', () => {
    const sources = readdirSync(TOPIC_MUTATION_ROOT)
      .filter((file) => file.endsWith('.ts') && !file.endsWith('.spec.ts'))
      .map((file) => readFileSync(join(TOPIC_MUTATION_ROOT, file), 'utf8'))
      .join('\n');

    expect(sources).not.toMatch(/moveHierarchy|reparent|\bcycle\b/u);
    const types = readFileSync(join(TOPIC_MUTATION_ROOT, 'topic-mutation.types.ts'), 'utf8');
    const command = types.match(
      /export interface PersistTopicOrdinaryChangeCommand \{([\s\S]*?)\n\}/u,
    )?.[1];
    expect(command).toBeDefined();
    expect(command).not.toMatch(/categoryId|parentTopicId|displayOrder|hierarchyVersion/u);
    expect(types).not.toMatch(/PatchTopic|Record<string, unknown>|Dto/u);
    expect(sources).not.toMatch(/createTopic|deleteTopic/u);
  });
});
