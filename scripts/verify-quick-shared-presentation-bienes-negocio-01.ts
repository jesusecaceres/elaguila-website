/**
 * BIENES RAÍCES NEGOCIO — Quick / Full SHARED PRESENTATION (owner lock 2026-09-24).
 *
 * Quick renders through the SAME canonical BR negocio presentation as Full/public; the difference is
 * entitlement data only:
 *  - the public detail (BienesRaicesNegocioLiveDetailShell) and the canonical preview
 *    (AgenteIndividualResidencialPreviewClient) both render AgenteIndividualResidencialPreviewPage; no
 *    Quick-specific component, CSS or hardcoded width;
 *  - the share pill keeps the shared Leonix drawer but hides its label below `sm` again (production parity);
 *  - `plan=quick` survives application -> preview -> "Volver a editar" (executed with carryBusinessPlanParam)
 *    and is never rewritten to plan=full;
 *  - the Quick photo cap (Bienes Negocio = 3) comes from the ONE table; Full keeps 40 photos + video;
 *  - Full-only fields (extra websites, socials, Google/Yelp/Google Business, extra links, video) are hidden in
 *    the application for Quick and stripped SERVER-side (customer quick-publish, staff assisted-publish and the
 *    owner listing-edit), RESTORING stored values, and only for a PROVEN Quick product (never `unverified`);
 *  - Quick = ONE active property, no inventory add-on: refused for a proven Quick parent, staff insert forced main;
 *  - Full behavior is unchanged.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-shared-presentation-bienes-negocio-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { quickImageMaxForBusinessCategory } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { businessPlanFromParam, carryBusinessPlanParam } from "../app/lib/listingPlans/businessQuickPlanSignal";
import {
  applyQuickFullOnlyBoundary,
  quickFullOnlyBoundaryApplies,
} from "../app/lib/quickBusiness/quickFullOnlyBoundary";
import { resolveQuickBusinessProduct } from "../app/lib/listingPlans/quickBusinessProductIdentity";
import { LEONIX_DP_CONTACT_CHANNELS_V1 } from "../app/(site)/clasificados/lib/leonixContactChannelsV1";
import {
  QUICK_BIENES_CONTACT_CHANNELS_PAIR_LABEL,
  QUICK_BIENES_FULL_ONLY_CHANNEL_KEYS,
  QUICK_BIENES_FULL_ONLY_FORM_FIELDS,
  QUICK_BIENES_FULL_ONLY_META_KEYS,
  blankQuickBienesFullOnlyFormFields,
  countBienesRowExternalVideos,
  declareQuickBienesPropertyRoles,
  forceQuickBienesMainInventoryRow,
  quickBienesGalleryGrowthAllowed,
  quickBienesImageCap,
  quickBienesInventoryAddonRefusal,
  quickBienesNetNewExternalVideoCount,
  stripQuickBienesFullOnlyFields,
} from "../app/lib/clasificados/bienes-raices/stripQuickBienesFullOnlyFields";
import {
  executeQuickBienesPublish,
  type QuickBienesPublishPorts,
} from "../app/lib/clasificados/bienes-raices/quickBienesPublishOperation";

const failures: string[] = [];
function check(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(fn)
    .then(
      () => console.log(`OK: ${name}`),
      (e) => {
        failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
        console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
      },
    );
}
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

const BR = "app/(site)/clasificados/publicar/bienes-raices/negocio";
const LIVE = "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx";
const PREVIEW = `${BR}/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx`;
const PREVIEW_PAGE = `${BR}/agente-individual/preview/AgenteIndividualResidencialPreviewPage.tsx`;
const APP = `${BR}/agente-individual/application/AgenteIndividualResidencialApplication.tsx`;
const STEPS_A = `${BR}/agente-individual/sections/steps01-03.tsx`;
const STEPS_B = `${BR}/agente-individual/sections/steps04-09.tsx`;
const PRICING = `${BR}/application/sections/shared/BrAgenteApplicationPricingSummary.tsx`;
const META_BUILDER = "app/(site)/clasificados/lib/leonixNegocioBusinessMetaFromFormState.ts";
const QUICK_ROUTE = "app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts";
const OPERATION = "app/lib/clasificados/bienes-raices/quickBienesPublishOperation.ts";
const ASSISTED = "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts";
const EDIT = "app/api/clasificados/bienes-raices/listing-edit/route.ts";
const CHECKOUT = "app/lib/listingPlans/revenueCheckout.ts";
const CARD = "app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx";
const FEATURED = "app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioFeaturedCard.tsx";

// Decisions as the real resolver produces them.
const QUICK_ASSISTED = resolveQuickBusinessProduct({ category: "bienes-raices", assistedPackageKey: "br_agent_quick_monthly" });
const QUICK_ENTITLED = resolveQuickBusinessProduct({
  category: "bienes-raices",
  liveEntitlementRows: [{ packageKey: "br_agent_quick_monthly" }],
});
const QUICK_CUSTODY = resolveQuickBusinessProduct({ category: "bienes-raices", serverCustodyQuick: true });
const FULL_ENTITLED = resolveQuickBusinessProduct({
  category: "bienes-raices",
  liveEntitlementRows: [{ packageKey: "br_agent_monthly" }],
});
const UNVERIFIED = resolveQuickBusinessProduct({ category: "bienes-raices" });
const FSBO = resolveQuickBusinessProduct({ category: "bienes-raices-privado-not-a-split" });

const FULL_META = {
  negocioAgente: "Ana Agente",
  negocioSitioWeb: "https://ana.example.com",
  negocioRedes: "https://instagram.com/ana\nhttps://facebook.com/ana",
  negocioInstagram: "https://instagram.com/ana",
  negocioFacebook: "https://facebook.com/ana",
  negocioYoutube: "https://youtube.com/@ana",
  negocioTiktok: "https://tiktok.com/@ana",
  negocioExternalVideoUrls: JSON.stringify(["https://youtu.be/aaa", "https://youtu.be/bbb"]),
  negocioBusinessExtraUrls: JSON.stringify([{ title: "Blog", url: "https://blog.example.com" }]),
  negocioGoogleBusinessUrl: "https://g.page/ana",
  negocioGoogleReviewsUrl: "https://g.page/ana/review",
  negocioYelpReviewsUrl: "https://yelp.com/biz/ana",
};
const fullRow = () => ({
  title: "Casa",
  business_meta: JSON.stringify(FULL_META),
  profile_json: { v: 1, businessMeta: { ...FULL_META } },
  contact_json: {
    v: 1,
    phone: "4155551234",
    channels: { website: "https://ana.example.com", instagram: "https://instagram.com/ana", facebook: "https://facebook.com/ana", youtube: null, tiktok: "https://tiktok.com/@ana" },
  },
  detail_pairs: [
    { label: "Recámaras", value: "3" },
    {
      label: LEONIX_DP_CONTACT_CHANNELS_V1,
      value: JSON.stringify({ v: 1, allowCall: true, website: "https://ana.example.com", instagram: "https://instagram.com/ana", facebook: null, youtube: null, tiktok: "https://tiktok.com/@ana" }),
    },
  ],
});

async function main() {
  // -------------------------------------------------------------------------------------------
  // 1. Shared presentation
  // -------------------------------------------------------------------------------------------
  await check("presentation: public detail and canonical preview render the SAME AgenteIndividualResidencialPreviewPage", () => {
    const live = raw(LIVE);
    const preview = raw(PREVIEW);
    assert.ok(live.includes("AgenteIndividualResidencialPreviewPage"), "public shell renders the shared page");
    assert.ok(preview.includes("AgenteIndividualResidencialPreviewPage"), "preview renders the shared page");
    assert.ok(
      !/QuickBienes\w*(Page|Preview|Gallery|Card|Shell)|BienesQuick\w*(Page|Preview|Gallery|Card|Shell)/.test(live + preview + raw(APP)),
      "no Quick-specific BR presentation component",
    );
  });

  await check("presentation: the shared page carries no Quick branch and keeps its one width token", () => {
    const page = raw(PREVIEW_PAGE);
    // "QuickFacts" (bed/bath/sqft chips) is unrelated vocabulary; a Quick PLAN branch is what must not exist.
    assert.ok(!/isQuick|quickPlan|planChoice|plan=quick|useIsQuickBusinessPlan|businessPlan/.test(page), "the shared page has no Quick-plan code path");
    assert.ok(page.includes("max-w-[1140px]"), "shared width token still present");
    assert.ok(!/isQuick/.test(raw(LIVE)), "the public shell has no Quick-specific markup");
  });

  await check("share pill: shared Leonix drawer kept, label hidden below sm again (production parity)", () => {
    const live = raw(LIVE);
    assert.ok(live.includes("<LeonixShareButton"), "the Leonix share drawer button stays");
    const shell = /const SHARE_BTN_SHELL =\s*\n\s*"([^"]+)"/.exec(live)?.[1] ?? "";
    assert.ok(shell.includes("[&>button>span]:hidden"), "label span hidden by default (mobile: icon only)");
    assert.ok(shell.includes("sm:[&>button>span]:inline"), "label shown from sm up");
  });

  await check("result cards: title keeps the production block flow (flex-1 link, empty control adds nothing)", () => {
    for (const src of [raw(CARD), raw(FEATURED)]) {
      assert.ok(src.includes("min-w-0 flex-1"), "title link fills the row exactly as the former block link did");
      assert.ok(src.includes("cardTranslation.translateControl"), "additive translate control retained");
    }
  });

  // -------------------------------------------------------------------------------------------
  // 2. Plan carried across application <-> preview
  // -------------------------------------------------------------------------------------------
  await check("plan: carryBusinessPlanParam writes plan=quick for Quick, never plan=full (executed)", () => {
    const href = "/clasificados/publicar/bienes-raices/negocio/agente-individual/preview?lang=es&ai=abc#x";
    const q = carryBusinessPlanParam(href, "quick");
    assert.equal(businessPlanFromParam(new URL(q, "http://x").searchParams.get("plan")), "quick");
    assert.ok(q.includes("lang=es") && q.includes("ai=abc") && q.endsWith("#x"), "other params + hash preserved");
    assert.equal(carryBusinessPlanParam(href, "full"), href, "Full is never written into a link");
    assert.ok(!/plan=full/.test(carryBusinessPlanParam(q, "full")), "a Quick link is never rewritten to plan=full");
  });

  await check("plan: application -> preview and preview -> edit carry the plan with ONE Quick answer", () => {
    const app = raw(APP);
    const preview = raw(PREVIEW);
    for (const [name, src] of [["application", app], ["preview", preview]] as const) {
      assert.ok(src.includes('useIsQuickBusinessPlan("bienes-raices")'), `${name} uses the shared Quick hook`);
      assert.ok(src.includes("carryBusinessPlanParam("), `${name} carries the plan on its links`);
      assert.ok(src.includes('accessLevel === "simple"'), `${name} treats a server-SIMPLE existing listing as Quick`);
      assert.ok(!/plan=full/.test(src), `${name} never writes plan=full`);
    }
    assert.ok(app.includes("carryBusinessPlanParam(scopedPreviewPath, planChoice)"), "openPreview hands the plan to the preview");
    assert.ok(!preview.includes("businessPlanFromSearchParams(searchParams)"), "the preview no longer reads the URL alone");
    assert.ok(/returnPath: withBrAgenteResLangParam\(\s*carryBusinessPlanParam\([^)]*checkout=cancelled/.test(preview), "a cancelled Quick checkout returns to a Quick preview");
    assert.ok(/editHref = useMemo[\s\S]{0,900}carryBusinessPlanParam\(/.test(preview), "Volver a editar keeps the plan");
  });

  // -------------------------------------------------------------------------------------------
  // 3. Category-aware photo cap + video lock in the application
  // -------------------------------------------------------------------------------------------
  await check("cap: Bienes Negocio Quick = 3 read from the ONE table; Full keeps 40 photos", () => {
    assert.equal(quickImageMaxForBusinessCategory("bienes-negocio"), 3);
    assert.equal(quickBienesImageCap(), quickImageMaxForBusinessCategory("bienes-negocio"));
    const steps = raw(STEPS_A);
    assert.ok(steps.includes("quickBienesImageCap()"), "Step03Media reads the cap from the helper (table)");
    assert.ok(steps.includes("quick = false"), "Full is the default (child editors and Full unchanged)");
    assert.ok(/quick \? Math\.max\(quickPhotoCap, s\.fotosDataUrls\.length\) : 40/.test(steps), "Full slice stays 40");
    assert.ok(!/quickPhotoCap = 3|slice\(0, 3\)/.test(steps), "no literal 3 in the Quick media path");
    assert.ok(raw(APP).includes("quick={isQuickPlan}"), "the application passes the Quick flag to the media step");
  });

  await check("video: the video section is replaced by a Full-only note for Quick, Full keeps VideoUrlAddRows", () => {
    const steps = raw(STEPS_A);
    assert.ok(/quick \? \(\s*<QuickFullOnlyNote[\s\S]{0,200}\) : \(\s*<VideoUrlAddRows/.test(steps));
  });

  await check("gallery growth (executed): a Quick edit may not grow past the cap or past stored photos", () => {
    assert.equal(quickBienesGalleryGrowthAllowed({ incomingCount: 3, existingCount: 0 }), true);
    assert.equal(quickBienesGalleryGrowthAllowed({ incomingCount: 4, existingCount: 0 }), false);
    assert.equal(quickBienesGalleryGrowthAllowed({ incomingCount: 12, existingCount: 12 }), true, "stored Full photos are kept");
    assert.equal(quickBienesGalleryGrowthAllowed({ incomingCount: 13, existingCount: 12 }), false);
  });

  // -------------------------------------------------------------------------------------------
  // 4. Field gates (application)
  // -------------------------------------------------------------------------------------------
  await check("fields: extra websites, socials, Google/Yelp and extra links are HIDDEN for Quick; the primary website stays", () => {
    const steps = raw(STEPS_B);
    assert.ok(steps.includes("QuickFullOnlyNote"), "bilingual Full-only note is used");
    for (const marker of [
      "{quick ? null : (\n          <AiField label={s7.sitioMarca}",
      "{quick ? (\n          <div className=\"sm:col-span-2\">\n            <QuickFullOnlyNote",
      "value={state.agente2SitioWeb}",
      "{quick ? null : (\n            <AiField label={s7.brokerSitioWeb}",
    ]) {
      assert.ok(steps.includes(marker), `gated: ${marker.slice(0, 60).replace(/\n/g, " ")}`);
    }
    // the second-agent website + socials sit inside the quick ternary
    const a2 = steps.indexOf("value={state.agente2SitioWeb}");
    assert.ok(steps.lastIndexOf("{quick ? (", a2) > steps.lastIndexOf("agente2Correo", a2), "agente2 website is inside the Quick gate");
    // the PRIMARY agent website is NOT gated
    const primary = steps.indexOf("value={state.agenteSitioWeb}");
    assert.ok(primary > -1);
    const before = steps.slice(Math.max(0, primary - 260), primary);
    assert.ok(!/quick \?/.test(before), "agenteSitioWeb stays visible for Quick");
    const forms = raw(APP);
    assert.ok(forms.includes("<Step07InformacionProfesional state={state} setState={setState} quick={isQuickPlan} />"));
    assert.ok(forms.includes("Additional properties (inventory pack)") && forms.includes("dashboardInventoryPackUnlocked && !isQuickPlan"));
    assert.ok(raw(APP).includes('Available with Full') === false, "the note text lives in the shared primitive");
    assert.ok(raw(`${BR}/agente-individual/application/formPrimitives.tsx`).includes("Available with Full"));
    assert.ok(raw(`${BR}/agente-individual/application/formPrimitives.tsx`).includes("Disponible con Full"));
  });

  await check("pricing summary: Quick shows the matrix Quick price and no pack; Full unchanged", () => {
    const src = raw(PRICING);
    assert.ok(src.includes('getRevenuePackageDefinition("br_agent_quick_monthly")'));
    assert.ok(src.includes("quick = false"));
    assert.ok(src.includes("BR_AGENT_SHOWCASE_PRICE_CENTS"), "Full price constant still used");
  });

  await check("client blank (executed): Full-only form fields blanked, primary website + Full data of other fields kept", () => {
    const state: Record<string, unknown> = {
      agenteSitioWeb: "https://ana.example.com",
      marcaSitioWeb: "https://brand.example.com",
      agente2SitioWeb: "https://a2.example.com",
      brokerSitioWeb: "https://broker.example.com",
      socialInstagram: "https://instagram.com/ana",
      socialOtro: "https://x.example.com",
      agente2SocialFacebook: "https://facebook.com/a2",
      brokerTiktok: "https://tiktok.com/@b",
      googleBusinessUrl: "https://g.page/ana",
      googleReviewsUrl: "https://g.page/ana/review",
      yelpReviewsUrl: "https://yelp.com/biz/ana",
      businessExtraUrls: [{ title: "Blog", url: "https://blog.example.com" }],
      videoUrl: "https://youtu.be/aaa",
      videoUrls: ["https://youtu.be/aaa"],
      videoDataUrl: "data:video/mp4;base64,AAAA",
      additionalInventoryProperties: [{ id: "x" }],
      inventoryPackAccepted: true,
      confirmInventoryPackPricing: true,
      titulo: "Casa bonita",
      fotosDataUrls: ["a", "b", "c", "d"],
    };
    const out = blankQuickBienesFullOnlyFormFields(state) as Record<string, unknown>;
    assert.equal(out.agenteSitioWeb, "https://ana.example.com", "primary website kept");
    assert.equal(out.titulo, "Casa bonita");
    assert.deepEqual(out.fotosDataUrls, ["a", "b", "c", "d"], "stored photos are never deleted by the blank");
    for (const group of Object.values(QUICK_BIENES_FULL_ONLY_FORM_FIELDS)) {
      for (const key of group) if (key in state) assert.equal(out[key], "", `${key} blanked`);
    }
    assert.deepEqual(out.businessExtraUrls, []);
    assert.deepEqual(out.videoUrls, []);
    assert.deepEqual(out.additionalInventoryProperties, []);
    assert.equal(out.inventoryPackAccepted, false);
    assert.equal(state.socialInstagram, "https://instagram.com/ana", "input state not mutated");
    assert.ok(!QUICK_BIENES_FULL_ONLY_FORM_FIELDS.extraWebsites.includes("agenteSitioWeb" as never));
  });

  await check("roles (executed): the customer's property confirmation declares roles; never overwrites, never invents", () => {
    const base = { fotosDataUrls: ["u1", "u2"], fotoMediaRoles: { u1: "headshot" }, confirmPhotosRepresentItem: true };
    const declared = declareQuickBienesPropertyRoles(base);
    assert.deepEqual(declared.fotoMediaRoles, { u1: "headshot", u2: "property" });
    const notConfirmed = declareQuickBienesPropertyRoles({ ...base, confirmPhotosRepresentItem: false });
    assert.deepEqual(notConfirmed.fotoMediaRoles, { u1: "headshot" }, "no declaration without the confirmation");
  });

  // -------------------------------------------------------------------------------------------
  // 5. The pure strip helper (executed)
  // -------------------------------------------------------------------------------------------
  await check("keys: the helper covers exactly the Full-only keys the meta builder writes; the primary website is not one", () => {
    const builder = raw(META_BUILDER);
    for (const key of QUICK_BIENES_FULL_ONLY_META_KEYS) {
      if (["negocioInstagram", "negocioFacebook", "negocioYoutube", "negocioTiktok"].includes(key)) continue; // via the Gate 12C overlay
      assert.ok(builder.includes(key), `meta builder writes ${key}`);
    }
    assert.ok(!(QUICK_BIENES_FULL_ONLY_META_KEYS as readonly string[]).includes("negocioSitioWeb"));
    assert.ok(!(QUICK_BIENES_FULL_ONLY_CHANNEL_KEYS as readonly string[]).includes("website"));
    assert.equal(QUICK_BIENES_CONTACT_CHANNELS_PAIR_LABEL, LEONIX_DP_CONTACT_CHANNELS_V1);
    const overlay = raw("app/(site)/clasificados/lib/leonixContactChannelsV1.ts");
    for (const k of ["negocioInstagram", "negocioFacebook", "negocioYoutube", "negocioTiktok"]) assert.ok(overlay.includes(k), k);
  });

  await check("gate: the boundary applies ONLY to a proven Quick product (executed on real resolver decisions)", () => {
    assert.equal(quickFullOnlyBoundaryApplies(QUICK_ASSISTED), true);
    assert.equal(quickFullOnlyBoundaryApplies(QUICK_ENTITLED), true);
    assert.equal(quickFullOnlyBoundaryApplies(QUICK_CUSTODY), true);
    assert.equal(quickFullOnlyBoundaryApplies(UNVERIFIED), false, "unverified may be a Full customer");
    assert.equal(quickFullOnlyBoundaryApplies(FULL_ENTITLED), false);
    assert.equal(quickFullOnlyBoundaryApplies(FSBO), false, "a category with no Quick product is never touched");
    assert.equal(quickFullOnlyBoundaryApplies(null), false);
  });

  await check("strip (executed): a NEW Quick row loses every Full-only key on all four surfaces, keeps the primary website", () => {
    const { row, changedPaths } = stripQuickBienesFullOnlyFields({ row: fullRow(), existingRow: null });
    const meta = JSON.parse(String(row.business_meta)) as Record<string, string>;
    for (const key of QUICK_BIENES_FULL_ONLY_META_KEYS) assert.ok(!(key in meta), `business_meta.${key} removed`);
    assert.equal(meta.negocioSitioWeb, "https://ana.example.com", "primary website kept");
    assert.equal(meta.negocioAgente, "Ana Agente", "unrelated meta kept");
    const pm = (row.profile_json as { businessMeta: Record<string, unknown> }).businessMeta;
    for (const key of QUICK_BIENES_FULL_ONLY_META_KEYS) assert.ok(!(key in pm), `profile_json.businessMeta.${key} removed`);
    const ch = (row.contact_json as { channels: Record<string, unknown> }).channels;
    for (const key of QUICK_BIENES_FULL_ONLY_CHANNEL_KEYS) assert.ok(!ch[key], `contact_json.channels.${key} emptied`);
    assert.equal(ch.website, "https://ana.example.com");
    const pair = (row.detail_pairs as { label: string; value: string }[]).find((p) => p.label === LEONIX_DP_CONTACT_CHANNELS_V1)!;
    const payload = JSON.parse(pair.value) as Record<string, unknown>;
    for (const key of QUICK_BIENES_FULL_ONLY_CHANNEL_KEYS) assert.ok(!payload[key], `channels pair ${key} emptied`);
    assert.equal(payload.website, "https://ana.example.com");
    assert.equal(payload.allowCall, true, "contact preferences kept");
    assert.equal((row.detail_pairs as unknown[]).length, 2, "other detail pairs kept");
    assert.ok(changedPaths.length >= 10);
    assert.equal(countBienesRowExternalVideos(row), 0, "video links gone");
  });

  await check("strip (executed): an EXISTING Quick row RESTORES stored Full content instead of destroying it, and the browser never wins", () => {
    const stored = fullRow();
    // Incoming: a Quick client that cleared everything (keys simply omitted) AND tried to inject new Full-only values.
    const incoming = {
      business_meta: JSON.stringify({ negocioAgente: "Ana", negocioSitioWeb: "https://ana.example.com", negocioInstagram: "https://evil.example/ig", negocioExternalVideoUrls: JSON.stringify(["https://youtu.be/new"]) }),
      detail_pairs: [{ label: LEONIX_DP_CONTACT_CHANNELS_V1, value: JSON.stringify({ v: 1, website: "https://ana.example.com", tiktok: "https://tiktok.com/@evil" }) }],
    };
    const { row } = stripQuickBienesFullOnlyFields({ row: incoming, existingRow: stored });
    const meta = JSON.parse(String(row.business_meta)) as Record<string, string>;
    assert.equal(meta.negocioInstagram, FULL_META.negocioInstagram, "stored value restored over the injected one");
    assert.equal(meta.negocioGoogleReviewsUrl, FULL_META.negocioGoogleReviewsUrl, "omitted key restored");
    assert.equal(meta.negocioExternalVideoUrls, FULL_META.negocioExternalVideoUrls, "stored video list restored, injected one dropped");
    assert.equal(meta.negocioAgente, "Ana", "non-Full-only edit still applies");
    const pair = (row.detail_pairs as { label: string; value: string }[])[0]!;
    const payload = JSON.parse(pair.value) as Record<string, unknown>;
    assert.equal(payload.tiktok, "https://tiktok.com/@ana", "channels pair restored over the injected value");
    // Stored video is HISTORY, not an addition: it must not count as net-new (a Quick save is never blocked by it).
    assert.equal(quickBienesNetNewExternalVideoCount({ row, existingRow: stored }), 0);
    // A null incoming business_meta on an existing Full-history row must not wipe it.
    const cleared = stripQuickBienesFullOnlyFields({ row: { business_meta: null }, existingRow: stored }).row;
    assert.ok(cleared.business_meta && JSON.parse(String(cleared.business_meta)).negocioInstagram, "wholesale null does not delete stored history");
  });

  await check("strip (executed): idempotent, and a row that is already clean is returned unchanged", () => {
    const once = stripQuickBienesFullOnlyFields({ row: fullRow(), existingRow: null });
    const twice = stripQuickBienesFullOnlyFields({ row: once.row, existingRow: null });
    assert.deepEqual(twice.row, once.row);
    assert.equal(twice.changedPaths.length, 0);
  });

  await check("strip: business_meta as an OBJECT column is handled and stays an object", () => {
    const row = { business_meta: { ...FULL_META } };
    const out = stripQuickBienesFullOnlyFields({ row, existingRow: null }).row;
    assert.equal(typeof out.business_meta, "object");
    assert.ok(!("negocioRedes" in (out.business_meta as object)));
  });

  await check("boundary contract (executed): the shared boundary itself restores stored else empties", () => {
    const r = applyQuickFullOnlyBoundary({ incoming: { a: "x" }, existing: { a: "stored" }, paths: ["a"] });
    assert.equal(r.value.a, "stored");
    assert.equal(applyQuickFullOnlyBoundary({ incoming: { a: "x" }, existing: null, paths: ["a"] }).value.a, "");
  });

  // -------------------------------------------------------------------------------------------
  // 6. Customer quick-publish operation (executed with in-memory ports)
  // -------------------------------------------------------------------------------------------
  function makePorts(input: {
    product: "quick" | "full" | "unverified";
    source: string;
    reusable?: { id: string; listingJson: Record<string, unknown> | null; existing?: Record<string, unknown> | null } | null;
    inserted: Record<string, unknown>[];
    updated: Record<string, unknown>[];
    videoCounts: (number | undefined)[];
  }): QuickBienesPublishPorts {
    return {
      resolveOwnerUserId: async () => "owner-1",
      isDatabaseConfigured: () => true,
      resolveProduct: async () => ({ product: input.product, source: input.source }),
      validateMedia: (_items, externalVideoCount) => {
        input.videoCounts.push(externalVideoCount);
        return null;
      },
      findReusablePendingListing: async () => ({ ok: true, row: input.reusable ?? null }),
      insertListing: async (row) => {
        input.inserted.push(row);
        return { ok: true, listingId: "new-1" };
      },
      updateListing: async ({ patch }) => {
        input.updated.push(patch);
        return { ok: true };
      },
      groupMainListing: async () => {},
      linkListingToBusiness: async () => ({ ok: true, businessId: "b-1" }),
      nowIso: () => "2026-09-24T00:00:00.000Z",
    };
  }
  const opRequest = () => ({
    listingRow: Object.assign({ title: "Casa", city: "San Jose", price: 100 }, fullRow()),
    mediaRoles: ["property"],
    mediaUrls: ["https://cdn.example.com/a.jpg"],
    declaredPackageKey: "br_agent_quick_monthly",
    lang: "es" as const,
  });

  await check("operation (executed): a first Quick publish is written WITHOUT Full-only content", async () => {
    const rec = { inserted: [] as Record<string, unknown>[], updated: [] as Record<string, unknown>[], videoCounts: [] as (number | undefined)[] };
    const res = await executeQuickBienesPublish(opRequest(), makePorts({ product: "quick", source: "server_custody_route", ...rec }), {
      quickPackageKey: "br_agent_quick_monthly",
    });
    assert.equal(res.ok, true);
    assert.equal(rec.inserted.length, 1);
    const row = rec.inserted[0]!;
    const meta = JSON.parse(String(row.business_meta)) as Record<string, string>;
    assert.ok(!meta.negocioInstagram && !meta.negocioExternalVideoUrls && !meta.negocioGoogleReviewsUrl && !meta.negocioBusinessExtraUrls);
    assert.equal(meta.negocioSitioWeb, "https://ana.example.com");
    assert.equal(row.inventory_role, "main", "one property, main only");
  });

  await check("operation (executed): a retry onto the caller's own pending row RESTORES its stored Full content", async () => {
    const rec = { inserted: [] as Record<string, unknown>[], updated: [] as Record<string, unknown>[], videoCounts: [] as (number | undefined)[] };
    const stored = fullRow();
    const res = await executeQuickBienesPublish(
      opRequest(),
      makePorts({ product: "quick", source: "server_custody_route", reusable: { id: "pending-1", listingJson: null, existing: stored }, ...rec }),
      { quickPackageKey: "br_agent_quick_monthly" },
    );
    assert.equal(res.ok, true);
    assert.equal(rec.updated.length, 1);
    const meta = JSON.parse(String(rec.updated[0]!.business_meta)) as Record<string, string>;
    assert.equal(meta.negocioInstagram, FULL_META.negocioInstagram, "stored value restored");
    assert.equal(meta.negocioExternalVideoUrls, FULL_META.negocioExternalVideoUrls);
    assert.ok(rec.videoCounts.every((c) => !c), "stored video is history, not a net-new video");
  });

  await check("operation (executed): a non-Quick product is still refused (Full is never converted)", async () => {
    const rec = { inserted: [] as Record<string, unknown>[], updated: [] as Record<string, unknown>[], videoCounts: [] as (number | undefined)[] };
    const res = await executeQuickBienesPublish(opRequest(), makePorts({ product: "full", source: "live_entitlement", ...rec }), {
      quickPackageKey: "br_agent_quick_monthly",
    });
    assert.equal(res.ok, false);
    assert.equal(rec.inserted.length + rec.updated.length, 0);
  });

  // -------------------------------------------------------------------------------------------
  // 7. Seams (source): gate, restore source, externalVideoCount
  // -------------------------------------------------------------------------------------------
  await check("seam quick-publish: reads the stored columns and hands them to the boundary; passes externalVideoCount", () => {
    const route = raw(QUICK_ROUTE);
    const op = raw(OPERATION);
    assert.ok(route.includes("business_meta, detail_pairs, profile_json, contact_json"), "reuse lookup selects the stored Full-only-capable columns");
    assert.ok(route.includes("externalVideoCount"), "route forwards externalVideoCount to the canonical enforcer");
    assert.ok(op.includes("stripQuickBienesFullOnlyFields({ row: builtRow, existingRow: reusable?.existing ?? null })"));
    assert.ok(op.includes("quickFullOnlyBoundaryApplies({"), "gated on the PROVEN product");
    assert.ok(!/enforceQuickContract/.test(op), "not gated on the enforce flag");
  });

  await check("seam assisted-publish: product resolved once for BOTH actions, boundary gated on the proven product, main forced, stored restored", () => {
    const src = raw(ASSISTED);
    assert.ok(/const assistedProduct = await resolveQuickBusinessPublishIdentity\(/.test(src));
    assert.ok(src.indexOf("const assistedProduct = await") < src.indexOf("if (isAssistedPublish) {"), "resolved before the publish-only block");
    assert.ok(src.includes("const quickProven = quickFullOnlyBoundaryApplies(assistedProduct)"), "gate = proven Quick (never `unverified`)");
    assert.ok(src.includes("stripQuickBienesFullOnlyFields({ row: filteredRow, existingRow: storedForBoundary })"));
    assert.ok(src.includes('.select("business_meta, detail_pairs, profile_json, contact_json")'), "stored row read for restore");
    assert.ok(src.includes("filteredRow = forceQuickBienesMainInventoryRow(filteredRow)"), "staff insert forced to main for Quick");
    assert.ok(
      src.indexOf("filteredRow = forceQuickBienesMainInventoryRow(filteredRow)") < src.indexOf("const insertRow: Record<string, unknown> = {"),
      "forced BEFORE the insert row is built (born-pending contract intact)",
    );
    assert.ok(src.includes("externalVideoCount: netNewVideos"), "externalVideoCount passed to the canonical enforcer");
    assert.ok(src.includes("assistedProduct.enforceQuickContract"), "PRO media preservation (2619c4d34) intact");
    assert.ok(!/if \(quickProven\)[\s\S]{0,40}enforceQuickContract/.test(src));
  });

  await check("seam listing-edit: parent product resolved server-side; boundary + growth guard only for a proven Quick parent", () => {
    const src = raw(EDIT);
    assert.ok(src.includes("resolveQuickBusinessPublishIdentity({"));
    assert.ok(src.includes("const quickBoundary = quickFullOnlyBoundaryApplies(parentProduct)"));
    assert.ok(src.includes("quickBoundary,\n  });"), "only the PARENT update receives the flag");
    assert.ok(src.includes("stripQuickBienesFullOnlyFields({ row: builtPatch.patch, existingRow: existingCols })"));
    assert.ok(src.includes("quickBienesGalleryGrowthAllowed("));
    assert.ok(/business_meta, city, state, zip/.test(src), "stored business_meta is read for the restore");
  });

  // -------------------------------------------------------------------------------------------
  // 8. One property / no inventory expansion
  // -------------------------------------------------------------------------------------------
  await check("add-on (executed): refused ONLY for a proven Quick parent; Full and unverified unchanged", () => {
    for (const d of [QUICK_ASSISTED, QUICK_ENTITLED, QUICK_CUSTODY]) {
      const r = quickBienesInventoryAddonRefusal(d);
      assert.ok(r && r.status === 422 && r.code === "quick_inventory_addon_not_available", "proven Quick refused");
    }
    assert.equal(quickBienesInventoryAddonRefusal(FULL_ENTITLED), null);
    assert.equal(quickBienesInventoryAddonRefusal(UNVERIFIED), null, "an undetermined product is never blocked on a guess");
    assert.equal(quickBienesInventoryAddonRefusal(FSBO), null);
  });

  await check("add-on: validateBienesInventoryAddonOwnership resolves the parent's product from server records and refuses Quick", () => {
    const src = raw(CHECKOUT);
    const fn = src.slice(src.indexOf("export async function validateBienesInventoryAddonOwnership"));
    const body = fn.slice(0, fn.indexOf("export function getRevenueSiteOrigin"));
    assert.ok(body.includes('resolveQuickBusinessPublishIdentity({\n    category: "bienes-raices"'));
    assert.ok(body.includes("quickBienesInventoryAddonRefusal(parentProduct)"));
    assert.ok(body.includes("ownerUserId: input.bearerUserId.trim()"), "owner-scoped, from the bearer");
    // the bundled base-checkout allowlist already excludes the Quick base package
    assert.ok(/"bienes-raices": \{[\s\S]{0,140}basePackageKey: "br_agent_monthly"/.test(src), "add-ons are only allowed on the Full base package");
  });

  await check("staff insert (executed): a proven Quick row is main with no group/parent link; other columns untouched", () => {
    const forced = forceQuickBienesMainInventoryRow({
      title: "T",
      inventory_role: "inventory_property",
      br_inventory_group_id: "g",
      br_inventory_parent_listing_id: "p",
    });
    const forcedTitle = forced.title;
    assert.equal(forced.inventory_role, "main");
    assert.ok(!("br_inventory_group_id" in forced) && !("br_inventory_parent_listing_id" in forced));
    assert.equal(forcedTitle, "T");
  });

  await check("customer path: preview never carries child inventory into Quick checkout", () => {
    const preview = raw(PREVIEW);
    assert.ok(preview.includes("const childInventoryCount = quickPlan ? 0"));
    assert.ok(preview.includes("blankQuickBienesFullOnlyFormFields(stStored)"), "publish draft blanked for Quick (children dropped)");
    assert.ok(preview.includes("...(!quickPlan && bundleCreatedCount > 0"));
    assert.ok(raw("app/lib/clasificados/bienes-raices/quickBienesPublishContract.ts").includes('QUICK_BIENES_INVENTORY_ROLE = "main"'));
  });

  // -------------------------------------------------------------------------------------------
  // 9. Full unchanged
  // -------------------------------------------------------------------------------------------
  await check("Full unchanged: every Full field/section is still rendered when `quick` is false", () => {
    const steps = raw(STEPS_B);
    for (const f of [
      "state.marcaSitioWeb",
      "state.socialInstagram",
      "state.googleReviewsUrl",
      "state.yelpReviewsUrl",
      "state.agente2SitioWeb",
      "state.brokerSitioWeb",
      "<AdditionalBusinessLinks state={state} setState={setState} />",
    ]) {
      assert.ok(steps.includes(f), `Full field still present: ${f}`);
    }
    assert.ok(raw(STEPS_A).includes("<VideoUrlAddRows state={state} setState={setState} />"));
    assert.ok(raw(APP).includes("<BrNegocioPrePublishInventoryShell"), "inventory pack shell stays for Full");
    assert.ok(raw(APP).includes("bienesInventoryPackAddonUpgradeLabel"), "Full owner add-on upgrade path stays");
    // Full data through the strip is a no-op only because callers do not invoke it: the gate refuses Full/unverified
    assert.equal(quickFullOnlyBoundaryApplies(FULL_ENTITLED), false);
    assert.equal(quickFullOnlyBoundaryApplies(UNVERIFIED), false);
  });

  if (failures.length) {
    console.error(`\n${failures.length} check(s) FAILED`);
    for (const f of failures) console.error(` - ${f}`);
    process.exit(1);
  }
  console.log("\nAll Bienes Negocio Quick shared-presentation checks passed.");
}

void main();
