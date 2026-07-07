import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";

const connectionString = process.env.DATABASE_URL;
const demoUserEmail = "demo@korax.dev";

if (!connectionString) {
  throw new Error("DATABASE_URL is required");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

type ConnectionRow = {
  current_database: string;
  current_schema: string;
  now: Date;
};

const main = async () => {
  const connectionInfo = await prisma.$queryRaw<ConnectionRow[]>`
    SELECT
      current_database(),
      current_schema(),
      now()
  `;

  const itemTypeCount = await prisma.itemType.count();
  const userCount = await prisma.user.count();
  const systemItemTypes = await prisma.itemType.findMany({
    where: {
      isSystem: true,
      userId: null,
    },
    orderBy: {
      name: "asc",
    },
    select: {
      name: true,
      icon: true,
      color: true,
    },
  });
  const demoUser = await prisma.user.findUnique({
    where: {
      email: demoUserEmail,
    },
    select: {
      email: true,
      name: true,
      isPro: true,
      emailVerified: true,
      collections: {
        orderBy: {
          name: "asc",
        },
        select: {
          name: true,
          description: true,
          defaultType: {
            select: {
              name: true,
            },
          },
          _count: {
            select: {
              items: true,
            },
          },
          items: {
            orderBy: {
              addedAt: "asc",
            },
            select: {
              item: {
                select: {
                  title: true,
                  contentType: true,
                  itemType: {
                    select: {
                      name: true,
                    },
                  },
                  language: true,
                  url: true,
                },
              },
            },
          },
        },
      },
    },
  });

  console.log("Database connection successful");
  console.log({
    database: connectionInfo[0]?.current_database ?? null,
    schema: connectionInfo[0]?.current_schema ?? null,
    timestamp: connectionInfo[0]?.now?.toISOString?.() ?? null,
    itemTypeCount,
    userCount,
  });

  console.log("\nSystem item types");
  console.table(systemItemTypes);

  if (!demoUser) {
    throw new Error(`Demo user not found: ${demoUserEmail}`);
  }

  console.log("\nDemo user");
  console.log({
    email: demoUser.email,
    name: demoUser.name,
    isPro: demoUser.isPro,
    emailVerified: demoUser.emailVerified?.toISOString() ?? null,
    collectionCount: demoUser.collections.length,
  });

  console.log("\nDemo collections");
  console.table(
    demoUser.collections.map((collection) => ({
      name: collection.name,
      defaultType: collection.defaultType?.name ?? null,
      itemCount: collection._count.items,
      description: collection.description,
    })),
  );

  for (const collection of demoUser.collections) {
    console.log(`\n${collection.name} items`);
    console.table(
      collection.items.map(({ item }) => ({
        title: item.title,
        itemType: item.itemType.name,
        contentType: item.contentType,
        language: item.language ?? null,
        url: item.url ?? null,
      })),
    );
  }
};

main()
  .catch((error: unknown) => {
    console.error("Database test failed");
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
