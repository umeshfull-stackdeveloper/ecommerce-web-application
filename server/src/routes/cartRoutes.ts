import { Router } from 'express';
import { 
  getCart, 
  addToCart, 
  updateCartItem, 
  removeCartItem, 
  syncCart 
} from '../controllers/cartController';
import { protect } from '../middleware/auth';

const router = Router();

// Guest and User cart operations
router.get('/', getCart);
router.post('/add', addToCart);
router.put('/item/:cartItemId', updateCartItem);
router.delete('/item/:cartItemId', removeCartItem);

// Sync guest cart with user cart after login
router.post('/sync', protect, syncCart);

export default router;
