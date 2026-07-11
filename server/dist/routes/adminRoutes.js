"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("../controllers/adminController");
const reviewController_1 = require("../controllers/reviewController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Secure admin portal
router.use(auth_1.protect);
router.use((0, auth_1.restrictTo)('ADMIN'));
router.get('/stats', adminController_1.getDashboardStats);
router.get('/sellers', adminController_1.getSellers);
router.patch('/sellers/:sellerId/approve', adminController_1.approveSeller);
// Coupons management
router.get('/coupons', adminController_1.getCoupons);
router.post('/coupons', adminController_1.createCoupon);
router.delete('/coupons/:id', adminController_1.deleteCoupon);
// Review moderation
router.get('/reviews', reviewController_1.getReviewsAdmin);
router.patch('/reviews/:reviewId/toggle-approval', reviewController_1.toggleReviewApproval);
exports.default = router;
