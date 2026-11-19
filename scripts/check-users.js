const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, fullName: true, role: true, isActive: true }
  });
  console.log("USERS_IN_DB:", JSON.stringify(users, null, 2));
}

main().finally(() => prisma.$disconnect());
