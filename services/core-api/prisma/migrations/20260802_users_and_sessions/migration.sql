-- Migration: 20260802_users_and_sessions
-- Adds users, refresh_tokens, and reading_sessions tables.

CREATE TABLE "users" (
    "id"            UUID        NOT NULL,
    "email"         TEXT        NOT NULL,
    "display_name"  TEXT        NOT NULL,
    "password_hash" TEXT        NOT NULL,
    "is_active"     BOOLEAN     NOT NULL DEFAULT TRUE,
    "created_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),
    "updated_at"    TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "pk__users" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "uq__users__email" ON "users" ("email");

CREATE TABLE "refresh_tokens" (
    "id"         UUID           NOT NULL,
    "user_id"    UUID           NOT NULL,
    "token_hash" TEXT           NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "revoked_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "pk__refresh_tokens" PRIMARY KEY ("id"),
    CONSTRAINT "fk__refresh_tokens__user_id__users"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id")
        ON DELETE CASCADE ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "uq__refresh_tokens__token_hash" ON "refresh_tokens" ("token_hash");
CREATE INDEX "ix__refresh_tokens__user_id" ON "refresh_tokens" ("user_id");

CREATE TABLE "reading_sessions" (
    "id"                 UUID           NOT NULL,
    "user_id"            UUID           NOT NULL,
    "lesson_revision_id" UUID           NOT NULL,
    "event_id"           UUID           NOT NULL,
    "reading_mode"       TEXT           NOT NULL,
    "pace_wpm"           INTEGER        NOT NULL,
    "words_read"         INTEGER        NOT NULL,
    "duration_seconds"   INTEGER        NOT NULL,
    "is_completed"       BOOLEAN        NOT NULL DEFAULT FALSE,
    "occurred_at"        TIMESTAMPTZ(6) NOT NULL,
    "created_at"         TIMESTAMPTZ(6) NOT NULL DEFAULT NOW(),

    CONSTRAINT "pk__reading_sessions" PRIMARY KEY ("id"),
    CONSTRAINT "fk__reading_sessions__user_id__users"
        FOREIGN KEY ("user_id") REFERENCES "users" ("id")
        ON DELETE RESTRICT ON UPDATE NO ACTION
);

CREATE UNIQUE INDEX "uq__reading_sessions__event_id" ON "reading_sessions" ("event_id");
CREATE INDEX "ix__reading_sessions__user_time" ON "reading_sessions" ("user_id", "occurred_at" DESC);
