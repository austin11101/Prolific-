-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "taxonomy_lifecycle_state" AS ENUM ('active', 'archived');

-- CreateTable
CREATE TABLE "actor_principals" (
    "id" UUID NOT NULL,
    "actor_kind" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__actor_principals" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "languages" (
    "id" UUID NOT NULL,
    "bcp47_tag" TEXT NOT NULL,
    "normalized_tag" TEXT COLLATE "C" NOT NULL,
    "iso_language_basis" TEXT NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "normalized_name" TEXT COLLATE "C" NOT NULL,
    "display_order" INTEGER NOT NULL,
    "is_content_enabled" BOOLEAN NOT NULL DEFAULT true,
    "retired_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__languages" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" UUID NOT NULL,
    "canonical_name" TEXT NOT NULL,
    "normalized_canonical_name" TEXT COLLATE "C" NOT NULL,
    "lifecycle_state" "taxonomy_lifecycle_state" NOT NULL DEFAULT 'active',
    "display_order" INTEGER NOT NULL,
    "icon_key" TEXT,
    "lock_version" INTEGER NOT NULL DEFAULT 1,
    "hierarchy_version" INTEGER NOT NULL DEFAULT 1,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__categories" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "topics" (
    "id" UUID NOT NULL,
    "category_id" UUID NOT NULL,
    "parent_topic_id" UUID,
    "canonical_name" TEXT NOT NULL,
    "normalized_canonical_name" TEXT COLLATE "C" NOT NULL,
    "lifecycle_state" "taxonomy_lifecycle_state" NOT NULL DEFAULT 'active',
    "display_order" INTEGER NOT NULL,
    "lock_version" INTEGER NOT NULL DEFAULT 1,
    "archived_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__topics" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "taxonomy_change_records" (
    "id" UUID NOT NULL,
    "command_id" UUID NOT NULL,
    "actor_principal_id" UUID NOT NULL,
    "category_id" UUID,
    "topic_id" UUID,
    "operation" TEXT NOT NULL,
    "reason_code" TEXT NOT NULL,
    "previous_lifecycle_state" TEXT,
    "resulting_lifecycle_state" TEXT,
    "previous_parent_topic_id" UUID,
    "resulting_parent_topic_id" UUID,
    "previous_version" INTEGER,
    "resulting_version" INTEGER NOT NULL,
    "supersedes_change_record_id" UUID,
    "occurred_at" TIMESTAMPTZ(6) NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "pk__taxonomy_change_records" PRIMARY KEY ("id")
);

-- AddUniqueConstraint
ALTER TABLE "languages" ADD CONSTRAINT "uq__languages__normalized_tag" UNIQUE ("normalized_tag");

-- AddUniqueConstraint
ALTER TABLE "languages" ADD CONSTRAINT "uq__languages__normalized_name" UNIQUE ("normalized_name");

-- CreateIndex
CREATE INDEX "ix__languages__content_order" ON "languages"("is_content_enabled", "display_order", "id");

-- CreateIndex
CREATE INDEX "ix__categories__discovery_order" ON "categories"("lifecycle_state", "display_order", "id");

-- CreateIndex
CREATE INDEX "ix__topics__parent_order" ON "topics"("category_id", "parent_topic_id", "display_order", "id");

-- CreateIndex
CREATE INDEX "ix__topics__parent" ON "topics"("parent_topic_id");

-- AddUniqueConstraint
ALTER TABLE "topics" ADD CONSTRAINT "uq__topics__category_identity" UNIQUE ("category_id", "id");

-- AddUniqueConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "uq__taxonomy_change_records__command_id" UNIQUE ("command_id");

-- AddUniqueConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "uq__taxonomy_change_records__supersedes" UNIQUE ("supersedes_change_record_id");

-- CreateIndex
CREATE INDEX "ix__taxonomy_change_records__category_time" ON "taxonomy_change_records"("category_id", "occurred_at" DESC, "id");

-- CreateIndex
CREATE INDEX "ix__taxonomy_change_records__topic_time" ON "taxonomy_change_records"("topic_id", "occurred_at" DESC, "id");

-- CreateIndex
CREATE INDEX "ix__taxonomy_change_records__actor_time" ON "taxonomy_change_records"("actor_principal_id", "occurred_at" DESC, "id");

-- CreateIndex
CREATE INDEX "ix__taxonomy_change_records__previous_parent" ON "taxonomy_change_records"("previous_parent_topic_id");

-- CreateIndex
CREATE INDEX "ix__taxonomy_change_records__resulting_parent" ON "taxonomy_change_records"("resulting_parent_topic_id");

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "uq__categories__active_name" ON "categories"("normalized_canonical_name") WHERE "lifecycle_state" = 'active';

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "uq__topics__active_root_name" ON "topics"("category_id", "normalized_canonical_name") WHERE "lifecycle_state" = 'active' AND "parent_topic_id" IS NULL;

-- CreatePartialUniqueIndex
CREATE UNIQUE INDEX "uq__topics__active_child_name" ON "topics"("category_id", "parent_topic_id", "normalized_canonical_name") WHERE "lifecycle_state" = 'active' AND "parent_topic_id" IS NOT NULL;

-- AddCheckConstraint
ALTER TABLE "actor_principals" ADD CONSTRAINT "ck__actor_principals__actor_kind" CHECK ("actor_kind" IN ('administrative', 'service', 'system'));

-- AddCheckConstraint
ALTER TABLE "languages" ADD CONSTRAINT "ck__languages__bcp47_tag_non_blank" CHECK (btrim("bcp47_tag") <> '');

-- AddCheckConstraint
ALTER TABLE "languages" ADD CONSTRAINT "ck__languages__normalized_tag_non_blank" CHECK (btrim("normalized_tag") <> '');

-- AddCheckConstraint
ALTER TABLE "languages" ADD CONSTRAINT "ck__languages__canonical_name_non_blank" CHECK (btrim("canonical_name") <> '');

-- AddCheckConstraint
ALTER TABLE "languages" ADD CONSTRAINT "ck__languages__normalized_name_non_blank" CHECK (btrim("normalized_name") <> '');

-- AddCheckConstraint
ALTER TABLE "languages" ADD CONSTRAINT "ck__languages__display_order_non_negative" CHECK ("display_order" >= 0);

-- AddCheckConstraint
ALTER TABLE "languages" ADD CONSTRAINT "ck__languages__retirement_content_consistency" CHECK ("retired_at" IS NULL OR NOT "is_content_enabled");

-- AddCheckConstraint
ALTER TABLE "categories" ADD CONSTRAINT "ck__categories__canonical_name_non_blank" CHECK (btrim("canonical_name") <> '');

-- AddCheckConstraint
ALTER TABLE "categories" ADD CONSTRAINT "ck__categories__normalized_name_non_blank" CHECK (btrim("normalized_canonical_name") <> '');

-- AddCheckConstraint
ALTER TABLE "categories" ADD CONSTRAINT "ck__categories__display_order_non_negative" CHECK ("display_order" >= 0);

-- AddCheckConstraint
ALTER TABLE "categories" ADD CONSTRAINT "ck__categories__lock_version_positive" CHECK ("lock_version" > 0);

-- AddCheckConstraint
ALTER TABLE "categories" ADD CONSTRAINT "ck__categories__hierarchy_version_positive" CHECK ("hierarchy_version" > 0);

-- AddCheckConstraint
ALTER TABLE "categories" ADD CONSTRAINT "ck__categories__lifecycle_timestamp_consistency" CHECK (
    ("lifecycle_state" = 'active' AND "archived_at" IS NULL)
    OR ("lifecycle_state" = 'archived' AND "archived_at" IS NOT NULL)
);

-- AddCheckConstraint
ALTER TABLE "topics" ADD CONSTRAINT "ck__topics__canonical_name_non_blank" CHECK (btrim("canonical_name") <> '');

-- AddCheckConstraint
ALTER TABLE "topics" ADD CONSTRAINT "ck__topics__normalized_name_non_blank" CHECK (btrim("normalized_canonical_name") <> '');

-- AddCheckConstraint
ALTER TABLE "topics" ADD CONSTRAINT "ck__topics__display_order_non_negative" CHECK ("display_order" >= 0);

-- AddCheckConstraint
ALTER TABLE "topics" ADD CONSTRAINT "ck__topics__lock_version_positive" CHECK ("lock_version" > 0);

-- AddCheckConstraint
ALTER TABLE "topics" ADD CONSTRAINT "ck__topics__lifecycle_timestamp_consistency" CHECK (
    ("lifecycle_state" = 'active' AND "archived_at" IS NULL)
    OR ("lifecycle_state" = 'archived' AND "archived_at" IS NOT NULL)
);

-- AddCheckConstraint
ALTER TABLE "topics" ADD CONSTRAINT "ck__topics__no_self_parent" CHECK ("parent_topic_id" IS NULL OR "parent_topic_id" <> "id");

-- AddCheckConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "ck__taxonomy_change_records__exactly_one_target" CHECK (
    ("category_id" IS NOT NULL AND "topic_id" IS NULL)
    OR ("category_id" IS NULL AND "topic_id" IS NOT NULL)
);

-- AddCheckConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "ck__taxonomy_change_records__target_operation" CHECK (
    ("category_id" IS NOT NULL AND "topic_id" IS NULL AND "operation" IN ('category_create', 'category_update', 'category_archive', 'category_restore'))
    OR ("category_id" IS NULL AND "topic_id" IS NOT NULL AND "operation" IN ('topic_create', 'topic_update', 'topic_reparent', 'topic_archive', 'topic_restore'))
);

-- AddCheckConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "ck__taxonomy_change_records__reason_code_shape" CHECK ("reason_code" ~ '^[^[:space:]]+$');

-- AddCheckConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "ck__taxonomy_change_records__lifecycle_applicability" CHECK (
    CASE "operation"
        WHEN 'category_create' THEN "previous_lifecycle_state" IS NULL AND "resulting_lifecycle_state" IS NOT DISTINCT FROM 'active'
        WHEN 'topic_create' THEN "previous_lifecycle_state" IS NULL AND "resulting_lifecycle_state" IS NOT DISTINCT FROM 'active'
        WHEN 'category_archive' THEN "previous_lifecycle_state" IS NOT DISTINCT FROM 'active' AND "resulting_lifecycle_state" IS NOT DISTINCT FROM 'archived'
        WHEN 'topic_archive' THEN "previous_lifecycle_state" IS NOT DISTINCT FROM 'active' AND "resulting_lifecycle_state" IS NOT DISTINCT FROM 'archived'
        WHEN 'category_restore' THEN "previous_lifecycle_state" IS NOT DISTINCT FROM 'archived' AND "resulting_lifecycle_state" IS NOT DISTINCT FROM 'active'
        WHEN 'topic_restore' THEN "previous_lifecycle_state" IS NOT DISTINCT FROM 'archived' AND "resulting_lifecycle_state" IS NOT DISTINCT FROM 'active'
        WHEN 'category_update' THEN "previous_lifecycle_state" IS NULL AND "resulting_lifecycle_state" IS NULL
        WHEN 'topic_update' THEN "previous_lifecycle_state" IS NULL AND "resulting_lifecycle_state" IS NULL
        WHEN 'topic_reparent' THEN "previous_lifecycle_state" IS NULL AND "resulting_lifecycle_state" IS NULL
        ELSE false
    END
);

-- AddCheckConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "ck__taxonomy_change_records__parent_applicability" CHECK (
    CASE "operation"
        WHEN 'topic_create' THEN "previous_parent_topic_id" IS NULL
        WHEN 'topic_reparent' THEN "previous_parent_topic_id" IS DISTINCT FROM "resulting_parent_topic_id"
        ELSE "previous_parent_topic_id" IS NULL AND "resulting_parent_topic_id" IS NULL
    END
);

-- AddCheckConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "ck__taxonomy_change_records__version_progression" CHECK (
    CASE "operation"
        WHEN 'category_create' THEN "previous_version" IS NULL AND "resulting_version" = 1
        WHEN 'topic_create' THEN "previous_version" IS NULL AND "resulting_version" = 1
        ELSE "previous_version" IS NOT NULL AND "previous_version" > 0 AND "resulting_version" = "previous_version" + 1
    END
);

-- AddCheckConstraint
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "ck__taxonomy_change_records__no_self_supersession" CHECK ("supersedes_change_record_id" IS NULL OR "supersedes_change_record_id" <> "id");

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "fk__topics__category_id__categories" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "topics" ADD CONSTRAINT "fk__topics__category_id_parent_topic_id__topics" FOREIGN KEY ("category_id", "parent_topic_id") REFERENCES "topics"("category_id", "id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "fk__taxonomy_change_records__actor_id__actor_principals" FOREIGN KEY ("actor_principal_id") REFERENCES "actor_principals"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "fk__taxonomy_change_records__category_id__categories" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "fk__taxonomy_change_records__topic_id__topics" FOREIGN KEY ("topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "fk__taxonomy_change_records__previous_parent_topic_id__topics" FOREIGN KEY ("previous_parent_topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "fk__taxonomy_change_records__resulting_parent_topic_id__topics" FOREIGN KEY ("resulting_parent_topic_id") REFERENCES "topics"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "taxonomy_change_records" ADD CONSTRAINT "fk__taxonomy_change_records__supersede__taxonomy_change_records" FOREIGN KEY ("supersedes_change_record_id") REFERENCES "taxonomy_change_records"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;
