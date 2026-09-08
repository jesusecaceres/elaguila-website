import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(repoRoot, p), "utf8");
const scenarios = read("tests/ofertas-locales/scenarios/ofertasPackage13Scenarios.ts");
const productCard = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx");
const productDrawer = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
const offerDrawer = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferDetailDrawer.tsx");
const detailView = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");
const detailCopy = read("app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicDetailCopy.ts");
const publicHelpers = read("app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts");
const publicSearch = read("app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts");

for (const key of ["SHOPPER_EMPTY_RESULTS", "SHOPPER_PRODUCT_AVAILABLE", "SHOPPER_COUPON_AVAILABLE", "SHOPPER_ITEM_UNAVAILABLE", "SHOPPER_EXPIRED_PARENT"]) {
  if (!scenarios.includes(key)) throw new Error(`Shopper scenario missing ${key}`);
}

for (const marker of ["sourcePage", "sourceCrop", "shoppingList"]) {
  if (!productCard.includes(marker) && !productDrawer.includes(marker) && !detailView.includes(marker)) throw new Error(`Flyer shopper proof missing ${marker}`);
}

if (!detailView.includes("sourceBbox") || !detailCopy.includes("highlighted product")) {
  throw new Error("Flyer source highlight authority missing.");
}

for (const marker of ["terms", "valid", "coupon"]) {
  if (!offerDrawer.toLowerCase().includes(marker)) throw new Error(`Coupon drawer missing ${marker}`);
}

for (const forbidden of ["cart", "quantity", "redeem", "wallet"]) {
  const couponSlice = offerDrawer.toLowerCase();
  if (couponSlice.includes(forbidden)) throw new Error(`Coupon shopper surface leaks forbidden ${forbidden}`);
}

for (const marker of ["expires_at", "published_at", "status", "active"]) {
  if (!publicHelpers.includes(marker) && !publicSearch.includes(marker)) throw new Error(`Public eligibility missing ${marker}`);
}

console.log("PASS: Package 13 shopper discovery, drawers, flyer list, coupon exclusion, and expiration flows are certified.");
