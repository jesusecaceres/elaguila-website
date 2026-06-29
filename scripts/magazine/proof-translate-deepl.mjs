import { existsSync } from "node:fs";
import { resolve } from "node:path";

const sourcePdf = resolve(process.cwd(), "proof-input", "magazine", "source.pdf");

if (!existsSync(sourcePdf)) {
  console.log("[magazine proof-translate-deepl] No source PDF found. Exiting without provider calls.");
  process.exit(0);
}

if (!process.env.DEEPL_AUTH_KEY) {
  console.log("[magazine proof-translate-deepl] Provider credentials unavailable. Exiting safely.");
  process.exit(0);
}

console.log("[magazine proof-translate-deepl] Stub only. DeepL calls are intentionally disabled in this gate.");
process.exit(0);
