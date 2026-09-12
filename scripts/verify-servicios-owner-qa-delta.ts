/**
 * Servicios Owner QA Golden Delta Ledger (2026-09-11) — first-pass source-correction proof.
 *
 * Execution-first where the module is pure (presets, caps, add evaluators, payment recognizer,
 * video playability, featured-media split, checkout copy arithmetic, credential href sanitizer),
 * then source assertions that pin the UI wiring each ledger repair depends on. Runtime/browser proof
 * remains owner QA; this file only proves the source contract and catches regressions.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-servicios-owner-qa-delta.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { BUSINESS_TYPE_PRESETS } from "../app/(site)/clasificados/publicar/servicios/lib/businessTypePresets";
import { createDefaultClasificadosServiciosState } from "../app/(site)/clasificados/publicar/servicios/lib/defaultClasificadosServiciosState";
import { normalizeClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationNormalize";
import {
  applyClasificadosCouponsToServiciosWireProfile,
  mapClasificadosServiciosApplicationToServiciosDraft,
} from "../app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft";
import { mapServiciosApplicationDraftToBusinessProfile } from "../app/(site)/servicios/lib/mapServiciosApplicationDraftToBusinessProfile";
import { serviciosPublishedToApplicationDraft } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosPublishedToApplicationDraft";
import { resolveServiciosProfile } from "../app/(site)/servicios/lib/resolveServiciosProfile";
import { getFeaturedVisualProofImages } from "../app/(site)/servicios/lib/serviciosFeaturedMedia";
import { SERVICIOS_MAX_VIDEO_URLS } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import type { ClasificadosServiciosApplicationState } from "../app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationTypes";
import { MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS } from "../app/(site)/servicios/lib/serviciosGalleryVideoCaps";
import {
  MAX_CUSTOM_QUICK_FACTS,
  MAX_CUSTOM_SERVICES_OFFERED,
} from "../app/(site)/clasificados/publicar/servicios/lib/serviciosSelectionCaps";
import { MAX_CUSTOM_BUSINESS_HIGHLIGHTS } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosHighlightCaps";
import { evaluateAddCustomServiceOffered } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosCustomServicesOffered";
import { evaluateAddCustomQuickFact } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosCustomQuickFacts";
import { evaluateAddCustomBusinessHighlight } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosCustomBusinessHighlights";
import { evaluateAddCustomPaymentMethod } from "../app/(site)/clasificados/publicar/servicios/lib/serviciosCustomPaymentMethods";
import {
  evaluateAddCustomAmenityOptionForGroup,
  MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS_PER_GROUP,
} from "../app/(site)/servicios/lib/serviciosAmenitiesCatalog";
import { resolveServiciosPaymentChipLeading } from "../app/(site)/servicios/lib/serviciosPaymentChipVisual";
import { sanitizeCredentialDocumentHref } from "../app/(site)/servicios/lib/serviciosProfileSanitize";
import { isServiciosVideoPlayableInLeonix } from "../app/(site)/servicios/components/ServiciosGalleryVideoTile";
import {
  buildPromoCodeRecurrenceText,
  buildVerifiedIntroChargeScheduleText,
  PROMO_CODE_SUBSCRIPTION_DURATION,
} from "../app/lib/listingPlans/recurringConsentCopy";

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
function stripComments(s: string): string {
  return s.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/[^\n]*/g, "$1").replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, "");
}
const src = (rel: string) => stripComments(readFileSync(new URL(`../${rel}`, import.meta.url), "utf8"));
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8");

const APP = "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx";
const C = (n: string) => `app/(site)/servicios/components/${n}.tsx`;

// =================================================================================
// Gate E — source-verifier closure (presets, sorting, caps, media contracts, recognizer)
// =================================================================================

check("⚠️32 every selectable business type has a real preset (≥4 services, ≥3 reasons, ≥1 quick fact)", () => {
  const visible = BUSINESS_TYPE_PRESETS.filter((p) => p.id !== "servicio_no_listado");
  assert.ok(visible.length >= 70, `only ${visible.length} presets`);
  for (const p of visible) {
    assert.ok(p.suggestedServices.length >= 4, `${p.id} services`);
    assert.ok(p.reasonsToChoose.length >= 3, `${p.id} reasons`);
    assert.ok(p.quickFacts.length >= 1, `${p.id} quick facts`);
  }
});
check("⚠️32 no two business types share an identical suggested-services set (no copy-paste presets)", () => {
  const seen = new Map<string, string>();
  for (const p of BUSINESS_TYPE_PRESETS) {
    const key = p.suggestedServices.map((c) => c.id).sort().join(",");
    assert.ok(!seen.has(key), `${p.id} duplicates ${seen.get(key)}`);
    seen.set(key, p.id);
  }
});
check("⚠️33 professional (attorney) and trade (plumbing) presets genuinely differ", () => {
  const legal = BUSINESS_TYPE_PRESETS.find((p) => p.id === "abogado_asesoria_legal")!;
  const plumb = BUSINESS_TYPE_PRESETS.find((p) => p.id === "plomeria")!;
  assert.notEqual(legal.internalGroup, plumb.internalGroup);
  const overlap = legal.reasonsToChoose.filter((r) => plumb.reasonsToChoose.some((x) => x.id === r.id));
  assert.equal(overlap.length, 0, "reasons must not be shared");
});
check("⚠️34 tire shop gets tire services; attorney gets legal services", () => {
  const tire = BUSINESS_TYPE_PRESETS.find((p) => p.id === "llantas_neumaticos")!;
  const legal = BUSINESS_TYPE_PRESETS.find((p) => p.id === "abogado_asesoria_legal")!;
  assert.ok(tire.suggestedServices.some((c) => /llant|neum|rotaci|balance|tire/i.test(`${c.es} ${c.en}`)), "tire");
  assert.ok(
    legal.suggestedServices.filter((c) => /legal|abogad|inmigraci|divorc|contrat|demand|lawyer|immigration|will|testament/i.test(`${c.es} ${c.en}`)).length >= 3,
    "legal",
  );
});
check("⚠️31 business types are sorted by the active-locale label while option values stay canonical ids", () => {
  const app = src(APP);
  assert.match(app, /\.filter\(\(p\) => p\.id !== "servicio_no_listado"\)[\s\S]{0,400}\.slice\(\)\s*\.sort\([\s\S]{0,200}localeCompare/);
  assert.match(app, /<option key=\{p\.id\} value=\{p\.id\}>/);
  for (const lang of ["es", "en"] as const) {
    const sorted = BUSINESS_TYPE_PRESETS.slice().sort((a, b) =>
      (lang === "en" ? a.labelEn : a.labelEs).localeCompare(lang === "en" ? b.labelEn : b.labelEs, lang),
    );
    assert.equal(new Set(sorted.map((p) => p.id)).size, BUSINESS_TYPE_PRESETS.length, "ids preserved");
  }
});
check("⚠️36 'Otro servicio' remains a real selectable fallback that reveals the description field", () => {
  assert.ok(BUSINESS_TYPE_PRESETS.some((p) => p.id === "servicio_otro_generico"));
  assert.match(src(APP), /state\.businessTypeId === "servicio_otro_generico"[\s\S]{0,400}customServiceDescription/);
});
check("⚠️40 one canonical video limit of 8 (application, public cap)", () => {
  assert.equal(SERVICIOS_MAX_VIDEO_URLS, 8);
  assert.equal(MAX_SERVICIOS_PUBLIC_GALLERY_VIDEOS, 8);
});
check("⚠️41 no false AI-helper claim in live Servicios UI copy", () => {
  for (const rel of [APP, "app/(site)/clasificados/publicar/servicios/lib/clasificadosServiciosApplicationCopy.ts", "app/(site)/servicios/copy/serviciosProfileCopy.ts"]) {
    assert.ok(!/inteligencia artificial|\bcon IA\b|\bIA te\b|\bwith AI\b|AI-powered|AI helper|asistente de IA/i.test(src(rel)), rel);
  }
});

function profileFrom(over: Partial<ClasificadosServiciosApplicationState>) {
  const state = normalizeClasificadosServiciosApplicationState({ ...createDefaultClasificadosServiciosState(), businessName: "QA", city: "Oakland", ...over });
  const draft = mapClasificadosServiciosApplicationToServiciosDraft(state, "es");
  const wire = applyClasificadosCouponsToServiciosWireProfile(mapServiciosApplicationDraftToBusinessProfile(draft), draft);
  return { state, wire, resolved: resolveServiciosProfile(wire, "es") };
}
const IMG = (n: string) => `https://example.public.blob.vercel-storage.com/servicios/qa-${n}.jpg`;

check("⚠️37/⚠️38 featured photos: max 4 in owner order, the rest stays in the separate gallery", () => {
  const gallery = ["g1", "g2", "g3", "g4", "g5", "g6"].map((id) => ({ id, url: IMG(id), source: "url" as const }));
  const { resolved } = profileFrom({ gallery, featuredGalleryIds: ["g3", "g1", "g5", "g2", "g6"] });
  assert.ok(resolved.gallery.length <= 4);
  assert.deepEqual(resolved.gallery.map((g) => g.url), [IMG("g3"), IMG("g1"), IMG("g5"), IMG("g2")]);
  assert.ok(resolved.galleryMore.every((g) => !resolved.gallery.some((f) => f.url === g.url)), "separation");
  assert.ok(getFeaturedVisualProofImages(resolved, 4).length <= 4);
});
check("⚠️8/⚠️9 languages: multiple fixed + multiple custom values persist and hydrate (no max-3)", () => {
  const { state, wire } = profileFrom({ languageIds: ["lang_es", "lang_en", "lang_otro"], languageOtherLines: "Mixteco\nNáhuatl\nZapoteco\nFrancés" });
  // The publish route stamps opsMeta.discovery.languageChipIds via the (server-only) discovery facet
  // = the state's languageIds; mirrored here so the hydration read is exercised faithfully.
  const published = { ...wire, opsMeta: { ...wire.opsMeta, discovery: { languageChipIds: [...state.languageIds] } } };
  const h = serviciosPublishedToApplicationDraft({ slug: "qa", business_name: "QA", city: "Oakland", profile_json: published });
  assert.match(src("app/(site)/clasificados/servicios/lib/serviciosPublishDiscovery.ts"), /languageChipIds: \[\.\.\.state\.languageIds\]/);
  assert.deepEqual(h.state.languageIds.slice().sort(), ["lang_en", "lang_es", "lang_otro"]);
  assert.equal(h.state.languageOtherLines.split("\n").filter(Boolean).length, 4);
});
check("⚠️54/⚠️55 service areas: independent removable entries round-trip; legacy comma value still hydrates", () => {
  const { wire } = profileFrom({ serviceAreaNotes: "San José\nSanta Clara\nMilpitas" });
  const h = serviciosPublishedToApplicationDraft({ slug: "qa", business_name: "QA", city: "Oakland", profile_json: wire });
  assert.deepEqual(h.state.serviceAreaNotes.split("\n").filter(Boolean), ["San José", "Santa Clara", "Milpitas"]);
  const legacy = normalizeClasificadosServiciosApplicationState({ ...createDefaultClasificadosServiciosState(), serviceAreaNotes: "Fremont, Hayward" });
  assert.ok(legacy.serviceAreaNotes.includes("Fremont") && legacy.serviceAreaNotes.includes("Hayward"));
  assert.match(src(APP), /removeServiceAreaAt\(index\)/);
});

function fillUntilRejected(add: (i: number) => { ok: boolean; reason?: string }, limit: number) {
  let accepted = 0;
  for (let i = 0; i < limit + 3; i++) {
    const r = add(i);
    if (!r.ok) return { accepted, reason: r.reason };
    accepted++;
  }
  return { accepted, reason: undefined };
}
check("⚠️42/⚠️44/⚠️45/⚠️53 multiple custom values per list, duplicate refused, cap refused with a reason", () => {
  let s = createDefaultClasificadosServiciosState();
  const svc = fillUntilRejected((i) => {
    const r = evaluateAddCustomServiceOffered(s, "es", `Servicio QA ${i}`);
    if (r.ok) s = { ...s, customServicesOffered: [...s.customServicesOffered, r.label] };
    return r;
  }, MAX_CUSTOM_SERVICES_OFFERED);
  assert.equal(svc.accepted, MAX_CUSTOM_SERVICES_OFFERED);
  assert.equal(svc.reason, "cap");
  assert.equal(evaluateAddCustomServiceOffered({ ...s, customServicesOffered: ["Servicio QA 0"] }, "es", "servicio qa 0").ok, false);

  let q = createDefaultClasificadosServiciosState();
  const qf = fillUntilRejected((i) => {
    const r = evaluateAddCustomQuickFact(q, "es", `Dato ${i}`);
    if (r.ok) q = { ...q, customQuickFacts: [...q.customQuickFacts, r.label] };
    return r;
  }, MAX_CUSTOM_QUICK_FACTS);
  assert.ok(qf.accepted > 2, "quick facts are not limited to 2");
  assert.equal(qf.accepted, MAX_CUSTOM_QUICK_FACTS);

  let h = createDefaultClasificadosServiciosState();
  const hl = fillUntilRejected((i) => {
    const r = evaluateAddCustomBusinessHighlight(h, "es", `Beneficio QA ${i}`);
    if (r.ok) h = { ...h, customBusinessHighlights: [...h.customBusinessHighlights, r.label] };
    return r;
  }, MAX_CUSTOM_BUSINESS_HIGHLIGHTS);
  assert.equal(hl.accepted, MAX_CUSTOM_BUSINESS_HIGHLIGHTS);

  let bucket: string[] = [];
  const am = fillUntilRejected((i) => {
    const r = evaluateAddCustomAmenityOptionForGroup(bucket, `Opción QA ${i}`);
    if (r.ok) bucket = [...bucket, r.label];
    return r;
  }, MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS_PER_GROUP);
  assert.equal(am.accepted, MAX_CUSTOM_SERVICIOS_AMENITY_OPTIONS_PER_GROUP);
  assert.equal(evaluateAddCustomAmenityOptionForGroup(["Algo"], "algo").ok, false);

  const p0 = createDefaultClasificadosServiciosState();
  assert.equal(evaluateAddCustomPaymentMethod(p0, "   ").ok, false);
});
check("⚠️57 shared payment recognizer: Affirm and known providers get their brand; unknown stays generic", () => {
  assert.deepEqual(resolveServiciosPaymentChipLeading("Affirm"), { kind: "brand", brand: "affirm" });
  for (const [label, brand] of [["Zelle", "zelle"], ["Venmo", "venmo"], ["Cash App", "cash_app"], ["PayPal", "paypal"], ["Visa", "visa"], ["American Express", "amex"]] as const) {
    assert.deepEqual(resolveServiciosPaymentChipLeading(label), { kind: "brand", brand }, label);
  }
  assert.equal(resolveServiciosPaymentChipLeading("Apple Pay").kind, "pill");
  assert.deepEqual(resolveServiciosPaymentChipLeading("Trueque de gallinas"), { kind: "emoji", emoji: "✨" });
});
check("⚠️58 review submission returns actionable bilingual validation (not an opaque 400)", () => {
  const route = src("app/api/clasificados/servicios/review/route.ts");
  for (const code of ["invalid_rating", "invalid_author", "invalid_body", "listing_not_found"]) assert.match(route, new RegExp(`reviewErrorResponse\\("${code}"`));
  assert.match(src(C("ServiciosReviewSubmitForm")), /setErrorMessage\(j\.message \?\? null\)/);
});

// =================================================================================
// Gate A — shared truth
// =================================================================================

check("⚠️19/SVC-QA-16 Translate Ad: the Preview shell adopts the SAME shared translation layer above 'Sobre nosotros'", () => {
  const shell = src("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx");
  assert.match(shell, /useServiciosPublicTranslation\(\{/);
  assert.match(shell, /\{translateControl \? <div>\{translateControl\}<\/div> : null\}\s*\{hasAboutSectionResolved\(displayProfile\)/);
  for (const rel of [C("ServiciosProfileView"), C("ServiciosProfessionalProfileShell")]) assert.match(src(rel), /translateControl \? <div>\{translateControl\}<\/div> : null/);
  assert.match(src(C("ServiciosPublicTranslationLayer")), /requestTranslation=\{requestServiciosAdTranslation\}/);
});
check("⚠️21/SVC-QA-05 address verifier: truthful lookup states, city context, never labels a typed address verified", () => {
  const v = src("app/components/forms/BusinessAddressVerifiedInput.tsx");
  assert.match(v, /setLookup\("searching"\)/);
  assert.match(v, /setLookup\("results"\)/);
  assert.match(v, /setLookup\(json\.ok \|\| json\.reason === "provider_status_zero_results" \? "no_results" : "unavailable"\)/);
  assert.match(v, /setLookup\("unavailable"\)/);
  assert.match(v, /verificationStatus: "user_confirmed"/);
  assert.match(v, /verificationStatus: "manual"/);
  assert.ok(!/verificationStatus: "verified"/.test(v), "UI never sets verified");
  assert.match(v, /no verificada/);
  const app = src(APP);
  assert.match(app, /<BusinessAddressVerifiedInput[\s\S]{0,200}inputClassName=\{inputClass\}[\s\S]{0,200}locationHint=/);
});
check("SVC-QA-24/26 verified 15%: server-proven basis is shown; newsletter plays no part in eligibility", () => {
  const panel = src("app/(site)/clasificados/components/VerifiedIntroDiscountVerifyPanel.tsx");
  assert.match(panel, /basis: result\.emailVerified \? "email" : result\.phoneVerified \? "phone" : null/);
  assert.match(panel, /fetchVerifiedIntroDiscountStatus/);
  const status = src("app/api/verified-intro-discount/status/route.ts");
  assert.match(status, /getVerifiedBearerUser/);
  assert.ok(!/newsletter/i.test(status), "status route never consults newsletter");
  assert.ok(!/newsletter/i.test(src("app/lib/listingPlans/verifiedIntroDiscount.ts")), "eligibility never consults newsletter");
});
check("SVC-QA-25 verified intro arithmetic: $399.00 − $59.85 = $339.15 first, $399.00 renewal", () => {
  const discount = Math.floor(39900 * 0.15);
  assert.equal(discount, 5985);
  const text = buildVerifiedIntroChargeScheduleText({ firstChargeCents: 39900 - discount, renewalCents: 39900, lang: "es" });
  assert.match(text, /\$339\.15/);
  assert.match(text, /\$399\.00 al mes/);
});
check("SVC-QA-28 promo recurrence copy matches Stripe truth (reduced price renews every cycle)", () => {
  assert.equal(PROMO_CODE_SUBSCRIPTION_DURATION, "every_billing_cycle");
  assert.match(buildPromoCodeRecurrenceText({ amountCents: 19950, lang: "es" }), /\$199\.50 cada mes/);
  const stripe = src("app/lib/listingPlans/revenueStripe.ts");
  assert.match(stripe, /unit_amount: Math\.max\(0, Math\.floor\(item\.unitAmountCents\)\)/);
  assert.match(stripe, /recurring: \{ interval: "month" as const \}/);
  const cp = src("app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx");
  assert.match(cp, /resolved\.discountCents > 0 && appliedPromoCode && basePackageIsMonthly/);
  assert.match(cp, /buildRecurringConsentText\(\{ amountCents: resolved\.totalCents/);
});
check("SVC-QA-27 non-stacking stays server-enforced (promo + verified intro → 409)", () => {
  const route = src("app/api/revenue-os/checkout/route.ts");
  assert.match(route, /if \(promoCodeRaw && requestVerifiedIntroDiscount\) \{[\s\S]{0,200}discount_conflict/);
});
check("SVC-QA-29 no Launch-25 residue on the Servicios checkout capture", () => {
  assert.ok(!/launch_25/.test(src("app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx")));
});
check("SVC-QA-03/04 credentials: upload OR URL feed the same field; truthful uploaded state; safe public href", () => {
  const field = src("app/(site)/clasificados/publicar/servicios/components/ServiciosCredentialDocumentField.tsx");
  assert.match(field, /await uploadServiciosCredentialDocument\(file, slot\)/);
  assert.match(field, /onChange\(url\.slice\(0, maxLength\)\)/);
  assert.match(src(APP), /slot="licenseDoc"[\s\S]{0,400}licenseDocumentUrl: next/);
  assert.match(src(APP), /slot="insuranceDoc"[\s\S]{0,400}insuranceDocumentUrl: next/);
  const route = src("app/api/clasificados/servicios/draft-media-upload/route.ts");
  assert.match(route, /const DOC_SLOTS = new Set\(\["licenseDoc", "insuranceDoc"\]\)/);
  const blob = "https://abc123.public.blob.vercel-storage.com/clasificados/servicios/drafts/u1/d1/licenseDoc-0-1-x";
  assert.equal(sanitizeCredentialDocumentHref(blob), blob);
  assert.equal(sanitizeCredentialDocumentHref("javascript:alert(1)"), null);
  assert.match(src(C("ServiciosCredencialesCard")), /href=\{c\.licenseDocumentHrefSafe\}[\s\S]{0,60}target="_blank"/);
});

// =================================================================================
// Gate B — application feedback
// =================================================================================

check("SVC-QA-01/⚠️6/⚠️68 explicit Adds decide first: success clears+confirms, rejection keeps text and says why", () => {
  const app = src(APP);
  for (const hook of ["addedCustomService", "addedCustomBusinessHighlight", "addedCustomQuickFact", "addedCustomPaymentMethod", "addedCertification"]) {
    assert.match(app, new RegExp(`${hook}\\.reject\\(addRejectionMessage\\(r\\.reason\\)\\)`), hook);
    assert.match(app, new RegExp(`rejectedMessage=\\{${hook}\\.rejectedMessage\\}`), `${hook} badge`);
  }
  assert.match(app, /groupConfirmation\?\.reject\(addRejectionMessage\(firstCheck\.reason\)\)/);
  assert.match(app, /addedCustomLanguage\.reject\(addRejectionMessage\("duplicate"\)\)/);
  assert.match(app, /addedServiceArea\.reject\(addRejectionMessage\("duplicate"\)\)/);
  assert.ok(!/let added = false;\s*setState\(\(prev\) => \{\s*const r = evaluateAddCustom/.test(app), "no updater-flag Add left");
  const conf = src("app/components/forms/AddedConfirmation.tsx");
  assert.match(conf, /const reject = useCallback/);
  assert.match(conf, /data-added-confirmation="rejected"/);
});
check("SVC-QA-01 'Otro motivo' becomes a committed chip after Añadir (input no longer holds the value)", () => {
  assert.match(src(APP), /data-servicios-custom-reason="committed"/);
});
check("SVC-QA-02/⚠️11 special hours: per-entry accepted/incomplete status mirrors the publish rule", () => {
  const hours = src("app/components/forms/HoursEditor.tsx");
  assert.match(hours, /entry\.label\.trim\(\) && entry\.note\.trim\(\)[\s\S]{0,200}data-special-hours-status="accepted"/);
  assert.match(src(APP), /entryStatusLabels:/);
  assert.match(src("app/(site)/clasificados/publicar/servicios/lib/mapClasificadosServiciosApplicationToServiciosDraft.ts"), /\.filter\(\(e\) => e\.label && e\.note\)/);
});

// =================================================================================
// Gate C — Preview / public
// =================================================================================

check("SVC-QA-07/08 share opens the native sheet in Preview without a URL or analytics (one shared engine)", () => {
  const share = src("app/components/clasificados/analytics/LeonixShareButton.tsx");
  assert.ok(!/if \(!urlToShare\) return;/.test(share), "silent no-op removed");
  assert.match(share, /\{ title: safeTitle, text: body \|\| safeTitle \}/);
  assert.match(share, /if \(!allowTrack \|\| !effectiveId\) return;/);
});
check("⚠️64/SVC-QA-18/19 action grammar: Like → Save → Share, standard size; hero owns Like/Share", () => {
  const row = src(C("ServiciosBusinessHubEngagementRow"));
  assert.match(row, /data-servicios-action-order="like,save,share"/);
  assert.ok(!/\[&_button\]:!w-full/.test(row), "no stretched full-width action cells");
  assert.ok(row.indexOf("<ServiciosLikeEngagementCluster") < row.indexOf("{saveButton}</div>\n        <div className={actionCellClass}>\n          <LeonixShareButton") || /ServiciosLikeEngagementCluster[\s\S]*saveButton[\s\S]*LeonixShareButton/.test(row));
  assert.match(src(C("ServiciosProfessionalProfileShell")), /\s+hubEngagementVariant,\s*\}: ServiciosProfessionalProfileShellProps/);
  assert.match(src("app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx"), /hubEngagementVariant="save_only"/);
  const strip = src(C("ServiciosResultCardEngagementStrip"));
  assert.ok(strip.indexOf("<ServiciosLikeEngagementCluster") < strip.indexOf("<LeonixSaveButton"), "results: Like then Save");
  assert.ok(strip.indexOf("<LeonixSaveButton") < strip.indexOf("<LeonixShareButton"), "results: Save then Share");
  assert.match(strip, /<LeonixSaveButton/);
  assert.match(strip, /serviciosSavedListingExtras/);
  assert.match(strip, /serviciosGlobalSaveRecorder/);
  assert.match(strip, /data-servicios-action-order="like,save,share"/);
});
check("⚠️16/⚠️59/SVC-QA-17 Community Trust (🦁, real counts) shows in Preview as an honest zero-count preview", () => {
  const trust = src("app/components/leonixCommunityTrust/LeonixCommunityTrust.tsx");
  assert.match(trust, /if \(preview\) \{\s*setEntries\(\s*getLeonixEndorsementDefinitions\(category\)\.map\(\(d\) => \(\{ key: d\.key, es: d\.es, en: d\.en, count: 0, userVoted: false \}\)\)/);
  assert.match(trust, /disabled=\{busy \|\| preview\}/);
  assert.match(src(C("ServiciosBusinessHubContactCard")), /preview=\{!\(listingSourceId \?\? ""\)\.trim\(\)\}/);
});
check("⚠️22/SVC-QA-09 coupon/flyer viewer is the shared modal (visible close, Escape) with an image hint", () => {
  const card = src(C("ServiciosCouponsCard"));
  assert.match(card, /<BusinessFlyerViewerModal[\s\S]{0,200}kind="image"/);
  assert.ok(!/fixed inset-0 z-50 flex items-center justify-center bg-black\/80 p-4/.test(card), "bespoke overlay removed");
  const modal = src("app/components/media/BusinessFlyerViewerModal.tsx");
  assert.match(modal, /if \(e\.key === "Escape"\) onClose\(\)/);
  assert.match(modal, /kind === "image" \|\|/);
});
check("SVC-QA-10/11/12 gallery: Todo/Fotos/Videos switch (grid + viewer), videos open in the Leonix viewer first", () => {
  const g = src(C("ServiciosGalleryWithTabs"));
  assert.match(g, /<ServiciosMediaFilterSwitch/);
  assert.match(g, /headerSlot=\{/);
  assert.match(g, /onOpenInViewer=\{\(\) => openModal\(index, "videos"\)\}/);
  assert.match(src("app/components/media/BusinessGalleryModal.tsx"), /\{copy\.counterLabel\} · \{activeIndex \+ 1\} \/ \{slides\.length\}/);
  assert.equal(isServiciosVideoPlayableInLeonix({ url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" }), true);
  assert.equal(isServiciosVideoPlayableInLeonix({ url: "https://x.public.blob.vercel-storage.com/v/clip.mp4" }), true);
  assert.equal(isServiciosVideoPlayableInLeonix({ url: "https://www.tiktok.com/@qa/video/123" }), false);
  assert.match(src(C("ServiciosGalleryVideoTile")), /data-servicios-video-provider-link="1"/);
});
check("SVC-QA-13/14/34 rails: shared overflow-only affordance on real rails; short chip lists wrap", () => {
  const rail = src("app/components/leonix/LeonixHorizontalRail.tsx");
  assert.match(rail, /el\.scrollLeft \+ el\.clientWidth < el\.scrollWidth - EDGE_EPSILON_PX/);
  assert.match(rail, /pointer-events-none absolute inset-y-0/);
  assert.match(rail, /aria-label=\{labels\.next\}/);
  for (const rel of [C("ServiciosCouponsCard"), C("ServiciosVisualProofRow"), C("ServiciosServicesGrid"), C("ServiciosTrustSection"), APP]) {
    assert.match(src(rel), /<LeonixHorizontalRail/, rel);
  }
  assert.ok(!/overflow-x-auto/.test(src(C("ServiciosSmartTrustSummary"))), "Resumen rápido never scrolls");
});
check("⚠️66/⚠️67/SVC-QA-22/23 Pagos y beneficios shows normal content directly; hooks run before returns", () => {
  const p = src(C("ServiciosPagosBeneficiosSection"));
  assert.match(p, /const COLLAPSE_THRESHOLD = 25;/);
  assert.ok(p.indexOf("useMemo(") < p.indexOf("return null"), "memo before early return");
});
check("SVC-QA-21 end-of-content share moment in every live shell, same shared engine", () => {
  for (const rel of [C("ServiciosProfileView"), C("ServiciosProfessionalProfileShell"), "app/(site)/clasificados/publicar/servicios/preview/ServiciosProfessionalPreviewShell.tsx"]) {
    assert.match(src(rel), /<ServiciosEndOfContentShare/, rel);
  }
  assert.match(src(C("ServiciosEndOfContentShare")), /<LeonixShareButton/);
});

// =================================================================================
// Gate D — mobile
// =================================================================================

check("SVC-QA-33/⚠️30 step rail reveals the active step and marks it aria-current", () => {
  const app = raw(APP);
  assert.match(app, /revealKey=\{step\}/);
  assert.match(app, /data-rail-active=\{step === i \? "true" : undefined\}/);
  assert.match(app, /aria-current=\{step === i \? "step" : undefined\}/);
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-servicios-owner-qa-delta: PASS");
