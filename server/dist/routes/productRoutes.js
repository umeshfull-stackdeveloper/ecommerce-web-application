"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const productController_1 = require("../controllers/productController");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
// Public routes
router.get('/', productController_1.getProducts);
router.get('/categories', productController_1.getCategories);
router.get('/details/:slug', productController_1.getProductBySlug);
// Seller/Admin protected routes
router.get('/seller', auth_1.protect, (0, auth_1.restrictTo)('SELLER', 'ADMIN'), productController_1.getSellerProducts);
router.post('/', auth_1.protect, auth_1.checkVerified, (0, auth_1.restrictTo)('SELLER', 'ADMIN'), (0, validation_1.validate)(validationSchemas_1.productSchema), productController_1.createProduct);
router.put('/:id', auth_1.protect, auth_1.checkVerified, (0, auth_1.restrictTo)('SELLER', 'ADMIN'), productController_1.updateProduct);
router.delete('/:id', auth_1.protect, auth_1.checkVerified, (0, auth_1.restrictTo)('SELLER', 'ADMIN'), productController_1.deleteProduct);
// Category creation (Admin only)
router.post('/categories', auth_1.protect, auth_1.checkVerified, (0, auth_1.restrictTo)('ADMIN'), productController_1.createCategory);
// Reviews (Customer only)
router.post('/:productId/reviews', auth_1.protect, auth_1.checkVerified, (0, auth_1.restrictTo)('CUSTOMER'), reviewController_1.addReview);
// Bidding (Customer only)
router.post('/:productId/bids', auth_1.protect, auth_1.checkVerified, (0, auth_1.restrictTo)('CUSTOMER'), productController_1.submitBid);
exports.default = router;
