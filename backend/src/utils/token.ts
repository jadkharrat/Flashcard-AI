import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "default_secret";

function generateToken(payload: object): string {
    return jwt.sign(payload, SECRET, { expiresIn: "7d" });
}

function verifyToken(token: string): any {
    try {
        return jwt.verify(token, SECRET);
    } catch (error) {
        return null;
    }
}

export { generateToken, verifyToken };