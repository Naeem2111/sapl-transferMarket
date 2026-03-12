/**
 * Run once to create an admin account:
 *   npx ts-node --project tsconfig.json scripts/create-admin.ts
 * or if using tsx:
 *   npx tsx scripts/create-admin.ts
 *
 * Set ADMIN_EMAIL and ADMIN_PASSWORD env vars before running, or edit the
 * defaults below.
 */
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "admin@sapl").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "tempAdminPassword";

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.admin.upsert({
    where: { email },
    update: { passwordHash },
    create: { email, passwordHash },
  });

  console.log(`✅ Admin account ready: ${admin.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
