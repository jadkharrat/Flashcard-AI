import { isRecordResponse, requestJson } from "./client";
import { parseDeckDetail, type DeckDetail } from "./deckApi";
import { getAuthToken } from "../lib/session";

export type Flashcard = {
    question: string;
    answer: string;
}

async function generateFlashcards(file: File, signal?: AbortSignal): Promise<DeckDetail> {
    const formData = new FormData();
    formData.append("file", file);

    const token = getAuthToken();
    const data = await requestJson<unknown>("/api/flashcards/generate", {
        method: "POST",
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        signal,
        timeoutMs: 120_000,
    });

    if (!isRecordResponse(data)) {
        throw new Error("The service returned an invalid flashcard deck. Please try again.");
    }

    return parseDeckDetail(data.deck);
}

export { generateFlashcards };
