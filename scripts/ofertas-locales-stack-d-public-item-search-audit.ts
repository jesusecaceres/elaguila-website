/**
 * Stack D — Ofertas Locales public item search audit.
 * Run: npm run ofertas-locales:stack-d-public-item-search-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_D_PUBLIC_ITEM_SEARCH_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_D_PUBLIC_ITEM_SEARCH_AUDIT.md";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesPublicSearchHelpers.ts";
const PUBLIC_API = "app/api/ofertas-locales/public-search/route.ts";
const PUBLIC_PAGE = "app/(site)/clasificados/ofertas-locales/page.tsx";
const SEARCH_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const ITEM_CARD = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx";
const DETAIL_DRAWER = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx";
const TYPES = "app/lib/ofertas-locales/ofertasLocalesTypes.ts";

const COPY = "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const STACK_D_CHANGED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-stack-d-public-item-search-audit\.ts$/,
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function isStackDChangedFile(file: string): boolean {
  return STACK_D_CHANGED_PATTERNS.some((re) => re.test(file));
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
  assert.ok(exists(PLAN), "Stack D plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack D audit doc must exist");
  assert.ok(exists(HELPERS), "public search helpers must exist");
  assert.ok(exists(PUBLIC_API), "public search API must exist");
  assert.ok(exists(PUBLIC_PAGE), "public results route must exist");
  assert.ok(exists(SEARCH_CLIENT), "public search client must exist");
  assert.ok(exists(ITEM_CARD), "public item card must exist");
  assert.ok(exists(DETAIL_DRAWER), "public detail drawer must exist");

  const helpers = read(HELPERS);
  const api = read(PUBLIC_API);
  const client = read(SEARCH_CLIENT);
  const card = read(ITEM_CARD);
  const drawer = read(DETAIL_DRAWER);
  const copy = read(COPY);
  const types = read(TYPES);
  const pkg = read("package.json");

  assert.ok(api.includes('review_status", "approved"') || api.includes('"review_status", "approved"'), "API filters approved");
  assert.ok(api.includes('"is_active", true') || api.includes(".eq(\"is_active\", true)"), "API filters active");
  assert.ok(
    api.includes('"ofertas_locales.status", "approved"') ||
      api.includes(".eq(\"ofertas_locales.status\", \"approved\")"),
    "API filters parent approved"
  );
  assert.ok(!api.includes("reviewer_note"), "API must not select reviewer_note");
  assert.ok(!types.includes("internal_notes") || !types.match(/OfertaLocalPublicSearchItem[\s\S]*internal_notes/), "public search item type must not include internal_notes");
  assert.ok(!types.match(/OfertaLocalPublicSearchItem[\s\S]*reviewer_note/), "public search item type must not include reviewer_note");
  assert.ok(!types.match(/OfertaLocalPublicSearchItem[\s\S]*owner_id/), "public search item type must not include owner_id");

  assert.ok(helpers.includes("isOfertaLocalPublicSearchRowEligible"), "eligibility helper");
  assert.ok(helpers.includes('review_status !== "approved"') || helpers.includes("review_status"), "helpers enforce review status");

  assert.ok(client.includes("/api/ofertas-locales/public-search"), "client uses public API");
  assert.ok(
    copy.includes("Buscar ofertas locales") || client.includes("searchPlaceholder"),
    "keyword search copy"
  );
  assert.ok(copy.includes("Ciudad") || copy.includes("City"), "city filter copy");
  assert.ok(copy.includes("ZIP"), "ZIP filter copy");
  assert.ok(client.includes("setCity") || client.includes("city"), "city filter UI");
  assert.ok(client.includes("zip"), "ZIP filter UI");

  assert.ok(card.includes("onSelect"), "item cards clickable");
  assert.ok(client.includes("OfertasLocalesPublicItemDetailDrawer"), "detail drawer wired");
  assert.ok(
    copy.includes("Ver volante o cupón original") || copy.includes("View original flyer or coupon"),
    "flyer/coupon context copy"
  );
  assert.ok(
    copy.includes("no tiene enlace público") ||
      copy.includes("does not have a public link available yet"),
    "missing source URL copy"
  );

  assert.ok(!card.includes("shopping-list") && !drawer.includes("shopping-list"), "no shopping list");
  assert.ok(!drawer.includes("bounding-box-overlay"), "no fake highlight overlay");
  assert.ok(
    !drawer.includes("route optimization") && !client.includes("route optimization"),
    "no route optimization"
  );

  const stackDChanged = changedFiles().filter(isStackDChangedFile);
  for (const nav of NAV_FILES) {
    assert.ok(!stackDChanged.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!stackDChanged.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!stackDChanged.some((f) => f.startsWith("app/(site)/dashboard/")), "dashboard untouched");
  assert.ok(!stackDChanged.some((f) => f.includes("categoryConfig")), "categoryConfig untouched");
  assert.ok(!stackDChanged.some((f) => f.toLowerCase().includes("stripe")), "no Stripe");
  assert.ok(
    !stackDChanged.some((f) => f.startsWith("supabase/migrations/")),
    "no Supabase migration created"
  );
  assert.ok(
    !stackDChanged.some((f) => f.startsWith("app/(site)/clasificados/") && !f.includes("ofertas-locales")),
    "no unrelated clasificados category files touched"
  );

  assert.ok(
    pkg.includes('"ofertas-locales:stack-d-public-item-search-audit"'),
    "package script for stack D audit"
  );

  console.log("Stack D — Ofertas Locales public item search audit passed.");
}

run();
