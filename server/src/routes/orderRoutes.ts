import { Router } from 'express';
import { 
  getAddresses, 
  addAddress, 
  validateCoupon, 
  createOrder, 
  getMyOrders, 
  getOrderDetails, 
  updateOrderStatus,
  getSellerStats,
  downloadInvoice
} from '../controllers/orderController';
import { protect, restrictTo, checkVerified } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { checkoutSchema } from '../utils/validationSchemas';

const router = Router();

// Address management
router.get('/addresses', protect, getAddresses);
router.post('/addresses', protect, addAddress);

// Coupon check (Public/Customer)
router.post('/coupons/validate', validateCoupon);

// Orders workflow (Customer & Seller stats)
router.post('/', protect, validate(checkoutSchema), createOrder);
router.get('/my-orders', protect, getMyOrders);
router.get('/seller/stats', protect, restrictTo('SELLER', 'ADMIN'), getSellerStats);
router.get('/:id', protect, getOrderDetails);
router.get('/:id/invoice', protect, downloadInvoice);

// Status administration (Seller / Admin)
router.patch('/:id/status', protect, restrictTo('SELLER', 'ADMIN'), updateOrderStatus);

export default router;
