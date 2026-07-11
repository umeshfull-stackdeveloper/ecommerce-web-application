import { Router } from 'express';
import { handleAssistantMessage } from '../controllers/assistantController';
import { protect } from '../middleware/auth';

const router = Router();

const optionalProtect = (req: any, res: any, next: any) => {
  if (req.headers.authorization || (req.cookies && req.cookies.accessToken)) {
    return protect(req, res, next);
  }
  next();
};

router.post('/', optionalProtect, handleAssistantMessage);

export default router;
