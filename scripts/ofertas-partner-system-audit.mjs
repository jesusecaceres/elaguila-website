import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const migration = read("supabase/migrations/20260801003000_ofertas_locales_partner_analytics_asset_lifecycle.sql");
const partner = read("app/lib/ofertas-locales/ofertasLocalesPartnerOperations.ts");
const adminMutations = read("app/lib/ofertas-locales/ofertasLocalesPartnerAdminMutations.ts");
const publicDetail = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");
const ownerHelpers = read("app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts");
const adminHelpers = read("app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts");

assert.match(migration, /create table if not exists public\.ofertas_local_partner_organizations/i);
assert.match(migration, /verification_status text not null default 'unverified'/i);
assert.match(migration, /operational_status text not null default 'active'/i);
assert.match(migration, /create table if not exists public\.ofertas_local_partner_assignments/i);
assert.match(migration, /courtesy_starts_at timestamptz/i);
assert.match(migration, /courtesy_ends_at timestamptz/i);
assert.match(migration, /badge_enabled boolean not null default false/i);
assert.match(migration, /pickup_visibility_enabled boolean not null default false/i);
assert.match(migration, /create table if not exists public\.ofertas_local_partner_pickup_locations/i);
assert.match(migration, /alter table public\.ofertas_local_partner_organizations enable row level security/i);
assert.match(migration, /alter table public\.ofertas_local_partner_assignments enable row level security/i);

assert.match(partner, /isOfertaLocalVerifiedActivePartner/);
assert.match(partner, /verification_status === "verified"/);
assert.match(partner, /operational_status === "active"/);
assert.match(partner, /isOfertaLocalPartnerAssignmentCurrent/);
assert.match(partner, /courtesy_product_key/);
assert.match(partner, /pickupLocations.*public_status === "active"/s);

assert.match(adminMutations, /setOfertaLocalPartnerVerification/);
assert.match(adminMutations, /setOfertaLocalPartnerOperationalStatus/);
assert.match(adminMutations, /assignOfertaLocalPartnerCourtesy/);
assert.match(adminMutations, /revokeOfertaLocalPartnerAssignment/);
assert.doesNotMatch(ownerHelpers, /self.?verify|customer.?verify/i);
assert.match(ownerHelpers, /commercialEligibilitySource/);
assert.match(adminHelpers, /partnerAssignmentId/);
assert.match(publicDetail, /Verified Leonix magazine partner|badgeLabel|pickupLocations/);

console.log("PASS ofertas-partner-system-audit");
