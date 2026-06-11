-- CreateTable
CREATE TABLE "FeedItemTag" (
    "feedItemId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "FeedItemTag_pkey" PRIMARY KEY ("feedItemId","tagId")
);

-- AddForeignKey
ALTER TABLE "FeedItemTag" ADD CONSTRAINT "FeedItemTag_feedItemId_fkey" FOREIGN KEY ("feedItemId") REFERENCES "FeedItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FeedItemTag" ADD CONSTRAINT "FeedItemTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
