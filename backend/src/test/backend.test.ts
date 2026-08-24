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
    { connectDatabase, disconnectDatabase, prisma },
    { saveGeneratedDeck },
    { prepareSourceText },
    { hasPdfSignature },
    { generateToken, verifyToken },
    { registerBodySchema },
] = await Promise.all([
    import("../app.js"),
    import("../database/connection.js"),
    import("../services/deckService.js"),
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
        user: { id: number; username: string; password?: string };
    };
    assert.equal(registration.user.username, "portfolio.user");
    assert.equal(registration.user.password, undefined);
    assert.ok(registration.token);

    const unauthenticatedDeckList = await fetch(`${baseUrl}/api/decks`);
    assert.equal(unauthenticatedDeckList.status, 401);
    await unauthenticatedDeckList.json();

    const savedDeck = await saveGeneratedDeck({
        userId: registration.user.id,
        title: "Integration Study Guide",
        sourceName: "integration.pdf",
        sourcePageCount: 3,
        sourceTruncated: false,
        flashcards: [
            { question: "First question?", answer: "First answer." },
            { question: "Second question?", answer: "Second answer." },
            { question: "Third question?", answer: "Third answer." },
        ],
    });

    const deckListResponse = await fetch(`${baseUrl}/api/decks`, {
        headers: { authorization: `Bearer ${registration.token}` },
    });
    assert.equal(deckListResponse.status, 200);
    const deckList = await deckListResponse.json() as {
        decks: Array<{ id: number; cardCount: number; title: string }>;
    };
    assert.equal(deckList.decks.length, 1);
    assert.equal(deckList.decks[0]?.id, savedDeck.id);
    assert.equal(deckList.decks[0]?.cardCount, 3);
    assert.equal(deckList.decks[0]?.title, "Integration Study Guide");

    const deckDetailResponse = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        headers: { authorization: `Bearer ${registration.token}` },
    });
    assert.equal(deckDetailResponse.status, 200);
    const deckDetail = await deckDetailResponse.json() as {
        deck: { cards: Array<{ question: string; position: number }> };
    };
    assert.deepEqual(
        deckDetail.deck.cards.map((card) => [card.position, card.question]),
        [[0, "First question?"], [1, "Second question?"], [2, "Third question?"]],
    );

    const unauthenticatedDeckUpdate = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
            title: "Should not save",
            cards: [{ question: "Question", answer: "Answer" }],
        }),
    });
    assert.equal(unauthenticatedDeckUpdate.status, 401);
    await unauthenticatedDeckUpdate.json();

    const otherUserToken = generateToken({ id: registration.user.id + 999, username: "other-user" });
    const forbiddenDeckResponse = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        headers: { authorization: `Bearer ${otherUserToken}` },
    });
    assert.equal(forbiddenDeckResponse.status, 404);
    await forbiddenDeckResponse.json();

    const forbiddenDeckUpdate = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        method: "PATCH",
        headers: {
            authorization: `Bearer ${otherUserToken}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            title: "Should not save",
            cards: [{ question: "Question", answer: "Answer" }],
        }),
    });
    assert.equal(forbiddenDeckUpdate.status, 404);
    await forbiddenDeckUpdate.json();

    const invalidDeckUpdate = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        method: "PATCH",
        headers: {
            authorization: `Bearer ${registration.token}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({ title: "No cards", cards: [] }),
    });
    assert.equal(invalidDeckUpdate.status, 400);
    await invalidDeckUpdate.json();

    const updatedDeckResponse = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        method: "PATCH",
        headers: {
            authorization: `Bearer ${registration.token}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            title: "  Edited Integration Guide  ",
            cards: [
                {
                    id: savedDeck.cards[1]?.id,
                    question: "  Revised second question?  ",
                    answer: "  Revised second answer.  ",
                },
                { question: "A new middle card?", answer: "A new answer." },
                {
                    id: savedDeck.cards[0]?.id,
                    question: "First question?",
                    answer: "First answer.",
                },
            ],
        }),
    });
    assert.equal(updatedDeckResponse.status, 200);
    const updatedDeck = (await updatedDeckResponse.json() as {
        deck: {
            title: string;
            cardCount: number;
            cards: Array<{ id: number; question: string; answer: string; position: number }>;
        };
    }).deck;
    assert.equal(updatedDeck.title, "Edited Integration Guide");
    assert.equal(updatedDeck.cardCount, 3);
    assert.deepEqual(
        updatedDeck.cards.map((card) => [card.position, card.question, card.answer]),
        [
            [0, "Revised second question?", "Revised second answer."],
            [1, "A new middle card?", "A new answer."],
            [2, "First question?", "First answer."],
        ],
    );
    assert.equal(updatedDeck.cards[0]?.id, savedDeck.cards[1]?.id);
    assert.equal(updatedDeck.cards[2]?.id, savedDeck.cards[0]?.id);
    assert.equal(updatedDeck.cards.some((card) => card.id === savedDeck.cards[2]?.id), false);

    const unknownCardUpdate = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        method: "PATCH",
        headers: {
            authorization: `Bearer ${registration.token}`,
            "content-type": "application/json",
        },
        body: JSON.stringify({
            title: updatedDeck.title,
            cards: [{ id: 999_999, question: "Unknown?", answer: "Unknown." }],
        }),
    });
    assert.equal(unknownCardUpdate.status, 400);
    await unknownCardUpdate.json();

    const forbiddenDeleteResponse = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${otherUserToken}` },
    });
    assert.equal(forbiddenDeleteResponse.status, 404);
    await forbiddenDeleteResponse.json();

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

    const deleteDeckResponse = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        method: "DELETE",
        headers: { authorization: `Bearer ${registration.token}` },
    });
    assert.equal(deleteDeckResponse.status, 200);
    await deleteDeckResponse.json();
    assert.equal(await prisma.card.count({ where: { deckId: savedDeck.id } }), 0);

    const deletedDeckResponse = await fetch(`${baseUrl}/api/decks/${savedDeck.id}`, {
        headers: { authorization: `Bearer ${registration.token}` },
    });
    assert.equal(deletedDeckResponse.status, 404);
    await deletedDeckResponse.json();

    const missingRoute = await fetch(`${baseUrl}/api/not-real`);
    assert.equal(missingRoute.status, 404);
    assert.ok(missingRoute.headers.get("x-request-id"));
    await missingRoute.json();
});
