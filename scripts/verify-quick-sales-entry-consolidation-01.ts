/**
 * LEONIX QUICK SALES ENTRY CONSOLIDATION — BEHAVIORAL proof.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-sales-entry-consolidation-01.ts
 *
 * EVERY CHECK IN THIS FILE EXECUTES CODE: pages are called as functions and their element trees
 * walked, client components are server-rendered, and every route is the real handler called
 * against the in-memory PostgREST harness. Nothing here asserts that a string appears in a source
 * file. No database, no network, no live Stripe, no migration.
 *
 * What it proves:
 *  A. The routing truth: the four paid categories deep-link into the Quick Sales cockpit from
 *     Create for Client, the launchpad, the category queues, the staff OS home; the launchpad
 *     renders NO link that opens a customer application on the staff browser; customer
 *     self-service links still resolve to public routes whose gate leads to /login.
 *  B. The banner: a verified assisted cookie reaches the client gate with business/category/row
 *     and nothing else; the banner renders for it.
 *  C. The routes: custody without a client id (Servicios/Restaurantes); Servicios saved TWICE
 *     under custody returns the SAME listing id and leaves ONE row; an assisted request that also
 *     carries an unrelated site session is refused (409) on all four routes while the bound
 *     client's own session is not; unpaid publish is 402; the prospect preview is readable with
 *     no session and writes nothing; application-context never clobbers a bound cookie.
 */
import { strict as assert } from "node:assert";
import * as React from "react";
import { createElement, type ReactElement } from "react";
// The harness tsconfig compiles the pages' JSX to the classic runtime, which expects a global React.
(globalThis as unknown as { React: unknown }).React = React;
import { renderToStaticMarkup } from "react-dom/server";
import { __reset, __seed, __rows, __setAuthUsers } from "./lib/stubs/supabaseServer.mjs";
import { __setCookies } from "./lib/stubs/nextHeaders.mjs";
import { __setBearerTokens } from "./lib/stubs/supabaseJs.mjs";

import { createAssistedPublishingTokenWithSecret } from "../app/lib/auth/assistedPublishingToken";
import { verifyProspectPreviewTokenWithSecret } from "../app/lib/auth/prospectPreviewToken";
import { resolveAssistedSessionConflict } from "../app/lib/sales/assistedSameRowBinding";
import { QUICK_SALES_CATEGORIES, type QuickSalesCategory } from "../app/lib/sales/quickSalesCategories";
import {
  QUICK_SALES_WORKSPACE_PATH,
  buildQuickSalesHref,
  isQuickSalesGatewayKey,
  quickSalesCategoryForClassifiedKey,
  quickSalesCategoryForQuickBusinessKey,
} from "../app/lib/sales/quickSalesRoutes";
import { clasificadosQueueSurfaceForSlug } from "../app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta";
import { composeStaffOperatingSystem } from "../app/admin/_lib/staffOperatingSystem";
import { buildPublishLoginHref } from "../app/lib/auth/publishLoginRedirect";
import { quickClassifiedCategoryPath } from "../app/lib/quickClassifieds/quickClassifiedRoutes";
import { quickBusinessCategoryPath } from "../app/lib/quickBusiness/quickBusinessRoutes";
import { listQuickBusinessDefinitions } from "../app/lib/quickBusiness/quickBusinessRegistry";
import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";

const PREVIEW_SECRET = "preview-secret-harness-only";
const ASSISTED_SECRET = "assisted-secret-harness-only";
process.env.PROSPECT_PREVIEW_SESSION_SECRET = PREVIEW_SECRET;
process.env.ASSISTED_PUBLISHING_SESSION_SECRET = ASSISTED_SECRET;

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function checkAsync(name: string, fn: () => Promise<void>) {
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
const PUBLIC_CREATE = /^\/(?:clasificados\/)?publicar(?:\/|$)/;

function signInAsSalesStaff(role = "super_admin"): void {
  __setCookies({ leonix_admin: "1", leonix_admin_operator_email: STAFF_EMAIL, leonix_admin_auth_user_id: STAFF_AUTH });
  __setAuthUsers([{ id: STAFF_AUTH, email: STAFF_EMAIL }]);
  __seed("admin_team_members", [{ id: ROSTER_ID, email: STAFF_EMAIL, display_name: "Sales", role, is_active: true, auth_user_id: STAFF_AUTH }]);
}
function seedBusiness(): void {
  __seed("businesses", [
    { id: BIZ, display_name: "Taquería Sol", public_name: "Taquería Sol", legal_name: null, normalized_name: "taqueria sol", slug: "taqueria-sol", broad_business_type: "restaurant", status: "active", creation_source: "staff_assisted", created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-01T00:00:00Z" },
  ]);
}
function assistedCookie(input: { category: string; listingId?: string | null; clientUserId?: string | null; businessId?: string }): string {
  return createAssistedPublishingTokenWithSecret(
    { businessId: input.businessId ?? BIZ, category: input.category, rosterId: ROSTER_ID, authUserId: STAFF_AUTH, listingId: input.listingId ?? null, clientUserId: input.clientUserId ?? null, assistedAction: "save_for_client" },
    ASSISTED_SECRET,
  )!;
}
function linkRow(listingSource: string, listingId: string, businessId = BIZ) {
  return { id: `link-${listingId}`, business_id: businessId, listing_source: listingSource, listing_id: listingId, status: "verified", linked_by: STAFF_AUTH };
}
/** A request as the routes read it: json body, cookie jar, optional bearer, nextUrl. */
function makeRequest(body: unknown, cookieJar: Record<string, string> = {}, headers: Record<string, string> = {}, url = "http://harness.invalid/api") {
  const h = new Map(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
  return {
    json: async () => body,
    text: async () => JSON.stringify(body ?? {}),
    headers: { get: (name: string) => h.get(name.toLowerCase()) ?? null },
    cookies: { get: (name: string) => (name in cookieJar ? { name, value: cookieJar[name] } : undefined) },
    nextUrl: new URL(url),
  } as never;
}
function setCookieValue(res: { cookies: { get: (n: string) => { value: string } | undefined } }, name: string): string | undefined {
  return res.cookies.get(name)?.value;
}
/** Walk a React element tree (NOT rendered) and collect every href prop. */
function collectHrefs(node: unknown, out: { href: string; props: Record<string, unknown> }[] = []): { href: string; props: Record<string, unknown> }[] {
  if (!node || typeof node !== "object") return out;
  if (Array.isArray(node)) { for (const n of node) collectHrefs(n, out); return out; }
  const el = node as ReactElement<Record<string, unknown>>;
  const props = (el.props ?? {}) as Record<string, unknown>;
  if (typeof props.href === "string") out.push({ href: props.href, props });
  collectHrefs(props.children, out);
  return out;
}
const unescape = (s: string) => s.replace(/&amp;/g, "&");

// =============================================================================
// SECTION A — ROUTING TRUTH (pure + executed launchers)
// =============================================================================
async function main() {
check("A1: buildQuickSalesHref carries category/business/listing and drops an unknown category", () => {
  assert.equal(buildQuickSalesHref(), QUICK_SALES_WORKSPACE_PATH);
  const h = buildQuickSalesHref({ category: "autos", businessId: BIZ, listingId: "row-1", lang: "en" });
  const u = new URL(h, "http://x");
  assert.equal(u.pathname, QUICK_SALES_WORKSPACE_PATH);
  assert.equal(u.searchParams.get("category"), "autos");
  assert.equal(u.searchParams.get("businessId"), BIZ);
  assert.equal(u.searchParams.get("listingId"), "row-1");
  assert.equal(u.searchParams.get("lang"), "en");
  assert.equal(new URL(buildQuickSalesHref({ category: "viajes" }), "http://x").searchParams.get("category"), null, "an excluded category must not be forwarded");
  assert.equal(new URL(buildQuickSalesHref({ category: "empleos" }), "http://x").searchParams.get("category"), "empleos");
  for (const c of QUICK_SALES_CATEGORIES) assert.ok(isQuickSalesGatewayKey(c));
  assert.equal(isQuickSalesGatewayKey("ofertas-locales"), false);
});
check("A2: every live Quick Business registry key maps to a Quick Sales category", () => {
  const defs = listQuickBusinessDefinitions();
  assert.ok(defs.length >= 4);
  const mapped = new Set(defs.map((d) => quickSalesCategoryForQuickBusinessKey(d.key)));
  for (const c of ["servicios", "restaurantes", "autos", "bienes-raices"] as const) {
    assert.ok(mapped.has(c), `business registry reaches ${c}`);
  }
  assert.equal(quickSalesCategoryForQuickBusinessKey("comida-local"), null);
  assert.equal(quickSalesCategoryForClassifiedKey("autos"), "autos-privado");
  assert.equal(quickSalesCategoryForClassifiedKey("rentas"), "rentas");
  assert.equal(quickSalesCategoryForClassifiedKey("empleos"), "empleos");
});
check("A3: category queue 'publish' links for staff-gateway families are the cockpit, never a public application", () => {
  for (const c of QUICK_SALES_CATEGORIES) {
    const href = clasificadosQueueSurfaceForSlug(c).publishHref ?? "";
    assert.ok(href.startsWith(`${QUICK_SALES_WORKSPACE_PATH}?`), `${c}: ${href}`);
    assert.equal(new URL(href, "http://x").searchParams.get("category"), c);
    assert.ok(!PUBLIC_CREATE.test(href));
  }
  assert.ok(PUBLIC_CREATE.test(clasificadosQueueSurfaceForSlug("viajes").publishHref ?? ""), "excluded lanes keep their existing publish link");
});
check("A4: staff OS home leads with Quick Sales for a capable actor and never drops Create for Client", () => {
  const caps = new Set(["view_business_list", "assisted_category_publishing"]) as never;
  const os = composeStaffOperatingSystem({ role: "sales_rep", actorType: "staff", capabilities: caps, paymentTrackerAccess: false } as never);
  assert.equal(os.clientWork[0]?.key, "quick_sales");
  assert.equal(os.clientWork[0]?.href, QUICK_SALES_WORKSPACE_PATH);
  assert.ok(os.clientWork.some((l) => l.key === "create_for_client"));
  const without = composeStaffOperatingSystem({ role: "sales_rep", actorType: "staff", capabilities: new Set(["view_business_list"]) as never, paymentTrackerAccess: false } as never);
  assert.ok(!without.clientWork.some((l) => l.key === "quick_sales"), "no cockpit link without the capability its page demands");
});
check("A5: customer self-service links are PUBLIC routes whose gate leads to /login (customer signs in with their own email)", () => {
  const paths = [quickClassifiedCategoryPath("empleos", "es", "staff"), ...listQuickBusinessDefinitions().filter((d) => d.status !== "direct").map((d) => quickBusinessCategoryPath(d.key, "es", "staff"))];
  assert.ok(paths.length >= 4);
  for (const p of paths) {
    assert.ok(!p.startsWith("/admin"), `${p} is a customer route`);
    const login = buildPublishLoginHref(p, "es");
    assert.ok(login.startsWith("/login?mode=post"), login);
    assert.equal(decodeURIComponent(new URL(login, "http://x").searchParams.get("redirect") ?? ""), p, "login returns the customer to the same application");
  }
});
await checkAsync("A6: Create for Client (business selected) — staff-gateway cards go to the cockpit; no paid card opens a public application", async () => {
  __reset(); signInAsSalesStaff(); seedBusiness();
  const mod = await import("../app/admin/(dashboard)/businesses/create-for-client/page");
  const tree = await mod.default({ searchParams: Promise.resolve({ businessId: BIZ }) });
  const hrefs = collectHrefs(tree);
  const createForClientKeys = QUICK_SALES_CATEGORIES.filter((c) => c !== "autos-privado");
  for (const c of createForClientKeys) {
    const lane = hrefs.find((h) => h.props["data-quick-sales-lane"] === c);
    assert.ok(lane, `card for ${c}`);
    const u = new URL(lane!.href, "http://x");
    assert.equal(u.pathname, QUICK_SALES_WORKSPACE_PATH);
    assert.equal(u.searchParams.get("category"), c);
    assert.equal(u.searchParams.get("businessId"), BIZ);
    assert.equal(lane!.props.target, undefined, "same tab — never a detached public tab");
  }
  const laneHrefs = hrefs.filter((h) => typeof h.props["data-quick-sales-lane"] === "string").map((h) => h.href);
  assert.equal(laneHrefs.length, createForClientKeys.length);
  assert.ok(laneHrefs.every((h) => !PUBLIC_CREATE.test(h) && !h.includes("/handoff")));
});
await checkAsync("A7: Create for Client (no business yet) — staff-gateway cards STILL go to the cockpit, not to the public gateway", async () => {
  __reset(); signInAsSalesStaff();
  const mod = await import("../app/admin/(dashboard)/businesses/create-for-client/page");
  const tree = await mod.default({ searchParams: Promise.resolve({}) });
  const hrefs = collectHrefs(tree);
  const createForClientKeys = QUICK_SALES_CATEGORIES.filter((c) => c !== "autos-privado");
  for (const c of createForClientKeys) {
    const lane = hrefs.find((h) => h.props["data-quick-sales-lane"] === c);
    assert.ok(lane, `card for ${c}`);
    assert.ok(lane!.href.startsWith(`${QUICK_SALES_WORKSPACE_PATH}?`), lane!.href);
  }
});
check("A8: the launchpad server-renders with NO link into a customer application; managed-ad verbs go to the cockpit", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { QuickApplicationsLaunchpad } = require("../app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad") as { QuickApplicationsLaunchpad: () => ReactElement };
  const html = renderToStaticMarkup(createElement(QuickApplicationsLaunchpad));
  const hrefs = [...html.matchAll(/href="([^"]+)"/g)].map((m) => unescape(m[1]!));
  assert.ok(hrefs.length > 0);
  const offenders = hrefs.filter((h) => PUBLIC_CREATE.test(h));
  assert.deepEqual(offenders, [], `no href may open a customer application on the staff browser: ${offenders.join(", ")}`);
  assert.ok(html.includes('data-quick-sales-entry="launchpad"'));
  const entries = [...html.matchAll(/data-quick-sales-entry="([a-z-]+)"[^>]*href="([^"]+)"|href="([^"]+)"[^>]*data-quick-sales-entry="([a-z-]+)"/g)];
  const byCat = new Map<string, string>();
  for (const m of entries) byCat.set((m[1] ?? m[4])!, unescape((m[2] ?? m[3])!));
  for (const c of QUICK_SALES_CATEGORIES) {
    const href = byCat.get(c);
    assert.ok(href && href.startsWith(`${QUICK_SALES_WORKSPACE_PATH}?`), `${c} managed verb → cockpit (${href})`);
  }
  assert.ok(html.includes("Copiar / Copy") && html.includes("Compartir / Share"), "customer links are still copy/share-able");
});

// =============================================================================
// SECTION B — THE BANNER, FROM THE SERVER-VERIFIED COOKIE
// =============================================================================
await checkAsync("B1: PublishAuthGateLayout passes only business/category/row to the client gate — never roster or auth ids", async () => {
  __reset(); __setCookies({ leonix_assisted_publish: assistedCookie({ category: "servicios", listingId: "row-9" }) });
  const { PublishAuthGateLayout } = await import("../app/components/auth/PublishAuthGateLayout");
  const tree = (await PublishAuthGateLayout({ children: createElement("div") })) as ReactElement<{ children: ReactElement<{ assisted: unknown }> }>;
  const gate = tree.props.children;
  const assisted = gate.props.assisted as Record<string, unknown>;
  assert.deepEqual(assisted, { businessId: BIZ, category: "servicios", listingId: "row-9" });
  __setCookies({});
  const none = (await PublishAuthGateLayout({ children: createElement("div") })) as ReactElement<{ children: ReactElement<{ assisted: unknown }> }>;
  assert.equal(none.props.children.props.assisted, null, "a customer render carries no assisted context");
});
check("B2: the Modo Leonix banner renders bilingual, persistent, with a way back to the cockpit", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { LeonixManagedModeBanner } = require("../app/components/auth/LeonixManagedModeBanner") as { LeonixManagedModeBanner: (p: Record<string, unknown>) => ReactElement };
  const html = renderToStaticMarkup(createElement(LeonixManagedModeBanner, { businessId: BIZ, category: "autos", listingId: null }));
  assert.ok(html.includes("data-leonix-managed-banner"));
  assert.ok(html.includes("Modo Leonix / Leonix Managed"));
  assert.ok(html.includes("Auto Dealer") && html.includes("nuevo / new"));
  assert.ok(html.includes(`href="${QUICK_SALES_WORKSPACE_PATH}"`));
  const bound = renderToStaticMarkup(createElement(LeonixManagedModeBanner, { businessId: BIZ, category: "servicios", listingId: "row-123456789" }));
  assert.ok(bound.includes('data-listing-id="row-123456789"'));
});

// =============================================================================
// SECTION C — THE ROUTES, IMPORTED AND CALLED
// =============================================================================
const custody = (await import("../app/api/admin/sales-preview/custody/route")) as unknown as { POST: (r: never) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }>; GET: (r: never) => Promise<Response> };
const workspacePublish = (await import("../app/api/admin/sales-preview/publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
const previewLink = (await import("../app/api/admin/sales-preview/preview-link/route")) as unknown as { POST: (r: never) => Promise<Response> };
const servicios = (await import("../app/api/clasificados/servicios/publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
const restaurantes = (await import("../app/api/clasificados/restaurantes/publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
const autos = (await import("../app/api/clasificados/autos/assisted-publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
const bienes = (await import("../app/api/clasificados/bienes-raices/negocio/assisted-publish/route")) as unknown as { POST: (r: never) => Promise<Response> };
const appContext = (await import("../app/api/admin/businesses/[businessId]/application-context/route")) as unknown as { GET: (r: never, c: { params: Promise<{ businessId: string }> }) => Promise<Response & { cookies: { get: (n: string) => { value: string } | undefined } }> };
const reader = await import("../app/lib/sales/prospectPreviewReader");

const PRESET_ID = BUSINESS_TYPE_PRESETS[0]!.id;
/** The smallest Servicios application state that passes the route's own readiness gate. */
function serviciosState(businessName = "Taquería Sol") {
  return {
    businessTypeId: PRESET_ID,
    businessName,
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

await checkAsync("C1: custody is established for Servicios and Restaurantes WITHOUT a client user id (owner-null custody)", async () => {
  for (const category of ["servicios", "restaurantes"] as QuickSalesCategory[]) {
    __reset(); signInAsSalesStaff(); seedBusiness();
    const res = await custody.POST(makeRequest({ category, businessId: BIZ }));
    assert.equal(res.status, 200, `${category}: ${await res.clone().text()}`);
    assert.ok(setCookieValue(res, "leonix_assisted_publish"), "a signed custody cookie is issued");
  }
});

await checkAsync("C2: Servicios saved TWICE under custody returns the SAME listing id and leaves exactly ONE row", async () => {
  __reset(); signInAsSalesStaff(); seedBusiness();
  const first = await custody.POST(makeRequest({ category: "servicios", businessId: BIZ }));
  assert.equal(first.status, 200);
  const jar1 = { leonix_assisted_publish: setCookieValue(first, "leonix_assisted_publish")! };
  const save1 = await servicios.POST(makeRequest({ assistedAction: "save_for_client", lang: "es", state: serviciosState() }, jar1));
  const body1 = (await save1.json()) as { ok: boolean; listingId?: string; error?: string; missing?: unknown };
  assert.equal(save1.status, 200, JSON.stringify(body1));
  assert.ok(body1.listingId, "first save returns the canonical id");
  assert.equal(__rows("servicios_public_listings").length, 1);
  assert.equal((__rows("servicios_public_listings")[0] as Record<string, unknown>).owner_user_id ?? null, null, "born owner-null: Leonix custody, not a personal account");
  assert.ok(__rows("business_listing_links").some((l: Record<string, unknown>) => l.listing_id === body1.listingId && l.status === "verified"), "custody ledger links the row to the business");

  // Reopen: custody re-established BOUND to the row (what PreparedListingsStrip's Reopen link does).
  signInAsSalesStaff();
  const reopen = await custody.POST(makeRequest({ category: "servicios", businessId: BIZ, listingId: body1.listingId }));
  assert.equal(reopen.status, 200, await reopen.clone().text());
  const jar2 = { leonix_assisted_publish: setCookieValue(reopen, "leonix_assisted_publish")! };
  const save2 = await servicios.POST(makeRequest({ assistedAction: "save_for_client", lang: "es", state: serviciosState("Taquería Sol Renombrada") }, jar2));
  const body2 = (await save2.json()) as { ok: boolean; listingId?: string; error?: string };
  assert.equal(save2.status, 200, JSON.stringify(body2));
  assert.equal(body2.listingId, body1.listingId, "same row on the second save");
  assert.equal(__rows("servicios_public_listings").length, 1, "no second row was created");
  // And a browser that DISAGREES with the bound row is refused, never resolved.
  const mismatch = await servicios.POST(makeRequest({ assistedAction: "save_for_client", lang: "es", existingListingId: "some-other-row", state: serviciosState() }, jar2));
  assert.equal(mismatch.status, 409);
  assert.equal(((await mismatch.json()) as { error: string }).error, "assisted_listing_mismatch");
  assert.equal(__rows("servicios_public_listings").length, 1);
});

check("C3: the session-conflict rule — pure truth table", () => {
  assert.equal(resolveAssistedSessionConflict({ assistedActive: false, customerUserId: STRANGER }), null, "not assisted: untouched");
  assert.equal(resolveAssistedSessionConflict({ assistedActive: true, customerUserId: null }), null, "assisted, no site session: fine");
  assert.equal(resolveAssistedSessionConflict({ assistedActive: true, contextClientUserId: CLIENT, customerUserId: CLIENT }), null, "assisted + the bound client's own session: fine");
  const a = resolveAssistedSessionConflict({ assistedActive: true, contextClientUserId: CLIENT, customerUserId: STRANGER });
  assert.deepEqual(a, { ok: false, error: "assisted_session_conflict", status: 409 });
  const b = resolveAssistedSessionConflict({ assistedActive: true, contextClientUserId: null, customerUserId: STRANGER });
  assert.deepEqual(b, { ok: false, error: "assisted_session_conflict", status: 409 }, "owner-null custody + any site session is a conflict");
});

await checkAsync("C4: all four assisted routes REFUSE (409) an assisted request that also carries an unrelated site session — and audit it", async () => {
  const cases: { name: string; post: (r: never) => Promise<Response>; category: string; body: unknown }[] = [
    { name: "servicios", post: servicios.POST, category: "servicios", body: { assistedAction: "save_for_client", lang: "es", state: serviciosState() } },
    { name: "restaurantes", post: restaurantes.POST, category: "restaurantes", body: { assistedAction: "save_for_client", draft: { name: "X" } } },
    { name: "autos", post: autos.POST, category: "autos", body: { assistedAction: "save_for_client", clientUserId: CLIENT, dealerListing: {} } },
    { name: "bienes-raices", post: bienes.POST, category: "bienes-raices", body: { assistedAction: "save_for_client", clientUserId: CLIENT, listingRow: {} } },
  ];
  for (const c of cases) {
    __reset(); signInAsSalesStaff(); seedBusiness();
    __setBearerTokens({ "stranger-token": STRANGER });
    const jar = { leonix_assisted_publish: assistedCookie({ category: c.category }) };
    const res = await c.post(makeRequest(c.body, jar, { authorization: "Bearer stranger-token" }));
    const json = (await res.json()) as { error?: string };
    assert.equal(res.status, 409, `${c.name}: ${res.status} ${JSON.stringify(json)}`);
    assert.equal(json.error, "assisted_session_conflict", c.name);
    assert.ok(__rows("admin_audit_log").some((r: Record<string, unknown>) => JSON.stringify(r).includes("assisted_session_conflict")), `${c.name}: the refusal is audited`);
    const before = { s: __rows("servicios_public_listings").length, r: __rows("restaurantes_public_listings").length, a: __rows("autos_classifieds_listings").length, l: __rows("listings").length };
    assert.deepEqual(before, { s: 0, r: 0, a: 0, l: 0 }, `${c.name}: nothing was written`);
  }
});

await checkAsync("C5: the bound client's OWN session is not a conflict (Autos/Bienes with clientUserId in custody)", async () => {
  for (const [name, post, category] of [["autos", autos.POST, "autos"], ["bienes-raices", bienes.POST, "bienes-raices"]] as const) {
    __reset(); signInAsSalesStaff(); seedBusiness();
    __setBearerTokens({ "client-token": CLIENT });
    const jar = { leonix_assisted_publish: assistedCookie({ category, clientUserId: CLIENT }) };
    const res = await post(makeRequest({ assistedAction: "save_for_client", clientUserId: CLIENT }, jar, { authorization: "Bearer client-token" }));
    const json = (await res.json()) as { error?: string };
    assert.notEqual(json.error, "assisted_session_conflict", `${name}: ${res.status} ${JSON.stringify(json)}`);
  }
});

await checkAsync("C6: unpaid publish is refused with 402 and publishes nothing", async () => {
  __reset(); signInAsSalesStaff(); seedBusiness();
  __seed("business_listing_links", [linkRow("servicios_public_listings", "row-1")]);
  __seed("servicios_public_listings", [{ id: "row-1", slug: "sol", business_name: "Sol", listing_status: "draft", owner_user_id: null }]);
  const jar = { leonix_assisted_publish: assistedCookie({ category: "servicios", listingId: "row-1" }) };
  const res = await workspacePublish.POST(makeRequest({}, jar));
  assert.equal(res.status, 402);
  assert.equal(((await res.json()) as { error: string }).error, "manual_payment_not_cleared");
  assert.equal((__rows("servicios_public_listings")[0] as Record<string, unknown>).listing_status, "draft");
  const status = await custody.GET(makeRequest({}, jar));
  const ctx = ((await status.json()) as { context: { publishReady: boolean; paymentState: string } }).context;
  assert.equal(ctx.publishReady, false);
  assert.equal(ctx.paymentState, "not_cleared");
});

await checkAsync("C7: the private preview is issued to staff, readable by a prospect with NO session, expiring, and writes nothing", async () => {
  __reset(); signInAsSalesStaff(); seedBusiness();
  __seed("business_listing_links", [linkRow("servicios_public_listings", "row-1")]);
  __seed("servicios_public_listings", [{ id: "row-1", slug: "sol", business_name: "Sol", city: "San José", listing_status: "draft", owner_user_id: null, profile_json: { businessName: "Sol" } }]);
  const jar = { leonix_assisted_publish: assistedCookie({ category: "servicios", listingId: "row-1" }) };
  const issued = await previewLink.POST(makeRequest({}, jar));
  const body = (await issued.json()) as { ok: boolean; previewPath: string; expiresAtMs: number };
  assert.equal(issued.status, 200, JSON.stringify(body));
  const token = new URL(body.previewPath, "http://x").searchParams.get("pv")!;
  assert.ok(token, "preview path carries the token under the documented param");
  assert.ok(body.expiresAtMs > Date.now() && body.expiresAtMs <= Date.now() + 72 * 3600 * 1000 + 1000, "72h ceiling");
  // The prospect: no staff cookie, no customer session.
  __setCookies({}); __setAuthUsers([]); __seed("admin_team_members", []);
  const ctx = verifyProspectPreviewTokenWithSecret(token, "servicios", PREVIEW_SECRET);
  assert.ok(ctx, "token verifies");
  const snapshot = JSON.stringify(__rows("servicios_public_listings"));
  const payload = await reader.readProspectPreviewPayload(ctx!);
  assert.ok(payload, "readable without any session");
  assert.equal(payload!.isPublic, false);
  assert.equal(payload!.title, "Sol");
  assert.equal(JSON.stringify(__rows("servicios_public_listings")), snapshot, "reading a preview mutates nothing");
  // A preview token is not staff authority.
  // No staff cookie at all → the staff gate answers 401; a stale staff cookie would answer 403. Either is a refusal.
  assert.ok([401, 403].includes((await previewLink.POST(makeRequest({}, { leonix_prospect_preview: token }))).status));
  assert.ok([401, 403].includes((await workspacePublish.POST(makeRequest({}, { leonix_prospect_preview: token }))).status));
});

await checkAsync("C8: application-context never clobbers a BOUND custody cookie for the same business + category", async () => {
  __reset(); signInAsSalesStaff(); seedBusiness();
  const bound = assistedCookie({ category: "servicios", listingId: "row-1" });
  const same = await appContext.GET(makeRequest({}, { leonix_assisted_publish: bound }, {}, `http://harness.invalid/api/admin/businesses/${BIZ}/application-context?category=servicios`), { params: Promise.resolve({ businessId: BIZ }) });
  assert.equal(same.status, 200, await same.clone().text());
  assert.equal(setCookieValue(same, "leonix_assisted_publish"), undefined, "same business + category with a bound row: cookie left alone");
  const other = await appContext.GET(makeRequest({}, { leonix_assisted_publish: bound }, {}, `http://harness.invalid/api/admin/businesses/${BIZ}/application-context?category=restaurantes`), { params: Promise.resolve({ businessId: BIZ }) });
  assert.equal(other.status, 200);
  assert.ok(setCookieValue(other, "leonix_assisted_publish"), "a different category re-mints (staff switching lanes)");
  const unbound = await appContext.GET(makeRequest({}, { leonix_assisted_publish: assistedCookie({ category: "servicios" }) }, {}, `http://harness.invalid/api/admin/businesses/${BIZ}/application-context?category=servicios`), { params: Promise.resolve({ businessId: BIZ }) });
  assert.ok(setCookieValue(unbound, "leonix_assisted_publish"), "an UNBOUND context may be re-minted");
});

await checkAsync("C9: the cockpit page resolves preselection server-side and refuses to invent a business", async () => {
  __reset(); signInAsSalesStaff(); seedBusiness();
  const mod = await import("../app/admin/(dashboard)/workspace/quick-sales/page");
  const tree = await mod.default({ searchParams: Promise.resolve({ category: "autos", businessId: BIZ, listingId: "row-1" }) });
  const client = collectClient(tree);
  assert.ok(client, "workspace client is rendered");
  assert.equal(client!.initialCategory, "autos");
  assert.deepEqual(client!.initialBusiness, { id: BIZ, name: "Taquería Sol" });
  assert.equal(client!.initialListingId, "row-1");
  const bad = await mod.default({ searchParams: Promise.resolve({ category: "viajes", businessId: "nope" }) });
  const badClient = collectClient(bad);
  assert.equal(badClient!.initialCategory, null, "an excluded category is not preselected");
  assert.equal(badClient!.initialBusiness, null, "an unknown business id is not preselected");
});
function collectClient(node: unknown): { initialCategory: unknown; initialBusiness: unknown; initialListingId: unknown } | null {
  if (!node || typeof node !== "object") return null;
  if (Array.isArray(node)) { for (const n of node) { const r = collectClient(n); if (r) return r; } return null; }
  const el = node as ReactElement<Record<string, unknown>>;
  const props = (el.props ?? {}) as Record<string, unknown>;
  if ("initialCategory" in props && "initialBusiness" in props) return props as never;
  return collectClient(props.children);
}

// =============================================================================
console.log(`\n${passed.length}/${checks} checks passed`);
for (const p of passed) console.log(`  OK   ${p}`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log("\nverify-quick-sales-entry-consolidation-01: ALL CHECKS EXECUTED AND PASSED");
}

main().catch((e) => {
  console.error("verifier crashed:", e);
  process.exit(1);
});
