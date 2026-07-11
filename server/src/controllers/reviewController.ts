import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError, catchAsync } from '../utils/errors';

export const addReview = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { productId } = req.params;
  const { rating, comment } = req.body;
  if (!req.user) return next(new AppError('Unauthorized', 401));

  const ratingVal = parseInt(rating);
  if (ratingVal < 1 || ratingVal > 5) {
    return next(new AppError('Rating must be between 1 and 5', 400));
  }

  // 1. Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // 2. Create the review
  const review = await prisma.review.create({
    data: {
      productId,
      userId: req.user.id,
      rating: ratingVal,
      comment,
      isApproved: true, // Default to auto-approved, can be moderated later
    }
  });

  // 3. Re-calculate average ratings for the product
  const reviewsGroup = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true }
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      ratings: reviewsGroup._avg.rating || 0.0
    }
  });

  res.status(201).json({
    status: 'success',
    review
  });
});

export const getReviewsAdmin = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const reviews = await prisma.review.findMany({
    include: {
      product: { select: { name: true } },
      user: { select: { name: true, email: true } }
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({ status: 'success', reviews });
});

export const toggleReviewApproval = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { reviewId } = req.params;

  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review) {
    return next(new AppError('Review not found', 404));
  }

  const updatedReview = await prisma.review.update({
    where: { id: reviewId },
    data: { isApproved: !review.isApproved }
  });

  // Recalculate rating
  const reviewsGroup = await prisma.review.aggregate({
    where: { productId: review.productId, isApproved: true },
    _avg: { rating: true }
  });

  await prisma.product.update({
    where: { id: review.productId },
    data: {
      ratings: reviewsGroup._avg.rating || 0.0
    }
  });

  res.status(200).json({ status: 'success', review: updatedReview });
});
