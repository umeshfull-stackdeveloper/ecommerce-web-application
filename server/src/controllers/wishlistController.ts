import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError, catchAsync } from '../utils/errors';

export const getWishlist = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Unauthorized', 401));

  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: req.user.id },
    include: {
      items: {
        include: {
          product: {
            include: { variants: true }
          }
        }
      }
    }
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: req.user.id },
      include: {
        items: {
          include: {
            product: {
              include: { variants: true }
            }
          }
        }
      }
    });
  }


  res.status(200).json({
    status: 'success',
    wishlist,
  });
});

export const toggleWishlistItem = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { productId } = req.body;
  if (!req.user) return next(new AppError('Unauthorized', 401));

  let wishlist = await prisma.wishlist.findUnique({
    where: { userId: req.user.id }
  });

  if (!wishlist) {
    wishlist = await prisma.wishlist.create({
      data: { userId: req.user.id }
    });
  }

  const existingItem = await prisma.wishlistItem.findFirst({
    where: {
      wishlistId: wishlist.id,
      productId,
    }
  });

  if (existingItem) {
    // Remove from wishlist
    await prisma.wishlistItem.delete({
      where: { id: existingItem.id }
    });
    return res.status(200).json({
      status: 'success',
      added: false,
      message: 'Item removed from wishlist'
    });
  } else {
    // Add to wishlist
    await prisma.wishlistItem.create({
      data: {
        wishlistId: wishlist.id,
        productId,
      }
    });
    return res.status(200).json({
      status: 'success',
      added: true,
      message: 'Item added to wishlist'
    });
  }
});
