import type { Server } from "node:http";
import { createApp } from "./app.js";
import { env } from "./config/env.js";
import { connectDatabase, disconnectDatabase } from "./database/connection.js";

let server: Server | undefined;
let isShuttingDown = false;

async function shutdown(signal: string, exitCode = 0): Promise<void> {
    if (isShuttingDown) return;
    isShuttingDown = true;

    console.log(`Received ${signal}; shutting down.`);
    const forceExitTimer = setTimeout(() => {
        console.error("Graceful shutdown timed out.");
        process.exit(1);
    }, 10_000);
    forceExitTimer.unref();

    if (server?.listening) {
        await new Promise<void>((resolve) => {
            server?.close((error) => {
                if (error) {
                    console.error("HTTP server shutdown failed", error);
                }
                resolve();
            });
        });
    }

    await disconnectDatabase().catch((error: unknown) => {
        console.error("Database disconnect failed", error);
    });

    clearTimeout(forceExitTimer);
    process.exit(exitCode);
}

async function start(): Promise<void> {
    await connectDatabase();
    const app = createApp();

    server = app.listen(env.port, () => {
        console.log(`RecallAI API listening on http://localhost:${env.port}`);
    });

    server.on("error", (error) => {
        console.error("HTTP server failed", error);
        void shutdown("server error", 1);
    });
}

process.once("SIGINT", () => void shutdown("SIGINT"));
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("uncaughtException", (error) => {
    console.error("Uncaught exception", error);
    void shutdown("uncaught exception", 1);
});
process.once("unhandledRejection", (reason) => {
    console.error("Unhandled rejection", reason);
    void shutdown("unhandled rejection", 1);
});

start().catch(async (error: unknown) => {
    console.error("Backend startup failed", error);
    await disconnectDatabase().catch(() => undefined);
    process.exitCode = 1;
});
