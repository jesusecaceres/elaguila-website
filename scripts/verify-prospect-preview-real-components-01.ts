/**
 * PROSPECT PREVIEW — OWNER LOCK: Quick uses the SAME real presentation as Full/public.
 * Run: npx tsx --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-prospect-preview-real-components-01.ts
 *
 * For servicios / restaurantes / autos (dealer) / bienes-raices (negocio) the private prospect
 * preview (`/vista-previa/[category]?t=...`) must render the REAL public category components from
 * the stored row — not the generic clone (`ProspectCategoryPreviewShell`, 720px wrap,
 * `layoutQuickMedia`, `ProspectPreviewTranslateAd`) — while keeping the token + custody security
 * model and never mutating anything. The other four staff families keep the generic shell.
 *
 * Executed here: the category set, the Bienes row -> real-listing mapper, and the REAL reader
 * against the in-memory PostgREST harness (allow-listed `row`, no owner/internal leak, custody).
 * Source assertions here pin structure that cannot run without a browser (imports, props, gates).
 *
 * No network, no DB, no build.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { __reset, __seed, __rows } from "./lib/stubs/supabaseServer.mjs";
import {
  createProspectPreviewTokenWithSecret,
  verifyProspectPreviewTokenWithSecret,
  type ProspectPreviewCategory,
  type ProspectPreviewSource,
} from "../app/lib/auth/prospectPreviewToken";
import {
  PROSPECT_REAL_COMPONENT_CATEGORIES,
  isProspectRealComponentCategory,
} from "../app/lib/sales/prospectPreviewRealCategories";
import {
  buildProspectBienesNegocioListing,
  extractLeonixImageUrlsFromDescription,
  imageUrlsFromJsonb,
} from "../app/lib/sales/prospectBienesNegocioListing";
import { parseBienesAgenteResidencialPublishedState } from "../app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/application/utils/parseBienesAgenteResidencialPublishedState";

const SECRET = "prospect-real-components-harness-secret";
const NOW = 1_800_000_000_000;
const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

/** Source without comments, so a "must not contain X" assertion is about CODE, not prose. */
function code(src: string): string {
  return src
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .split(/\r?\n/)
    .map((l) => l.replace(/(^|[^:"'`\\])\/\/.*$/, "$1"))
    .join("\n");
}

/** A top-level `function name(...) { ... }` body, whitespace-normalized, `export ` dropped. */
function functionSource(src: string, name: string): string {
  const s = src.replace(/\r\n/g, "\n");
  const start = s.search(new RegExp(`(^|\\n)(export )?function ${name}\\(`));
  assert.ok(start >= 0, `function ${name} not found`);
  const end = s.indexOf("\n}\n", start);
  assert.ok(end > start, `function ${name} end not found`);
  return s
    .slice(start, end + 2)
    .replace(/^\s*export\s+/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const failures: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}
async function checkAsync(name: string, fn: () => Promise<void>) {
  checks += 1;
  try {
    await fn();
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const PAGE = "app/(site)/vista-previa/[category]/page.tsx";
const REAL = "app/(site)/vista-previa/[category]/ProspectRealCategoryPreview.tsx";
const AUTOS = "app/(site)/vista-previa/[category]/ProspectAutosDealerRealPreview.tsx";
const BIENES = "app/(site)/vista-previa/[category]/ProspectBienesNegocioRealPreview.tsx";
const READER = "app/lib/sales/prospectPreviewReader.ts";
const REAL_FILES = [REAL, AUTOS, BIENES];

function mintCtx(category: ProspectPreviewCategory, source: ProspectPreviewSource, listingId: string) {
  const token = createProspectPreviewTokenWithSecret(
    { category, listingSource: source, listingId, businessId: "biz-1", issuedByRosterId: "roster-1" },
    SECRET,
    NOW,
  );
  assert.ok(token, "token must mint");
  const ctx = verifyProspectPreviewTokenWithSecret(token!, category, SECRET, NOW + 1000);
  assert.ok(ctx, "token must verify");
  return ctx!;
}

function link(source: string, id: string) {
  return { id: `link-${id}`, business_id: "biz-1", listing_source: source, listing_id: id, status: "verified", linked_by: "staff-auth" };
}

async function main() {
  // ===========================================================================
  // A — which families get the real components
  // ===========================================================================
  check("A1: exactly servicios, restaurantes, autos, bienes-raices use the real components", () => {
    assert.deepEqual([...PROSPECT_REAL_COMPONENT_CATEGORIES].sort(), ["autos", "bienes-raices", "restaurantes", "servicios"]);
    for (const c of ["servicios", "restaurantes", "autos", "bienes-raices"]) assert.equal(isProspectRealComponentCategory(c), true, c);
    for (const c of ["rentas", "empleos", "autos-privado", "comida-local", "", "x", null, undefined, 7]) {
      assert.equal(isProspectRealComponentCategory(c), false, String(c));
    }
  });

  check("A2: page renders the real branch for those four BEFORE the generic shell, and keeps the generic shell for the rest", () => {
    const page = read(PAGE);
    const c = code(page);
    assert.ok(c.includes("isProspectRealComponentCategory(category)"));
    assert.ok(c.includes("renderProspectRealCategoryPreview({ category, payload, lang })"));
    const realIdx = c.indexOf("renderProspectRealCategoryPreview({");
    const genericIdx = c.indexOf("<ProspectCategoryPreviewShell");
    assert.ok(realIdx > 0 && genericIdx > realIdx, "the real branch must come before the generic shell");
    // The generic shell + its own Translate Ad + 720px wrap are still there for the other four.
    assert.ok(c.includes("<ProspectPreviewTranslateAd"));
    assert.ok(c.includes("buildProspectLeonixPreviewVm"));
    assert.ok(c.includes("maxWidth: 720"));
    // The real branch is gated by the pure set only — no other family can slip into it.
    assert.equal(/category === "(rentas|empleos|autos-privado|comida-local)"/.test(c), false);
  });

  check("A3: the real-component frame sets NO width on the component (no 720, no maxWidth on the frame)", () => {
    const c = code(read(PAGE));
    const start = c.indexOf("realShell: {");
    const end = c.indexOf("realNotice: {");
    assert.ok(start > 0 && end > start);
    const realShellStyle = c.slice(start, end);
    assert.equal(/maxWidth|width:/.test(realShellStyle), false, "realShell must not constrain width");
    assert.equal(realShellStyle.includes("display: \"flex\""), false, "realShell must not center-flex the component");
    assert.ok(realShellStyle.includes('paddingTop: "calc(5.25rem + env(safe-area-inset-top, 0px))"'), "still clears the fixed navbar");
    // The notice wrapper bounds banner/footnotes only, and is not the old 720 wrap.
    const noticeStyle = c.slice(end, c.indexOf("}", end + 20) + 1);
    assert.equal(noticeStyle.includes("720"), false);
  });

  check("A4: the banner, language param, expiry footnote and isPublic note survive on the real branch", () => {
    const c = code(read(PAGE));
    const branch = c.slice(c.indexOf("isProspectRealComponentCategory(category)"), c.indexOf("<ProspectCategoryPreviewShell"));
    assert.ok(branch.includes('lang === "en" ? "Preview" : "Vista previa"'));
    assert.ok(branch.includes('lang === "en" ? "Not published" : "No publicado"'));
    assert.ok(branch.includes("{expiresLabel}"));
    assert.ok(branch.includes("payload.isPublic"));
    assert.ok(branch.includes("data-prospect-preview-clears-navbar"));
    assert.ok(c.includes("const lang = previewLang(query.lang)"));
    assert.ok(c.includes("renderProspectRealCategoryPreview({ category, payload, lang })"), "lang is handed to the real renderer");
  });

  // ===========================================================================
  // B — the real components, and none of the generic clone
  // ===========================================================================
  check("B1: servicios renders the real public shells with the public template rule", () => {
    const src = read(REAL);
    for (const needle of [
      'import { ServiciosProfileView } from "@/app/servicios/components/ServiciosProfileView"',
      'import { ServiciosProfessionalProfileShell } from "@/app/servicios/components/ServiciosProfessionalProfileShell"',
      'import { resolveServiciosProfile } from "@/app/servicios/lib/resolveServiciosProfile"',
      "isServiciosProfessionalTemplate",
      "resolveServiciosListingTemplate",
      "applyServiciosPublicOffersVisibility",
      "mergeServiciosProfileWithApprovedDbReviews",
      "<ServiciosProfessionalProfileShell",
      "<ServiciosProfileView",
    ]) {
      assert.ok(src.includes(needle), `missing ${needle}`);
    }
    // Same steps as the public page, in the same order.
    const pub = read("app/(site)/clasificados/servicios/[slug]/page.tsx");
    for (const needle of ["resolveServiciosProfile(wireMerged, lang)", "isServiciosProfessionalTemplate(listingTemplate)", "showTopBar={false}"]) {
      assert.ok(pub.includes(needle), `public page changed: ${needle}`);
    }
  });

  check("B2: restaurantes renders the real public wrapper + story component", () => {
    const src = read(REAL);
    for (const needle of [
      "listingJsonToDraft(payload.content)",
      "mapRestauranteDraftToShellData(draft, { lang })",
      "<RestaurantesShellChrome lang={lang}>",
      '<ClasificadosPreviewAdCanvas className="overflow-hidden">',
      "<RestauranteAdStoryPreview",
      "restauranteCouponsCapabilityActive",
    ]) {
      assert.ok(src.includes(needle), `missing ${needle}`);
    }
    const pub = read("app/(site)/clasificados/restaurantes/[slug]/page.tsx");
    for (const needle of [
      "listingJsonToDraft(row.listing_json)",
      "mapRestauranteDraftToShellData(draft, { lang })",
      "<RestaurantesShellChrome lang={lang}>",
      '<ClasificadosPreviewAdCanvas className="overflow-hidden">',
    ]) {
      assert.ok(pub.includes(needle), `public page changed: ${needle}`);
    }
  });

  check("B3: autos dealer renders the real translation layer + locale provider + dealership page in public mode", () => {
    const src = read(AUTOS);
    for (const needle of [
      "AutosListingTranslationLayer",
      "AutosNegociosPreviewLocaleProvider",
      "<AutosNegociosDealershipPreviewPage",
      "publicPlaybackOnly",
      "normalizeLoadedListing",
      "withNormalizedVehicleIdentityForDisplay",
    ]) {
      assert.ok(src.includes(needle), `missing ${needle}`);
    }
    const pub = read("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
    for (const needle of ["<AutosNegociosDealershipPreviewPage", "publicPlaybackOnly", "<AutosListingTranslationLayer", "normalizeAutosNegociosLang(adDisplayLang)"]) {
      assert.ok(pub.includes(needle), `public client changed: ${needle}`);
    }
  });

  check("B4: bienes negocio renders the real published-state parser, translation hook and agente preview page", () => {
    const src = read(BIENES);
    for (const needle of [
      "parseBienesAgenteResidencialPublishedState",
      "useBienesNegocioShellTranslation",
      "<TranslateAdControl",
      "requestAdTranslation",
      "<AgenteIndividualResidencialPreviewPage",
      "BrAgenteResidencialLocaleProvider",
      "publicChrome=",
    ]) {
      assert.ok(src.includes(needle), `missing ${needle}`);
    }
    // The Translate Ad wiring must stay identical to the public shell (same category + cache version).
    const shell = read("app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx");
    for (const needle of ['category="bienes-raices"', 'version="bienes-negocio-t1-v1"', "requestTranslation={requestAdTranslation}"]) {
      assert.ok(src.includes(needle) && shell.includes(needle), `translation wiring drifted: ${needle}`);
    }
  });

  check("B5: NONE of the real-component files use the generic clone, layoutQuickMedia, a 720 width or a second Translate Ad", () => {
    for (const rel of REAL_FILES) {
      const c = code(read(rel));
      for (const bad of ["ProspectCategoryPreviewShell", "ProspectPreviewTranslateAd", "layoutQuickMedia", "quickMediaGridClass", "buildProspectLeonixPreviewVm", "prospectPreviewDisplay", "720", "maxWidth"]) {
        assert.equal(c.includes(bad), false, `${rel} must not contain ${bad}`);
      }
      assert.equal(c.includes("/api/translate-ad"), false, `${rel} must not call a translation API itself`);
    }
  });

  // ===========================================================================
  // C — nothing mutates, nothing is recorded
  // ===========================================================================
  check("C1: no real-component file has a write path, browser Supabase, fetch or analytics recorder of its own", () => {
    for (const rel of REAL_FILES) {
      const c = code(read(rel));
      for (const bad of [
        "createSupabaseBrowserClient",
        "getAdminSupabase",
        "fetch(",
        ".insert(",
        ".update(",
        ".upsert(",
        ".delete(",
        ".rpc(",
        "localStorage",
        "sendBeacon",
        "ProfileViewAnalytics",
        "VehicleProfileViewAnalytics",
        "InlineListingReport",
        "OwnerInventoryBar",
      ]) {
        assert.equal(c.includes(bad), false, `${rel} must not contain ${bad}`);
      }
      assert.equal(/from\(["']/.test(c), false, `${rel} must not query a table`);
    }
  });

  check("C2: servicios engagement is off — no slug / source id / owner id / share url, controls hidden, persistence off", () => {
    const c = code(read(REAL));
    const start = c.indexOf("const profileShellProps");
    const end = c.indexOf("} as const;", start);
    const props = c.slice(start, end);
    assert.ok(props.includes("showEngagementControls: false"));
    assert.ok(props.includes("persistListingEngagement: false"));
    assert.ok(props.includes("showPublicLeadInquiryForm: false"));
    for (const bad of ["analyticsListingSlug", "listingSourceId", "engagementListingId", "engagementOwnerUserId", "listingShareUrl", "publicLikeCount", "justPublishedPanel", "editBackHref"]) {
      assert.equal(props.includes(bad), false, `servicios props must not pass ${bad}`);
    }
  });

  check("C3: restaurantes engagement is off — empty source id (not undefined), no slug/owner, persistence off, no view beacon", () => {
    const c = code(read(REAL));
    const start = c.indexOf("<RestauranteAdStoryPreview");
    const end = c.indexOf("/>", start);
    const jsx = c.slice(start, end);
    assert.ok(jsx.includes('listingSourceId=""'));
    assert.ok(jsx.includes('listingSlug=""'));
    assert.ok(jsx.includes("analyticsOwnerUserId={null}"));
    assert.ok(jsx.includes("persistListingEngagement={false}"));
    assert.ok(jsx.includes("linkedOffers={[]}"));
    assert.equal(c.includes("RestauranteProfileViewAnalytics"), false);
    // The component falls back to data.id for an UNDEFINED source id — prove the fallback shape so
    // the empty-string guard above stays load-bearing.
    const story = read("app/(site)/clasificados/restaurantes/shell/RestauranteAdStoryPreview.tsx");
    assert.ok(story.includes('(listingSourceId ?? data.id ?? "").trim()'));
  });

  check("C4: autos dealer passes NO publicAnalytics (every Like/Save/Share/CTA recorder is gated on it)", () => {
    const c = code(read(AUTOS));
    assert.equal(c.includes("publicAnalytics"), false);
    assert.equal(c.includes("publicUrl"), false);
    assert.ok(c.includes("listingAnalytics: undefined"));
    assert.ok(c.includes("relatedDealerListings: undefined"));
    const stack = read("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
    assert.ok(stack.includes("publicPlaybackOnly && analyticsCtx && publicAnalytics?.listingSourceId"), "recorders still gated on publicAnalytics");
    assert.ok(stack.includes("publicAnalytics?.listingSourceId?.trim()"), "contact meta still gated on publicAnalytics");
  });

  check("C5: bienes negocio has no analytics context, no owner id, no Save/Share/portfolio/parent fetch", () => {
    const c = code(read(BIENES));
    assert.ok(c.includes("analyticsContext={null}"));
    assert.ok(c.includes("ownerId={null}"));
    assert.ok(c.includes("parentIdentity: null"));
    assert.ok(c.includes("meta: null"), "must not claim 'Published listing' for an unpublished ad");
    for (const bad of ["PublicChromeActions", "LeonixShareButton", "LeonixSaveButton", "RelatedBrAgentProperties", "fetchBrRelatedInventoryListingsForDetail", "saved_listings"]) {
      assert.equal(c.includes(bad), false, `must not contain ${bad}`);
    }
    // ...and the analytics/owner-gated code paths in the real page really are gated on those props.
    const side = read("app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/BrAgenteResContactSidebar.tsx");
    assert.ok(side.includes("if (analyticsContext) fn(analyticsContext);"));
    const trust = read("app/(site)/clasificados/lib/BrRentasCommunityTrustSection.tsx");
    assert.ok(trust.includes("if (!trimmedOwnerId) return;"));
  });

  check("C6: the real-component server module only reads (read-only entitlement lookups) and imports the reader type only", () => {
    const c = code(read(REAL));
    assert.ok(c.includes("resolveBusinessToolsAccess"));
    assert.ok(c.includes("restauranteCouponsCapabilityActive"));
    assert.ok(/import type \{ ProspectPreviewPayload \}/.test(c), "reader is imported as a type only");
    const plan = code(read("app/lib/listingPlans/categoryCommercialPlan.ts"));
    for (const bad of [".insert(", ".update(", ".upsert(", ".delete(", ".rpc("]) assert.equal(plan.includes(bad), false, `entitlement resolver must stay read-only (${bad})`);
  });

  // ===========================================================================
  // D — token + custody + whitelist security model is intact
  // ===========================================================================
  check("D1: SafeRefusal still covers non-category, bad token, custody failure — before any real render", () => {
    const c = code(read(PAGE));
    const iCat = c.indexOf("if (!isQuickSalesCategory(category)) return <SafeRefusal lang={lang} />;");
    const iCtx = c.indexOf("readProspectPreviewContext(rawToken, category)");
    const iCtxRefuse = c.indexOf("if (!ctx) return <SafeRefusal lang={lang} />;");
    const iPayload = c.indexOf("readProspectPreviewPayload(ctx)");
    const iPayloadRefuse = c.indexOf("if (!payload) return <SafeRefusal lang={lang} />;");
    const iReal = c.indexOf("renderProspectRealCategoryPreview({");
    assert.ok(iCat > 0 && iCtx > iCat && iCtxRefuse > iCtx && iPayload > iCtxRefuse && iPayloadRefuse > iPayload);
    assert.ok(iReal > iPayloadRefuse, "no real component is built before token + custody + payload all pass");
    assert.ok(c.includes("export const dynamic = \"force-dynamic\""));
    assert.ok(c.includes("PREVIEW_NOINDEX_METADATA"));
  });

  check("D2: reader — allow-listed columns only, never select('*'), single custody-first SELECT, no write path, no owner/payment/notes/moderation column", () => {
    const src = read(READER);
    const c = code(src);
    assert.equal(/select\(\s*["'`]\*["'`]/.test(c), false, "select('*') is forbidden");
    for (const bad of [".insert(", ".update(", ".upsert(", ".delete(", ".rpc("]) assert.equal(c.includes(bad), false, `reader must not contain ${bad}`);
    assert.ok(c.indexOf("isListingLinkedToBusiness(") < c.indexOf(".from(ctx.listingSource)"), "custody is proven before the row read");
    assert.equal((c.match(/\.from\(/g) ?? []).length, 1, "exactly one table read in the reader");
    // Every column list in the file (SOURCE_COLUMNS + the BR list) is free of private columns.
    const lists = src.match(/"id, [^"]+"/g) ?? [];
    assert.ok(lists.length >= 7, `expected the per-source column lists, saw ${lists.length}`);
    for (const list of lists) {
      for (const bad of ["owner_id", "owner_user_id", "user_id", "payment", "stripe", "amount", "notes", "moderation", "internal_notes", "br_inventory", "inventory_role", "rentas_tier", "expires_at", "email_verified"]) {
        assert.equal(list.includes(bad), false, `column list must not include ${bad}: ${list}`);
      }
    }
    // The only widening is category-scoped (Bienes), and `contact_json` is reduced to `channels`.
    assert.ok(c.includes('ctx.category === "bienes-raices"'));
    assert.ok(c.includes("contact_json: channels ? { channels } : null"));
  });

  await checkAsync("D3: reader executes — real components get an allow-listed `row`, everyone else gets none, nothing private leaks, nothing is written", async () => {
    const reader = await import("../app/lib/sales/prospectPreviewReader");
    __reset();
    const OWNER = "11111111-1111-4111-8111-111111111111";
    __seed("business_listing_links", [
      link("servicios_public_listings", "svc-1"),
      link("restaurantes_public_listings", "rest-1"),
      link("autos_classifieds_listings", "auto-1"),
      link("autos_classifieds_listings", "auto-2"),
      link("listings", "br-1"),
      link("listings", "rent-1"),
    ]);
    __seed("servicios_public_listings", [
      {
        id: "svc-1", slug: "taller", business_name: "Taller Uno", city: "Dallas", state: "TX", listing_status: "draft",
        profile_json: { businessName: "Taller Uno" }, leonix_ad_id: "SVC-2026-000001", leonix_verified: true, internal_group: "trades",
        owner_user_id: OWNER, moderation_notes: "DO-NOT-SHOW", stripe_customer: "cus_SECRET",
      },
    ]);
    __seed("restaurantes_public_listings", [
      { id: "rest-1", slug: "rico", status: "draft", listing_json: { businessName: "Rico" }, owner_user_id: OWNER, internal_notes: "DO-NOT-SHOW" },
    ]);
    __seed("autos_classifieds_listings", [
      { id: "auto-1", status: "draft", lang: "en", listing_payload: { businessName: "Motors", vehicleTitle: "2020 Truck" }, owner_user_id: OWNER, lane: "negocios" },
      { id: "auto-2", status: "draft", lang: "en", listing_payload: { title: "Sedan" }, owner_user_id: OWNER },
    ]);
    __seed("listings", [
      {
        id: "br-1", title: "Casa bonita", description: "Linda casa", city: "Dallas", state: "TX", zip: "75001", price: 350000, is_free: false,
        status: "pending", is_published: false, listing_json: { v: 1 }, leonix_ad_id: "BR-2026-000009", detail_pairs: [{ label: "Baños", value: "2" }],
        contact_json: { channels: { whatsapp: "+1 214 555 0100" }, ownerPrivate: { secret: "DO-NOT-SHOW" } },
        business_name: "Casas TX", business_meta: "{\"agentName\":\"Ana\"}", contact_phone: "214-555-0100", contact_email: "a@b.co",
        images: ["https://cdn.example/1.jpg"], owner_id: OWNER, internal_notes: "DO-NOT-SHOW", moderation_state: "flagged", stripe_payment_intent: "pi_SECRET",
        br_inventory_group_id: "grp-1", inventory_role: "main",
      },
      { id: "rent-1", title: "Renta", description: "d", city: "Dallas", state: "TX", price: 900, is_free: false, status: "pending", is_published: false, listing_json: { v: 1 }, owner_id: OWNER },
    ]);
    const before = JSON.stringify({
      s: __rows("servicios_public_listings"), r: __rows("restaurantes_public_listings"), a: __rows("autos_classifieds_listings"), l: __rows("listings"),
    });

    const svc = await reader.readProspectPreviewPayload(mintCtx("servicios", "servicios_public_listings", "svc-1"));
    assert.deepEqual(svc?.row, { leonix_ad_id: "SVC-2026-000001", leonix_verified: true, internal_group: "trades" });
    assert.deepEqual(svc?.content, { businessName: "Taller Uno" }, "content is untouched for servicios");

    const rest = await reader.readProspectPreviewPayload(mintCtx("restaurantes", "restaurantes_public_listings", "rest-1"));
    assert.equal(rest?.row, null);
    assert.deepEqual(rest?.content, { businessName: "Rico" });

    const auto = await reader.readProspectPreviewPayload(mintCtx("autos", "autos_classifieds_listings", "auto-1"));
    assert.deepEqual(auto?.row, { lang: "en" });
    assert.equal((auto?.content as Record<string, unknown>).vehicleTitle, "2020 Truck");
    const priv = await reader.readProspectPreviewPayload(mintCtx("autos-privado", "autos_classifieds_listings", "auto-2"));
    assert.equal(priv?.row, null, "autos-privado stays on the generic shell");

    const br = await reader.readProspectPreviewPayload(mintCtx("bienes-raices", "listings", "br-1"));
    assert.ok(br?.row);
    assert.deepEqual(Object.keys(br!.row!).sort(), [
      "business_meta", "business_name", "city", "contact_email", "contact_json", "contact_phone", "description", "detail_pairs",
      "id", "images", "is_free", "leonix_ad_id", "listing_json", "price", "title", "zip",
    ]);
    assert.deepEqual(br!.row!.contact_json, { channels: { whatsapp: "+1 214 555 0100" } }, "only the public channels leave contact_json");
    const rent = await reader.readProspectPreviewPayload(mintCtx("rentas", "listings", "rent-1"));
    assert.equal(rent?.row, null, "rentas shares the listings table but stays on the generic shell");

    const leaked = JSON.stringify([svc, rest, auto, priv, br, rent]);
    for (const secret of ["DO-NOT-SHOW", OWNER, "cus_SECRET", "pi_SECRET", "flagged", "grp-1", "ownerPrivate"]) {
      assert.equal(leaked.includes(secret), false, `a private value reached the payload: ${secret}`);
    }
    assert.equal(
      JSON.stringify({ s: __rows("servicios_public_listings"), r: __rows("restaurantes_public_listings"), a: __rows("autos_classifieds_listings"), l: __rows("listings") }),
      before,
      "reading a preview must not change one column",
    );
  });

  await checkAsync("D4: custody is still re-proven at redemption for a real-component family (revoked link -> null, no row read)", async () => {
    const reader = await import("../app/lib/sales/prospectPreviewReader");
    __reset();
    __seed("business_listing_links", []);
    __seed("listings", [{ id: "br-9", title: "Casa", description: "d", city: "Dallas", state: "TX", price: 1, is_free: false, status: "pending", is_published: false, listing_json: {}, owner_id: "x" }]);
    assert.equal(await reader.readProspectPreviewPayload(mintCtx("bienes-raices", "listings", "br-9")), null);
  });

  // ===========================================================================
  // E — Bienes row -> real listing mapping (executed) + drift pins against the public page
  // ===========================================================================
  check("E1: mapper builds the same BienesLiveListingLike the public page builds, minus every owner/inventory identity", () => {
    const listing = buildProspectBienesNegocioListing(
      {
        id: "br-1", title: " Casa bonita ", description: "Linda casa\n[LEONIX_IMAGES]\nurl=https://cdn.example/2.jpg\n[/LEONIX_IMAGES]", city: " Dallas ", zip: "75001",
        price: 350000, is_free: false, detail_pairs: [{ label: "Baños", value: "2" }],
        listing_json: null, contact_json: { channels: { whatsapp: "+1 214 555 0100" } }, business_name: "Casas TX",
        business_meta: "{\"agentName\":\"Ana\"}", contact_phone: " 214-555-0100 ", contact_email: "a@b.co", leonix_ad_id: " BR-2026-000009 ",
        images: ["https://cdn.example/1.jpg", { url: "https://cdn.example/3.jpg" }],
      },
      "fallback",
    );
    assert.ok(listing);
    assert.equal(listing!.id, "br-1");
    assert.deepEqual(listing!.title, { es: "Casa bonita", en: "Casa bonita" });
    assert.equal(listing!.priceLabel.es, "$350,000");
    assert.equal(listing!.city, "Dallas");
    assert.equal(listing!.blurb.es, "Linda casa");
    assert.deepEqual(listing!.images, ["https://cdn.example/1.jpg", "https://cdn.example/3.jpg", "https://cdn.example/2.jpg"]);
    assert.equal(listing!.owner_id, null);
    assert.equal(listing!.inventory_role, null);
    assert.equal(listing!.br_inventory_group_id, null);
    assert.equal(listing!.br_inventory_parent_listing_id, null);
    assert.equal(listing!.leonix_ad_id, "BR-2026-000009");
    assert.equal(listing!.contact_phone, "214-555-0100");
    assert.equal(listing!.zip, "75001");
    assert.equal(listing!.priceNumber, 350000);
    const pairs = listing!.detailPairs as Array<{ label: string; value: string }>;
    assert.ok(pairs.some((p) => p.label === "Baños"));
    assert.ok(pairs.some((p) => p.label === "Leonix:contact_channels_v1" && p.value.includes("whatsapp")), "public contact channels are hydrated like the public read");
    assert.equal(buildProspectBienesNegocioListing(null, "x"), null);
    assert.equal(buildProspectBienesNegocioListing(undefined, "x"), null);
  });

  check("E2: the mapped listing runs through the REAL published-state parser the public shell uses", () => {
    const listing = buildProspectBienesNegocioListing(
      { id: "br-1", title: "Casa", description: "d", city: "Dallas", zip: "75001", price: 1000, detail_pairs: [], business_name: "Casas TX", images: [] },
      "br-1",
    )!;
    const state = parseBienesAgenteResidencialPublishedState({ listing, parentIdentity: null, lang: "es" });
    assert.equal(state.titulo, "Casa");
    assert.equal(state.ciudad, "Dallas");
  });

  check("E3: mapper image helpers are pinned VERBATIM to the public anuncio page (no silent drift)", () => {
    const pub = read("app/(site)/clasificados/anuncio/[id]/page.tsx");
    const mine = read("app/lib/sales/prospectBienesNegocioListing.ts");
    for (const name of ["imageUrlsFromJsonb", "extractLeonixImageUrlsFromDescription"]) {
      assert.equal(functionSource(mine, name), functionSource(pub, name), `${name} drifted from the public page`);
    }
    assert.deepEqual(imageUrlsFromJsonb(["a ", { src: "b" }, 3, null]), ["a", "b"]);
    assert.deepEqual(extractLeonixImageUrlsFromDescription("x[LEONIX_IMAGES]\nurl=u1\n[/LEONIX_IMAGES]"), ["u1"]);
    // ...and the public page still builds brListingProps from the same source fields.
    for (const needle of ["priceLabel: listing.priceLabel", "business_meta: listing.business_meta ?? null", "contact_phone: listing.contact_phone ?? null", "zip: listing.zip ?? null"]) {
      assert.ok(pub.includes(needle), `public page changed: ${needle}`);
    }
  });

  check("E4: stripped-down wrapper only omits what mutates — it still uses every render input the public shell passes", () => {
    const shell = read("app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx");
    const mine = read(BIENES);
    assert.ok(shell.includes("parseBienesAgenteResidencialPublishedState({ listing, parentIdentity, lang })"));
    assert.ok(mine.includes("parseBienesAgenteResidencialPublishedState({ listing, parentIdentity: null, lang })"));
    assert.ok(shell.includes("<AgenteIndividualResidencialPreviewPage") && mine.includes("<AgenteIndividualResidencialPreviewPage"));
    assert.ok(shell.includes('<div className="bg-[#F9F6F1]">') && mine.includes('<div className="bg-[#F9F6F1]">'));
  });

  console.log(`\n${checks - failures.length}/${checks} passed`);
  if (failures.length) {
    console.error(`\n${failures.length} FAILED`);
    for (const f of failures) console.error(`  FAIL ${f}`);
    process.exit(1);
  }
  console.log("\nverify-prospect-preview-real-components-01: ALL CHECKS EXECUTED AND PASSED");
}

void main();
