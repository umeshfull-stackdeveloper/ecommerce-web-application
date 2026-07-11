-- AlterTable
ALTER TABLE "Product" ADD COLUMN "auctionEnd" DATETIME;
ALTER TABLE "Product" ADD COLUMN "badge" TEXT DEFAULT 'New';
ALTER TABLE "Product" ADD COLUMN "brand" TEXT DEFAULT 'Generic';
ALTER TABLE "Product" ADD COLUMN "color" TEXT DEFAULT 'Default';
ALTER TABLE "Product" ADD COLUMN "features" TEXT DEFAULT '[]';
ALTER TABLE "Product" ADD COLUMN "flashSaleDiscount" REAL;
ALTER TABLE "Product" ADD COLUMN "flashSaleEnd" DATETIME;
ALTER TABLE "Product" ADD COLUMN "minBid" REAL;
ALTER TABLE "Product" ADD COLUMN "specifications" TEXT DEFAULT '{}';

-- CreateTable
CREATE TABLE "GiftCard" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "balance" REAL NOT NULL,
    "expiryDate" DATETIME NOT NULL,
    "userId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "AuctionBid" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "bidAmount" REAL NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuctionBid_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecentlyViewed" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "productId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecentlyViewed_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "totalAmount" REAL NOT NULL,
    "taxAmount" REAL NOT NULL,
    "discountAmount" REAL NOT NULL DEFAULT 0.0,
    "shippingCost" REAL NOT NULL DEFAULT 0.0,
    "commissionAmount" REAL NOT NULL DEFAULT 0.0,
    "paymentMethod" TEXT NOT NULL DEFAULT 'cod',
    "trackingStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "addressId" TEXT NOT NULL,
    "couponId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("addressId", "couponId", "createdAt", "discountAmount", "id", "shippingCost", "status", "taxAmount", "totalAmount", "updatedAt", "userId") SELECT "addressId", "couponId", "createdAt", "discountAmount", "id", "shippingCost", "status", "taxAmount", "totalAmount", "updatedAt", "userId" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "verificationToken" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "points" INTEGER NOT NULL DEFAULT 0,
    "referralCode" TEXT NOT NULL DEFAULT '',
    "referredById" TEXT,
    "refreshToken" TEXT,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "User_referredById_fkey" FOREIGN KEY ("referredById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_User" ("createdAt", "email", "id", "isVerified", "name", "password", "resetToken", "resetTokenExpiry", "role", "updatedAt", "verificationToken") SELECT "createdAt", "email", "id", "isVerified", "name", "password", "resetToken", "resetTokenExpiry", "role", "updatedAt", "verificationToken" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_referralCode_key" ON "User"("referralCode");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "GiftCard_code_key" ON "GiftCard"("code");
