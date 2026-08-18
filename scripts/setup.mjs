import {
  assertSupportedNodeVersion,
  backendDirectory,
  ensureBackendEnvironment,
  frontendDirectory,
  npmCommand,
  prepareDatabase,
  run,
} from "./project-utils.mjs";

try {
  assertSupportedNodeVersion();

  const environmentStatus = ensureBackendEnvironment();
  if (environmentStatus === "created") {
    console.log("Created backend/.env with a secure, randomly generated JWT secret.");
  } else if (environmentStatus === "updated") {
    console.log("Replaced the missing, insecure, or placeholder JWT secret in backend/.env.");
  } else {
    console.log("Keeping the existing backend/.env file unchanged.");
  }

  console.log("Installing backend dependencies from the lockfile...");
  run(npmCommand, ["ci"], { cwd: backendDirectory });

  console.log("Installing frontend dependencies from the lockfile...");
  run(npmCommand, ["ci"], { cwd: frontendDirectory });

  console.log("Generating the Prisma client and applying database migrations...");
  prepareDatabase();

  console.log("\nSetup complete. Run `npm run dev` to start RecallAI.");
  console.log("Add a valid OPENAI_API_KEY to backend/.env to generate cards from PDFs.");
} catch (error) {
  console.error(`\nSetup failed: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}
