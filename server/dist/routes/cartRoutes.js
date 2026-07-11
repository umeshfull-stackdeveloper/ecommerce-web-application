"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const cartController_1 = require("../controllers/cartController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Guest and User cart operations
router.get('/', cartController_1.getCart);
router.post('/add', cartController_1.addToCart);
router.put('/item/:cartItemId', cartController_1.updateCartItem);
router.delete('/item/:cartItemId', cartController_1.removeCartItem);
// Sync guest cart with user cart after login
router.post('/sync', auth_1.protect, cartController_1.syncCart);
exports.default = router;
