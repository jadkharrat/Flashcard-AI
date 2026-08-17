export type Flashcard = {
    question: string;
    answer: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5050";

async function generateFlashcards(file: File): Promise<Flashcard[]> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/flashcards/generate`, {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        const errorBody = await response.json().catch(() => null) as { error?: string } | null;
        throw new Error(errorBody?.error || `The server returned ${response.status} ${response.statusText}.`);
    }

    const data = await response.json();
    return data.flashcards as Flashcard[] || [];
}

export { generateFlashcards };
