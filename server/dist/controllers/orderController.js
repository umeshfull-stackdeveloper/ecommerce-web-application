"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.downloadInvoice = exports.getSellerStats = exports.updateOrderStatus = exports.getOrderDetails = exports.getMyOrders = exports.createOrder = exports.validateCoupon = exports.addAddress = exports.getAddresses = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const invoiceService_1 = require("../services/invoiceService");
const emailService_1 = require("../services/emailService");
const path_1 = __importDefault(require("path"));
const chatSocket_1 = require("../socket/chatSocket");
// Address controllers
exports.getAddresses = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    const addresses = await db_1.default.address.findMany({
        where: { userId: req.user.id }
    });
    res.status(200).json({ status: 'success', addresses });
});
exports.addAddress = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { street, city, state, postalCode, country, phone, isDefault } = req.body;
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    if (isDefault) {
        // Set all other user addresses to not default
        await db_1.default.address.updateMany({
            where: { userId: req.user.id },
            data: { isDefault: false }
        });
    }
    const address = await db_1.default.address.create({
        data: {
            userId: req.user.id,
            street,
            city,
            state,
            postalCode,
            country,
            phone,
            isDefault: isDefault || false
        }
    });
    res.status(201).json({ status: 'success', address });
});
// Coupon controllers
exports.validateCoupon = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { code, orderValue } = req.body;
    const coupon = await db_1.default.coupon.findUnique({
        where: { code: code.toUpperCase() }
    });
    if (!coupon) {
        return next(new errors_1.AppError('Invalid coupon code', 400));
    }
    if (new Date(coupon.expiryDate) < new Date()) {
        return next(new errors_1.AppError('Coupon has expired', 400));
    }
    if (coupon.usedCount >= coupon.usageLimit) {
        return next(new errors_1.AppError('Coupon usage limit reached', 400));
    }
    if (parseFloat(orderValue) < coupon.minOrderValue) {
        return next(new errors_1.AppError(`Minimum order value of $${coupon.minOrderValue} required for this coupon`, 400));
    }
    res.status(200).json({
        status: 'success',
        coupon
    });
});
// Order creation workflow
exports.createOrder = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { addressId, couponCode, shippingCost = 5.0, paymentMethod = 'cod', usePoints = false } = req.body;
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    // 1. Get user cart items
    const cart = await db_1.default.cart.findUnique({
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
    if (!cart || cart.items.length === 0) {
        return next(new errors_1.AppError('Your cart is empty', 400));
    }
    // 2. Validate inventory availability & calculate price
    let subtotal = 0;
    for (const item of cart.items) {
        const matchingVariant = item.product.variants.find((v) => v.size === item.selectedSize && v.color === item.selectedColor);
        if (!matchingVariant || matchingVariant.stock < item.quantity) {
            return next(new errors_1.AppError(`Insufficient stock for product ${item.product.name}`, 400));
        }
        const itemPrice = item.product.discountPrice || item.product.price;
        subtotal += itemPrice * item.quantity;
    }
    // 3. Tax calculation (flat 8%)
    const taxAmount = parseFloat((subtotal * 0.08).toFixed(2));
    // 4. Coupon discount validation
    let discountAmount = 0;
    let couponId = null;
    if (couponCode) {
        const coupon = await db_1.default.coupon.findUnique({
            where: { code: couponCode.toUpperCase() }
        });
        if (coupon && new Date(coupon.expiryDate) > new Date() && coupon.usedCount < coupon.usageLimit && subtotal >= coupon.minOrderValue) {
            couponId = coupon.id;
            if (coupon.discountType === 'PERCENTAGE') {
                discountAmount = parseFloat(((subtotal * coupon.value) / 100).toFixed(2));
            }
            else {
                discountAmount = coupon.value;
            }
            // Deduct discount from total
            discountAmount = Math.min(discountAmount, subtotal);
        }
    }
    // 4b. Loyalty Points validation
    const dbUser = await db_1.default.user.findUnique({
        where: { id: req.user.id }
    });
    if (!dbUser)
        return next(new errors_1.AppError('User not found', 404));
    let pointsUsed = 0;
    let pointsDiscount = 0;
    if (usePoints && dbUser.points > 0) {
        const maxDiscountAllowed = parseFloat((subtotal + taxAmount + shippingCost - discountAmount).toFixed(2));
        const potentialDiscount = dbUser.points * 0.10; // 1 point = $0.10
        if (potentialDiscount >= maxDiscountAllowed) {
            pointsDiscount = maxDiscountAllowed;
            pointsUsed = Math.ceil(maxDiscountAllowed / 0.10);
        }
        else {
            pointsDiscount = parseFloat(potentialDiscount.toFixed(2));
            pointsUsed = dbUser.points;
        }
    }
    const commissionAmount = parseFloat((subtotal * 0.10).toFixed(2));
    const totalAmount = parseFloat((subtotal + taxAmount + shippingCost - discountAmount - pointsDiscount).toFixed(2));
    const finalDiscountAmount = parseFloat((discountAmount + pointsDiscount).toFixed(2));
    // Earn 1 point per $1 spent on final total
    const pointsEarned = Math.floor(totalAmount);
    // 5. Create Order database records & adjust inventory in a transaction
    const order = await db_1.default.$transaction(async (tx) => {
        // Decrement variant stock
        for (const item of cart.items) {
            const matchingVariant = item.product.variants.find((v) => v.size === item.selectedSize && v.color === item.selectedColor);
            await tx.productVariant.update({
                where: { id: matchingVariant.id },
                data: { stock: { decrement: item.quantity } }
            });
        }
        // Update user points
        const pointsChange = pointsEarned - pointsUsed;
        await tx.user.update({
            where: { id: req.user.id },
            data: {
                points: {
                    increment: pointsChange
                }
            }
        });
        // Create Order
        const newOrder = await tx.order.create({
            data: {
                userId: req.user.id,
                status: 'PENDING',
                totalAmount,
                taxAmount,
                discountAmount: finalDiscountAmount,
                shippingCost,
                commissionAmount,
                paymentMethod,
                addressId,
                couponId,
            }
        });
        // Create OrderItems
        for (const item of cart.items) {
            await tx.orderItem.create({
                data: {
                    orderId: newOrder.id,
                    productId: item.productId,
                    selectedSize: item.selectedSize,
                    selectedColor: item.selectedColor,
                    quantity: item.quantity,
                    priceAtBuy: item.product.discountPrice || item.product.price
                }
            });
        }
        // Update coupon usages
        if (couponId) {
            await tx.coupon.update({
                where: { id: couponId },
                data: { usedCount: { increment: 1 } }
            });
        }
        // Clear cart items
        await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
        // Initialize pending payment
        await tx.payment.create({
            data: {
                orderId: newOrder.id,
                status: 'PENDING',
                method: paymentMethod,
                amount: totalAmount
            }
        });
        return newOrder;
    });
    // Broadcast stock changes in real-time
    try {
        for (const item of cart.items) {
            const matchingVariant = item.product.variants.find((v) => v.size === item.selectedSize && v.color === item.selectedColor);
            if (matchingVariant) {
                (0, chatSocket_1.broadcastInventoryUpdate)(item.productId, matchingVariant.id, matchingVariant.stock - item.quantity);
            }
        }
    }
    catch (err) {
        console.error('Failed to broadcast inventory updates:', err);
    }
    res.status(201).json({
        status: 'success',
        order,
    });
});
exports.getMyOrders = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    const orders = await db_1.default.order.findMany({
        where: { userId: req.user.id },
        include: {
            items: { include: { product: true } },
            payment: true,
            invoice: true
        },
        orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ status: 'success', orders });
});
exports.getOrderDetails = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    const order = await db_1.default.order.findUnique({
        where: { id },
        include: {
            items: { include: { product: true } },
            payment: true,
            invoice: true,
            user: { select: { name: true, email: true } }
        }
    });
    if (!order) {
        return next(new errors_1.AppError('Order not found', 404));
    }
    // Ensure security
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SELLER') {
        return next(new errors_1.AppError('You are not authorized to view this order', 403));
    }
    res.status(200).json({ status: 'success', order });
});
exports.updateOrderStatus = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body; // OrderStatus types
    const order = await db_1.default.order.findUnique({
        where: { id },
        include: { user: { select: { email: true, name: true } } }
    });
    if (!order) {
        return next(new errors_1.AppError('Order not found', 404));
    }
    const updatedOrder = await db_1.default.order.update({
        where: { id },
        data: { status },
        include: { payment: true }
    });
    // Actions upon confirmation or shipment
    if (status === 'CONFIRMED') {
        // Generate Invoice PDF
        try {
            await invoiceService_1.invoiceService.generateInvoicePdf(order.id);
            await emailService_1.emailService.sendOrderConfirmationEmail(order.user.email, order.user.name, order.id, order.totalAmount);
            // Update Payment status to COMPLETED if confirmed
            await db_1.default.payment.update({
                where: { orderId: order.id },
                data: { status: 'COMPLETED' }
            });
        }
        catch (err) {
            console.error('Invoice PDF or Email confirmation failed to generate:', err);
        }
    }
    else if (['SHIPPED', 'DELIVERED', 'CANCELLED'].includes(status)) {
        try {
            await emailService_1.emailService.sendShippingUpdateEmail(order.user.email, order.user.name, order.id, status);
        }
        catch (err) {
            console.error('Shipping update email failed:', err);
        }
    }
    res.status(200).json({
        status: 'success',
        order: updatedOrder
    });
});
exports.getSellerStats = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    const seller = await db_1.default.seller.findUnique({ where: { userId: req.user.id } });
    if (!seller) {
        return next(new errors_1.AppError('Seller profile not found', 404));
    }
    // Get all orders containing this seller's products
    const orderItems = await db_1.default.orderItem.findMany({
        where: {
            product: { sellerId: seller.id },
            order: { status: { not: 'CANCELLED' } }
        },
        include: {
            product: true,
            order: true
        }
    });
    let grossRevenue = 0;
    let totalUnitsSold = 0;
    const monthlyEarnings = {};
    orderItems.forEach(item => {
        const amount = item.priceAtBuy * item.quantity;
        grossRevenue += amount;
        totalUnitsSold += item.quantity;
        const month = item.order.createdAt.toLocaleString('default', { month: 'short', year: '2-digit' });
        monthlyEarnings[month] = (monthlyEarnings[month] || 0) + amount;
    });
    const platformCommission = parseFloat((grossRevenue * 0.10).toFixed(2));
    const netEarnings = parseFloat((grossRevenue - platformCommission).toFixed(2));
    const chartData = Object.entries(monthlyEarnings).map(([name, sales]) => ({
        name,
        sales
    }));
    // Low stock inventory tracking
    const products = await db_1.default.product.findMany({
        where: { sellerId: seller.id },
        include: { variants: true }
    });
    const lowStockItems = products.map(p => {
        const totalStock = p.variants.reduce((sum, v) => sum + v.stock, 0);
        return {
            id: p.id,
            name: p.name,
            stock: totalStock
        };
    }).filter(p => p.stock <= 5);
    res.status(200).json({
        status: 'success',
        stats: {
            grossRevenue,
            platformCommission,
            netEarnings,
            totalUnitsSold,
            chartData,
            lowStockItems
        }
    });
});
exports.downloadInvoice = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { id } = req.params;
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    const order = await db_1.default.order.findUnique({
        where: { id },
        include: { invoice: true }
    });
    if (!order) {
        return next(new errors_1.AppError('Order not found', 404));
    }
    // Ensure security
    if (order.userId !== req.user.id && req.user.role !== 'ADMIN' && req.user.role !== 'SELLER') {
        return next(new errors_1.AppError('You are not authorized to access this invoice', 403));
    }
    let pdfPath = order.invoice?.pdfPath;
    if (!pdfPath) {
        pdfPath = await invoiceService_1.invoiceService.generateInvoicePdf(order.id);
    }
    const filePath = path_1.default.join(__dirname, '..', '..', 'public', pdfPath);
    res.download(filePath, `invoice-${order.id.slice(0, 8)}.pdf`);
});
