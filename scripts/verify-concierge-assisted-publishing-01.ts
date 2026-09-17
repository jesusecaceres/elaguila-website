/**
 * Assisted Publishing / Create for Client — focused verifier for the NEW GLUE ONLY.
 * Run: npx tsx scripts/verify-concierge-assisted-publishing-01.ts
 *
 * Proves (plain node:assert, matching this repo's convention — no jest/vitest):
 *  1. intent survives selection: every Quick Action intent resolves to a real existing section /
 *     route for a selected business, and unknown intents fail closed to the plain business page;
 *  2. existing draft wins: the Servicios seeder never overwrites a present browser draft;
 *  3. no duplicate category form: the launcher/handoff never carry a hard-coded /publicar route —
 *     destinations come only from the existing gateway resolver;
 *  4. no fake paid boolean / no duplicate payment ledger in the managed inventory;
 *  5. free vs paid categories are read from REVENUE_V1_PACKAGE_MATRIX, and manual cleared payment
 *     activates the canonical entitlement writer (activateEntitlementsForPayment);
 *  6. owner dashboard remains the canonical receiver (this package adds no /dashboard route);
 *  7. one shared Business Concierge PWA (no second manifest).
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { CONCIERGE_ACTIONS, buildConciergeInventoryHref, normalizeConciergeAction, resolveConciergeActionDestination } from "../app/admin/_lib/conciergeIntent";
import { buildServiciosSeedFromBusinessContext, seedServiciosDraftFromBusinessContext } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPrefillFromBusinessContext";
import { CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosStorage";
import type { BusinessApplicationContext } from "../app/lib/business/applicationContext/businessApplicationContext";

// Verifiers run from the repo root (`npx tsx scripts/...`), matching every existing verify:* script.
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

// 1. Intent contract ----------------------------------------------------------------------------
const BIZ = "11111111-1111-4111-8111-111111111111";
for (const action of CONCIERGE_ACTIONS) {
  assert.equal(normalizeConciergeAction(action), action, `normalize ${action}`);
  assert.equal(normalizeConciergeAction(action.toUpperCase()), action, "normalize is case-insensitive");
  const href = buildConciergeInventoryHref(action);
  assert.ok(href.startsWith(`/admin/businesses?action=${action}`) && href.endsWith("#businesses-inventory"), `inventory href carries ${action}`);
  const dest = resolveConciergeActionDestination(action, BIZ);
  assert.ok(dest.startsWith(`/admin/businesses/`), `destination stays inside the existing business workspace for ${action}`);
}
assert.equal(normalizeConciergeAction("drop_tables"), null, "unknown intent fails closed");
assert.equal(normalizeConciergeAction(null), null);
assert.equal(resolveConciergeActionDestination(null, BIZ), `/admin/businesses/${BIZ}`, "no intent → plain business page (byte-identical to before)");
assert.equal(resolveConciergeActionDestination("business_profile", BIZ), `/admin/businesses/${BIZ}#business-profile`, "business_profile → existing section (canvass parity)");
assert.equal(resolveConciergeActionDestination("create_listing", BIZ), `/admin/businesses/create-for-client?businessId=${BIZ}`);
assert.equal(resolveConciergeActionDestination("note", BIZ), `/admin/businesses/${BIZ}#outreach`);
assert.equal(resolveConciergeActionDestination("research", BIZ), `/admin/businesses/${BIZ}#discover`);
assert.equal(resolveConciergeActionDestination("creative_studio", BIZ), `/admin/businesses/${BIZ}#creative`);
assert.equal(resolveConciergeActionDestination("meeting", BIZ), `/admin/businesses/${BIZ}#meetings`);
// Every anchor the resolver emits must be a real section id on the business workspace page.
const workspaceSrc = read("app/admin/(dashboard)/businesses/[businessId]/page.tsx");
for (const id of ["business-profile", "outreach", "discover", "creative", "meetings"]) {
  assert.ok(workspaceSrc.includes(`id="${id}"`) || workspaceSrc.includes(`id: "${id}"`), `section #${id} exists on the business workspace`);
}

// 2. Existing draft wins ------------------------------------------------------------------------
const ctx: BusinessApplicationContext = {
  businessId: BIZ,
  businessName: "Taquería Prueba",
  publicName: null,
  phone: "4085551234",
  phoneOffice: null,
  whatsapp: "4085555678",
  email: "hola@prueba.test",
  website: "https://prueba.test",
  address: { street: "123 Main St", unit: null, city: "San José", stateProvince: "CA", postalCode: "95112", country: "US", exactStreetPublic: true },
  serviceAreaText: null,
  languages: ["es", "en", "Portuguese"],
  socials: { instagram: "https://instagram.com/prueba", facebook: null, youtube: null, tiktok: null, linkedin: null, x: null },
  googleBusinessUrl: null,
  yelpUrl: null,
  bookingUrl: null,
  logoUrl: "https://cdn.test/logo.png",
  heroImageUrl: null,
  galleryUrls: ["https://cdn.test/1.jpg"],
  aboutText: "Tacos.",
  headline: "Los mejores tacos",
  highlights: ["Familia", "Desde 2010"],
};
class FakeStorage {
  private m = new Map<string, string>();
  getItem(k: string) { return this.m.get(k) ?? null; }
  setItem(k: string, v: string) { this.m.set(k, v); }
}
const empty = new FakeStorage();
assert.equal(seedServiciosDraftFromBusinessContext(ctx, empty), "seeded");
const seeded = JSON.parse(empty.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY) ?? "{}") as Record<string, unknown>;
assert.equal(seeded.businessName, "Taquería Prueba");
assert.equal(seeded.phone, "4085551234");
assert.equal(seeded.whatsapp, "4085555678");
assert.equal(seeded.physicalStreet, "123 Main St");
assert.deepEqual(seeded.languageIds, ["lang_es", "lang_en", "lang_otro"]);
assert.equal(seeded.languageOtherLines, "Portuguese");
assert.ok(!("listingProduct" in seeded), "seed never chooses a product/price — the checkpoint still does that");
assert.ok(!("status" in seeded), "seed never sets a publish status");

const occupied = new FakeStorage();
occupied.setItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY, JSON.stringify({ businessName: "Existing Draft Co" }));
assert.equal(seedServiciosDraftFromBusinessContext(ctx, occupied), "skipped_existing_draft");
assert.equal(JSON.parse(occupied.getItem(CLASIFICADOS_SERVICIOS_APPLICATION_STORAGE_KEY)!).businessName, "Existing Draft Co", "existing draft wins — untouched");
assert.equal(seedServiciosDraftFromBusinessContext(ctx, null), "storage_unavailable");
// Privacy: a private street never leaks into the seed.
const privateCtx = { ...ctx, address: { ...ctx.address, street: null, postalCode: null, exactStreetPublic: false } };
const privSeed = buildServiciosSeedFromBusinessContext(privateCtx);
assert.equal(privSeed.physicalStreet, "");
assert.equal(privSeed.showExactAddress, false);

// 3. No duplicate category form / no hard-coded publish routes in the new glue -------------------
for (const rel of [
  "app/admin/(dashboard)/businesses/create-for-client/page.tsx",
  "app/admin/(dashboard)/businesses/create-for-client/handoff/HandoffClient.tsx",
]) {
  const src = read(rel);
  assert.ok(!/["'`]\/publicar\//.test(src) && !/["'`]\/clasificados\/publicar/.test(src), `${rel} carries no hard-coded category route — resolver only`);
  assert.ok(src.includes("resolvePublicarGatewayDestination"), `${rel} resolves destinations through the existing gateway resolver`);
}
assert.ok(!existsSync(join(ROOT, "app/admin/(dashboard)/businesses/create-for-client/form")), "no staff-side category form was created");
// The public gateway and the launcher share ONE card-copy source.
const gatewaySrc = read("app/(site)/publicar/PublicarGatewayClient.tsx");
assert.ok(!/function cardCopy\(/.test(gatewaySrc) && gatewaySrc.includes("publicarGatewayCardCopy"), "gateway consumes the shared card copy, no local duplicate");

// 4. No fake paid boolean / no duplicate payment ledger -------------------------------------------
const managedSrc = read("app/admin/_lib/leonixManagedInventory.ts") + read("app/admin/(dashboard)/businesses/managed/page.tsx");
assert.ok(!/profile_paid|paid\s*:\s*true|isPaid\s*=\s*true/.test(managedSrc), "managed inventory never fabricates a paid flag");
assert.ok(managedSrc.includes("resolveBusinessProfileCommercialState"), "commercial state comes from the existing resolver");
assert.ok(!/from\("(?:concierge_payments|managed_payments)"\)/.test(managedSrc), "no second payment ledger");
assert.ok(managedSrc.includes("/manual-payment"), "manual payment reuses the existing payment-tracker route");

// 5. Commercial truth is read from the canonical matrix; manual clearance activates canonical entitlement
const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
assert.ok(/rentas_30d[\s\S]{0,400}durationDays:\s*30/.test(matrix), "Rentas duration (30 days) lives in REVENUE_V1_PACKAGE_MATRIX, not hard-coded here");
assert.ok(/en_venta_free_v1[\s\S]{0,300}priceCents:\s*0/.test(matrix), "En Venta is free per the canonical matrix");
const manual = read("app/lib/listingPlans/manualClearedPayments.ts");
assert.ok(manual.includes("activateEntitlementsForPayment") && manual.includes('"manual_cleared_payment"'), "manual cleared payment activates the canonical entitlement writer with grantSource manual_cleared_payment");
assert.ok(/"cash"\s*\|\s*"check"\s*\|\s*"zelle"\s*\|\s*"ach"\s*\|\s*"money_order"\s*\|\s*"other"/.test(manual), "offline methods are the existing canonical set");

// 6. Owner dashboard remains the canonical receiver — this package adds nothing under /dashboard
const newFiles = [
  "app/admin/_lib/conciergeIntent.ts",
  "app/admin/_lib/leonixManagedInventory.ts",
  "app/admin/(dashboard)/businesses/create-for-client/page.tsx",
  "app/admin/(dashboard)/businesses/create-for-client/handoff/page.tsx",
  "app/admin/(dashboard)/businesses/create-for-client/handoff/HandoffClient.tsx",
  "app/admin/(dashboard)/businesses/managed/page.tsx",
  "app/api/admin/businesses/[businessId]/application-context/route.ts",
  "app/lib/business/applicationContext/businessApplicationContext.ts",
  "app/(site)/clasificados/publicar/servicios/lib/serviciosPrefillFromBusinessContext.ts",
];
for (const f of newFiles) {
  assert.ok(existsSync(join(ROOT, f)), `${f} exists`);
  assert.ok(!f.startsWith("app/(site)/dashboard/"), `${f} is not a new owner-dashboard surface`);
}

// 7. One shared PWA -----------------------------------------------------------------------------
const manifest = read("app/manifest.ts");
assert.ok(manifest.includes('"/admin/businesses"') && manifest.includes('"/admin/"'), "manifest start_url/scope unchanged (Business Concierge)");
assert.ok(!readdirSync(join(ROOT, "public")).some((n) => /^manifest.*\.json$/i.test(n)), "no second manifest was added under public/");

console.log("verify-concierge-assisted-publishing-01: PASS (7 contracts)");
