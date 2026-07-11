import { Router } from 'express';
import { getChatHistory, getConnectedUsers } from '../controllers/chatController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/users', getConnectedUsers);
router.get('/history/:otherUserId', getChatHistory);

export default router;
