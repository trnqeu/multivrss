-- CreateEnum
CREATE TYPE "SavedStage" AS ENUM ('VIVID', 'GIST', 'TRACE');

-- AlterTable
ALTER TABLE "FeedItem" ADD COLUMN     "saveStability" DOUBLE PRECISION,
ADD COLUMN     "saveStage" "SavedStage",
ADD COLUMN     "saveTouchedAt" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "SavedLink" ADD COLUMN     "lastTouchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "stability" DOUBLE PRECISION NOT NULL DEFAULT 30,
ADD COLUMN     "stage" "SavedStage" NOT NULL DEFAULT 'VIVID';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "savedFading" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "savedFadingSince" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "SavedLink_userId_stage_idx" ON "SavedLink"("userId", "stage");

-- Hand-written: stability is a divisor in R = exp(-days / stability).
ALTER TABLE "SavedLink" ADD CONSTRAINT "SavedLink_stability_positive" CHECK ("stability" > 0);
ALTER TABLE "FeedItem" ADD CONSTRAINT "FeedItem_saveStability_positive" CHECK ("saveStability" IS NULL OR "saveStability" > 0);
