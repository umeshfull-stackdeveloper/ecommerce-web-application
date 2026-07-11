import { Router } from 'express';
import { 
  createCheckoutSession, 
  mockPaymentSuccess, 
  stripeWebhook 
} from '../controllers/paymentController';
import { protect } from '../middleware/auth';

const router = Router();

// Sessions setup
router.post('/create-checkout-session', protect, createCheckoutSession);
router.post('/mock-success/:orderId', mockPaymentSuccess);

// Stripe Webhook (needs raw body in main app.ts config, but routed here)
router.post('/webhook', stripeWebhook);

export default router;
