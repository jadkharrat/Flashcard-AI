import React, {useState, useEffect} from "react";
import type { Flashcard as FlashcardType } from "../api/flashcardApi";

interface props {
    card: FlashcardType;
    index: number;
    flippedAll?: boolean;
}

function Flashcard({ card, index, flippedAll = false }: props) {
    const [flipped, setFlipped] = useState<boolean>(false);

    useEffect(() => {
        setFlipped(flippedAll)
    }, [flippedAll]);

    return (
        <div
            onClick={() => setFlipped(!flipped)}
            className="relative w-72 h-44 cursor-pointer perspective mx-auto"
            >
            <div
                className={`relative w-full h-full text-center transition-transform duration-700 transform-style-preserve-3d ${
                flipped ? "rotate-y-180" : ""
                }`}
            >
                {/* Question Front Side */}
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 backface-hidden">
                <p className="font-semibold text-lg mb-2">Q{index + 1}</p>
                <p className="px-3">{card.question}</p>
                </div>

                {/* Answer Back Side */}
                <div className="absolute inset-0 flex flex-col justify-center items-center bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 transform rotate-y-180 backface-hidden">
                <p className="font-semibold mb-2">Answer</p>
                <p className="px-3">{card.answer}</p>
                </div>
            </div>
        </div>
    )
}

export default Flashcard;