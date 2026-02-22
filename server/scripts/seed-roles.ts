import prisma from "../utils/prisma";

const permissions = [
  { name: "room:create", desc: "Crear salas" },
  { name: "room:close", desc: "Cerrar salas" },
  { name: "room:delete", desc: "Borrar salas" },
  { name: "user:role:change", desc: "Cambiar roles de usuarios" },
];

const roles = [
  {
    name: "admin",
    description: "Administrador con todos los permisos",
    permissions: ["room:create", "room:close", "room:delete", "user:role:change"],
  },
  {
    name: "mod",
    description: "Moderador con permisos de sala",
    permissions: ["room:create", "room:close", "room:delete"],
  },
  {
    name: "user",
    description: "Usuario regular sin permisos especiales",
    permissions: [],
  },
];

async function main() {
  console.log("Seeding roles and permissions...");

  // Create permissions
  for (const perm of permissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: { name: perm.name, desc: perm.desc },
    });
  }
  console.log("Permissions created");

  // Create roles with permissions
  for (const role of roles) {
    const permissionIds = await prisma.permission.findMany({
      where: { name: { in: role.permissions } },
      select: { id: true },
    });

    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: {
        name: role.name,
        description: role.description,
        permissions: {
          create: permissionIds.map((p) => ({ permissionId: p.id })),
        },
      },
    });
  }
  console.log("Roles created with permissions");

  // Get role IDs for reference
  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const userRole = await prisma.role.findUnique({ where: { name: "user" } });

  console.log("\nRole IDs:");
  console.log("admin:", adminRole?.id);
  console.log("user:", userRole?.id);

  console.log("\nSeeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
