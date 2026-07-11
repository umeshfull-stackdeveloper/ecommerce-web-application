"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleAssistantMessage = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
exports.handleAssistantMessage = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { message } = req.body;
    const userId = req.user?.id;
    if (!message || typeof message !== 'string') {
        return res.status(400).json({
            status: 'error',
            message: 'Message content is required'
        });
    }
    const text = message.toLowerCase().trim();
    let reply = '';
    let products = [];
    let orders = [];
    let suggestions = [];
    // 1. FAQ - Return Policy
    if (text.includes('return') || text.includes('refund') || text.includes('policy')) {
        reply = "Our return policy allows items to be returned or replaced within 7 days of delivery. Once the return request is verified, a refund will be processed within 5-7 business days.";
        suggestions = ["Track my orders", "Show trending products", "Shipping options"];
    }
    // 2. FAQ - Shipping
    else if (text.includes('shipping') || text.includes('delivery') || text.includes('deliver') || text.includes('time')) {
        reply = "We offer standard shipping (3-5 business days) and expedited shipping (1-2 business days). Shipping is free for orders over ₹499 (a flat delivery fee of ₹99 applies below this)! Tracking details will be generated as soon as your order is packaged.";
        suggestions = ["Track my orders", "Payment methods"];
    }
    // 3. FAQ - Payments
    else if (text.includes('payment') || text.includes('pay') || text.includes('stripe') || text.includes('paypal')) {
        reply = "We support multiple secure payment gateways, including credit cards via Stripe, Razorpay, PayPal, and Cash on Delivery (COD) for qualified locations.";
        suggestions = ["Browse products", "Return policy"];
    }
    // 4. Order Tracking
    else if (text.includes('order') || text.includes('track') || text.includes('status')) {
        if (!userId) {
            reply = "Please log in to track your orders securely. If you have an order number, you can sign in and go to your dashboard to view active updates.";
            suggestions = ["Log in / Sign up", "Shipping info"];
        }
        else {
            const userOrders = await db_1.default.order.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 3,
                include: {
                    items: {
                        include: { product: true }
                    }
                }
            });
            if (userOrders.length === 0) {
                reply = "It looks like you haven't placed any orders yet. Ready to start shopping?";
                suggestions = ["Show trending products", "Browse catalog"];
            }
            else {
                reply = `I found ${userOrders.length} recent order(s) for you. Here is the latest status:`;
                orders = userOrders.map(o => ({
                    id: o.id,
                    status: o.status,
                    totalAmount: o.totalAmount,
                    trackingStatus: o.trackingStatus,
                    createdAt: o.createdAt,
                    items: o.items.map(i => i.product.name).join(', ')
                }));
                suggestions = ["Refund options", "Talk to support"];
            }
        }
    }
    // 5. Product Recommendations
    else if (text.includes('recommend') || text.includes('suggest') || text.includes('popular') || text.includes('trending') || text.includes('best seller')) {
        reply = "Here are some of our highly-rated trending products on the marketplace right now:";
        products = await db_1.default.product.findMany({
            take: 4,
            orderBy: { ratings: 'desc' },
            include: { category: true }
        });
        suggestions = ["Under ₹1,000", "Filter by brand", "Order status"];
    }
    // 6. Generic Product Search / Database query
    else {
        // Attempt to extract keyword search
        const cleanQuery = text.replace(/find|show|me|search|buy|for/g, '').trim();
        if (cleanQuery.length > 1) {
            const matchedProducts = await db_1.default.product.findMany({
                where: {
                    OR: [
                        { name: { contains: cleanQuery } },
                        { description: { contains: cleanQuery } },
                        { brand: { contains: cleanQuery } }
                    ]
                },
                take: 4,
                include: { category: true }
            });
            if (matchedProducts.length > 0) {
                reply = `I found these products matching "${cleanQuery}" on our platform:`;
                products = matchedProducts;
                suggestions = ["Show trending products", "Track my order"];
            }
            else {
                reply = `I couldn't find any specific products matching "${cleanQuery}". Try looking up general categories like "Electronics", "Clothing", or "Home Decor".`;
                suggestions = ["Show trending products", "Shipping options", "Return policy"];
            }
        }
        else {
            reply = "Hi! I am NEXUS AI, your personalized shopping assistant. You can ask me to search for products, check order status, or help you with returns and shipping details. How can I help you today?";
            suggestions = ["Show trending products", "Track my order", "Return policy"];
        }
    }
    res.status(200).json({
        status: 'success',
        reply,
        products,
        orders,
        suggestions
    });
});
