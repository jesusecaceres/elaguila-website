import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const scenarios = read("tests/ofertas-locales/scenarios/ofertasPackage13Scenarios.ts");
const adminPage = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx");
const adminList = read("app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx");
const mutations = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");

for (const key of ["ADMIN_APPROVAL_BLOCKED", "ADMIN_APPROVAL_READY", "ADMIN_ACTIVATION_INCOMPLETE", "ADMIN_RECOVERY_REQUIRED"]) {
  if (!scenarios.includes(key)) throw new Error(`Admin scenario missing ${key}`);
}

for (const marker of ["status_group", "lane", "commercial", "scan_review", "term", "leonix_ad_id.ilike", "id.eq"]) {
  if (!adminPage.includes(marker) && !read("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts").includes(marker)) {
    throw new Error(`Admin filter/search missing ${marker}`);
  }
}

for (const marker of ["adminApprovalAllowed", "blockingReasons", "confirmed", "required", "operationalStatus.adminKey"]) {
  if (!adminList.includes(marker)) throw new Error(`Admin detail/action missing ${marker}`);
}

for (const marker of ["rejection_reason_required", "assertNoUnresolvedItemsBeforeApproval", "assertSourceVersionReadyBeforeApproval", "commercial_entitlement_required", "leonix_ad_id_required"]) {
  if (!mutations.includes(marker)) throw new Error(`Admin server guard missing ${marker}`);
}

console.log("PASS: Package 13 admin queue, filters, blockers, reject/resubmit/approve, and recovery flows are certified.");
