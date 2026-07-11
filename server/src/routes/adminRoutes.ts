import { Router } from 'express';
import { 
  getDashboardStats, 
  getSellers, 
  approveSeller, 
  createCoupon, 
  getCoupons, 
  deleteCoupon 
} from '../controllers/adminController';
import { toggleReviewApproval, getReviewsAdmin } from '../controllers/reviewController';
import { protect, restrictTo } from '../middleware/auth';

const router = Router();

// Secure admin portal
router.use(protect);
router.use(restrictTo('ADMIN'));

router.get('/stats', getDashboardStats);
router.get('/sellers', getSellers);
router.patch('/sellers/:sellerId/approve', approveSeller);

// Coupons management
router.get('/coupons', getCoupons);
router.post('/coupons', createCoupon);
router.delete('/coupons/:id', deleteCoupon);

// Review moderation
router.get('/reviews', getReviewsAdmin);
router.patch('/reviews/:reviewId/toggle-approval', toggleReviewApproval);

export default router;
