-- AlterTable
ALTER TABLE "User" ADD COLUMN     "savedFadingNoticeSeenAt" TIMESTAMP(3);

-- Anyone who already has fading on turned it on knowingly (the setting has a
-- confirmation dialog): they don't need the first-visit notice.
UPDATE "User" SET "savedFadingNoticeSeenAt" = now() WHERE "savedFading" = true;
