import prisma from "../utils/prisma";

async function main() {
  console.log("Dropping database...");

  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();
  await prisma.message.deleteMany();
  await prisma.room.deleteMany();
  await prisma.user.deleteMany();

  console.log("Database cleared!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
