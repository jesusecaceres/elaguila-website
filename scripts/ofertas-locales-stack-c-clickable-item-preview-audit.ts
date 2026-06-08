/**
 * Stack C — Ofertas Locales clickable item preview audit.
 * Run: npm run ofertas-locales:stack-c-clickable-item-preview-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_C_CLICKABLE_ITEM_PREVIEW_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_C_CLICKABLE_ITEM_PREVIEW_AUDIT.md";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers.ts";
const PREVIEW_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesClickableItemPreviewPanel.tsx";
const DETAIL_DRAWER = "app/(site)/publicar/ofertas-locales/OfertasLocalesItemDetailDrawer.tsx";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const ITEMS_ROUTE = "app/api/ofertas-locales/items/route.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const STACK_C_CHANGED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-stack-c-clickable-item-preview-audit\.ts$/,
] as const;

const FORBIDDEN_PUBLIC_PATTERNS = [
  /publicar\/ofertas-locales\/resultados/,
  /publicar\/ofertas-locales\/results/,
  /publicar\/ofertas-locales\/producto/,
  /publicar\/ofertas-locales\/item/,
  /shopping-list/i,
  /google.*maps.*route/i,
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function isStackCChangedFile(file: string): boolean {
  return STACK_C_CHANGED_PATTERNS.some((re) => re.test(file));
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .map((x) => x.trim())
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function run() {
  assert.ok(exists(PLAN), "Stack C plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack C audit doc must exist");
  assert.ok(exists(HELPERS), "clickable preview helpers must exist");
  assert.ok(exists(PREVIEW_PANEL), "clickable item preview panel must exist");
  assert.ok(exists(DETAIL_DRAWER), "item detail drawer must exist");

  const helpers = read(HELPERS);
  const panel = read(PREVIEW_PANEL);
  const drawer = read(DETAIL_DRAWER);
  const app = read(APP_CLIENT);
  const copy = read(COPY);
  const itemsRoute = read(ITEMS_ROUTE);
  const pkg = read("package.json");

  assert.ok(helpers.includes("formatOfertaLocalItemPriceDisplay"), "price display helper");
  assert.ok(helpers.includes("getSafeOfertaLocalSourceAssetHref"), "safe asset href helper");
  assert.ok(helpers.includes("highlightSupportDetected: false"), "no fake highlight support");
  assert.ok(
    helpers.includes("highlight overlay pending future extraction coordinates") ||
      helpers.includes("resaltado pendiente de coordenadas futuras"),
    "bounding box note documents full context only"
  );

  assert.ok(panel.includes("OfertasLocalesClickableItemPreviewPanel"), "preview panel export");
  assert.ok(panel.includes("fetchOfertaLocalReviewItems"), "panel uses owner item API");
  assert.ok(!panel.includes("/api/ofertas-locales/public"), "panel does not use public route");
  assert.ok(panel.includes("setSelectedItem"), "items are clickable");
  assert.ok(panel.includes("OfertasLocalesItemDetailDrawer"), "panel opens detail drawer");
  assert.ok(
    copy.includes("Vista previa privada — este producto todavía no aparece públicamente") ||
      panel.includes("clickablePreviewPrivateSafety"),
    "private preview copy"
  );
  assert.ok(
    copy.includes("Los productos aprobados no aparecerán públicamente") ||
      copy.includes("Approved items will not appear publicly until Leonix enables public item search"),
    "approved-not-public copy"
  );
  assert.ok(
    copy.includes("Aún no hay productos para previsualizar") ||
      copy.includes("No items are ready to preview yet"),
    "empty preview copy"
  );

  assert.ok(drawer.includes("OfertasLocalesItemDetailDrawer"), "detail drawer export");
  assert.ok(
    copy.includes("Ver volante o cupón original") || copy.includes("View original flyer or coupon"),
    "source flyer/coupon context copy"
  );
  assert.ok(
    copy.includes("El archivo original está registrado") ||
      copy.includes("The original file is recorded, but the public link is not available yet"),
    "missing source URL copy"
  );
  assert.ok(drawer.includes("getSafeOfertaLocalSourceAssetHref") || drawer.includes("sourceAssetAvailable"), "safe source link logic");
  assert.ok(
    !drawer.includes("highlight overlay") || drawer.includes("boundingBoxNote"),
    "no fake highlight overlay UI"
  );
  assert.ok(
    !drawer.includes("public search is live") && !drawer.includes("búsqueda pública está activa"),
    "drawer does not claim public search is live"
  );

  assert.ok(app.includes("OfertasLocalesClickableItemPreviewPanel"), "app uses clickable preview panel");
  assert.ok(itemsRoute.includes("getBearerUserId"), "items API requires auth");
  assert.ok(itemsRoute.includes("owner_id"), "items API checks owner");

  const stackCChanged = changedFiles().filter(isStackCChangedFile);
  for (const nav of NAV_FILES) {
    assert.ok(!stackCChanged.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!stackCChanged.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!stackCChanged.some((f) => f.startsWith("app/(site)/dashboard/")), "dashboard untouched");
  assert.ok(!stackCChanged.some((f) => f.startsWith("app/(site)/clasificados/")), "clasificados untouched");
  assert.ok(!stackCChanged.some((f) => f.includes("categoryConfig")), "categoryConfig untouched");
  assert.ok(!stackCChanged.some((f) => f.toLowerCase().includes("stripe")), "no Stripe");
  assert.ok(
    !stackCChanged.some((f) => f.startsWith("supabase/migrations/")),
    "no Supabase migration created"
  );

  for (const file of [PREVIEW_PANEL, DETAIL_DRAWER, HELPERS]) {
    const content = read(file);
    for (const pattern of FORBIDDEN_PUBLIC_PATTERNS) {
      assert.ok(!pattern.test(content), `Forbidden public pattern in ${file}: ${pattern}`);
    }
  }

  assert.ok(
    !exists("app/(site)/publicar/ofertas-locales/resultados/page.tsx"),
    "no public results page"
  );
  assert.ok(
    !exists("app/(site)/publicar/ofertas-locales/results/page.tsx"),
    "no public results page (en)"
  );

  assert.ok(
    !panel.includes("bounding box highlight") && !drawer.includes("bounding-box-overlay"),
    "no fake bounding box/highlight language in UI"
  );

  assert.ok(
    pkg.includes('"ofertas-locales:stack-c-clickable-item-preview-audit"'),
    "package script for stack C audit"
  );

  console.log("Stack C — Ofertas Locales clickable item preview audit passed.");
}

run();
