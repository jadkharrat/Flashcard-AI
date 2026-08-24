import { z } from "zod";

export const GENERATION_CARD_COUNTS = [8, 12, 15] as const;
export const GENERATION_DIFFICULTIES = ["foundation", "standard", "advanced"] as const;
export const GENERATION_FOCUSES = ["balanced", "key-ideas", "definitions", "application"] as const;
export const CARD_REWRITE_GOALS = ["clearer", "simpler", "challenging", "concise"] as const;

const cardCountSchema = z.preprocess(
    (value) => value === "" ? undefined : value,
    z.coerce.number()
        .int()
        .refine(
            (value): value is typeof GENERATION_CARD_COUNTS[number] => (
                GENERATION_CARD_COUNTS.some((count) => count === value)
            ),
            "Deck length must be 8, 12, or 15 cards",
        )
        .default(12),
);

export const generationPreferencesSchema = z.strictObject({
    cardCount: cardCountSchema,
    difficulty: z.enum(GENERATION_DIFFICULTIES).default("standard"),
    focus: z.enum(GENERATION_FOCUSES).default("balanced"),
});

export const regenerateCardBodySchema = z.strictObject({
    cardId: z.number().int().positive().optional(),
    question: z.string()
        .trim()
        .min(1, "Write a question before using AI rewrite")
        .max(500, "Questions must be at most 500 characters"),
    answer: z.string()
        .trim()
        .min(1, "Write an answer before using AI rewrite")
        .max(4_000, "Answers must be at most 4,000 characters"),
    goal: z.enum(CARD_REWRITE_GOALS).default("clearer"),
});

export type GenerationPreferences = z.infer<typeof generationPreferencesSchema>;
export type RegenerateCardBody = z.infer<typeof regenerateCardBodySchema>;

export function firstFlashcardValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? "Invalid flashcard options";
}
