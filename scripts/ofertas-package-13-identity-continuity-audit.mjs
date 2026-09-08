import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scenarios = readFileSync(path.join(repoRoot, "tests/ofertas-locales/scenarios/ofertasPackage13Scenarios.ts"), "utf8");
const package10Audit = readFileSync(path.join(repoRoot, "scripts/ofertas-end-to-end-identity-parity-audit.mjs"), "utf8");
const ownerRoute = readFileSync(path.join(repoRoot, "app/api/ofertas-locales/owner/[id]/route.ts"), "utf8");
const renewal = readFileSync(path.join(repoRoot, "app/lib/ofertas-locales/ofertasLocalesRenewals.ts"), "utf8");

for (const marker of [
  "parentId", "leonixAdId", "sourceVersionId", "scanJobId", "childIds",
  "FLYER_RESUBMITTED", "FLYER_RENEWAL_SCHEDULED", "COUPON_CHANGES_REQUESTED",
  "SHOPPER_PRODUCT_AVAILABLE", "SHOPPER_COUPON_AVAILABLE",
]) {
  if (!scenarios.includes(marker)) throw new Error(`Identity scenarios missing ${marker}`);
}

for (const marker of ["parent", "Leonix ID", "source version", "child item", "renewal"]) {
  if (!package10Audit.includes(marker)) throw new Error(`Historical identity audit missing ${marker}`);
}

for (const marker of [".eq(\"id\", id)", ".eq(\"owner_id\", ownerId)", "ensureOfertaLocalLeonixAdId", "validateOfertaLocalSubmissionEntitlement"]) {
  if (!ownerRoute.includes(marker)) throw new Error(`Owner correction identity guard missing ${marker}`);
}

for (const marker of ["oferta_local_id", "leonix_ad_id", "source_asset_version_id", "Math.max(input.approvalTime.getTime(), currentMs)"]) {
  if (!renewal.includes(marker)) throw new Error(`Renewal identity/no-day-loss guard missing ${marker}`);
}

console.log("PASS: Package 13 identity continuity is certified through scenarios and repository guards.");
