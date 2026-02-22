import { Hono } from 'hono';
import { getRooms, createRoom, joinRoom, leaveRoom, getRoomMembers, getRoomMessages, sendMessage, closeRoom, openRoom, deleteRoom } from '../controllers/room.controller.ts';
import { authMiddleware } from '../middleware/auth.ts';

const router = new Hono();

router.get('/', authMiddleware, getRooms)
router.post('/', authMiddleware, createRoom)
router.post('/:id/join', authMiddleware, joinRoom)
router.post('/:id/leave', authMiddleware, leaveRoom)
router.get('/:id/members', authMiddleware, getRoomMembers)
router.get('/:id/messages', authMiddleware, getRoomMessages)
router.post('/:id/messages', authMiddleware, sendMessage)
router.patch('/:id/close', authMiddleware, closeRoom)
router.patch('/:id/open', authMiddleware, openRoom)
router.delete('/:id', authMiddleware, deleteRoom)

export default router
