-- AlterTable
ALTER TABLE "FeedItem" ADD COLUMN     "saveUrlKey" TEXT;

-- AlterTable
ALTER TABLE "SavedLink" ADD COLUMN     "urlKey" TEXT;

-- CreateIndex
CREATE INDEX "FeedItem_saveUrlKey_idx" ON "FeedItem"("saveUrlKey");

-- CreateIndex
CREATE INDEX "SavedLink_urlKey_idx" ON "SavedLink"("urlKey");

-- Existing rows are backfilled by the worker (backfillUrlKeys in
-- src/lib/fading-encounters.ts): the normalization lives in TypeScript.
