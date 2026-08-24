import type { Card, Deck } from "@prisma/client";
import prisma from "../database/connection.js";
import { AppError } from "../errors/AppError.js";
import type { Flashcard } from "../types.js";
import type { UpdateDeckBody } from "../validation/decks.js";

type DeckWithCardCount = Deck & {
    _count: { cards: number };
};

type DeckWithCards = Deck & {
    cards: Card[];
};

export function serializeDeckSummary(deck: DeckWithCardCount) {
    return {
        id: deck.id,
        title: deck.title,
        sourceName: deck.sourceName,
        sourcePageCount: deck.sourcePageCount,
        sourceTruncated: deck.sourceTruncated,
        cardCount: deck._count.cards,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
    };
}

export function serializeDeckDetail(deck: DeckWithCards) {
    return {
        id: deck.id,
        title: deck.title,
        sourceName: deck.sourceName,
        sourcePageCount: deck.sourcePageCount,
        sourceTruncated: deck.sourceTruncated,
        cardCount: deck.cards.length,
        createdAt: deck.createdAt,
        updatedAt: deck.updatedAt,
        cards: deck.cards.map((card) => ({
            id: card.id,
            question: card.question,
            answer: card.answer,
            position: card.position,
        })),
    };
}

export async function saveGeneratedDeck(input: {
    userId: number;
    title: string;
    sourceName: string;
    sourcePageCount: number;
    sourceTruncated: boolean;
    flashcards: Flashcard[];
}) {
    return prisma.deck.create({
        data: {
            userId: input.userId,
            title: input.title,
            sourceName: input.sourceName,
            sourcePageCount: input.sourcePageCount,
            sourceTruncated: input.sourceTruncated,
            cards: {
                create: input.flashcards.map((card, position) => ({
                    question: card.question,
                    answer: card.answer,
                    position,
                })),
            },
        },
        include: {
            cards: { orderBy: { position: "asc" } },
        },
    });
}

export async function updateOwnedDeck(input: {
    deckId: number;
    userId: number;
    changes: UpdateDeckBody;
}): Promise<DeckWithCards | null> {
    return prisma.$transaction(async (transaction) => {
        const existingDeck = await transaction.deck.findFirst({
            where: { id: input.deckId, userId: input.userId },
            include: { cards: { select: { id: true, position: true } } },
        });

        if (!existingDeck) return null;

        const existingCardIds = new Set(existingDeck.cards.map((card) => card.id));
        const suppliedCardIds = input.changes.cards
            .map((card) => card.id)
            .filter((id): id is number => id !== undefined);

        if (suppliedCardIds.some((cardId) => !existingCardIds.has(cardId))) {
            throw new AppError(
                400,
                "One or more cards do not belong to this deck",
                "INVALID_DECK_CARD",
            );
        }

        const keptCardIds = new Set(suppliedCardIds);
        const largestPosition = existingDeck.cards.reduce(
            (largest, card) => Math.max(largest, card.position),
            0,
        );
        const temporaryOffset = largestPosition + existingDeck.cards.length + 1;

        if (existingDeck.cards.length > 0) {
            await transaction.card.updateMany({
                where: { deckId: existingDeck.id },
                data: { position: { increment: temporaryOffset } },
            });
        }

        await transaction.card.deleteMany({
            where: {
                deckId: existingDeck.id,
                id: { notIn: [...keptCardIds] },
            },
        });

        for (const [position, card] of input.changes.cards.entries()) {
            if (card.id !== undefined) {
                await transaction.card.update({
                    where: { id: card.id },
                    data: {
                        question: card.question,
                        answer: card.answer,
                        position,
                    },
                });
            } else {
                await transaction.card.create({
                    data: {
                        deckId: existingDeck.id,
                        question: card.question,
                        answer: card.answer,
                        position,
                    },
                });
            }
        }

        return transaction.deck.update({
            where: { id: existingDeck.id },
            data: { title: input.changes.title },
            include: { cards: { orderBy: { position: "asc" } } },
        });
    });
}
