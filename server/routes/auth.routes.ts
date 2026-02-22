import { Hono } from 'hono';
import { register, login, getMe } from '../controllers/auth.controller.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Hono();

// monta los manejadores como en Express
router.post('/register', register);
router.post('/login', login);
router.get('/me', authMiddleware, getMe);

export default router;