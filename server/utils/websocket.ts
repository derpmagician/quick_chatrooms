import type { ServerWebSocket } from 'bun';

interface WSData {
  userId: string;
  username: string;
  roomId: string | null;
}

interface Client {
  ws: ServerWebSocket<WSData>;
  userId: string;
  username: string;
  roomId: string | null;
}

const clients = new Map<string, Client>();

function broadcastToRoom(roomId: string, event: string, data: unknown, excludeUserId?: string) {
  for (const client of clients.values()) {
    if (client.roomId === roomId && client.userId !== excludeUserId) {
      client.ws.send(JSON.stringify({ event, data }));
    }
  }
}

function broadcastUserList(roomId: string) {
  const usersInRoom = Array.from(clients.values())
    .filter(c => c.roomId === roomId)
    .map(c => ({ userId: c.userId, username: c.username }));

  for (const client of clients.values()) {
    if (client.roomId === roomId) {
      client.ws.send(JSON.stringify({ event: 'users_in_room', data: usersInRoom }));
    }
  }
}

export const handleWebSocket = {
  open(ws: ServerWebSocket<WSData>) {
    console.log('WebSocket opened');
  },

  message(ws: ServerWebSocket<WSData>, message: string) {
    try {
      const payload = JSON.parse(message.toString());
      const { event, data } = payload;

      switch (event) {
        case 'join_room': {
          const { userId, username, roomId } = data;
          
          if (ws.data.roomId) {
            const oldClient = clients.get(ws.data.userId);
            if (oldClient) {
              oldClient.roomId = null;
            }
            broadcastUserList(ws.data.roomId);
          }

          ws.data = { userId, username, roomId };
          
          clients.set(userId, {
            ws,
            userId,
            username,
            roomId,
          });

          broadcastUserList(roomId);
          break;
        }

        case 'leave_room': {
          const { roomId } = data;
          
          if (ws.data.roomId) {
            clients.delete(ws.data.userId);
            ws.data.roomId = null;
            broadcastUserList(roomId);
          }
          break;
        }

        case 'send_message': {
          const { roomId, message: msg, userId, username } = data;
          
          broadcastToRoom(roomId, 'new_message', {
            id: crypto.randomUUID(),
            content: msg,
            userId,
            roomId,
            createdAt: new Date().toISOString(),
            user: { id: userId, username, avatar: null },
          }, userId);
          break;
        }

        case 'typing': {
          const { roomId, username, userId } = data;
          
          broadcastToRoom(roomId, 'user_typing', { username, userId }, userId);
          break;
        }
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  },

  close(ws: ServerWebSocket<WSData>) {
    const { userId, roomId } = ws.data;
    
    if (userId) {
      clients.delete(userId);
    }
    
    if (roomId) {
      broadcastUserList(roomId);
    }
    
    console.log('WebSocket closed');
  },
};
