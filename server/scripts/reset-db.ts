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

async function main() {
  console.log("🔄 Reseteando base de datos...\n");

  // 1. Borrar datos de las tablas (respetando orden de FK)
  console.log("🗑️  Borrando datos...");
  
  await prisma.rolePermission.deleteMany();
  console.log("  ✓ role_permissions");
  
  await prisma.permission.deleteMany();
  console.log("  ✓ permissions");
  
  await prisma.role.deleteMany();
  console.log("  ✓ roles");
  
  await prisma.message.deleteMany();
  console.log("  ✓ messages");
  
  await prisma.room.deleteMany();
  console.log("  ✓ rooms");
  
  await prisma.user.deleteMany();
  console.log("  ✓ users");

  console.log("\n✅ Base de datos limpiada!\n");

  // 2. Ejecutar migraciones de Prisma
  console.log("🔨 Ejecutando migraciones...");
  const { execSync } = require("child_process");
  
  try {
    execSync("bunx prisma db push", { 
      stdio: "inherit",
      cwd: process.cwd() 
    });
    console.log("✅ Migraciones aplicadas!\n");
  } catch (error) {
    console.log("⚠️  Error al aplicar migraciones.\n");
  }

  // 3. Semillar roles con IDs fijos
  console.log("🌱 Creando roles y permisos...");

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

  // Create permissions
  for (const perm of permissions) {
    const fixedId = PERMISSION_IDS[perm.name];
    await prisma.permission.create({
      data: { id: fixedId, name: perm.name, desc: perm.desc },
    });
  }
  console.log("  ✓ Permisos creados");

  // Create roles with permissions
  for (const role of roles) {
    const permissionIds = await prisma.permission.findMany({
      where: { name: { in: role.permissions } },
      select: { id: true },
    });

    const fixedId = FIXED_IDS[role.name as keyof typeof FIXED_IDS];

    await prisma.role.create({
      data: {
        id: fixedId,
        name: role.name,
        description: role.description,
        permissions: {
          create: permissionIds.map((p) => ({ permissionId: p.id })),
        },
      },
    });
  }
  console.log("  ✓ Roles creados");

  console.log("\n📋 IDs de roles:");
  console.log("  admin:", FIXED_IDS.admin);
  console.log("  mod:", FIXED_IDS.mod);
  console.log("  user:", FIXED_IDS.user);

  console.log("\n🎉 Base de datos reseteada correctamente!");
  console.log("\n⚠️  El primer usuario que se registre será ADMIN");
}

main()
  .catch((e) => {
    console.error("\n❌ Error:", e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
