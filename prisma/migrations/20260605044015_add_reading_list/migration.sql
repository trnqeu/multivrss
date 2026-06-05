-- AlterTable
ALTER TABLE "FeedItem" ADD COLUMN     "savedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SavedLink" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedLink_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SavedLink_userId_idx" ON "SavedLink"("userId");

-- AddForeignKey
ALTER TABLE "SavedLink" ADD CONSTRAINT "SavedLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
