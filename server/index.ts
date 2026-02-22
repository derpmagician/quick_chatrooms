import { Hono } from 'hono';
import { serve } from 'bun';
import authRoutes from './routes/auth.routes';
import roomRoutes from './routes/room.routes';

const app = new Hono();


app.route('/auth', authRoutes);
app.route('/rooms', roomRoutes);

app.get('/', (c) => {
  return c.text('Hello Hono!');
});



const port = Number(process.env.PORT ?? 3001);


serve({
  port,
  fetch: app.fetch,
});

console.log(`Server is running on http://localhost:${port}`);