import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import type {
    CardRewriteGoal,
    CardSuggestion,
    DeckDetail,
    RegenerateCardInput,
    UpdateDeckInput,
} from "../api/deckApi";

const MAX_CARDS = 100;

type DraftCard = {
    key: string;
    id?: number;
    question: string;
    answer: string;
    rewriteGoal: CardRewriteGoal;
};

interface DeckEditorProps {
    deck: DeckDetail;
    saving: boolean;
    error: string | null;
    onSave: (changes: UpdateDeckInput) => void;
    onRegenerate: (card: RegenerateCardInput) => Promise<CardSuggestion>;
    onClose: () => void;
}

function originalCards(deck: DeckDetail): DraftCard[] {
    return deck.cards.map((card) => ({
        key: `saved-${card.id}`,
        id: card.id,
        question: card.question,
        answer: card.answer,
        rewriteGoal: "clearer",
    }));
}

function DeckEditor({ deck, saving, error, onSave, onRegenerate, onClose }: DeckEditorProps) {
    const [title, setTitle] = useState(deck.title);
    const [cards, setCards] = useState<DraftCard[]>(() => originalCards(deck));
    const [localError, setLocalError] = useState<string | null>(null);
    const [regeneratingKey, setRegeneratingKey] = useState<string | null>(null);
    const [regenerationNotice, setRegenerationNotice] = useState<string | null>(null);
    const nextCardKey = useRef(1);
    const dialogRef = useRef<HTMLDivElement>(null);
    const titleRef = useRef<HTMLInputElement>(null);
    const initialDraft = useMemo(() => JSON.stringify({
        title: deck.title,
        cards: originalCards(deck).map(({ id, question, answer }) => ({ id, question, answer })),
    }), [deck]);
    const currentDraft = JSON.stringify({
        title,
        cards: cards.map(({ id, question, answer }) => ({ id, question, answer })),
    });
    const dirty = currentDraft !== initialDraft;
    const busy = saving || regeneratingKey !== null;

    const requestClose = useCallback(() => {
        if (busy) return;
        if (dirty && !window.confirm("Discard your unsaved deck changes?")) return;
        onClose();
    }, [busy, dirty, onClose]);

    useEffect(() => {
        const previouslyFocused = document.activeElement instanceof HTMLElement
            ? document.activeElement
            : null;
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        titleRef.current?.focus();
        titleRef.current?.select();

        return () => {
            document.body.style.overflow = previousOverflow;
            previouslyFocused?.focus();
        };
    }, []);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                requestClose();
                return;
            }

            if (event.key !== "Tab" || !dialogRef.current) return;
            const focusable = [...dialogRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
            )];
            const first = focusable[0];
            const last = focusable.at(-1);
            if (!first || !last) return;

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };

        document.addEventListener("keydown", handleKeyDown);
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [requestClose]);

    const updateCard = (key: string, field: "question" | "answer", value: string) => {
        setCards((current) => current.map((card) => (
            card.key === key ? { ...card, [field]: value } : card
        )));
        setLocalError(null);
    };

    const moveCard = (index: number, direction: -1 | 1) => {
        const nextIndex = index + direction;
        if (nextIndex < 0 || nextIndex >= cards.length) return;
        setCards((current) => {
            const reordered = [...current];
            [reordered[index], reordered[nextIndex]] = [reordered[nextIndex]!, reordered[index]!];
            return reordered;
        });
    };

    const removeCard = (key: string) => {
        if (cards.length === 1) return;
        setCards((current) => current.filter((card) => card.key !== key));
        setLocalError(null);
    };

    const addCard = () => {
        if (cards.length >= MAX_CARDS) return;
        const key = `new-${nextCardKey.current++}`;
        setCards((current) => [...current, {
            key,
            question: "",
            answer: "",
            rewriteGoal: "clearer",
        }]);
        setLocalError(null);
        window.setTimeout(() => {
            document.getElementById(`question-${key}`)?.focus();
        }, 0);
    };

    const updateRewriteGoal = (key: string, rewriteGoal: CardRewriteGoal) => {
        setCards((current) => current.map((card) => (
            card.key === key ? { ...card, rewriteGoal } : card
        )));
    };

    const handleRegenerate = async (card: DraftCard, index: number) => {
        const question = card.question.trim();
        const answer = card.answer.trim();
        if (!question || !answer) {
            setLocalError(`Complete both sides of card ${index + 1} before using AI rewrite.`);
            document.getElementById(`${question ? "answer" : "question"}-${card.key}`)?.focus();
            return;
        }

        setRegeneratingKey(card.key);
        setLocalError(null);
        setRegenerationNotice(null);
        try {
            const suggestion = await onRegenerate({
                cardId: card.id,
                question,
                answer,
                goal: card.rewriteGoal,
            });
            setCards((current) => current.map((draftCard) => (
                draftCard.key === card.key ? { ...draftCard, ...suggestion } : draftCard
            )));
            setRegenerationNotice(`Card ${index + 1} has a new AI draft. Save changes to keep it.`);
        } catch (err: unknown) {
            setLocalError(err instanceof Error ? err.message : "This card could not be rewritten.");
        } finally {
            setRegeneratingKey(null);
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const trimmedTitle = title.trim();
        const trimmedCards = cards.map(({ id, question, answer }) => ({
            id,
            question: question.trim(),
            answer: answer.trim(),
        }));

        if (!trimmedTitle) {
            setLocalError("Give this deck a title before saving.");
            titleRef.current?.focus();
            return;
        }

        const incompleteIndex = trimmedCards.findIndex((card) => !card.question || !card.answer);
        if (incompleteIndex >= 0) {
            setLocalError(`Complete both sides of card ${incompleteIndex + 1} before saving.`);
            document.getElementById(
                `${trimmedCards[incompleteIndex]?.question ? "answer" : "question"}-${cards[incompleteIndex]?.key}`,
            )?.focus();
            return;
        }

        onSave({ title: trimmedTitle, cards: trimmedCards });
    };

    return (
        <div
            className="deck-editor-backdrop"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget) requestClose();
            }}
        >
            <div
                ref={dialogRef}
                className="deck-editor"
                role="dialog"
                aria-modal="true"
                aria-labelledby="deck-editor-title"
                aria-describedby="deck-editor-description"
            >
                <div className="deck-editor__header">
                    <div>
                        <p className="eyebrow">Deck workshop</p>
                        <h2 id="deck-editor-title">Shape this deck into your own</h2>
                        <p id="deck-editor-description">
                            Refine the wording, add missing ideas, and put the cards in study order.
                        </p>
                    </div>
                    <button
                        type="button"
                        className="deck-editor__close"
                        onClick={requestClose}
                        disabled={busy}
                        aria-label="Close deck editor"
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>
                    </button>
                </div>

                <form className="deck-editor__form" onSubmit={handleSubmit}>
                    <div className="deck-editor__title-field">
                        <label htmlFor="deck-title">Deck title</label>
                        <input
                            ref={titleRef}
                            id="deck-title"
                            value={title}
                            onChange={(event) => {
                                setTitle(event.target.value);
                                setLocalError(null);
                            }}
                            maxLength={120}
                            required
                            disabled={saving}
                        />
                        <span>{title.length}/120</span>
                    </div>

                    <div className="deck-editor__stack-heading">
                        <div>
                            <strong>Card stack</strong>
                            <span>{cards.length} of {MAX_CARDS}</span>
                        </div>
                        <p>Use the arrows to arrange the order students will review.</p>
                    </div>

                    <div className="deck-editor__cards">
                        {cards.map((card, index) => (
                            <article className="editor-card" key={card.key}>
                                <div className="editor-card__gutter">
                                    <span>{String(index + 1).padStart(2, "0")}</span>
                                    <div className="editor-card__move">
                                        <button
                                            type="button"
                                            onClick={() => moveCard(index, -1)}
                                            disabled={busy || index === 0}
                                            aria-label={`Move card ${index + 1} up`}
                                            title="Move up"
                                        >
                                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 14 5-5 5 5" /></svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => moveCard(index, 1)}
                                            disabled={busy || index === cards.length - 1}
                                            aria-label={`Move card ${index + 1} down`}
                                            title="Move down"
                                        >
                                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m7 10 5 5 5-5" /></svg>
                                        </button>
                                    </div>
                                </div>

                                <div className="editor-card__fields">
                                    <label htmlFor={`question-${card.key}`}>
                                        <span>Question</span>
                                        <textarea
                                            id={`question-${card.key}`}
                                            value={card.question}
                                            onChange={(event) => updateCard(card.key, "question", event.target.value)}
                                            maxLength={500}
                                            rows={3}
                                            required
                                            disabled={saving || regeneratingKey === card.key}
                                            placeholder="What should you be able to recall?"
                                        />
                                    </label>
                                    <label htmlFor={`answer-${card.key}`}>
                                        <span>Answer</span>
                                        <textarea
                                            id={`answer-${card.key}`}
                                            value={card.answer}
                                            onChange={(event) => updateCard(card.key, "answer", event.target.value)}
                                            maxLength={4000}
                                            rows={4}
                                            required
                                            disabled={saving || regeneratingKey === card.key}
                                            placeholder="Write the clearest useful answer."
                                        />
                                    </label>

                                    <div className="editor-card__ai">
                                        <span className="editor-card__ai-label">
                                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" /><path d="m18 16 .8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" /></svg>
                                            <span><strong>AI rewrite</strong>Uses only this card’s current facts.</span>
                                        </span>
                                        <label className="editor-card__ai-goal">
                                            <span>Rewrite style</span>
                                            <select
                                                value={card.rewriteGoal}
                                                onChange={(event) => updateRewriteGoal(
                                                    card.key,
                                                    event.target.value as CardRewriteGoal,
                                                )}
                                                disabled={busy}
                                                aria-label={`Rewrite style for card ${index + 1}`}
                                            >
                                                <option value="clearer">Improve clarity</option>
                                                <option value="simpler">Simpler language</option>
                                                <option value="challenging">More challenging</option>
                                                <option value="concise">More concise</option>
                                            </select>
                                        </label>
                                        <button
                                            type="button"
                                            className="editor-card__rewrite"
                                            onClick={() => void handleRegenerate(card, index)}
                                            disabled={busy || !card.question.trim() || !card.answer.trim()}
                                        >
                                            {regeneratingKey === card.key && <span className="button-spinner" aria-hidden="true" />}
                                            {regeneratingKey === card.key ? "Rewriting…" : "Rewrite card"}
                                        </button>
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="editor-card__remove"
                                    onClick={() => removeCard(card.key)}
                                    disabled={busy || cards.length === 1}
                                    aria-label={`Delete card ${index + 1}`}
                                    title={cards.length === 1 ? "A deck needs at least one card" : "Delete card"}
                                >
                                    <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 7h14M9 7V4h6v3M8 10v8M12 10v8M16 10v8M7 7l1 14h8l1-14" /></svg>
                                </button>
                            </article>
                        ))}
                    </div>

                    <button
                        type="button"
                        className="deck-editor__add"
                        onClick={addCard}
                        disabled={busy || cards.length >= MAX_CARDS}
                    >
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
                        Add a card
                    </button>

                    {(localError || error) && (
                        <div className="deck-editor__error" role="alert">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5M12 16.5v.5" /><circle cx="12" cy="12" r="9" /></svg>
                            <span>{localError || error}</span>
                        </div>
                    )}

                    {regenerationNotice && !localError && !error && (
                        <div className="deck-editor__notice" role="status">
                            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>
                            <span>{regenerationNotice}</span>
                        </div>
                    )}

                    <div className="deck-editor__actions">
                        <span>{dirty ? "Unsaved changes" : "No changes yet"}</span>
                        <div>
                            <button type="button" className="button button--secondary" onClick={requestClose} disabled={busy}>
                                Cancel
                            </button>
                            <button type="submit" className="button button--primary" disabled={busy || !dirty}>
                                {saving && <span className="button-spinner" aria-hidden="true" />}
                                {saving ? "Saving…" : "Save changes"}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default DeckEditor;
