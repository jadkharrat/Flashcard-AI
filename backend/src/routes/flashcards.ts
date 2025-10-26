import { Router } from "express";
import multer from "multer";
import { extractTextFromPDF } from "../services/pdfParser.ts";
import { generateFlashcardsFromText } from "../services/openaiService.ts";

const router = Router();
const upload = multer({storage: multer.memoryStorage()});

router.post("/generate", upload.single("file"), async (req, res) => {
    try {
        const buffer = req.file?.buffer;
        if (!buffer) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        if (buffer.length > 10 * 1024 * 1024) return res.status(413).json({ error: "File too large (>10MB)" });

        const text = await extractTextFromPDF(buffer);
        if (!text || text.length < 200) {
            return res.status(422).json({ error: "No extractable text found (PDF may be scanned)." });
        }
        const flashcards = await generateFlashcardsFromText(text);
        return res.json({ flashcards });
    } catch (error) {
        console.error("Error generating flashcards:", error);
        return res.status(500).json({ error: String(error) });
    }
});

export default router;