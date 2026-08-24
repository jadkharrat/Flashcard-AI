import { getAuthToken } from "../lib/session";
import { isRecordResponse, requestJson } from "./client";

export type SavedFlashcard = {
    id: number;
    question: string;
    answer: string;
    position: number;
};

export type DeckSummary = {
    id: number;
    title: string;
    sourceName: string;
    sourcePageCount: number;
    sourceTruncated: boolean;
    cardCount: number;
    createdAt: string;
    updatedAt: string;
};

export type DeckDetail = DeckSummary & {
    cards: SavedFlashcard[];
};

export type EditableCardInput = {
    id?: number;
    question: string;
    answer: string;
};

export type UpdateDeckInput = {
    title: string;
    cards: EditableCardInput[];
};

function authorizationHeaders() {
    const token = getAuthToken();
    return token ? { Authorization: `Bearer ${token}` } : undefined;
}

function parseDeckSummary(value: unknown): DeckSummary {
    if (
        !isRecordResponse(value)
        || typeof value.id !== "number"
        || typeof value.title !== "string"
        || typeof value.sourceName !== "string"
        || typeof value.sourcePageCount !== "number"
        || typeof value.sourceTruncated !== "boolean"
        || typeof value.cardCount !== "number"
        || typeof value.createdAt !== "string"
        || typeof value.updatedAt !== "string"
    ) {
        throw new Error("The service returned invalid deck information. Please try again.");
    }

    return {
        id: value.id,
        title: value.title,
        sourceName: value.sourceName,
        sourcePageCount: value.sourcePageCount,
        sourceTruncated: value.sourceTruncated,
        cardCount: value.cardCount,
        createdAt: value.createdAt,
        updatedAt: value.updatedAt,
    };
}

export function parseDeckDetail(value: unknown): DeckDetail {
    const summary = parseDeckSummary(value);
    if (!isRecordResponse(value) || !Array.isArray(value.cards)) {
        throw new Error("The service returned an invalid saved deck. Please try again.");
    }

    const cards = value.cards.map((card) => {
        if (
            !isRecordResponse(card)
            || typeof card.id !== "number"
            || typeof card.question !== "string"
            || typeof card.answer !== "string"
            || typeof card.position !== "number"
        ) {
            throw new Error("The service returned an invalid saved card. Please try again.");
        }

        return {
            id: card.id,
            question: card.question.trim(),
            answer: card.answer.trim(),
            position: card.position,
        };
    });

    return { ...summary, cards };
}

export async function listDecks(signal?: AbortSignal): Promise<DeckSummary[]> {
    const data = await requestJson<unknown>("/api/decks", {
        headers: authorizationHeaders(),
        signal,
    });

    if (!isRecordResponse(data) || !Array.isArray(data.decks)) {
        throw new Error("The service returned an invalid deck library. Please try again.");
    }

    return data.decks.map(parseDeckSummary);
}

export async function getDeck(deckId: number, signal?: AbortSignal): Promise<DeckDetail> {
    const data = await requestJson<unknown>(`/api/decks/${deckId}`, {
        headers: authorizationHeaders(),
        signal,
    });

    if (!isRecordResponse(data)) {
        throw new Error("The service returned an invalid saved deck. Please try again.");
    }

    return parseDeckDetail(data.deck);
}

export async function updateDeck(deckId: number, changes: UpdateDeckInput): Promise<DeckDetail> {
    const data = await requestJson<unknown>(`/api/decks/${deckId}`, {
        method: "PATCH",
        headers: {
            ...authorizationHeaders(),
            "Content-Type": "application/json",
        },
        body: JSON.stringify(changes),
    });

    if (!isRecordResponse(data)) {
        throw new Error("The service returned an invalid updated deck. Please try again.");
    }

    return parseDeckDetail(data.deck);
}

export async function deleteDeck(deckId: number): Promise<void> {
    await requestJson(`/api/decks/${deckId}`, {
        method: "DELETE",
        headers: authorizationHeaders(),
    });
}
