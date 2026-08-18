import { randomBytes } from "node:crypto";
import {
  existsSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

export const projectRoot = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "..",
);
export const backendDirectory = resolve(projectRoot, "backend");
export const frontendDirectory = resolve(projectRoot, "frontend");
export const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

export function assertSupportedNodeVersion() {
  const [major, minor] = process.versions.node.split(".").map(Number);
  const supported =
    (major === 20 && minor >= 19) ||
    (major === 22 && minor >= 12) ||
    major > 22;

  if (!supported) {
    throw new Error(
      `Node.js ${process.versions.node} is not supported. Install Node.js 22.12 or newer, then try again.`,
    );
  }
}

export function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    stdio: "inherit",
    ...options,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} exited with code ${result.status}.`);
  }
}

export function ensureBackendEnvironment() {
  const environmentPath = resolve(backendDirectory, ".env");
  const examplePath = resolve(backendDirectory, ".env.example");
  const environmentExists = existsSync(environmentPath);

  if (!environmentExists && !existsSync(examplePath)) {
    throw new Error("backend/.env.example is missing.");
  }

  let contents = readFileSync(
    environmentExists ? environmentPath : examplePath,
    "utf8",
  );
  const secretMatch = contents.match(/^JWT_SECRET=(.*)$/m);
  const configuredSecret = secretMatch?.[1].trim().replace(/^['"]|['"]$/g, "");
  const needsSecret =
    !configuredSecret ||
    configuredSecret.length < 32 ||
    /^(default_secret|your_jwt|replace|change[-_ ]?me)/i.test(configuredSecret);

  if (needsSecret) {
    const secret = randomBytes(32).toString("hex");
    if (secretMatch) {
      contents = contents.replace(/^JWT_SECRET=.*$/m, `JWT_SECRET=${secret}`);
    } else {
      contents = `${contents.trimEnd()}\nJWT_SECRET=${secret}\n`;
    }
  }

  if (!environmentExists || needsSecret) {
    writeFileSync(environmentPath, contents, { mode: 0o600 });
  }

  if (!environmentExists) return "created";
  if (needsSecret) return "updated";
  return "unchanged";
}

export function prepareDatabase() {
  const prismaPackage = resolve(
    backendDirectory,
    "node_modules",
    "prisma",
    "package.json",
  );

  if (!existsSync(prismaPackage)) {
    throw new Error("Backend dependencies are missing. Run `npm run setup` first.");
  }

  run(npmCommand, ["run", "setup"], {
    cwd: backendDirectory,
  });
}
