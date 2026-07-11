import { Router } from 'express';
import { 
  getProducts, 
  getProductBySlug, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  getCategories, 
  createCategory,
  getSellerProducts,
  submitBid
} from '../controllers/productController';
import { addReview } from '../controllers/reviewController';
import { protect, restrictTo, checkVerified } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { productSchema } from '../utils/validationSchemas';

const router = Router();

// Public routes
router.get('/', getProducts);
router.get('/categories', getCategories);
router.get('/details/:slug', getProductBySlug);

// Seller/Admin protected routes
router.get('/seller', protect, restrictTo('SELLER', 'ADMIN'), getSellerProducts);
router.post('/', protect, checkVerified, restrictTo('SELLER', 'ADMIN'), validate(productSchema), createProduct);
router.put('/:id', protect, checkVerified, restrictTo('SELLER', 'ADMIN'), updateProduct);
router.delete('/:id', protect, checkVerified, restrictTo('SELLER', 'ADMIN'), deleteProduct);

// Category creation (Admin only)
router.post('/categories', protect, checkVerified, restrictTo('ADMIN'), createCategory);

// Reviews (Customer only)
router.post('/:productId/reviews', protect, checkVerified, restrictTo('CUSTOMER'), addReview);

// Bidding (Customer only)
router.post('/:productId/bids', protect, checkVerified, restrictTo('CUSTOMER'), submitBid);

export default router;
