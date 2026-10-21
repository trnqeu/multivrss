-- Initial stability of a saved link raised from 30 to 60 days (S0_DAYS in
-- src/lib/fading-params.ts). Existing rows are not rewritten: stability only
-- matters once fading is enabled, and enabling resets every item to S0.
ALTER TABLE "SavedLink" ALTER COLUMN "stability" SET DEFAULT 60;
