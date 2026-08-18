import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const JWT_ISSUER = "recallai-api";
const JWT_AUDIENCE = "recallai-web";

export type AuthenticationToken = {
    id: number;
    username: string;
};

function generateToken(payload: AuthenticationToken): string {
    return jwt.sign(
        { username: payload.username },
        env.jwtSecret,
        {
            algorithm: "HS256",
            audience: JWT_AUDIENCE,
            expiresIn: "7d",
            issuer: JWT_ISSUER,
            subject: String(payload.id),
        },
    );
}

function verifyToken(token: string): AuthenticationToken | null {
    try {
        const decoded = jwt.verify(token, env.jwtSecret, {
            algorithms: ["HS256"],
            audience: JWT_AUDIENCE,
            issuer: JWT_ISSUER,
        });

        if (
            typeof decoded === "string"
            || typeof decoded.sub !== "string"
            || !/^\d+$/.test(decoded.sub)
            || typeof decoded.username !== "string"
        ) {
            return null;
        }

        return {
            id: Number(decoded.sub),
            username: decoded.username,
        };
    } catch {
        return null;
    }
}

export { generateToken, verifyToken };
