import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};
const assertIncludes = (label, text, needle) => assert(text.includes(needle), `${label} missing ${needle}`);

const file = "app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts";
assert(existsSync(path.join(repoRoot, file)), "canonical operational status model missing");
const status = read(file);

for (const marker of [
  "OfertaLocalOwnerOperationalStatusKey",
  "OfertaLocalAdminOperationalStatusKey",
  "deriveOfertaLocalOperationalStatus",
  "blockingReasons",
  "publicLinkAllowed",
  "sourceReplacementAllowed",
  "scanRetryAllowed",
  "submissionAllowed",
  "adminApprovalAllowed",
  "renewalAllowed",
  "archiveAllowed",
  "getOfertaLocalCommercialProductForOfferType",
  "LEONIX_ID_RE",
  "commercial_entitlement_required",
  "source_replacement_pending",
]) {
  assertIncludes(file, status, marker);
}

for (const ownerState of [
  "source_required",
  "scan_in_progress",
  "scan_needs_attention",
  "review_required",
  "payment_required",
  "changes_requested",
  "published",
  "expired",
  "renewal_scheduled",
  "recovery_required",
]) {
  assertIncludes("owner states", status, ownerState);
}

for (const adminState of [
  "commercially_ineligible",
  "source_missing",
  "scan_unresolved",
  "review_unresolved",
  "approval_blocked",
  "approval_ready",
  "operational_recovery",
]) {
  assertIncludes("admin states", status, adminState);
}

assert(!status.includes("fetch("), "operational model must not fetch");
assert(!status.includes(".from("), "operational model must not query Supabase");
assert(!status.includes(".update("), "operational model must not write state");

console.log("PASS: Package 12 canonical operational status model is present and read-only.");
