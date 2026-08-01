import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql");
const commercial = read("app/lib/ofertas-locales/ofertasLocalesCommercialServer.ts");
const partner = read("app/lib/ofertas-locales/ofertasLocalesPartnerOperations.ts");
const publish = read("app/api/ofertas-locales/publish/route.ts");
const owner = read("app/api/ofertas-locales/owner/[id]/route.ts");
const adminReview = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");

assert.match(migration, /commercial_eligibility_source text not null default 'paid'/);
assert.match(migration, /check \(commercial_eligibility_source in \('paid', 'partner_courtesy'\)\)/);
assert.match(migration, /partner_assignment_id uuid references public\.ofertas_local_partner_assignments/);

assert.match(commercial, /source: "paid"/);
assert.match(commercial, /source: "partner_courtesy"/);
assert.match(commercial, /validateOfertaLocalPartnerCourtesyEligibility/);
assert.match(commercial, /commercial_entitlement_required/);

assert.match(partner, /isOfertaLocalVerifiedActivePartner/);
assert.match(partner, /partner_not_verified/);
assert.match(partner, /stable Leonix Ad ID is required/i);
assert.match(partner, /assignmentMatchesOfertaLocalProduct/);

assert.match(publish, /commercial_eligibility_source = entitlement\.source/);
assert.match(publish, /partner_assignment_id/);
assert.match(owner, /commercial_eligibility_source = entitlement\.source/);
assert.match(adminReview, /validateOfertaLocalPartnerCourtesyEligibility/);
assert.match(adminReview, /commercial_entitlement_required/);
assert.match(adminReview, /calculateOfertaLocalPublicTermExpiresAt\(now\)/);

assert.doesNotMatch(partner, /payment_status:\s*"paid"|stripe_checkout_session_id|stripe_payment_intent_id/);
assert.doesNotMatch(commercial, /partner_courtesy[\s\S]{0,200}payment_status:\s*"paid"/);

console.log("PASS ofertas-courtesy-entitlement-audit");
