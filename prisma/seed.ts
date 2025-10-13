import prisma from "../db/db.js";
import { Role } from "@prisma/client";
type PickedUser = { email: string; id: string; role: Role };

function getAdminEmails(): string[] {
  return (process.env.SUPERADMIN_EMAIL || '')
    .split(',')
    .map((email: string) => email.trim())
    .filter(Boolean);
}

async function getExistingAdmins(): Promise<PickedUser[]> {
  const adminEmails = getAdminEmails();
  if (adminEmails.length === 0) return [];
  return prisma.user.findMany({
    where: { email: { in: adminEmails } },
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