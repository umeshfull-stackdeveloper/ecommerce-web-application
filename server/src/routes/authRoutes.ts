import { Router } from 'express';
import { 
  register, 
  login, 
  refreshToken, 
  verifyEmail, 
  forgotPassword, 
  resetPassword, 
  getMe,
  setup2FA,
  verify2FA,
  disable2FA,
  login2FA,
  oauthLogin
} from '../controllers/authController';
import { validate } from '../middleware/validation';
import { registerSchema, loginSchema } from '../utils/validationSchemas';
import { protect } from '../middleware/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.post('/refresh-token', refreshToken);
router.get('/verify-email', verifyEmail);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);

// 2FA & OAuth Routes
router.post('/oauth-login', oauthLogin);
router.post('/2fa/setup', protect, setup2FA);
router.post('/2fa/verify', protect, verify2FA);
router.post('/2fa/disable', protect, disable2FA);
router.post('/2fa/login', login2FA);

export default router;
