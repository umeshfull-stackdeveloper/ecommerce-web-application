"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleReviewApproval = exports.getReviewsAdmin = exports.addReview = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
exports.addReview = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { productId } = req.params;
    const { rating, comment } = req.body;
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    const ratingVal = parseInt(rating);
    if (ratingVal < 1 || ratingVal > 5) {
        return next(new errors_1.AppError('Rating must be between 1 and 5', 400));
    }
    // 1. Verify product exists
    const product = await db_1.default.product.findUnique({ where: { id: productId } });
    if (!product) {
        return next(new errors_1.AppError('Product not found', 404));
    }
    // 2. Create the review
    const review = await db_1.default.review.create({
        data: {
            productId,
            userId: req.user.id,
            rating: ratingVal,
            comment,
            isApproved: true, // Default to auto-approved, can be moderated later
        }
    });
    // 3. Re-calculate average ratings for the product
    const reviewsGroup = await db_1.default.review.aggregate({
        where: { productId, isApproved: true },
        _avg: { rating: true }
    });
    await db_1.default.product.update({
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
exports.getReviewsAdmin = (0, errors_1.catchAsync)(async (req, res, next) => {
    const reviews = await db_1.default.review.findMany({
        include: {
            product: { select: { name: true } },
            user: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', reviews });
});
exports.toggleReviewApproval = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { reviewId } = req.params;
    const review = await db_1.default.review.findUnique({ where: { id: reviewId } });
    if (!review) {
        return next(new errors_1.AppError('Review not found', 404));
    }
    const updatedReview = await db_1.default.review.update({
        where: { id: reviewId },
        data: { isApproved: !review.isApproved }
    });
    // Recalculate rating
    const reviewsGroup = await db_1.default.review.aggregate({
        where: { productId: review.productId, isApproved: true },
        _avg: { rating: true }
    });
    await db_1.default.product.update({
        where: { id: review.productId },
        data: {
            ratings: reviewsGroup._avg.rating || 0.0
        }
    });
    res.status(200).json({ status: 'success', review: updatedReview });
});
