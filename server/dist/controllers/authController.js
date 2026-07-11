"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthLogin = exports.login2FA = exports.disable2FA = exports.verify2FA = exports.setup2FA = exports.getMe = exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.refreshToken = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const db_1 = __importDefault(require("../config/db"));
const auth_1 = require("../middleware/auth");
const errors_1 = require("../utils/errors");
const emailService_1 = require("../services/emailService");
exports.register = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { email, password, name, role, companyName, description, referralCode } = req.body;
    // Check if user already exists
    const existingUser = await db_1.default.user.findUnique({ where: { email } });
    if (existingUser) {
        return next(new errors_1.AppError('User with this email already exists', 400));
    }
    // Hash password
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    // Generate email verification token
    const verificationToken = crypto_1.default.randomBytes(32).toString('hex');
    // Create user
    const user = await db_1.default.$transaction(async (tx) => {
        // Generate new unique referral code for this registering user
        const randomSuffix = Math.floor(100 + Math.random() * 900);
        const cleanName = name.replace(/[^a-zA-Z]/g, '').substring(0, 4).toUpperCase();
        const newReferralCode = `${cleanName}${randomSuffix}`;
        // Verify referrer code
        let referrer = null;
        if (referralCode) {
            referrer = await tx.user.findUnique({
                where: { referralCode: referralCode.toUpperCase().trim() }
            });
        }
        const newUser = await tx.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                role: role || 'CUSTOMER',
                verificationToken,
                isVerified: true, // Auto-verify — email SMTP not configured in this demo
                referralCode: newReferralCode,
                referredById: referrer ? referrer.id : null,
                points: referrer ? 100 : 0 // Referee gets 100 welcome loyalty points
            },
        });
        // Award 200 loyalty points to the referrer
        if (referrer) {
            await tx.user.update({
                where: { id: referrer.id },
                data: { points: { increment: 200 } }
            });
        }
        // If role is SELLER, create seller profile (pending approval)
        if (role === 'SELLER') {
            if (!companyName) {
                throw new errors_1.AppError('Company name is required for seller registration', 400);
            }
            // Check company name uniqueness
            const existingCompany = await tx.seller.findUnique({ where: { companyName } });
            if (existingCompany) {
                throw new errors_1.AppError('Seller company name is already registered', 400);
            }
            await tx.seller.create({
                data: {
                    userId: newUser.id,
                    companyName,
                    description,
                    isApproved: false, // Must be approved by Admin
                },
            });
        }
        // Auto-create empty Cart and Wishlist
        await tx.cart.create({ data: { userId: newUser.id } });
        await tx.wishlist.create({ data: { userId: newUser.id } });
        return newUser;
    });
    // Email verification skipped — no SMTP configured for this demo deployment
    // await emailService.sendVerificationEmail(user.email, user.name, verificationToken);
    res.status(201).json({
        status: 'success',
        message: 'Account created successfully! You can now log in.',
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: true,
        },
    });
});
exports.login = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return next(new errors_1.AppError('Please provide email and password', 400));
    }
    // Find user and select password hash
    const user = await db_1.default.user.findUnique({ where: { email } });
    if (!user || !(await bcryptjs_1.default.compare(password, user.password))) {
        return next(new errors_1.AppError('Incorrect email or password', 401));
    }
    // If seller, check approval state
    if (user.role === 'SELLER') {
        const seller = await db_1.default.seller.findUnique({ where: { userId: user.id } });
        if (seller && !seller.isApproved) {
            return next(new errors_1.AppError('Your seller account has not been approved by an administrator yet.', 403));
        }
    }
    // Check 2FA
    if (user.twoFactorEnabled) {
        return res.status(200).json({
            status: '2fa_required',
            userId: user.id
        });
    }
    const { accessToken, refreshToken } = (0, auth_1.generateTokens)(user);
    // Set cookies
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000, // 1 hour
    });
    res.status(200).json({
        status: 'success',
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified,
        },
    });
});
exports.refreshToken = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return next(new errors_1.AppError('Refresh token is required', 400));
    }
    try {
        const decoded = (0, auth_1.verifyRefreshToken)(refreshToken);
        if (!decoded) {
            return next(new errors_1.AppError('Invalid refresh token', 401));
        }
        const user = await db_1.default.user.findUnique({ where: { id: decoded.id } });
        if (!user) {
            return next(new errors_1.AppError('The user belonging to this token no longer exists', 401));
        }
        const tokens = (0, auth_1.generateTokens)(user);
        res.status(200).json({
            status: 'success',
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    }
    catch (err) {
        return next(new errors_1.AppError('Invalid refresh token', 401));
    }
});
exports.verifyEmail = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
        return next(new errors_1.AppError('Verification token is missing or invalid', 400));
    }
    const user = await db_1.default.user.findFirst({
        where: { verificationToken: token },
    });
    if (!user) {
        return next(new errors_1.AppError('Verification token is invalid or expired', 400));
    }
    await db_1.default.user.update({
        where: { id: user.id },
        data: {
            isVerified: true,
            verificationToken: null,
        },
    });
    // Send welcome email
    try {
        await emailService_1.emailService.sendWelcomeEmail(user.email, user.name);
    }
    catch (error) {
        console.error('Email sending failed during welcome message:', error);
    }
    res.status(200).json({
        status: 'success',
        message: 'Your email has been successfully verified! You can now log in.',
    });
});
exports.forgotPassword = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { email } = req.body;
    const user = await db_1.default.user.findUnique({ where: { email } });
    if (!user) {
        return next(new errors_1.AppError('There is no user with that email address.', 404));
    }
    const resetToken = crypto_1.default.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour
    await db_1.default.user.update({
        where: { id: user.id },
        data: {
            resetToken,
            resetTokenExpiry,
        },
    });
    try {
        await emailService_1.emailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    }
    catch (error) {
        // If sending fails, clear token details
        await db_1.default.user.update({
            where: { id: user.id },
            data: {
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        return next(new errors_1.AppError('There was an error sending the password reset email. Try again later.', 500));
    }
    res.status(200).json({
        status: 'success',
        message: 'Token sent to email address.',
    });
});
exports.resetPassword = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { token, password } = req.body;
    if (!token || !password) {
        return next(new errors_1.AppError('Token and password are required', 400));
    }
    const user = await db_1.default.user.findFirst({
        where: {
            resetToken: token,
            resetTokenExpiry: {
                gt: new Date(),
            },
        },
    });
    if (!user) {
        return next(new errors_1.AppError('Token is invalid or has expired', 400));
    }
    const hashedPassword = await bcryptjs_1.default.hash(password, 12);
    await db_1.default.user.update({
        where: { id: user.id },
        data: {
            password: hashedPassword,
            resetToken: null,
            resetTokenExpiry: null,
        },
    });
    res.status(200).json({
        status: 'success',
        message: 'Password reset successfully. You can now log in with your new password.',
    });
});
exports.getMe = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('User details not loaded.', 404));
    const userDetails = await db_1.default.user.findUnique({
        where: { id: req.user.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isVerified: true,
            createdAt: true,
            sellerProfile: true,
            addresses: true,
            points: true,
            referralCode: true,
        },
    });
    res.status(200).json({
        status: 'success',
        user: userDetails,
    });
});
exports.setup2FA = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('Not authenticated', 401));
    const secret = 'MOCK_TOTP_SECRET_' + crypto_1.default.randomBytes(16).toString('hex').toUpperCase();
    await db_1.default.user.update({
        where: { id: req.user.id },
        data: { twoFactorSecret: secret }
    });
    res.status(200).json({
        status: 'success',
        secret,
        qrCode: `otpauth://totp/NexusMarket:${req.user.email}?secret=${secret}&issuer=NexusMarket`
    });
});
exports.verify2FA = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { code } = req.body;
    if (!req.user)
        return next(new errors_1.AppError('Not authenticated', 401));
    if (!code || code.length !== 6) {
        return next(new errors_1.AppError('Invalid verification code structure. Enter a 6-digit code.', 400));
    }
    await db_1.default.user.update({
        where: { id: req.user.id },
        data: { twoFactorEnabled: true }
    });
    res.status(200).json({
        status: 'success',
        message: 'Two-factor authentication enabled successfully!'
    });
});
exports.disable2FA = (0, errors_1.catchAsync)(async (req, res, next) => {
    if (!req.user)
        return next(new errors_1.AppError('Not authenticated', 401));
    await db_1.default.user.update({
        where: { id: req.user.id },
        data: { twoFactorEnabled: false, twoFactorSecret: null }
    });
    res.status(200).json({
        status: 'success',
        message: 'Two-factor authentication disabled.'
    });
});
exports.login2FA = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { userId, code } = req.body;
    if (!userId || !code) {
        return next(new errors_1.AppError('User ID and code are required', 400));
    }
    const user = await db_1.default.user.findUnique({ where: { id: userId } });
    if (!user) {
        return next(new errors_1.AppError('User not found', 404));
    }
    if (code !== '123456') {
        return next(new errors_1.AppError('Incorrect verification code', 401));
    }
    const { accessToken, refreshToken } = (0, auth_1.generateTokens)(user);
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000,
    });
    res.status(200).json({
        status: 'success',
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified
        }
    });
});
exports.oauthLogin = (0, errors_1.catchAsync)(async (req, res, next) => {
    const { email, name, provider } = req.body;
    if (!email || !name || !provider) {
        return next(new errors_1.AppError('Email, name and provider are required', 400));
    }
    let user = await db_1.default.user.findUnique({ where: { email } });
    if (!user) {
        const dummyPassword = await bcryptjs_1.default.hash(crypto_1.default.randomBytes(16).toString('hex'), 12);
        user = await db_1.default.user.create({
            data: {
                email,
                name,
                password: dummyPassword,
                role: 'CUSTOMER',
                isVerified: true,
                referralCode: name.substring(0, 4).toUpperCase() + Math.floor(100 + Math.random() * 900)
            }
        });
        await db_1.default.cart.create({ data: { userId: user.id } });
        await db_1.default.wishlist.create({ data: { userId: user.id } });
    }
    const { accessToken, refreshToken } = (0, auth_1.generateTokens)(user);
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600000,
    });
    res.status(200).json({
        status: 'success',
        accessToken,
        refreshToken,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            isVerified: user.isVerified
        }
    });
});
