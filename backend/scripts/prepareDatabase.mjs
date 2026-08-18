import dotenv from "dotenv";
import { open, stat } from "node:fs/promises";
import { dirname, isAbsolute, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
dotenv.config({ path: resolve(backendRoot, ".env"), quiet: true });

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
    throw new Error("DATABASE_URL is required. Check backend/.env.");
}

if (databaseUrl.startsWith("file:")) {
    const rawPath = databaseUrl.slice("file:".length).split("?", 1)[0];
    if (!rawPath) {
        throw new Error("DATABASE_URL contains an empty SQLite path.");
    }

    const decodedPath = decodeURIComponent(rawPath);
    const databasePath = isAbsolute(decodedPath)
        ? decodedPath
        : resolve(backendRoot, "prisma", decodedPath);

    const existing = await stat(databasePath).catch((error) => {
        if (error?.code === "ENOENT") return undefined;
        throw error;
    });

    if (existing?.isDirectory()) {
        throw new Error("DATABASE_URL must point to a SQLite file, not a directory.");
    }

    if (!existing) {
        const handle = await open(databasePath, "a");
        await handle.close();
    }
}
