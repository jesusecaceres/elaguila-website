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

const page = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx");
const list = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");
const actions = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts");
const helpers = read("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts");

for (const marker of [
  "status_group",
  "lane",
  "commercial",
  "scan_review",
  "term",
  "operationalStatus.adminKey",
  "leonix_ad_id.ilike",
]) {
  assertIncludes("admin queue filters/search", `${page}\n${helpers}`, marker);
}

for (const marker of [
  "operationalStatus.adminLabelEs",
  "operationalStatus.blockingReasons",
  "adminApprovalAllowed",
  "confirmed",
  "required",
  "OfertasLocalesAdminAiItemReviewSection",
]) {
  assertIncludes("admin review UI", list, marker);
}

for (const marker of [
  "confirmation_required",
  "confirmed",
  "mutateOfertaLocalAdminReview",
  "rejection_reason_required",
]) {
  assertIncludes("admin action safety", actions, marker);
}

assertNotIncludes("admin UI", list, "SUPABASE_SERVICE_ROLE_KEY");
assertNotIncludes("admin UI", list, "stripe_checkout_session_id");

console.log("PASS: Package 12 admin queue/detail validates filters, blockers, confirmation, and safe review actions.");
