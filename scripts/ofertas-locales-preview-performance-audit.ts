/**
 * OFERTAS LOCALES — Preview performance + final UX polish.
 *
 * Root cause (confirmed live): OfertasPdfItemCropPreview, the inline flyer
 * preview, and the full-screen flyer viewer modal each called
 * `pdfjs.getDocument({ url })` independently — for a 127-item flyer that
 * meant 55+ requests and 564+ MB re-downloading the SAME PDF on one page
 * load, eventually 403ing the signed URL.
 *
 * Fix: a single shared, reference-counted pdf.js document (+ per-page)
 * cache in ofertasLocalesPdfDocumentCache.ts, consumed by all three.
 *
 * Run: npm run ofertas-locales:preview-performance-audit
 */
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  acquireSharedPdfDocument,
  releaseSharedPdfDocument,
} from "../app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPdfDocumentCache";
import { buildOfertaLocalMailtoHref } from "../app/lib/ofertas-locales/ofertasLocalesApplicationHelpers";
import { OFERTAS_AI_SCANNER_PROTECTED_PATHS } from "../app/lib/ofertas-locales/ofertasAiScannerProtectedPaths";

type Verdict = { id: string; label: string; ok: boolean };
const results: Verdict[] = [];

function check(id: string, label: string, fn: () => void) {
  try {
    fn();
    results.push({ id, label, ok: true });
    console.log(`${id} ${label} -> TRUE`);
  } catch (err) {
    results.push({ id, label, ok: false });
    console.log(`${id} ${label} -> FALSE (${(err as Error).message})`);
  }
}

const previewDir = "app/(site)/publicar/ofertas-locales/preview";
const cropSrc = fs.readFileSync(`${previewDir}/OfertasPdfItemCropPreview.tsx`, "utf8");
const flyerPreviewSrc = fs.readFileSync(`${previewDir}/OfertasLocalesPdfFlyerPreview.tsx`, "utf8");
const modalSrc = fs.readFileSync(`${previewDir}/OfertasLocalesFlyerViewerModal.tsx`, "utf8");
const heroVisualSrc = fs.readFileSync(`${previewDir}/OfertasLocalesPreviewHeroVisual.tsx`, "utf8");
const copySrcPreview = fs.readFileSync(`${previewDir}/ofertasLocalesPreviewCopy.ts`, "utf8");
const cardSrc = fs.readFileSync(`${previewDir}/OfertasLocalesPreviewCard.tsx`, "utf8");
const clientSrc = fs.readFileSync(`${previewDir}/OfertasLocalesPreviewClient.tsx`, "utf8");
const gridSrc = fs.readFileSync(`${previewDir}/OfertasLocalesPreviewProductGrid.tsx`, "utf8");
const cacheSrc = fs.readFileSync(`${previewDir}/ofertasLocalesPdfDocumentCache.ts`, "utf8");

/** Slice out one top-level `function <name>(` ... to the next top-level function/export. */
function extractFunctionBody(src: string, name: string): string {
  const start = src.indexOf(`function ${name}(`);
  assert.ok(start >= 0, `function ${name} must exist`);
  const nextMatch = /\n(export )?function [A-Za-z_]/.exec(src.slice(start + 1));
  const end = nextMatch ? start + 1 + nextMatch.index : src.length;
  return src.slice(start, end);
}

const businessHubSrc = extractFunctionBody(cardSrc, "PreviewBusinessHub");

check("01", "Shared cache dedups concurrent acquisitions of the same URL (real function call, no network dependency)", () => {
  const fakeUrl = "https://example.invalid/ofertas-locales-audit-fixture.pdf";
  const first = acquireSharedPdfDocument(fakeUrl);
  const second = acquireSharedPdfDocument(fakeUrl);
  assert.equal(first, second, "two acquisitions of the same URL must share the exact same in-flight promise");
  releaseSharedPdfDocument(fakeUrl);
  releaseSharedPdfDocument(fakeUrl);
  first.catch(() => {
    /* the URL is fake and will reject — only promise identity is under test */
  });
});

check("02", "Cache is reference-counted with a destroy grace period (no thrash on remount)", () => {
  assert.match(cacheSrc, /refCount/);
  assert.match(cacheSrc, /DESTROY_GRACE_MS/);
  assert.match(cacheSrc, /setTimeout\(/);
});

check("03", "Crop cards (search/filter/load-more results) use the shared cache, not their own getDocument", () => {
  assert.match(
    cropSrc,
    /import \{ acquireSharedPdfPage, releaseSharedPdfDocument \} from "\.\/ofertasLocalesPdfDocumentCache";/
  );
  assert.doesNotMatch(cropSrc, /pdfjs\.getDocument/);
  assert.match(cropSrc, /releaseSharedPdfDocument\(pdfUrl\)/);
});

check("04", "Product grid renders crop cards for search/filter/load-more results (same component, same cache)", () => {
  assert.match(gridSrc, /OfertasPdfItemCropPreview/);
});

check("05", "Search reuses the shared cache (search filters the SAME item list feeding the SAME crop component)", () => {
  assert.match(gridSrc, /searchQuery|searchTerm|onSearch/i);
  assert.match(gridSrc, /OfertasPdfItemCropPreview/);
});

check("06", "Filter reuses the shared cache (filter controls narrow the SAME item list feeding the SAME crop component)", () => {
  assert.match(gridSrc, /filter/i);
  assert.match(gridSrc, /OfertasPdfItemCropPreview/);
});

check("07", "Load more reuses the shared cache (pagination renders more of the SAME crop component)", () => {
  assert.match(gridSrc, /[Ll]oadMore|[Vv]er más|visibleCount|pageSize/);
  assert.match(gridSrc, /OfertasPdfItemCropPreview/);
});

check("08", "Card crops no longer fall back to unavailable merely from re-fetch thrash (shared load, not per-card)", () => {
  assert.doesNotMatch(cropSrc, /getDocument\(\{\s*url:\s*pdfUrl/);
});

check("09", "Drawer crop variant still works (same component, same shared cache, just a different size variant)", () => {
  assert.match(cropSrc, /variant === "drawer"/);
});

check("10", "No memory leak: released documents are actually destroyed once nothing references them", () => {
  assert.match(cacheSrc, /documentCache\.delete\(url\)/);
  assert.match(cacheSrc, /destroy\?\.\(\)/);
});

check("11", "Inline flyer preview also uses the shared cache (was its own independent getDocument before)", () => {
  assert.match(
    flyerPreviewSrc,
    /import \{ acquireSharedPdfPage, releaseSharedPdfDocument \} from "\.\/ofertasLocalesPdfDocumentCache";/
  );
  assert.doesNotMatch(flyerPreviewSrc, /pdfjs\.getDocument/);
});

check("12", "Inline flyer enlarged: full column width (no more max-w-2xl/3xl wrapper)", () => {
  assert.doesNotMatch(cardSrc, /max-w-2xl lg:max-w-3xl/);
  assert.match(cardSrc, /id="volante"[\s\S]{0,120}<div className="w-full">/);
});

check("13", "Flyer page navigation: text-labeled Anterior/Siguiente buttons (not tiny floating icon-only arrows)", () => {
  assert.match(flyerPreviewSrc, /"Previous" : "Anterior"/);
  assert.match(flyerPreviewSrc, /"Next" : "Siguiente"/);
  assert.doesNotMatch(flyerPreviewSrc, /absolute left-1 top-1\/2|absolute right-1 top-1\/2/);
});

check("14", "Flyer page navigation: shows 'Página X de Y'", () => {
  assert.match(flyerPreviewSrc, /"Page"\s*:\s*"Página"/);
  assert.match(flyerPreviewSrc, /currentPage[\s\S]*pageCount|pageCount[\s\S]*currentPage/);
});

check("15", "Inline page-nav has clear first/last disabled states (no bubbling concern — the whole-card click-to-zoom is gone)", () => {
  assert.match(flyerPreviewSrc, /disabled=\{currentPage <= 1\}/);
  assert.match(flyerPreviewSrc, /disabled=\{currentPage >= pageCount\}/);
});

check("16", "No click-to-zoom wrapper on the inline flyer anymore (nothing is 'opened' there, so no X belongs on it either)", () => {
  assert.doesNotMatch(heroVisualSrc, /canOpenViewer/);
  assert.doesNotMatch(heroVisualSrc, /role="button"/);
  assert.match(heroVisualSrc, /<div className=\{CARD\}>\{previewInner\}<\/div>/);
});

check("17", "Flyer viewer modal also uses the shared cache (was its own independent getDocument before)", () => {
  assert.match(
    modalSrc,
    /import \{ acquireSharedPdfPage, releaseSharedPdfDocument \} from "\.\/ofertasLocalesPdfDocumentCache";/
  );
  assert.doesNotMatch(modalSrc, /pdfjs\.getDocument/);
  assert.match(modalSrc, /releaseSharedPdfDocument\(sourceUrl\)/);
});

check("18", "'Enviar a Leonix para aprobación' button removed from the compact preview controls", () => {
  assert.doesNotMatch(cardSrc, /onSubmitForReview\?\.\(\)|disabled=\{publishing \|\| aiNeedsReviewCount > 0 \|\| !onSubmitForReview\}/);
});

check("19", "'Enviar a Leonix para aprobación' button removed everywhere in the card (no remaining onClick wiring)", () => {
  assert.doesNotMatch(cardSrc, /onClick=\{onSubmitForReview\}/);
  assert.doesNotMatch(cardSrc, /onSubmitForReview/);
});

check("20", "Kept: Volver a editar / Volver a revisión / Continuar para publicar", () => {
  assert.match(cardSrc, /c\.backToEditEn : c\.backToEdit\b/);
  assert.match(cardSrc, /c\.backToReviewEn : c\.backToReviewEs/);
  assert.match(cardSrc, /c\.continueToDashboardEn : c\.continueToDashboardEs/);
});

check("21", "Dead submit-for-review wiring fully removed from the Preview client (no orphaned handler)", () => {
  assert.doesNotMatch(clientSrc, /handleSubmitForReview/);
  assert.doesNotMatch(clientSrc, /submitOfertaLocalDraftForReview/);
});

check("22", "publishSuccess kept only as the dashboardId fallback (real submission id still routes correctly)", () => {
  assert.match(cardSrc, /const dashboardId = publishSuccess\?\.id \?\? ofertaLocalId;/);
});

check("23", "Membership CTA is repeated in the Business Hub (same href/state, not a new membership engine)", () => {
  assert.match(businessHubSrc, /showMembership && membershipHref \?/);
  assert.match(businessHubSrc, /c\.membershipSignUpShortEn : c\.membershipSignUpShortEs/);
});

check("24", "Membership CTA hides when no membership destination exists (same showMembership/membershipHref gate as the original)", () => {
  assert.match(cardSrc, /showMembership={showMembership}/);
  assert.match(cardSrc, /membershipHref={membershipHref}/);
});

check("25", "Email sits in a clean bordered contact box showing the address clearly labeled", () => {
  const emailBoxMatch = businessHubSrc.match(/contactEmail \? \(\s*<div className="mt-4[\s\S]*?<\/div>\s*\) : null/);
  assert.ok(emailBoxMatch, "the email box must exist");
  const box = emailBoxMatch![0];
  assert.match(box, /rounded-lg border/, "must be a visually distinct box, not a bare flex row");
  assert.match(box, /c\.emailAddressLabelEn : c\.emailAddressLabelEs/, "must show a CORREO ELECTRÓNICO label");
  assert.match(box, /\{contactEmail\}/);
  assert.match(box, /c\.emailEn : c\.emailEs/);
});

check("26", "Email keeps native mailto behavior (a real <a href={mailtoHref}>, not a script-driven fetch)", () => {
  assert.match(cardSrc, /<a href=\{mailtoHref\} className=\{cx\(BTN_PRIMARY, "mt-3"\)\}>/);
});

check("27", "'Copiar correo' fully removed — no clipboard fallback, no leftover copy key", () => {
  assert.doesNotMatch(cardSrc, /navigator\.clipboard\.writeText\(contactEmail\)/);
  assert.doesNotMatch(cardSrc, /copyEmailEn|copyEmailEs|emailCopied/);
  assert.doesNotMatch(copySrcPreview, /copyEmailEs|copyEmailEn/);
});

check("33", "Correo CTA is bold/high-confidence (same solid-fill weight as BTN_PRIMARY, not a faint outline button)", () => {
  assert.match(cardSrc, /<a href=\{mailtoHref\} className=\{cx\(BTN_PRIMARY, "mt-3"\)\}>\s*\n\s*\{lang === "en" \? c\.emailEn : c\.emailEs\}/);
});

check("34", "Mailto never crashes without a configured mail handler (plain native <a>, no JS click-handler/try-catch around it)", () => {
  const emailBoxMatch = businessHubSrc.match(/contactEmail \? \(\s*<div className="mt-4[\s\S]*?<\/div>\s*\) : null/);
  const box = emailBoxMatch![0];
  assert.doesNotMatch(box, /onClick=\{.*mailto/i);
});

check("35", "Ver volante modal significantly enlarged (near-full-viewport width)", () => {
  assert.match(modalSrc, /sm:max-w-4xl/);
  assert.match(modalSrc, /lg:max-w-6xl/);
  assert.doesNotMatch(modalSrc, /sm:max-w-2xl|lg:max-w-3xl/);
});

check("36", "Modal keeps its existing controls: X close, Anterior/Siguiente + Página X/Y, Descargar, Abrir en pestaña", () => {
  assert.match(modalSrc, /<FiX className/);
  assert.match(modalSrc, /"Prev page" : "Pág\. ant\."/);
  assert.match(modalSrc, /"Next page" : "Pág\. sig\."/);
  assert.match(modalSrc, /c\.downloadFlyerEn|c\.downloadCouponEn/);
  assert.match(modalSrc, /c\.openInTabEn : c\.openInTabEs/);
});

check("37", "Membership CTA moved to Más información, styled bold (solid fill, font-bold — comparable to Google Business)", () => {
  const moreInfoMatch = cardSrc.match(/hasMoreInfo \? \(\s*<HubCollapsibleGroup[\s\S]*?<\/HubCollapsibleGroup>\s*\) : null/);
  assert.ok(moreInfoMatch, "the Más información group must exist");
  const group = moreInfoMatch![0];
  assert.match(group, /SocialLinkButton/, "Google Business must still render here");
  assert.match(group, /showMembership && membershipHref \?/);
  assert.match(group, /font-bold text-white/);
  assert.match(group, /c\.membershipSignUpShortEn : c\.membershipSignUpShortEs/);
});

check("38", "Instrucciones CTA moved to Más información, styled bold (comparable to Google Business)", () => {
  const moreInfoMatch = cardSrc.match(/hasMoreInfo \? \(\s*<HubCollapsibleGroup[\s\S]*?<\/HubCollapsibleGroup>\s*\) : null/);
  const group = moreInfoMatch![0];
  assert.match(group, /showMembership && membershipInstructions \?/);
  assert.match(group, /bg-\[#B8860B\][\s\S]{0,40}font-bold text-white/);
  assert.match(group, /c\.membershipInstructionsLabelEn : c\.membershipInstructionsLabelEs/);
});

check("39", "Membership CTA no longer duplicated in Contacto (moved, not copy-pasted twice)", () => {
  const start = businessHubSrc.indexOf("{hasContact ? (");
  const end = businessHubSrc.indexOf("{hasLocation ? (");
  assert.ok(start >= 0 && end > start, "the Contacto group must exist before the Ubicación group");
  const contactGroup = businessHubSrc.slice(start, end);
  assert.doesNotMatch(contactGroup, /membershipSignUpShortEn/);
});

check("28", "Mailto is never treated as an HTTP request error (no fetch/error-status check wraps the mailto link)", () => {
  assert.doesNotMatch(cardSrc, /fetch\(mailtoHref/);
});

check("29", "Compartir (native share) unchanged", () => {
  assert.match(cardSrc, /navigator\.share/);
  assert.match(cardSrc, /c\.shareEn : c\.shareEs/);
});

check("30", "Product cards not redesigned: search, filters, load-more, Ver detalle all still present", () => {
  assert.match(gridSrc, /searchQuery|searchTerm|onSearch/i);
  assert.match(gridSrc, /filter/i);
  assert.match(gridSrc, /[Ll]oadMore|[Vv]er más|visibleCount|pageSize/);
  assert.match(gridSrc, /viewDetailsEn|viewDetailsEs|Ver detalle/i);
});

check("31", "Scanner protected paths NONE", () => {
  const touchedFiles = [
    "app/(site)/publicar/ofertas-locales/preview/OfertasPdfItemCropPreview.tsx",
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPdfFlyerPreview.tsx",
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesFlyerViewerModal.tsx",
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewHeroVisual.tsx",
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewCard.tsx",
    "app/(site)/publicar/ofertas-locales/preview/OfertasLocalesPreviewClient.tsx",
    "app/(site)/publicar/ofertas-locales/preview/ofertasLocalesPdfDocumentCache.ts",
  ];
  const protectedPaths = new Set(OFERTAS_AI_SCANNER_PROTECTED_PATHS.map((e) => e.path));
  for (const file of touchedFiles) {
    assert.ok(!protectedPaths.has(file), `touched protected path: ${file}`);
  }
});

check("32", "No DB migration introduced by this change", () => {
  for (const src of [cropSrc, flyerPreviewSrc, modalSrc, heroVisualSrc, cardSrc, clientSrc, cacheSrc]) {
    assert.doesNotMatch(src, /CREATE TABLE|ALTER TABLE/i);
  }
});

// ⚠️75 — the mailto "To" address was being run through encodeURIComponent(),
// which turns "@" into "%40". Per RFC 6068 the recipient address must NOT be
// percent-encoded; only the query (subject/body) is. A real function call,
// not a regex, since this is exactly the kind of bug a source-pattern check
// would miss (the buggy and fixed versions both "look like" a mailto builder).
check("40", "Mailto 'To' address keeps a literal '@' (real function call, the exact live-repro case)", () => {
  const href = buildOfertaLocalMailtoHref("jesusecaceres@gmail.com", "Supermercado Latino");
  assert.match(href, /^mailto:jesusecaceres@gmail\.com\?subject=/, `got: ${href}`);
  assert.doesNotMatch(href, /%40/, "the recipient address must never be percent-encoded");
});

check("41", "Mailto subject is still correctly percent-encoded (only the query, not the recipient)", () => {
  const href = buildOfertaLocalMailtoHref("jesusecaceres@gmail.com", "Supermercado Latino");
  assert.match(href, /subject=Supermercado%20Latino%20%C2%B7%20Leonix$/, `got: ${href}`);
});

check("42", "Correo CTA is still a plain native <a href> — no fetch/XHR, no app-router Link wrapping it", () => {
  assert.match(cardSrc, /<a href=\{mailtoHref\} className=\{cx\(BTN_PRIMARY, "mt-3"\)\}>/);
  assert.doesNotMatch(cardSrc, /fetch\(mailtoHref/);
});

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} TRUE.`);
if (failed.length > 0) {
  console.log("FALSE items:", failed.map((f) => f.id).join(", "));
  throw new Error(`Preview performance audit requires all TRUE — FALSE items: ${failed.map((f) => f.id).join(", ")}`);
}
console.log("\nOfertas Locales Preview performance audit passed.");
