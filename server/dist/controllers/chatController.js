"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConnectedUsers = exports.getChatHistory = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
exports.getChatHistory = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { otherUserId } = req.params;
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    const messages = await db_1.default.chatMessage.findMany({
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
exports.getConnectedUsers = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('Unauthorized', 401));
    // Fetch unique users that this user has conversed with
    const messages = await db_1.default.chatMessage.findMany({
        where: {
            OR: [
                { senderId: req.user.id },
                { receiverId: req.user.id }
            ]
        },
        select: { senderId: true, receiverId: true }
    });
    const ids = new Set();
    messages.forEach((msg) => {
        if (msg.senderId !== req.user.id)
            ids.add(msg.senderId);
        if (msg.receiverId !== req.user.id)
            ids.add(msg.receiverId);
    });
    const users = await db_1.default.user.findMany({
        where: { id: { in: Array.from(ids) } },
        select: { id: true, name: true, email: true, role: true }
    });
    res.status(200).json({
        status: 'success',
        users
    });
});
