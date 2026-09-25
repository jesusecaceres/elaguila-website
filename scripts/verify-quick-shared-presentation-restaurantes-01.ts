/**
 * RESTAURANTES — Quick / Full SHARED PRESENTATION (owner lock 2026-09-24).
 *
 * Quick renders through the SAME canonical components as Full/public (RestaurantePreviewCard +
 * RestauranteAdStoryPreview); the difference is entitlement data only:
 *  - the preview mirrors the public wrapper (no extra p-8 frame that made it ~64px narrower);
 *  - `plan=quick` survives application -> preview -> "Editar" and is never rewritten to plan=full;
 *  - the Quick adapter places photos 2..N in the Comida bucket the public gallery actually renders
 *    (photos left in `galleryImages` never appear publicly);
 *  - the Quick cap (Restaurantes = 5, from the ONE table) counts hero + all buckets on the server, but
 *    only for a PROVEN Quick product (never `unverified`, which may be a Full customer);
 *  - Full-only fields (extra websites, socials, Google/Yelp, reservation/order/menu/catering links, video,
 *    coupons) are hidden in the application and stripped server-side, RESTORING stored values;
 *  - no coupons / linked offers on a Quick listing.
 *
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-quick-shared-presentation-restaurantes-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { quickImageMaxForBusinessCategory } from "../app/lib/quickBusiness/quickBusinessMediaSemantics";
import { carryBusinessPlanParam } from "../app/lib/listingPlans/businessQuickPlanSignal";
import {
  RESTAURANTE_QUICK_FULL_ONLY_PATHS,
  applyRestauranteQuickBoundary,
  countRestauranteQuickPhotos,
  quickFullOnlyBoundaryApplies,
} from "../app/lib/clasificados/restaurantes/restauranteQuickFullOnlyBoundary";
import type { RestauranteListingDraft } from "../app/(site)/clasificados/restaurantes/application/restauranteDraftTypes";

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

const PREVIEW = "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx";
const PUBLIC = "app/(site)/clasificados/restaurantes/[slug]/page.tsx";
const APP = "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx";
const ADAPTER = "app/(site)/publicar/negocio-rapido/_adapters/restaurantesQuickBusinessAdapter.ts";
const ROUTE = "app/api/clasificados/restaurantes/publish/route.ts";
const BUCKETS = "app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaBuckets.tsx";

check("presentation: preview and public render the SAME two shell components (no Quick-specific public component)", () => {
  const preview = raw(PREVIEW);
  const pub = raw(PUBLIC);
  for (const c of ["RestauranteAdStoryPreview", "ClasificadosPreviewAdCanvas"]) {
    assert.ok(preview.includes(c) && pub.includes(c), `${c} is used by both`);
  }
  assert.ok(preview.includes("RestaurantePreviewCard"), "preview still shows the results card");
  assert.ok(!/QuickRestaurante|RestauranteQuick\w*Preview/.test(preview + pub), "no Quick-only presentation component");
});

check("presentation: the preview story is NOT wrapped in the fixed p-8 frame; it mirrors the public canvas", () => {
  const preview = raw(PREVIEW);
  const pub = raw(PUBLIC);
  // Public renders the story bare inside `ClasificadosPreviewAdCanvas className="overflow-hidden"`.
  assert.ok(/<ClasificadosPreviewAdCanvas className="overflow-hidden">/.test(pub));
  assert.ok(/<ClasificadosPreviewAdCanvas className="overflow-hidden">\s*<RestauranteAdStoryPreview/.test(preview), "preview: same canvas, story bare");
  const storyIdx = preview.indexOf("<RestauranteAdStoryPreview");
  const before = preview.slice(Math.max(0, storyIdx - 400), storyIdx);
  assert.ok(!/rounded-3xl border p-8/.test(before), "no p-8 frame right around the story");
  assert.ok(!preview.includes('className="rounded-3xl border p-8'), "the fixed 32px frame is gone");
  // Same outer container padding as public (max-w-[1280px] px-4 md:px-5 lg:px-6).
  assert.ok(preview.includes("max-w-[1280px]") && preview.includes("px-4") && preview.includes("md:px-5 lg:px-6"));
  assert.ok(pub.includes("max-w-[1280px]") && pub.includes("px-4 pt-4 md:px-5 lg:px-6"));
});

check("plan: application preview link and preview edit link both carry plan=quick via the shared helper", () => {
  const app = raw(APP);
  const preview = raw(PREVIEW);
  assert.ok(app.includes("useIsQuickBusinessPlan(\"restaurantes\")"), "application resolves the session via the shared hook");
  assert.ok(/carryBusinessPlanParam\(\s*withClasificadosPublishLang\(PREVIEW_HREF/.test(app), "application -> preview carries the plan");
  assert.ok(/carryBusinessPlanParam\(\s*withClasificadosPublishLang\(EDIT_HREF_BASE/.test(preview), "preview -> edit carries the plan");
  const code = (app + preview).replace(/\/\/.*$/gm, "");
  assert.ok(!/plan=full|plan: "full"|"plan", "full"/.test(code), "never writes plan=full");
  // Executed: what the helper writes.
  const quickPreview = carryBusinessPlanParam("/clasificados/restaurantes/preview?lang=es", "quick");
  assert.ok(/[?&]plan=quick/.test(quickPreview) && quickPreview.includes("lang=es"));
  const quickEdit = carryBusinessPlanParam("/publicar/restaurantes?lang=en", "quick");
  assert.ok(/[?&]plan=quick/.test(quickEdit) && quickEdit.includes("lang=en"));
  assert.equal(carryBusinessPlanParam("/publicar/restaurantes?lang=es", "full"), "/publicar/restaurantes?lang=es", "Full links stay byte for byte");
});

check("plan: the preview quotes Quick from the server answer / session, and declares the Simple key ONLY for Quick", () => {
  const preview = raw(PREVIEW);
  assert.ok(preview.includes("useIsQuickBusinessPlan(\"restaurantes\")"));
  assert.ok(/isQuickPreview = baseCheckout\.packageKey === RESTAURANTES_QUICK_CHECKOUT\.packageKey/.test(preview));
  assert.ok(/basePackageKey: isQuickPreview \? RESTAURANTES_QUICK_CHECKOUT\.packageKey : null/.test(preview), "Full customers send nothing new");
  const payload = raw("app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts");
  assert.ok(/opts\?\.basePackageKey\?\.trim\(\) \? \{ basePackageKey/.test(payload), "declared key only when provided");
});

check("adapter: photo 1 is the hero; photos 2..N go to foodImages (the bucket the public gallery renders), capped from the table", () => {
  const adapter = raw(ADAPTER);
  assert.ok(/foodImages: rest,/.test(adapter), "rest -> foodImages");
  assert.ok(!/galleryImages: rest/.test(adapter), "no longer parked in the never-rendered galleryImages");
  assert.ok(adapter.includes('quickImageMaxForBusinessCategory("restaurantes")'), "cap read from the ONE table");
  assert.ok(/\.slice\(0, photoCap\)/.test(adapter));
  assert.equal(quickImageMaxForBusinessCategory("restaurantes"), 5);
  // The public gallery renders only the food bucket (no placeholders): guard the claim the fix rests on.
  const gallery = raw("app/(site)/clasificados/restaurantes/shell/RestauranteLockedGallerySection.tsx");
  assert.ok(/cat\.key === "food"/.test(gallery) && /foodImages\.slice\(0, 7\)/.test(gallery));
});

check("cap: server counts hero + gallery + all three buckets, only for a PROVEN Quick product", () => {
  const route = raw(ROUTE);
  assert.ok(route.includes("quickFullOnlyBoundaryApplies(restauranteProduct)"), "proven-Quick gate");
  assert.ok(/restauranteBucketUrls\.map\(\(\) => \(\{ role: null, mime: null \}\)\)/.test(route), "bucket photos enter the Quick media count");
  assert.ok(route.includes("...(draft.foodImages ?? []), ...(draft.interiorImages ?? []), ...(draft.exteriorImages ?? [])"), "all three buckets");
  assert.ok(route.includes("restauranteProduct.enforceQuickContract"), "existing enforcement gate kept for hero+gallery");
  // Executed: what the count is.
  const draft = { heroImage: "h", galleryImages: [], foodImages: ["a", "b", "c", "d"], interiorImages: [], exteriorImages: [] };
  assert.equal(countRestauranteQuickPhotos(draft), 5, "hero + 4 food = the cap");
  assert.equal(countRestauranteQuickPhotos({ ...draft, exteriorImages: ["x"] }), 6, "an exterior photo counts too (over the cap of 5)");
  assert.equal(countRestauranteQuickPhotos({ heroImage: "  ", foodImages: [""] }), 0, "blank refs do not count");
  assert.ok(countRestauranteQuickPhotos({ ...draft, exteriorImages: ["x"] }) > (quickImageMaxForBusinessCategory("restaurantes") ?? 0));
});

check("cap: the application applies the same total cap (hero + buckets) for Quick and keeps Full 12/12/12", () => {
  const buckets = raw(BUCKETS);
  const app = raw(APP);
  assert.ok(app.includes('quickImageMaxForBusinessCategory("restaurantes")'));
  assert.ok(/quickPhotoCap=\{isQuickBusinessPlan \? quickPhotoCap : null\}/.test(app));
  assert.ok(buckets.includes("const MAX_IMAGES_PER_BUCKET = 12;"), "Full bucket cap unchanged");
  assert.ok(/\(quickPhotoCap \?\? 0\) - 1 - \(prev\.interiorImages/.test(buckets), "hero slot + stored interior/exterior reserved");
  assert.ok(/isQuickCap \? null : \(/.test(buckets), "Interior/Exterior hidden (not deleted) for Quick");
});

check("gates: Full-only fields are hidden for Quick in the application (not merely disabled)", () => {
  const app = raw(APP);
  for (const frag of [
    'isQuickBusinessPlan ? null : (\n                <div className="sm:col-span-2">\n                  <FieldLabel optional lang={lang}>\n                    {lang === "en" ? "Additional websites"',
    "{fc.sectionD.socialHeader}",
    "{fc.sectionD.reviewsHeader}",
    "{fc.sectionD.reservationLabel}",
  ]) assert.ok(app.includes(frag), frag.slice(0, 50));
  // Social + reviews live inside the non-Quick branch of ONE conditional; the primary website stays outside it.
  const socialIdx = app.indexOf("{fc.sectionD.socialHeader}");
  const noteIdx = app.indexOf("<QuickFullOnlyNote", app.indexOf("restaurantes-section-d"));
  assert.ok(noteIdx > 0 && noteIdx < socialIdx, "Quick sees the locked note instead of socials/Google/Yelp");
  assert.ok(app.includes("{fc.sectionD.websiteLabel}"), "the ONE primary website stays for Quick");
  assert.ok(/isQuickBusinessPlan \? \(\s*<div data-quick-video-locked="1">/.test(app), "video locked");
  assert.ok(/isQuickBusinessPlan \? \(\s*<>\s*<SectionTitle>\{restauranteSectionHeading\("G"/.test(app), "coupons section locked");
  assert.ok(/isQuickBusinessPlan \? null : \(\s*<div>\s*<FieldLabel optional lang=\{lang\}>\{fc\.sectionF\.dishMenuLinkLabel/.test(app), "per-dish menu link hidden");
  assert.ok(app.includes("Disponible con Full") && app.includes("Available with Full"), "bilingual note");
  assert.ok(app.includes("data-quick-full-only-locked"));
});

check("gates: server boundary applies ONLY for a proven Quick product (executed)", () => {
  assert.equal(quickFullOnlyBoundaryApplies({ product: "quick", source: "declared_simple_package" }), true);
  assert.equal(quickFullOnlyBoundaryApplies({ product: "quick", source: "live_entitlement" }), true);
  assert.equal(quickFullOnlyBoundaryApplies({ product: "unverified", source: "none" }), false, "a first save may be Full");
  assert.equal(quickFullOnlyBoundaryApplies({ product: "full", source: "live_entitlement" }), false);
  const route = raw(ROUTE);
  assert.ok(/if \(restauranteQuickProven\) \{\s*const quickBoundary = applyRestauranteQuickBoundary\(sanitizedDraft, existingListingJson\)/.test(route));
  assert.ok(!/if \(restauranteProduct\.enforceQuickContract\) \{\s*const quickBoundary/.test(route), "not gated on enforceQuickContract");
});

check("gates: the boundary strips Quick-incoming Full-only fields and RESTORES stored ones (executed)", () => {
  const incoming = {
    businessName: "La Estrella",
    websiteUrl: "https://laestrella.example",
    additionalWebsites: [{ label: "Menu", url: "https://m.example" }],
    instagramUrl: "https://instagram.com/x",
    facebookUrl: "https://facebook.com/x",
    tiktokUrl: "https://tiktok.com/@x",
    youtubeUrl: "https://youtube.com/x",
    snapchatUrl: "s",
    xTwitterUrl: "x",
    googleReviewUrl: "https://g.page/x",
    yelpReviewUrl: "https://yelp.com/x",
    externalRatingValue: 4.8,
    externalReviewCount: 90,
    reservationUrl: "https://r.example",
    orderUrl: "https://o.example",
    menuUrl: "https://menu.example",
    videoUrls: ["https://youtube.com/watch?v=abc"],
    videoUrl: "https://youtube.com/watch?v=abc",
    galleryMediaSequence: [0, "v"],
    cateringEventsStack: { cateringInquiryUrl: "https://c.example", cateringNote: "keep" },
    featuredDishes: [{ title: "Tacos", image: "i", shortNote: "n", menuLink: "https://d.example" }],
  } as unknown as RestauranteListingDraft;

  // New Quick listing (nothing stored): everything Full-only is emptied, the primary website survives.
  const fresh = applyRestauranteQuickBoundary(incoming, null).draft as unknown as Record<string, unknown>;
  assert.equal(fresh.websiteUrl, "https://laestrella.example", "ONE primary website kept");
  assert.equal(fresh.businessName, "La Estrella");
  for (const k of ["instagramUrl", "facebookUrl", "tiktokUrl", "youtubeUrl", "snapchatUrl", "xTwitterUrl", "googleReviewUrl", "yelpReviewUrl", "reservationUrl", "orderUrl", "menuUrl", "videoUrl"]) {
    assert.ok(!fresh[k], `${k} emptied`);
  }
  assert.deepEqual(fresh.additionalWebsites, []);
  assert.deepEqual(fresh.videoUrls, []);
  assert.equal(fresh.externalRatingValue, undefined);
  assert.equal(fresh.externalReviewCount, undefined);
  assert.equal((fresh.cateringEventsStack as Record<string, unknown>).cateringInquiryUrl ?? "", "");
  assert.equal((fresh.cateringEventsStack as Record<string, unknown>).cateringNote, "keep", "non-link catering fields untouched");
  assert.equal((fresh.featuredDishes as Record<string, unknown>[])[0]!.menuLink, undefined, "per-dish menu link dropped");
  assert.deepEqual(fresh.galleryMediaSequence, [0], "orphan video slot removed");

  // Existing row that already holds Full content: restored, never deleted, and the incoming value never wins.
  const stored = {
    websiteUrl: "https://old.example",
    additionalWebsites: [{ label: "Catering", url: "https://cat.example" }],
    instagramUrl: "https://instagram.com/stored",
    facebookUrl: "https://facebook.com/stored",
    googleReviewUrl: "https://g.page/stored",
    yelpReviewUrl: "https://yelp.com/stored",
    reservationUrl: "https://stored-r.example",
    menuUrl: "https://stored-menu.example",
    videoUrls: ["https://youtube.com/watch?v=stored"],
    externalRatingValue: 4.5,
    cateringEventsStack: { cateringInquiryUrl: "https://stored-c.example" },
    featuredDishes: [{ title: "Tacos", menuLink: "https://stored-dish.example" }],
  };
  const restored = applyRestauranteQuickBoundary(incoming, stored).draft as unknown as Record<string, unknown>;
  assert.equal(restored.instagramUrl, "https://instagram.com/stored");
  assert.equal(restored.facebookUrl, "https://facebook.com/stored");
  assert.equal(restored.googleReviewUrl, "https://g.page/stored");
  assert.equal(restored.yelpReviewUrl, "https://yelp.com/stored");
  assert.equal(restored.reservationUrl, "https://stored-r.example");
  assert.equal(restored.menuUrl, "https://stored-menu.example");
  assert.deepEqual(restored.additionalWebsites, stored.additionalWebsites);
  assert.deepEqual(restored.videoUrls, stored.videoUrls);
  assert.equal(restored.externalRatingValue, 4.5);
  assert.equal((restored.cateringEventsStack as Record<string, unknown>).cateringInquiryUrl, "https://stored-c.example");
  assert.equal((restored.featuredDishes as Record<string, unknown>[])[0]!.menuLink, "https://stored-dish.example");
  assert.equal(restored.websiteUrl, "https://laestrella.example", "the primary website is the customer's normal edit, not gated");
  assert.notEqual(restored.instagramUrl, "https://instagram.com/x", "incoming social never wins");

  // A field the browser OMITTED but the row holds survives the whole-document write.
  const omitted = { businessName: "La Estrella" } as unknown as RestauranteListingDraft;
  const kept = applyRestauranteQuickBoundary(omitted, stored).draft as unknown as Record<string, unknown>;
  assert.equal(kept.instagramUrl, "https://instagram.com/stored", "omitted-but-stored is preserved");
  assert.equal((kept.cateringEventsStack as Record<string, unknown>).cateringInquiryUrl, "https://stored-c.example");

  // Input is never mutated.
  assert.equal((incoming as unknown as Record<string, unknown>).instagramUrl, "https://instagram.com/x");
  // The declared paths never touch the primary website.
  assert.ok(!(RESTAURANTE_QUICK_FULL_ONLY_PATHS as readonly string[]).includes("websiteUrl"));
  assert.ok((RESTAURANTE_QUICK_FULL_ONLY_PATHS as readonly string[]).includes("additionalWebsites"));
});

check("coupons / linked offers: none for Quick (preview strips draft coupons; public gates linked offers on the same capability)", () => {
  const preview = raw(PREVIEW);
  const pub = raw(PUBLIC);
  assert.ok(/isQuickPreview\s*\?\s*\{\s*\.\.\.shellDataFromDraft, coupons: undefined, couponFlyer: undefined, couponMoreOffers: undefined/.test(preview.replace(/\n\s*/g, " ")));
  // Linked offers are hidden only for a PROVEN Quick listing (restauranteLinkedOffersVisibleForListing), NOT by the
  // fail-closed coupons capability; unknown/error keeps production behavior (see verify-restaurantes-offers-failsafe-01).
  assert.ok(pub.includes("linkedOffers={linkedOffersVisible ? linkedOffers : []}"));
  assert.ok(pub.includes("coupons: couponsIncluded ? shellData.coupons : undefined"), "public coupon gate unchanged for Full");
  assert.ok(raw(ROUTE).includes("enforceRestauranteCouponEntitlementServerTruth("), "server coupon entitlement gate still in place");
});

check("dead code: the unimported media strip is non-authoritative and reads the table", () => {
  const strip = raw("app/(site)/clasificados/restaurantes/application/RestaurantePublishMediaStrip.tsx");
  assert.ok(strip.includes("NON-AUTHORITATIVE"));
  assert.ok(!/\? 3 : MAX_GALLERY/.test(strip) && !/hasta 3 imágenes/.test(strip), "no stale 3-photo copy");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) failed:\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nverify-quick-shared-presentation-restaurantes-01: all checks passed");
