import type { Card, Deck } from "@prisma/client";
import prisma from "../database/connection.js";
import type { Flashcard } from "../types.js";

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
