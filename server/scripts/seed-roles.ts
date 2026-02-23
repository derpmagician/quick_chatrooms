import prisma from "../utils/prisma";

const FIXED_IDS = {
  admin: "00000000-0000-0000-0000-000000000001",
  mod: "00000000-0000-0000-0000-000000000002",
  user: "00000000-0000-0000-0000-000000000003",
};

const PERMISSION_IDS: Record<string, string> = {
  "room:create": "00000000-0000-0000-0000-000000000010",
  "room:close": "00000000-0000-0000-0000-000000000011",
  "room:delete": "00000000-0000-0000-0000-000000000012",
  "user:role:change": "00000000-0000-0000-0000-000000000013",
};

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

  // Delete existing to avoid unique constraint issues
  await prisma.rolePermission.deleteMany();
  await prisma.permission.deleteMany();
  await prisma.role.deleteMany();

  // Create permissions
  for (const perm of permissions) {
    const fixedId = PERMISSION_IDS[perm.name];
    await prisma.permission.create({
      data: { id: fixedId, name: perm.name, desc: perm.desc },
    });
  }
  console.log("Permissions created");

  // Create roles with permissions
  for (const role of roles) {
    const permissionIds = await prisma.permission.findMany({
      where: { name: { in: role.permissions } },
      select: { id: true },
    });

    const fixedId = FIXED_IDS[role.name as keyof typeof FIXED_IDS];

    await prisma.role.upsert({
      where: { id: fixedId },
      update: {},
      create: {
        id: fixedId,
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
