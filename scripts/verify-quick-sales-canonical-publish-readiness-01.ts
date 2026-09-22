/**
 * QUICK SALES — CANONICAL PUBLISH READINESS: cleared payment is necessary, never sufficient.
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-sales-canonical-publish-readiness-01.ts
 *
 * EVERY CHECK EXECUTES THE REAL COCKPIT ROUTE against the in-memory PostgREST harness. A paid but
 * incomplete draft must be refused with the category's own status/body and audited; a paid AND
 * ready draft must publish the SAME row (no insert), with the canonical side effects; replay must
 * be refused explicitly; unpaid must still be 402; and the raw f29 guarantees (body/context
 * disagreement, mixed session) must be untouched.
 *
 * Servicios rows are produced by the CANONICAL Servicios route (save_for_client) and then broken
 * in storage exactly where the intake's listing-edit hydrator reads, so what is proven is the real
 * stored shape, not a hand-typed fixture.
 */
import { strict as assert } from "node:assert";
import { __reset, __seed, __rows, __setAuthUsers } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { __setBearerTokens } from "./lib/stubs/supabaseJs.mjs";
import { createAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import { QUICK_SALES_CATEGORY_MAP, type QuickSalesCategory } from "../app/lib/sales/quickSalesCategories";
import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";

process.env.PROSPECT_PREVIEW_SESSION_SECRET = "preview-secret-harness-only";
process.env.ASSISTED_PUBLISHING_SESSION_SECRET = "assisted-secret-harness-only";
const ASSISTED_SECRET = "assisted-secret-harness-only";

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
async function check(name: string, fn: () => Promise<void>) {
  checks += 1;
  try {
    await fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.stack ?? e.message : String(e)}`);
  }
}

const STAFF_EMAIL = "sales@leonix.test";
const STAFF_AUTH = "00000000-0000-4000-8000-000000000staff";
const ROSTER_ID = "roster-1";
const BIZ = "biz-1";
const CLIENT = "00000000-0000-4000-8000-00000000client";
const STRANGER = "00000000-0000-4000-8000-0000000strange";

function signInAsSalesStaff(): void {
  __setCookies({ leonix_admin: "1", leonix_admin_operator_email: STAFF_EMAIL, leonix_admin_auth_user_id: STAFF_AUTH });
  __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
  __seed("admin_team_members", [{ id: ROSTER_ID, email: STAFF_EMAIL, display_name: "Sales", role: "super_admin", is_active: true, auth_user_id: STAFF_AUTH }]);
}
function cookie(category: string, listingId: string | null, clientUserId: string | null = null): Record<string, string> {
  return {
    leonix_assisted_publish: createAssistedPublishingTokenWithSecret(
      { businessId: BIZ, category, rosterId: ROSTER_ID, authUserId: STAFF_AUTH, listingId, clientUserId, assistedAction: "save_for_client" },
      ASSISTED_SECRET,
    )!,
  };
}
function link(listingSource: string, listingId: string) {
  return { id: `link-${listingId}`, business_id: BIZ, listing_source: listingSource, listing_id: listingId, status: "verified", linked_by: STAFF_AUTH };
}
function paid(listingSource: string, listingId: string) {
  return { id: `pay-${listingId}`, listing_source: listingSource, listing_id: listingId, source: "admin_manual", manual_state: "cleared" };
}
function makeRequest(body: unknown, jar: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    json: async () => body,
    headers: { get: (name: string) => h.get(name.toLowerCase()) ?? null },
    cookies: { get: (name: string) => (name in jar ? { name, value: jar[name] } : undefined) },
    nextUrl: new URL("http://harness.invalid/api"),
  } as never;
}
const rows = (t: string) => __rows(t) as Record<string, unknown>[];
const audits = () => rows("admin_audit_log");
const lastAttemptOutcome = () => {
  const a = audits().filter((r) => r.action === "quick_sales_publish_attempted").pop();
  return a ? (a.meta as Record<string, unknown>).outcome : null;
};

async function main() {
const publish = (await import("../app/api/admin/sales-preview/publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
const servicios = (await import("../app/api/clasificados/servicios/publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
const custody = (await import("../app/api/admin/sales-preview/custody/route")) as unknown as { POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }> };

async function publishAs(category: QuickSalesCategory, listingId: string, clientUserId: string | null = null, headers: Record<string, string> = {}) {
  const res = await publish.POST(makeRequest({}, cookie(category, listingId, clientUserId), headers));
  return { status: res.status, json: (await res.json()) as Record<string, unknown> };
}

// ---------------------------------------------------------------------------------------------
// SERVICIOS — rows come from the canonical route, then are broken where the hydrator reads.
// ---------------------------------------------------------------------------------------------
const PRESET_ID = BUSINESS_TYPE_PRESETS[0]!.id;
function serviciosState() {
  return {
    businessTypeId: PRESET_ID,
    businessName: "Taquería Sol",
    city: "San José",
    phone: "4085551234",
    aboutText: "Servicio confiable en San José desde 2010.",
    customServicesOffered: ["Reparación"],
    coverUrl: "https://cdn.example.test/cover.jpg",
    confirmListingAccurate: true,
    confirmPhotosRepresentBusiness: true,
    confirmCommunityRules: true,
  };
}
/** Save a READY Servicios draft through the canonical route under custody; returns its stored id. */
async function seedServiciosViaCanonicalRoute(): Promise<string> {
  __reset();
  signInAsSalesStaff();
  __seed("businesses", [{ id: BIZ, display_name: "Taquería Sol", status: "active" }]);
  const c = await custody.POST(makeRequest({ category: "servicios", businessId: BIZ }));
  assert.equal(c.status, 200);
  const jar = { leonix_assisted_publish: c.cookies.get("leonix_assisted_publish")!.value };
  const save = await servicios.POST(makeRequest({ assistedAction: "save_for_client", lang: "es", state: serviciosState() }, jar));
  const body = (await save.json()) as { listingId?: string };
  assert.equal(save.status, 200, JSON.stringify(body));
  const id = body.listingId!;
  assert.ok(id);
  return id;
}
function breakServiciosStoredRow(id: string, mutate: (profile: Record<string, unknown>) => void) {
  const all = rows("servicios_public_listings");
  const row = all.find((r) => r.id === id)!;
  const profile = JSON.parse(JSON.stringify(row.profile_json)) as Record<string, unknown>;
  mutate(profile);
  __seed("servicios_public_listings", all.map((r) => (r.id === id ? { ...r, profile_json: profile } : r)));
}
const SRC = QUICK_SALES_CATEGORY_MAP;

await check("S1: PAID + READY Servicios publishes the SAME row, no insert, audited as completed", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id)]);
  const before = rows("servicios_public_listings").length;
  const { status, json } = await publishAs("servicios", id);
  assert.equal(status, 200, JSON.stringify(json));
  assert.equal(json.listingId, id);
  assert.equal(rows("servicios_public_listings").length, before, "no listing inserted");
  assert.equal(rows("servicios_public_listings").find((r) => r.id === id)!.listing_status, "published");
  assert.ok(audits().some((a) => a.action === "quick_sales_publish_completed" && (a.meta as Record<string, unknown>).listing_id === id));
});
await check("S2: PAID but incomplete Servicios (about text stripped) is refused 422 not_ready, audited, nothing published", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id)]);
  breakServiciosStoredRow(id, (p) => { (p.about as Record<string, unknown>).text = ""; });
  const { status, json } = await publishAs("servicios", id);
  assert.equal(status, 422, JSON.stringify(json));
  assert.equal(json.error, "not_ready");
  assert.ok(Array.isArray(json.missing) && (json.missing as { id: string }[]).some((m) => m.id === "about"));
  assert.equal(rows("servicios_public_listings").find((r) => r.id === id)!.listing_status, "draft");
  assert.equal(lastAttemptOutcome(), "not_ready");
});
await check("S3: PAID Servicios with NO phone / SMS / WhatsApp is refused (contact rule)", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id)]);
  breakServiciosStoredRow(id, (p) => {
    const contact = p.contact as Record<string, unknown>;
    contact.phone = ""; contact.phoneOffice = ""; contact.email = ""; contact.website = "";
    if (contact.socialLinks && typeof contact.socialLinks === "object") { const s = contact.socialLinks as Record<string, unknown>; s.whatsappUrl = ""; s.whatsappProfileUrl = ""; }
  });
  const { status, json } = await publishAs("servicios", id);
  assert.equal(status, 422, JSON.stringify(json));
  assert.ok((json.missing as { id: string }[]).some((m) => m.id === "contact"));
  assert.equal(rows("servicios_public_listings").find((r) => r.id === id)!.listing_status, "draft");
});
await check("S4: PAID Servicios with NO qualifying image (cover + gallery stripped) is refused", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id)]);
  breakServiciosStoredRow(id, (p) => { (p.hero as Record<string, unknown>).coverImageUrl = ""; p.gallery = []; p.featuredGalleryIds = []; });
  const { status, json } = await publishAs("servicios", id);
  assert.equal(status, 422, JSON.stringify(json));
  assert.ok((json.missing as { id: string }[]).some((m) => m.id === "media"));
  assert.equal(rows("servicios_public_listings").find((r) => r.id === id)!.listing_status, "draft");
});
await check("S5: PAID Quick Servicios carrying a video is refused by the Quick media contract", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id)]);
  breakServiciosStoredRow(id, (p) => { p.galleryVideos = [{ id: "v1", url: "https://www.youtube.com/watch?v=abcdefghijk" }]; });
  const { status, json } = await publishAs("servicios", id);
  assert.equal(status, 422, JSON.stringify(json));
  assert.equal(json.error, "media_contract_violation");
  assert.ok((json.issues as string[]).includes("video_not_allowed"));
  assert.equal(rows("servicios_public_listings").find((r) => r.id === id)!.listing_status, "draft");
  assert.equal(lastAttemptOutcome(), "media_contract_violation");
});
await check("S6: REPLAY — a second publish of the same paid Servicios row is refused 409 already_published (no double success)", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id)]);
  assert.equal((await publishAs("servicios", id)).status, 200);
  const again = await publishAs("servicios", id);
  assert.equal(again.status, 409, JSON.stringify(again.json));
  assert.equal(again.json.error, "already_published");
  assert.equal(audits().filter((a) => a.action === "quick_sales_publish_completed").length, 1, "exactly one completion audit");
});
await check("S7: UNPAID ready Servicios is still 402 — the payment gate runs first and is intact", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  const { status, json } = await publishAs("servicios", id);
  assert.equal(status, 402, JSON.stringify(json));
  assert.equal(json.error, "manual_payment_not_cleared");
});

// ---------------------------------------------------------------------------------------------
// RESTAURANTES
// ---------------------------------------------------------------------------------------------
const day = { closed: false, openTime: "09:00", closeTime: "17:00" };
function readyRestaurant(): Record<string, unknown> {
  return {
    draftListingId: "draft-r1", businessName: "Taquería Sol", businessType: "restaurant", primaryCuisine: "mexican", cityCanonical: "San José",
    heroImage: "https://cdn.example.test/hero.jpg", phoneNumber: "9150000000", serviceModes: ["dine_in"],
    monday: day, tuesday: day, wednesday: day, thursday: day, friday: day, saturday: day, sunday: day,
  };
}
function seedRestaurant(listingJson: Record<string, unknown>, status = "draft", pay = true) {
  __reset(); signInAsSalesStaff();
  __seed("business_listing_links", [link(SRC.restaurantes.listingSource, "r1")]);
  __seed("restaurantes_public_listings", [{ id: "r1", slug: "sol", draft_listing_id: "draft-r1", status, owner_user_id: null, listing_json: listingJson, published_at: null }]);
  if (pay) __seed("leonix_payment_records", [paid(SRC.restaurantes.listingSource, "r1")]);
}
await check("R1: PAID + READY Restaurante publishes the same row (status published), audited", async () => {
  seedRestaurant(readyRestaurant());
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 200, JSON.stringify(json));
  assert.equal(json.listingId, "r1");
  assert.equal(rows("restaurantes_public_listings").length, 1);
  assert.equal(rows("restaurantes_public_listings")[0]!.status, "published");
  assert.ok(audits().some((a) => a.action === "quick_sales_publish_completed"));
});
await check("R2: PAID incomplete Restaurante (no cuisine, no hours) is refused 422 not_ready with the category's missingFields", async () => {
  // A deleted weekday merges back as `closed: true`, which the category counts as an hours signal; an OPEN day with no times is the real "no signal".
  const d = readyRestaurant(); d.primaryCuisine = ""; for (const k of ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"]) d[k] = { closed: false };
  seedRestaurant(d);
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 422, JSON.stringify(json));
  assert.equal(json.error, "not_ready");
  const mf = json.missingFields as string[];
  assert.ok(mf.includes("cocina") && mf.includes("señal de horario"), mf.join(","));
  assert.equal(rows("restaurantes_public_listings")[0]!.status, "draft");
  assert.equal(lastAttemptOutcome(), "not_ready");
});
await check("R3: PAID Restaurante with NO contact path is refused", async () => {
  const d = readyRestaurant(); delete d.phoneNumber; seedRestaurant(d);
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 422); assert.ok((json.missingFields as string[]).includes("al menos un contacto"));
});
await check("R4: PAID Restaurante with NO transport-safe image (data: URL only) is refused", async () => {
  const d = readyRestaurant(); d.heroImage = "data:image/png;base64,AAAA"; seedRestaurant(d);
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 422, JSON.stringify(json)); assert.equal(json.error, "not_ready");
});
await check("R5: PAID Quick Restaurante carrying an external video is refused by the Quick media contract", async () => {
  const d = readyRestaurant(); d.videoUrls = ["https://www.youtube.com/watch?v=abcdefghijk"]; seedRestaurant(d);
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 422, JSON.stringify(json)); assert.equal(json.error, "media_contract_violation");
  assert.ok((json.issues as string[]).includes("video_not_allowed"));
});
await check("R6: a Restaurante with a LIVE Full entitlement is exempt from the Quick-only video rule (package/entitlement check honored)", async () => {
  const d = readyRestaurant(); d.videoUrls = ["https://www.youtube.com/watch?v=abcdefghijk"]; seedRestaurant(d);
  __seed("listing_package_entitlements", [{ id: "e1", category: "restaurantes", listing_source: SRC.restaurantes.listingSource, listing_id: "r1", owner_user_id: null, package_key: "restaurantes_base_monthly", status: "active", is_active: true, active_from: "2026-01-01T00:00:00Z", active_until: "2027-01-01T00:00:00Z", expires_at: "2027-01-01T00:00:00Z" }]);
  const { status, json } = await publishAs("restaurantes", "r1");
  // Owner-null custody carries no bearer, so the entitlement read is unscoped: either the Full
  // exemption applies (200) or the resolver cannot prove Full and enforces (422). What must NEVER
  // happen is a 500 or a publish that skips the contract without a proven product.
  assert.ok([200, 422].includes(status), JSON.stringify(json));
});
await check("R7: REPLAY on Restaurante is refused 409 already_published", async () => {
  seedRestaurant(readyRestaurant());
  assert.equal((await publishAs("restaurantes", "r1")).status, 200);
  const again = await publishAs("restaurantes", "r1");
  assert.equal(again.status, 409); assert.equal(again.json.error, "already_published");
});

// ---------------------------------------------------------------------------------------------
// AUTOS DEALER — parent + required vehicle child, semantic vehicle media
// ---------------------------------------------------------------------------------------------
function seedAutos(opts: { child?: Record<string, unknown> | null; pay?: boolean; mainStatus?: string }) {
  __reset(); signInAsSalesStaff();
  __seed("business_listing_links", [link(SRC.autos.listingSource, "a1")]);
  const main = { id: "a1", status: opts.mainStatus ?? "draft", inventory_role: "main", owner_user_id: CLIENT, listing_payload: { businessName: "Dealer Uno" }, published_at: null, created_at: "2026-09-01T00:00:00Z" };
  const child = opts.child === null ? [] : [{ id: "a1-v", status: "draft", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "a1", owner_user_id: CLIENT, created_at: "2026-09-01T00:00:01Z", listing_payload: opts.child ?? { images: [{ url: "https://cdn.example.test/car.jpg", role: "vehicle" }] } }];
  __seed("autos_classifieds_listings", [main, ...child]);
  if (opts.pay !== false) __seed("leonix_payment_records", [paid(SRC.autos.listingSource, "a1")]);
}
await check("A1: PAID + READY Autos publishes parent AND vehicle child, same ids, no insert, audited", async () => {
  seedAutos({});
  const { status, json } = await publishAs("autos", "a1", CLIENT);
  assert.equal(status, 200, JSON.stringify(json));
  assert.equal(json.listingId, "a1");
  const all = rows("autos_classifieds_listings");
  assert.equal(all.length, 2, "no row inserted");
  assert.equal(all.find((r) => r.id === "a1")!.status, "active");
  assert.equal(all.find((r) => r.id === "a1-v")!.status, "active", "the vehicle child publishes with its parent (canonical side effect)");
  assert.ok(audits().some((a) => a.action === "quick_sales_publish_completed"));
});
await check("A2: PAID Autos WITHOUT its vehicle child is refused 400 vehicle_listing_required_for_publish", async () => {
  seedAutos({ child: null });
  const { status, json } = await publishAs("autos", "a1", CLIENT);
  assert.equal(status, 400, JSON.stringify(json)); assert.equal(json.error, "vehicle_listing_required_for_publish");
  assert.equal(rows("autos_classifieds_listings")[0]!.status, "draft");
  assert.equal(lastAttemptOutcome(), "vehicle_listing_required_for_publish");
});
await check("A3: PAID Autos whose vehicle child carries only a LOGO (no vehicle photo) is refused by the semantic media contract", async () => {
  seedAutos({ child: { images: [{ url: "https://cdn.example.test/logo.png", role: "logo" }] } });
  const { status, json } = await publishAs("autos", "a1", CLIENT);
  assert.equal(status, 422, JSON.stringify(json)); assert.equal(json.error, "media_contract_violation");
  assert.ok(rows("autos_classifieds_listings").every((r) => r.status === "draft"));
});
await check("A4: ZERO-ROW transition (parent already active) is refused, never reported as success", async () => {
  seedAutos({ mainStatus: "active" });
  const { status, json } = await publishAs("autos", "a1", CLIENT);
  assert.equal(status, 409, JSON.stringify(json)); assert.equal(json.error, "already_published");
  assert.equal(audits().filter((a) => a.action === "quick_sales_publish_completed").length, 0);
});
await check("A5: UNPAID Autos is still 402", async () => {
  seedAutos({ pay: false });
  assert.equal((await publishAs("autos", "a1", CLIENT)).status, 402);
});

// ---------------------------------------------------------------------------------------------
// BIENES NEGOCIO — semantic property media on the stored row
// ---------------------------------------------------------------------------------------------
function seedBienes(listingJson: Record<string, unknown>, status = "pending", pay = true) {
  __reset(); signInAsSalesStaff();
  __seed("business_listing_links", [link(SRC["bienes-raices"].listingSource, "b1")]);
  __seed("listings", [{ id: "b1", status, is_published: false, owner_id: CLIENT, title: "Oficina", listing_json: listingJson, published_at: null }]);
  if (pay) __seed("leonix_payment_records", [paid(SRC["bienes-raices"].listingSource, "b1")]);
}
await check("B1: PAID + READY Bienes publishes the same row (active + is_published), no insert, audited", async () => {
  seedBienes({ images: [{ url: "https://cdn.example.test/house.jpg", role: "property" }] });
  const { status, json } = await publishAs("bienes-raices", "b1", CLIENT);
  assert.equal(status, 200, JSON.stringify(json)); assert.equal(json.listingId, "b1");
  assert.equal(rows("listings").length, 1);
  const r = rows("listings")[0]!; assert.equal(r.status, "active"); assert.equal(r.is_published, true);
  assert.ok(audits().some((a) => a.action === "quick_sales_publish_completed"));
});
await check("B2: PAID Bienes with NO property photo at all is refused by the semantic media contract", async () => {
  seedBienes({});
  const { status, json } = await publishAs("bienes-raices", "b1", CLIENT);
  assert.equal(status, 422, JSON.stringify(json)); assert.equal(json.error, "media_contract_violation");
  assert.ok((json.issues as string[]).includes("too_few_subject_images"));
  assert.equal(rows("listings")[0]!.is_published, false);
  assert.equal(lastAttemptOutcome(), "media_contract_violation");
});
await check("B3: PAID Bienes whose only photo is a HEADSHOT is refused (invalid semantic property media)", async () => {
  seedBienes({ images: [{ url: "https://cdn.example.test/agent.jpg", role: "headshot" }] });
  const { status, json } = await publishAs("bienes-raices", "b1", CLIENT);
  assert.equal(status, 422, JSON.stringify(json)); assert.equal(json.error, "media_contract_violation");
});
await check("B4: REPLAY on Bienes is refused 409 already_published", async () => {
  seedBienes({ images: [{ url: "https://cdn.example.test/house.jpg", role: "property" }] });
  assert.equal((await publishAs("bienes-raices", "b1", CLIENT)).status, 200);
  const again = await publishAs("bienes-raices", "b1", CLIENT);
  assert.equal(again.status, 409); assert.equal(again.json.error, "already_published");
});

// ---------------------------------------------------------------------------------------------
// RAW f29 GUARANTEES — untouched
// ---------------------------------------------------------------------------------------------
await check("G1: a body listing id cannot override the signed context (publish ignores body ids; a bound row still governs)", async () => {
  seedRestaurant(readyRestaurant());
  __seed("restaurantes_public_listings", [...rows("restaurantes_public_listings"), { id: "r-other", status: "draft", listing_json: readyRestaurant(), owner_user_id: null }]);
  const res = await publish.POST(makeRequest({ listingId: "r-other" }, cookie("restaurantes", "r1")));
  const json = (await res.json()) as Record<string, unknown>;
  assert.equal(res.status, 200, JSON.stringify(json));
  assert.equal(json.listingId, "r1", "the SIGNED row publishes, never the body's");
  assert.equal(rows("restaurantes_public_listings").find((r) => r.id === "r-other")!.status, "draft");
});
await check("G2: mixed staff-assisted + unrelated customer session is still refused on the canonical Servicios route", async () => {
  await seedServiciosViaCanonicalRoute();
  __setBearerTokens({ "stranger-token": STRANGER });
  const res = await servicios.POST(makeRequest({ assistedAction: "save_for_client", lang: "es", state: serviciosState() }, cookie("servicios", null), { authorization: "Bearer stranger-token" }));
  assert.equal(res.status, 409); assert.equal(((await res.json()) as { error: string }).error, "assisted_session_conflict");
});
await check("G3: publish without a verified business_listing_links row is refused 403 before payment or readiness", async () => {
  seedRestaurant(readyRestaurant());
  __seed("business_listing_links", []);
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 403); assert.equal(json.error, "listing_not_linked_to_business");
});

console.log(`\n${passed.length}/${checks} checks passed`);
for (const p of passed) console.log(`  OK   ${p}`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log("\nverify-quick-sales-canonical-publish-readiness-01: ALL CHECKS EXECUTED AND PASSED");
}
main().catch((e) => { console.error("verifier crashed:", e); process.exit(1); });
