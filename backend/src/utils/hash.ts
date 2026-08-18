import bcrypt from "bcrypt";

const SALT_ROUNDS = 12;

function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export { hashPassword, verifyPassword };
