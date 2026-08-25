import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
const constants = read("app/lib/ofertas-locales/ofertasLocalesConstants.ts");
const appHelpers = read("app/lib/ofertas-locales/ofertasLocalesApplicationHelpers.ts");
const application = read("app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx");

assert.match(matrix, /ofertas_locales_flyer_30d/);
assert.match(matrix, /priceCents:\s*39900/);
assert.match(matrix, /durationDays:\s*30/);
assert.match(matrix, /AI extraction\/review, searchable products, flyer page, product cards, and shopping list included/);
assert.match(matrix, /ofertas_locales_coupons_30d/);
assert.match(matrix, /priceCents:\s*19900/);
assert.match(matrix, /AI extraction\/review and public coupon result\/detail included/);
assert.match(matrix, /billingMode:\s*"one_time"/);
assert.match(matrix, /stripeEligible:\s*true/);

assert.match(constants, /OFERTAS_LOCALES_FLYER_PRICE_CENTS\s*=\s*39900/);
// Owner lock 2026-08-25 (Package 4): OFERTAS_LOCALES_COUPONS_PRICE_CENTS (19900) is now
// historical-only — see OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY for current new-sale truth.
assert.match(constants, /OFERTAS_LOCALES_COUPONS_PRICE_CENTS\s*=\s*19900/);
assert.match(constants, /OFERTAS_LOCALES_PUBLIC_TERM_DAYS\s*=\s*30/);
assert.match(constants, /OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY\s*=\s*"ofertas_locales_coupons_free"/);
assert.match(constants, /revenuePackageKey:\s*OFERTAS_LOCALES_FLYER_30D_PACKAGE_KEY/);
assert.match(constants, /revenuePackageKey:\s*OFERTAS_LOCALES_COUPONS_FREE_PACKAGE_KEY/);

assert.match(appHelpers, /AI scan\/review is included with both publish products/);
assert.match(appHelpers, /Single complete-package display price \(no AI add-on arithmetic\)/);
assert.doesNotMatch(application, /\$598|\+199 AI|\+\$199 AI|manual package|basic package|non-AI package/i);

console.log("PASS ofertas-commercial-products-audit");
