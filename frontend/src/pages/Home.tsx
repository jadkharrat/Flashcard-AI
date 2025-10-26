import React, { useState} from "react";
import FileUploader from "../components/FileUploader";
import Loader from "../components/Loader";
import Flashcard from "../components/Flashcard";
import { generateFlashcards, type Flashcard as FlashcardType } from "../api/flashcardApi";

function Home() {
    const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

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
        <div className="min-h-screen bg-gray-100 p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Flashcard AI</h1>

            <div className="max-w-xl mx-auto bg-white rounded-2xl shadow p-6">
                <FileUploader onUpload={handleUpload} loading={loading} />
                {loading && <Loader />}
                {error && <p className="text-red-500 mt-4 text-center">{error}</p>}
            </div>

            {flashcards.length > 0 && (
                <div className="max-w-5xl mx-auto mt-10 grid sm:grid-cols-2 md:grid-cols-3 gap-4">
                {flashcards.map((card, i) => (
                    <Flashcard key={i} card={card} index={i} />
                ))}
                </div>
            )}
        </div>
    )
}

export default Home;