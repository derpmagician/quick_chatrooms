import prisma from "../utils/prisma";

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
    execSync("bunx prisma migrate dev", { 
      stdio: "inherit",
      cwd: process.cwd() 
    });
    console.log("✅ Migraciones aplicadas!\n");
  } catch (error) {
    console.log("⚠️  Las migraciones ya están al día o no hay nuevas.\n");
  }

  // 3. Semillar roles
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
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: { name: perm.name, desc: perm.desc },
    });
  }
  console.log("  ✓ Permisos creados");

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
  console.log("  ✓ Roles creados");

  const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
  const userRole = await prisma.role.findUnique({ where: { name: "user" } });

  console.log("\n📋 IDs de roles:");
  console.log("  admin:", adminRole?.id);
  console.log("  user:", userRole?.id);

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
