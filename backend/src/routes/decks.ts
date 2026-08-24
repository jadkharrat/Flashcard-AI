import { Router } from "express";
import rateLimit from "express-rate-limit";
import prisma from "../database/connection.js";
import { AppError } from "../errors/AppError.js";
import { requireAuthentication } from "../middleware/authenticate.js";
import {
    serializeDeckDetail,
    serializeDeckSummary,
    updateOwnedDeck,
} from "../services/deckService.js";
import { generateFlashcardRewrite } from "../services/openaiService.js";
import type { AuthenticationToken } from "../utils/token.js";
import {
    firstDeckValidationError,
    updateDeckBodySchema,
} from "../validation/decks.js";
import {
    firstFlashcardValidationError,
    regenerateCardBodySchema,
} from "../validation/flashcards.js";

const router = Router();
const cardRewriteRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1_000,
    limit: 20,
    keyGenerator: (_req, res) => `user:${authenticatedUserId(res.locals)}`,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { error: "Card rewrite limit reached. Please try again later." },
});

function authenticatedUserId(locals: Record<string, unknown>): number {
    return (locals.auth as AuthenticationToken).id;
}

function parseDeckId(value: string | string[] | undefined): number {
    const candidate = Array.isArray(value) ? value[0] : value;
    if (!candidate || !/^\d+$/.test(candidate)) {
        throw new AppError(400, "Deck id must be a positive integer", "INVALID_DECK_ID");
    }

    const deckId = Number(candidate);
    if (!Number.isSafeInteger(deckId) || deckId < 1) {
        throw new AppError(400, "Deck id must be a positive integer", "INVALID_DECK_ID");
    }

    return deckId;
}

router.use(requireAuthentication);

router.post("/:deckId/cards/regenerate", cardRewriteRateLimiter, async (req, res, next) => {
    try {
        const body = regenerateCardBodySchema.safeParse(req.body);
        if (!body.success) {
            res.status(400).json({ error: firstFlashcardValidationError(body.error) });
            return;
        }

        const deckId = parseDeckId(req.params.deckId);
        const ownedDeck = await prisma.deck.findFirst({
            where: {
                id: deckId,
                userId: authenticatedUserId(res.locals),
                ...(body.data.cardId === undefined
                    ? {}
                    : { cards: { some: { id: body.data.cardId } } }),
            },
            select: { id: true },
        });

        if (!ownedDeck) {
            throw new AppError(404, "Deck or card not found", "DECK_CARD_NOT_FOUND");
        }

        const suggestion = await generateFlashcardRewrite(body.data);
        res.json({ suggestion });
    } catch (error) {
        next(error);
    }
});

router.get("/", async (_req, res, next) => {
    try {
        const decks = await prisma.deck.findMany({
            where: { userId: authenticatedUserId(res.locals) },
            include: { _count: { select: { cards: true } } },
            orderBy: { updatedAt: "desc" },
            take: 100,
        });

        res.json({ decks: decks.map(serializeDeckSummary) });
    } catch (error) {
        next(error);
    }
});

router.get("/:deckId", async (req, res, next) => {
    try {
        const deck = await prisma.deck.findFirst({
            where: {
                id: parseDeckId(req.params.deckId),
                userId: authenticatedUserId(res.locals),
            },
            include: { cards: { orderBy: { position: "asc" } } },
        });

        if (!deck) {
            throw new AppError(404, "Deck not found", "DECK_NOT_FOUND");
        }

        res.json({ deck: serializeDeckDetail(deck) });
    } catch (error) {
        next(error);
    }
});

router.patch("/:deckId", async (req, res, next) => {
    try {
        const body = updateDeckBodySchema.safeParse(req.body);
        if (!body.success) {
            res.status(400).json({ error: firstDeckValidationError(body.error) });
            return;
        }

        const deck = await updateOwnedDeck({
            deckId: parseDeckId(req.params.deckId),
            userId: authenticatedUserId(res.locals),
            changes: body.data,
        });

        if (!deck) {
            throw new AppError(404, "Deck not found", "DECK_NOT_FOUND");
        }

        res.json({ deck: serializeDeckDetail(deck) });
    } catch (error) {
        next(error);
    }
});

router.delete("/:deckId", async (req, res, next) => {
    try {
        const deleted = await prisma.deck.deleteMany({
            where: {
                id: parseDeckId(req.params.deckId),
                userId: authenticatedUserId(res.locals),
            },
        });

        if (deleted.count === 0) {
            throw new AppError(404, "Deck not found", "DECK_NOT_FOUND");
        }

        res.json({ message: "Deck deleted" });
    } catch (error) {
        next(error);
    }
});

export default router;
