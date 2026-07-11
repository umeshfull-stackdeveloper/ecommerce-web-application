"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
// Load env vars
dotenv_1.default.config();
// Import routes
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const productRoutes_1 = __importDefault(require("./routes/productRoutes"));
const cartRoutes_1 = __importDefault(require("./routes/cartRoutes"));
const orderRoutes_1 = __importDefault(require("./routes/orderRoutes"));
const paymentRoutes_1 = __importDefault(require("./routes/paymentRoutes"));
const recommendationRoutes_1 = __importDefault(require("./routes/recommendationRoutes"));
const wishlistRoutes_1 = __importDefault(require("./routes/wishlistRoutes"));
const adminRoutes_1 = __importDefault(require("./routes/adminRoutes"));
const chatRoutes_1 = __importDefault(require("./routes/chatRoutes"));
const assistantRoutes_1 = __importDefault(require("./routes/assistantRoutes"));
// Import error handler
const errors_1 = require("./utils/errors");
const chatSocket_1 = require("./socket/chatSocket");
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
// Socket.io initialization
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: process.env.CLIENT_URL || 'http://localhost:5173',
        methods: ['GET', 'POST'],
        credentials: true,
    },
});
// Configure Helmet Security Headers (customized to allow image sources & styles)
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS setup
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));
// Rate limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 500, // Increased to 500 for development testing ease
    message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);
// Express parsing
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Static files (PDF invoices & public uploads)
app.use(express_1.default.static(path_1.default.join(__dirname, '..', 'public')));
// Routes mapping
app.use('/api/auth', authRoutes_1.default);
app.use('/api/products', productRoutes_1.default);
app.use('/api/cart', cartRoutes_1.default);
app.use('/api/orders', orderRoutes_1.default);
app.use('/api/payments', paymentRoutes_1.default);
app.use('/api/recommendations', recommendationRoutes_1.default);
app.use('/api/wishlist', wishlistRoutes_1.default);
app.use('/api/admin', adminRoutes_1.default);
app.use('/api/chat', chatRoutes_1.default);
app.use('/api/assistant', assistantRoutes_1.default);
// 404 Route handler
app.all('*', (req, res, next) => {
    next(new errors_1.AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});
// Global Error Handler Middleware
app.use(errors_1.globalErrorHandler);
// Socket chat integration
(0, chatSocket_1.setupChatSocket)(io);
// Server startup
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
