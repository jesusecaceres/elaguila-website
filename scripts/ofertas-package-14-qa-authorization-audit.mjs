import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const doc = readFileSync(path.join(repoRoot, "docs/OFERTAS_PACKAGE_14_QA_AUTHORIZATION_MANIFEST.md"), "utf8");

const required = [
  "integration/ofertas-locales-2026-07",
  "0cfbda4a6a5888457acd93b9d3c78c710dc0f732",
  "Non-Production",
  "Production exclusion",
  "Ordered migration authorization",
  "Supabase project/environment",
  "Gemini",
  "Storage",
  "Stripe",
  "Webhook",
  "Worker",
  "Notification test authorization",
  "Owner test account",
  "Test users",
  "Admin users",
  "Rollback owner",
  "Evidence owner",
  "Defect owner",
  "Stop authority",
  "Owner acceptance authority",
  "No Preview, deployment, Production action",
];

for (const marker of required) {
  if (!doc.includes(marker)) throw new Error(`Authorization manifest missing ${marker}`);
}

for (const forbidden of ["sk_live", "SUPABASE_SERVICE_ROLE_KEY=", "BLOB_READ_WRITE_TOKEN=", "AIza", ".env.local"]) {
  if (doc.includes(forbidden)) throw new Error(`Authorization manifest includes forbidden secret marker ${forbidden}`);
}

console.log("PASS: Package 14 QA authorization manifest is explicit, non-Production, and secret-free.");
