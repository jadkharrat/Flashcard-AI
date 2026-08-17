import { useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "../components/FileUploader";
import Loader from "../components/Loader";
import Flashcard from "../components/Flashcard";
import Brand from "../components/Brand";
import { generateFlashcards, type Flashcard as FlashcardType } from "../api/flashcardApi";
import ThemeToggle from "../components/ThemeToggle";

const SAMPLE_DECK: FlashcardType[] = [
    {
        question: "What is active recall?",
        answer: "A learning method where you retrieve information from memory instead of rereading it.",
    },
    {
        question: "Why does spaced repetition improve retention?",
        answer: "It revisits information at expanding intervals, strengthening memory just before forgetting.",
    },
    {
        question: "What does overfitting mean in machine learning?",
        answer: "A model learns its training data too closely and performs poorly on new, unseen data.",
    },
    {
        question: "What is the role of a validation set?",
        answer: "It helps tune a model and compare choices without using the final test set.",
    },
    {
        question: "How does retrieval-augmented generation work?",
        answer: "It retrieves relevant external evidence and gives it to a language model before generation.",
    },
    {
        question: "What is precision in a classification task?",
        answer: "The share of predicted positive examples that are actually positive.",
    },
];

interface StoredUser {
    name?: string;
    username?: string;
}

function getStoredUser(): StoredUser | null {
    try {
        const value = localStorage.getItem("user");
        return value ? JSON.parse(value) as StoredUser : null;
    } catch {
        return null;
    }
}

function Home() {
    const navigate = useNavigate();
    const isDemo = sessionStorage.getItem("demoMode") === "true";
    const user = getStoredUser();
    const [flashcards, setFlashcards] = useState<FlashcardType[]>(() => isDemo ? SAMPLE_DECK : []);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [flippedAll, setFlippedAll] = useState<boolean>(false);
    const [deckTitle, setDeckTitle] = useState<string>(() => isDemo ? "Learning science & AI" : "");

    const handleUpload = async (file: File) => {
        setError(null);
        setLoading(true);
        setFlippedAll(false);
        try {
            const cards = await generateFlashcards(file);
            if (cards.length === 0) {
                throw new Error("No flashcards were generated. Try a PDF with more readable text.");
            }
            setFlashcards(cards);
            setDeckTitle(file.name.replace(/\.pdf$/i, ""));
        } catch (err: unknown) {
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("We couldn't generate this deck. Please try another PDF.");
            }
        } finally {
            setLoading(false);
        }
    };

    const loadSampleDeck = () => {
        setError(null);
        setFlippedAll(false);
        setDeckTitle("Learning science & AI");
        setFlashcards(SAMPLE_DECK);
    };

    const handleSignOut = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        sessionStorage.removeItem("demoMode");
        navigate("/login");
    };

    const displayName = isDemo ? "Guest preview" : (user?.name || user?.username || "My workspace");

    return (
        <div className="app-shell">
            <header className="app-header">
                <div className="app-header__inner">
                    <Brand />
                    <div className="app-header__actions">
                        <span className={`session-badge ${isDemo ? "session-badge--demo" : ""}`}>
                            <span aria-hidden="true" />
                            {displayName}
                        </span>
                        <ThemeToggle />
                        <button type="button" className="icon-button" onClick={handleSignOut} aria-label="Sign out" title="Sign out">
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="workspace">
                <section className="workspace-hero">
                    <div>
                        <p className="eyebrow">Your AI study desk</p>
                        <h1>Turn reading into <span>recall.</span></h1>
                        <p className="workspace-hero__description">
                            Upload a text-based PDF and transform the important ideas into a focused,
                            ready-to-study flashcard deck.
                        </p>
                    </div>
                    <div className="hero-note" aria-hidden="true">
                        <span className="hero-note__pin" />
                        <small>Study principle</small>
                        <strong>Retrieval beats rereading.</strong>
                        <span className="hero-note__underline" />
                    </div>
                </section>

                <section className="generator-layout" aria-label="Generate a flashcard deck">
                    <div className="generator-card">
                        <div className="section-heading">
                            <span className="section-heading__icon" aria-hidden="true">
                                <svg viewBox="0 0 24 24"><path d="M7 3.5h7l4 4V20H7z" /><path d="M14 3.5v4h4M10 12h5M10 15.5h5" /></svg>
                            </span>
                            <div>
                                <p className="eyebrow">Create a new deck</p>
                                <h2>Choose your source material</h2>
                            </div>
                        </div>

                        <FileUploader onUpload={handleUpload} loading={loading} onLoadSample={loadSampleDeck} />
                        {loading && <Loader />}
                        {error && (
                            <div className="error-message" role="alert">
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></svg>
                                <div><strong>Deck not generated</strong><span>{error}</span></div>
                            </div>
                        )}
                    </div>

                    <aside className="process-card">
                        <p className="eyebrow">From file to focus</p>
                        <h2>One upload. Three simple steps.</h2>
                        <ol className="process-list">
                            <li>
                                <span>1</span>
                                <div><strong>Extract</strong><p>Read the useful text from your PDF.</p></div>
                            </li>
                            <li>
                                <span>2</span>
                                <div><strong>Distill</strong><p>Identify the concepts worth remembering.</p></div>
                            </li>
                            <li>
                                <span>3</span>
                                <div><strong>Practice</strong><p>Flip through a concise recall deck.</p></div>
                            </li>
                        </ol>
                        <div className="privacy-note">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 10V7a4 4 0 0 1 8 0v3M6 10h12v10H6z" /></svg>
                            <span><strong>Private by design</strong>Your file is processed only to create the deck.</span>
                        </div>
                    </aside>
                </section>

                {flashcards.length > 0 && (
                    <section className="deck-section" aria-labelledby="deck-heading">
                        <div className="deck-toolbar">
                            <div>
                                <p className="eyebrow">Ready to review</p>
                                <h2 id="deck-heading">{deckTitle}</h2>
                                <p>{flashcards.length} cards · Click any card to reveal its answer</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFlippedAll(!flippedAll)}
                                className="button button--secondary deck-toolbar__button"
                            >
                                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.3-6M20 12a8 8 0 0 1-13.3 6" /><path d="M17 2v4h-4M7 22v-4h4" /></svg>
                                {flippedAll ? "Show all questions" : "Reveal all answers"}
                            </button>
                        </div>

                        <div className="flashcard-grid">
                            {flashcards.map((card, index) => (
                                <Flashcard key={`${card.question}-${index}`} card={card} index={index} flippedAll={flippedAll} />
                            ))}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
}

export default Home;
