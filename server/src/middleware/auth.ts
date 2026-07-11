import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../utils/errors';
import prisma from '../config/db';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_12345';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_12345';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    isVerified: boolean;
  };
}

export const generateTokens = (user: { id: string; email: string; role: string; isVerified: boolean }) => {
  const accessToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
    ACCESS_SECRET,
    { expiresIn: '1h' }
  );

  const refreshToken = jwt.sign(
    { id: user.id, email: user.email, role: user.role, isVerified: user.isVerified },
    REFRESH_SECRET,
    { expiresIn: '7d' }
  );

  return { accessToken, refreshToken };
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, ACCESS_SECRET) as AuthRequest['user'];
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, REFRESH_SECRET) as AuthRequest['user'];
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token = '';
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next(new AppError('You are not logged in. Please log in to get access.', 401));
    }

    // Verify token
    try {
      const decoded = verifyAccessToken(token);
      if (!decoded) {
        return next(new AppError('Invalid token. Please log in again.', 401));
      }

      // Check if user still exists in database
      const user = await prisma.user.findUnique({ where: { id: decoded.id } });
      if (!user) {
        return next(new AppError('The user belonging to this token no longer exists.', 401));
      }

      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
      };
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return next(new AppError('Your token has expired. Please refresh your token.', 401));
      }
      return next(new AppError('Invalid token. Please log in again.', 401));
    }
  } catch (error) {
    next(error);
  }
};

export const restrictTo = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Authentication context missing.', 401));
    }
    if (!roles.includes(req.user.role)) {
      return next(new AppError('You do not have permission to perform this action', 403));
    }
    next();
  };
};

export const checkVerified = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && !req.user.isVerified) {
    return next(new AppError('Your email address is not verified. Please verify your email.', 403));
  }
  next();
};
