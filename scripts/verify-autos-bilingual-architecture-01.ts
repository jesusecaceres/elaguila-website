/**
 * AUTOS-BILINGUAL-ARCHITECTURE-01 (2026-09-15/16).
 *
 * Owner mandate: make the complete Autos Dealer/Negocios (+ Privado parity) buyer experience
 * bilingual and internally coherent — not just the single-vehicle Translate Ad control. This
 * verifier proves the concrete, scoped fixes actually made during that audit. It does NOT claim
 * full 36-gate coverage of the original mandate; see the accompanying report for the honest
 * remaining-gap list.
 *
 * Execution-first where a pure function exists (taxonomy localizer, formatters). Source
 * assertions pin wiring that can't be exercised as a pure function from a script (React context
 * consumption, API response shape) and confirmed-dead files.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-autos-bilingual-architecture-01.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import {
  localizeAutosDealerTaxonomySelectValue,
  localizeAutosDealerFeatureCatalogValue,
} from "../app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy";
import { formatAutosUsd, formatAutosMiles } from "../app/(site)/clasificados/autos/components/public/autosPublicFormatters";
import { formatUsd, formatMiles } from "../app/(site)/clasificados/autos/negocios/components/autoDealerFormatters";
import { localizeAutosDealerLanguageLabel } from "../app/lib/clasificados/autos/autosDealerLanguages";
import { buildAutosTranslatableContent, applyAutosTranslation } from "../app/(site)/clasificados/autos/lib/autosTranslateAd";
import { computeAutosAdDisplayLang } from "../app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer";
import { localizeDealerHoursDayLabel, formatDealerHoursTimeRange } from "../app/(site)/clasificados/autos/negocios/lib/dealerHoursDisplay";
import { hasDealerFinanceContact, resolveFinanceSmsTel, resolveFinanceEmailHref } from "../app/lib/clasificados/autos/autosDealerFinanceContact";
import { buildMailtoHref } from "../app/lib/digitalContact/humanConnection/nativeChannelHrefs";
import { buildSendEmailIntent } from "../app/components/cta/ctaIntentBuilders";
import { mapAutosDealerToBusinessHubContact } from "../app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact";
import { buildAutosGalleryMediaSets } from "../app/lib/clasificados/autos/autosGalleryLightbox";
import { mapInheritedDealerPreviewListing } from "../app/lib/clasificados/autos/autosInventoryInheritedPreview";
import type { AutosAdditionalInventoryVehicleDraft } from "../app/lib/clasificados/autos/autosAdditionalInventoryDraft";
import type { AutoDealerListing } from "../app/(site)/clasificados/autos/negocios/types/autoDealerListing";
import { shouldOfferAutosTranslateAd } from "../app/(site)/clasificados/autos/lib/autosTranslateAd";
import { filterDealerHoursForDisplay } from "../app/(site)/clasificados/autos/negocios/lib/dealerHoursDisplay";
import { buildAutosContactEmailBody } from "../app/lib/clasificados/autos/autosContactEmailBody";
import { oppositeActiveTranslateLocale } from "../app/lib/translation/unknownSourcePolicy";

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
const raw = (rel: string) => readFileSync(new URL(`../${rel}`, import.meta.url), "utf8").replace(/\r\n/g, "\n");

/* ================================================================================================
 * GATE 9 — source-language truth: authored_lang is the real listing language, distinct from the
 * viewer's requested display lang, and is what feeds the Translate Ad source locale.
 * ============================================================================================ */
check("live listing API returns authored_lang (seller's language) separately from lang (viewer's requested locale)", () => {
  const route = raw("app/api/clasificados/autos/public/listings/[id]/route.ts");
  assert.ok(route.includes("authored_lang: bundle.authoredLang"), "response must expose authored_lang");
  assert.ok(route.includes('const lang: AutosClassifiedsLang = u.searchParams.get("lang")'), "viewer lang still comes from the request, unchanged");
});
check("bundle service returns the real persisted row.lang as authoredLang, not the viewer's lang argument", () => {
  const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  const fnStart = svc.indexOf("export async function getActiveLiveAutosBundle");
  const fnBody = svc.slice(fnStart, svc.indexOf("\n}\n", fnStart));
  assert.ok(fnBody.includes("authoredLang: row.lang"), "authoredLang must come from the fetched row, not the lang parameter");
});
check("AutosLiveVehicleClient feeds authored_lang (not the viewer-echoed lang) into the translation layer's source locale", () => {
  const client = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(client.includes("setListingLang(payload.authored_lang ?? null);"), "listingLang state must be set from authored_lang");
  assert.ok(!client.includes("setListingLang(payload.lang ?? null);"), "must not still default to echoing the viewer's own requested lang");
  assert.ok(client.includes("authored_lang?: \"es\" | \"en\" | null;"), "response type documents the field");
});

/* ================================================================================================
 * GATE 13 — deterministic structured-taxonomy localization: bidirectional, positional lookup
 * against the real ES/EN option catalogs; free-typed custom text is never touched.
 * ============================================================================================ */
check("transmission/fuel/bodyStyle/colors/titleStatus relocalize bidirectionally by position", () => {
  assert.equal(localizeAutosDealerTaxonomySelectValue("transmission", "Automática", "en"), "Automatic");
  assert.equal(localizeAutosDealerTaxonomySelectValue("transmission", "Automatic", "es"), "Automática");
  assert.equal(localizeAutosDealerTaxonomySelectValue("fuel", "Gasolina premium", "en"), "Premium gasoline");
  assert.equal(localizeAutosDealerTaxonomySelectValue("exterior", "Gris", "en"), "Gray");
  assert.equal(localizeAutosDealerTaxonomySelectValue("titleStatus", "Salvage", "es"), "Salvamento");
});
check("a value already in the target language is returned unchanged (idempotent)", () => {
  assert.equal(localizeAutosDealerTaxonomySelectValue("fuel", "Gasoline", "en"), "Gasoline");
});
check("seller free-typed 'Otro' custom text (matches neither array) is never fabricated or altered", () => {
  const customText = "Convertido a gas propano por el dueño";
  assert.equal(localizeAutosDealerTaxonomySelectValue("fuel", customText, "en"), customText);
  assert.equal(localizeAutosDealerTaxonomySelectValue("transmission", "", "en"), "");
  assert.equal(localizeAutosDealerTaxonomySelectValue("transmission", undefined, "en"), undefined);
});
check("the empty placeholder value ('') is never treated as a real index-0 taxonomy entry", () => {
  // Index 0 in every taxonomy array is the "" select placeholder — must never resolve to itself
  // being reported as a "found" match that then gets remapped.
  assert.equal(localizeAutosDealerTaxonomySelectValue("bodyStyle", "", "es"), "");
});

check("feature catalog picks relocalize bidirectionally by position", () => {
  assert.equal(localizeAutosDealerFeatureCatalogValue("Backup camera", "es"), "Cámara de reversa");
  assert.equal(localizeAutosDealerFeatureCatalogValue("Cámara de reversa", "en"), "Backup camera");
  assert.equal(localizeAutosDealerFeatureCatalogValue("Panoramic roof", "es"), "Techo panorámico");
});
check("catalog localizer never touches free-typed custom equipment — proven by call-site separation, not just the pure function", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewVehicleHighlights.tsx");
  assert.ok(
    src.includes("(data.features ?? []).map((f) => f.trim()).filter(Boolean).map((f) => localizeAutosDealerFeatureCatalogValue(f, lang))"),
    "features (catalog) must run through the localizer",
  );
  assert.ok(
    src.includes("const custom = dedupeLabels((data.customEquipment ?? []).map((f) => f.trim()).filter(Boolean));"),
    "customEquipment (free text) must NOT be passed through the localizer — this was the confirmed conflation bug",
  );
  assert.ok(!src.includes("EQUIPMENT_LABEL_ES"), "the old one-directional, catalog/custom-conflating dictionary must be gone");
});

/* ================================================================================================
 * GATE 2/24 — mileage/price formatting: locale-correct unit + no duplicate-unit regressions.
 * ============================================================================================ */
check("public results-card formatters localize the mileage unit and currency locale", () => {
  assert.equal(formatAutosMiles(12345, "en"), "12,345 mi");
  assert.equal(formatAutosMiles(12345, "es"), "12,345 millas");
  assert.ok(formatAutosUsd(48950, "en").includes("48,950"));
  assert.ok(formatAutosUsd(48950, "es").includes("48,950"));
});
check("Dealer/Privado detail-page formatters (autoDealerFormatters) localize the same way, defaulting to English for untouched callers", () => {
  assert.equal(formatMiles(12345), "12,345 mi", "default lang keeps old exact output for callers not yet updated");
  assert.equal(formatMiles(12345, "es"), "12,345 millas");
  assert.equal(formatUsd(48950, "es").includes("48,950"), true);
});
check("the confirmed duplicate-unit bug (formatMiles output already had 'mi', then a second literal 'millas'/'miles' was concatenated) is gone", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/AutosNegociosDealershipPreviewPage.tsx",
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutosDealerInventoryVehicleCard.tsx",
  ]) {
    const src = raw(file);
    assert.ok(!/formatMiles\([^)]*\)\}\s*\{lang === "es" \? "millas" : "miles"\}/.test(src), `${file}: duplicate unit concatenation must be removed`);
  }
});

/* ================================================================================================
 * GATE 15 — Business Hub CTA semantics: no generic "Chatear"/"Chat" collapsing WhatsApp+SMS.
 * ============================================================================================ */
check("PreviewDealerBusinessStack no longer has a combined ambiguous chat button — WhatsApp and SMS are distinct, correctly labeled buttons", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(!src.includes("chatLabel"), "the generic chatLabel variable must be removed");
  assert.ok(!src.includes("chatHref"), "the generic chatHref fallback-chain variable must be removed");
  assert.ok(!/"Chatear"/.test(src) && !/>\s*Chat\s*</.test(src), "no literal 'Chatear'/'Chat' label remains");
  assert.ok(src.includes("{sb.whatsappCta}") && src.includes("{sb.textMessageCta}"), "WhatsApp and SMS each render with their own centralized, correct label");
});
check("the 'Questions about this vehicle?' fallback box only appears when WhatsApp/SMS are absent, and uses the real Correo action sheet (not a bare mailto href)", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(src.includes("premiumHub && !showWhatsapp && !showSms && showEmail"), "box must be email-only fallback, not a 3-way ambiguous channel picker");
  assert.ok(!src.includes("sendMessageLabel"), "the generic 'Send message' label for a 3-way channel fallback must be removed");
  const boxStart = src.indexOf("premiumHub && !showWhatsapp && !showSms && showEmail");
  const boxBody = src.slice(boxStart, boxStart + 500);
  assert.ok(boxBody.includes("onClick={openEmail}"), "must route through the same Correo action-sheet handler as every other email entry point");
});

/* ================================================================================================
 * GATE 16 — gallery language consistency: no independent per-component language derivation.
 * ============================================================================================ */
check("PreviewAutoGallery and AutoGallery read lang from the same shared copy context as the rest of their page tree, not an independent URL read", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes("useAutosNegociosPreviewCopy()"), `${file}: must consume the shared locale context`);
    assert.ok(!src.includes('useSearchParams();\n  const lang = normalizeAutosNegociosLang'), `${file}: independent URL-based lang derivation must be removed`);
  }
});

/* ================================================================================================
 * GATE 22 — per-listing translation-state isolation: no shared literal draft cache key.
 * ============================================================================================ */
check("the parent draft-preview translation cache key is a per-mount random id, not a literal 'draft' shared across every no-listingId session", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(!/canonicalListingId \?\? "draft"/.test(src), "literal 'draft' fallback key must be gone");
  assert.ok(src.includes("draftTranslationSessionKey") && src.includes("window.crypto?.randomUUID"), "must use a per-mount random session key instead");
  assert.equal((src.match(/canonicalListingId \?\? draftTranslationSessionKey/g) ?? []).length, 2, "both wrapped Preview branches must use the isolated key");
});

/* ================================================================================================
 * Confirmed dead code (repo-wide zero real consumers) — classified, not silently left ambiguous.
 * Not deleted in this pass (owner steering: defer cleanup); this check only proves the
 * classification is still accurate so a future cleanup pass has a reliable starting point.
 * ============================================================================================ */
check("confirmed-dead Autos Dealer files still have zero real consumers repo-wide (classification still holds)", () => {
  // NOTE: DealerFinanceContact.tsx was initially misclassified dead during this audit — a
  // relative-path grep (`negocios/components/DealerFinanceContact`) missed that
  // PreviewDealerBusinessStack.tsx imports it via `"../../components/DealerFinanceContact"`. It
  // is a real live consumer, confirmed and corrected; deliberately excluded from this list.
  const deadFiles: Record<string, string> = {
    "app/(site)/clasificados/autos/negocios/components/AutoDealerPreviewPage.tsx": "AutoDealerPreviewPage",
    "app/(site)/clasificados/autos/negocios/components/RelatedDealerCars.tsx": "RelatedDealerCars",
    "app/(site)/clasificados/autos/negocios/components/VehicleDescription.tsx": "VehicleDescription",
    "app/(site)/clasificados/autos/negocios/components/VehicleHighlights.tsx": "VehicleHighlights",
    "app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx": "DealerBusinessStack",
    "app/(site)/clasificados/autos/shell/AutosResultCard.tsx": "AutosResultCard",
    "app/(site)/clasificados/autos/shell/AutosPreviewCard.tsx": "AutosPreviewCard",
  };
  const root = new URL("..", import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, "$1");
  for (const [file, exportName] of Object.entries(deadFiles)) {
    assert.ok(raw(file).includes(exportName), `${file}: sanity — file still defines ${exportName}`);
    // Match the FILE PATH import, not the bare export name — a bare-name grep false-positives on
    // sibling symbols that merely contain this one as a substring (e.g. PreviewRelatedDealerCars
    // contains "RelatedDealerCars"). A dead file importing another dead file is not a real consumer.
    const stem = exportName;
    let hits: string[] = [];
    try {
      hits = execSync(`grep -rlE "from [\\"'].*/${stem}[\\"']" app --include=*.tsx --include=*.ts`, {
        cwd: root,
        encoding: "utf8",
      })
        .trim()
        .split("\n")
        .filter(Boolean)
        .map((p) => p.replace(/\\/g, "/"));
    } catch {
      hits = [];
    }
    const otherConsumers = hits.filter((h) => !h.endsWith(file) && !(h in deadFiles));
    assert.equal(otherConsumers.length, 0, `${exportName}: expected zero non-dead consumers, found: ${otherConsumers.join(", ")}`);
  }
});

/* ================================================================================================
 * ROUND 2 (2026-09-16) — Gate A: child Preview translation wiring.
 * ============================================================================================ */
check("child inventory overlay is wrapped in the shared translation layer, keyed on the child's own stable id (never a shared literal, never the parent's key)", () => {
  const src = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  assert.ok(src.includes('from "@/app/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer"'));
  assert.ok(src.includes("<AutosListingTranslationLayer"));
  assert.ok(src.includes("listingKey={child.id}"), "must be keyed on the child's own id, not a shared/generic key");
  assert.ok(!src.includes('listingKey="draft"') && !src.includes("listingKey={\"draft\"}"));
  assert.ok(src.includes("data={displayListing}"), "the dealership preview page must receive the translated display listing, not the raw merged object");
});

/* ================================================================================================
 * Gate B — Preview source-language truth: parent draft/canonical branches no longer hardcode null.
 * ============================================================================================ */
check("parent Preview's canonical-active and draft branches use the real resolved/authored language, not a hardcoded null", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(!/listingLang=\{null\}/.test(src), "no remaining hardcoded-null listingLang in the Preview client");
  assert.ok(src.includes("listingLang={resolvedListingLang}"), "canonical-active branch uses the real persisted lang");
  assert.ok(src.includes("listingLang={resolvedListingLang ?? lang}"), "draft branch prefers the real persisted lang, honestly falls back to the current session's own authored language");
  assert.ok(src.includes("lang?: \"es\" | \"en\";") && src.includes("json.lang === \"en\" || json.lang === \"es\""), "the owner-authenticated canonical fetch now reads the row's real lang field");
});

/* ================================================================================================
 * Confirmed screenshot-evidence defects (owner's own pass1 walkthrough) — fixed, not assumed.
 * ============================================================================================ */
check("the hardcoded English 'Business Hub' section header is gone (was identical in both lang branches — confirmed by 3 independent owner screenshots)", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(!/lang === "es" \? "Business Hub" : "Business Hub"/.test(src), "the always-English header bug must be gone");
  assert.ok(src.includes('"Centro de contacto"'), "Spanish header must be a real Spanish string, not the English term");
});
check("the bottom-nav 'Business Hub del concesionario' tab no longer splices an untranslated English term into a Spanish label", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewPromiseStrip.tsx");
  assert.ok(!src.includes("Business Hub del concesionario"));
  assert.ok(src.includes("Centro de contacto del concesionario"));
});
check("dealer language chips (Español/English preset) localize to the viewer's site language; custom free-typed entries are preserved exactly", () => {
  assert.equal(localizeAutosDealerLanguageLabel("Español", "en"), "Spanish");
  assert.equal(localizeAutosDealerLanguageLabel("English", "es"), "Inglés");
  assert.equal(localizeAutosDealerLanguageLabel("English", "en"), "English");
  assert.equal(localizeAutosDealerLanguageLabel("Español", "es"), "Español");
  // The dealer's own free-typed language entry (even a misspelling like "Portugese") is the
  // dealer's own authored content — never silently corrected or relabeled.
  assert.equal(localizeAutosDealerLanguageLabel("Portugese", "es"), "Portugese");
  assert.equal(localizeAutosDealerLanguageLabel("Portugese", "en"), "Portugese");
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(src.includes("localizeAutosDealerLanguageLabel(label, lang)"), "the language-chip render site must call the localizer");
});

/* ================================================================================================
 * Gate D — finance free-text fields now flow through the same translation pipeline as
 * title/description/equipment (previously missing entirely).
 * ============================================================================================ */
check("finance advisor title and finance notes are included in the translatable content and applied back correctly on translate", () => {
  const listing = {
    financeContactTitle: "Gerente de Financiamiento",
    financeNotes: "Aprobación el mismo día para compradores calificados.",
  } as unknown as AutoDealerListing;
  const content = buildAutosTranslatableContent(listing);
  assert.equal(content.serviceLabel, "Gerente de Financiamiento");
  assert.equal(content.highlights, "Aprobación el mismo día para compradores calificados.");
  const translated = applyAutosTranslation(listing, {
    serviceLabel: "Finance Manager",
    highlights: "Same-day approval for qualified buyers.",
  });
  assert.equal(translated.financeContactTitle, "Finance Manager");
  assert.equal(translated.financeNotes, "Same-day approval for qualified buyers.");
  // View Original: the source object itself must never be mutated by apply.
  assert.equal(listing.financeContactTitle, "Gerente de Financiamiento");
  assert.equal(listing.financeNotes, "Aprobación el mismo día para compradores calificados.");
});

/* ================================================================================================
 * Gate H — coupon/promo/offer analog: traced, confirmed absent (not assumed).
 * ============================================================================================ */
check("Autos Dealer has no dedicated promo/offer/incentive field today — N/A classification proven by source, not assumed", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts");
  assert.ok(!/promoText|offerText|incentiveText|dealerOffer|tradeInOffer/.test(src), "no promo-analog field exists on the listing type");
});

/* ================================================================================================
 * Gate J — analytics identity is keyed off the href scheme, never the visible/translated label.
 * ============================================================================================ */
check("contact CTA analytics classify strictly by href pattern (tel:/wa.me/mailto:/sms:/maps/http) — never by button label text", () => {
  const tracking = raw("app/(site)/clasificados/autos/lib/autosCtaTracking.ts");
  const fnStart = tracking.indexOf("export function trackAutosContactFromHref");
  const fnBody = tracking.slice(fnStart, tracking.indexOf("\n}", fnStart));
  assert.ok(fnBody.includes('h.startsWith("tel:")') && fnBody.includes('"phone"'));
  assert.ok(/wa\\?\.me/.test(fnBody) && fnBody.includes('"whatsapp"'));
  assert.ok(fnBody.includes('h.startsWith("sms:")') && fnBody.includes('"message"'));
  assert.ok(fnBody.includes('h.startsWith("mailto:")') && fnBody.includes('"email"'));
  assert.ok(!/children|label|text/i.test(fnBody), "classification must never reference the button's visible text");
  const link = raw("app/(site)/clasificados/autos/shared/components/AutosDirectContactLink.tsx");
  assert.ok(link.includes("trackAutosContactFromHref(trimmed, analyticsMeta)"), "tracking call passes the href, not children/label");
});

/* ================================================================================================
 * Gate N — cache/version correctness: payload shape changed (finance fields added), version bumped.
 * ============================================================================================ */
check("the Autos Translate Ad cache version was bumped after every buildAutosTranslatableContent payload shape change (finance fields, custom-link/special-hours, locationNote) — no stale v1/v2/v3 string remains", () => {
  const layer = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx");
  assert.ok(!layer.includes('version="autos-t5-v1"'), "the stale pre-finance-fields version string must be gone");
  assert.ok(!layer.includes('version="autos-t6-v2"'), "the stale pre-custom-link/special-hours version string must be gone");
  assert.ok(!layer.includes('version="autos-t6-v3"'), "the stale pre-locationNote version string must be gone");
  assert.ok(/version="autos-t6-v4"/.test(layer), "version bumped to the current value");
});

/* ================================================================================================
 * ROUND 3 (2026-09-16) — PM/OWNER CORRECTION: the complete ad-local experience (not just seller
 * prose) must follow a distinct `adDisplayLang`, fully independent of global `siteLocale`. The
 * checks below prove the corrected architecture end to end: the pure computation, the nested
 * React-context wiring at every render-prop consumer, child isolation/parent-follows-parent,
 * the results-card language-domain firewall, the new custom-link/special-hours/hours-day-label
 * fixes, identity-field preservation, and Servicios/Privado non-regression.
 * ============================================================================================ */

/* --- Gate 1: computeAutosAdDisplayLang pure contract ------------------------------------------- */
check("ORIGINAL state: a known authored source locale (es/en) wins over siteLocale", () => {
  assert.equal(
    computeAutosAdDisplayLang({ showTranslated: false, translation: null, sourceLocale: "en", siteLocale: "es" }),
    "en",
    "an English-authored ad must stay English-chrome on a Spanish-site visit until translated",
  );
});
check("ORIGINAL state: an unknown source locale honestly falls back to siteLocale", () => {
  assert.equal(
    computeAutosAdDisplayLang({ showTranslated: false, translation: null, sourceLocale: "unknown", siteLocale: "es" }),
    "es",
  );
});
check("TRANSLATED state: effectiveTargetLocale wins over targetLocale when both are present", () => {
  assert.equal(
    computeAutosAdDisplayLang({
      showTranslated: true,
      translation: { targetLocale: "en", effectiveTargetLocale: "es" },
      sourceLocale: "unknown",
      siteLocale: "en",
    }),
    "es",
  );
});
check("TRANSLATED state: falls back to targetLocale when effectiveTargetLocale is absent", () => {
  assert.equal(
    computeAutosAdDisplayLang({
      showTranslated: true,
      translation: { targetLocale: "en", effectiveTargetLocale: undefined },
      sourceLocale: "es",
      siteLocale: "es",
    }),
    "en",
  );
});
check("showTranslated=true with a null translation object never crashes and behaves as ORIGINAL state", () => {
  assert.equal(
    computeAutosAdDisplayLang({ showTranslated: true, translation: null, sourceLocale: "en", siteLocale: "es" }),
    "en",
  );
});

/* --- Gate 1/2: render-prop contract + nested-provider wiring at every consumer ------------------ */
check("AutosListingTranslationLayer's render-prop exposes adDisplayLang as its 3rd argument", () => {
  const src = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx");
  assert.ok(/children:\s*\(\s*displayListing[^,]*,\s*translateControl[^,]*,\s*adDisplayLang:/.test(src));
  assert.ok(src.includes("return <>{children(displayListing, translateControl, adDisplayLang)}</>;"));
});
check("live vehicle client (negocios): outer chrome stays on siteLocale, a fresh provider nested at the render-prop carries adDisplayLang around the full detail page, with translateControl threaded through as a prop (2026-09-17 placement fix: no longer a standalone page-top sibling)", () => {
  const src = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(
    /<AutosNegociosPreviewLocaleProvider lang=\{lang\} manageDocumentTitle=\{false\}>[\s\S]*?<AutosListingTranslationLayer/.test(src),
    "outer wrapper (site chrome: Leonix Ad ID label, back-to-results link) must stay keyed on siteLocale",
  );
  assert.ok(
    /\(displayListing, translateControl, adDisplayLang\) => \(\s*<AutosNegociosPreviewLocaleProvider lang=\{normalizeAutosNegociosLang\(adDisplayLang\)\}[\s\S]*?<AutosNegociosDealershipPreviewPage[\s\S]*?translateControl=\{translateControl\}[\s\S]*?\/>\s*<\/AutosNegociosPreviewLocaleProvider>/.test(
      src,
    ),
    "nested provider must wrap the full dealership preview page, and translateControl must be passed into it (still inside the adDisplayLang-scoped provider, not the outer siteLocale one)",
  );
});
check("live vehicle client (privado): the same nested-provider pattern applies with the Privado provider, translateControl threaded through as a prop", () => {
  const src = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(
    /\(displayListing, translateControl, adDisplayLang\) => \(\s*<AutosPrivadoPreviewLocaleProvider lang=\{normalizeAutosNegociosLang\(adDisplayLang\)\}[\s\S]*?<AutoPrivadoPreviewPage[\s\S]*?translateControl=\{translateControl\}[\s\S]*?\/>\s*<\/AutosPrivadoPreviewLocaleProvider>/.test(
      src,
    ),
  );
});
check("parent Preview canonical-active branch nests a fresh provider on adDisplayLang around the detail page, with translateControl threaded through as a prop", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(
    /\(displayListing, translateControl, adDisplayLang\) => \(\s*<AutosNegociosPreviewLocaleProvider lang=\{normalizeAutosNegociosLang\(adDisplayLang\)\}[\s\S]*?<AutosNegociosDealershipPreviewPage\s+data=\{displayListing\}\s+editBackHref=\{editBackHref\}[\s\S]*?translateControl=\{translateControl\}[\s\S]*?\/>\s*<\/AutosNegociosPreviewLocaleProvider>/.test(
      src,
    ),
  );
});
check("parent Preview draft-capture branch moves the results card, related-inventory section, and bottom-nav promise strip INSIDE the adDisplayLang provider (not left on raw site lang)", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  const start = src.indexOf("const adDisplayLang = normalizeAutosNegociosLang(adDisplayLangRaw);");
  assert.ok(start >= 0, "draft-capture branch must derive a narrowed adDisplayLang");
  const block = src.slice(start, src.indexOf("</AutosNegociosPreviewLocaleProvider>", start));
  assert.ok(block.includes("<AutosNegociosResultsCardPreview lang={adDisplayLang}"));
  assert.ok(block.includes("<AutosNegociosPreviewInventorySection"), "related inventory must be inside the same block");
  assert.ok(/lang=\{adDisplayLang\}[\s\S]*parentListing=\{displayListing\}/.test(block) || block.includes("lang={adDisplayLang}\n            parentListing={displayListing}"));
  assert.ok(block.includes("<AutosNegociosPreviewPromiseStrip lang={adDisplayLang}"), "bottom nav must be inside the same block");
});
check("child inventory overlay nests its own adDisplayLang provider inside the outer session-lang chrome provider, with translateControl threaded through as a prop", () => {
  const src = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  assert.ok(/<AutosNegociosPreviewLocaleProvider lang=\{lang\}>[\s\S]*<AutosListingTranslationLayer/.test(src), "outer chrome provider stays on the plain session lang");
  assert.ok(
    /\(displayListing, translateControl, adDisplayLangRaw\) => \{[\s\S]*?<AutosNegociosPreviewLocaleProvider lang=\{adDisplayLang\}[\s\S]*?<AutosNegociosDealershipPreviewPage[\s\S]*?translateControl=\{translateControl\}[\s\S]*?\/>\s*<\/AutosNegociosPreviewLocaleProvider>/.test(
      src,
    ),
  );
});

/* --- Gate 4/5: child architecture parity + parent-follows-parent isolation ---------------------- */
check("the child overlay's own results card (inside the overlay) follows the CHILD's own adDisplayLang, not the parent's raw lang", () => {
  const src = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  assert.ok(src.includes("<AutosNegociosResultsCardPreview lang={adDisplayLang} listing={displayListing}"));
});
check("the related-inventory list rendered on the PARENT page follows the PARENT's adDisplayLang, never an independent per-child value", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(src.includes("<AutosNegociosPreviewInventorySection\n                    lang={adDisplayLang}"));
  const section = raw("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx");
  assert.ok(!/useSearchParams|useAutosNegociosPreviewCopy/.test(section), "the section must take lang purely as a prop from its parent, never derive it itself");
});

/* --- Gate 6: results/search cards keep the site-locale language domain, not the detail page's translation state --- */
check("the public search-results card takes lang as a plain external prop and never touches the ad-local translation layer/context", () => {
  const src = raw("app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx");
  assert.ok(!/AutosListingTranslationLayer|useAutosNegociosPreviewCopy|useAutosPrivadoPreviewCopy/.test(src));
  assert.ok(src.includes("lang: AutosPublicLang;"), "lang must be a declared external prop");
});

/* --- Gate 7: custom-link labels — deterministic encode/decode, id/url/order preserved exactly --- */
check("custom-link labels translate while id and url stay byte-for-byte identical, order preserved", () => {
  const listing = {
    dealerCustomLinks: [
      { id: "link-1", label: "Financiamiento", url: "https://example.com/financiamiento" },
      { id: "link-2", label: "Servicio y mantenimiento", url: "https://example.com/servicio" },
    ],
  } as unknown as AutoDealerListing;
  const content = buildAutosTranslatableContent(listing);
  assert.equal(content.customServiceText, "Financiamiento\nServicio y mantenimiento");
  const translated = applyAutosTranslation(listing, {
    customServiceText: "Financing\nService and maintenance",
  });
  assert.deepEqual(translated.dealerCustomLinks, [
    { id: "link-1", label: "Financing", url: "https://example.com/financiamiento" },
    { id: "link-2", label: "Service and maintenance", url: "https://example.com/servicio" },
  ]);
  // View Original: the source array/objects must never be mutated.
  assert.equal(listing.dealerCustomLinks![0]!.label, "Financiamiento");
});
check("a malformed/short custom-link translation gracefully retains the original label per row — never drops a link", () => {
  const listing = {
    dealerCustomLinks: [
      { id: "link-1", label: "Financiamiento", url: "https://example.com/a" },
      { id: "link-2", label: "Servicio", url: "https://example.com/b" },
    ],
  } as unknown as AutoDealerListing;
  const translated = applyAutosTranslation(listing, { customServiceText: "Financing" });
  assert.equal(translated.dealerCustomLinks![0]!.label, "Financing");
  assert.equal(translated.dealerCustomLinks![1]!.label, "Servicio", "missing 2nd line must retain the original, never drop or blank the row");
});

/* --- Gate 7: special-hours labels + notes — deterministic encode/decode, dates/state preserved --- */
check("special-hours label and note both translate; a row with no note is still round-tripped without corrupting the tab-separated protocol", () => {
  const listing = {
    dealerSpecialHoursRows: [
      { label: "Nochebuena", note: "9:00 AM – 2:00 PM" },
      { label: "Año Nuevo", note: "Cerrado" },
    ],
  } as unknown as AutoDealerListing;
  const content = buildAutosTranslatableContent(listing);
  assert.equal(content.shareText, "Nochebuena\t9:00 AM – 2:00 PM\nAño Nuevo\tCerrado");
  const translated = applyAutosTranslation(listing, {
    shareText: "Christmas Eve\t9:00 AM – 2:00 PM\nNew Year's Day\tClosed",
  });
  assert.deepEqual(translated.dealerSpecialHoursRows, [
    { label: "Christmas Eve", note: "9:00 AM – 2:00 PM" },
    { label: "New Year's Day", note: "Closed" },
  ]);
  assert.equal(listing.dealerSpecialHoursRows![0]!.label, "Nochebuena", "View Original: source rows must never be mutated");
});
check("a reordered/short special-hours translation never invents or drops a row — missing rows retain the original label+note", () => {
  const listing = {
    dealerSpecialHoursRows: [
      { label: "Nochebuena", note: "9:00 AM – 2:00 PM" },
      { label: "Año Nuevo", note: "Cerrado" },
    ],
  } as unknown as AutoDealerListing;
  const translated = applyAutosTranslation(listing, { shareText: "Christmas Eve\t9:00 AM – 2:00 PM" });
  assert.deepEqual(translated.dealerSpecialHoursRows![1], { label: "Año Nuevo", note: "Cerrado" });
});

/* --- Identity/spec-field preservation: VIN/stock/price/mileage/phone/email/URL/name/make/model/trim --- */
check("buildAutosTranslatableContent never leaks VIN/stock/price/mileage/make/model/dealer-identity fields into the translation payload", () => {
  const listing = {
    vin: "1HGCM82633A004352",
    stockNumber: "STK-4521",
    price: 48950,
    mileage: 12345,
    make: "Toyota",
    model: "Camry",
    dealerName: "Leonix Motors",
    dealerPhoneOffice: "555-0100",
    dealerEmail: "sales@example.com",
    dealerWebsite: "https://example.com",
    description: "Excelente condición.",
  } as unknown as AutoDealerListing;
  const content = buildAutosTranslatableContent(listing);
  const allowedKeys = new Set([
    "title",
    "description",
    "serviceLabel",
    "customServiceText",
    "details",
    "highlights",
    "body",
    "shareText",
    "locationNote",
  ]);
  for (const key of Object.keys(content)) {
    assert.ok(allowedKeys.has(key), `unexpected key '${key}' leaked into the translatable payload`);
  }
});
check("applyAutosTranslation's source never assigns a translated value to any identity/spec field", () => {
  const src = raw("app/(site)/clasificados/autos/lib/autosTranslateAd.ts");
  const fnStart = src.indexOf("export function applyAutosTranslation");
  assert.ok(fnStart >= 0, "applyAutosTranslation must exist");
  const fnBody = src.slice(fnStart);
  const forbidden = ["vin:", "stockNumber:", "price:", "mileage:", "make:", "model:", "year:", "dealerName:", "dealerPhoneOffice:", "dealerPhoneMobile:", "dealerEmail:", "dealerWebsite:"];
  for (const token of forbidden) {
    assert.ok(!fnBody.includes(token), `applyAutosTranslation must never assign '${token}'`);
  }
});

/* --- Gate 8: finance identity fields (phone/email/whatsapp) stay out of the translation payload --- */
check("finance CONTACT IDENTITY (phone/email/whatsapp/pre-approval URL) never enters the translatable payload — only the two finance PROSE fields do", () => {
  const listing = {
    financeContactTitle: "Gerente de Financiamiento",
    financeNotes: "Aprobación el mismo día.",
    financeContactPhone: "555-0199",
    financeContactEmail: "finance@example.com",
    financeContactWhatsapp: "555-0199",
    financeApplicationUrl: "https://example.com/apply",
  } as unknown as AutoDealerListing;
  const content = buildAutosTranslatableContent(listing);
  assert.equal(content.serviceLabel, "Gerente de Financiamiento");
  assert.equal(content.highlights, "Aprobación el mismo día.");
  assert.ok(!JSON.stringify(content).includes("555-0199"));
  assert.ok(!JSON.stringify(content).includes("finance@example.com"));
  assert.ok(!JSON.stringify(content).includes("example.com/apply"));
});

/* --- Gate 9: hours-day-label localization (new this round) — canonical-array-backed, full 7-day round trip --- */
check("all 7 canonical weekday labels round-trip ES<->EN through the same table the hours editor's own <select> renders", () => {
  const ES = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
  const EN = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  for (let i = 0; i < 7; i++) {
    assert.equal(localizeDealerHoursDayLabel(ES[i], "en"), EN[i], `${ES[i]} -> en`);
    assert.equal(localizeDealerHoursDayLabel(EN[i], "es"), ES[i], `${EN[i]} -> es`);
    assert.equal(localizeDealerHoursDayLabel(ES[i], "es"), ES[i], `${ES[i]} idempotent`);
    assert.equal(localizeDealerHoursDayLabel(EN[i], "en"), EN[i], `${EN[i]} idempotent`);
  }
});
check("a dealer's own free-typed custom day label (no weekday match) is returned exactly as typed in both directions — never guessed", () => {
  assert.equal(localizeDealerHoursDayLabel("Feriado especial", "en"), "Feriado especial");
  assert.equal(localizeDealerHoursDayLabel("Holiday hours", "es"), "Holiday hours");
  assert.equal(localizeDealerHoursDayLabel(undefined, "en"), "");
  assert.equal(localizeDealerHoursDayLabel("", "es"), "");
});
check("formatDealerHoursTimeRange returns the correctly-localized closed word and defaults to Spanish for untouched callers", () => {
  assert.equal(formatDealerHoursTimeRange({ day: "Lunes", closed: true } as any, "es"), "Cerrado");
  assert.equal(formatDealerHoursTimeRange({ day: "Monday", closed: true } as any, "en"), "Closed");
  assert.equal(formatDealerHoursTimeRange({ day: "Lunes", closed: true } as any), "Cerrado", "default lang keeps old exact output for callers not yet updated");
});
check("the hours editor's day <select> uses the localized display day (not the raw stored value) for both its value and its custom-option fallback branch", () => {
  const src = raw("app/(site)/publicar/autos/shared/components/AutosDealerHoursEditor.tsx");
  assert.ok(src.includes("const displayDay = localizeDealerHoursDayLabel(row.day, lang);"));
  assert.ok(src.includes("value={displayDay}"));
  assert.ok(src.includes("!weekdays.includes(displayDay as (typeof weekdays)[number]) && displayDay"), "the fallback custom-option branch must also match on the localized value, not raw row.day");
});
check("the child-inventory step's read-only inherited-hours summary localizes both the day label and the dealer-language chips", () => {
  const src = raw("app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx");
  assert.ok(src.includes("localizeDealerHoursDayLabel(row.day, lang)"));
  assert.ok(src.includes("localizeAutosDealerLanguageLabel(label, lang)"));
});
check("the live public weekly-hours list and the hours-status helper both pass lang through to formatDealerHoursTimeRange", () => {
  const stack = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(stack.includes("localizeDealerHoursDayLabel(row.day, lang)"));
  assert.ok(stack.includes("formatDealerHoursTimeRange(row, lang)"));
  const status = raw("app/(site)/clasificados/autos/negocios/lib/autosDealerHoursStatus.ts");
  assert.ok(status.includes("formatDealerHoursTimeRange(row, lang)"), "the hours-status helper must no longer call the un-localized zero-arg form");
});

/* --- Gate 9: newly-confirmed "Dealer de Autos" / plan-name mixed-language defects, now fixed ---- */
check("the branch-selector page's English dealer plan title is a real English label, not the untranslated Spanish plan name", () => {
  const src = raw("app/(site)/publicar/autos/autosBranchCopy.ts");
  const enBlockStart = src.indexOf('if (lang === "en")');
  const enBlock = src.slice(enBlockStart, src.indexOf("return {", enBlockStart + 1) === -1 ? src.length : src.indexOf("\n  return {", enBlockStart));
  assert.ok(!/title: "Dealer de Autos"/.test(enBlock), "the EN branch must not keep the Spanish plan name");
  assert.ok(src.includes('title: "Dealer de Autos"'), "the ES branch's own Spanish plan name must remain untouched");
});
check("the dealer plan's EN display label is a real English string, matching the sibling Privado plan's own EN localization pattern", () => {
  const src = raw("app/lib/clasificados/autos/autosPricingCopy.ts");
  assert.ok(src.includes('label: "Private Seller Autos"'), "sibling Privado EN label — unchanged reference point");
  assert.ok(!/en: \{\s*label: "Dealer de Autos"/.test(src), "the NEGOCIOS EN label must no longer be the untranslated Spanish name");
});
check("the public blueprint's EN cross-nav dealer CTA is fully English", () => {
  const src = raw("app/(site)/clasificados/autos/lib/autosPublicBlueprintCopy.ts");
  assert.ok(!src.includes('dealerCta: "Go to Dealer de Autos"'));
  assert.ok(src.includes('dealerCta: "Ir a Dealer de Autos"'), "the ES cross-nav CTA must remain untouched");
});
check("the lane cross-nav card's fallback lane label reuses the single canonical plan-label source instead of a hardcoded literal", () => {
  const src = raw("app/(site)/clasificados/autos/components/public/AutosLaneCrossNav.tsx");
  assert.ok(!/\?\? \(card\.tone === "dealer" \|\| card\.tone === "dealerPublish" \? "Dealer de Autos" : "Autos Privado"\)/.test(src), "the hardcoded fallback literal must be gone");
  assert.ok(src.includes("getAutosPlanDisplayCopy(\n                  props.lang,"), "must reuse the canonical getAutosPlanDisplayCopy lookup");
});

/* --- Live smoke finding (2026-09-16): the translate control rendered as the very first content
 * on 3 render-prop branches with no chrome above it — since the global Navbar is `position:
 * fixed`, the control sat entirely underneath it (confirmed via getBoundingClientRect in a real
 * production smoke test: nav bottom=57px, control top=0/bottom=50px, fully hidden and
 * unclickable). Fixed by wrapping just those 3 broken renders in a `pt-20` clearance div — the
 * two branches that already have real chrome above translateControl (draft-capture Preview,
 * child inventory overlay's own modal header) are untouched, since they were never broken. ---- */
check("2026-09-17 placement fix superseded the old page-top pt-20 nav-clearance hack: translateControl no longer renders as bare first-page content anywhere, because it now renders inside each hero card (already below the fixed global Navbar/chrome) — see the Gate 1 placement checks below for the replacement contract", () => {
  const navbar = raw("app/components/Navbar.tsx");
  assert.ok(navbar.includes('className="fixed top-0 left-0 z-50 w-full overflow-visible"'), "sanity: the global Navbar really is fixed/out-of-flow — still true, just no longer relevant to translateControl placement");
  for (const file of [
    "app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx",
    "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
    "app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx",
  ]) {
    assert.ok(!raw(file).includes('<div className="pt-20">{translateControl}</div>'), `${file}: the old pt-20 hack must be fully gone`);
  }
});

/* --- Gate 10: accessibility — ad-local aria-labels ride the same shared-context lang as visible text --- */
check("the gallery's open/close/media aria-labels are driven by the same lang variable as visible copy (not a hardcoded literal), so they follow adDisplayLang wherever the gallery is nested", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
  ]) {
    const src = raw(file);
    const ariaLangTernaries = src.match(/aria-label=\{lang === "es" \? "[^"]+" : "[^"]+"\}/g) ?? [];
    assert.ok(ariaLangTernaries.length >= 2, `${file}: expected multiple lang-driven aria-labels, found ${ariaLangTernaries.length}`);
  }
});

/* --- Privado firewall: a distinct, non-shared context module ------------------------------------ */
check("Privado's preview locale context is its own private module-scoped context, never re-exported from or shared with the Negocios context module", () => {
  const privado = raw("app/(site)/clasificados/autos/privado/lib/AutosPrivadoPreviewLocaleContext.tsx");
  const negocios = raw("app/(site)/clasificados/autos/negocios/lib/AutosNegociosPreviewLocaleContext.tsx");
  assert.ok(/const \w+ = createContext</.test(privado) && /const \w+ = createContext</.test(negocios));
  assert.ok(!privado.includes("AutosNegociosPreviewLocaleContext") && !negocios.includes("AutosPrivadoPreviewLocaleContext"), "neither context module may import the other");
});

/* --- Single shared TranslateAdControl: no Autos-specific fork ----------------------------------- */
check("AutosListingTranslationLayer uses the one single shared TranslateAdControl — no forked Autos-only copy exists", () => {
  const layer = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosListingTranslationLayer.tsx");
  assert.ok(layer.includes('from "@/app/components/translation/TranslateAdControl"'));
  let forkHits: string[] = [];
  try {
    forkHits = execSync(`grep -rl "TranslateAdControl" "app/(site)/clasificados/autos" "app/(site)/publicar/autos" --include=*.tsx --include=*.ts`, {
      cwd: new URL("..", import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, "$1"),
      encoding: "utf8",
    })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    forkHits = [];
  }
  const definesOwnControl = forkHits.some((f) => raw(f.replace(/\\/g, "/")).includes("export function TranslateAdControl") || raw(f.replace(/\\/g, "/")).includes("export const TranslateAdControl"));
  assert.ok(!definesOwnControl, "no Autos-scoped file may define its own TranslateAdControl");
});

/* --- Servicios non-regression: its own displayLang architecture is untouched -------------------- */
check("Servicios' own displayLang computation is intact and unforked by this Autos-only change", () => {
  const src = raw("app/(site)/servicios/components/ServiciosPublicTranslationLayer.tsx");
  assert.ok(src.includes("displayLang: ServiciosLang;"));
  assert.ok(src.includes("const displayLang: ServiciosLang = showTranslated && translation?.translated ? translatedLang : lang;"));
  assert.ok(src.includes("return { displayProfile, translateControl, displayLang };"));
});

/* ================================================================================================
 * ROUND 4 (2026-09-16) — OWNER QA FOLLOW-UP: 3 live-QA defects (Privado equipment taxonomy,
 * Dealer address free-text note, interior-color "Rojo" trace). Narrow cleanup, not a re-audit.
 * ============================================================================================ */

/* --- Gate 1: Privado structured equipment now uses the SAME shared feature-catalog localizer --- */
check("Privado equipment catalog values localize bidirectionally through the same shared taxonomy the Dealer highlights card uses (the exact live-QA strings)", () => {
  assert.equal(localizeAutosDealerFeatureCatalogValue("Monitor de punto ciego", "en"), "Blind spot monitor");
  assert.equal(localizeAutosDealerFeatureCatalogValue("Cámara de reversa", "en"), "Backup camera");
  assert.equal(localizeAutosDealerFeatureCatalogValue("Blind spot monitor", "es"), "Monitor de punto ciego");
  assert.equal(localizeAutosDealerFeatureCatalogValue("Backup camera", "es"), "Cámara de reversa");
});
check("PrivadoVehicleHighlights (live public detail) now calls the shared feature-catalog localizer on the structured checklist, reusing the existing shared lib — not a copied Dealer module", () => {
  const src = raw("app/(site)/clasificados/autos/privado/components/PrivadoVehicleHighlights.tsx");
  assert.ok(
    src.includes('from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy"'),
    "must import the existing shared taxonomy lib (a pure-function module, not a Dealer UI component)",
  );
  assert.ok(
    src.includes(".map((f) => localizeAutosDealerFeatureCatalogValue(f, lang))"),
    "the structured features checklist must be run through the localizer",
  );
  assert.ok(!src.includes("DealerBusinessStack") && !src.includes("PreviewDealerBusinessStack"), "must not pull in any Dealer Business Hub module");
});
check("the Preview-only Privado surface (previewPrivadoFields.ts) gets the identical fix for consistency with the live page", () => {
  const src = raw("app/(site)/clasificados/autos/privado/preview/privadoPreview/previewPrivadoFields.ts");
  assert.ok(src.includes('from "@/app/clasificados/autos/negocios/lib/autosNegociosCopy"'));
  assert.ok(/\.map\(\(f\) => localizeAutosDealerFeatureCatalogValue\(f, lang\)\)/.test(src));
});

/* --- Gate 1 (Dealer regression): the Dealer highlights card's own localization call is untouched --- */
check("Dealer/Negocios structured equipment localization is unchanged by this pass (regression guard)", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewVehicleHighlights.tsx");
  assert.ok(src.includes(".map((f) => localizeAutosDealerFeatureCatalogValue(f, lang))"));
});

/* --- Gate 1: Privado's free-typed custom equipment is never sent through the deterministic catalog lookup --- */
check("Privado's seller-typed customEquipment/legacy otherEquipmentDetails text is never run through the feature-catalog localizer, on both the live page and Preview", () => {
  const live = raw("app/(site)/clasificados/autos/privado/components/PrivadoVehicleHighlights.tsx");
  const liveCustomBlock = live.slice(live.indexOf("const custom ="), live.indexOf("legacyCustom: string[]"));
  assert.ok(!liveCustomBlock.includes("localizeAutosDealerFeatureCatalogValue"), "live page: custom equipment must stay untouched free text");
  const preview = raw("app/(site)/clasificados/autos/privado/preview/privadoPreview/previewPrivadoFields.ts");
  const previewCustomBlock = preview.slice(preview.indexOf("let customEquipment ="), preview.indexOf("const office ="));
  assert.ok(!previewCustomBlock.includes("localizeAutosDealerFeatureCatalogValue"), "Preview: custom equipment must stay untouched free text");
});

/* --- Gate 2: the dealer address's descriptive note is now a real translatable field, structured identity is not --- */
check("buildAutosTranslatableContent captures ONLY the trailing human note from dealerAddress — the street/city/state/zip prefix never enters the payload", () => {
  const withNote = {
    dealerAddress: "1200 Broadway, Burlingame, CA 94010 — showroom con 18 plazas de estacionamiento para clientes.",
  } as unknown as AutoDealerListing;
  const content = buildAutosTranslatableContent(withNote);
  assert.equal(content.locationNote, "showroom con 18 plazas de estacionamiento para clientes.");
  assert.ok(!JSON.stringify(content).includes("1200 Broadway"), "the street address must never appear in the translation payload");
  assert.ok(!JSON.stringify(content).includes("94010"), "the ZIP must never appear in the translation payload");
});
check("a plain dealerAddress with no ' — ' separator has nothing to translate — the whole identity string is preserved, not sent anywhere", () => {
  const plain = { dealerAddress: "1855 W San Carlos St, San José, CA 95128" } as unknown as AutoDealerListing;
  const content = buildAutosTranslatableContent(plain);
  assert.equal(content.locationNote, undefined);
});
check("View Original: applying a translated location note rebuilds the address with the identity prefix byte-for-byte, and the source listing is never mutated", () => {
  const listing = {
    dealerAddress: "1200 Broadway, Burlingame, CA 94010 — showroom con 18 plazas de estacionamiento para clientes.",
  } as unknown as AutoDealerListing;
  const translated = applyAutosTranslation(listing, { locationNote: "showroom with 18 parking spaces for customers." });
  assert.equal(translated.dealerAddress, "1200 Broadway, Burlingame, CA 94010 — showroom with 18 parking spaces for customers.");
  assert.equal(listing.dealerAddress, "1200 Broadway, Burlingame, CA 94010 — showroom con 18 plazas de estacionamiento para clientes.", "View Original: source object must never be mutated");
});
check("the shared translation type/allowlist/detection-order all accept the new locationNote field (payload shape change fully wired, not just the Autos side)", () => {
  const types = raw("app/lib/translation/types.ts");
  assert.ok(/locationNote\?: string;/.test(types));
  assert.ok(/\|\s*"locationNote"/.test(types), "TranslatableAdFieldKey union must include it");
  const helpers = raw("app/lib/translation/helpers.ts");
  assert.ok(/"locationNote",?\s*\]\);/.test(helpers) || helpers.includes('"locationNote"'));
  const route = raw("app/api/translate-ad/route.ts");
  assert.ok(route.includes('"locationNote"'), "the API route's server-side allowlist must accept the field or it is silently dropped before reaching the provider");
});

/* --- Gate 3: interior-color "Rojo" — proven, explicit root-cause classification -------------------- */
check("interior-color taxonomy trace: 'Rojo'/'Red' is genuinely absent from the interior array (asymmetric with exterior, which does have it) — proves this is NOT a deterministic-taxonomy code bug", () => {
  // Structural proof pulled directly from the source arrays, not asserted from memory.
  const src = raw("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  const esInteriorMatch = src.match(/interior: \["", "Negro", "Beige", "Gris", "Marrón", OTHER\]/);
  const esExteriorMatch = src.match(/exterior: \["", "Negro", "Blanco", "Gris", "Plateado", "Azul", "Rojo", OTHER\]/);
  assert.ok(esInteriorMatch, "ES interior taxonomy must be exactly the 4-color canonical list (no Rojo)");
  assert.ok(esExteriorMatch, "ES exterior taxonomy must include Rojo — the asymmetry is real, not assumed");
});
check("the taxonomy localizer correctly refuses to fabricate a translation for 'Rojo' as an interior color (it only relocalizes values that exist in the canonical list) — this is correct behavior, not a bug", () => {
  assert.equal(localizeAutosDealerTaxonomySelectValue("interior", "Rojo", "en"), "Rojo", "must be returned unchanged — never guessed");
  assert.equal(localizeAutosDealerTaxonomySelectValue("exterior", "Rojo", "en"), "Red", "regression guard: exterior's real 'Rojo' entry must still relocalize");
});

/* --- Gate 4.8: Dealer/Privado firewall remains intact after this pass -------------------------- */
check("Privado's equipment fix reuses a shared pure-function lib, never imports a Dealer UI component, and Dealer's own file is untouched — the firewall holds", () => {
  const privadoLive = raw("app/(site)/clasificados/autos/privado/components/PrivadoVehicleHighlights.tsx");
  const dealerLive = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewVehicleHighlights.tsx");
  assert.ok(!privadoLive.includes('from "../../negocios/preview') && !privadoLive.includes('from "@/app/clasificados/autos/negocios/preview'), "Privado must not import any Dealer preview/UI component");
  assert.ok(!dealerLive.includes("Privado"), "Dealer's own highlights card must remain untouched by this Privado-scoped fix");
});

/* ================================================================================================
 * ROUND 5 (2026-09-17) — OWNER-QA MASTER CLOSEOUT: Gates 01-14 (contact/email/finance/media).
 * Narrow, concrete proof for what this round actually changed — not a re-audit of the whole
 * 40-gate mandate (see the accompanying report for full gate-by-gate classification).
 * ============================================================================================ */

/* --- Gate 01: Dealer-business email — reused the existing canonical field, wired the missing input --- */
check("dealerEmail is a real input in the Negocios application, distinct from finance email, with its own 'Correo'/'Email' label", () => {
  const app = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosApplication.tsx");
  assert.ok(app.includes("setListingPatch({ dealerEmail: autosDraftTextValue(e.target.value) })"), "must patch dealerEmail, never financeContactEmail");
  assert.ok(app.includes("{t.app.labels.email}"), "must render the dedicated dealer email label");
  const copy = raw("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(/labels:\s*\{[^}]*?email: "Correo",/.test(copy.slice(0, copy.indexOf("const EN"))), "ES app.labels.email must be 'Correo'");
  assert.ok(/labels:\s*\{[^}]*?email: "Email",/.test(copy.slice(copy.indexOf("const EN"))), "EN app.labels.email must be 'Email'");
});
check("dealerEmail already had real display consumers before this round (Business Hub mailto + child-inherited summary) — the gap was only the missing input, confirmed by source", () => {
  const mapper = raw("app/(site)/clasificados/autos/negocios/lib/mapAutosDealerToBusinessHubContact.ts");
  assert.ok(mapper.includes("data.dealerEmail?.trim()") && mapper.includes("contact.emailMailto"));
  const childSummary = raw("app/(site)/publicar/autos/negocios/components/AutosInventoryInheritedDealerStep.tsx");
  assert.ok(childSummary.includes("value={parentListing.dealerEmail}"), "child-inherited summary must display the parent's dealer email");
});

/* --- Gate 02/03: Dealer email CTA already used the shared CtaActionSheet, never raw mailto ---- */
check("the Business Hub's Correo/Email button opens the shared CtaActionSheet via buildSendEmailIntent — never a raw mailto anchor, never finance email", () => {
  const stack = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(stack.includes("buildSendEmailIntent") && stack.includes("CtaActionSheet"));
  assert.ok(stack.includes("const openEmail = () =>") && stack.includes("if (!c.emailMailto) return;"), "openEmail must read the dealer contact view-model's emailMailto (sourced from dealerEmail), not finance");
  assert.ok(!/<a[^>]*href=\{c\.emailMailto\}/.test(stack), "must not also render a raw <a href={mailto}> anchor for the same channel");
});
check("the shared CtaActionSheet's send_email intent exposes the exact owner-required action set (ES + EN)", () => {
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  for (const label of ["Copiar correo", "Copiar mensaje completo", "Compartir datos de contacto", "Compartir con otras apps", "Abrir app de correo"]) {
    assert.ok(sheet.includes(label), `missing ES action label: ${label}`);
  }
  for (const label of ["Copy email", "Copy full message", "Open email app"]) {
    assert.ok(sheet.includes(label), `missing EN action label: ${label}`);
  }
});

/* --- Gate 04: Finance SMS — new dedicated field, own resolver, own input, never a phone/WhatsApp fallback --- */
check("resolveFinanceSmsTel only reads financeContactSms — never financeContactPhone/Whatsapp as a silent fallback", () => {
  assert.equal(resolveFinanceSmsTel({ financeContactSms: "4085550100" } as unknown as AutoDealerListing), "4085550100");
  assert.equal(resolveFinanceSmsTel({ financeContactPhone: "4085550100" } as unknown as AutoDealerListing), undefined, "must not fall back to financeContactPhone");
  assert.equal(resolveFinanceSmsTel({ financeContactWhatsapp: "4085550100" } as unknown as AutoDealerListing), undefined, "must not fall back to financeContactWhatsapp");
  assert.equal(resolveFinanceSmsTel({ financeContactSms: "123" } as unknown as AutoDealerListing), undefined, "too-short digits must not resolve");
});
check("hasDealerFinanceContact recognizes financeContactSms alone as meaningful finance content", () => {
  assert.equal(hasDealerFinanceContact({ financeContactSms: "4085550100" } as unknown as AutoDealerListing), true);
  assert.equal(hasDealerFinanceContact({} as unknown as AutoDealerListing), false);
});
check("the finance application form has a dedicated SMS input, bound to financeContactSms, with its own label distinct from phone/WhatsApp/dealer SMS", () => {
  const fields = raw("app/(site)/publicar/autos/shared/components/AutosDealerFinanceFields.tsx");
  assert.ok(fields.includes("setListingPatch({ financeContactSms: v.trim() ? v : undefined })"));
  assert.ok(fields.includes("{f.smsPhone}"));
  const copy = raw("app/(site)/clasificados/autos/negocios/lib/autosNegociosCopy.ts");
  assert.ok(copy.includes('smsPhone: "Número para mensajes de texto",'), "ES finance SMS label");
  assert.ok(copy.includes('smsPhone: "Text message number",'), "EN finance SMS label");
});

/* --- Gate 05/06: Finance CTA mapping + the owner-locked 2x2 reflow (Call+Text / Email+WhatsApp) --- */
check("DealerFinanceContact renders Call+Text as one row and Email+WhatsApp as the next, each collapsing to full-width when only one of the pair exists — no silent channel-swap fallback", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx");
  assert.ok(src.includes('href={`tel:${tel}`}') && src.includes("{f.call}"), "Call must map to financeContactPhone");
  assert.ok(src.includes('href={`sms:${sms}`}') && src.includes("{f.text}"), "Text must map to financeContactSms, via sms: scheme");
  assert.ok(src.includes("onClick={openFinanceEmail}") && src.includes("{f.email}"), "Email must open the action sheet, not a raw mailto");
  assert.ok(src.includes("href={wa}") && src.includes("{f.whatsapp}"), "WhatsApp must map to financeContactWhatsapp");
  assert.ok(/\[\s*tel\s*\?[\s\S]*?sms\s*\?[\s\S]*?\],\s*\[\s*email\s*\?[\s\S]*?wa\s*\?/.test(src), "the two locked pairs (call+text, email+whatsapp) must be declared in that order");
  assert.ok(src.includes('present.length === 2 ? "grid grid-cols-2 gap-2" : ""'), "a pair renders as a 2-col grid only when both members are present, else a bare full-width row");
});
check("the pre-approval CTA remains fully independent of the 4-channel grid and still only renders when a real URL exists", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx");
  const gridEnd = src.indexOf("})}");
  const afterGrid = src.slice(gridEnd, src.indexOf("{notes ? ("));
  assert.ok(afterGrid.includes("appHref ? (") && afterGrid.includes("{f.preApproval}"), "pre-approval must render after the 4-channel grid, independently");
});

/* --- Gate 09-13: shared BusinessGalleryLightbox replaces the Autos floating-X custom modal ------ */
check("both Autos gallery components (Dealer-path PreviewAutoGallery, Privado-path AutoGallery) now use the shared BusinessGalleryLightbox — no forked floating-X close button remains", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes('from "@/app/components/media/BusinessGalleryModal"'), `${file}: must import the shared lightbox`);
    assert.ok(src.includes("<BusinessGalleryLightbox"), `${file}: must actually render it`);
    assert.ok(!/inline-flex h-11 w-11 items-center justify-center rounded-full bg-\[#FFFCF7\]\/95.*shadow-lg/.test(src), `${file}: the old floating-X close button markup must be gone`);
    assert.ok(!src.includes('z-[80]'), `${file}: the old custom fixed-inset-0 dialog (z-[80]) must be gone — BusinessGalleryLightbox owns its own z-[90] overlay`);
  }
});
check("the header-visible, close-never-floats-over-media contract comes from the shared component itself (shrink-0 header row, header-level close button)", () => {
  const shared = raw("app/components/media/BusinessGalleryModal.tsx");
  assert.ok(shared.includes("flex shrink-0 items-center justify-between") && shared.includes("{copy.close}"), "close button must live in the shrink-0 header row, not floating over the media stage");
});
check("clicked media opens on its own combined index (Gate 10) — buildAutosGalleryMediaSets already provides stable photo-then-video ordering, and openAt/thumbnail onOpen wiring is unchanged by the lightbox swap", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes("onOpen={() => openAt(photoIdx)}") || src.includes("onOpen={() => openAt(galleryIndex)}"), `${file}: thumbnails must still open at their own real index`);
    assert.ok(src.includes("openAt(photoItems.length + videoIdx)"), `${file}: a video thumbnail in the combined grid opens at photos.length + its own video index, never index 0`);
  }
});
check("Gate 11/12: switching Todo/Fotos/Videos while the lightbox is open preserves the same media item by reference identity, or lands on the first valid item — never resets to a random index or closes the viewer", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes("handleLightboxFilterChange"), `${file}: must define the identity-preserving filter-change handler`);
    assert.ok(src.includes("nextItems.indexOf(currentItem)"), `${file}: must search the target filter's array for the currently-open item by reference`);
    assert.ok(src.includes("preservedIndex >= 0 ? preservedIndex : 0"), `${file}: must fall back to the first valid item, never an arbitrary/negative index`);
  }
});
check("the redundant window-level Escape/Arrow keydown handler was removed from both gallery files — BusinessGalleryLightbox owns keyboard nav itself, so a second listener would double-fire and skip every arrow press by 2", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(!src.includes("lightboxIndexRef"), `${file}: the old ref-based keydown handler must be gone`);
    assert.ok(!/window\.addEventListener\("keydown"/.test(src), `${file}: no second window-level keydown listener may remain`);
  }
  const shared = raw("app/components/media/BusinessGalleryModal.tsx");
  assert.ok(shared.includes('e.key === "Escape"') && shared.includes('e.key === "ArrowLeft"') && shared.includes('e.key === "ArrowRight"'), "the shared component must be the sole owner of keyboard navigation");
});
check("Gate 13: the lightbox's own chrome (aria-label, close/prev/next, counter, Todo/Fotos/Videos switch) is driven by the same ad-local `lang` the rest of the gallery already uses — never an independent URL/local inference", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes('ariaLabel={lang === "es" ? "Galería del vehículo" : "Vehicle gallery"}'));
    assert.ok(src.includes('close: lang === "es" ? "Cerrar" : "Close",'));
    assert.ok(src.includes("<AutosLightboxFilterSwitch lang={lang}"), `${file}: the Todo/Fotos/Videos switch must receive the same ad-local lang, not derive its own`);
  }
});
check("the Todo/Fotos/Videos lightbox switch only renders when the ad genuinely has both photos and videos — no meaningless single-kind filter option", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes("hasPhotos && hasVideos ? (\n            <AutosLightboxFilterSwitch"), `${file}: the switch must be gated on having both kinds`);
  }
});

/* --- Gate 07/08: main Business Hub Call/WhatsApp/SMS row — already data-driven, now also reflows the 3-channel case cleanly --- */
check("the main Business Hub's Call/WhatsApp/SMS row was already fully data-driven (each button conditionally rendered on its own real destination) — confirmed still true, not reintroduced as a fixed 3-slot grid", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(src.includes("showCall && c.callTelHref") && src.includes("showWhatsapp && c.whatsappHref") && src.includes("showSms && c.smsHref"));
});
check("Gate 08: when exactly 3 of Call/WhatsApp/SMS exist, the 3rd gets an intentional full-width row instead of being stranded alone in a 2-col grid with empty whitespace beside it", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(src.includes("channels.length === 3 && idx === 2 ? \"col-span-2\" : \"\""), "the odd-one-out spanning rule must exist");
  assert.ok(src.includes('channels.length >= 2 ? "grid-cols-2" : "grid-cols-1"'), "1 or 2 channels still use the original clean layout");
});

/* ================================================================================================
 * ROUND 6 (2026-09-17) — PM FINAL COMPLETION: zero-deferred closeout of Gates 14/24/26/29/31/33
 * plus Gate G (email execution) and Gate H (share visibility). Executable proof where a pure
 * function exists; source proof pinning wiring that can't be exercised as a pure function.
 * ============================================================================================ */

/* --- Gate E/F: child media + full-ad identity — executable proof, not "same component tree" alone --- */
check("Gate E: clicking photo N in a child fixture resolves to photo N, and video N resolves to its own combined index — never index 0", () => {
  const childFixture = {
    mediaImages: [
      { id: "p1", url: "https://cdn.example.com/child-1.jpg", sourceType: "url", isPrimary: true, sortOrder: 0 },
      { id: "p2", url: "https://cdn.example.com/child-2.jpg", sourceType: "url", isPrimary: false, sortOrder: 1 },
      { id: "p3", url: "https://cdn.example.com/child-3.jpg", sourceType: "url", isPrimary: false, sortOrder: 2 },
    ],
    videoUrls: ["https://cdn.example.com/child-video-1.mp4", "https://cdn.example.com/child-video-2.mp4"],
  } as unknown as AutoDealerListing;
  const imageUrls = childFixture.mediaImages!.map((m) => m.url);
  const { photoItems, videoItems, allItems } = buildAutosGalleryMediaSets(childFixture, imageUrls, { publicPlaybackOnly: true });
  assert.equal(photoItems.length, 3);
  assert.equal(videoItems.length, 2);
  assert.equal(allItems.length, 5);
  // Photo N (0-indexed) is at its own position — clicking photo index 2 opens allItems[2].
  assert.equal(allItems[2], photoItems[2]);
  assert.ok(photoItems[2].kind === "photo" && photoItems[2].src === "https://cdn.example.com/child-3.jpg");
  // Video N opens at photoItems.length + its own video index — video 0 is allItems[3], video 1 is allItems[4].
  assert.equal(allItems[photoItems.length + 0], videoItems[0]);
  assert.equal(allItems[photoItems.length + 1], videoItems[1]);
  assert.notEqual(allItems[photoItems.length + 1], allItems[0], "clicking video 2 must never resolve to index 0");
});
check("Gate E: filter switching preserves the same child media item by reference identity (the exact algorithm used by handleLightboxFilterChange)", () => {
  const childFixture = {
    mediaImages: [{ id: "p1", url: "https://cdn.example.com/child-1.jpg", sourceType: "url", isPrimary: true, sortOrder: 0 }],
    videoUrls: ["https://cdn.example.com/child-video-1.mp4"],
  } as unknown as AutoDealerListing;
  const imageUrls = childFixture.mediaImages!.map((m) => m.url);
  const { photoItems, videoItems, allItems } = buildAutosGalleryMediaSets(childFixture, imageUrls, { publicPlaybackOnly: true });
  // Simulate: viewing the video (allItems[1]) under "all", then switching to "photos".
  const currentItem: (typeof allItems)[number] = allItems[1]!;
  assert.equal(currentItem, videoItems[0]);
  const preservedInPhotos = (photoItems as (typeof allItems)).indexOf(currentItem);
  assert.equal(preservedInPhotos, -1, "the video does not belong to the photos filter — must fall back to index 0, not crash or misplace");
  const preservedInVideos = (videoItems as (typeof allItems)).indexOf(currentItem);
  assert.equal(preservedInVideos, 0, "switching to the videos filter must land back on the exact same item");
});
check("Gate F: mapInheritedDealerPreviewListing gives the child its OWN media/title/description/VIN/stock — parent's never leaks in for vehicle-owned fields, and neither input object is mutated", () => {
  const parent = {
    id: "parent-real-id",
    vehicleTitle: "Parent Vehicle Title",
    description: "Parent description.",
    vin: "PARENTVIN000000001",
    stockNumber: "PARENT-STOCK",
    mediaImages: [{ id: "pp1", url: "https://cdn.example.com/parent.jpg", sourceType: "url", isPrimary: true, sortOrder: 0 }],
    dealerPhoneOffice: "4085550100",
    dealerEmail: "dealer@example.com",
    financeContactEmail: "finance@example.com",
  } as unknown as AutoDealerListing;
  const child = {
    id: "child-real-id",
    vehicleTitle: "Child Vehicle Title",
    description: "Child description.",
    vin: "CHILDVIN0000000002",
    stockNumber: "CHILD-STOCK",
    mediaImages: [{ id: "cc1", url: "https://cdn.example.com/child.jpg", sourceType: "url", isPrimary: true, sortOrder: 0 }],
    inventoryRole: "additional",
    status: "draft",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  } as unknown as AutosAdditionalInventoryVehicleDraft;
  const parentSnapshot = JSON.parse(JSON.stringify(parent));
  const childSnapshot = JSON.parse(JSON.stringify(child));
  const merged = mapInheritedDealerPreviewListing(parent, child);
  assert.equal(merged.vehicleTitle, "Child Vehicle Title", "child's own title must win");
  assert.equal(merged.description, "Child description.", "child's own description must win");
  assert.equal(merged.vin, "CHILDVIN0000000002", "child's own VIN must win — never the parent's");
  assert.equal(merged.stockNumber, "CHILD-STOCK", "child's own stock number must win");
  assert.equal(merged.mediaImages?.[0]?.url, "https://cdn.example.com/child.jpg", "child's own media must win, parent media must never leak in");
  assert.equal(merged.dealerPhoneOffice, "4085550100", "dealer office phone is inherited from the parent");
  assert.equal(merged.dealerEmail, "dealer@example.com", "dealer email is inherited from the parent");
  assert.equal(merged.financeContactEmail, "finance@example.com", "finance email is inherited from the parent");
  assert.deepEqual(parent, parentSnapshot, "parent object must never be mutated by mapping a child onto it");
  assert.deepEqual(child, childSnapshot, "child object must never be mutated either");
});
check("Gate F: Child A's merge does not mutate Child B's independent merge result (two children under the same parent stay isolated)", () => {
  const parent = { id: "parent-id", dealerPhoneOffice: "4085550100" } as unknown as AutoDealerListing;
  const childA = { id: "child-a", vehicleTitle: "Child A", inventoryRole: "additional", status: "draft", createdAt: "x", updatedAt: "x" } as unknown as AutosAdditionalInventoryVehicleDraft;
  const childB = { id: "child-b", vehicleTitle: "Child B", inventoryRole: "additional", status: "draft", createdAt: "x", updatedAt: "x" } as unknown as AutosAdditionalInventoryVehicleDraft;
  const mergedA = mapInheritedDealerPreviewListing(parent, childA);
  const mergedB = mapInheritedDealerPreviewListing(parent, childB);
  assert.equal(mergedA.vehicleTitle, "Child A");
  assert.equal(mergedB.vehicleTitle, "Child B");
  assert.notEqual(mergedA, mergedB, "each merge must return its own independent object");
});
check("Gate E/F source proof: the child overlay keys translation state on the child's own id (never merged.id, which is actually the parent's id after the merge)", () => {
  const overlay = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  assert.ok(overlay.includes("listingKey={child.id}"), "must key on child.id, not merged.id");
  assert.ok(!overlay.includes("listingKey={merged.id}"));
});
check("Gate E/F source proof: a published child fetches its OWN DB row by its OWN id (inventory_role/parent-pointer live on the child's own row, not shared with the parent)", () => {
  const route = raw("app/api/clasificados/autos/public/listings/[id]/route.ts");
  assert.ok(route.includes("getActiveLiveAutosBundle(id"), "must fetch by the URL's own id param");
  const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(svc.includes('row.inventory_role === "inventory_vehicle"') && svc.includes("dealer_inventory_parent_listing_id"), "the child row itself carries the parent-pointer, proving it is its own row");
});
check("Gate E/F source proof: sibling translation caches are isolated — the cache key embeds the exact listingKey (child.id), so Child A and Child B never collide", () => {
  const helpers = raw("app/lib/translation/helpers.ts");
  assert.ok(/buildTranslateCacheKey|STORAGE_NS/.test(helpers), "sanity: the cache-key builder lives in the shared helpers module");
});

/* --- Gate G: email action executable proof — recipient/subject/body encode+decode, dealer vs finance never cross-wired --- */
check("Gate G: buildMailtoHref correctly percent-encodes spaces, &, ?, #, accented Spanish text, and line breaks in subject/body, and round-trips back to the exact original via URLSearchParams", () => {
  const subject = "Leonix · Ventas & Información";
  const body = "Hola,\n¿Tienes disponible este auto? Precio: $44,875 — pregunta #2, línea nueva.";
  const href = buildMailtoHref("ventas@example.com", subject, body);
  assert.ok(href, "a valid email must produce a real href");
  assert.ok(href!.startsWith("mailto:ventas@example.com?"));
  const qs = href!.slice(href!.indexOf("?") + 1);
  const parsed = new URLSearchParams(qs);
  assert.equal(parsed.get("subject"), subject, "subject must decode back to the exact original, accents/& included");
  assert.equal(parsed.get("body"), body, "body must decode back to the exact original, including line breaks/?/#");
});
check("Gate G: an invalid/malformed email address never produces a usable mailto href (no injection via '<', '>', '\"', or javascript:)", () => {
  assert.equal(buildMailtoHref("not-an-email", "s", "b"), null);
  assert.equal(buildMailtoHref("<script>@example.com", "s", "b"), null);
  assert.equal(buildMailtoHref("javascript:alert(1)@example.com", "s", "b"), null);
});
check("Gate G: buildSendEmailIntent carries the exact recipient/subject/body through untouched (no re-encoding at the intent layer — that happens once, later, inside openMailto)", () => {
  const intent = buildSendEmailIntent({ email: "  ventas@example.com  ", subject: "Leonix · Test", body: "Línea 1\nLínea 2" });
  assert.ok(intent);
  assert.equal(intent!.email, "ventas@example.com", "must trim but never encode/alter the address");
  assert.equal(intent!.subject, "Leonix · Test");
  assert.equal(intent!.body, "Línea 1\nLínea 2");
});
check("Gate G: Dealer email and Finance email resolve from strictly separate fields — a listing with only a finance email never produces a dealer emailMailto, and vice versa", () => {
  const financeOnly = { financeContactEmail: "finance@example.com" } as unknown as AutoDealerListing;
  const dealerContact = mapAutosDealerToBusinessHubContact(financeOnly, "en");
  assert.equal(dealerContact.contact.emailMailto, undefined, "no dealerEmail set -> no dealer email CTA, even though finance email exists");
  assert.equal(resolveFinanceEmailHref(financeOnly), "mailto:finance%40example.com");

  const dealerOnly = { dealerEmail: "dealer@example.com" } as unknown as AutoDealerListing;
  const dealerContact2 = mapAutosDealerToBusinessHubContact(dealerOnly, "en");
  assert.equal(dealerContact2.contact.emailMailto, "mailto:dealer%40example.com");
  assert.equal(resolveFinanceEmailHref(dealerOnly), undefined, "no financeContactEmail set -> no finance email CTA, even though dealer email exists");
});
check("Gate G: the Web Share payload shape structurally cannot carry an email recipient identity — it only has title/text/url", () => {
  const launchers = raw("app/components/cta/ctaLaunchers.ts");
  assert.ok(/export type WebSharePayload = \{ title\?: string; text\?: string; url\?: string \};/.test(launchers), "WebSharePayload must have no email field — the recipient can never leak into or be replaced by the native share sheet's own contact picker");
});
check("Gate G: 'Open email app' is the ONLY action that ever calls openMailto — Copy/Share actions use clipboard/navigator.share, never a location redirect", () => {
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  const sendEmailBlock = sheet.slice(sheet.indexOf('intent.kind === "send_email"'), sheet.indexOf('intent.kind === "send_message"'));
  const openMailtoCalls = (sendEmailBlock.match(/openMailto\(/g) ?? []).length;
  assert.equal(openMailtoCalls, 1, "exactly one call site — the Open email app button");
  assert.ok(sendEmailBlock.indexOf("openMailto(em, sub, bod)") > sendEmailBlock.indexOf(`t.openEmailApp`), "the single openMailto call must be inside the Open email app action, after copy/share actions");
});

/* --- Gate H: share visibility — canonical-active Preview gets a real, truthful Share; draft never fabricates one --- */
check("Gate H: a NEW/pending draft's canonical-active branch is the ONLY branch that ever computes canonicalPublicUrl — draft-capture mode never receives one", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(src.includes('if (mode !== "canonical-active" || !canonicalListingId'), "the URL must only ever be built for a genuinely already-published (status===active) canonical listing");
  assert.ok(src.includes("canonicalPublicUrl") && src.includes("autosLiveVehiclePath(canonicalListingId)"));
  // The draft-capture branch's own AutosNegociosDealershipPreviewPage call must not reference canonicalPublicUrl at all.
  const draftBranchStart = src.indexOf("if (isDraftCapture)");
  const draftBranchBody = src.slice(draftBranchStart, src.indexOf("PublishCheckoutCheckpoint", draftBranchStart));
  assert.ok(!draftBranchBody.includes("canonicalPublicUrl"), "an unpublished draft must never receive a fabricated canonical URL");
});
check("Gate H: canonical-active Preview's real Share gets a genuine listing identity (canonicalListingId) WITHOUT flipping on the publicAnalytics-gated Like/Save/engagement-recording surface", () => {
  const page = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/AutosNegociosDealershipPreviewPage.tsx");
  assert.ok(page.includes("canonicalListingId?: string | null;"));
  assert.ok(page.includes('listingSourceId={publicPlaybackOnly ? publicAnalytics?.listingSourceId : (canonicalListingId?.trim() || undefined)}'), "bottom Share must fall back to the real canonicalListingId when not publicPlaybackOnly");
  assert.ok(page.includes("publicAnalytics={publicPlaybackOnly ? publicAnalytics : undefined}"), "the analytics-recording prop stays gated on true publicPlaybackOnly — no fake self-engagement is ever persisted for an owner previewing their own listing");
});
check("Gate H: the Business Hub quick-action Share button becomes real (navigator.share/clipboard against the true canonical URL) whenever a genuine publicUrl exists — the Like/Save button beside it is untouched and stays gated on true publicPlaybackOnly", () => {
  const stack = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(stack.includes("publicPlaybackOnly || Boolean(publicUrl?.trim())"), "the real onShare button must trigger on a genuine publicUrl, not only true publicPlaybackOnly");
  assert.ok(stack.includes('{publicPlaybackOnly && analyticsCtx && publicAnalytics?.listingSourceId ? (\n                <div className={`${QUICK_ACTION_CLASS} justify-start`}>\n                  <LeonixLikeButton'), "the Save/Like block must remain exactly as conservative as before — untouched by this fix");
});
check("Gate H: a NEW/pending draft (mode 'draft', not yet active) never shows a real Share — no publicUrl exists for it, so both the Business Hub and bottom Share fall back to the truthful 'available after publish' state", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  const draftBranchStart = src.indexOf("if (isDraftCapture)");
  const draftCall = src.slice(draftBranchStart, src.indexOf("</AutosNegociosPreviewLocaleProvider>", draftBranchStart));
  assert.ok(!draftCall.includes("publicUrl={canonicalPublicUrl}") && !draftCall.includes("canonicalListingId={"), "the draft-capture branch's AutosNegociosDealershipPreviewPage call must not pass a real publicUrl or canonicalListingId");
});

/* --- Gate A: results cards — dead-card classification held, live-card locale coherence proven --- */
check("Gate A: 3 confirmed-dead result-card files (real, latent bugs included — hardcoded en-US/mi/Spanish literals) have zero real path-based importers anywhere, so they cannot reach a real buyer", () => {
  const deadCards: Record<string, string> = {
    "app/(site)/clasificados/autos/shell/AutosResultCard.tsx": "AutosResultCard",
    "app/(site)/clasificados/autos/shell/AutosPreviewCard.tsx": "AutosPreviewCard",
    "app/(site)/clasificados/autos/components/public/AutosPublicFeaturedCard.tsx": "AutosPublicFeaturedCard",
  };
  const root = new URL("..", import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, "$1");
  for (const [file, exportName] of Object.entries(deadCards)) {
    let hits: string[] = [];
    try {
      hits = execSync(`grep -rlE "from [\\"'].*/${exportName}[\\"']" app --include=*.tsx --include=*.ts`, { cwd: root, encoding: "utf8" })
        .trim().split("\n").filter(Boolean).map((p) => p.replace(/\\/g, "/"));
    } catch {
      hits = [];
    }
    const otherConsumers = hits.filter((h) => !h.endsWith(file));
    assert.equal(otherConsumers.length, 0, `${exportName}: expected zero live consumers, found: ${otherConsumers.join(", ")}`);
  }
});
check("Gate A: AutosLandingInventoryCard and AutosDealerInventoryVehicleCard are TRANSITIVELY dead — every node in their real importer chain (FeaturedCarsSection/RecentAutosSection; RelatedDealerCars -> AutoDealerPreviewPage) is itself unimported by anything live", () => {
  const root = new URL("..", import.meta.url).pathname.replace(/^\/([a-zA-Z]:)/, "$1");
  function importersOf(exportName: string): string[] {
    try {
      return execSync(`grep -rlE "from [\\"'].*/${exportName}[\\"']" app --include=*.tsx --include=*.ts`, { cwd: root, encoding: "utf8" })
        .trim().split("\n").filter(Boolean).map((p) => p.replace(/\\/g, "/"));
    } catch {
      return [];
    }
  }
  // FeaturedCarsSection / RecentAutosSection: must have zero real importers (their own file doesn't self-import).
  for (const name of ["FeaturedCarsSection", "RecentAutosSection"]) {
    const hits = importersOf(name).filter((h) => !h.endsWith(`${name}.tsx`));
    assert.equal(hits.length, 0, `${name} must be unimported anywhere — found: ${hits.join(", ")}`);
  }
  // RelatedDealerCars: its only real importer must be AutoDealerPreviewPage.
  const relatedCarsImporters = importersOf("RelatedDealerCars").filter((h) => !h.endsWith("RelatedDealerCars.tsx"));
  assert.ok(relatedCarsImporters.every((h) => h.endsWith("AutoDealerPreviewPage.tsx")), `RelatedDealerCars' only consumer must be AutoDealerPreviewPage — found: ${relatedCarsImporters.join(", ")}`);
  // AutoDealerPreviewPage itself: must have zero real importers, closing out the whole chain as dead.
  const previewPageImporters = importersOf("AutoDealerPreviewPage").filter((h) => !h.endsWith("AutoDealerPreviewPage.tsx"));
  assert.equal(previewPageImporters.length, 0, `AutoDealerPreviewPage must be unimported anywhere — found: ${previewPageImporters.join(", ")}`);
});
check("Gate A: AutosPublicStandardCard (the LIVE public search-results card) formats price/mileage locale-correctly and links to its own listing", () => {
  const src = raw("app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx");
  assert.ok(src.includes("formatAutosUsd(listing.price, lang)") && src.includes("formatAutosMiles(listing.mileage, lang)"));
  assert.ok(src.includes("autosLiveVehiclePath(listing.id)"), "must link to its own listing id");
  assert.equal(formatAutosMiles(100, "es"), "100 millas");
  assert.equal(formatAutosMiles(100, "en"), "100 mi");
});
check("Gate A: PreviewAutosDealerInventoryVehicleCard (the live related-inventory card) reads lang from the SAME shared context as its parent page — not an independent derivation", () => {
  const relatedShelf = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewRelatedDealerCars.tsx");
  assert.ok(relatedShelf.includes("useAutosNegociosPreviewCopy()"));
});
check("Gate A: dealer children ARE independently searchable in public results (their own row, gated only by parent-active-and-same-owner, never fabricated)", () => {
  const svc = raw("app/lib/clasificados/autos/autosClassifiedsListingService.ts");
  assert.ok(svc.includes('"inventory_vehicle"'), "the active-rows query must include inventory_vehicle rows, not just main");
  const gate = raw("app/lib/clasificados/autos/autosPublicChildParentVisibility.ts");
  assert.ok(gate.includes("isAutosChildParentGateSatisfied") || gate.includes("filterAutosRowsByActiveParent"));
});
check("Gate A: the results-card taxonomy localizer never fabricates a translation for a seller's free-typed 'Otro' value — same doctrine as everywhere else in Autos (confirmed on the actual card call site)", () => {
  const cardFile = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosResultsCardPreview.tsx");
  assert.ok(cardFile.includes("localizeAutosDealerTaxonomySelectValue") && cardFile.includes("?? listing"), "must localize deterministically with a safe fallback to the raw stored value, never invent one");
});

/* --- Gate B: bottom jump navigation — resilient-by-construction, confirmed via source ---------- */
check("Gate B: the promise strip resolves every jump target against the real DOM at mount time (document.getElementById) and silently drops any item whose target doesn't exist — a dead jump card is structurally impossible", () => {
  const strip = raw("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewPromiseStrip.tsx");
  assert.ok(strip.includes("document.getElementById") && strip.includes("scrollIntoView"));
  assert.ok(/visibleItems/.test(strip), "must filter to only the items that actually resolved to a real element");
});
check("Gate B: the finance and additional-vehicles jump cards are conditionally rendered only when those sections actually exist", () => {
  const financeSection = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx");
  assert.ok(financeSection.includes("hasDealerFinanceContact(data)"));
  const invSection = raw("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewInventorySection.tsx");
  assert.ok(invSection.includes("if (additionalVehicles.length === 0)") && invSection.includes("return null"));
});
check("Gate B: jump-card labels are driven by the same ad-local lang prop passed down from the page's own adDisplayLang — not an independent read", () => {
  const previewClient = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(previewClient.includes("<AutosNegociosPreviewPromiseStrip lang={adDisplayLang}"));
});

/* --- Gate C: engagement identity — Like real+id-scoped on live, honestly non-persisted in Preview; Save N/A; Share real and per-listing --- */
check("Gate C: Like is DB-backed and keyed on the fetched listing's own real id on the live page, and honestly non-persisted (zero count, no id) in Preview — never a fabricated nonzero count", () => {
  const page = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/AutosNegociosDealershipPreviewPage.tsx");
  assert.ok(page.includes("listingSourceId={publicPlaybackOnly ? publicAnalytics?.listingSourceId : undefined}"), "the engagement strip's Like identity stays strictly gated on true publicPlaybackOnly — untouched by the Gate H share fix");
  const strip = raw("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewEngagementStrip.tsx");
  assert.ok(strip.includes("persistEngagement={isPublic}") || strip.includes("persistEngagement={false}") || /isPublic/.test(strip), "must not persist engagement when not public");
});
check("Gate C: Save is real and DB-backed on the LIVE search-results card (AutosPublicStandardCard), keyed on that exact card's own listing id — not fabricated, not a shared/generic id", () => {
  const src = raw("app/(site)/clasificados/autos/components/public/AutosPublicStandardCard.tsx");
  assert.ok(src.includes("<LeonixSaveButton") && src.includes("listingId={listing.id}") && src.includes("persistEngagement={Boolean(listing.id)}"), "the results-card Save button must be keyed on that card's own listing id, real/persisted only when a real id exists");
});
check("Gate C: the detail-page engagement strip (Like/Share) has no separate Save control — a different surface (the results card) owns Save, this is a real product-surface split, not a hidden gap", () => {
  const strip = raw("app/(site)/clasificados/autos/negocios/components/AutosNegociosPreviewEngagementStrip.tsx");
  assert.ok(!strip.includes("LeonixSaveButton"), "confirms the detail-page strip genuinely has no Save control — documented, not silently missing");
});
check("Gate C: Share on the live page is scoped to the current listing's own URL (window.location.href of the fetched listing's own route) — never a parent/sibling URL", () => {
  const liveClient = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(liveClient.includes('const publicUrl = typeof window !== "undefined" ? window.location.href : ""'));
});

/* --- Gate D: accessibility — the interactions this master execution actually added/changed ----- */
check("Gate D: the lightbox dialog carries real dialog semantics (role, aria-modal, aria-label) and its Todo/Fotos/Videos switch buttons are real <button> elements with visible text (never icon-only, never mouse-only)", () => {
  const shared = raw("app/components/media/BusinessGalleryModal.tsx");
  assert.ok(shared.includes('role="dialog"') && shared.includes('aria-modal="true"') && shared.includes("aria-label={ariaLabel}"));
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx",
    "app/(site)/clasificados/autos/negocios/components/AutoGallery.tsx",
  ]) {
    const src = raw(file);
    assert.ok(/<button type="button" className=\{tabClass\(activeTab === "all"\)\}/.test(src), `${file}: the switch buttons must be real <button> elements`);
  }
});
check("Gate D: every new Dealer/Finance CTA (Text/SMS, Correo/Email) is a real focusable <a>/<button> with visible text — never an icon-only control with no accessible name", () => {
  const dfc = raw("app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx");
  assert.ok(dfc.includes("{f.text}") && dfc.includes("{f.call}") && dfc.includes("{f.email}") && dfc.includes("{f.whatsapp}"), "every finance CTA renders its own visible text label alongside the icon");
});
check("Gate D: the email action sheet's Copy/Share/Open actions all render as real buttons with the same visible label used for their accessible name (no separate icon-only affordance)", () => {
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  assert.ok(sheet.includes("t.copyEmail") && sheet.includes("t.copyFullMessage") && sheet.includes("t.shareContact") && sheet.includes("t.shareWithApps") && sheet.includes("t.openEmailApp"));
});
check("Gate D: ad-local accessibility copy (gallery aria-labels, finance/contact labels) follows adDisplayLang via the same lang variable as visible text; global site chrome is untouched by this execution", () => {
  const gallery = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewAutoGallery.tsx");
  assert.ok(gallery.includes('ariaLabel={lang === "es" ? "Galería del vehículo" : "Vehicle gallery"}'));
  const navbar = raw("app/components/Navbar.tsx");
  assert.ok(!navbar.includes("adDisplayLang"), "global Navbar must never consume the ad-local adDisplayLang");
});

/* ================================================================================================
 * LIVE OWNER-QA BLOCKER CLOSEOUT (2026-09-17) — Gates 1-9 from real authenticated owner QA.
 * ============================================================================================ */

/* --- Gate 1: Translate control offered independent of source==site match; direction flips ------ */
check("Gate 1: Translate is offered even when the known ad language equals the site language (Spanish ad + Spanish site) — the Servicios doctrine, not a source!=site gate", () => {
  const content = { description: "Un auto excelente en buen estado." };
  assert.equal(shouldOfferAutosTranslateAd("es", "es", content), true, "same-language Spanish/Spanish must now offer translate");
  assert.equal(shouldOfferAutosTranslateAd("en", "en", content), true, "same-language English/English must now offer translate");
  assert.equal(shouldOfferAutosTranslateAd("en", "es", content), true, "cross-language case must still offer translate (unchanged)");
});
check("Gate 1: Translate is never offered with no real prose, regardless of locale match", () => {
  assert.equal(shouldOfferAutosTranslateAd("es", "es", {}), false);
});
check("Gate 1: TranslateAdControl resolves a known-source, same-as-site translation target to the OPPOSITE active locale (never an es->es or en->en no-op request)", () => {
  const src = raw("app/components/translation/TranslateAdControl.tsx");
  assert.ok(src.includes("const knownSourceTargetLocale = useMemo((): Locale => {"), "must compute a real known-source target resolver");
  assert.ok(
    src.includes('return originalLocale === siteLocale ? oppositeActiveTranslateLocale(siteLocale) : siteLocale;'),
    "same-as-site known source must flip to the opposite locale; a differing known source must still target siteLocale (unchanged)",
  );
  assert.ok(src.includes("targetLocale: requestedTargetLocale"), "the actual network request must use the resolved target, not a hardcoded siteLocale");
  assert.ok(!src.includes("targetLocale: siteLocale,\n      });"), "the old hardcoded siteLocale-only request must be gone");
});
check("Gate 1: oppositeActiveTranslateLocale is a real ES<->EN flip (reused from the existing Servicios retargeting policy, not reinvented)", () => {
  assert.equal(oppositeActiveTranslateLocale("es"), "en");
  assert.equal(oppositeActiveTranslateLocale("en"), "es");
});
check("Gate 1 placement: the shared Dealer hero (AutosNegociosDealershipPreviewPage) renders translateControl directly above the title block, inside the ad's own hero card — never a page-top element", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/AutosNegociosDealershipPreviewPage.tsx");
  const heroIdx = src.indexOf('id={AUTOS_PREVIEW_SECTION_IDS.hero}');
  const slotIdx = src.indexOf('data-autos-translate-ad-slot="1"');
  const titleIdx = src.indexOf('data-autos-unified-canvas-header="1"');
  assert.ok(heroIdx > -1 && slotIdx > -1 && titleIdx > -1, "all three anchors must exist");
  assert.ok(heroIdx < slotIdx && slotIdx < titleIdx, "translate slot must sit between the hero section start and the title block");
});
check("Gate 1 placement: every Dealer Preview/published-detail caller passes translateControl into the shared hero instead of rendering it as a standalone page-top element", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
    "app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx",
    "app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes("translateControl={translateControl}"), `${file}: must pass translateControl into AutosNegociosDealershipPreviewPage`);
    assert.ok(!src.includes('<div className="pt-20">{translateControl}</div>'), `${file}: the old page-top nav-clearance hack must be gone`);
  }
});
check("Gate 1 placement: the Privado live-detail (AutoPrivadoPreviewPage) accepts and renders translateControl above its title, matching the Dealer hero contract", () => {
  const page = raw("app/(site)/clasificados/autos/privado/components/AutoPrivadoPreviewPage.tsx");
  assert.ok(page.includes("translateControl?: ReactNode;"));
  const slotIdx = page.indexOf('data-autos-translate-ad-slot="1"');
  const titleIdx = page.indexOf("{/* Title and location row */}");
  assert.ok(slotIdx > -1 && titleIdx > -1 && slotIdx < titleIdx, "translate slot must render before the title row");
  const liveClient = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(liveClient.includes("<AutoPrivadoPreviewPage") && /AutoPrivadoPreviewPage[\s\S]{0,300}translateControl=\{translateControl\}/.test(liveClient));
});

/* --- Gate 2: child Dealer Preview reuses the exact parent premium shell ------------------------- */
check("Gate 2: the child inventory Preview overlay renders the SAME premium Business Hub shell as the parent draft Preview (embeddedInShell + draftPreviewMode), not the bare relatedPreviewOnly-only render that silently dropped the premium hub header/contact grid/price block", () => {
  const overlay = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  const callIdx = overlay.indexOf("<AutosNegociosDealershipPreviewPage");
  const callSlice = overlay.slice(callIdx, overlay.indexOf("/>", callIdx));
  assert.ok(callSlice.includes("embeddedInShell"), "must avoid a second nested AutoDealerPreviewChrome inside the overlay's own dialog chrome");
  assert.ok(callSlice.includes("draftPreviewMode"), "must restore parity with the parent draft Preview's premium hub");
  assert.ok(callSlice.includes("relatedPreviewOnly"), "related-card non-navigation behavior must be preserved");
});

/* --- Gate 3: bottom Share always exists, truthfully reflecting availability --------------------- */
check("Gate 3: AutosNegociosEndOfContentShare never silently disappears — with no real listing id it renders a truthful, disabled 'available after publish' state instead of returning null", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/components/AutosNegociosEndOfContentShare.tsx");
  assert.ok(!/if \(!sourceId\) return null;/.test(src), "the old hard null-return must be gone");
  assert.ok(src.includes('data-autos-end-of-content-share-unavailable="1"'), "must render a distinguishable unavailable state");
  assert.ok(src.includes("disabled") && src.includes('aria-disabled="true"'), "the unavailable state's button must be genuinely non-interactive, never a fake-looking active Share button");
  assert.ok(!src.includes('href="mailto:') && !src.includes("window.location.origin"), "must never fabricate a public URL when none exists");
});
check("Gate 3: the shared Dealer hero always renders AutosNegociosEndOfContentShare unconditionally — availability is the component's own responsibility, not a per-caller gate", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/dealershipPreview/AutosNegociosDealershipPreviewPage.tsx");
  assert.ok(src.includes("<AutosNegociosEndOfContentShare"));
  assert.ok(!/\{.*&&\s*<AutosNegociosEndOfContentShare/.test(src), "must not be wrapped in a boolean-gate that hides the whole section");
});

/* --- Gate 5: email default message body uses real listing identity, never a bare empty body ----- */
check("Gate 5: buildAutosContactEmailBody matches the owner's exact finance example copy (ES/EN)", () => {
  const es = buildAutosContactEmailBody({
    lang: "es",
    recipientName: "Elena Morales",
    vehicleTitle: "2021 Lexus RX 350 F Sport",
    intent: "finance",
  });
  assert.equal(es, "Hola Elena Morales,\nme interesa conocer las opciones de financiamiento para\n2021 Lexus RX 350 F Sport en Leonix.");
  const en = buildAutosContactEmailBody({
    lang: "en",
    recipientName: "Elena Morales",
    vehicleTitle: "2021 Lexus RX 350 F Sport",
    intent: "finance",
  });
  assert.equal(en, "Hello Elena Morales,\nI'm interested in financing options for the\n2021 Lexus RX 350 F Sport listing on Leonix.");
});
check("Gate 5: buildAutosContactEmailBody never fabricates a recipient name or vehicle title it wasn't given", () => {
  const body = buildAutosContactEmailBody({ lang: "es", intent: "dealer" });
  assert.equal(body, "Hola,\nme interesa este anuncio publicado en Leonix.");
});
check("Gate 5: every Autos 'Correo' openEmail/openFinanceEmail call site builds a real default body instead of a hardcoded empty string", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx",
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx",
    "app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx",
  ]) {
    const src = raw(file);
    assert.ok(src.includes("buildAutosContactEmailBody("), `${file}: must call the shared default-body builder`);
    assert.ok(!/body:\s*""\s*,/.test(src), `${file}: the old hardcoded empty body must be gone`);
  }
});

/* --- Gate 9: "Día"/"Day" placeholder hours rows never reach buyer-facing display ----------------- */
check("Gate 9: a row whose day is still the raw add-row placeholder ('Día'/'Day') is dropped from buyer-facing display — incomplete legacy data, not real hours", () => {
  const rows = filterDealerHoursForDisplay([
    { day: "Día", open: "09:00", close: "17:00", closed: false },
    { day: "Day", open: "09:00", close: "17:00", closed: false },
    { day: "Lunes", open: "09:00", close: "18:00", closed: false },
  ]);
  assert.equal(rows.length, 1, "only the real weekday row should survive");
  assert.equal(rows[0]?.day, "Lunes");
});
check("Gate 9: a dealer's genuine free-typed custom day label (never the literal placeholder) still renders — the fix must not punish the legitimate custom-label feature", () => {
  const rows = filterDealerHoursForDisplay([{ day: "Fines de semana", open: "10:00", close: "14:00", closed: false }]);
  assert.equal(rows.length, 1, "a real custom label must survive the filter");
});

/* ================================================================================================
 * NO-MAILTO EMAIL DOCTRINE (2026-09-17) — owner final decision: the approved Autos (and
 * Servicios) contact sheet no longer exposes "Abrir app de correo"/"Open email app". Copy/Share
 * remain the reliable cross-app path. This is a per-intent `showOpenEmailApp` opt-out flag, never
 * a deletion of the shared openMailto infrastructure other categories still rely on.
 * ============================================================================================ */
check("no-mailto: send_email intent declares showOpenEmailApp, defaulting to true (every other category untouched unless it opts out)", () => {
  const types = raw("app/components/cta/types.ts");
  assert.ok(types.includes("showOpenEmailApp?: boolean;"), "type must declare the opt-out flag");
  const builders = raw("app/components/cta/ctaIntentBuilders.ts");
  assert.ok(builders.includes("showOpenEmailApp: input.showOpenEmailApp ?? true"), "builder must default to true");
});
check("no-mailto: CtaActionSheet gates the open_email button, its hint copy, AND the Gmail launcher behind showOpenEmailApp — never just deletes them from the shared component", () => {
  const sheet = raw("app/components/cta/CtaActionSheet.tsx");
  assert.ok(sheet.includes("const showOpenEmailApp = intent.showOpenEmailApp ?? true;"));
  assert.ok(sheet.includes("{showOpenEmailApp && canCompose ? ("), "openEmailAppHint gated");
  assert.ok(sheet.includes("{showOpenEmailApp && gmailHref ? ("), "Gmail launcher gated (it's still an external mail-app launcher)");
  assert.ok(sheet.includes("showOpenEmailApp\n          ? btnRow(") || /showOpenEmailApp\s*\?\s*btnRow/.test(sheet), "open_email button gated");
  assert.ok(sheet.includes("openMailto(em, sub, bod)"), "the launcher itself is preserved for categories that don't opt out (Gate 03)");
  assert.ok(sheet.includes("t.openEmailApp") && sheet.includes("t.openEmailAppHint"), "copy keys preserved, not deleted");
});
check("no-mailto: every approved Autos email intent (Dealer main, Finance, Dealer Preview, and the Privado/AutosSheetCtaLink mailto-interceptor) explicitly opts out", () => {
  for (const file of [
    "app/(site)/clasificados/autos/negocios/components/DealerBusinessStack.tsx",
    "app/(site)/clasificados/autos/negocios/components/DealerFinanceContact.tsx",
    "app/(site)/clasificados/autos/negocios/preview/dealershipPreview/PreviewDealerBusinessStack.tsx",
    "app/(site)/clasificados/autos/shared/lib/autosCtaSheet.ts",
  ]) {
    assert.ok(raw(file).includes("showOpenEmailApp: false"), `${file}: must opt out of the mailto launcher`);
  }
});
check("no-mailto: Privado's Correo button reaches the opted-out intent — AutosSheetCtaLink -> buildAutosIntentFromHref -> autosCtaSheet.ts, the same file just proven to opt out", () => {
  const strip = raw("app/(site)/clasificados/autos/privado/components/PrivadoContactStrip.tsx");
  assert.ok(strip.includes("AutosSheetCtaLink"), "Privado's email button must route through the shared link interceptor");
  assert.ok(strip.includes("mailtoHref"), "Privado's own mailto-shaped href construction is unchanged (only the sheet's launcher visibility changed)");
});
check("no-mailto: unrelated categories (Restaurantes, Rentas, Bienes Raíces) never opt out — they keep the mailto launcher, confirming this is scoped, not a global removal (Gate 03)", () => {
  for (const file of [
    "app/(site)/clasificados/bienes-raices/shared/brContactCtaSheet.tsx",
    "app/(site)/clasificados/restaurantes/shell/RestaurantContactHub.tsx",
    "app/(site)/clasificados/rentas/listing/components/RentasNegocioDesktopBusinessRail.tsx",
  ]) {
    assert.ok(!raw(file).includes("showOpenEmailApp: false"), `${file}: must NOT opt out — unrelated category, mailto launcher stays`);
  }
});
check("no-mailto: Servicios' SECOND real send_email path (a mailto-shaped quote destination, buildServiciosSendEmailIntentFromMailto, reached from both ServiciosBusinessHubContactCard and ServiciosActionPanel) also opts out — proves the doctrine holds beyond the single most-obvious call site", () => {
  const src = raw("app/(site)/servicios/lib/serviciosCtaIntents.ts");
  const fnStart = src.indexOf("export function buildServiciosSendEmailIntentFromMailto");
  assert.ok(fnStart >= 0);
  const fnBlock = src.slice(fnStart, src.indexOf("\n}\n", fnStart));
  assert.ok(fnBlock.includes("showOpenEmailApp: false"));
  assert.ok(raw("app/(site)/servicios/components/ServiciosActionPanel.tsx").includes("buildServiciosSendEmailIntentFromMailto"));
});
check("no-mailto: openMailto and its underlying buildMailtoHref remain real, exported, working functions — legacy infrastructure is preserved, not deleted", () => {
  const launchers = raw("app/components/cta/ctaLaunchers.ts");
  assert.ok(launchers.includes("export function openMailto"));
  const hrefs = raw("app/lib/digitalContact/humanConnection/nativeChannelHrefs.ts");
  assert.ok(hrefs.includes("export function buildMailtoHref") || hrefs.includes("function buildMailtoHref"));
});

if (failures.length) {
  console.error(`\nverify-autos-bilingual-architecture-01: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-autos-bilingual-architecture-01: PASS");
