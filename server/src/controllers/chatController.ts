import { Request, Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthRequest } from '../middleware/auth';
import { AppError, catchAsync } from '../utils/errors';

export const getChatHistory = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  const { otherUserId } = req.params;
  if (!req.user) return next(new AppError('Unauthorized', 401));

  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: req.user.id, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: req.user.id }
      ]
    },
    orderBy: { createdAt: 'asc' }
  });

  res.status(200).json({
    status: 'success',
    messages
  });
});

export const getConnectedUsers = catchAsync(async (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) return next(new AppError('Unauthorized', 401));

  // Fetch unique users that this user has conversed with
  const messages = await prisma.chatMessage.findMany({
    where: {
      OR: [
        { senderId: req.user.id },
        { receiverId: req.user.id }
      ]
    },
    select: { senderId: true, receiverId: true }
  });

  const ids = new Set<string>();
  messages.forEach((msg) => {
    if (msg.senderId !== req.user!.id) ids.add(msg.senderId);
    if (msg.receiverId !== req.user!.id) ids.add(msg.receiverId);
  });

  const users = await prisma.user.findMany({
    where: { id: { in: Array.from(ids) } },
    select: { id: true, name: true, email: true, role: true }
  });

  res.status(200).json({
    status: 'success',
    users
  });
});
