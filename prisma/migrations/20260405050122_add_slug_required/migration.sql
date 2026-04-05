/*
  Warnings:

  - You are about to drop the `_CategoryToFeedSource` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[slug]` on the table `FeedSource` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `categoryId` to the `FeedSource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `FeedSource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_CategoryToFeedSource" DROP CONSTRAINT "_CategoryToFeedSource_A_fkey";

-- DropForeignKey
ALTER TABLE "_CategoryToFeedSource" DROP CONSTRAINT "_CategoryToFeedSource_B_fkey";

-- AlterTable
ALTER TABLE "FeedSource" ADD COLUMN     "categoryId" TEXT NOT NULL,
ADD COLUMN     "slug" TEXT NOT NULL;

-- DropTable
DROP TABLE "_CategoryToFeedSource";

-- CreateIndex
CREATE UNIQUE INDEX "FeedSource_slug_key" ON "FeedSource"("slug");

-- AddForeignKey
ALTER TABLE "FeedSource" ADD CONSTRAINT "FeedSource_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;
