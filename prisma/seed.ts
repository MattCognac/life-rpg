/**
 * Dev-only seed script. In production, achievements and character data are
 * created during the onboarding flow (createCharacter server action).
 *
 * To use: create a test user in Supabase, then set TEST_USER_ID below.
 */

import { PrismaClient } from "@prisma/client";
import { ACHIEVEMENTS } from "../src/lib/achievements";

const db = new PrismaClient();

const TEST_USER_ID = process.env.TEST_USER_ID;

async function main() {
  if (!TEST_USER_ID) {
    console.error(
      "❌ Set TEST_USER_ID environment variable to seed.\n" +
        "   Create a user via Supabase Auth, then pass their UUID.\n" +
        "   Example: TEST_USER_ID=abc-123 npm run db:seed",
    );
    process.exit(1);
  }

  console.log("🗡️  Seeding Life RPG for user:", TEST_USER_ID);

  // Character
  const character = await db.character.upsert({
    where: { userId: TEST_USER_ID },
    update: {},
    create: {
      userId: TEST_USER_ID,
      name: "Ragnar",
      title: "Novice",
      class: "warrior",
      level: 1,
      totalXp: 0,
    },
  });
  console.log(`  ✓ Character: ${character.name}`);

  // Achievements
  let created = 0;
  for (const def of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { userId_key: { userId: TEST_USER_ID, key: def.key } },
      update: {},
      create: {
        userId: TEST_USER_ID,
        key: def.key,
        name: def.name,
        description: def.description,
        icon: def.icon,
        category: def.category,
        sortOrder: def.sortOrder,
      },
    });
    created++;
  }
  console.log(`  ✓ ${created} achievements`);

  console.log("\n✨ Seed complete! Run `npm run dev` to begin your adventure.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
