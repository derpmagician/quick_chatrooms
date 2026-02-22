import { Hono } from 'hono';
import { serve } from 'bun';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';
import userRoutes from './routes/user.routes';
import { handleWebSocket } from './utils/websocket';

const app = new Hono();

app.use('*', cors({
  origin: '*',
  credentials: true,
}));

app.route('/auth', authRoutes);
app.route('/rooms', roomRoutes);
app.route('/users', userRoutes);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});

const port = Number(process.env.PORT ?? 3001);

serve({
  port,
  fetch(req, server) {
    if (server.upgrade(req, { data: { userId: '', username: '', roomId: null } })) {
      return;
    }
    return app.fetch(req);
  },
  websocket: {
    open: handleWebSocket.open,
    message: handleWebSocket.message,
    close: handleWebSocket.close,
  },
});

console.log(`Server is running on http://localhost:${port}`);
