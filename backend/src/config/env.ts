import dotenv from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const dotenvResult = dotenv.config({
    path: resolve(backendRoot, ".env"),
    quiet: true,
});

if (dotenvResult.error) {
    const errorCode = (dotenvResult.error as NodeJS.ErrnoException).code;
    if (errorCode !== "ENOENT") {
        throw dotenvResult.error;
    }
}

const optionalOpenAiKey = z.preprocess((value) => {
    if (typeof value !== "string") return value;

    const key = value.trim();
    if (
        key.length < 20
        || /^(your[_ -]?openai|replace|change[-_ ]?me|example|placeholder)/i.test(key)
    ) {
        return undefined;
    }

    return key;
}, z.string().optional());

const environmentSchema = z.object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().min(1).max(65_535).default(5_050),
    DATABASE_URL: z.string().trim().min(1, "DATABASE_URL is required"),
    JWT_SECRET: z.string()
        .min(32, "JWT_SECRET must be at least 32 characters")
        .refine(
            (value) => !/^(default_secret|your_jwt|replace|change[-_ ]?me)/i.test(value),
            "JWT_SECRET must not use a placeholder value",
        ),
    CLIENT_ORIGIN: z.string().trim().default("http://localhost:5173,http://localhost:4173"),
    OPENAI_API_KEY: optionalOpenAiKey,
    OPENAI_MODEL: z.string().trim().min(1).default("gpt-5.5"),
});

const parsedEnvironment = environmentSchema.safeParse(process.env);

if (!parsedEnvironment.success) {
    const details = parsedEnvironment.error.issues
        .map((issue) => `${issue.path.join(".") || "environment"}: ${issue.message}`)
        .join("; ");

    throw new Error(`Invalid backend configuration: ${details}. Check backend/.env.`);
}

function parseClientOrigins(value: string): ReadonlySet<string> {
    const origins = value
        .split(",")
        .map((origin) => origin.trim())
        .filter(Boolean)
        .map((origin) => {
            const url = new URL(origin);
            if (url.protocol !== "http:" && url.protocol !== "https:") {
                throw new Error(`CLIENT_ORIGIN contains an unsupported protocol: ${url.protocol}`);
            }
            return url.origin;
        });

    if (origins.length === 0) {
        throw new Error("CLIENT_ORIGIN must contain at least one HTTP(S) origin.");
    }

    return new Set(origins);
}

export const env = Object.freeze({
    nodeEnv: parsedEnvironment.data.NODE_ENV,
    port: parsedEnvironment.data.PORT,
    databaseUrl: parsedEnvironment.data.DATABASE_URL,
    jwtSecret: parsedEnvironment.data.JWT_SECRET,
    clientOrigins: parseClientOrigins(parsedEnvironment.data.CLIENT_ORIGIN),
    openaiApiKey: parsedEnvironment.data.OPENAI_API_KEY,
    openaiModel: parsedEnvironment.data.OPENAI_MODEL,
});

export const isProduction = env.nodeEnv === "production";
