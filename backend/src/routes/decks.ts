import { Router } from "express";
import prisma from "../database/connection.js";
import { AppError } from "../errors/AppError.js";
import { requireAuthentication } from "../middleware/authenticate.js";
import { serializeDeckDetail, serializeDeckSummary } from "../services/deckService.js";
import type { AuthenticationToken } from "../utils/token.js";

const router = Router();

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
