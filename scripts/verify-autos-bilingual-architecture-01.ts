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
import { hasDealerFinanceContact, resolveFinanceSmsTel } from "../app/lib/clasificados/autos/autosDealerFinanceContact";
import type { AutoDealerListing } from "../app/(site)/clasificados/autos/negocios/types/autoDealerListing";

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
check("live vehicle client (negocios): outer chrome stays on siteLocale, a fresh provider nested at the render-prop carries adDisplayLang around translateControl + the full detail page", () => {
  const src = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(
    /<AutosNegociosPreviewLocaleProvider lang=\{lang\} manageDocumentTitle=\{false\}>[\s\S]*?<AutosListingTranslationLayer/.test(src),
    "outer wrapper (site chrome: Leonix Ad ID label, back-to-results link) must stay keyed on siteLocale",
  );
  assert.ok(
    /\(displayListing, translateControl, adDisplayLang\) => \(\s*<AutosNegociosPreviewLocaleProvider lang=\{normalizeAutosNegociosLang\(adDisplayLang\)\}[\s\S]*?\{translateControl\}[\s\S]*?<AutosNegociosDealershipPreviewPage/.test(
      src,
    ),
    "nested provider must wrap both the translate control and the full dealership preview page",
  );
});
check("live vehicle client (privado): the same nested-provider pattern applies with the Privado provider", () => {
  const src = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  assert.ok(
    /\(displayListing, translateControl, adDisplayLang\) => \(\s*<AutosPrivadoPreviewLocaleProvider lang=\{normalizeAutosNegociosLang\(adDisplayLang\)\}[\s\S]*?\{translateControl\}[\s\S]*?<AutoPrivadoPreviewPage/.test(
      src,
    ),
  );
});
check("parent Preview canonical-active branch nests a fresh provider on adDisplayLang around translateControl + the detail page", () => {
  const src = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  assert.ok(
    /\(displayListing, translateControl, adDisplayLang\) => \(\s*<AutosNegociosPreviewLocaleProvider lang=\{normalizeAutosNegociosLang\(adDisplayLang\)\}[\s\S]*?\{translateControl\}[\s\S]*?<AutosNegociosDealershipPreviewPage data=\{displayListing\} editBackHref=\{editBackHref\} \/>/.test(
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
check("child inventory overlay nests its own adDisplayLang provider inside the outer session-lang chrome provider", () => {
  const src = raw("app/(site)/publicar/autos/negocios/components/AutosNegociosChildInventoryPreviewOverlay.tsx");
  assert.ok(/<AutosNegociosPreviewLocaleProvider lang=\{lang\}>[\s\S]*<AutosListingTranslationLayer/.test(src), "outer chrome provider stays on the plain session lang");
  assert.ok(
    /\(displayListing, translateControl, adDisplayLangRaw\) => \{[\s\S]*?<AutosNegociosPreviewLocaleProvider lang=\{adDisplayLang\}[\s\S]*?\{translateControl\}[\s\S]*?<AutosNegociosDealershipPreviewPage/.test(
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
check("the 3 render-prop branches where translateControl is the first content each give it pt-20 clearance from the fixed global Navbar", () => {
  const liveClient = raw("app/(site)/clasificados/autos/vehiculo/[id]/AutosLiveVehicleClient.tsx");
  const previewClient = raw("app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx");
  const navbar = raw("app/components/Navbar.tsx");
  assert.ok(navbar.includes('className="fixed top-0 left-0 z-50 w-full overflow-visible"'), "sanity: the global Navbar really is fixed/out-of-flow, so first-content clearance is a real requirement");
  const occurrences = (liveClient.match(/\{translateControl \? <div className="pt-20">\{translateControl\}<\/div> : null\}/g) ?? []).length;
  assert.equal(occurrences, 2, "both live-vehicle branches (negocios + privado) must wrap translateControl with clearance");
  assert.ok(previewClient.includes('{translateControl ? <div className="pt-20">{translateControl}</div> : null}'), "the Preview canonical-active branch must wrap translateControl with clearance");
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

if (failures.length) {
  console.error(`\nverify-autos-bilingual-architecture-01: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-autos-bilingual-architecture-01: PASS");
