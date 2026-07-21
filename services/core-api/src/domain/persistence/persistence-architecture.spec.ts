import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const PERSISTENCE_DOMAIN_ROOT = dirname(fileURLToPath(import.meta.url));

function listTypeScriptFiles(directory: string): readonly string[] {
  return readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory()
      ? listTypeScriptFiles(path)
      : path.endsWith('.ts') && !path.endsWith('.spec.ts')
        ? [path]
        : [];
  });
}

describe('domain persistence architecture', () => {
  it('keeps repository and transaction contracts independent of Prisma', () => {
    const sources = listTypeScriptFiles(PERSISTENCE_DOMAIN_ROOT).map((path) =>
      readFileSync(path, 'utf8'),
    );

    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) {
      expect(source).not.toMatch(/@prisma\//u);
      expect(source).not.toMatch(/generated\/prisma/u);
      expect(source).not.toMatch(/Prisma(?:Client|\.)/u);
    }
  });
});
