import type { Context, Next } from "hono";
import { verifyToken } from "../utils/jwt";
import prisma from "../utils/prisma";

export type AuthContext = Context & {
  userId?: string;
  userEmail?: string;
  userRole?: string;
  userPermissions?: string[];
};

export const authMiddleware = async (c: AuthContext, next: Next) => {
  const authHeader = c.req.header("authorization") ?? "";

  if (!authHeader.startsWith("Bearer ")) {
    c.status(401);
    return c.json({ error: "Token no proporcionado" });
  }

  const token = authHeader.slice(7);

  const payload = await verifyToken(token);

  if (!payload) {
    c.status(401);
    return c.json({ error: "Token inválido o expirado" });
  }

  // Get user with role and permissions
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
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

  const permissions = user?.role?.permissions.map((rp) => rp.permission.name) ?? [];

  c.set("userId", payload.userId);
  c.set("userEmail", payload.email);
  c.set("userRole", user?.role?.name ?? "user");
  c.set("userPermissions", permissions);

  return next();
};

export function hasPermission(c: AuthContext, permission: string): boolean {
  const permissions = c.get("userPermissions") ?? [];
  return permissions.includes(permission);
}

export function requirePermission(c: AuthContext, permission: string): boolean {
  if (!hasPermission(c, permission)) {
    c.status(403);
    return false;
  }
  return true;
}
