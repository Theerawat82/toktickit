const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  await prisma.user.updateMany({
    data: { mustChangePassword: false }
  });
  console.log("Updated all users to mustChangePassword = false");
}
main().finally(() => prisma.$disconnect());
