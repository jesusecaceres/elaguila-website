import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const files = execFileSync("git", ["ls-files", "app/api/ofertas-locales", "app/(site)/dashboard/ofertas-locales", "app/admin/(dashboard)/workspace/clasificados/ofertas-locales", "app/lib/ofertas-locales"], { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .filter((file) => /\.(ts|tsx|js|mjs)$/.test(file));

for (const file of files) {
  const text = readFileSync(path.join(repoRoot, file), "utf8");
  for (const forbiddenToken of ["error.stack", "service_role", "rawPrompt", "storageCredential"]) {
    if (text.includes(forbiddenToken)) throw new Error(`Forbidden raw privacy token in ${file}: ${forbiddenToken}`);
  }
  for (const forbidden of [
    /console\.error\([^)]*(service_role|secret|stripe|gemini raw prompt|storage credential)/i,
    /NEXT_PUBLIC_[A-Z0-9_]*SERVICE_ROLE/i,
  ]) {
    if (forbidden.test(text)) throw new Error(`Potential privacy leak in ${file}: ${forbidden}`);
  }
}

const ownerDetail = readFileSync(path.join(repoRoot, "app/(site)/dashboard/ofertas-locales/[id]/page.tsx"), "utf8");
const adminActions = readFileSync(path.join(repoRoot, "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts"), "utf8");
const ownerHelpers = readFileSync(path.join(repoRoot, "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts"), "utf8");

for (const marker of ["sb.auth.getUser", "operationalStatus"]) {
  if (!ownerDetail.includes(marker)) throw new Error(`Owner safe error/correction marker missing ${marker}`);
}

for (const marker of ["confirmed", "confirmation_required", "reviewOfertaLocalAdminAction", "archive"]) {
  if (!adminActions.includes(marker)) throw new Error(`Admin action safety marker missing ${marker}`);
}

for (const marker of ["Never expose raw internal_notes", "parseOfertaLocalOwnerSafeRejectionNote", "internalNotes: _i", "...safe"]) {
  if (!ownerHelpers.includes(marker)) throw new Error(`Owner internal-note privacy projection missing ${marker}`);
}

console.log("PASS: Package 13 error and privacy certification found no raw secret/provider/internal-note exposure.");
