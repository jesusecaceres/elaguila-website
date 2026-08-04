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

const ownerRoute = read("app/api/ofertas-locales/owner/[id]/route.ts");
const ownerHelpers = read("app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts");
const adminMutations = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
const ownerDetail = read("app/(site)/dashboard/ofertas-locales/[id]/page.tsx");

for (const marker of [
  ".eq(\"id\", id)",
  ".eq(\"owner_id\", ownerId)",
  "stripForbiddenOwnerUpdateFields",
  "validateOfertaLocalSubmissionEntitlement",
  "ensureOfertaLocalLeonixAdId",
  "forbidden_fields",
]) {
  assertIncludes("owner correction route", ownerRoute, marker);
}

for (const marker of [
  "rejection_reason_required",
  "appendOfertaLocalAdminReviewNote",
  "action === \"reject\"",
  "status: newStatus",
]) {
  assertIncludes("admin rejection mutation", adminMutations, marker);
}

for (const marker of [
  "parseOfertaLocalOwnerSafeRejectionNote",
  "parsed.action === \"reject\"",
  "rejectionNote",
]) {
  assertIncludes("owner-safe rejection reason", ownerHelpers, marker);
}

assertIncludes("owner correction UI", ownerDetail, "Edit and resubmit");
assertIncludes("owner correction UI", ownerDetail, "Guardar y reenviar a revisión");
assertNotIncludes("owner route", ownerRoute, "insert(");
assertNotIncludes("owner route", ownerRoute, "published_at");
assertNotIncludes("owner route", ownerRoute, "expires_at");

console.log("PASS: Package 12 correction/resubmission preserves parent, reason visibility, payment, and term truth.");
