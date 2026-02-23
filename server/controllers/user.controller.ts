import type { Context } from "hono";
import prisma from "../utils/prisma";
import type { AuthContext } from "../middleware/auth";
import { hasPermission } from "../middleware/auth";

export const getRoles = async (c: AuthContext) => {
  try {
    if (!hasPermission(c, "user:role:change")) {
      c.status(403);
      return c.json({ error: "No tienes permiso para ver roles" });
    }

    const roles = await prisma.role.findMany({
      select: {
        id: true,
        name: true,
        description: true,
      },
      orderBy: { name: "asc" },
    });

    return c.json({ roles });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const getUsers = async (c: AuthContext) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        theme: true,
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
        theme: true,
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

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        theme: user.theme,
        createdAt: user.createdAt,
        role: user.role?.name ?? null,
      },
    });
  } catch (err) {
    console.error("Error in getUserById:", err);
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
        theme: true,
        preferences: true,
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

export const updateUser = async (c: AuthContext) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");

    if (id !== userId) {
      c.status(403);
      return c.json({ error: "No puedes editar otro usuario" });
    }

    const body = await c.req.json();
    const { username, avatar, theme, preferences } = body;

    if (!username || typeof username !== "string" || username.trim().length === 0) {
      c.status(400);
      return c.json({ error: "El nombre de usuario es requerido" });
    }

    const sanitizedUsername = username.trim();

    const existingUser = await prisma.user.findFirst({
      where: {
        username: sanitizedUsername,
        NOT: { id },
      },
    });

    if (existingUser) {
      c.status(400);
      return c.json({ error: "El nombre de usuario ya está en uso" });
    }

    const validThemes = ['purple', 'blue', 'green', 'pink', 'dark'];
    if (theme && !validThemes.includes(theme)) {
      c.status(400);
      return c.json({ error: "Tema no válido" });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        username: sanitizedUsername,
        ...(avatar !== undefined && { avatar }),
        ...(theme !== undefined && { theme }),
        ...(preferences !== undefined && { preferences }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        theme: true,
        preferences: true,
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
