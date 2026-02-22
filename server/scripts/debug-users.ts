import prisma from "../utils/prisma";

async function main() {
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const userRole = await prisma.role.findUnique({ where: { name: "user" } });
  
  console.log("Admin role:", adminRole);
  console.log("User role:", userRole);
  
  const user = await prisma.user.findFirst({ orderBy: { createdAt: 'asc' } });
  
  if (user && !user.roleId) {
    await prisma.user.update({
      where: { id: user.id },
      data: { roleId: adminRole?.id }
    });
    console.log("First user updated to admin!");
  }
}

main();
