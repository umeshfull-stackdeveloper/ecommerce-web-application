"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecentlyViewed = exports.logProductView = exports.getRecommendations = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
exports.getRecommendations = (0, errors_1.catchAsync)(async (req, res, next) => {
    const userId = req.user?.id;
    const { productId } = req.query;
    const limit = 4;
    let related = [];
    let frequentlyBought = [];
    let personalized = [];
    // 1. RELATED PRODUCTS (Same Category, excluding current)
    if (productId && typeof productId === 'string') {
        const activeProduct = await db_1.default.product.findUnique({
            where: { id: productId },
            select: { categoryId: true, brand: true }
        });
        if (activeProduct) {
            // First try same category and brand
            related = await db_1.default.product.findMany({
                where: {
                    categoryId: activeProduct.categoryId,
                    brand: activeProduct.brand || undefined,
                    id: { not: productId }
                },
                take: limit,
                orderBy: { ratings: 'desc' },
                include: { variants: true }
            });
            // If not enough, fill with same category
            if (related.length < limit) {
                const extraRelated = await db_1.default.product.findMany({
                    where: {
                        categoryId: activeProduct.categoryId,
                        id: { notIn: [productId, ...related.map(p => p.id)] }
                    },
                    take: limit - related.length,
                    orderBy: { ratings: 'desc' },
                    include: { variants: true }
                });
                related = [...related, ...extraRelated];
            }
        }
    }
    else {
        // If no productId, related defaults to top-rated items
        related = await db_1.default.product.findMany({
            take: limit,
            orderBy: { ratings: 'desc' },
            include: { variants: true }
        });
    }
    // 2. FREQUENTLY BOUGHT TOGETHER (Co-purchased in orders)
    if (productId && typeof productId === 'string') {
        const ordersWithProduct = await db_1.default.orderItem.findMany({
            where: { productId },
            select: { orderId: true }
        });
        const orderIds = ordersWithProduct.map(o => o.orderId);
        if (orderIds.length > 0) {
            const coPurchasedItems = await db_1.default.orderItem.findMany({
                where: {
                    orderId: { in: orderIds },
                    productId: { not: productId }
                },
                select: { productId: true },
                take: 20
            });
            const freqMap = {};
            coPurchasedItems.forEach(item => {
                freqMap[item.productId] = (freqMap[item.productId] || 0) + 1;
            });
            const sortedIds = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);
            if (sortedIds.length > 0) {
                frequentlyBought = await db_1.default.product.findMany({
                    where: { id: { in: sortedIds.slice(0, limit) } },
                    include: { variants: true }
                });
            }
        }
        // Fallback: items from the same seller
        if (frequentlyBought.length < limit) {
            const activeProduct = await db_1.default.product.findUnique({
                where: { id: productId },
                select: { sellerId: true }
            });
            if (activeProduct) {
                const sellerItems = await db_1.default.product.findMany({
                    where: {
                        sellerId: activeProduct.sellerId,
                        id: { notIn: [productId, ...frequentlyBought.map(p => p.id)] }
                    },
                    take: limit - frequentlyBought.length,
                    orderBy: { ratings: 'desc' },
                    include: { variants: true }
                });
                frequentlyBought = [...frequentlyBought, ...sellerItems];
            }
        }
    }
    // If frequentlyBought is still empty or small, fallback to general best sellers
    if (frequentlyBought.length < limit) {
        const excluded = [
            ...(productId && typeof productId === 'string' ? [productId] : []),
            ...frequentlyBought.map(p => p.id)
        ];
        const topSellers = await db_1.default.product.findMany({
            where: { id: { notIn: excluded } },
            take: limit - frequentlyBought.length,
            orderBy: { ratings: 'desc' },
            include: { variants: true }
        });
        frequentlyBought = [...frequentlyBought, ...topSellers];
    }
    // 3. PERSONALIZED RECOMMENDATIONS (Based on user's RecentlyViewed categories/affinity)
    if (userId) {
        const recentViews = await db_1.default.recentlyViewed.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: 5,
            include: { product: true }
        });
        if (recentViews.length > 0) {
            const viewedCategoryIds = Array.from(new Set(recentViews.map(v => v.product.categoryId)));
            const viewedProductIds = recentViews.map(v => v.productId);
            const excluded = [
                ...(productId && typeof productId === 'string' ? [productId] : []),
                ...viewedProductIds
            ];
            // Recommend products in the categories user recently viewed
            personalized = await db_1.default.product.findMany({
                where: {
                    categoryId: { in: viewedCategoryIds },
                    id: { notIn: excluded }
                },
                take: limit,
                orderBy: { ratings: 'desc' },
                include: { variants: true }
            });
        }
    }
    // Fallback for personalization: based on user's wishlist or cart categories
    if (personalized.length < limit && userId) {
        const cart = await db_1.default.cart.findUnique({
            where: { userId },
            include: { items: { include: { product: true } } }
        });
        if (cart && cart.items.length > 0) {
            const cartCategoryIds = cart.items.map(i => i.product.categoryId);
            const cartProductIds = cart.items.map(i => i.productId);
            const excluded = [
                ...(productId && typeof productId === 'string' ? [productId] : []),
                ...cartProductIds,
                ...personalized.map(p => p.id)
            ];
            const cartRecs = await db_1.default.product.findMany({
                where: {
                    categoryId: { in: cartCategoryIds },
                    id: { notIn: excluded }
                },
                take: limit - personalized.length,
                orderBy: { ratings: 'desc' },
                include: { variants: true }
            });
            personalized = [...personalized, ...cartRecs];
        }
    }
    // Global fallback for personalization: featured/new items
    if (personalized.length < limit) {
        const excluded = [
            ...(productId && typeof productId === 'string' ? [productId] : []),
            ...related.map(p => p.id),
            ...frequentlyBought.map(p => p.id),
            ...personalized.map(p => p.id)
        ];
        const trending = await db_1.default.product.findMany({
            where: { id: { notIn: excluded } },
            take: limit - personalized.length,
            orderBy: { createdAt: 'desc' },
            include: { variants: true }
        });
        personalized = [...personalized, ...trending];
    }
    // Combine unique ones for backward compatibility
    const allUniqueProducts = Array.from(new Map([...related, ...frequentlyBought, ...personalized].map(item => [item.id, item])).values());
    res.status(200).json({
        status: 'success',
        related,
        frequentlyBought,
        personalized,
        products: allUniqueProducts.slice(0, 6) // fallback list
    });
});
exports.logProductView = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { productId } = req.body;
    const userId = req.user?.id;
    if (!productId) {
        return next(new errors_1.AppError('Product ID is required', 400));
    }
    if (userId) {
        const existing = await db_1.default.recentlyViewed.findFirst({
            where: { userId, productId }
        });
        if (!existing) {
            await db_1.default.recentlyViewed.create({
                data: { userId, productId }
            });
            const count = await db_1.default.recentlyViewed.count({ where: { userId } });
            if (count > 10) {
                const oldest = await db_1.default.recentlyViewed.findFirst({
                    where: { userId },
                    orderBy: { createdAt: 'asc' }
                });
                if (oldest) {
                    await db_1.default.recentlyViewed.delete({ where: { id: oldest.id } });
                }
            }
        }
        else {
            await db_1.default.recentlyViewed.update({
                where: { id: existing.id },
                data: { createdAt: new Date() }
            });
        }
    }
    res.status(200).json({
        status: 'success',
        message: 'Product view logged'
    });
});
exports.getRecentlyViewed = (0, errors_1.catchAsync)(async (req, res, next) => {
    const userId = req.user?.id;
    if (!userId) {
        return res.status(200).json({
            status: 'success',
            products: []
        });
    }
    const views = await db_1.default.recentlyViewed.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
            product: {
                include: {
                    category: true,
                    variants: true
                }
            }
        }
    });
    const products = views.map((v) => v.product);
    res.status(200).json({
        status: 'success',
        results: products.length,
        products
    });
});
