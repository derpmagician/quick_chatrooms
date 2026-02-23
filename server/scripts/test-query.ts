import prisma from "../utils/prisma";

async function main() {
  try {
    const users = await prisma.user.findMany({
      take: 1
    });
    console.log("Users:", JSON.stringify(users, null, 2));
  } catch (e) {
    console.error("Error:", e);
  }
}

main();
