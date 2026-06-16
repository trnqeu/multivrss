-- Backfill: users created before email verification existed are grandfathered in
-- as already verified, so they are not locked out of login.
UPDATE "User" SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL;
