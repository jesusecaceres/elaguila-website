import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const read = (p) => readFileSync(join(root, p), "utf8");

const reviewPanel = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx");
const workspace = read("app/(site)/publicar/ofertas-locales/OfertasLocalesAiScanReviewWorkspace.tsx");
const publicDetail = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");
const copy = read("app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts");
const publicCopy = read("app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicDetailCopy.ts");

assert.match(reviewPanel, /min-h-11/);
assert.match(reviewPanel, /aria-live/);
assert.match(reviewPanel, /disabled:cursor-not-allowed/);
assert.match(reviewPanel, /aiReviewLoadFailed/);
assert.match(reviewPanel, /aiReviewSaveFailed/);
assert.match(workspace, /overflow-x-hidden/);
assert.match(workspace, /mobileViewerCollapsed/);
assert.match(publicDetail, /alt=/);
assert.match(publicDetail, /button/);
assert.match(copy, /en:/);
assert.match(copy, /es:/);
assert.match(publicCopy, /en:/);
assert.match(publicCopy, /es:/);
assert.equal(existsSync(join(root, "app/globals.css")), true);
assert.doesNotMatch(reviewPanel + workspace + publicDetail, /global dashboard|Revenue OS|next-intl/i);

console.log("PASS ofertas-local-product-polish-audit");
