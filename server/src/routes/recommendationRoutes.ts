import { Router } from 'express';
import { getRecommendations, logProductView, getRecentlyViewed } from '../controllers/recommendationController';
import { protect } from '../middleware/auth';

const router = Router();

const optionalProtect = (req: any, res: any, next: any) => {
  if (req.headers.authorization || (req.cookies && req.cookies.accessToken)) {
    return protect(req, res, next);
  }
  next();
};

// Endpoint is optional-protect (works for guest context too)
router.get('/', optionalProtect, getRecommendations);
router.post('/viewed', optionalProtect, logProductView);
router.get('/viewed', optionalProtect, getRecentlyViewed);

export default router;
