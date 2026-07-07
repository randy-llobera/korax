import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { getAuthTokenIdentifiersForEmail } from "../src/lib/auth/token-identifiers";

const DEMO_USER_EMAIL = "demo@korax.dev";
const shouldExecute = process.argv.includes("--execute");

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const main = async () => {
  const demoUser = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    select: { id: true, email: true },
  });

  if (!demoUser) {
    throw new Error(`Demo user not found: ${DEMO_USER_EMAIL}`);
  }

  const usersToDelete = await prisma.user.findMany({
    where: {
      email: {
        not: DEMO_USER_EMAIL,
      },
    },
    orderBy: {
      createdAt: "asc",
    },
    select: {
      id: true,
      email: true,
      _count: {
        select: {
          accounts: true,
          collections: true,
          items: true,
          itemTypes: true,
          sessions: true,
        },
      },
    },
  });

  if (usersToDelete.length === 0) {
    console.log(`No users found outside ${DEMO_USER_EMAIL}. Nothing to delete.`);
    return;
  }

  const userIdsToDelete = usersToDelete.map((user) => user.id);
  const userEmailsToDelete = usersToDelete.map((user) => user.email);
  const tokenIdentifiersToDelete = userEmailsToDelete.flatMap(getAuthTokenIdentifiersForEmail);

  const verificationTokenCount = await prisma.verificationToken.count({
    where: {
      identifier: {
        in: tokenIdentifiersToDelete,
      },
    },
  });

  console.log("Users queued for deletion:");
  console.table(
    usersToDelete.map((user) => ({
      email: user.email,
      accounts: user._count.accounts,
      sessions: user._count.sessions,
      itemTypes: user._count.itemTypes,
      collections: user._count.collections,
      items: user._count.items,
    })),
  );

  console.log("Summary:");
  console.log({
    demoUserKept: demoUser.email,
    usersToDelete: usersToDelete.length,
    verificationTokensToDelete: verificationTokenCount,
    mode: shouldExecute ? "execute" : "dry-run",
  });

  if (!shouldExecute) {
    console.log('\nDry run only. Re-run with "--execute" to apply the deletion.');
    return;
  }

  const deletedVerificationTokens = await prisma.verificationToken.deleteMany({
    where: {
      identifier: {
        in: tokenIdentifiersToDelete,
      },
    },
  });

  const deletedUsers = await prisma.user.deleteMany({
    where: {
      id: {
        in: userIdsToDelete,
      },
    },
  });

  const deletedTags = await prisma.tag.deleteMany({
    where: {
      items: {
        none: {},
      },
    },
  });

  console.log("\nDeletion complete.");
  console.log({
    deletedUsers: deletedUsers.count,
    deletedVerificationTokens: deletedVerificationTokens.count,
    deletedOrphanTags: deletedTags.count,
  });
};

main()
  .catch((error: unknown) => {
    console.error("User cleanup failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
