import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError, catchAsync } from '../utils/errors';

// Helper to generate unique slugs
const generateSlug = (name: string): string => {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '') + '-' + Date.now();
};

export const getProducts = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { category, minPrice, maxPrice, rating, inStock, search, brand, color, sortBy, page = '1', limit = '12' } = req.query;

  const pageNum = parseInt(page as string);
  const limitNum = parseInt(limit as string);
  const skip = (pageNum - 1) * limitNum;

  // Build filter conditions
  const where: any = {};

  if (category) {
    where.category = {
      OR: [
        { slug: category as string },
        { parent: { slug: category as string } } // Handles parent/subcategories
      ]
    };
  }

  if (minPrice || maxPrice) {
    where.price = {};
    if (minPrice) where.price.gte = parseFloat(minPrice as string);
    if (maxPrice) where.price.lte = parseFloat(maxPrice as string);
  }

  if (rating) {
    where.ratings = { gte: parseFloat(rating as string) };
  }

  if (inStock === 'true') {
    where.variants = {
      some: {
        stock: { gt: 0 }
      }
    };
  }

  if (brand) {
    where.brand = { equals: brand as string };
  }

  if (color) {
    where.color = { equals: color as string };
  }

  if (search) {
    where.OR = [
      { name: { contains: search as string } },
      { description: { contains: search as string } }
    ];
  }

  // Sorting
  let orderBy: any = { createdAt: 'desc' }; // default: newest
  if (sortBy === 'price_asc') {
    orderBy = { price: 'asc' };
  } else if (sortBy === 'price_desc') {
    orderBy = { price: 'desc' };
  } else if (sortBy === 'rating') {
    orderBy = { ratings: 'desc' };
  }

  // Query db
  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: limitNum,
      include: {
        category: true,
        variants: true,
        seller: {
          select: { companyName: true, logoUrl: true }
        }
      }
    }),
    prisma.product.count({ where })
  ]);

  res.status(200).json({
    status: 'success',
    results: products.length,
    total,
    pages: Math.ceil(total / limitNum),
    currentPage: pageNum,
    products,
  });
});

export const getProductBySlug = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { slug } = req.params;

  const product = await prisma.product.findUnique({
    where: { slug },
    include: {
      category: true,
      variants: true,
      seller: {
        select: { id: true, companyName: true, description: true, logoUrl: true }
      },
      reviews: {
        where: { isApproved: true },
        include: {
          user: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Calculate aggregate seller ratings and reviews count
  let sellerRating = 5.0;
  let sellerReviewCount = 0;

  if (product.seller) {
    const sellerProducts = await prisma.product.findMany({
      where: { sellerId: product.seller.id },
      select: { id: true }
    });
    const productIds = sellerProducts.map((p) => p.id);

    const ratingsGroup = await prisma.review.aggregate({
      where: {
        productId: { in: productIds },
        isApproved: true
      },
      _avg: { rating: true },
      _count: { id: true }
    });

    if (ratingsGroup._avg.rating !== null) {
      sellerRating = parseFloat(ratingsGroup._avg.rating.toFixed(1));
    }
    sellerReviewCount = ratingsGroup._count.id;
  }

  const enhancedSeller = product.seller
    ? {
        ...product.seller,
        ratings: sellerRating,
        reviewCount: sellerReviewCount
      }
    : null;

  const bids = await prisma.auctionBid.findMany({
    where: { productId: product.id },
    orderBy: { bidAmount: 'desc' },
    take: 10
  });

  const bidsWithUsers = await Promise.all(
    bids.map(async (bid) => {
      const user = await prisma.user.findUnique({
        where: { id: bid.userId },
        select: { name: true }
      });
      return {
        ...bid,
        userName: user ? user.name : 'Anonymous'
      };
    })
  );

  res.status(200).json({
    status: 'success',
    product: {
      ...product,
      seller: enhancedSeller,
      bids: bidsWithUsers
    },
  });
});

export const createProduct = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { 
    name, description, price, discountPrice, categoryId, images, variants,
    brand, color, badge, specifications, features, flashSaleEnd, flashSaleDiscount, auctionEnd, minBid
  } = req.body;

  if (!req.user) return next(new AppError('Not authenticated', 401));

  const seller = await prisma.seller.findUnique({ where: { userId: req.user.id } });
  if (!seller) {
    return next(new AppError('Seller profile not found. Cannot create product.', 404));
  }

  // Create products and variants in transaction
  const newProduct = await prisma.$transaction(async (tx) => {
    const slug = generateSlug(name);
    
    // Check if category exists
    const categoryExists = await tx.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) {
      throw new AppError('Specified category does not exist', 400);
    }

    const product = await tx.product.create({
      data: {
        sellerId: seller.id,
        categoryId,
        name,
        slug,
        description,
        price: parseFloat(price),
        discountPrice: discountPrice ? parseFloat(discountPrice) : null,
        images: JSON.stringify(images || []),
        brand: brand || 'Generic',
        color: color || 'Default',
        badge: badge || 'New',
        specifications: specifications || '{}',
        features: features || '[]',
        flashSaleEnd: flashSaleEnd ? new Date(flashSaleEnd) : null,
        flashSaleDiscount: flashSaleDiscount ? parseFloat(flashSaleDiscount) : null,
        auctionEnd: auctionEnd ? new Date(auctionEnd) : null,
        minBid: minBid ? parseFloat(minBid) : null,
      }
    });

    if (variants && Array.isArray(variants)) {
      for (const variant of variants) {
        await tx.productVariant.create({
          data: {
            productId: product.id,
            size: variant.size || null,
            color: variant.color || null,
            stock: parseInt(variant.stock || '0'),
            sku: variant.sku || `${product.id.substring(0, 5)}-${Math.random().toString(36).substr(2, 5)}`
          }
        });
      }
    }

    return product;
  });

  const completeProduct = await prisma.product.findUnique({
    where: { id: newProduct.id },
    include: { variants: true }
  });

  res.status(201).json({
    status: 'success',
    product: completeProduct,
  });
});

export const updateProduct = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;
  const { 
    name, description, price, discountPrice, categoryId, images, variants,
    brand, color, badge, specifications, features, flashSaleEnd, flashSaleDiscount, auctionEnd, minBid
  } = req.body;

  if (!req.user) return next(new AppError('Not authenticated', 401));

  const seller = await prisma.seller.findUnique({ where: { userId: req.user.id } });
  if (!seller) {
    return next(new AppError('Seller profile not found.', 404));
  }

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    return next(new AppError('Product not found', 404));
  }

  // Ensure seller owns the product or user is Admin
  if (existingProduct.sellerId !== seller.id && req.user.role !== 'ADMIN') {
    return next(new AppError('You do not have permission to update this product', 403));
  }

  const updatedProduct = await prisma.$transaction(async (tx) => {
    const data: any = {};
    if (name) {
      data.name = name;
      data.slug = generateSlug(name);
    }
    if (description) data.description = description;
    if (price) data.price = parseFloat(price);
    if (discountPrice !== undefined) data.discountPrice = discountPrice ? parseFloat(discountPrice) : null;
    if (categoryId) data.categoryId = categoryId;
    if (images) data.images = JSON.stringify(images);
    if (brand !== undefined) data.brand = brand;
    if (color !== undefined) data.color = color;
    if (badge !== undefined) data.badge = badge;
    if (specifications !== undefined) data.specifications = specifications;
    if (features !== undefined) data.features = features;
    if (flashSaleEnd !== undefined) data.flashSaleEnd = flashSaleEnd ? new Date(flashSaleEnd) : null;
    if (flashSaleDiscount !== undefined) data.flashSaleDiscount = flashSaleDiscount ? parseFloat(flashSaleDiscount) : null;
    if (auctionEnd !== undefined) data.auctionEnd = auctionEnd ? new Date(auctionEnd) : null;
    if (minBid !== undefined) data.minBid = minBid ? parseFloat(minBid) : null;

    const product = await tx.product.update({
      where: { id },
      data,
    });

    if (variants && Array.isArray(variants)) {
      // Re-initialize variants: simple strategy is to delete old and insert new, or sync them.
      // For this implementation, we will delete the old variants and re-create them.
      await tx.productVariant.deleteMany({ where: { productId: id } });
      for (const variant of variants) {
        await tx.productVariant.create({
          data: {
            productId: id,
            size: variant.size || null,
            color: variant.color || null,
            stock: parseInt(variant.stock || '0'),
            sku: variant.sku || `${product.id.substring(0, 5)}-${Math.random().toString(36).substr(2, 5)}`
          }
        });
      }
    }

    return product;
  });

  const completeProduct = await prisma.product.findUnique({
    where: { id: updatedProduct.id },
    include: { variants: true }
  });

  res.status(200).json({
    status: 'success',
    product: completeProduct,
  });
});

export const deleteProduct = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { id } = req.params;

  if (!req.user) return next(new AppError('Not authenticated', 401));

  const existingProduct = await prisma.product.findUnique({ where: { id } });
  if (!existingProduct) {
    return next(new AppError('Product not found', 404));
  }

  if (req.user.role !== 'ADMIN') {
    const seller = await prisma.seller.findUnique({ where: { userId: req.user.id } });
    if (!seller || existingProduct.sellerId !== seller.id) {
      return next(new AppError('You do not have permission to delete this product', 403));
    }
  }

  await prisma.product.delete({ where: { id } });

  res.status(204).json({
    status: 'success',
    data: null,
  });
});

// Categories logic
export const getCategories = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const categories = await prisma.category.findMany({
    where: { parentId: null }, // Fetch root categories
    include: {
      subcategories: true
    }
  });

  res.status(200).json({
    status: 'success',
    categories,
  });
});

export const createCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { name, parentId } = req.body;
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  const category = await prisma.category.create({
    data: {
      name,
      slug,
      parentId: parentId || null
    }
  });

  res.status(201).json({
    status: 'success',
    category,
  });
});

export const getSellerProducts = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const seller = await prisma.seller.findUnique({ where: { userId: req.user.id } });
  if (!seller) {
    return next(new AppError('Seller profile not found. Cannot retrieve products.', 404));
  }

  const products = await prisma.product.findMany({
    where: { sellerId: seller.id },
    include: {
      category: true,
      variants: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.status(200).json({
    status: 'success',
    products
  });
});

export const submitBid = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { productId } = req.params;
  const { bidAmount } = req.body;
  if (!req.user) return next(new AppError('Not authenticated', 401));

  const amount = parseFloat(bidAmount);
  if (isNaN(amount) || amount <= 0) {
    return next(new AppError('Please enter a valid bid amount', 400));
  }

  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      bids: {
        orderBy: { bidAmount: 'desc' },
        take: 1
      }
    }
  });

  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  if (!product.auctionEnd || !product.minBid) {
    return next(new AppError('This product is not set up for auction', 400));
  }

  if (new Date(product.auctionEnd) < new Date()) {
    return next(new AppError('The auction for this product has already ended', 400));
  }

  if (amount < product.minBid) {
    return next(new AppError(`Bid amount must be at least $${product.minBid}`, 400));
  }

  const highestBid = product.bids[0];
  if (highestBid && amount <= highestBid.bidAmount) {
    return next(new AppError(`Bid amount must be higher than current highest bid of $${highestBid.bidAmount}`, 400));
  }

  // Create new bid
  const bid = await prisma.auctionBid.create({
    data: {
      productId,
      userId: req.user.id,
      bidAmount: amount
    }
  });

  res.status(201).json({
    status: 'success',
    message: 'Bid submitted successfully!',
    bid
  });
});
