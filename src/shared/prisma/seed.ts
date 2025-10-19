import prisma from "../db/db.ts";
import { Role } from "@prisma/client";
import { SUPERADMINS } from "../../users/shared/constants/constants.ts";
type PickedUser = { email: string; id: string; role: Role };

async function getExistingAdmins(): Promise<PickedUser[]> {
  if (SUPERADMINS.size === 0) return [];
  const array = Array.from(SUPERADMINS);
  return prisma.user.findMany({
    where: { email: { in: array } },
    select: { email: true, id: true, role: true },
  });
}

export async function seed(): Promise<void> {
  const existing = await getExistingAdmins();
  const emails = existing.map((user: PickedUser) => user.email);
  if (existing.length === 0) return;
  await prisma.user.updateMany({
    where: { email: { in: emails }, NOT: { role: Role.ADMIN }},
    data: { role: Role.ADMIN },
  })
}

(async () => {
  try {
    await seed();
  }
  catch {
    process.exit(1);
  }
  finally {
    await prisma.$disconnect();
  }
})();