import { randomUUID } from "node:crypto";
import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import { env } from "./config/env.js";
import prisma from "./database/connection.js";
import { AppError } from "./errors/AppError.js";
import { errorHandler, notFoundHandler } from "./middleware/errors.js";
import authRoutes from "./routes/auth.js";
import deckRoutes from "./routes/decks.js";
import flashcardRoutes from "./routes/flashcards.js";

const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1_000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Too many authentication attempts. Please try again later." },
});

const generationRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1_000,
    limit: 30,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Flashcard generation limit reached. Please try again later." },
});

export function createApp(): express.Express {
    const app = express();

    app.disable("x-powered-by");
    app.use(helmet());
    app.use((req, res, next) => {
        const suppliedRequestId = req.get("x-request-id");
        const requestId = suppliedRequestId && /^[A-Za-z0-9._-]{1,100}$/.test(suppliedRequestId)
            ? suppliedRequestId
            : randomUUID();

        res.locals.requestId = requestId;
        res.setHeader("x-request-id", requestId);
        next();
    });
    app.use(cors({
        origin(origin, callback) {
            if (!origin || env.clientOrigins.has(origin)) {
                callback(null, true);
                return;
            }

            callback(new AppError(403, "Origin is not allowed", "CORS_ORIGIN_DENIED"));
        },
        allowedHeaders: ["Authorization", "Content-Type", "X-Request-Id"],
        methods: ["GET", "POST", "DELETE", "OPTIONS"],
        maxAge: 86_400,
    }));
    app.use(express.json({ limit: "32kb", strict: true }));

    app.get("/", (_req, res) => {
        res.json({ name: "RecallAI API", health: "/api/health" });
    });

    app.get("/api/health", async (_req, res) => {
        try {
            await prisma.$queryRaw`SELECT 1`;
            res.json({
                status: "ok",
                services: {
                    database: "up",
                    openai: env.openaiApiKey ? "configured" : "not_configured",
                },
            });
        } catch {
            res.status(503).json({
                status: "unavailable",
                services: { database: "down" },
            });
        }
    });

    app.use("/api/auth", authRateLimiter, authRoutes);
    app.use("/api/flashcards", generationRateLimiter, flashcardRoutes);
    app.use("/api/decks", deckRoutes);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
