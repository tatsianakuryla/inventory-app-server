import prisma from "../db/db.ts";

const DEFAULT_CATEGORIES = [
  "Equipment",
  "Furniture",
  "Books",
  "Documents",
  "Electronics",
  "Office Supplies",
  "Other",
];

export async function seedCategories(): Promise<void> {
  for (const name of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { name },
      create: { name },
      update: {},
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  (async () => {
    try {
      await seedCategories();
    } catch (error) {
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }
  })();
}
