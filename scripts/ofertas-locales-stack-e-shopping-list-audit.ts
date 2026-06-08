/**
 * Stack E — Ofertas Locales shopping list audit.
 * Run: npm run ofertas-locales:stack-e-shopping-list-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_E_SHOPPING_LIST_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_E_SHOPPING_LIST_AUDIT.md";
const HELPERS = "app/lib/ofertas-locales/ofertasLocalesShoppingList.ts";
const HOOK = "app/(site)/clasificados/ofertas-locales/useOfertasLocalesShoppingList.ts";
const PANEL = "app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx";
const SEARCH_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const ITEM_CARD = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx";
const COPY = "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const STACK_E_CHANGED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-stack-e-shopping-list-audit\.ts$/,
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function isStackEChangedFile(file: string): boolean {
  return STACK_E_CHANGED_PATTERNS.some((re) => re.test(file));
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
  assert.ok(exists(PLAN), "Stack E plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack E audit doc must exist");
  assert.ok(exists(HELPERS), "shopping list helper must exist");
  assert.ok(exists(HOOK), "shopping list hook must exist");
  assert.ok(exists(PANEL), "shopping list panel must exist");

  const helpers = read(HELPERS);
  const hook = read(HOOK);
  const panel = read(PANEL);
  const client = read(SEARCH_CLIENT);
  const card = read(ITEM_CARD);
  const copy = read(COPY);
  const pkg = read("package.json");

  assert.ok(helpers.includes("OFERTAS_LOCALES_SHOPPING_LIST_STORAGE_KEY"), "storage key export");
  assert.ok(helpers.includes("leonix:ofertas-locales:shopping-list:v1"), "namespaced storage key");
  assert.ok(helpers.includes("createShoppingListItemFromPublicItem"), "create from public item");
  assert.ok(helpers.includes("groupOfertaLocalShoppingListByBusiness"), "group by business");
  assert.ok(helpers.includes("formatOfertaLocalShoppingListPlainText"), "copy list helper");
  assert.ok(!helpers.includes("internal_notes"), "no internal_notes in helper");
  assert.ok(!helpers.includes("owner_id"), "no owner_id in helper");
  assert.ok(!helpers.includes("supabase"), "no Supabase in helper");

  assert.ok(hook.includes("localStorage"), "hook uses localStorage");
  assert.ok(!hook.includes("/api/"), "hook does not call API for persistence");

  assert.ok(client.includes("useOfertasLocalesShoppingList"), "search client uses hook");
  assert.ok(client.includes("OfertasLocalesShoppingListPanel"), "search client uses panel");
  assert.ok(
    copy.includes("Agregar a lista") && copy.includes("Add to list"),
    "add to list copy"
  );
  assert.ok(card.includes("onAdd") || card.includes("addToList"), "item card supports add");
  assert.ok(panel.includes("routeComingNext") || copy.includes("Ruta de compras próximamente"), "route placeholder");
  assert.ok(!panel.includes("routeOptimization"), "no route optimization");
  assert.ok(copy.includes("Copiar lista") || copy.includes("Copy list"), "copy list copy");

  const stackEChanged = changedFiles().filter(isStackEChangedFile);
  for (const nav of NAV_FILES) {
    assert.ok(!stackEChanged.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!stackEChanged.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!stackEChanged.some((f) => f.startsWith("app/(site)/dashboard/")), "dashboard untouched");
  assert.ok(!stackEChanged.some((f) => f.includes("categoryConfig")), "categoryConfig untouched");
  assert.ok(!stackEChanged.some((f) => f.toLowerCase().includes("stripe")), "no Stripe");
  assert.ok(
    !stackEChanged.some((f) => f.startsWith("supabase/migrations/")),
    "no Supabase migration created"
  );
  assert.ok(
    !stackEChanged.some(
      (f) => f.startsWith("app/(site)/clasificados/") && !f.includes("ofertas-locales")
    ),
    "no unrelated clasificados category files touched"
  );
  assert.ok(
    !stackEChanged.some((f) => f.startsWith("app/api/") && !f.includes("ofertas-locales")),
    "no unrelated API files touched"
  );

  assert.ok(
    pkg.includes('"ofertas-locales:stack-e-shopping-list-audit"'),
    "package script for stack E audit"
  );

  console.log("Stack E — Ofertas Locales shopping list audit passed.");
}

run();
