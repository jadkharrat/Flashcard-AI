import { useRef, useState, type ChangeEvent, type DragEvent } from "react";

interface FileUploaderProps {
    onUpload: (file: File) => void;
    onLoadSample: () => void;
    loading: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatFileSize(bytes: number) {
    return bytes < 1024 * 1024
        ? `${Math.ceil(bytes / 1024)} KB`
        : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileUploader({ onUpload, onLoadSample, loading }: FileUploaderProps) {
    const [file, setFile] = useState<File | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [validationError, setValidationError] = useState("");
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
        if (file) onUpload(file);
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
