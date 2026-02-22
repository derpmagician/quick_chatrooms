import type { Context, Next } from "hono";
import { verifyToken } from "../utils/jwt";

export type AuthContext = Context & {
  userId?: string;
  userEmail?: string;
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

  c.set("userId", payload.userId);
  c.set("userEmail", payload.email);

  return next();
};