import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError, catchAsync } from '../utils/errors';

export const getRecommendations = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { productId } = req.query;
  const limit = 4;

  let related: any[] = [];
  let frequentlyBought: any[] = [];
  let personalized: any[] = [];

  // 1. RELATED PRODUCTS (Same Category, excluding current)
  if (productId && typeof productId === 'string') {
    const activeProduct = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, brand: true }
    });

    if (activeProduct) {
      // First try same category and brand
      related = await prisma.product.findMany({
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
        const extraRelated = await prisma.product.findMany({
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
  } else {
    // If no productId, related defaults to top-rated items
    related = await prisma.product.findMany({
      take: limit,
      orderBy: { ratings: 'desc' },
      include: { variants: true }
    });
  }

  // 2. FREQUENTLY BOUGHT TOGETHER (Co-purchased in orders)
  if (productId && typeof productId === 'string') {
    const ordersWithProduct = await prisma.orderItem.findMany({
      where: { productId },
      select: { orderId: true }
    });
    const orderIds = ordersWithProduct.map(o => o.orderId);

    if (orderIds.length > 0) {
      const coPurchasedItems = await prisma.orderItem.findMany({
        where: {
          orderId: { in: orderIds },
          productId: { not: productId }
        },
        select: { productId: true },
        take: 20
      });

      const freqMap: { [key: string]: number } = {};
      coPurchasedItems.forEach(item => {
        freqMap[item.productId] = (freqMap[item.productId] || 0) + 1;
      });

      const sortedIds = Object.keys(freqMap).sort((a, b) => freqMap[b] - freqMap[a]);

      if (sortedIds.length > 0) {
        frequentlyBought = await prisma.product.findMany({
          where: { id: { in: sortedIds.slice(0, limit) } },
          include: { variants: true }
        });
      }
    }

    // Fallback: items from the same seller
    if (frequentlyBought.length < limit) {
      const activeProduct = await prisma.product.findUnique({
        where: { id: productId },
        select: { sellerId: true }
      });
      if (activeProduct) {
        const sellerItems = await prisma.product.findMany({
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
    const topSellers = await prisma.product.findMany({
      where: { id: { notIn: excluded } },
      take: limit - frequentlyBought.length,
      orderBy: { ratings: 'desc' },
      include: { variants: true }
    });
    frequentlyBought = [...frequentlyBought, ...topSellers];
  }

  // 3. PERSONALIZED RECOMMENDATIONS (Based on user's RecentlyViewed categories/affinity)
  if (userId) {
    const recentViews = await prisma.recentlyViewed.findMany({
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
      personalized = await prisma.product.findMany({
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
    const cart = await prisma.cart.findUnique({
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

      const cartRecs = await prisma.product.findMany({
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

    const trending = await prisma.product.findMany({
      where: { id: { notIn: excluded } },
      take: limit - personalized.length,
      orderBy: { createdAt: 'desc' },
      include: { variants: true }
    });
    personalized = [...personalized, ...trending];
  }

  // Combine unique ones for backward compatibility
  const allUniqueProducts = Array.from(
    new Map(
      [...related, ...frequentlyBought, ...personalized].map(item => [item.id, item])
    ).values()
  );

  res.status(200).json({
    status: 'success',
    related,
    frequentlyBought,
    personalized,
    products: allUniqueProducts.slice(0, 6) // fallback list
  });
});

export const logProductView = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { productId } = req.body;
  const userId = req.user?.id;

  if (!productId) {
    return next(new AppError('Product ID is required', 400));
  }

  if (userId) {
    const existing = await prisma.recentlyViewed.findFirst({
      where: { userId, productId }
    });

    if (!existing) {
      await prisma.recentlyViewed.create({
        data: { userId, productId }
      });

      const count = await prisma.recentlyViewed.count({ where: { userId } });
      if (count > 10) {
        const oldest = await prisma.recentlyViewed.findFirst({
          where: { userId },
          orderBy: { createdAt: 'asc' }
        });
        if (oldest) {
          await prisma.recentlyViewed.delete({ where: { id: oldest.id } });
        }
      }
    } else {
      await prisma.recentlyViewed.update({
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

export const getRecentlyViewed = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(200).json({
      status: 'success',
      products: []
    });
  }

  const views = await prisma.recentlyViewed.findMany({
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
