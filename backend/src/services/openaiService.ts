import dotenv from "dotenv";
import OpenAI from "openai";
import type { Flashcard } from "../types"; 

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export async function generateFlashcardsFromText(text: string): Promise<Flashcard[]> {
    const slicedText = text.slice(0, 15000);

    const prompt = `
    You are a precise study assistant that creates flashcards from text.

    INSTRUCTIONS:
    - Return ONLY a valid JSON array of objects: [{"question": "...", "answer": "..."}]
    - Each question must test key ideas, definitions, or concepts from the text.
    - Answers must be short, clear, and factual.
    - Do NOT include explanations, comments, or markdown.
    - Focus on understanding and recall, not trivial details.
    - Generate around 10–15 high-quality flashcards.

    TEXT:
    ${slicedText}
    `;

    const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
            { role: "system", content: "You are a helpful assistant that returns only valid JSON." },
            { role: "user", content: prompt },
        ]
    })

    const raw = response.choices[0]?.message?.content || "[]";
    const clean = raw.replace(/```json|```/g, "").trim();

    try {
        const parsed = JSON.parse(clean);
        if (Array.isArray(parsed)) {
            return parsed.filter( (card) => card?.question && card?.answer) as Flashcard[];
        } else {
            console.warn("Model returned non array output, using empty fallback.")
            return [];
        } 
    } catch (error) {
        console.error("Failed to parse JSON from AI:", error);
        return [];
    }
}
