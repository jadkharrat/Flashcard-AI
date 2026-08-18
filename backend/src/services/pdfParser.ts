import {
    FormatError,
    InvalidPDFException,
    PasswordException,
    PDFParse,
} from "pdf-parse";
import { AppError } from "../errors/AppError.js";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 200;
const MAX_EXTRACTED_CHARACTERS = 2_000_000;
const PDF_HEADER = Buffer.from("%PDF-");

export type ExtractedPdf = {
    text: string;
    pageCount: number;
    extractionTruncated: boolean;
};

export function hasPdfSignature(buffer: Buffer): boolean {
    return buffer.subarray(0, 1_024).indexOf(PDF_HEADER) !== -1;
}

function normalizeExtractedText(text: string): string {
    return text
        .replace(/\u0000/g, "")
        .replace(/\u000c/g, "\n")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .trim();
}

export async function extractTextFromPDF(buffer: Buffer): Promise<ExtractedPdf> {
    const parser = new PDFParse({
        data: new Uint8Array(buffer),
        isEvalSupported: false,
        stopAtErrors: true,
    });

    try {
        const info = await parser.getInfo();
        if (info.total > MAX_PDF_PAGES) {
            throw new AppError(
                422,
                `The PDF has ${info.total} pages; the maximum is ${MAX_PDF_PAGES}`,
                "PDF_TOO_MANY_PAGES",
            );
        }

        const result = await parser.getText({ pageJoiner: "\n\n" });
        const normalizedText = normalizeExtractedText(result.text);
        const extractionTruncated = normalizedText.length > MAX_EXTRACTED_CHARACTERS;

        return {
            text: extractionTruncated
                ? normalizedText.slice(0, MAX_EXTRACTED_CHARACTERS)
                : normalizedText,
            pageCount: result.total,
            extractionTruncated,
        };
    } catch (error) {
        if (error instanceof AppError) {
            throw error;
        }

        if (error instanceof PasswordException) {
            throw new AppError(
                422,
                "Password-protected PDFs are not supported",
                "PDF_PASSWORD_PROTECTED",
                { cause: error },
            );
        }

        if (error instanceof InvalidPDFException || error instanceof FormatError) {
            throw new AppError(
                422,
                "The uploaded PDF is invalid or corrupted",
                "INVALID_PDF",
                { cause: error },
            );
        }

        throw new AppError(
            422,
            "The PDF could not be read",
            "PDF_PARSE_FAILED",
            { cause: error },
        );
    } finally {
        await parser.destroy().catch(() => undefined);
    }
}
