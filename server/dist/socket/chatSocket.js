"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupChatSocket = exports.broadcastInventoryUpdate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_12345';
// Map to store online users: userId -> socketId
const onlineUsers = new Map();
let ioInstance = null;
const broadcastInventoryUpdate = (productId, variantId, stock) => {
    if (ioInstance) {
        ioInstance.emit('inventory_update', { productId, variantId, stock });
        console.log(`📡 Broadcasted Inventory Update: Product ${productId}, Variant ${variantId}, Stock ${stock}`);
    }
};
exports.broadcastInventoryUpdate = broadcastInventoryUpdate;
const setupChatSocket = (io) => {
    ioInstance = io;
    io.use((socket, next) => {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            return next(new Error('Authentication error: Token missing'));
        }
        try {
            const decoded = jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
            socket.userId = decoded.id;
            socket.userRole = decoded.role;
            next();
        }
        catch (err) {
            return next(new Error('Authentication error: Invalid Token'));
        }
    });
    io.on('connection', (socket) => {
        const userId = socket.userId;
        onlineUsers.set(userId, socket.id);
        console.log(`🔌 Socket Connected: User ${userId} (${socket.userRole})`);
        // Broadcast online status
        socket.broadcast.emit('user_status', { userId, status: 'online' });
        // Handle joining chat rooms (for vendor/support channels if needed)
        socket.on('join_chat', (otherUserId) => {
            const roomId = [userId, otherUserId].sort().join('-');
            socket.join(roomId);
            console.log(`💬 User ${userId} joined room ${roomId}`);
        });
        // Handle send message
        socket.on('send_message', async (data) => {
            const { receiverId, message } = data;
            if (!message.trim())
                return;
            try {
                // Save to DB
                const savedMessage = await db_1.default.chatMessage.create({
                    data: {
                        senderId: userId,
                        receiverId,
                        message
                    }
                });
                // Send to receiver if online (direct socket connection)
                const receiverSocketId = onlineUsers.get(receiverId);
                if (receiverSocketId) {
                    io.to(receiverSocketId).emit('receive_message', savedMessage);
                }
                // Send back to sender for confirmation
                socket.emit('message_sent', savedMessage);
                // Also emit to matching private room as secondary channel
                const roomId = [userId, receiverId].sort().join('-');
                socket.to(roomId).emit('room_message', savedMessage);
            }
            catch (err) {
                console.error('Failed to process message saving/sending:', err);
            }
        });
        // Typing alerts
        socket.on('typing', (data) => {
            const receiverSocketId = onlineUsers.get(data.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('typing', { senderId: userId });
            }
        });
        socket.on('stop_typing', (data) => {
            const receiverSocketId = onlineUsers.get(data.receiverId);
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('stop_typing', { senderId: userId });
            }
        });
        // Disconnection
        socket.on('disconnect', () => {
            onlineUsers.delete(userId);
            console.log(`🔌 Socket Disconnected: User ${userId}`);
            socket.broadcast.emit('user_status', { userId, status: 'offline' });
        });
    });
};
exports.setupChatSocket = setupChatSocket;
