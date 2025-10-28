import React, { useState} from "react";
import FileUploader from "../components/FileUploader";
import Loader from "../components/Loader";
import Flashcard from "../components/Flashcard";
import { generateFlashcards, type Flashcard as FlashcardType } from "../api/flashcardApi";
import ThemeToggle from "../components/ThemeToggle";

function Home() {
    const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [flippedAll, setFlippedAll] = useState<boolean>(false);

    const handleUpload = async (file: File) => {
        setError("");
        setLoading(true);
        try{
            const cards = await generateFlashcards(file);
            setFlashcards(cards);
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("An error occurred while generating flashcards.");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-8 transition-colors duration-500 relative">
            <ThemeToggle />
            <h1 className="text-3xl font-bold text-center mb-8">Flashcard AI</h1>

            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">
                <FileUploader onUpload={handleUpload} loading={loading} />
                {loading && <Loader />}
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>

            {/* Flip All Button */}
            {flashcards.length > 0 && (
                <div className="flex justify-center mt-8">
                <button
                    onClick={() => setFlippedAll(!flippedAll)}
                    className="px-5 py-2 rounded-lg font-medium shadow transition bg-gray-200 hover:bg-gray-300 text-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-gray-100"
                >
                    {flippedAll ? "Show Questions" : "Show Answers"}
                </button>
                </div>
            )}

            {/* Flashcards Grid */}
            {flashcards.length > 0 && (
                <div className="max-w-6xl mx-auto mt-10 grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {flashcards.map((card, i) => (
                    <Flashcard key={i} card={card} index={i} flippedAll={flippedAll} />
                ))}
                </div>
            )}
        </div>
    )
}

export default Home;