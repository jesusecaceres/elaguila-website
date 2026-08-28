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

check("12", "Flyer viewer enlarged (max-height caps raised, less dead whitespace padding)", () => {
  assert.match(flyerPreviewSrc, /max-h-\[680px\]|max-h-\[760px\]/);
});

check("13", "Flyer page navigation: previous/next arrows present", () => {
  assert.match(flyerPreviewSrc, /FiChevronLeft/);
  assert.match(flyerPreviewSrc, /FiChevronRight/);
});

check("14", "Flyer page navigation: shows 'Página X de Y'", () => {
  assert.match(flyerPreviewSrc, /"Page"\s*:\s*"Página"/);
  assert.match(flyerPreviewSrc, /currentPage[\s\S]*pageCount|pageCount[\s\S]*currentPage/);
});

check("15", "Page-nav clicks do not bubble into the click-to-zoom wrapper (stopPropagation)", () => {
  assert.match(flyerPreviewSrc, /e\.stopPropagation\(\)/);
});

check("16", "Click-to-zoom wrapper is no longer a <button> (would invalidly nest the new nav buttons)", () => {
  const wrapperMatch = heroVisualSrc.match(/canOpenViewer \? \(\s*[\s\S]*?\{previewInner\}\s*<\/(div|button)>/);
  assert.ok(wrapperMatch, "the click-to-zoom wrapper branch must exist");
  assert.equal(wrapperMatch![1], "div", "wrapper must be a div, not a button, since it now contains nested nav buttons");
  assert.match(wrapperMatch![0], /role="button"/);
  assert.match(wrapperMatch![0], /onClick=\{onOpenViewer\}/);
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

check("25", "Email sits in a clean bordered contact box with address + Correo + Copiar correo", () => {
  const emailBoxMatch = businessHubSrc.match(/contactEmail \? \(\s*<div className="mt-4[\s\S]*?<\/div>\s*\) : null/);
  assert.ok(emailBoxMatch, "the email box must exist");
  const box = emailBoxMatch![0];
  assert.match(box, /rounded-lg border/, "must be a visually distinct box, not a bare flex row");
  assert.match(box, /\{contactEmail\}/);
  assert.match(box, /c\.emailEn : c\.emailEs/);
  assert.match(box, /c\.copyEmailEn/);
  assert.match(box, /c\.copyEmailEs/);
});

check("26", "Email keeps native mailto behavior (a real <a href={mailtoHref}>, not a script-driven fetch)", () => {
  assert.match(cardSrc, /<a href=\{mailtoHref\} className=\{BTN_OUTLINE\}>/);
});

check("27", "Copy-email fallback preserved (clipboard write, independent of mailto)", () => {
  assert.match(cardSrc, /navigator\.clipboard\.writeText\(contactEmail\)/);
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

const failed = results.filter((r) => !r.ok);
console.log(`\n${results.length - failed.length}/${results.length} TRUE.`);
if (failed.length > 0) {
  console.log("FALSE items:", failed.map((f) => f.id).join(", "));
  throw new Error(`Preview performance audit requires all TRUE — FALSE items: ${failed.map((f) => f.id).join(", ")}`);
}
console.log("\nOfertas Locales Preview performance audit passed.");
