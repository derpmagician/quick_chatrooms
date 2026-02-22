import type { Context } from "hono";
import prisma from "../utils/prisma";
import type { AuthContext } from "../middleware/auth";
import { hasPermission } from "../middleware/auth";

export const getUsers = async (c: AuthContext) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ users });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const getUserById = async (c: AuthContext) => {
  try {
    const id = c.req.param("id");

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    if (!user) {
      c.status(404);
      return c.json({ error: "Usuario no encontrado" });
    }

    return c.json({ user });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const updateUserRole = async (c: AuthContext) => {
  try {
    if (!hasPermission(c, "user:role:change")) {
      c.status(403);
      return c.json({ error: "No tienes permiso para cambiar roles" });
    }

    const id = c.req.param("id");
    const { roleId } = await c.req.json();

    if (!roleId) {
      c.status(400);
      return c.json({ error: "El roleId es requerido" });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!targetUser) {
      c.status(404);
      return c.json({ error: "Usuario no encontrado" });
    }

    const role = await prisma.role.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      c.status(404);
      return c.json({ error: "Rol no encontrado" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { roleId: role.id },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
        role: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
      },
    });

    return c.json({ user: updatedUser });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};
