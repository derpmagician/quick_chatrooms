import type { Context } from "hono";
import prisma from "../utils/prisma";
import { registerSchema, loginSchema } from "../utils/validation";
import { generateToken } from "../utils/jwt";
import bcrypt from "bcryptjs";

export type AuthContext = Context & { userId?: string };

export const register = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password, username } = registerSchema.parse(body);

    const sanitizedEmail = email.toLowerCase().trim();
    const sanitizedUsername = username.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: sanitizedEmail },
          { username: sanitizedUsername },
        ],
      },
    });

    if (existingUser) {
      c.status(400);
      return c.json({
        error:
          existingUser.email === sanitizedEmail
            ? "El email ya está registrado"
            : "El nombre de usuario ya está en uso",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Check if this is the first user (admin) or regular user
    // Also check if there are any users with admin role
    const userCount = await prisma.user.count();
    const adminRole = await prisma.role.findUnique({ where: { name: "admin" } });
    
    // First user OR no users with admin role gets admin
    const shouldBeAdmin = userCount === 0 || !(await prisma.user.findFirst({ where: { role: { name: "admin" } } }));
    
    const role = shouldBeAdmin 
      ? adminRole
      : await prisma.role.findUnique({ where: { name: "user" } });

    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        username: sanitizedUsername,
        roleId: role?.id,
      },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    const permissions = user.role?.permissions.map((rp) => rp.permission.name) ?? [];

    c.status(201);
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        role: user.role?.name ?? null,
        permissions,
      },
      token,
    });
  } catch (err) {
    if (err instanceof Error) {
      c.status(400);
      return c.json({ error: err.message });
    }
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const login = async (c: Context) => {
  try {
    const body = await c.req.json();
    const { email, password } = loginSchema.parse(body);

    const normalizedEmail = email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      c.status(401);
      return c.json({ error: "Credenciales inválidas" });
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    const permissions = user.role?.permissions.map((rp) => rp.permission.name) ?? [];

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        role: user.role?.name ?? null,
        permissions,
      },
      token,
    });
  } catch (err) {
    if (err instanceof Error) {
      c.status(400);
      return c.json({ error: err.message });
    }
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const getMe = async (c: AuthContext) => {
  try {
    const userId = c.get("userId");
    if (!userId) {
      c.status(401);
      return c.json({ error: "No autorizado" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      c.status(404);
      return c.json({ error: "Usuario no encontrado" });
    }

    const permissions = user.role?.permissions.map((rp) => rp.permission.name) ?? [];

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
        role: user.role?.name ?? null,
        permissions,
      },
    });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};
