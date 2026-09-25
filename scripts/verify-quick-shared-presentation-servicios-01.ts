/**
 * SERVICIOS — Quick / Full SHARED PRESENTATION (owner lock 2026-09-24).
 *
 * Quick renders through the SAME real presentation components as Full/public; the difference is entitlement
 * data only:
 *  - the publish Preview renders the shared public shells (ServiciosProfessionalProfileShell /
 *    ServiciosProfileView) chosen by the SAME rule as the public page, with no hand-copied shell, no second
 *    frame and no hardcoded width (the shell owns LX_PRO_MAIN_MAX);
 *  - `plan=quick` survives application -> preview -> "Volver a editar" -> language toggle and is never
 *    rewritten to `plan=full` (staff custody plan wins over the URL);
 *  - the Quick photo cap (Servicios = 5) is read from the ONE per-category table;
 *  - Full-only fields (socials, Google Business/Reviews, Yelp, extra links, WhatsApp Business link, video,
 *    coupons) are hidden in the application for Quick and stripped server-side ONLY for a PROVEN Quick product
 *    (never `unverified`, which may be a Full customer), RESTORING stored values instead of deleting them;
 *  - a Quick session declares its SIMPLE key on publish (restricting direction only); a Full session sends
 *    nothing new;
 *  - the Quick cover (= first gallery photo) is not double counted against the cap.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-shared-presentation-servicios-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { quickImageMaxForBusinessCategory } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { carryBusinessPlanParam } from "../app/lib/listingPlans/businessQuickPlanSignal";
import { quickFullOnlyBoundaryApplies } from "../app/lib/quickBusiness/quickFullOnlyBoundary";
import {
  quickBasePackageKeyForCategory,
  fullBasePackageKeyForCategory,
  resolveQuickBusinessProduct,
} from "../app/lib/listingPlans/quickBusinessProductIdentity";
import {
  SERVICIOS_QUICK_FULL_ONLY_WIRE_PATHS,
  applyServiciosQuickFullOnlyBoundary,
} from "../app/(site)/clasificados/publicar/servicios/lib/serviciosQuickFullOnlyPaths";
import { buildServiciosPublishTransportBody } from "../app/(site)/clasificados/publicar/servicios/lib/buildServiciosPublishPayload";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}\n  ${e instanceof Error ? e.message : String(e)}`);
  }
}
const raw = (rel: string) => readFileSync(rel, "utf8").replace(/\r\n/g, "\n");

const APP = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const PREVIEW = "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx";
const PREVIEW_SHELL = "app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx";
const PUBLIC_PAGE = "app/(site)/clasificados/servicios/[slug]/page.tsx";
const PRO_SHELL = "app/(site)/servicios/components/ServiciosProfessionalProfileShell.tsx";
const ROUTE = "app/api/clasificados/servicios/publish/route.ts";
const ADAPTER = "app/(site)/publicar/negocio-rapido/_adapters/serviciosQuickBusinessAdapter.ts";

/* ------------------------------------------------------------------------------------------------ (a) */
check("(a) preview shell is a thin adapter over the shared public shell: no own frame, width, or presentation", () => {
  const shell = raw(PREVIEW_SHELL);
  assert.ok(
    /from "@\/app\/servicios\/components\/ServiciosProfessionalProfileShell"/.test(shell) &&
      shell.includes("<ServiciosProfessionalProfileShell"),
    "adapter renders the shared ServiciosProfessionalProfileShell",
  );
  const code = shell.replace(/\/\*[\s\S]*?\*\//g, "");
  assert.ok(!/max-w-\[/.test(code), "no hardcoded max-width in the adapter");
  assert.ok(!code.includes("<main"), "no own <main> frame");
  assert.ok(!/<div\b/.test(code), "no wrapper markup at all");
  assert.ok(!code.includes("useServiciosPublicTranslation"), "no second translate implementation");
  assert.ok(!code.includes("LeonixShareButton") && !code.includes("ServiciosLikeEngagementCluster"), "no second share/like implementation");
  assert.ok(!/SV\.(bg|card)/.test(code), "no own surface colour");
  assert.ok(code.includes("persistListingEngagement={false}"), "preview never persists engagement");
  assert.ok(!/listingSourceId|analyticsListingSlug/.test(code), "no listing/source ids handed to the shell");
  assert.ok(!/quick/i.test(code), "no Quick-specific presentation in the shell adapter");
});

check("(a) the shared shell owns the ONE width (LX_PRO_MAIN_MAX) and the public page renders it", () => {
  const pro = raw(PRO_SHELL);
  assert.ok(pro.includes("LX_PRO_MAIN_MAX"), "public shell width token");
  const pub = raw(PUBLIC_PAGE);
  assert.ok(pub.includes("<ServiciosProfessionalProfileShell") && pub.includes("<ServiciosProfileView"), "public page renders both shared shells");
  assert.ok(pub.includes("isServiciosProfessionalTemplate(listingTemplate) ?"), "public shell-choice rule");
});

check("(a) preview picks the shell with the SAME rule as public, with no second frame", () => {
  const prev = raw(PREVIEW);
  assert.ok(!prev.includes("ClasificadosPreviewAdCanvas"), "double ClasificadosPreviewAdCanvas frame is gone");
  assert.ok(prev.includes("<ServiciosProfessionalPreviewShell") && prev.includes("<ServiciosProfileView"), "shared shells are used");
  assert.ok(prev.includes("{useProfessionalPreview ? ("), "shell choice is by the professional-template rule");
  assert.ok(!/useProfessionalPreview \|\|\s*\(profile\.coupons/.test(prev), "coupons no longer force the professional shell");
  assert.ok(prev.includes("isServiciosProfessionalTemplate(listingTemplate)"), "same predicate as public");
  const body = prev.slice(prev.indexOf('data-servicios-preview-body="1"'));
  assert.ok(!/<ServiciosProfessionalPreviewShell[^>]*max-w/.test(body), "no width wrapper around the shell");
  assert.ok(prev.includes('data-servicios-preview-banner="1"'), "the Vista previa banner lives OUTSIDE the shell");
});

/* ------------------------------------------------------------------------------------------------ (b) */
check("(b) plan carry: no plan=full is ever minted; preview and edit hrefs carry plan=quick", () => {
  const app = raw(APP);
  const prev = raw(PREVIEW);
  assert.ok(!/plan:\s*businessPlan/.test(app), "application no longer writes { plan: businessPlan }");
  assert.ok(
    app.includes("carryBusinessPlanParam(") && app.includes('useIsQuickBusinessPlan("servicios")'),
    "application derives Quick via the shared hook and carries it",
  );
  assert.ok(!/searchParams\?\.get\("plan"\) === "quick"/.test(app), "no bare URL-only Quick read in the application");
  assert.ok(prev.includes("newApplicationEditHref = carryBusinessPlanParam("), "preview 'Volver a editar' carries the plan");
  assert.ok(
    app.includes("langToggleHref") && /new URLSearchParams\(searchParams\?\.toString\(\)/.test(app),
    "language toggle preserves the query",
  );
  assert.ok(!/href=\{lang === "es" \? "\?lang=en" : "\?lang=es"\}/.test(app), "no whole-query-replacing language toggle");
  const edit = carryBusinessPlanParam("/publicar/servicios?lang=es", "quick");
  assert.ok(/[?&]plan=quick\b/.test(edit) && edit.includes("lang=es"), `edit href keeps plan=quick and lang: ${edit}`);
  for (const href of ["/publicar/servicios?lang=es", "/clasificados/publicar/servicios/preview"]) {
    assert.ok(!/plan=full/.test(carryBusinessPlanParam(href, "full")), "Full is never written into a link");
    assert.equal(carryBusinessPlanParam(href, "full"), href, "Full link is untouched");
  }
});

/* ------------------------------------------------------------------------------------------------ (c) */
check("(c) Quick photo cap is read from the ONE table (Servicios = 5); stale 3-photo / $99 copy is gone", () => {
  assert.equal(quickImageMaxForBusinessCategory("servicios"), 5);
  const app = raw(APP);
  assert.ok(app.includes('quickImageMaxForBusinessCategory("servicios")'), "application reads the table");
  assert.ok(!/isQuickBusinessPlan \? 3 :/.test(app), "no hardcoded 3");
  assert.ok(!/up to 3 images|hasta 3 imágenes|admite hasta 3/.test(app), "no stale 3-image copy");
  assert.ok(!/\$99/.test(app), "no $99 copy");
  assert.ok(app.includes("${quickGalleryMax}"), "copy interpolates the table value");
  assert.ok(/GALLERY_MAX = 24/.test(app), "Full cap untouched (24)");
});

/* ------------------------------------------------------------------------------------------------ (d) */
check("(d) Quick hides Full-only fields in the application (social, Google/Yelp, extra links, WhatsApp Business link)", () => {
  const app = raw(APP);
  const lock = app.indexOf('data-quick-full-only-locked="1"');
  const social = app.indexOf("copy.labels.contactSocialHeading");
  const reviews = app.indexOf("copy.labels.contactReviewsHeading");
  const extra = app.indexOf("copy.labels.contactExtraLinksHeading");
  const langs = app.indexOf("copy.labels.languages}</p>");
  assert.ok(
    lock > 0 && lock < social && social < reviews && reviews < extra && extra < langs,
    "the three Full-only sections sit inside the Quick-locked branch",
  );
  const gate = app.lastIndexOf("{isQuickBusinessPlan ? (", social);
  assert.ok(gate > 0 && gate < lock, "the locked note is the Quick branch of that conditional");
  assert.ok(
    /isQuickBusinessPlan \? null : \(\s*<div>\s*<label className=\{labelClass\}>\{copy\.labels\.whatsappBusinessUrl\}/.test(app),
    "WhatsApp Business link hidden for Quick",
  );
  assert.ok(app.includes("Disponible con Full") && app.includes("Available with Full"), "bilingual upgrade note");
  assert.ok(app.includes('data-quick-video-locked="1"') && app.includes('data-quick-coupons-locked="1"'), "video and coupons stay locked");
  // Primary website + primary WhatsApp number stay for Quick.
  assert.ok(app.includes("copy.labels.website}</label>") && app.includes("copy.labels.whatsapp}</label>"), "primary website + WhatsApp number remain");
});

check("(d) publish route applies the boundary only for a PROVEN Quick product, never via enforceQuickContract", () => {
  const route = raw(ROUTE);
  assert.ok(route.includes("if (quickFullOnlyBoundaryApplies(serviciosProduct)) {"), "gated by the proven-Quick predicate");
  assert.ok(/applyServiciosQuickFullOnlyBoundary\(\{ incoming: wire, existing: previousWire \}\)/.test(route), "existing = the stored profile_json");
  const gateIdx = route.indexOf("if (quickFullOnlyBoundaryApplies(serviciosProduct))");
  assert.ok(!/enforceQuickContract/.test(route.slice(gateIdx, gateIdx + 300)), "not gated by enforceQuickContract");
  const offers = route.indexOf("enforceServiciosOffersEntitlementServerTruth(");
  const persist = route.indexOf("splitServiciosAddressForPersistence(wire)");
  assert.ok(offers > 0 && gateIdx > offers && gateIdx < persist, "runs after offers enforcement and before every persistence branch (customer + assisted)");
});

check("(d) executed: proven Quick strips, unverified and Full stay untouched, stored Full data is restored", () => {
  const quickKey = quickBasePackageKeyForCategory("servicios")!;
  const fullKey = fullBasePackageKeyForCategory("servicios")!;
  assert.ok(quickKey && fullKey);
  const declared = resolveQuickBusinessProduct({ category: "servicios", declaredPackageKey: quickKey });
  const assistedQuick = resolveQuickBusinessProduct({ category: "servicios", assistedPackageKey: quickKey });
  const assistedFull = resolveQuickBusinessProduct({ category: "servicios", assistedPackageKey: fullKey });
  const undetermined = resolveQuickBusinessProduct({ category: "servicios" });
  assert.equal(quickFullOnlyBoundaryApplies(declared), true, "declared SIMPLE key = proven Quick");
  assert.equal(quickFullOnlyBoundaryApplies(assistedQuick), true, "staff Quick custody = proven Quick");
  assert.equal(quickFullOnlyBoundaryApplies(assistedFull), false, "proven Full");
  assert.equal(undetermined.product, "unverified");
  assert.equal(quickFullOnlyBoundaryApplies(undetermined), false, "unverified may be a Full customer: never stripped");

  const wire = () => ({
    identity: { businessName: "Acme" },
    contact: {
      websiteHref: "https://acme.example",
      socialLinks: {
        whatsappUrl: "https://wa.me/17135550100",
        whatsappProfileUrl: "https://whatsapp.com/channel/x",
        instagramUrl: "https://instagram.com/acme",
        facebookUrl: "https://facebook.com/acme",
        googleBusinessUrl: "https://business.google.com/acme",
      },
      externalReviewLinks: { googleReviewsUrl: "https://g.page/r/acme/review", yelpReviewsUrl: "https://yelp.com/biz/acme" },
      extraLinks: [{ url: "https://extra.example", label: "Book" }],
    },
  });

  // New Quick listing (nothing stored): Full-only content is emptied, primary website + WhatsApp number stay.
  const fresh = applyServiciosQuickFullOnlyBoundary({ incoming: wire(), existing: null });
  const fc = fresh.value.contact as Record<string, unknown>;
  assert.equal(fc.websiteHref, "https://acme.example");
  assert.deepEqual(fc.socialLinks, { whatsappUrl: "https://wa.me/17135550100" });
  assert.equal(fc.externalReviewLinks, undefined);
  assert.equal(fc.extraLinks, undefined);
  assert.ok(fresh.changedPaths.length >= 5);

  // Stored Full listing that temporarily resolves Quick: stored values are RESTORED, never deleted, and an
  // incoming wire that lacks them (a Quick form has no inputs for them) does not erase them either.
  const stored = wire();
  const restored = applyServiciosQuickFullOnlyBoundary({
    incoming: {
      identity: { businessName: "Acme" },
      contact: { websiteHref: "https://acme.example", socialLinks: { whatsappUrl: "https://wa.me/17135550100" } },
    },
    existing: stored,
  });
  const rc = restored.value.contact as Record<string, any>;
  assert.equal(rc.socialLinks.instagramUrl, "https://instagram.com/acme");
  assert.equal(rc.socialLinks.googleBusinessUrl, "https://business.google.com/acme");
  assert.equal(rc.socialLinks.whatsappProfileUrl, "https://whatsapp.com/channel/x");
  assert.deepEqual(rc.externalReviewLinks, stored.contact.externalReviewLinks);
  assert.deepEqual(rc.extraLinks, stored.contact.extraLinks);
  // A Quick browser cannot ADD or CHANGE a Full-only value on a row that stores a different one.
  const forged = wire();
  forged.contact.socialLinks.instagramUrl = "https://instagram.com/forged";
  const held = applyServiciosQuickFullOnlyBoundary({ incoming: forged, existing: stored });
  assert.equal((held.value.contact as Record<string, any>).socialLinks.instagramUrl, "https://instagram.com/acme");
  // Every declared path is a real, per-key Full-only path; the primary website and the primary WhatsApp number are not.
  for (const p of SERVICIOS_QUICK_FULL_ONLY_WIRE_PATHS) assert.ok(!/websiteHref|socialLinks\.whatsappUrl$/.test(p), p);
  assert.ok(!(SERVICIOS_QUICK_FULL_ONLY_WIRE_PATHS as readonly string[]).includes("contact.socialLinks"), "never the whole socialLinks object");
});

check("(d) Quick sessions declare the SIMPLE key on publish; a Full session sends nothing new", () => {
  const quickKey = quickBasePackageKeyForCategory("servicios")!;
  const state = createDefaultClasificadosServiciosState();
  const quickBody = buildServiciosPublishTransportBody(state, "es", undefined, undefined, "pending_payment", undefined, undefined, quickKey);
  assert.equal(quickBody.basePackageKey, quickKey);
  const fullBody = buildServiciosPublishTransportBody(state, "es", undefined, undefined, "pending_payment");
  assert.ok(!("basePackageKey" in fullBody), "a Full customer sends nothing new");
  const prev = raw(PREVIEW);
  assert.ok(
    prev.includes("const declaredQuickPackageKey = previewQuickSession ? SERVICIOS_QUICK_CHECKOUT.packageKey : undefined;"),
    "declared only for Quick",
  );
  assert.equal((prev.match(/basePackageKey: declaredQuickPackageKey/g) ?? []).length, 3, "customer publish + both pending-payment saves declare it");
  const client = raw("app/(site)/clasificados/publicar/servicios/lib/serviciosPublishClient.ts");
  assert.ok(client.includes("args.basePackageKey"), "publish client forwards the declaration");
});

/* ------------------------------------------------------------------------------------------------ (e) */
check("(e) the Quick cover (first gallery photo) is not double counted against the cap", () => {
  const route = raw(ROUTE);
  assert.ok(route.includes("serviciosCoverIsDistinct"), "distinct-cover rule");
  assert.ok(/\.\.\.\(serviciosCoverIsDistinct \? \[\{ role: null, mime: null \}\] : \[\]\)/.test(route), "only a distinct cover counts");
  assert.ok(!/\.\.\.\(state\.coverUrl \? \[\{ role: null, mime: null \}\] : \[\]\)/.test(route), "the unconditional cover count is gone");
  // Full path unaffected: its gallery cap is validated on `state.gallery` alone.
  assert.ok(route.includes("maxImages: SERVICIOS_GALLERY_MAX"), "Full gallery cap validation untouched");
  const adapter = raw(ADAPTER);
  assert.ok(adapter.includes("coverUrl: gallery[0]?.url"), "the Quick intake still leads with its first photo as the cover (hero unchanged)");
  // Executed model of the count: gallery of exactly the cap + same-url cover = cap items.
  const cap = quickImageMaxForBusinessCategory("servicios")!;
  const gallery = Array.from({ length: cap }, (_, i) => ({ url: `https://cdn.example/${i}.jpg` }));
  const cover = gallery[0]!.url;
  const set = new Set(gallery.map((g) => g.url));
  const items = [...(cover && !set.has(cover) ? [1] : []), ...gallery];
  assert.equal(items.length, cap);
});

if (failures.length) {
  console.error(`\nverify-quick-shared-presentation-servicios-01: ${failures.length} failure(s)`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log("\nverify-quick-shared-presentation-servicios-01: PASS");
