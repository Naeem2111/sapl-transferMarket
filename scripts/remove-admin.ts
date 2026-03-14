/**
 * Remove an admin account:
 *   $env:ADMIN_EMAIL="admin@sapl"; npx tsx scripts/remove-admin.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_EMAIL || "").toLowerCase().trim();

  if (!email) {
    console.error("❌ Set ADMIN_EMAIL env var. Example:");
    console.error('   $env:ADMIN_EMAIL="admin@sapl"; npx tsx scripts/remove-admin.ts');
    process.exit(1);
  }

  const admin = await prisma.admin.findUnique({ where: { email } });

  if (!admin) {
    console.error(`❌ No admin found with email: ${email}`);
    process.exit(1);
  }

  // Safety: don't allow removing the last admin
  const count = await prisma.admin.count();
  if (count <= 1) {
    console.error("❌ Cannot remove the last admin account.");
    process.exit(1);
  }

  await prisma.admin.delete({ where: { email } });
  console.log(`✅ Admin removed: ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
