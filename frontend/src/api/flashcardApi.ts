import { isRecordResponse, requestJson } from "./client";
import { getAuthToken } from "../lib/session";

export type Flashcard = {
    question: string;
    answer: string;
}

async function generateFlashcards(file: File, signal?: AbortSignal): Promise<Flashcard[]> {
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

    if (!isRecordResponse(data) || !Array.isArray(data.flashcards)) {
        throw new Error("The service returned an invalid flashcard deck. Please try again.");
    }

    return data.flashcards.flatMap((card): Flashcard[] => {
        if (!isRecordResponse(card) || typeof card.question !== "string" || typeof card.answer !== "string") {
            return [];
        }

        const question = card.question.trim();
        const answer = card.answer.trim();
        return question && answer ? [{ question, answer }] : [];
    });
}

export { generateFlashcards };
