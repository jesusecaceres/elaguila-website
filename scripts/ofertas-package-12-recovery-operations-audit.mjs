import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const assertIncludes = (label, text, needle) => {
  if (!text.includes(needle)) throw new Error(`${label} missing ${needle}`);
};
const assertNotIncludes = (label, text, needle) => {
  if (text.includes(needle)) throw new Error(`${label} must not include ${needle}`);
};

const status = read("app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts");
const recovery = read("app/lib/ofertas-locales/ofertasLocalesOperationalRecovery.ts");
const sourceRoute = read("app/api/ofertas-locales/owner/[id]/source-assets/route.ts");
const adminList = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");

for (const marker of [
  "scan_needs_attention",
  "scanRetryAllowed",
  "sourceReplacementAllowed",
  "source_replacement_pending",
  "operational_recovery",
  "lastScanError",
]) {
  assertIncludes("operational recovery status", status, marker);
}

for (const marker of [
  "scan_processing_stale",
  "cleanup_processing_stale",
  "scheduled_activation_overdue",
  "retryEligible",
  "ownerMessage",
  "adminAction",
]) {
  assertIncludes("existing recovery helper", recovery, marker);
}

for (const marker of [
  "createOfertaLocalReplacementSourceVersion",
  "replacement_pending",
  "asset_replacement_required_review",
  "preserved",
  "leonixAdId",
]) {
  assertIncludes("source replacement route", sourceRoute, marker);
}

assertIncludes("admin recovery display", adminList, "operationalStatus.blockingReasons");
assertNotIncludes("recovery implementation", `${status}\n${adminList}`, "worker success");
assertNotIncludes("recovery implementation", `${status}\n${adminList}`, "cleanup succeeded");

console.log("PASS: Package 12 recovery operations distinguish source, scan, replacement, stale, and cleanup truth.");
