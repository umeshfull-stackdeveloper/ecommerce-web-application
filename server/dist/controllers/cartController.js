"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.syncCart = exports.removeCartItem = exports.updateCartItem = exports.addToCart = exports.getCart = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
exports.getCart = (0, errors_1.catchAsync)(async (req, res, next) => {
    const userId = req.user?.id;
    const guestSessionId = req.query.guestSessionId;
    if (!userId && !guestSessionId) {
        return next(new errors_1.AppError('Authentication details or Guest Session ID required', 400));
    }
    let cart = await db_1.default.cart.findFirst({
        where: userId ? { userId } : { guestSessionId },
        include: {
            items: {
                include: {
                    product: {
                        include: {
                            variants: true
                        }
                    }
                }
            }
        }
    });
    // Create empty cart if it doesn't exist yet
    if (!cart) {
        cart = await db_1.default.cart.create({
            data: userId ? { userId } : { guestSessionId },
            include: {
                items: {
                    include: {
                        product: {
                            include: {
                                variants: true
                            }
                        }
                    }
                }
            }
        });
    }
    res.status(200).json({
        status: 'success',
        cart,
    });
});
exports.addToCart = (0, errors_1.catchAsync)(async (req, res, next) => {
    const userId = req.user?.id;
    const { guestSessionId, productId, selectedSize, selectedColor, quantity = 1 } = req.body;
    if (!userId && !guestSessionId) {
        return next(new errors_1.AppError('Authentication details or Guest Session ID required', 400));
    }
    // Verify product exists
    const product = await db_1.default.product.findUnique({
        where: { id: productId },
        include: { variants: true }
    });
    if (!product) {
        return next(new errors_1.AppError('Product not found', 404));
    }
    // Get or Create Cart
    let cart = await db_1.default.cart.findFirst({
        where: userId ? { userId } : { guestSessionId }
    });
    if (!cart) {
        cart = await db_1.default.cart.create({
            data: userId ? { userId } : { guestSessionId }
        });
    }
    // Check if item already exists in cart with same configurations
    const existingItem = await db_1.default.cartItem.findFirst({
        where: {
            cartId: cart.id,
            productId,
            selectedSize: selectedSize || null,
            selectedColor: selectedColor || null,
        }
    });
    if (existingItem) {
        await db_1.default.cartItem.update({
            where: { id: existingItem.id },
            data: { quantity: existingItem.quantity + quantity }
        });
    }
    else {
        await db_1.default.cartItem.create({
            data: {
                cartId: cart.id,
                productId,
                selectedSize: selectedSize || null,
                selectedColor: selectedColor || null,
                quantity
            }
        });
    }
    const updatedCart = await db_1.default.cart.findUnique({
        where: { id: cart.id },
        include: {
            items: {
                include: { product: true }
            }
        }
    });
    res.status(200).json({
        status: 'success',
        cart: updatedCart,
    });
});
exports.updateCartItem = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { cartItemId } = req.params;
    const { quantity } = req.body;
    if (quantity < 1) {
        return next(new errors_1.AppError('Quantity must be at least 1', 400));
    }
    const cartItem = await db_1.default.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true }
    });
    if (!cartItem) {
        return next(new errors_1.AppError('Cart item not found', 404));
    }
    // Ensure security (check user ownership if logged in)
    if (req.user && cartItem.cart.userId !== req.user.id) {
        return next(new errors_1.AppError('You do not have permission to modify this cart item', 403));
    }
    await db_1.default.cartItem.update({
        where: { id: cartItemId },
        data: { quantity }
    });
    res.status(200).json({
        status: 'success',
        message: 'Cart item updated'
    });
});
exports.removeCartItem = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { cartItemId } = req.params;
    const cartItem = await db_1.default.cartItem.findUnique({
        where: { id: cartItemId },
        include: { cart: true }
    });
    if (!cartItem) {
        return next(new errors_1.AppError('Cart item not found', 404));
    }
    if (req.user && cartItem.cart.userId !== req.user.id) {
        return next(new errors_1.AppError('You do not have permission to modify this cart item', 403));
    }
    await db_1.default.cartItem.delete({ where: { id: cartItemId } });
    res.status(200).json({
        status: 'success',
        message: 'Item removed from cart'
    });
});
exports.syncCart = (0, errors_1.catchAsync)(async (req, res, next) => {
    const userId = req.user?.id;
    const { guestSessionId, localItems, replace = false } = req.body;
    if (!userId) {
        return next(new errors_1.AppError('User ID is required for sync', 400));
    }
    // Fetch or create user cart
    let userCart = await db_1.default.cart.findUnique({
        where: { userId }
    });
    if (!userCart) {
        userCart = await db_1.default.cart.create({ data: { userId } });
    }
    // If localItems are provided, merge or replace them
    if (localItems && Array.isArray(localItems)) {
        await db_1.default.$transaction(async (tx) => {
            if (replace) {
                // Clear all existing database items for this user cart
                await tx.cartItem.deleteMany({ where: { cartId: userCart.id } });
            }
            for (const item of localItems) {
                // Validate product exists in DB to prevent stale localStorage IDs from triggering foreign key violations
                const productExists = await tx.product.findUnique({
                    where: { id: item.productId }
                });
                if (!productExists) {
                    console.warn(`⚠️ Sync Cart: Stale product ID ${item.productId} in localStorage skipped.`);
                    continue;
                }
                const existingUserItem = replace ? null : await tx.cartItem.findFirst({
                    where: {
                        cartId: userCart.id,
                        productId: item.productId,
                        selectedSize: item.selectedSize || null,
                        selectedColor: item.selectedColor || null
                    }
                });
                if (existingUserItem) {
                    await tx.cartItem.update({
                        where: { id: existingUserItem.id },
                        data: { quantity: Math.max(existingUserItem.quantity, item.quantity) }
                    });
                }
                else {
                    await tx.cartItem.create({
                        data: {
                            cartId: userCart.id,
                            productId: item.productId,
                            selectedSize: item.selectedSize || null,
                            selectedColor: item.selectedColor || null,
                            quantity: item.quantity
                        }
                    });
                }
            }
        });
    }
    else if (guestSessionId) {
        // Fetch guest cart
        const guestCart = await db_1.default.cart.findUnique({
            where: { guestSessionId },
            include: { items: true }
        });
        if (guestCart && guestCart.items.length > 0) {
            // Merge items
            await db_1.default.$transaction(async (tx) => {
                for (const item of guestCart.items) {
                    const existingUserItem = await tx.cartItem.findFirst({
                        where: {
                            cartId: userCart.id,
                            productId: item.productId,
                            selectedSize: item.selectedSize || null,
                            selectedColor: item.selectedColor || null
                        }
                    });
                    if (existingUserItem) {
                        await tx.cartItem.update({
                            where: { id: existingUserItem.id },
                            data: { quantity: existingUserItem.quantity + item.quantity }
                        });
                    }
                    else {
                        await tx.cartItem.create({
                            data: {
                                cartId: userCart.id,
                                productId: item.productId,
                                selectedSize: item.selectedSize || null,
                                selectedColor: item.selectedColor || null,
                                quantity: item.quantity
                            }
                        });
                    }
                }
                // Delete guest cart items
                await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
                await tx.cart.delete({ where: { id: guestCart.id } });
            });
        }
    }
    const finalCart = await db_1.default.cart.findUnique({
        where: { id: userCart.id },
        include: {
            items: {
                include: { product: true }
            }
        }
    });
    res.status(200).json({
        status: 'success',
        cart: finalCart
    });
});
