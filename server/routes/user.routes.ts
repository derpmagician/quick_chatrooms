import { Hono } from 'hono';
import { getUsers, getUserById, updateUserRole } from '../controllers/user.controller.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Hono();

router.get('/', authMiddleware, getUsers)
router.get('/:id', authMiddleware, getUserById)
router.patch('/:id/role', authMiddleware, updateUserRole)

export default router
