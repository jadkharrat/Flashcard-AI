export type Flashcard = {
    question: string;
    answer: string;
}

async function generateFlashcards(file: File): Promise<Flashcard[]> {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch("http://localhost:5050/api/flashcards/generate", {
        method: "POST",
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data.flashcards as Flashcard[] || [];
}

export { generateFlashcards };