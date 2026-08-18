export interface SessionUser {
    id: number;
    username: string;
    name: string;
    surname: string;
}

export type SessionKind = "authenticated" | "demo" | "none";

const TOKEN_KEY = "token";
const USER_KEY = "user";
const DEMO_KEY = "demoMode";

function readStorage(storage: Storage, key: string): string | null {
    try {
        return storage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(storage: Storage, key: string, value: string) {
    try {
        storage.setItem(key, value);
    } catch {
        // The app can still run if storage is blocked; the session just will not persist.
    }
}

function removeStorage(storage: Storage, key: string) {
    try {
        storage.removeItem(key);
    } catch {
        // Storage can be unavailable in hardened/private browser contexts.
    }
}

function isInvalidOrExpiredJwt(token: string) {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payloadSegment = parts[1];
    if (!payloadSegment) return true;

    try {
        const unpaddedBase64 = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
        const base64 = unpaddedBase64.padEnd(Math.ceil(unpaddedBase64.length / 4) * 4, "=");
        const payload = JSON.parse(atob(base64)) as { exp?: unknown };
        return typeof payload.exp !== "number" || !Number.isFinite(payload.exp) || payload.exp * 1000 <= Date.now();
    } catch {
        return true;
    }
}

export function getAuthToken() {
    const token = readStorage(localStorage, TOKEN_KEY)?.trim() || null;
    if (token && isInvalidOrExpiredJwt(token)) {
        clearAuthSession();
        return null;
    }
    return token;
}

export function getSessionKind(): SessionKind {
    if (getAuthToken()) return "authenticated";
    return readStorage(sessionStorage, DEMO_KEY) === "true" ? "demo" : "none";
}

export function getSessionUser(): SessionUser | null {
    const value = readStorage(localStorage, USER_KEY);
    if (!value) return null;

    try {
        const user = JSON.parse(value) as Partial<SessionUser>;
        if (
            typeof user.id !== "number" ||
            typeof user.username !== "string" ||
            typeof user.name !== "string" ||
            typeof user.surname !== "string"
        ) {
            return null;
        }
        return user as SessionUser;
    } catch {
        return null;
    }
}

export function saveAuthSession(token: string, user: SessionUser) {
    writeStorage(localStorage, TOKEN_KEY, token);
    writeStorage(localStorage, USER_KEY, JSON.stringify(user));
    removeStorage(sessionStorage, DEMO_KEY);
}

export function startDemoSession() {
    clearAuthSession();
    writeStorage(sessionStorage, DEMO_KEY, "true");
}

export function clearAuthSession() {
    removeStorage(localStorage, TOKEN_KEY);
    removeStorage(localStorage, USER_KEY);
}

export function clearSession() {
    clearAuthSession();
    removeStorage(sessionStorage, DEMO_KEY);
}
