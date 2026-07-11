"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkoutSchema = exports.productSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        name: zod_1.z.string().min(2, 'Name is too short'),
        role: zod_1.z.enum(['CUSTOMER', 'SELLER', 'ADMIN']).optional(),
        companyName: zod_1.z.string().optional(),
        description: zod_1.z.string().optional()
    })
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required')
    })
});
exports.productSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
        description: zod_1.z.string().min(10, 'Description must be at least 10 characters'),
        price: zod_1.z.number().positive('Price must be greater than zero'),
        discountPrice: zod_1.z.number().nonnegative().optional().nullable(),
        categoryId: zod_1.z.string().uuid('Invalid Category ID'),
        images: zod_1.z.array(zod_1.z.string().url('Invalid image URL')).optional(),
        variants: zod_1.z.array(zod_1.z.object({
            size: zod_1.z.string().optional(),
            color: zod_1.z.string().optional(),
            stock: zod_1.z.number().int().nonnegative('Stock cannot be negative'),
            sku: zod_1.z.string().optional()
        })).optional(),
        brand: zod_1.z.string().optional(),
        color: zod_1.z.string().optional(),
        badge: zod_1.z.string().optional(),
        specifications: zod_1.z.string().optional(),
        features: zod_1.z.string().optional(),
        flashSaleEnd: zod_1.z.string().optional().nullable(),
        flashSaleDiscount: zod_1.z.number().nonnegative().optional().nullable(),
        auctionEnd: zod_1.z.string().optional().nullable(),
        minBid: zod_1.z.number().nonnegative().optional().nullable()
    })
});
exports.checkoutSchema = zod_1.z.object({
    body: zod_1.z.object({
        addressId: zod_1.z.string().uuid('Invalid Address ID'),
        couponCode: zod_1.z.string().optional().nullable(),
        shippingCost: zod_1.z.number().nonnegative().optional(),
        usePoints: zod_1.z.boolean().optional(),
        paymentMethod: zod_1.z.enum(['stripe', 'razorpay', 'paypal', 'cod']).optional()
    })
});
