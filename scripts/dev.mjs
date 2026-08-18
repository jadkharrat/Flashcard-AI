import { spawn } from "node:child_process";
import {
  assertSupportedNodeVersion,
  backendDirectory,
  frontendDirectory,
  npmCommand,
} from "./project-utils.mjs";

try {
  assertSupportedNodeVersion();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
}

const services = [
  { name: "backend", directory: backendDirectory },
  { name: "frontend", directory: frontendDirectory },
];

let shuttingDown = false;
const children = [];

for (const { name, directory } of services) {
  const child = spawn(npmCommand, ["run", "dev"], {
    cwd: directory,
    detached: false,
    env: process.env,
    stdio: "inherit",
  });

  child.once("error", (error) => {
    console.error(`Could not start the ${name}: ${error.message}`);
    shutdown("SIGTERM", 1);
  });

  child.once("exit", (code, signal) => {
    if (shuttingDown) return;

    const reason = signal ? `signal ${signal}` : `code ${code ?? 1}`;
    console.error(`The ${name} stopped with ${reason}.`);
    shutdown("SIGTERM", code ?? 1);
  });

  children.push(child);
}

function stopChild(child, signal) {
  if (!child.pid || child.exitCode !== null) return;

  try {
    child.kill(signal);
  } catch (error) {
    if (error?.code !== "ESRCH") throw error;
  }
}

function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children) {
    stopChild(child, signal);
  }

  process.exitCode = exitCode;
}

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));
process.once("SIGHUP", () => shutdown("SIGHUP"));
process.once("exit", () => {
  for (const child of children) {
    stopChild(child, "SIGTERM");
  }
});
