import { basename, extname } from "node:path";
import { Router } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.js";
import { requireAuthentication } from "../middleware/authenticate.js";
import { saveGeneratedDeck, serializeDeckDetail } from "../services/deckService.js";
import { generateFlashcardsFromText } from "../services/openaiService.js";
import {
    extractTextFromPDF,
    hasPdfSignature,
    MAX_PDF_BYTES,
} from "../services/pdfParser.js";
import type { AuthenticationToken } from "../utils/token.js";

const router = Router();
const acceptedMimeTypes = new Set(["application/pdf", "application/x-pdf", "application/octet-stream"]);
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fieldSize: 1_024,
        fields: 0,
        fileSize: MAX_PDF_BYTES,
        files: 1,
    },
    fileFilter: (_req, file, callback) => {
        const hasPdfExtension = extname(file.originalname).toLowerCase() === ".pdf";
        if (!hasPdfExtension || !acceptedMimeTypes.has(file.mimetype)) {
            callback(new AppError(415, "Only PDF files are supported", "UNSUPPORTED_FILE_TYPE"));
            return;
        }

        callback(null, true);
    },
});

function deckNames(originalName: string): { sourceName: string; title: string } {
    const sourceName = basename(originalName.trim() || "Uploaded document.pdf").slice(0, 255);
    const extension = extname(sourceName);
    const stem = basename(sourceName, extension).replace(/\s+/g, " ").trim();

    return {
        sourceName,
        title: (stem || "Untitled deck").slice(0, 120),
    };
}

router.post("/generate", requireAuthentication, upload.single("file"), async (req, res, next) => {
    try {
        const uploadedFile = req.file;
        if (!uploadedFile) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const buffer = uploadedFile.buffer;

        if (!hasPdfSignature(buffer)) {
            throw new AppError(415, "The uploaded file is not a valid PDF", "INVALID_PDF_SIGNATURE");
        }

        const extracted = await extractTextFromPDF(buffer);
        if (extracted.text.length < 100) {
            throw new AppError(
                422,
                "The PDF contains too little readable text. Scanned PDFs require OCR before upload.",
                "PDF_HAS_NO_TEXT",
            );
        }

        const generated = await generateFlashcardsFromText(extracted.text);
        const sourceTruncated = extracted.extractionTruncated || generated.sourceTruncated;
        const names = deckNames(uploadedFile.originalname);
        const authentication = res.locals.auth as AuthenticationToken;
        const savedDeck = await saveGeneratedDeck({
            userId: authentication.id,
            title: names.title,
            sourceName: names.sourceName,
            sourcePageCount: extracted.pageCount,
            sourceTruncated,
            flashcards: generated.flashcards,
        });

        return res.status(201).json({
            deck: serializeDeckDetail(savedDeck),
            flashcards: generated.flashcards,
            meta: {
                pageCount: extracted.pageCount,
                sourceTruncated,
            },
        });
    } catch (error) {
        next(error);
        return;
    }
});

export default router;
