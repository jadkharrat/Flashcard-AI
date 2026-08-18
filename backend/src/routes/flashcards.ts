import { extname } from "node:path";
import { Router } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.js";
import { requireAuthentication } from "../middleware/authenticate.js";
import { generateFlashcardsFromText } from "../services/openaiService.js";
import {
    extractTextFromPDF,
    hasPdfSignature,
    MAX_PDF_BYTES,
} from "../services/pdfParser.js";

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

router.post("/generate", requireAuthentication, upload.single("file"), async (req, res, next) => {
    try {
        const buffer = req.file?.buffer;
        if (!buffer) {
            return res.status(400).json({ error: "No file uploaded" });
        }

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
        return res.json({
            flashcards: generated.flashcards,
            meta: {
                pageCount: extracted.pageCount,
                sourceTruncated: extracted.extractionTruncated || generated.sourceTruncated,
            },
        });
    } catch (error) {
        next(error);
        return;
    }
});

export default router;
