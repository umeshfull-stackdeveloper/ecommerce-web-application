import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    name: z.string().min(2, 'Name is too short'),
    role: z.enum(['CUSTOMER', 'SELLER', 'ADMIN']).optional(),
    companyName: z.string().optional(),
    description: z.string().optional()
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
  })
});

export const productSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().min(10, 'Description must be at least 10 characters'),
    price: z.number().positive('Price must be greater than zero'),
    discountPrice: z.number().nonnegative().optional().nullable(),
    categoryId: z.string().uuid('Invalid Category ID'),
    images: z.array(z.string().url('Invalid image URL')).optional(),
    variants: z.array(
      z.object({
        size: z.string().optional(),
        color: z.string().optional(),
        stock: z.number().int().nonnegative('Stock cannot be negative'),
        sku: z.string().optional()
      })
    ).optional(),
    brand: z.string().optional(),
    color: z.string().optional(),
    badge: z.string().optional(),
    specifications: z.string().optional(),
    features: z.string().optional(),
    flashSaleEnd: z.string().optional().nullable(),
    flashSaleDiscount: z.number().nonnegative().optional().nullable(),
    auctionEnd: z.string().optional().nullable(),
    minBid: z.number().nonnegative().optional().nullable()
  })
});

export const checkoutSchema = z.object({
  body: z.object({
    addressId: z.string().uuid('Invalid Address ID'),
    couponCode: z.string().optional().nullable(),
    shippingCost: z.number().nonnegative().optional(),
    usePoints: z.boolean().optional(),
    paymentMethod: z.enum(['stripe', 'razorpay', 'paypal', 'cod']).optional()
  })
});
