"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const paymentController_1 = require("../controllers/paymentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// Sessions setup
router.post('/create-checkout-session', auth_1.protect, paymentController_1.createCheckoutSession);
router.post('/mock-success/:orderId', paymentController_1.mockPaymentSuccess);
// Stripe Webhook (needs raw body in main app.ts config, but routed here)
router.post('/webhook', paymentController_1.stripeWebhook);
exports.default = router;
