"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const orderController_1 = require("../controllers/orderController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
// Address management
router.get('/addresses', auth_1.protect, orderController_1.getAddresses);
router.post('/addresses', auth_1.protect, orderController_1.addAddress);
// Coupon check (Public/Customer)
router.post('/coupons/validate', orderController_1.validateCoupon);
// Orders workflow (Customer & Seller stats)
router.post('/', auth_1.protect, (0, validation_1.validate)(validationSchemas_1.checkoutSchema), orderController_1.createOrder);
router.get('/my-orders', auth_1.protect, orderController_1.getMyOrders);
router.get('/seller/stats', auth_1.protect, (0, auth_1.restrictTo)('SELLER', 'ADMIN'), orderController_1.getSellerStats);
router.get('/:id', auth_1.protect, orderController_1.getOrderDetails);
router.get('/:id/invoice', auth_1.protect, orderController_1.downloadInvoice);
// Status administration (Seller / Admin)
router.patch('/:id/status', auth_1.protect, (0, auth_1.restrictTo)('SELLER', 'ADMIN'), orderController_1.updateOrderStatus);
exports.default = router;
