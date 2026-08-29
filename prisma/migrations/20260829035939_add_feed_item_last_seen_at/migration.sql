-- AlterTable
-- NOT NULL DEFAULT CURRENT_TIMESTAMP fills every existing row at migration time,
-- so no row is instantly purge-eligible (all get a fresh 90-day grace) and the
-- retention query never has to reason about NULL.
ALTER TABLE "FeedItem" ADD COLUMN "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE INDEX "FeedItem_savedAt_lastSeenAt_idx" ON "FeedItem"("savedAt", "lastSeenAt");
