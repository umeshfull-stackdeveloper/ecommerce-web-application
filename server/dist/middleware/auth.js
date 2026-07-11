"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkVerified = exports.restrictTo = exports.protect = exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("../utils/errors");
const db_1 = __importDefault(require("../config/db"));
const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret_key_12345';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret_key_12345';
const generateTokens = (user) => {
    const accessToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, isVerified: user.isVerified }, ACCESS_SECRET, { expiresIn: '1h' });
    const refreshToken = jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role, isVerified: user.isVerified }, REFRESH_SECRET, { expiresIn: '7d' });
    return { accessToken, refreshToken };
};
exports.generateTokens = generateTokens;
const verifyAccessToken = (token) => {
    return jsonwebtoken_1.default.verify(token, ACCESS_SECRET);
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    return jsonwebtoken_1.default.verify(token, REFRESH_SECRET);
};
exports.verifyRefreshToken = verifyRefreshToken;
const protect = async (req, res, next) => {
    try {
        let token = '';
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }
        else if (req.cookies?.accessToken) {
            token = req.cookies.accessToken;
        }
        if (!token) {
            return next(new errors_1.AppError('You are not logged in. Please log in to get access.', 401));
        }
        // Verify token
        try {
            const decoded = (0, exports.verifyAccessToken)(token);
            if (!decoded) {
                return next(new errors_1.AppError('Invalid token. Please log in again.', 401));
            }
            // Check if user still exists in database
            const user = await db_1.default.user.findUnique({ where: { id: decoded.id } });
            if (!user) {
                return next(new errors_1.AppError('The user belonging to this token no longer exists.', 401));
            }
            req.user = {
                id: user.id,
                email: user.email,
                role: user.role,
                isVerified: user.isVerified,
            };
            next();
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                return next(new errors_1.AppError('Your token has expired. Please refresh your token.', 401));
            }
            return next(new errors_1.AppError('Invalid token. Please log in again.', 401));
        }
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.AppError('Authentication context missing.', 401));
        }
        if (!roles.includes(req.user.role)) {
            return next(new errors_1.AppError('You do not have permission to perform this action', 403));
        }
        next();
    };
};
exports.restrictTo = restrictTo;
const checkVerified = (req, res, next) => {
    if (req.user && !req.user.isVerified) {
        return next(new errors_1.AppError('Your email address is not verified. Please verify your email.', 403));
    }
    next();
};
exports.checkVerified = checkVerified;
