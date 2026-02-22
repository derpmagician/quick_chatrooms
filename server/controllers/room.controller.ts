import type { Context } from "hono";
import prisma from "../utils/prisma";
import { createRoomSchema } from "../utils/validation";
import type { AuthContext } from "../middleware/auth";

export const getRooms = async (c: AuthContext) => {
  try {
    const userId = c.get("userId");

    const rooms = await prisma.room.findMany({
      where: {
        OR: [
          { isPrivate: false },
          { members: { some: { id: userId } } },
        ],
      },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
        _count: { select: { members: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return c.json({ rooms });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const createRoom = async (c: AuthContext) => {
  try {
    const body = await c.req.json();
    const { name, isPrivate } = createRoomSchema.parse(body);

    const sanitizedName = name.trim();
    const ownerId = c.get("userId")!;

    const room = await prisma.room.create({
      data: {
        name: sanitizedName,
        isPrivate: isPrivate ?? false,
        ownerId,
        members: { connect: { id: ownerId } },
      },
      include: {
        owner: { select: { id: true, username: true, avatar: true } },
      },
    });

    c.status(201);
    return c.json({ room });
  } catch (error) {
    if (error instanceof Error) {
      c.status(400);
      return c.json({ error: error.message });
    }
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const joinRoom = async (c: AuthContext) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");

    const room = await prisma.room.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!room) {
      c.status(404);
      return c.json({ error: "Sala no encontrada" });
    }

    if (room.members.some((m) => m.id === userId)) {
      c.status(400);
      return c.json({ error: "Ya eres miembro de esta sala" });
    }

    await prisma.room.update({
      where: { id },
      data: { members: { connect: { id: userId } } },
    });

    return c.json({ message: "Te has unido a la sala" });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const leaveRoom = async (c: AuthContext) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");

    const room = await prisma.room.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!room) {
      c.status(404);
      return c.json({ error: "Sala no encontrada" });
    }

    if (!room.members.some((m) => m.id === userId)) {
      c.status(400);
      return c.json({ error: "No eres miembro de esta sala" });
    }

    await prisma.room.update({
      where: { id },
      data: { members: { disconnect: { id: userId } } },
    });

    return c.json({ message: "Has salido de la sala" });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const getRoomMembers = async (c: AuthContext) => {
  try {
    const id = c.req.param("id");
    const userId = c.get("userId");

    const room = await prisma.room.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!room) {
      c.status(404);
      return c.json({ error: "Sala no encontrada" });
    }

    if (room.isPrivate && !room.members.some((m) => m.id === userId)) {
      c.status(403);
      return c.json({ error: "No tienes acceso a esta sala" });
    }

    const members = room.members.map((m) => ({
      id: m.id,
      username: m.username,
      avatar: m.avatar,
    }));

    return c.json({ members });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};

export const getRoomMessages = async (c: AuthContext) => {
  try {
    const id = c.req.param("id");
    const limit = parseInt(c.req.query("limit") ?? "50", 10);
    const before = c.req.query("before");

    const room = await prisma.room.findUnique({
      where: { id },
      include: { members: true },
    });

    if (!room) {
      c.status(404);
      return c.json({ error: "Sala no encontrada" });
    }

    if (room.isPrivate && !room.members.some((m) => m.id === c.get("userId"))) {
      c.status(403);
      return c.json({ error: "No tienes acceso a esta sala" });
    }

    const messages = await prisma.message.findMany({
      where: {
        roomId: id,
        ...(before
          ? { createdAt: { lt: new Date(before as string) } }
          : {}),
      },
      include: {
        user: { select: { id: true, username: true, avatar: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    return c.json({ messages: messages.reverse() });
  } catch {
    c.status(500);
    return c.json({ error: "Error del servidor" });
  }
};