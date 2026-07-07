import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const shouldExecute = process.argv.includes("--execute");
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const getCounts = async () => ({
  users: await prisma.user.count(),
  accounts: await prisma.account.count(),
  sessions: await prisma.session.count(),
  verificationTokens: await prisma.verificationToken.count(),
  items: await prisma.item.count(),
  collections: await prisma.collection.count(),
  tags: await prisma.tag.count(),
  itemTypes: await prisma.itemType.count(),
});

const main = async () => {
  const before = await getCounts();

  console.log("Database reset summary:");
  console.log({
    mode: shouldExecute ? "execute" : "dry-run",
    before,
  });

  if (!shouldExecute) {
    console.log('\nDry run only. Re-run with "--execute" to delete database data.');
    return;
  }

  const deletedVerificationTokens = await prisma.verificationToken.deleteMany();
  const deletedUsers = await prisma.user.deleteMany();
  const deletedTags = await prisma.tag.deleteMany();
  const deletedItemTypes = await prisma.itemType.deleteMany();
  const after = await getCounts();

  console.log("\nDatabase data reset complete.");
  console.log({
    deletedVerificationTokens: deletedVerificationTokens.count,
    deletedUsers: deletedUsers.count,
    deletedTags: deletedTags.count,
    deletedItemTypes: deletedItemTypes.count,
    after,
  });
};

main()
  .catch((error: unknown) => {
    console.error("Database data reset failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
