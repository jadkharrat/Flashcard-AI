import type { NextFunction, Request, Response } from "express";
import { verifyToken } from "../utils/token.js";

export function requireAuthentication(req: Request, res: Response, next: NextFunction): void {
    const authorization = req.get("authorization");
    const match = authorization?.match(/^Bearer\s+(.+)$/i);

    if (!match?.[1]) {
        res.status(401).json({ error: "Authentication required" });
        return;
    }

    const payload = verifyToken(match[1]);
    if (!payload) {
        res.status(401).json({ error: "Invalid or expired session" });
        return;
    }

    res.locals.auth = payload;
    next();
}
