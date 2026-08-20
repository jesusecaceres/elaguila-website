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

const constants = read("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
const commercial = read("app/lib/ofertas-locales/ofertasLocalesCommercial.ts");
const status = read("app/lib/ofertas-locales/ofertasLocalesOperationalStatus.ts");
const adminMutation = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
const renewal = read("app/lib/ofertas-locales/ofertasLocalesRenewals.ts");
const ownerRenewal = read("app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerRenewalActionCenter.tsx");

for (const marker of [
  "OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY",
  "OFERTAS_LOCALES_COUPONS_30D_PACKAGE_KEY",
  "OFERTAS_LOCALES_FLYER_PRICE_CENTS",
  "OFERTAS_LOCALES_COUPONS_PRICE_CENTS",
  "OFERTAS_LOCALES_PUBLIC_TERM_DAYS",
]) {
  assertIncludes("constants", constants, marker);
}

for (const marker of [
  "ofertas_locales_flyer_30d",
  "ofertas_locales_coupons_30d",
]) {
  assertIncludes("commercial constants", constants, marker);
}

for (const marker of [
  "amountCents",
  "aiIncluded: true",
  "durationDays",
]) {
  assertIncludes("commercial products", commercial, marker);
}

for (const marker of [
  "product_key_mismatch",
  "product_price_mismatch",
  "commercial_entitlement_required",
  "partner_courtesy",
  "publicLinkAllowed",
]) {
  assertIncludes("operational commercial status", status, marker);
}

assertIncludes("approval starts public term", adminMutation, "parentUpdate.published_at = now");
assertIncludes("approval starts public term", adminMutation, "calculateOfertaLocalPublicTermExpiresAt(now)");
assertIncludes("renewal no-day-loss", renewal, "Math.max(input.approvalTime.getTime(), currentMs)");
assertIncludes("renewal owner truth", ownerRenewal, "Payment or courtesy does not start the 30 days");
assertNotIncludes("commercial status", status, "stripe_checkout_session_id");

console.log("PASS: Package 12 commercial, partner, publication term, and renewal parity is guarded.");
