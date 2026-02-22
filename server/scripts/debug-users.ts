import prisma from "../utils/prisma";

async function main() {
  await prisma.message.deleteMany({});
  await prisma.room.deleteMany({});
  await prisma.user.deleteMany({});
  console.log("All data deleted");
}

main();
