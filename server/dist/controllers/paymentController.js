"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.stripeWebhook = exports.mockPaymentSuccess = exports.createCheckoutSession = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const invoiceService_1 = require("../services/invoiceService");
const emailService_1 = require("../services/emailService");
// We import Stripe conditionally to avoid crashes if Stripe secret is empty or missing
let stripe = null;
const STRIPE_SECRET = process.env.STRIPE_SECRET_KEY;
if (STRIPE_SECRET) {
    try {
        const Stripe = require('stripe');
        stripe = new Stripe(STRIPE_SECRET);
        console.log('💳 Stripe API: Initialized using secret key');
    }
    catch (error) {
        console.warn('💳 Stripe API initialization failed. Falling back to Mock Payment system.');
    }
}
exports.createCheckoutSession = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { orderId, gateway } = req.body;
    const order = await db_1.default.order.findUnique({
        where: { id: orderId },
        include: {
            user: { select: { email: true, name: true } },
            items: { include: { product: true } }
        }
    });
    if (!order) {
        return next(new errors_1.AppError('Order not found', 404));
    }
    // 1. If Stripe is configured and selected, create checkout session
    if (stripe && gateway === 'stripe') {
        try {
            const lineItems = order.items.map((item) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.product.name,
                    },
                    unit_amount: Math.round(item.priceAtBuy * 100), // in cents
                },
                quantity: item.quantity,
            }));
            // Add tax & shipping cost as line items
            if (order.shippingCost > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Shipping Cost' },
                        unit_amount: Math.round(order.shippingCost * 100),
                    },
                    quantity: 1
                });
            }
            if (order.taxAmount > 0) {
                lineItems.push({
                    price_data: {
                        currency: 'usd',
                        product_data: { name: 'Estimated Tax' },
                        unit_amount: Math.round(order.taxAmount * 100),
                    },
                    quantity: 1
                });
            }
            const session = await stripe.checkout.sessions.create({
                payment_method_types: ['card'],
                line_items: lineItems,
                mode: 'payment',
                success_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-success?orderId=${order.id}`,
                cancel_url: `${process.env.CLIENT_URL || 'http://localhost:5173'}/order-failed?orderId=${order.id}`,
                customer_email: order.user.email,
                metadata: { orderId: order.id }
            });
            return res.status(200).json({
                status: 'success',
                url: session.url,
                isMock: false
            });
        }
        catch (err) {
            console.error('Stripe Session creation failed:', err);
            // Fall through to Mock Payment
        }
    }
    // 2. Fallback Mock Payment Session URL
    console.log(`💳 Payments: Falling back to Mock Payment checkout for Order ${orderId}`);
    const mockUrl = `/payment/mock-checkout?orderId=${order.id}&amount=${order.totalAmount}`;
    res.status(200).json({
        status: 'success',
        url: mockUrl,
        isMock: true
    });
});
// Mock payment trigger to finalize orders without actual Stripe webhooks
exports.mockPaymentSuccess = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { orderId } = req.params;
    const transactionId = `MOCK-TX-${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const order = await db_1.default.order.findUnique({
        where: { id: orderId },
        include: { user: true }
    });
    if (!order) {
        return next(new errors_1.AppError('Order not found', 404));
    }
    // Update order status to CONFIRMED
    const updatedOrder = await db_1.default.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' }
    });
    // Update payment status
    await db_1.default.payment.update({
        where: { orderId },
        data: {
            status: 'COMPLETED',
            transactionId,
            method: 'mock_sandbox'
        }
    });
    // Trigger PDF invoice and email alert
    try {
        await invoiceService_1.invoiceService.generateInvoicePdf(order.id);
        await emailService_1.emailService.sendOrderConfirmationEmail(order.user.email, order.user.name, order.id, order.totalAmount);
    }
    catch (err) {
        console.error('Post-payment services execution failed:', err);
    }
    res.status(200).json({
        status: 'success',
        message: 'Mock payment captured successfully',
        order: updatedOrder
    });
});
// Webhook listener for production Stripe integrations
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    if (!stripe || !sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return res.status(400).send('Webhook configuration error');
    }
    try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error(`Webhook signature verification failed:`, err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata.orderId;
        const transactionId = session.payment_intent;
        try {
            const order = await db_1.default.order.findUnique({
                where: { id: orderId },
                include: { user: true }
            });
            if (order) {
                // Set order to CONFIRMED
                await db_1.default.order.update({
                    where: { id: orderId },
                    data: { status: 'CONFIRMED' }
                });
                // Set payment to COMPLETED
                await db_1.default.payment.update({
                    where: { orderId },
                    data: {
                        status: 'COMPLETED',
                        transactionId,
                        method: 'stripe'
                    }
                });
                // Build invoice & dispatch notification
                await invoiceService_1.invoiceService.generateInvoicePdf(order.id);
                await emailService_1.emailService.sendOrderConfirmationEmail(order.user.email, order.user.name, order.id, order.totalAmount);
            }
        }
        catch (error) {
            console.error('Error handling checkout.session.completed webhook:', error);
            return res.status(500).json({ received: false });
        }
    }
    res.status(200).json({ received: true });
};
exports.stripeWebhook = stripeWebhook;
