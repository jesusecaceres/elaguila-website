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
import { readFileSync } from "node:fs";
import { __reset, __seed, __rows, __setAuthUsers } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { __setBearerTokens } from "./lib/stubs/supabaseJs.mjs";
import { createAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import { QUICK_SALES_CATEGORY_MAP, type QuickSalesCategory } from "../app/lib/sales/quickSalesCategories";
import { BUSINESS_CATEGORY_PACKAGE_PAIR } from "../app/lib/listingPlans/businessAccessLevel";
import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import { serviciosPublishedToApplicationDraft } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft";
import { SERVICIOS_GALLERY_MAX, RESTAURANTE_GALLERY_MAX } from "../app/lib/sales/canonicalPublishReadiness";

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
function cookie(category: string, listingId: string | null, clientUserId: string | null = null, packageKey: string | null = null): Record<string, string> {
  const pair = BUSINESS_CATEGORY_PACKAGE_PAIR[category];
  const stamped = packageKey ?? pair?.simple ?? null;
  return {
    leonix_assisted_publish: createAssistedPublishingTokenWithSecret(
      { businessId: BIZ, category, rosterId: ROSTER_ID, authUserId: STAFF_AUTH, listingId, clientUserId, assistedAction: "save_for_client", packageKey: stamped },
      ASSISTED_SECRET,
    )!,
  };
}
function paid(listingSource: string, listingId: string, packageKey?: string) {
  const key =
    packageKey ??
    (listingSource === "restaurantes_public_listings"
      ? BUSINESS_CATEGORY_PACKAGE_PAIR.restaurantes.simple
      : listingSource === "autos_classifieds_listings"
        ? BUSINESS_CATEGORY_PACKAGE_PAIR.autos.simple
        : listingSource === "listings"
          ? BUSINESS_CATEGORY_PACKAGE_PAIR["bienes-raices"].simple
          : BUSINESS_CATEGORY_PACKAGE_PAIR.servicios.simple);
  const amount = key.includes("quick") ? 24900 : 39900;
  return {
    id: `pay-${listingId}`,
    listing_source: listingSource,
    listing_id: listingId,
    package_key: key,
    source: "admin_manual",
    manual_state: "cleared",
    payment_status: "paid",
    currency: "usd",
    amount_cents: amount,
    amount_total_cents: amount,
    amount_paid_cents: amount,
  };
}
function link(listingSource: string, listingId: string) {
  return { id: `link-${listingId}`, business_id: BIZ, listing_source: listingSource, listing_id: listingId, status: "verified", linked_by: STAFF_AUTH };
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

async function publishAs(category: QuickSalesCategory, listingId: string, clientUserId: string | null = null, headers: Record<string, string> = {}, packageKey: string | null = null) {
  const res = await publish.POST(makeRequest({}, cookie(category, listingId, clientUserId, packageKey), headers));
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
await check("S5b: PAID Full Servicios carrying a video is NOT held to the Quick media contract — same listing id", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id, "servicios_base_monthly")]);
  breakServiciosStoredRow(id, (p) => { p.galleryVideos = [{ id: "v1", url: "https://www.youtube.com/watch?v=abcdefghijk" }]; });
  const { status, json } = await publishAs("servicios", id, null, {}, "servicios_base_monthly");
  assert.equal(status, 200, JSON.stringify(json));
  assert.equal(json.listingId, id, "Full publishes the SAME canonical row");
  assert.equal(rows("servicios_public_listings").find((r) => r.id === id)!.listing_status, "published");
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
await check("S8: Gate 7 source contract — the hydrator yields the three confirmations FALSE and the listing-bound cockpit publish still passes; a content gap does not", async () => {
  const id = await seedServiciosViaCanonicalRoute();
  __seed("leonix_payment_records", [paid(SRC.servicios.listingSource, id)]);
  const row = rows("servicios_public_listings").find((r) => r.id === id)!;
  const { state } = serviciosPublishedToApplicationDraft(row as never);
  assert.equal(state.confirmListingAccurate, false); assert.equal(state.confirmPhotosRepresentBusiness, false); assert.equal(state.confirmCommunityRules, false);
  // The preview client's own contract: listingBoundPreview || (all three) — see ClasificadosServiciosPreviewClient.tsx "Gate 7".
  const src = readFileSync("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx", "utf8");
  assert.ok(src.includes("(listingBoundPreview ||") && src.includes("appState.confirmListingAccurate && appState.confirmPhotosRepresentBusiness && appState.confirmCommunityRules"), "the cited Gate 7 exemption exists in source");
  assert.equal((await publishAs("servicios", id)).status, 200, "exempt for an existing (listing-bound) row");
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
// `pending_payment` is the status the assisted save actually leaves a Restaurantes row in
// (RESTAURANTE_PENDING_CHECKOUT_STATUS, restaurantes/publish/route.ts `isAssistedSaveForClient`).
function seedRestaurant(listingJson: Record<string, unknown>, status = "pending_payment", pay = true) {
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
  assert.equal(rows("restaurantes_public_listings")[0]!.status, "pending_payment");
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
const FULL_ENTITLEMENT = (ownerUserId: string | null) => ({ id: "e1", category: "restaurantes", listing_id: "r1", owner_user_id: ownerUserId, package_key: "restaurantes_base_monthly", package_tier: null, status: "active", starts_at: "2026-01-01T00:00:00Z", ends_at: "2027-01-01T00:00:00Z", revoked_at: null });
await check("R6: an OWNER-NULL custody row cannot be scoped to any entitlement, so the resolver holds it to the Quick contract — video is refused 422 exactly", async () => {
  const d = readyRestaurant(); d.videoUrls = ["https://www.youtube.com/watch?v=abcdefghijk"]; seedRestaurant(d);
  __seed("listing_package_entitlements", [FULL_ENTITLEMENT(null)]);
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 422, JSON.stringify(json)); assert.equal(json.error, "media_contract_violation");
});
await check("R6b: a row whose STORED owner holds a LIVE Full entitlement is exempt from the Quick-only video rule (resolver-proven, never body-declared)", async () => {
  const d = readyRestaurant(); d.videoUrls = ["https://www.youtube.com/watch?v=abcdefghijk"]; seedRestaurant(d);
  __seed("restaurantes_public_listings", rows("restaurantes_public_listings").map((r) => ({ ...r, owner_user_id: CLIENT })));
  __seed("listing_package_entitlements", [FULL_ENTITLEMENT(CLIENT)]);
  // Entitlement is product identity for the media rule, not payment. Full publication still
  // requires an authoritative Full payment record.
  __seed("leonix_payment_records", [paid(SRC.restaurantes.listingSource, "r1", BUSINESS_CATEGORY_PACKAGE_PAIR.restaurantes.full)]);
  const { status, json } = await publishAs("restaurantes", "r1", null, {}, "restaurantes_base_monthly");
  assert.equal(status, 200, JSON.stringify(json));
});
await check("R6c: a body basePackageKey/listingId cannot buy the exemption (nothing in the body is read)", async () => {
  const d = readyRestaurant(); d.videoUrls = ["https://www.youtube.com/watch?v=abcdefghijk"]; seedRestaurant(d);
  const res = await publish.POST(makeRequest({ basePackageKey: "restaurantes_base_monthly", listingId: "r1", product: "full" }, cookie("restaurantes", "r1")));
  assert.equal(res.status, 422);
});
await check("R8: a Restaurante whose stored status is unknown to the canonical authority (`draft`) fails closed 409 restaurante_status_transition_not_allowed", async () => {
  seedRestaurant(readyRestaurant(), "draft");
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 409, JSON.stringify(json)); assert.equal(json.error, "restaurante_status_transition_not_allowed");
  assert.equal(rows("restaurantes_public_listings")[0]!.status, "draft");
});
await check("R9: an `archived` Restaurante is held where the canonical authority holds it — 409, never published from the cockpit", async () => {
  seedRestaurant(readyRestaurant(), "archived");
  const { status, json } = await publishAs("restaurantes", "r1");
  assert.equal(status, 409); assert.equal(json.error, "restaurante_status_transition_not_allowed");
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
  const main = { id: "a1", status: opts.mainStatus ?? "draft", inventory_role: "main", owner_user_id: CLIENT, listing_payload: { dealerName: "Dealer Uno", businessName: "Dealer Uno", dealerPhoneOffice: "4085550100" }, published_at: null, created_at: "2026-09-01T00:00:00Z" };
  const child = opts.child === null ? [] : [{ id: "a1-v", status: "draft", inventory_role: "inventory_vehicle", dealer_inventory_parent_listing_id: "a1", owner_user_id: CLIENT, created_at: "2026-09-01T00:00:01Z", listing_payload: opts.child ?? { images: [{ url: "https://cdn.example.test/car.jpg", role: "vehicle" }], year: 2019, make: "Toyota", model: "Camry", price: 14500, city: "San Jose", zip: "95112", dealerPhoneOffice: "4085550100" } }];
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
await check("A6: a required vehicle child that matches ZERO rows on activation (already active) is a refusal 409 — and the parent is NOT flipped (child first)", async () => {
  seedAutos({});
  __seed("autos_classifieds_listings", rows("autos_classifieds_listings").map((r) => (r.id === "a1-v" ? { ...r, status: "active" } : r)));
  const { status, json } = await publishAs("autos", "a1", CLIENT);
  assert.equal(status, 409, JSON.stringify(json)); assert.equal(json.error, "autos_vehicle_status_transition_not_allowed");
  assert.equal(rows("autos_classifieds_listings").find((r) => r.id === "a1")!.status, "draft", "parent untouched");
  assert.equal(lastAttemptOutcome(), "autos_vehicle_status_transition_not_allowed");
  assert.equal(audits().filter((a) => a.action === "quick_sales_publish_completed").length, 0);
});
// LIMITATION (stated, not papered over): the harness can fail READS (__failReadsOn) but has no way
// to make an UPDATE return an error, so "child update errors → refusal" is covered by the
// zero-row branch above and by the code path's explicit error handling, not by an executed error.
await check("A5: UNPAID Autos is still 402", async () => {
  seedAutos({ pay: false });
  assert.equal((await publishAs("autos", "a1", CLIENT)).status, 402);
});

// ---------------------------------------------------------------------------------------------
// BIENES NEGOCIO — semantic property media on the stored row
// ---------------------------------------------------------------------------------------------
function seedBienes(row: Record<string, unknown>, status = "pending", pay = true) {
  __reset(); signInAsSalesStaff();
  __seed("business_listing_links", [link(SRC["bienes-raices"].listingSource, "b1")]);
  __seed("listings", [{ id: "b1", status, is_published: false, owner_id: CLIENT, title: "Oficina", published_at: null, ...row }]);
  if (pay) __seed("leonix_payment_records", [paid(SRC["bienes-raices"].listingSource, "b1")]);
}
// SOURCE-PROVEN persisted gallery for `listings`: the `images` jsonb column (bare URL strings) —
// written by buildQuickBienesListingRow (`images: [...mediaUrls]`), read by the public renderer
// (anuncio/[id]/page.tsx imageUrlsFromJsonb(row.images)). Media ROLES are validated at request
// time; the Bienes assisted route now writes `images` (durable URLs) and records DECLARED roles in
// `listing_json.br_media_roles` (scripts/verify-bienes-assisted-quick-publish-01.ts proves that path). With no
// declared role the canonical DECLARED-attribution contract still fails closed on its own codes (B1 below).
await check("B1: PAID Bienes with property URLs in `listings.images` fails CLOSED on the canonical contract (roles are not persisted) — 422 role_declaration_required, never published", async () => {
  seedBienes({ images: ["https://cdn.example.test/house.jpg"] });
  const { status, json } = await publishAs("bienes-raices", "b1", CLIENT);
  assert.equal(status, 422, JSON.stringify(json)); assert.equal(json.error, "media_contract_violation");
  assert.deepEqual(json.issues, ["role_declaration_required"]);
  assert.equal(rows("listings")[0]!.is_published, false); assert.equal(rows("listings")[0]!.status, "pending");
  assert.equal(lastAttemptOutcome(), "media_contract_violation");
});
await check("B2: PAID Bienes with NO images is refused 422 too_few_subject_images", async () => {
  seedBienes({ images: [] });
  const { status, json } = await publishAs("bienes-raices", "b1", CLIENT);
  assert.equal(status, 422, JSON.stringify(json)); assert.deepEqual(json.issues, ["too_few_subject_images"]);
});
await check("B3: media in listing_json / profile_json is NOT consulted (the inferred fallback is gone) — stored-column truth only", async () => {
  seedBienes({ images: [], listing_json: { images: [{ url: "https://cdn.example.test/house.jpg", role: "property" }] }, profile_json: { images: [{ url: "https://cdn.example.test/house.jpg", role: "property" }] } });
  const { status, json } = await publishAs("bienes-raices", "b1", CLIENT);
  assert.equal(status, 422, JSON.stringify(json)); assert.deepEqual(json.issues, ["too_few_subject_images"]);
});
await check("B4: UNPAID Bienes is still 402 before any readiness answer", async () => {
  seedBienes({ images: ["https://cdn.example.test/house.jpg"] }, "pending", false);
  assert.equal((await publishAs("bienes-raices", "b1", CLIENT)).status, 402);
});

// ---------------------------------------------------------------------------------------------
// RAW f29 GUARANTEES — untouched
// ---------------------------------------------------------------------------------------------
await check("N1: customer publish branches stay intact; Gate 1 only replaces the assisted listing-only payment boolean", async () => {
  const servicios = readFileSync("app/api/clasificados/servicios/publish/route.ts", "utf8");
  const restaurantes = readFileSync("app/api/clasificados/restaurantes/publish/route.ts", "utf8");
  const autos = readFileSync("app/api/clasificados/autos/assisted-publish/route.ts", "utf8");
  assert.ok(servicios.includes("decideServiciosOwnerSaveStatus({"), "customer Servicios save-status authority intact");
  assert.ok(servicios.includes("isServiciosListingOwner(existing.owner_user_id, ownerUserId)"), "customer ownership check intact");
  assert.ok(servicios.includes("refuseUnlessAuthoritativePayment("), "assisted Servicios publish uses package-bound payment");
  assert.ok(restaurantes.includes("refuseUnlessAuthoritativePayment("), "assisted Restaurantes publish uses package-bound payment");
  assert.ok(autos.includes("refuseUnlessAuthoritativePayment("), "assisted Autos publish uses package-bound payment");
  assert.ok(!servicios.includes("hasClearedManualPaymentForListing("));
  assert.ok(!restaurantes.includes("hasClearedManualPaymentForListing("));
  assert.ok(!autos.includes("hasClearedManualPaymentForListing("));
});
await check("N2: the adapter's restated gallery caps equal the routes' own file-local literals", async () => {
  assert.ok(readFileSync("app/api/clasificados/servicios/publish/route.ts", "utf8").includes(`const SERVICIOS_GALLERY_MAX = ${SERVICIOS_GALLERY_MAX};`));
  assert.ok(readFileSync("app/api/clasificados/restaurantes/publish/route.ts", "utf8").includes(`const RESTAURANTE_GALLERY_MAX = ${RESTAURANTE_GALLERY_MAX};`));
});
await check("G1: a body listing id cannot override the signed context (publish ignores body ids; a bound row still governs)", async () => {
  seedRestaurant(readyRestaurant());
  __seed("restaurantes_public_listings", [...rows("restaurantes_public_listings"), { id: "r-other", status: "pending_payment", listing_json: readyRestaurant(), owner_user_id: null }]);
  const res = await publish.POST(makeRequest({ listingId: "r-other" }, cookie("restaurantes", "r1")));
  const json = (await res.json()) as Record<string, unknown>;
  assert.equal(res.status, 200, JSON.stringify(json));
  assert.equal(json.listingId, "r1", "the SIGNED row publishes, never the body's");
  assert.equal(rows("restaurantes_public_listings").find((r) => r.id === "r-other")!.status, "pending_payment");
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
