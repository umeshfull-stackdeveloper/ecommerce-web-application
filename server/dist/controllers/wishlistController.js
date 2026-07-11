"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toggleWishlistItem = exports.getWishlist = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
exports.getWishlist = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    let wishlist = await db_1.default.wishlist.findUnique({
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
        wishlist = await db_1.default.wishlist.create({
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
exports.toggleWishlistItem = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { productId } = req.body;
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    let wishlist = await db_1.default.wishlist.findUnique({
        where: { userId: req.user.id }
    });
    if (!wishlist) {
        wishlist = await db_1.default.wishlist.create({
            data: { userId: req.user.id }
        });
    }
    const existingItem = await db_1.default.wishlistItem.findFirst({
        where: {
            wishlistId: wishlist.id,
            productId,
        }
    });
    if (existingItem) {
        // Remove from wishlist
        await db_1.default.wishlistItem.delete({
            where: { id: existingItem.id }
        });
        return res.status(200).json({
            status: 'success',
            added: false,
            message: 'Item removed from wishlist'
        });
    }
    else {
        // Add to wishlist
        await db_1.default.wishlistItem.create({
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
