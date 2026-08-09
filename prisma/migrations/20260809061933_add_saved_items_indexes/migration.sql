-- CreateIndex
CREATE INDEX "FeedItem_savedAt_idx" ON "FeedItem"("savedAt");

-- CreateIndex
CREATE INDEX "SavedLink_userId_createdAt_idx" ON "SavedLink"("userId", "createdAt");
