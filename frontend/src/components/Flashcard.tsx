import React from "react";
import type { Flashcard as FlashcardType } from "../api/flashcardApi";

interface props {
    card: FlashcardType;
    index: number;
}

function Flashcard({ card, index }: props) {
    return (
        <div className="bg-white rounded-xl shadow p-4 border border-gray-200 hover:shadow-lg transition">
            <p className="font-semibold text-gray-700 mb-2">
                Q{index + 1}: {card.question}
            </p>
            <p className="text-gray-600">{card.answer}</p>
        </div>
    )
}

export default Flashcard;