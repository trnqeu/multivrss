-- Manually written: Prisma's DSL cannot express GENERATED ALWAYS AS (...) STORED
-- or a GIN index type on an Unsupported field.
-- Language config 'simple' (no stemming) — RSS content is arbitrary/unknown
-- language. Must use the 2-arg to_tsvector(regconfig, text) form: it's IMMUTABLE,
-- required for a generated-column expression (the 1-arg form is only STABLE).

-- AlterTable
ALTER TABLE "FeedItem"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', COALESCE("title", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE("content", '')), 'B')
  ) STORED;

-- CreateIndex
CREATE INDEX "FeedItem_searchVector_idx" ON "FeedItem" USING GIN ("searchVector");

-- AlterTable
ALTER TABLE "SavedLink"
  ADD COLUMN "searchVector" tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('simple', COALESCE("title", '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE("description", '')), 'B')
  ) STORED;

-- CreateIndex
CREATE INDEX "SavedLink_searchVector_idx" ON "SavedLink" USING GIN ("searchVector");
