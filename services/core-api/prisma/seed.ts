/**
 * Prolific platform seed script.
 *
 * Inserts the minimum reference data needed for integration tests and
 * local development.  All operations are idempotent — re-running the
 * script is safe.
 *
 * Fixed UUIDs are intentional: they allow tests to assert on known IDs
 * without querying the database first.
 */
import 'dotenv/config';

import { randomUUID } from 'node:crypto';

import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { PrismaClient } from '../src/infrastructure/persistence/generated/prisma/client.js';

const SEED_ACTOR_ID = '00000000-0000-4000-8000-000000000001';

// Languages
const LANG_EN_ZA_ID = '10000000-0000-4000-8000-000000000001';
const LANG_ZU_ZA_ID = '10000000-0000-4000-8000-000000000002';
const LANG_NSO_ZA_ID = '10000000-0000-4000-8000-000000000003';

// Categories
const CAT_SCIENCE_ID = '20000000-0000-4000-8000-000000000001';
const CAT_HISTORY_ID = '20000000-0000-4000-8000-000000000002';

// Topics
const TOPIC_NATURE_ID = '30000000-0000-4000-8000-000000000001';
const TOPIC_SA_HISTORY_ID = '30000000-0000-4000-8000-000000000002';

// Content source
const SOURCE_ORIGINAL_ID = '40000000-0000-4000-8000-000000000001';

// Lessons
const LESSON_ANIMALS_ID = '50000000-0000-4000-8000-000000000001';
const LESSON_MANDELA_ID = '50000000-0000-4000-8000-000000000002';

// Lesson variants
const VARIANT_ANIMALS_EN_BEG_ID = '60000000-0000-4000-8000-000000000001';
const VARIANT_MANDELA_EN_BEG_ID = '60000000-0000-4000-8000-000000000002';

// Lesson revisions
const REVISION_ANIMALS_1_ID = '70000000-0000-4000-8000-000000000001';
const REVISION_MANDELA_1_ID = '70000000-0000-4000-8000-000000000002';

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const adapter = new PrismaPg(pool, { disposeExternalPool: false });
  const prisma = new PrismaClient({ adapter });

  try {
    await prisma.$connect();
    await seed(prisma);
    console.log('Seed completed successfully.');
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

async function seed(prisma: PrismaClient) {
  // ── Actor principal ────────────────────────────────────────────────
  await prisma.actorPrincipal.upsert({
    where: { id: SEED_ACTOR_ID },
    create: { id: SEED_ACTOR_ID, actorKind: 'system' },
    update: {},
  });

  // ── Languages ──────────────────────────────────────────────────────
  const languages = [
    {
      id: LANG_EN_ZA_ID,
      bcp47Tag: 'en-ZA',
      normalizedTag: 'en-za',
      isoLanguageBasis: 'en',
      canonicalName: 'English (South Africa)',
      normalizedName: 'english (south africa)',
      displayOrder: 1,
    },
    {
      id: LANG_ZU_ZA_ID,
      bcp47Tag: 'zu-ZA',
      normalizedTag: 'zu-za',
      isoLanguageBasis: 'zu',
      canonicalName: 'isiZulu',
      normalizedName: 'isizulu',
      displayOrder: 2,
    },
    {
      id: LANG_NSO_ZA_ID,
      bcp47Tag: 'nso-ZA',
      normalizedTag: 'nso-za',
      isoLanguageBasis: 'nso',
      canonicalName: 'Sepedi',
      normalizedName: 'sepedi',
      displayOrder: 3,
    },
  ] as const;

  for (const lang of languages) {
    await prisma.language.upsert({
      where: { id: lang.id },
      create: { ...lang, isContentEnabled: true },
      update: {},
    });
  }

  // ── Categories ─────────────────────────────────────────────────────
  await prisma.category.upsert({
    where: { id: CAT_SCIENCE_ID },
    create: {
      id: CAT_SCIENCE_ID,
      canonicalName: 'Science & Nature',
      normalizedCanonicalName: 'science & nature',
      lifecycleState: 'ACTIVE',
      displayOrder: 1,
      iconKey: 'science',
      lockVersion: 1,
      hierarchyVersion: 1,
    },
    update: {},
  });

  await prisma.category.upsert({
    where: { id: CAT_HISTORY_ID },
    create: {
      id: CAT_HISTORY_ID,
      canonicalName: 'History & Culture',
      normalizedCanonicalName: 'history & culture',
      lifecycleState: 'ACTIVE',
      displayOrder: 2,
      iconKey: 'history',
      lockVersion: 1,
      hierarchyVersion: 1,
    },
    update: {},
  });

  // ── Topics ─────────────────────────────────────────────────────────
  await prisma.topic.upsert({
    where: { id: TOPIC_NATURE_ID },
    create: {
      id: TOPIC_NATURE_ID,
      categoryId: CAT_SCIENCE_ID,
      canonicalName: 'Animals',
      normalizedCanonicalName: 'animals',
      lifecycleState: 'ACTIVE',
      displayOrder: 1,
      lockVersion: 1,
    },
    update: {},
  });

  await prisma.topic.upsert({
    where: { id: TOPIC_SA_HISTORY_ID },
    create: {
      id: TOPIC_SA_HISTORY_ID,
      categoryId: CAT_HISTORY_ID,
      canonicalName: 'South African History',
      normalizedCanonicalName: 'south african history',
      lifecycleState: 'ACTIVE',
      displayOrder: 1,
      lockVersion: 1,
    },
    update: {},
  });

  // ── Content source ─────────────────────────────────────────────────
  await prisma.contentSource.upsert({
    where: { id: SOURCE_ORIGINAL_ID },
    create: {
      id: SOURCE_ORIGINAL_ID,
      sourceKind: 'original',
      originTitle: null,
      originAuthor: null,
      originUri: null,
      licenseCode: 'CC-BY-SA-4.0',
      attributionNote: 'Original Prolific platform content',
    },
    update: {},
  });

  // ── Lessons ────────────────────────────────────────────────────────
  await prisma.lesson.upsert({
    where: { id: LESSON_ANIMALS_ID },
    create: {
      id: LESSON_ANIMALS_ID,
      topicId: TOPIC_NATURE_ID,
      contentSourceId: SOURCE_ORIGINAL_ID,
      canonicalTitle: 'Animals of South Africa',
      lifecycleState: 'ACTIVE',
    },
    update: {},
  });

  await prisma.lesson.upsert({
    where: { id: LESSON_MANDELA_ID },
    create: {
      id: LESSON_MANDELA_ID,
      topicId: TOPIC_SA_HISTORY_ID,
      contentSourceId: SOURCE_ORIGINAL_ID,
      canonicalTitle: 'Nelson Mandela',
      lifecycleState: 'ACTIVE',
    },
    update: {},
  });

  // ── Lesson variants ────────────────────────────────────────────────
  await prisma.lessonVariant.upsert({
    where: { id: VARIANT_ANIMALS_EN_BEG_ID },
    create: {
      id: VARIANT_ANIMALS_EN_BEG_ID,
      lessonId: LESSON_ANIMALS_ID,
      languageId: LANG_EN_ZA_ID,
      difficulty: 'BEGINNER',
      lifecycleState: 'ACTIVE',
    },
    update: {},
  });

  await prisma.lessonVariant.upsert({
    where: { id: VARIANT_MANDELA_EN_BEG_ID },
    create: {
      id: VARIANT_MANDELA_EN_BEG_ID,
      lessonId: LESSON_MANDELA_ID,
      languageId: LANG_EN_ZA_ID,
      difficulty: 'BEGINNER',
      lifecycleState: 'ACTIVE',
    },
    update: {},
  });

  // ── Lesson revisions ───────────────────────────────────────────────
  await seedRevision(prisma, {
    id: REVISION_ANIMALS_1_ID,
    variantId: VARIANT_ANIMALS_EN_BEG_ID,
    revisionNumber: 1,
    title: 'Animals of South Africa',
    blocks: [
      {
        id: randomUUID(),
        blockType: 'HEADING' as const,
        text: 'Animals of South Africa',
        isReadable: false,
        displayOrder: 0,
      },
      {
        id: randomUUID(),
        blockType: 'PARAGRAPH' as const,
        text: 'South Africa is home to an incredible variety of animals. The Big Five — lion, leopard, rhinoceros, elephant, and Cape buffalo — are found in many of the country\'s national parks.',
        isReadable: true,
        displayOrder: 1,
      },
      {
        id: randomUUID(),
        blockType: 'FACT' as const,
        text: 'The Kruger National Park is one of Africa\'s largest game reserves and protects many endangered species.',
        isReadable: true,
        displayOrder: 2,
      },
    ],
  });

  await seedRevision(prisma, {
    id: REVISION_MANDELA_1_ID,
    variantId: VARIANT_MANDELA_EN_BEG_ID,
    revisionNumber: 1,
    title: 'Nelson Mandela',
    blocks: [
      {
        id: randomUUID(),
        blockType: 'HEADING' as const,
        text: 'Nelson Mandela',
        isReadable: false,
        displayOrder: 0,
      },
      {
        id: randomUUID(),
        blockType: 'PARAGRAPH' as const,
        text: 'Nelson Mandela was a South African anti-apartheid activist and politician who served as the first president of South Africa from 1994 to 1999.',
        isReadable: true,
        displayOrder: 1,
      },
      {
        id: randomUUID(),
        blockType: 'QUOTE' as const,
        text: 'Education is the most powerful weapon which you can use to change the world.',
        isReadable: true,
        displayOrder: 2,
      },
    ],
  });
}

interface BlockInput {
  id: string;
  blockType: 'HEADING' | 'PARAGRAPH' | 'FACT' | 'QUOTE' | 'CALLOUT';
  text: string;
  isReadable: boolean;
  displayOrder: number;
}

interface RevisionInput {
  id: string;
  variantId: string;
  revisionNumber: number;
  title: string;
  blocks: BlockInput[];
}

async function seedRevision(prisma: PrismaClient, input: RevisionInput) {
  const existing = await prisma.lessonRevision.findUnique({ where: { id: input.id } });
  if (existing !== null) {
    return;
  }

  const readableBlocks = input.blocks.filter((b) => b.isReadable);
  const allWords = readableBlocks.flatMap((b) => b.text.split(/\s+/).filter(Boolean));
  const wordCount = allWords.length;
  const estimatedReadingTimeSeconds = Math.max(30, Math.round((wordCount / 100) * 60));

  await prisma.lessonRevision.create({
    data: {
      id: input.id,
      variantId: input.variantId,
      revisionNumber: input.revisionNumber,
      title: input.title,
      wordCount,
      estimatedReadingTimeSeconds,
      isPublished: true,
      schemaVersion: '1.0',
      contentBlocks: {
        create: input.blocks.map((b) => ({
          id: b.id,
          blockType: b.blockType,
          canonicalDisplayText: b.text,
          isReadable: b.isReadable,
          displayOrder: b.displayOrder,
        })),
      },
    },
  });

  // Create reading positions for each word in readable blocks
  let positionIndex = 0;
  for (const block of readableBlocks.sort((a, b) => a.displayOrder - b.displayOrder)) {
    const words = block.text.split(/\s+/).filter(Boolean);
    let spanStart = 0;
    for (const word of words) {
      const spanEnd = spanStart + word.length;
      await prisma.readingPosition.create({
        data: {
          id: randomUUID(),
          revisionId: input.id,
          blockId: block.id,
          unitId: randomUUID(),
          positionIndex,
          spanStart,
          spanEnd,
          surfaceText: word,
          normalizedText: word.toLowerCase(),
        },
      });
      positionIndex++;
      spanStart = spanEnd + 1; // +1 for space
    }
  }
}

await main();
