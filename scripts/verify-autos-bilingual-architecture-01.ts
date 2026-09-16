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

if (failures.length) {
  console.error(`\nverify-autos-bilingual-architecture-01: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log("\nverify-autos-bilingual-architecture-01: PASS");
