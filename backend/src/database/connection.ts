import { Prisma, PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient({
    log: env.nodeEnv === "development" ? ["warn", "error"] : ["error"],
});

if (env.nodeEnv !== "production") {
    globalForPrisma.prisma = prisma;
}

export async function connectDatabase(): Promise<void> {
    await prisma.$connect();

    try {
        await prisma.user.count();
    } catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2021") {
            throw new Error(
                "The database schema is not initialized. Run `npm run setup` in the backend directory.",
                { cause: error },
            );
        }
        throw error;
    }
}

export async function disconnectDatabase(): Promise<void> {
    await prisma.$disconnect();
}

export default prisma;
