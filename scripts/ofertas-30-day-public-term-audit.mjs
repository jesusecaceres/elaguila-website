/**
 * Package 4B — Ofertas/Cupones canonical 30-day public term audit.
 * Run: node scripts/ofertas-30-day-public-term-audit.mjs
 */
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");
const exists = (relativePath) => fs.existsSync(path.join(root, relativePath));
const sha256 = (relativePath) => createHash("sha256").update(read(relativePath)).digest("hex");

const files = {
  constants: "app/lib/ofertas-locales/ofertasLocalesConstants.ts",
  formatting: "app/lib/ofertas-locales/ofertasLocalesFormatting.ts",
  dbSchema: "app/lib/ofertas-locales/ofertasLocalesDbSchema.ts",
  adminMutations: "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts",
  publishRoute: "app/api/ofertas-locales/publish/route.ts",
  publicOffersRoute: "app/api/ofertas-locales/public-offers/route.ts",
  publicSearchRoute: "app/api/ofertas-locales/public-search/route.ts",
  publicOfferHelpers: "app/lib/ofertas-locales/ofertasLocalesPublicOfferHelpers.ts",
  publicSearchHelpers: "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts",
  publicDetailHelpers: "app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers.ts",
  ownerHelpers: "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts",
  ownerList: "app/(site)/dashboard/ofertas-locales/page.tsx",
  ownerDetail: "app/(site)/dashboard/ofertas-locales/[id]/page.tsx",
  adminHelpers: "app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts",
  adminList: "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx",
  migration: "supabase/migrations/20260731222500_ofertas_locales_30_day_public_term.sql",
  package4aDoc: "docs/OFERTAS_GEMINI_PROVIDER_MIGRATION_PACKAGE_4A.md",
  package4aAudit: "scripts/ofertas-gemini-provider-migration-audit.mjs",
  package4aMigration: "supabase/migrations/20260731214500_allow_gemini_multimodal_oferta_local_scan_jobs_provider.sql",
};

for (const file of Object.values(files)) {
  assert.ok(exists(file), `required file exists: ${file}`);
}

const src = Object.fromEntries(Object.entries(files).map(([key, file]) => [key, read(file)]));

assert.equal(sha256(files.package4aDoc), "f5aafa6595724381d728d75f0b0496d869683199dcf493c36f4b8c9a6d30235b", "Package 4A note hash preserved");
assert.equal(sha256(files.package4aAudit), "6cdb06b9752745236eaad504551da8ce780be27b2f3c9a0fdf9e4d5cd116420b", "Package 4A audit hash preserved");
assert.equal(sha256(files.package4aMigration), "e639c34918ba3ef83db0b85bb728f239fb1ce6e8f81cdec76213d9f9f4d69e7a", "Package 4A migration hash preserved");

assert.match(src.constants, /OFERTAS_LOCALES_PUBLIC_TERM_DAYS\s*=\s*30/, "duration is 30 days");
assert.match(src.formatting, /calculateOfertaLocalPublicTermExpiresAt[\s\S]*durationDays \* 24 \* 60 \* 60 \* 1000/, "expiration is activation timestamp plus duration days");
assert.match(src.formatting, /isOfertaLocalPublicTermActive[\s\S]*published\.getTime\(\) <= now\.getTime\(\)[\s\S]*now\.getTime\(\) < expires\.getTime\(\)/, "public term requires activation and non-expired expiration");

assert.match(src.migration, /alter table public\.ofertas_locales[\s\S]*add column if not exists published_at timestamptz/i, "migration ensures activation timestamp");
assert.match(src.migration, /alter table public\.ofertas_locales[\s\S]*add column if not exists expires_at timestamptz/i, "migration adds expiration timestamp");
assert.match(src.migration, /create index if not exists ofertas_locales_public_term_active_idx/i, "migration adds scoped public-term index");
assert.doesNotMatch(src.migration, /\bupdate\b|\bdelete\b|\binsert\b/i, "migration performs no row mutation");
assert.doesNotMatch(src.migration, /row level security|create policy|drop policy|alter policy/i, "migration does not weaken RLS or policies");
assert.doesNotMatch(src.migration, /stripe|checkout|webhook|entitlement|packageEntitlement/i, "migration does not touch payment schema");

assert.match(src.adminMutations, /assertNoUnresolvedItemsBeforeApproval/, "approval confirms unresolved review is complete");
assert.match(src.adminMutations, /parentUpdate\.published_at = now/, "approval records activation timestamp");
assert.match(src.adminMutations, /parentUpdate\.expires_at = calculateOfertaLocalPublicTermExpiresAt\(now\)/, "approval sets 30-day expiration");
assert.match(src.adminMutations, /\.eq\("status", current\)[\s\S]*\.maybeSingle\(\)/, "approval is guarded against stale repeated transitions");
assert.match(src.adminMutations, /published_at: \(row as OfertaLocalAdminRow\)\.published_at \?\? null[\s\S]*expires_at: \(row as OfertaLocalAdminRow\)\.expires_at \?\? null/, "failure rollback preserves activation and expiration history");
assert.doesNotMatch(src.publishRoute, /published_at|expires_at|calculateOfertaLocalPublicTermExpiresAt/, "submission does not start public term");
const rejectionPreTransition = src.adminMutations.slice(
  src.adminMutations.indexOf('if (action === "reject" &&'),
  src.adminMutations.indexOf("const newStatus = targetStatusForAction")
);
assert.doesNotMatch(rejectionPreTransition, /published_at|expires_at|calculateOfertaLocalPublicTermExpiresAt/, "rejection does not start public term");

assert.match(src.publicOffersRoute, /\.not\("published_at", "is", null\)[\s\S]*\.not\("expires_at", "is", null\)[\s\S]*\.gt\("expires_at", new Date\(\)\.toISOString\(\)\)/, "parent public query excludes expired/incomplete term");
assert.match(src.publicSearchRoute, /\.not\("ofertas_locales\.published_at", "is", null\)[\s\S]*\.gt\("ofertas_locales\.expires_at", now\)/, "child public query requires non-expired parent");
assert.match(src.publicOfferHelpers, /isOfertaLocalPublicTermActive\(row\.published_at, row\.expires_at, now\)/, "public offer helper requires active parent term");
assert.match(src.publicSearchHelpers, /isOfertaLocalPublicTermActive\(parent\.published_at, parent\.expires_at, now\)/, "public item helper requires active parent term");
assert.match(src.publicDetailHelpers, /\.gt\("expires_at", now\)[\s\S]*mapOfertaLocalPublicDetailRowToDetail/, "public detail fetch requires non-expired parent");

assert.match(src.publicOfferHelpers, /OFERTAS_LOCALES_COUPON_PROMOTION_OFFER_TYPES[\s\S]*isOfertaLocalActiveByDates\(row\.valid_from, row\.valid_until, now\)/, "coupon validity can end earlier than parent term");
assert.match(src.publicSearchHelpers, /const validUntil = itemUntil \|\| parent\.valid_until[\s\S]*!isOfertaLocalExpired\(validUntil, now\)/, "item validity cannot extend public item visibility");

assert.match(src.ownerHelpers, /publicResultsHrefForStatus\(row\.status, isExpired \|\| !termActive\)/, "owner public link is eligibility-aware");
assert.match(src.ownerHelpers, /publicTermStatus[\s\S]*publicTermDaysRemaining/, "owner model exposes truthful term state");
assert.match(src.ownerDetail, /publicTermTitle[\s\S]*publicTermStatus[\s\S]*publicTermDaysRemaining/, "owner detail displays truthful expiration");
assert.match(src.ownerList, /colPublicTerm[\s\S]*publicTermStatus[\s\S]*publicTermDaysRemaining/, "owner list displays truthful expiration");
assert.match(src.adminHelpers, /publicTermStatus[\s\S]*publicTermDaysRemaining/, "admin model exposes public term status");
assert.match(src.adminList, /publicTermLabel[\s\S]*Activación incompleta/, "admin displays activation completeness");
assert.match(src.adminList, /publicTermLabel[\s\S]*Expirado/, "admin displays expiration");
assert.doesNotMatch(`${src.ownerList}\n${src.ownerDetail}\n${src.adminList}`, /renew.*onClick|republish.*onClick|extend.*term|fake renewal/i, "no fake renewal or extension action");

assert.doesNotMatch(`${src.adminMutations}\n${src.publishRoute}\n${src.migration}`, /stripe|checkout|webhook|payment_status|entitlement/i, "Package 4B does not implement payment");
assert.doesNotMatch(`${src.adminMutations}\n${src.publicOffersRoute}\n${src.publicSearchRoute}`, /createClient|execute_sql|supabase db|migration up|db push/i, "audit target files do not connect to databases or apply migrations");

console.log("Package 4B 30-day public term audit passed.");
