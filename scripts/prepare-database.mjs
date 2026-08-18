import {
  assertSupportedNodeVersion,
  ensureBackendEnvironment,
  prepareDatabase,
} from "./project-utils.mjs";

try {
  assertSupportedNodeVersion();

  const environmentStatus = ensureBackendEnvironment();
  if (environmentStatus === "created") {
    console.log("Created backend/.env with a secure, randomly generated JWT secret.");
  } else if (environmentStatus === "updated") {
    console.log("Replaced the missing, insecure, or placeholder JWT secret in backend/.env.");
  }

  prepareDatabase();
} catch (error) {
  console.error(
    `Database setup failed: ${error instanceof Error ? error.message : error}`,
  );
  process.exitCode = 1;
}
