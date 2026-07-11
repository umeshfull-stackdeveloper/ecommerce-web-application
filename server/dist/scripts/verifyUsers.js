"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const result = await prisma.user.updateMany({
        where: { isVerified: false },
        data: { isVerified: true },
    });
    console.log(`✅ Updated ${result.count} user(s) to isVerified = true`);
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
