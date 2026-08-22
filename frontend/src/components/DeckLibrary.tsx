import type { DeckSummary } from "../api/deckApi";

interface DeckLibraryProps {
    decks: DeckSummary[];
    loading: boolean;
    error: string | null;
    openingDeckId: number | null;
    deletingDeckId: number | null;
    onOpen: (deckId: number) => void;
    onDelete: (deck: DeckSummary) => void;
    onRetry: () => void;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
});

function formatDeckDate(value: string) {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "Recently saved" : `Saved ${dateFormatter.format(date)}`;
}

function DeckLibrary({
    decks,
    loading,
    error,
    openingDeckId,
    deletingDeckId,
    onOpen,
    onDelete,
    onRetry,
}: DeckLibraryProps) {
    return (
        <section className="library-section" aria-labelledby="library-heading" aria-busy={loading}>
            <div className="library-heading">
                <div>
                    <p className="eyebrow">Your study shelf</p>
                    <h2 id="library-heading">Saved decks</h2>
                    <p>Pick up a deck exactly where you left it.</p>
                </div>
                <span className="library-count">{decks.length} {decks.length === 1 ? "deck" : "decks"}</span>
            </div>

            {error && (
                <div className="library-error" role="alert">
                    <span>{error}</span>
                    <button type="button" className="text-button" onClick={onRetry}>Try again</button>
                </div>
            )}

            {loading && decks.length === 0 ? (
                <div className="library-loading" aria-label="Loading saved decks">
                    <span /><span /><span />
                </div>
            ) : decks.length === 0 && !error ? (
                <div className="library-empty">
                    <span className="library-empty__icon" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="M6 5.5h9.5A2.5 2.5 0 0 1 18 8v11H8.5A2.5 2.5 0 0 1 6 16.5z" /><path d="M6 16.5A2.5 2.5 0 0 1 8.5 14H18M9 9h6" /></svg>
                    </span>
                    <div>
                        <strong>Your first deck will appear here</strong>
                        <p>Generate one from a PDF, then return anytime to study it again.</p>
                    </div>
                </div>
            ) : (
                <div className="deck-library-grid">
                    {decks.map((deck, index) => {
                        const opening = openingDeckId === deck.id;
                        const deleting = deletingDeckId === deck.id;
                        return (
                            <article className="saved-deck" key={deck.id}>
                                <span className="saved-deck__tab" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                                <button
                                    type="button"
                                    className="saved-deck__open"
                                    onClick={() => onOpen(deck.id)}
                                    disabled={opening || deleting}
                                    aria-label={`Open ${deck.title}, ${deck.cardCount} ${deck.cardCount === 1 ? "card" : "cards"}`}
                                >
                                    <span className="saved-deck__label">{formatDeckDate(deck.updatedAt)}</span>
                                    <strong>{deck.title}</strong>
                                    <span className="saved-deck__source" title={deck.sourceName}>{deck.sourceName}</span>
                                    <span className="saved-deck__meta">
                                        <span>{deck.cardCount} {deck.cardCount === 1 ? "card" : "cards"}</span>
                                        <span>{deck.sourcePageCount} {deck.sourcePageCount === 1 ? "page" : "pages"}</span>
                                        {deck.sourceTruncated && <span className="saved-deck__warning">Partial source</span>}
                                    </span>
                                    <span className="saved-deck__action">
                                        {opening ? "Opening…" : "Study deck"}
                                        {!opening && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>}
                                    </span>
                                </button>
                                <button
                                    type="button"
                                    className="saved-deck__delete"
                                    onClick={() => onDelete(deck)}
                                    disabled={opening || deleting}
                                    aria-label={`Delete ${deck.title}`}
                                    title={`Delete ${deck.title}`}
                                >
                                    {deleting ? <span className="button-spinner" aria-hidden="true" /> : (
                                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 14h8l1-14" /></svg>
                                    )}
                                </button>
                            </article>
                        );
                    })}
                </div>
            )}
        </section>
    );
}

export default DeckLibrary;
