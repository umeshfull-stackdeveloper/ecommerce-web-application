import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { catchAsync, AppError } from '../utils/errors';

export const getDashboardStats = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  // Aggregate sales & analytics
  const orders = await prisma.order.findMany({
    where: { status: { not: 'CANCELLED' } },
    select: { totalAmount: true, createdAt: true, status: true }
  });

  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalOrders = orders.length;

  const totalSellers = await prisma.seller.count();
  const totalProducts = await prisma.product.count();
  const pendingSellers = await prisma.seller.count({ where: { isApproved: false } });

  // Generate simple monthly charts data grouping
  const monthlyData: { [key: string]: number } = {};
  orders.forEach((order) => {
    const month = order.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
    monthlyData[month] = (monthlyData[month] || 0) + order.totalAmount;
  });

  const chartData = Object.entries(monthlyData).map(([name, sales]) => ({
    name,
    sales
  }));

  const topProductsRaw = await prisma.orderItem.groupBy({
    by: ['productId'],
    _sum: { quantity: true },
    orderBy: {
      _sum: {
        quantity: 'desc'
      }
    },
    take: 5
  });


  const topProducts = await Promise.all(
    topProductsRaw.map(async (item) => {
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        select: { name: true, price: true }
      });
      return {
        name: product?.name || 'Unknown Item',
        sales: item._sum.quantity || 0,
        revenue: (item._sum.quantity || 0) * (product?.price || 0)
      };
    })
  );

  const customersCount = await prisma.user.count({ where: { role: 'CUSTOMER' } });
  const sellersCount = await prisma.user.count({ where: { role: 'SELLER' } });
  const adminsCount = await prisma.user.count({ where: { role: 'ADMIN' } });
  const userSplits = [
    { name: 'Customers', value: customersCount },
    { name: 'Sellers', value: sellersCount },
    { name: 'Admins', value: adminsCount }
  ];

  const categorySharesRaw = await prisma.orderItem.findMany({
    where: {
      order: { status: { not: 'CANCELLED' } }
    },
    include: {
      product: {
        include: { category: true }
      }
    }
  });

  const categorySharesMap: { [key: string]: number } = {};
  categorySharesRaw.forEach(item => {
    if (item.product && item.product.category) {
      const catName = item.product.category.name;
      const sales = item.priceAtBuy * item.quantity;
      categorySharesMap[catName] = (categorySharesMap[catName] || 0) + sales;
    }
  });

  const categoryData = Object.entries(categorySharesMap).map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(2))
  }));

  res.status(200).json({
    status: 'success',
    stats: {
      totalRevenue,
      totalOrders,
      totalSellers,
      totalProducts,
      pendingSellers,
      chartData,
      topProducts,
      userSplits,
      categoryData
    }
  });
});

export const getSellers = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const sellers = await prisma.seller.findMany({
    include: {
      user: { select: { name: true, email: true } }
    }
  });

  res.status(200).json({ status: 'success', sellers });
});

export const approveSeller = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { sellerId } = req.params;

  const seller = await prisma.seller.findUnique({ where: { id: sellerId } });
  if (!seller) {
    return next(new AppError('Seller profile not found', 404));
  }

  const nextApprovedState = !seller.isApproved;

  const updatedSeller = await prisma.seller.update({
    where: { id: sellerId },
    data: { isApproved: nextApprovedState }
  });

  // Automatically update associated user's role to SELLER if approved, otherwise CUSTOMER
  await prisma.user.update({
    where: { id: seller.userId },
    data: { role: nextApprovedState ? 'SELLER' : 'CUSTOMER' }
  });

  res.status(200).json({
    status: 'success',
    message: `Seller profile ${nextApprovedState ? 'approved' : 'suspended'} successfully`,
    seller: updatedSeller
  });
});

// Coupon administration
export const createCoupon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { code, discountType, value, expiryDate, usageLimit, minOrderValue } = req.body;

  const existing = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existing) {
    return next(new AppError('Coupon code already exists', 400));
  }

  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      discountType,
      value: parseFloat(value),
      expiryDate: new Date(expiryDate),
      usageLimit: parseInt(usageLimit || '100'),
      minOrderValue: parseFloat(minOrderValue || '0.0')
    }
  });

  res.status(201).json({ status: 'success', coupon });
});

export const getCoupons = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: 'desc' }
  });
  res.status(200).json({ status: 'success', coupons });
});

export const deleteCoupon = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
  const { id } = req.params;
  await prisma.coupon.delete({ where: { id } });
  res.status(204).json({ status: 'success', data: null });
});
