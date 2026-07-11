import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError, catchAsync } from '../utils/errors';

export const getCart = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const guestSessionId = req.query.guestSessionId as string;

  if (!userId && !guestSessionId) {
    return next(new AppError('Authentication details or Guest Session ID required', 400));
  }

  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { guestSessionId },
    include: {
      items: {
        include: {
          product: {
            include: {
              variants: true
            }
          }
        }
      }
    }
  });

  // Create empty cart if it doesn't exist yet
  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { guestSessionId },
      include: {
        items: {
          include: {
            product: {
              include: {
                variants: true
              }
            }
          }
        }
      }
    });
  }

  res.status(200).json({
    status: 'success',
    cart,
  });
});

export const addToCart = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { guestSessionId, productId, selectedSize, selectedColor, quantity = 1 } = req.body;

  if (!userId && !guestSessionId) {
    return next(new AppError('Authentication details or Guest Session ID required', 400));
  }

  // Verify product exists
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: { variants: true }
  });
  if (!product) {
    return next(new AppError('Product not found', 404));
  }

  // Get or Create Cart
  let cart = await prisma.cart.findFirst({
    where: userId ? { userId } : { guestSessionId }
  });
  if (!cart) {
    cart = await prisma.cart.create({
      data: userId ? { userId } : { guestSessionId }
    });
  }

  // Check if item already exists in cart with same configurations
  const existingItem = await prisma.cartItem.findFirst({
    where: {
      cartId: cart.id,
      productId,
      selectedSize: selectedSize || null,
      selectedColor: selectedColor || null,
    }
  });

  if (existingItem) {
    await prisma.cartItem.update({
      where: { id: existingItem.id },
      data: { quantity: existingItem.quantity + quantity }
    });
  } else {
    await prisma.cartItem.create({
      data: {
        cartId: cart.id,
        productId,
        selectedSize: selectedSize || null,
        selectedColor: selectedColor || null,
        quantity
      }
    });
  }

  const updatedCart = await prisma.cart.findUnique({
    where: { id: cart.id },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  res.status(200).json({
    status: 'success',
    cart: updatedCart,
  });
});

export const updateCartItem = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { cartItemId } = req.params;
  const { quantity } = req.body;

  if (quantity < 1) {
    return next(new AppError('Quantity must be at least 1', 400));
  }

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true }
  });

  if (!cartItem) {
    return next(new AppError('Cart item not found', 404));
  }

  // Ensure security (check user ownership if logged in)
  if (req.user && cartItem.cart.userId !== req.user.id) {
    return next(new AppError('You do not have permission to modify this cart item', 403));
  }

  await prisma.cartItem.update({
    where: { id: cartItemId },
    data: { quantity }
  });

  res.status(200).json({
    status: 'success',
    message: 'Cart item updated'
  });
});

export const removeCartItem = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { cartItemId } = req.params;

  const cartItem = await prisma.cartItem.findUnique({
    where: { id: cartItemId },
    include: { cart: true }
  });

  if (!cartItem) {
    return next(new AppError('Cart item not found', 404));
  }

  if (req.user && cartItem.cart.userId !== req.user.id) {
    return next(new AppError('You do not have permission to modify this cart item', 403));
  }

  await prisma.cartItem.delete({ where: { id: cartItemId } });

  res.status(200).json({
    status: 'success',
    message: 'Item removed from cart'
  });
});

export const syncCart = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const userId = req.user?.id;
  const { guestSessionId, localItems, replace = false } = req.body;

  if (!userId) {
    return next(new AppError('User ID is required for sync', 400));
  }

  // Fetch or create user cart
  let userCart = await prisma.cart.findUnique({
    where: { userId }
  });
  if (!userCart) {
    userCart = await prisma.cart.create({ data: { userId } });
  }

  // If localItems are provided, merge or replace them
  if (localItems && Array.isArray(localItems)) {
    await prisma.$transaction(async (tx) => {
      if (replace) {
        // Clear all existing database items for this user cart
        await tx.cartItem.deleteMany({ where: { cartId: userCart!.id } });
      }

      for (const item of localItems) {
        // Validate product exists in DB to prevent stale localStorage IDs from triggering foreign key violations
        const productExists = await tx.product.findUnique({
          where: { id: item.productId }
        });
        if (!productExists) {
          console.warn(`⚠️ Sync Cart: Stale product ID ${item.productId} in localStorage skipped.`);
          continue;
        }

        const existingUserItem = replace ? null : await tx.cartItem.findFirst({
          where: {
            cartId: userCart!.id,
            productId: item.productId,
            selectedSize: item.selectedSize || null,
            selectedColor: item.selectedColor || null
          }
        });

        if (existingUserItem) {
          await tx.cartItem.update({
            where: { id: existingUserItem.id },
            data: { quantity: Math.max(existingUserItem.quantity, item.quantity) }
          });
        } else {
          await tx.cartItem.create({
            data: {
              cartId: userCart!.id,
              productId: item.productId,
              selectedSize: item.selectedSize || null,
              selectedColor: item.selectedColor || null,
              quantity: item.quantity
            }
          });
        }
      }
    });
  } else if (guestSessionId) {
    // Fetch guest cart
    const guestCart = await prisma.cart.findUnique({
      where: { guestSessionId },
      include: { items: true }
    });

    if (guestCart && guestCart.items.length > 0) {
      // Merge items
      await prisma.$transaction(async (tx) => {
        for (const item of guestCart.items) {
          const existingUserItem = await tx.cartItem.findFirst({
            where: {
              cartId: userCart!.id,
              productId: item.productId,
              selectedSize: item.selectedSize || null,
              selectedColor: item.selectedColor || null
            }
          });

          if (existingUserItem) {
            await tx.cartItem.update({
              where: { id: existingUserItem.id },
              data: { quantity: existingUserItem.quantity + item.quantity }
            });
          } else {
            await tx.cartItem.create({
              data: {
                cartId: userCart!.id,
                productId: item.productId,
                selectedSize: item.selectedSize || null,
                selectedColor: item.selectedColor || null,
                quantity: item.quantity
              }
            });
          }
        }

        // Delete guest cart items
        await tx.cartItem.deleteMany({ where: { cartId: guestCart.id } });
        await tx.cart.delete({ where: { id: guestCart.id } });
      });
    }
  }

  const finalCart = await prisma.cart.findUnique({
    where: { id: userCart.id },
    include: {
      items: {
        include: { product: true }
      }
    }
  });

  res.status(200).json({
    status: 'success',
    cart: finalCart
  });
});
