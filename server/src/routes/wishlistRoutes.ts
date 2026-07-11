import { Router } from 'express';
import { getWishlist, toggleWishlistItem } from '../controllers/wishlistController';
import { protect } from '../middleware/auth';

const router = Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlistItem);

export default router;
