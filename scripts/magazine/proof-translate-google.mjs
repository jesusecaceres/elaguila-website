import { existsSync } from "node:fs";
import { resolve } from "node:path";

const sourcePdf = resolve(process.cwd(), "proof-input", "magazine", "source.pdf");
const hasGoogleCredentials =
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS) ||
  Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);

if (!existsSync(sourcePdf)) {
  console.log("[magazine proof-translate-google] No source PDF found. Exiting without provider calls.");
  process.exit(0);
}

if (!hasGoogleCredentials) {
  console.log("[magazine proof-translate-google] Provider credentials unavailable. Exiting safely.");
  process.exit(0);
}

console.log("[magazine proof-translate-google] Stub only. Google calls are intentionally disabled in this gate.");
process.exit(0);
