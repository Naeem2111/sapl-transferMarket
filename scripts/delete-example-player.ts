import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.player.deleteMany({
    where: { personId: "783008956" },
  });
  console.log("Deleted", result.count, "player(s) with Person ID 783008956");
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
