import { Hono } from 'hono';
import { getRoles, getUsers, getUserById, updateUserRole, updateUser } from '../controllers/user.controller.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Hono();

router.get('/roles', authMiddleware, getRoles)
router.get('/', authMiddleware, getUsers)
router.get('/:id', authMiddleware, getUserById)
router.patch('/:id', authMiddleware, updateUser)
router.patch('/:id/role', authMiddleware, updateUserRole)

export default router
