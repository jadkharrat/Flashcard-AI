import { z } from "zod";

export const MAX_DECK_CARDS = 100;

const editableCardSchema = z.strictObject({
    id: z.number().int().positive().optional(),
    question: z.string()
        .trim()
        .min(1, "Every card needs a question")
        .max(500, "Questions must be at most 500 characters"),
    answer: z.string()
        .trim()
        .min(1, "Every card needs an answer")
        .max(4_000, "Answers must be at most 4,000 characters"),
});

export const updateDeckBodySchema = z.strictObject({
    title: z.string()
        .trim()
        .min(1, "Deck title is required")
        .max(120, "Deck title must be at most 120 characters"),
    cards: z.array(editableCardSchema)
        .min(1, "A deck must contain at least one card")
        .max(MAX_DECK_CARDS, `A deck can contain at most ${MAX_DECK_CARDS} cards`),
}).superRefine((value, context) => {
    const existingIds = value.cards
        .map((card) => card.id)
        .filter((id): id is number => id !== undefined);

    if (new Set(existingIds).size !== existingIds.length) {
        context.addIssue({
            code: "custom",
            message: "A card cannot appear more than once",
            path: ["cards"],
        });
    }
});

export type UpdateDeckBody = z.infer<typeof updateDeckBodySchema>;

export function firstDeckValidationError(error: z.ZodError): string {
    return error.issues[0]?.message ?? "Invalid deck changes";
}
