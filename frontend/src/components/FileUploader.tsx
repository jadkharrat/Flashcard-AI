import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import type { GenerationPreferences } from "../api/flashcardApi";

interface FileUploaderProps {
    onUpload: (file: File, preferences: GenerationPreferences) => void;
    onLoadSample: () => void;
    loading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const DEFAULT_PREFERENCES: GenerationPreferences = {
    cardCount: 12,
    difficulty: "standard",
    focus: "balanced",
};

function formatFileSize(bytes: number) {
    return bytes < 1024 * 1024
        ? `${Math.ceil(bytes / 1024)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploader({ onUpload, onLoadSample, loading }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [validationError, setValidationError] = useState("");
    const [preferences, setPreferences] = useState<GenerationPreferences>(DEFAULT_PREFERENCES);
    const inputRef = useRef<HTMLInputElement>(null);
    const dragDepth = useRef(0);

    const selectFile = (nextFile?: File, fileCount = nextFile ? 1 : 0) => {
        setValidationError("");
        if (!nextFile) return;
        if (fileCount > 1) {
            setFile(null);
            setValidationError("Choose one PDF at a time.");
            return;
        }
        if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) {
            setFile(null);
            setValidationError("Please choose a PDF file.");
            return;
        }
        if (nextFile.size > MAX_FILE_SIZE) {
            setFile(null);
            setValidationError("That file is larger than the 10 MB limit.");
            return;
        }
        if (nextFile.size === 0) {
            setFile(null);
            setValidationError("That PDF is empty. Choose a file with readable content.");
            return;
        }
        setFile(nextFile);
    };

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        selectFile(event.target.files?.[0], event.target.files?.length);
        event.target.value = "";
    };

    const handleDrop = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        dragDepth.current = 0;
        setDragActive(false);
        if (!loading) selectFile(event.dataTransfer.files?.[0], event.dataTransfer.files?.length);
    };

    const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        if (loading) return;
        dragDepth.current += 1;
        setDragActive(true);
    };

    const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
        event.preventDefault();
        dragDepth.current = Math.max(0, dragDepth.current - 1);
        if (dragDepth.current === 0) setDragActive(false);
    };

    const openFilePicker = () => {
        if (!loading) inputRef.current?.click();
    };

    const handleSubmit = () => {
        if (file) onUpload(file, preferences);
    };

    return (
        <div className="uploader">
            <div
                className={`drop-zone ${dragActive ? "drop-zone--active" : ""} ${file ? "drop-zone--selected" : ""}`}
                onDragEnter={handleDragEnter}
                onDragOver={(event) => event.preventDefault()}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                aria-busy={loading}
                aria-describedby={`upload-help${validationError ? " upload-error" : ""}`}
            >
                <input ref={inputRef} id="pdf-upload" type="file" accept="application/pdf,.pdf" onChange={handleChange} disabled={loading} tabIndex={-1} />
                <div className="drop-zone__icon" aria-hidden="true">
                    {file ? (
                        <svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6" /></svg>
                    ) : (
                        <svg viewBox="0 0 24 24"><path d="M12 16V5M8 9l4-4 4 4M5 14v5h14v-5" /></svg>
                    )}
                </div>
                {file ? (
                    <>
                        <strong className="drop-zone__filename">{file.name}</strong>
                        <span id="upload-help">{formatFileSize(file.size)} · Ready to generate</span>
                        <button type="button" className="text-button" onClick={openFilePicker} disabled={loading}>Choose a different PDF</button>
                    </>
                ) : (
                    <>
                        <strong>Drop a PDF here, or <button type="button" className="inline-button" onClick={openFilePicker} disabled={loading}>browse</button></strong>
                        <span id="upload-help">Text-based PDFs up to 10 MB</span>
                    </>
                )}
            </div>

            {validationError && <p className="validation-error" id="upload-error" role="alert">{validationError}</p>}

            <fieldset className="study-recipe" disabled={loading}>
                <legend>
                    <span className="study-recipe__mark" aria-hidden="true">
                        <svg viewBox="0 0 24 24"><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z" /><path d="m18 16 .8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8z" /></svg>
                    </span>
                    <span><strong>Study recipe</strong>Shape the deck before AI builds it.</span>
                </legend>

                <div className="study-recipe__fields">
                    <label>
                        <span>Deck length</span>
                        <select
                            value={preferences.cardCount}
                            onChange={(event) => setPreferences((current) => ({
                                ...current,
                                cardCount: Number(event.target.value) as GenerationPreferences["cardCount"],
                            }))}
                        >
                            <option value={8}>Quick · 8 cards</option>
                            <option value={12}>Standard · 12 cards</option>
                            <option value={15}>Deep · 15 cards</option>
                        </select>
                    </label>

                    <label>
                        <span>Challenge</span>
                        <select
                            value={preferences.difficulty}
                            onChange={(event) => setPreferences((current) => ({
                                ...current,
                                difficulty: event.target.value as GenerationPreferences["difficulty"],
                            }))}
                        >
                            <option value="foundation">Foundation</option>
                            <option value="standard">Standard</option>
                            <option value="advanced">Advanced</option>
                        </select>
                    </label>

                    <label>
                        <span>Emphasis</span>
                        <select
                            value={preferences.focus}
                            onChange={(event) => setPreferences((current) => ({
                                ...current,
                                focus: event.target.value as GenerationPreferences["focus"],
                            }))}
                        >
                            <option value="balanced">Balanced</option>
                            <option value="key-ideas">Key ideas</option>
                            <option value="definitions">Definitions</option>
                            <option value="application">Application</option>
                        </select>
                    </label>
                </div>
            </fieldset>

            <button type="button" onClick={handleSubmit} disabled={!file || loading} className="button button--primary button--full">
                {loading ? "Building your deck…" : "Generate flashcards"}
                {!loading && <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m9 5 7 7-7 7" /></svg>}
            </button>

            <button type="button" className="sample-button" onClick={onLoadSample} disabled={loading}>
                No PDF handy? <span>Try the sample deck</span>
            </button>
        </div>
    );
}

export default FileUploader;
