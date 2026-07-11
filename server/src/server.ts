import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';

// Load env vars
dotenv.config();

// Import routes
import authRouter from './routes/authRoutes';
import productRouter from './routes/productRoutes';
import cartRouter from './routes/cartRoutes';
import orderRouter from './routes/orderRoutes';
import paymentRouter from './routes/paymentRoutes';
import recommendationRouter from './routes/recommendationRoutes';
import wishlistRouter from './routes/wishlistRoutes';
import adminRouter from './routes/adminRoutes';
import chatRouter from './routes/chatRoutes';
import assistantRouter from './routes/assistantRoutes';

// Import error handler
import { globalErrorHandler, AppError } from './utils/errors';
import { setupChatSocket } from './socket/chatSocket';

const app = express();
const httpServer = createServer(app);

// Socket.io initialization
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Configure Helmet Security Headers (customized to allow image sources & styles)
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS setup
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased to 500 for development testing ease
  message: 'Too many requests from this IP, please try again after 15 minutes',
});
app.use('/api', limiter);

// Express parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files (PDF invoices & public uploads)
app.use(express.static(path.join(__dirname, '..', 'public')));

// Routes mapping
app.use('/api/auth', authRouter);
app.use('/api/products', productRouter);
app.use('/api/cart', cartRouter);
app.use('/api/orders', orderRouter);
app.use('/api/payments', paymentRouter);
app.use('/api/recommendations', recommendationRouter);
app.use('/api/wishlist', wishlistRouter);
app.use('/api/admin', adminRouter);
app.use('/api/chat', chatRouter);
app.use('/api/assistant', assistantRouter);

// 404 Route handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler Middleware
app.use(globalErrorHandler);

// Socket chat integration
setupChatSocket(io);

// Server startup
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
