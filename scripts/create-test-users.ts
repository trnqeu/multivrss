import bcrypt from "bcrypt";
import { prisma } from "../src/lib/prisma";

const DEFAULT_PASSWORD = "Test1234!";

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

  const count = Number(process.argv[2] ?? 1);
  const password = process.argv[3] ?? DEFAULT_PASSWORD;

  if (!Number.isInteger(count) || count < 1) {
    throw new Error("Usage: create-test-users.ts <count> [password]");
  }

  const hashed = await bcrypt.hash(password, 10);
  const stamp = Date.now();

  for (let i = 1; i <= count; i++) {
    const username = `testuser_${stamp}_${i}`;
    const user = await prisma.user.create({
      data: {
        username,
        email: `${username}@example.com`,
        password: hashed,
        emailVerified: new Date(),
      },
    });
    console.log(`Created ${user.username} <${user.email}> / password: ${password}`);
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
