import { useState, useEffect } from "react";
import type { Flashcard as FlashcardType } from "../api/flashcardApi";

interface FlashcardProps {
    card: FlashcardType;
    index: number;
    flippedAll?: boolean;
}

function Flashcard({ card, index, flippedAll = false }: FlashcardProps) {
    const [flipped, setFlipped] = useState<boolean>(false);

    useEffect(() => {
        setFlipped(flippedAll);
    }, [flippedAll]);

    return (
        <button
            type="button"
            onClick={() => setFlipped(!flipped)}
            className={`flashcard ${flipped ? "flashcard--flipped" : ""}`}
            aria-label={`Card ${index + 1}: ${flipped ? "show question" : "reveal answer"}`}
            aria-pressed={flipped}
        >
            <span className="flashcard__inner">
                <span className="flashcard__face flashcard__front">
                    <span className="flashcard__topline">
                        <span className="flashcard__number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="flashcard__type">Question</span>
                    </span>
                    <span className="flashcard__content">{card.question}</span>
                    <span className="flashcard__hint">
                        Reveal answer
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.3-6" /><path d="M17 2v4h-4" /></svg>
                    </span>
                </span>

                <span className="flashcard__face flashcard__back">
                    <span className="flashcard__topline">
                        <span className="flashcard__number">{String(index + 1).padStart(2, "0")}</span>
                        <span className="flashcard__type">Answer</span>
                    </span>
                    <span className="flashcard__content">{card.answer}</span>
                    <span className="flashcard__hint">
                        Back to question
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 12a8 8 0 0 0-13.3-6" /><path d="M7 2v4h4" /></svg>
                    </span>
                </span>
            </span>
        </button>
    );
}

export default Flashcard;
