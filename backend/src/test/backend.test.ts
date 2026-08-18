import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, open, rm } from "node:fs/promises";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { after, before, test } from "node:test";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const temporaryDirectory = await mkdtemp(join(tmpdir(), "recallai-backend-test-"));
const databasePath = join(temporaryDirectory, "test.db");
const databaseHandle = await open(databasePath, "a");
await databaseHandle.close();

process.env.NODE_ENV = "test";
process.env.PORT = "5051";
process.env.CLIENT_ORIGIN = "http://localhost:5173";
process.env.DATABASE_URL = `file:${databasePath}`;
process.env.JWT_SECRET = "integration-test-secret-that-is-more-than-thirty-two-characters";
process.env.OPENAI_API_KEY = "";
process.env.OPENAI_MODEL = "gpt-4o-mini";

const prismaCli = resolve(backendRoot, "node_modules/prisma/build/index.js");
execFileSync(process.execPath, [prismaCli, "migrate", "deploy"], {
    cwd: backendRoot,
    env: process.env,
    stdio: "pipe",
});

const [
    { createApp },
    { connectDatabase, disconnectDatabase },
    { prepareSourceText },
    { hasPdfSignature },
    { generateToken, verifyToken },
    { registerBodySchema },
] = await Promise.all([
    import("../app.js"),
    import("../database/connection.js"),
    import("../services/openaiService.js"),
    import("../services/pdfParser.js"),
    import("../utils/token.js"),
    import("../validation/auth.js"),
]);

const app = createApp();
let server: ReturnType<typeof app.listen>;
let baseUrl = "";

before(async () => {
    await connectDatabase();
    server = app.listen(0, "127.0.0.1");
    await new Promise<void>((resolveListening, rejectListening) => {
        const handleListening = () => {
            server.off("error", handleError);
            resolveListening();
        };
        const handleError = (error: Error) => {
            server.off("listening", handleListening);
            rejectListening(error);
        };

        server.once("listening", handleListening);
        server.once("error", handleError);
    });
    const address = server.address() as AddressInfo;
    baseUrl = `http://127.0.0.1:${address.port}`;
});

after(async () => {
    if (server?.listening) {
        server.closeIdleConnections();
        server.closeAllConnections();
        await new Promise<void>((resolveClose, rejectClose) => {
            server.close((error) => error ? rejectClose(error) : resolveClose());
        });
    }
    await disconnectDatabase();
    await rm(temporaryDirectory, { recursive: true, force: true });
});

test("registration validation normalizes usernames and enforces bcrypt's byte limit", () => {
    const valid = registerBodySchema.safeParse({
        username: "  Jad.K  ",
        password: "é".repeat(36),
        name: " Jad ",
        surname: " Kharrat ",
    });

    assert.equal(valid.success, true);
    if (valid.success) {
        assert.equal(valid.data.username, "jad.k");
        assert.equal(valid.data.name, "Jad");
    }

    assert.equal(registerBodySchema.safeParse({
        username: "invalid username",
        password: "valid-password",
        name: "Jad",
        surname: "Kharrat",
    }).success, false);

    assert.equal(registerBodySchema.safeParse({
        username: "jad",
        password: "é".repeat(37),
        name: "Jad",
        surname: "Kharrat",
    }).success, false);
});

test("source preparation keeps representative excerpts within the model limit", () => {
    const shortSource = prepareSourceText("short source");
    assert.deepEqual(shortSource, { text: "short source", truncated: false });

    const longText = `${"A".repeat(50_000)}MIDDLE${"Z".repeat(50_000)}`;
    const prepared = prepareSourceText(longText);
    assert.equal(prepared.truncated, true);
    assert.equal(prepared.text.length, 45_000);
    assert.match(prepared.text, /^A+/);
    assert.match(prepared.text, /MIDDLE/);
    assert.match(prepared.text, /Z+$/);
});

test("PDF signature detection rejects renamed non-PDF files", () => {
    assert.equal(hasPdfSignature(Buffer.from("%PDF-1.7\n")), true);
    assert.equal(hasPdfSignature(Buffer.from("plain text")), false);
});

test("JWTs are signed, verified, and reject tampering", () => {
    const token = generateToken({ id: 42, username: "jad" });
    assert.deepEqual(verifyToken(token), { id: 42, username: "jad" });
    const replacement = token.endsWith("x") ? "y" : "x";
    assert.equal(verifyToken(`${token.slice(0, -1)}${replacement}`), null);
});

test("health, auth, protected upload, and error contracts work end to end", async () => {
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthResponse.status, 200);
    const health = await healthResponse.json() as {
        status: string;
        services: { openai: string };
    };
    assert.equal(health.status, "ok");
    assert.equal(health.services.openai, "not_configured");

    const registrationResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            username: "Portfolio.User",
            password: "strong-password",
            name: "Portfolio",
            surname: "User",
        }),
    });
    assert.equal(registrationResponse.status, 201);
    const registration = await registrationResponse.json() as {
        token: string;
        user: { username: string; password?: string };
    };
    assert.equal(registration.user.username, "portfolio.user");
    assert.equal(registration.user.password, undefined);
    assert.ok(registration.token);

    const duplicateResponse = await fetch(`${baseUrl}/api/auth/register`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            username: "PORTFOLIO.USER",
            password: "another-password",
            name: "Other",
            surname: "User",
        }),
    });
    assert.equal(duplicateResponse.status, 409);
    await duplicateResponse.json();

    const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ username: "Portfolio.User", password: "strong-password" }),
    });
    assert.equal(loginResponse.status, 200);
    await loginResponse.json();

    const unauthenticatedUpload = await fetch(`${baseUrl}/api/flashcards/generate`, {
        method: "POST",
    });
    assert.equal(unauthenticatedUpload.status, 401);
    await unauthenticatedUpload.json();

    const formData = new FormData();
    formData.append("file", new Blob(["not a pdf"], { type: "text/plain" }), "notes.txt");
    const invalidUpload = await fetch(`${baseUrl}/api/flashcards/generate`, {
        method: "POST",
        headers: { authorization: `Bearer ${registration.token}` },
        body: formData,
    });
    assert.equal(invalidUpload.status, 415);
    assert.equal(
        (await invalidUpload.json() as { error: string }).error,
        "Only PDF files are supported",
    );

    const malformedPdfForm = new FormData();
    malformedPdfForm.append(
        "file",
        new Blob([`%PDF-1.7\n${"readable text ".repeat(20)}`], { type: "application/pdf" }),
        "notes.pdf",
    );
    const malformedPdfUpload = await fetch(`${baseUrl}/api/flashcards/generate`, {
        method: "POST",
        headers: { authorization: `Bearer ${registration.token}` },
        body: malformedPdfForm,
    });
    assert.equal(malformedPdfUpload.status, 422);
    assert.notEqual(
        (await malformedPdfUpload.json() as { error: string }).error,
        "Invalid file upload",
    );

    const malformedJson = await fetch(`${baseUrl}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{",
    });
    assert.equal(malformedJson.status, 400);
    await malformedJson.json();

    const missingRoute = await fetch(`${baseUrl}/api/not-real`);
    assert.equal(missingRoute.status, 404);
    assert.ok(missingRoute.headers.get("x-request-id"));
    await missingRoute.json();
});
