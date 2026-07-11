import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { isVerified: false },
    data: { isVerified: true },
  });
  console.log(`✅ Updated ${result.count} user(s) to isVerified = true`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
