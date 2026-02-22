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

    const user = await prisma.user.create({
      data: {
        email: sanitizedEmail,
        password: hashedPassword,
        username: sanitizedUsername,
      },
    });

    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    c.status(201);
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
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
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      c.status(401);
      return c.json({ error: "Credenciales inválidas" });
    }

    const token = await generateToken({
      userId: user.id,
      email: user.email,
    });

    return c.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt,
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
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        createdAt: true,
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