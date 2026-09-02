-- CreateEnum
CREATE TYPE "lesson_difficulty" AS ENUM ('beginner', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "working_draft_state" AS ENUM ('draft', 'in_review', 'changes_requested', 'approved', 'published');

-- CreateEnum
CREATE TYPE "content_block_type" AS ENUM ('heading', 'paragraph', 'callout', 'fact', 'quote');

-- CreateTable
CREATE TABLE "content_sources" (
    "id" UUID NOT NULL,
    "source_kind" TEXT NOT NULL,
    "origin_title" TEXT,
    "origin_author" TEXT,
    "origin_uri" TEXT,
    "license_code" TEXT,
    "attribution_note" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__content_sources" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "id" UUID NOT NULL,
    "topic_id" UUID NOT NULL,
    "content_source_id" UUID,
    "canonical_title" TEXT NOT NULL,
    "lifecycle_state" "taxonomy_lifecycle_state" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__lessons" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_variants" (
    "id" UUID NOT NULL,
    "lesson_id" UUID NOT NULL,
    "language_id" UUID NOT NULL,
    "difficulty" "lesson_difficulty" NOT NULL,
    "lifecycle_state" "taxonomy_lifecycle_state" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__lesson_variants" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "working_drafts" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "state" "working_draft_state" NOT NULL DEFAULT 'draft',
    "title" TEXT NOT NULL,
    "body_text" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "estimated_reading_time_seconds" INTEGER NOT NULL,
    "concurrency_token" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__working_drafts" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lesson_revisions" (
    "id" UUID NOT NULL,
    "variant_id" UUID NOT NULL,
    "revision_number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "word_count" INTEGER NOT NULL,
    "estimated_reading_time_seconds" INTEGER NOT NULL,
    "is_published" BOOLEAN NOT NULL DEFAULT false,
    "schema_version" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__lesson_revisions" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_blocks" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "block_type" "content_block_type" NOT NULL,
    "canonical_display_text" TEXT NOT NULL,
    "is_readable" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__content_blocks" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reading_positions" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "block_id" UUID NOT NULL,
    "unit_id" UUID NOT NULL,
    "position_index" INTEGER NOT NULL,
    "span_start" INTEGER NOT NULL,
    "span_end" INTEGER NOT NULL,
    "surface_text" TEXT NOT NULL,
    "normalized_text" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__reading_positions" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutorial_audio_metadata" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "audio_storage_path" TEXT NOT NULL,
    "duration_seconds" DOUBLE PRECISION NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "mime_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__tutorial_audio_metadata" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "package_manifests" (
    "id" UUID NOT NULL,
    "revision_id" UUID NOT NULL,
    "package_checksum" TEXT NOT NULL,
    "schema_version" TEXT NOT NULL,
    "tokenization_profile" TEXT NOT NULL,
    "tokenization_profile_version" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__package_manifests" PRIMARY KEY ("id")
);

-- AddUniqueConstraint
ALTER TABLE "working_drafts" ADD CONSTRAINT "uq__working_drafts__variant_id" UNIQUE ("variant_id");

-- AddUniqueConstraint
ALTER TABLE "lesson_variants" ADD CONSTRAINT "uq__lesson_variants__lesson_language_difficulty" UNIQUE ("lesson_id", "language_id", "difficulty");

-- AddUniqueConstraint
ALTER TABLE "lesson_revisions" ADD CONSTRAINT "uq__lesson_revisions__variant_revision" UNIQUE ("variant_id", "revision_number");

-- AddUniqueConstraint
ALTER TABLE "reading_positions" ADD CONSTRAINT "uq__reading_positions__revision_position" UNIQUE ("revision_id", "position_index");

-- AddUniqueConstraint
ALTER TABLE "tutorial_audio_metadata" ADD CONSTRAINT "uq__tutorial_audio_metadata__revision_id" UNIQUE ("revision_id");

-- AddUniqueConstraint
ALTER TABLE "package_manifests" ADD CONSTRAINT "uq__package_manifests__revision_id" UNIQUE ("revision_id");

-- CreateIndex
CREATE INDEX "ix__lessons__topic_lifecycle" ON "lessons"("topic_id", "lifecycle_state", "id");

-- CreateIndex
CREATE INDEX "ix__lesson_variants__language_lifecycle" ON "lesson_variants"("language_id", "lifecycle_state", "id");

-- CreateIndex
CREATE INDEX "ix__lesson_revisions__variant_published" ON "lesson_revisions"("variant_id", "is_published", "revision_number" DESC);

-- CreateIndex
CREATE INDEX "ix__content_blocks__revision_order" ON "content_blocks"("revision_id", "display_order", "id");

-- CreateIndex
CREATE INDEX "ix__reading_positions__revision_order" ON "reading_positions"("revision_id", "position_index");

-- AddCheckConstraint
ALTER TABLE "lessons" ADD CONSTRAINT "ck__lessons__canonical_title_non_blank" CHECK (btrim("canonical_title") <> '');

-- AddCheckConstraint
ALTER TABLE "content_sources" ADD CONSTRAINT "ck__content_sources__source_kind_non_blank" CHECK (btrim("source_kind") <> '');

-- AddCheckConstraint
ALTER TABLE "lesson_revisions" ADD CONSTRAINT "ck__lesson_revisions__revision_number_positive" CHECK ("revision_number" > 0);

-- AddCheckConstraint
ALTER TABLE "lesson_revisions" ADD CONSTRAINT "ck__lesson_revisions__word_count_non_negative" CHECK ("word_count" >= 0);

-- AddCheckConstraint
ALTER TABLE "content_blocks" ADD CONSTRAINT "ck__content_blocks__display_order_non_negative" CHECK ("display_order" >= 0);

-- AddCheckConstraint
ALTER TABLE "reading_positions" ADD CONSTRAINT "ck__reading_positions__span_order" CHECK ("span_start" <= "span_end");

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "fk__lessons__topic_id__topics" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "fk__lessons__content_source_id__content_sources" FOREIGN KEY ("content_source_id") REFERENCES "content_sources"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_variants" ADD CONSTRAINT "fk__lesson_variants__lesson_id__lessons" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_variants" ADD CONSTRAINT "fk__lesson_variants__language_id__languages" FOREIGN KEY ("language_id") REFERENCES "languages"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "working_drafts" ADD CONSTRAINT "fk__working_drafts__variant_id__lesson_variants" FOREIGN KEY ("variant_id") REFERENCES "lesson_variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_revisions" ADD CONSTRAINT "fk__lesson_revisions__variant_id__lesson_variants" FOREIGN KEY ("variant_id") REFERENCES "lesson_variants"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "content_blocks" ADD CONSTRAINT "fk__content_blocks__revision_id__lesson_revisions" FOREIGN KEY ("revision_id") REFERENCES "lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reading_positions" ADD CONSTRAINT "fk__reading_positions__revision_id__lesson_revisions" FOREIGN KEY ("revision_id") REFERENCES "lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "reading_positions" ADD CONSTRAINT "fk__reading_positions__block_id__content_blocks" FOREIGN KEY ("block_id") REFERENCES "content_blocks"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tutorial_audio_metadata" ADD CONSTRAINT "fk__tutorial_audio_metadata__revision_id__lesson_revisions" FOREIGN KEY ("revision_id") REFERENCES "lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "package_manifests" ADD CONSTRAINT "fk__package_manifests__revision_id__lesson_revisions" FOREIGN KEY ("revision_id") REFERENCES "lesson_revisions"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
