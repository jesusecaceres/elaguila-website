import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");

const publish = read("app/api/ofertas-locales/publish/route.ts");
const ownerRoute = read("app/api/ofertas-locales/owner/[id]/route.ts");
const ownerHelpers = read("app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts");
const server = read("app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts");
const adminMutation = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
const package4bAudit = read("scripts/ofertas-30-day-public-term-audit.mjs");

assert.match(publish, /canonical_parent_required/);
assert.doesNotMatch(publish, /\.insert\(row\)/);
assert.match(publish, /validateOfertaLocalSubmissionEntitlement/);
assert.match(publish, /ensureOfertaLocalLeonixAdId/);
assert.match(publish, /ai_review_incomplete/);
assert.match(publish, /parentMatchesDraftLane/);

assert.match(ownerRoute, /validateOfertaLocalSubmissionEntitlement/);
assert.match(ownerRoute, /ensureOfertaLocalLeonixAdId/);
assert.match(ownerHelpers, /"rejected"/);
assert.match(ownerHelpers, /checkoutEligible/);

assert.match(server, /paid_entitlement_required/);
assert.match(server, /paid_entitlement_invalid/);
assert.match(server, /listing_package_entitlements/);
assert.match(server, /leonix_payment_records/);
assert.match(server, /payment\.owner_user_id !== input\.ownerId/);
assert.match(server, /Number\(payment\.amount_total_cents/);
assert.match(server, /isPaymentCleared\(payment\.payment_status\)/);

assert.match(adminMutation, /paid_entitlement_required/);
assert.match(adminMutation, /leonix_ad_id_required/);
assert.match(adminMutation, /parentUpdate\.published_at = now/);
assert.match(adminMutation, /calculateOfertaLocalPublicTermExpiresAt\(now\)/);
assert.match(package4bAudit, /submission\/payment paths do not start the public term/);
assert.match(package4bAudit, /approval remains the only public term activation/);

console.log("PASS ofertas-commercial-submission-gate-audit");
