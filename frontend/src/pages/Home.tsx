import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import FileUploader from "../components/FileUploader";
import Loader from "../components/Loader";
import Flashcard from "../components/Flashcard";
import DeckLibrary from "../components/DeckLibrary";
import DeckEditor from "../components/DeckEditor";
import Brand from "../components/Brand";
import {
    deleteDeck,
    getDeck,
    listDecks,
    regenerateCard,
    updateDeck,
    type CardSuggestion,
    type DeckDetail,
    type DeckSummary,
    type RegenerateCardInput,
    type UpdateDeckInput,
} from "../api/deckApi";
import {
    generateFlashcards,
    type Flashcard as FlashcardType,
    type GenerationPreferences,
} from "../api/flashcardApi";
import ThemeToggle from "../components/ThemeToggle";
import { ApiError } from "../api/client";
import { clearSession, getSessionKind, getSessionUser } from "../lib/session";

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

function Home() {
    const navigate = useNavigate();
    const isDemo = getSessionKind() === "demo";
    const user = getSessionUser();
    const [flashcards, setFlashcards] = useState<FlashcardType[]>(() => isDemo ? SAMPLE_DECK : []);
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [flippedAll, setFlippedAll] = useState<boolean>(false);
    const [deckTitle, setDeckTitle] = useState<string>(() => isDemo ? "Learning science & AI" : "");
    const [activeDeck, setActiveDeck] = useState<DeckDetail | null>(null);
    const [savedDecks, setSavedDecks] = useState<DeckSummary[]>([]);
    const [libraryLoading, setLibraryLoading] = useState<boolean>(false);
    const [libraryError, setLibraryError] = useState<string | null>(null);
    const [openingDeckId, setOpeningDeckId] = useState<number | null>(null);
    const [deletingDeckId, setDeletingDeckId] = useState<number | null>(null);
    const [editingDeck, setEditingDeck] = useState<boolean>(false);
    const [savingDeck, setSavingDeck] = useState<boolean>(false);
    const [editorError, setEditorError] = useState<string | null>(null);
    const deckRef = useRef<HTMLElement>(null);
    const activeRequest = useRef<AbortController | null>(null);
    const libraryRequest = useRef<AbortController | null>(null);
    const deckRequest = useRef<AbortController | null>(null);

    const handleExpiredSession = useCallback(() => {
        clearSession();
        navigate("/login", {
            replace: true,
            state: { notice: "Your session expired. Sign in again to continue." },
        });
    }, [navigate]);

    const loadSavedDecks = useCallback(async () => {
        if (isDemo) return;

        const controller = new AbortController();
        libraryRequest.current?.abort();
        libraryRequest.current = controller;
        setLibraryLoading(true);
        setLibraryError(null);

        try {
            setSavedDecks(await listDecks(controller.signal));
        } catch (err: unknown) {
            if (err instanceof ApiError && err.kind === "aborted") return;
            if (err instanceof ApiError && err.status === 401) {
                handleExpiredSession();
                return;
            }
            setLibraryError(err instanceof Error ? err.message : "Saved decks could not be loaded.");
        } finally {
            if (libraryRequest.current === controller) {
                libraryRequest.current = null;
                setLibraryLoading(false);
            }
        }
    }, [handleExpiredSession, isDemo]);

    useEffect(() => {
        document.title = "Study workspace — RecallAI";
        if (!isDemo) void loadSavedDecks();

        return () => {
            activeRequest.current?.abort();
            libraryRequest.current?.abort();
            deckRequest.current?.abort();
        };
    }, [isDemo, loadSavedDecks]);

    const scrollToDeck = () => {
        window.setTimeout(() => {
            const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
            deckRef.current?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
        }, 0);
    };

    const handleUpload = async (file: File, preferences: GenerationPreferences) => {
        const controller = new AbortController();
        activeRequest.current?.abort();
        activeRequest.current = controller;
        setError(null);
        setLoading(true);
        setFlippedAll(false);
        try {
            const savedDeck = await generateFlashcards(file, preferences, controller.signal);
            if (savedDeck.cards.length === 0) {
                throw new Error("No flashcards were generated. Try a PDF with more readable text.");
            }
            setFlashcards(savedDeck.cards);
            setDeckTitle(savedDeck.title);
            setActiveDeck(savedDeck);
            setSavedDecks((current) => [savedDeck, ...current.filter((deck) => deck.id !== savedDeck.id)]);
            scrollToDeck();
        } catch (err: unknown) {
            if (err instanceof ApiError && err.kind === "aborted") return;
            if (err instanceof ApiError && err.status === 401) {
                handleExpiredSession();
                return;
            }
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError("We couldn't generate this deck. Please try another PDF.");
            }
        } finally {
            if (activeRequest.current === controller) {
                activeRequest.current = null;
                setLoading(false);
            }
        }
    };

    const loadSampleDeck = () => {
        setError(null);
        setFlippedAll(false);
        setDeckTitle("Learning science & AI");
        setActiveDeck(null);
        setFlashcards(SAMPLE_DECK);
        scrollToDeck();
    };

    const handleOpenDeck = async (deckId: number) => {
        const controller = new AbortController();
        deckRequest.current?.abort();
        deckRequest.current = controller;
        setOpeningDeckId(deckId);
        setLibraryError(null);

        try {
            const savedDeck = await getDeck(deckId, controller.signal);
            setFlashcards(savedDeck.cards);
            setDeckTitle(savedDeck.title);
            setActiveDeck(savedDeck);
            setFlippedAll(false);
            scrollToDeck();
        } catch (err: unknown) {
            if (err instanceof ApiError && err.kind === "aborted") return;
            if (err instanceof ApiError && err.status === 401) {
                handleExpiredSession();
                return;
            }
            setLibraryError(err instanceof Error ? err.message : "That deck could not be opened.");
        } finally {
            if (deckRequest.current === controller) {
                deckRequest.current = null;
                setOpeningDeckId(null);
            }
        }
    };

    const handleDeleteDeck = async (deck: DeckSummary) => {
        const confirmed = window.confirm(`Delete “${deck.title}”? This also removes all ${deck.cardCount} cards.`);
        if (!confirmed) return;

        setDeletingDeckId(deck.id);
        setLibraryError(null);
        try {
            await deleteDeck(deck.id);
            setSavedDecks((current) => current.filter((savedDeck) => savedDeck.id !== deck.id));
            if (activeDeck?.id === deck.id) {
                setActiveDeck(null);
                setFlashcards([]);
                setDeckTitle("");
                setFlippedAll(false);
                setEditingDeck(false);
            }
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 401) {
                handleExpiredSession();
                return;
            }
            setLibraryError(err instanceof Error ? err.message : "That deck could not be deleted.");
        } finally {
            setDeletingDeckId(null);
        }
    };

    const handleSaveDeck = async (changes: UpdateDeckInput) => {
        if (!activeDeck) return;

        setSavingDeck(true);
        setEditorError(null);
        try {
            const updatedDeck = await updateDeck(activeDeck.id, changes);
            setActiveDeck(updatedDeck);
            setFlashcards(updatedDeck.cards);
            setDeckTitle(updatedDeck.title);
            setFlippedAll(false);
            setSavedDecks((current) => [
                updatedDeck,
                ...current.filter((deck) => deck.id !== updatedDeck.id),
            ]);
            setEditingDeck(false);
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 401) {
                handleExpiredSession();
                return;
            }
            setEditorError(err instanceof Error ? err.message : "Your deck changes could not be saved.");
        } finally {
            setSavingDeck(false);
        }
    };

    const handleRegenerateCard = async (card: RegenerateCardInput): Promise<CardSuggestion> => {
        if (!activeDeck) {
            throw new Error("Open a saved deck before using AI rewrite.");
        }

        try {
            return await regenerateCard(activeDeck.id, card);
        } catch (err: unknown) {
            if (err instanceof ApiError && err.status === 401) {
                handleExpiredSession();
            }
            throw err;
        }
    };

    const handleSignOut = () => {
        activeRequest.current?.abort();
        libraryRequest.current?.abort();
        deckRequest.current?.abort();
        clearSession();
        navigate("/login", { replace: true });
    };

    const handleCreateAccount = () => {
        activeRequest.current?.abort();
        libraryRequest.current?.abort();
        deckRequest.current?.abort();
        clearSession();
        navigate("/register", { replace: true });
    };

    const fullName = [user?.name, user?.surname].filter(Boolean).join(" ");
    const displayName = isDemo ? "Guest preview" : (fullName || user?.username || "My workspace");

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
                        <button type="button" className="icon-button" onClick={handleSignOut} aria-label={isDemo ? "Exit preview" : "Sign out"} title={isDemo ? "Exit preview" : "Sign out"}>
                            <svg viewBox="0 0 24 24" aria-hidden="true">
                                <path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9" />
                            </svg>
                        </button>
                    </div>
                </div>
            </header>

            <main className="workspace" id="main-content">
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
                                <p className="eyebrow">{isDemo ? "Sample workspace" : "Create a new deck"}</p>
                                <h2>{isDemo ? "Turn your own notes into a deck" : "Choose your source material"}</h2>
                            </div>
                        </div>

                        {isDemo ? (
                            <div className="demo-access">
                                <span className="demo-access__icon" aria-hidden="true">
                                    <svg viewBox="0 0 24 24"><path d="M8 10V7a4 4 0 0 1 8 0v3M6 10h12v10H6z" /></svg>
                                </span>
                                <div>
                                    <strong>Create an account to upload a PDF</strong>
                                    <p>You can explore the sample deck below without signing up. When you are ready, create an account to generate one from your own material.</p>
                                </div>
                                <button type="button" className="button button--primary" onClick={handleCreateAccount}>Create an account</button>
                            </div>
                        ) : (
                            <FileUploader onUpload={handleUpload} loading={loading} onLoadSample={loadSampleDeck} />
                        )}
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
                            <span><strong>Private source processing</strong>Your PDF is processed temporarily; only your generated deck is saved.</span>
                        </div>
                    </aside>
                </section>

                {!isDemo && (
                    <DeckLibrary
                        decks={savedDecks}
                        loading={libraryLoading}
                        error={libraryError}
                        openingDeckId={openingDeckId}
                        deletingDeckId={deletingDeckId}
                        onOpen={handleOpenDeck}
                        onDelete={handleDeleteDeck}
                        onRetry={loadSavedDecks}
                    />
                )}

                {flashcards.length > 0 && (
                    <section className="deck-section" ref={deckRef} aria-labelledby="deck-heading">
                        <div className="deck-toolbar">
                            <div>
                                <p className="eyebrow">Ready to review</p>
                                <h2 id="deck-heading">{deckTitle}</h2>
                                <p>{flashcards.length} cards · Select any card to reveal its answer</p>
                            </div>
                            <div className="deck-toolbar__actions">
                                {activeDeck && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditorError(null);
                                            setEditingDeck(true);
                                        }}
                                        className="button button--secondary deck-toolbar__button"
                                    >
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 16-.5 4.5L8 20l10.5-10.5-4-4zM12.5 7.5l4 4" /></svg>
                                        Edit deck
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setFlippedAll(!flippedAll)}
                                    className="button button--secondary deck-toolbar__button"
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12a8 8 0 0 1 13.3-6M20 12a8 8 0 0 1-13.3 6" /><path d="M17 2v4h-4M7 22v-4h4" /></svg>
                                    {flippedAll ? "Show all questions" : "Reveal all answers"}
                                </button>
                            </div>
                        </div>

                        <div className="flashcard-grid">
                            {flashcards.map((card, index) => (
                                <Flashcard key={`${card.question}-${index}`} card={card} index={index} flippedAll={flippedAll} />
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {editingDeck && activeDeck && (
                <DeckEditor
                    deck={activeDeck}
                    saving={savingDeck}
                    error={editorError}
                    onSave={handleSaveDeck}
                    onRegenerate={handleRegenerateCard}
                    onClose={() => {
                        setEditingDeck(false);
                        setEditorError(null);
                    }}
                />
            )}
        </div>
    );
}

export default Home;
