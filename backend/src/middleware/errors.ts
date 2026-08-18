import type { ErrorRequestHandler, RequestHandler } from "express";
import multer from "multer";
import { AppError } from "../errors/AppError.js";

type RequestError = Error & {
    body?: unknown;
    status?: number;
    type?: string;
};

export const notFoundHandler: RequestHandler = (req, res) => {
    res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` });
};

export const errorHandler: ErrorRequestHandler = (error: unknown, req, res, _next) => {
    const requestId = res.locals.requestId as string | undefined;

    if (error instanceof multer.MulterError) {
        if (error.code === "LIMIT_FILE_SIZE") {
            res.status(413).json({
                error: "The PDF must be 10 MB or smaller",
                code: error.code,
                requestId,
            });
            return;
        }

        const message = error.code === "LIMIT_FILE_COUNT" || error.code === "LIMIT_UNEXPECTED_FILE"
            ? "Upload one PDF using the file field"
            : "The upload contained unexpected form data";

        res.status(400).json({ error: message, code: error.code, requestId });
        return;
    }

    if (error instanceof AppError) {
        if (error.statusCode >= 500) {
            console.error("Request failed", {
                requestId,
                method: req.method,
                path: req.path,
                error,
            });
        }

        res.status(error.statusCode).json({
            error: error.message,
            code: error.code,
            requestId,
        });
        return;
    }

    const requestError = error as RequestError;
    if (requestError?.type === "entity.parse.failed" || (requestError instanceof SyntaxError && "body" in requestError)) {
        res.status(400).json({ error: "Request body contains invalid JSON", requestId });
        return;
    }

    console.error("Unexpected request failure", {
        requestId,
        method: req.method,
        path: req.path,
        error,
    });

    res.status(500).json({ error: "Internal server error", requestId });
};
