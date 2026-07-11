"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteCoupon = exports.getCoupons = exports.createCoupon = exports.approveSeller = exports.getSellers = exports.getDashboardStats = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
exports.getDashboardStats = (0, errors_1.catchAsync)(async (req, res, next) => {
    // Aggregate sales & analytics
    const orders = await db_1.default.order.findMany({
        where: { status: { not: 'CANCELLED' } },
        select: { totalAmount: true, createdAt: true, status: true }
    });
    const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);
    const totalOrders = orders.length;
    const totalSellers = await db_1.default.seller.count();
    const totalProducts = await db_1.default.product.count();
    const pendingSellers = await db_1.default.seller.count({ where: { isApproved: false } });
    // Generate simple monthly charts data grouping
    const monthlyData = {};
    orders.forEach((order) => {
        const month = order.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyData[month] = (monthlyData[month] || 0) + order.totalAmount;
    });
    const chartData = Object.entries(monthlyData).map(([name, sales]) => ({
        name,
        sales
    }));
    const topProductsRaw = await db_1.default.orderItem.groupBy({
        by: ['productId'],
        _sum: { quantity: true },
        orderBy: {
            _sum: {
                quantity: 'desc'
            }
        },
        take: 5
    });
    const topProducts = await Promise.all(topProductsRaw.map(async (item) => {
        const product = await db_1.default.product.findUnique({
            where: { id: item.productId },
            select: { name: true, price: true }
        });
        return {
            name: product?.name || 'Unknown Item',
            sales: item._sum.quantity || 0,
            revenue: (item._sum.quantity || 0) * (product?.price || 0)
        };
    }));
    const customersCount = await db_1.default.user.count({ where: { role: 'CUSTOMER' } });
    const sellersCount = await db_1.default.user.count({ where: { role: 'SELLER' } });
    const adminsCount = await db_1.default.user.count({ where: { role: 'ADMIN' } });
    const userSplits = [
        { name: 'Customers', value: customersCount },
        { name: 'Sellers', value: sellersCount },
        { name: 'Admins', value: adminsCount }
    ];
    const categorySharesRaw = await db_1.default.orderItem.findMany({
        where: {
            order: { status: { not: 'CANCELLED' } }
        },
        include: {
            product: {
                include: { category: true }
            }
        }
    });
    const categorySharesMap = {};
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
exports.getSellers = (0, errors_1.catchAsync)(async (req, res, next) => {
    const sellers = await db_1.default.seller.findMany({
        include: {
            user: { select: { name: true, email: true } }
        }
    });
    res.status(200).json({ status: 'success', sellers });
});
exports.approveSeller = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { sellerId } = req.params;
    const seller = await db_1.default.seller.findUnique({ where: { id: sellerId } });
    if (!seller) {
        return next(new errors_1.AppError('Seller profile not found', 404));
    }
    const nextApprovedState = !seller.isApproved;
    const updatedSeller = await db_1.default.seller.update({
        where: { id: sellerId },
        data: { isApproved: nextApprovedState }
    });
    // Automatically update associated user's role to SELLER if approved, otherwise CUSTOMER
    await db_1.default.user.update({
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
exports.createCoupon = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { code, discountType, value, expiryDate, usageLimit, minOrderValue } = req.body;
    const existing = await db_1.default.coupon.findUnique({
        where: { code: code.toUpperCase() }
    });
    if (existing) {
        return next(new errors_1.AppError('Coupon code already exists', 400));
    }
    const coupon = await db_1.default.coupon.create({
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
exports.getCoupons = (0, errors_1.catchAsync)(async (req, res, next) => {
    const coupons = await db_1.default.coupon.findMany({
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', coupons });
});
exports.deleteCoupon = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    await db_1.default.coupon.delete({ where: { id } });
    res.status(204).json({ status: 'success', data: null });
});
