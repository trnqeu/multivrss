// Local-only helper to check saved-item fading by hand: moves a user's saved
// items back in time, then optionally runs the nightly fading pass.
//
//   npx tsx --env-file=.env --tsconfig tsconfig.test.json scripts/fading-time-travel.ts <username> <days> [--run] [--dry-run]
//
// <days> is subtracted from every saved item's last-touched time. With the
// default stability of 60 days: 73 → GIST, 153 → TRACE, 277 → forgotten.
// Fading must be enabled for the user (Settings, or enableSavedFading()).
import { prisma } from "../src/lib/prisma";
import { runSavedFading } from "../src/lib/saved-fading";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function assertLocalDatabase() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set.");
  }
  const { hostname } = new URL(url);
  if (hostname !== "localhost" && hostname !== "127.0.0.1") {
    throw new Error(
      `Refusing to run: DATABASE_URL points to "${hostname}", not localhost. This script must only run against the local dev database.`
    );
  }
}

async function main() {
  assertLocalDatabase();

  const [username, daysArg, ...flags] = process.argv.slice(2);
  const days = Number(daysArg);
  if (!username || !Number.isFinite(days) || days < 0) {
    throw new Error("Usage: fading-time-travel.ts <username> <days> [--run] [--dry-run]");
  }

  const user = await prisma.user.findUnique({ where: { username }, select: { id: true, savedFading: true } });
  if (!user) throw new Error(`No user "${username}".`);
  if (!user.savedFading) console.warn(`Fading is disabled for "${username}": the pass will skip them.`);

  const shiftMs = days * MS_PER_DAY;
  const links = await prisma.$executeRaw`
    UPDATE "SavedLink" SET "lastTouchedAt" = "lastTouchedAt" - make_interval(secs => ${shiftMs / 1000})
    WHERE "userId" = ${user.id}`;
  const articles = await prisma.$executeRaw`
    UPDATE "FeedItem" fi SET "saveTouchedAt" = fi."saveTouchedAt" - make_interval(secs => ${shiftMs / 1000})
    FROM "FeedSource" fs JOIN "Category" c ON c.id = fs."categoryId"
    WHERE fs.id = fi."sourceId" AND c."userId" = ${user.id}
      AND fi."savedAt" IS NOT NULL AND fi."saveTouchedAt" IS NOT NULL`;
  console.log(`Moved ${links} saved links and ${articles} saved articles back by ${days} days.`);

  if (flags.includes("--run")) {
    const dryRun = flags.includes("--dry-run");
    const { faded, traced, forgotten } = await runSavedFading({ dryRun });
    console.log(`Fading pass${dryRun ? " (dry run)" : ""}: faded ${faded}, traced ${traced}, forgotten ${forgotten} (all users).`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
