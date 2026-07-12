/**
 * Stack E — Ofertas Locales shopping list audit (V1.1A + Results Mode V1).
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
const ITEM_DRAWER = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx";
const COPY = "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const STACK_E_CHANGED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-stack-e-shopping-list-audit\.ts$/,
] as const;

const FAKE_STRINGS = [
  "checkout",
  "payment",
  "wallet",
  "account synced",
  "saved to account",
  "routeOptimization",
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

function assertNoFakeStrings(scope: string, source: string) {
  for (const fake of FAKE_STRINGS) {
    assert.ok(!source.toLowerCase().includes(fake), `${scope} must not include fake string: ${fake}`);
  }
}

function run() {
  assert.ok(exists(PLAN), "Stack E plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack E audit doc must exist");
  assert.ok(exists(HELPERS), "shopping list helper must exist");
  assert.ok(exists(HOOK), "shopping list hook must exist");
  assert.ok(exists(PANEL), "shopping list panel must exist");
  assert.ok(exists(ITEM_DRAWER), "item detail drawer must exist");

  const helpers = read(HELPERS);
  const hook = read(HOOK);
  const panel = read(PANEL);
  const client = read(SEARCH_CLIENT);
  const card = read(ITEM_CARD);
  const drawer = read(ITEM_DRAWER);
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
  assert.ok(client.includes("OfertasFloatingShoppingListCart"), "floating cart entry component");
  assert.ok(
    client.includes("ofertas-floating-shopping-list-cart") ||
      client.includes("fixed bottom-"),
    "floating cart uses fixed bottom positioning"
  );
  assert.ok(client.includes("!isCupones"), "cart entry gated off Cupones surface");
  assert.ok(client.includes("shoppingListTitle"), "cart entry uses shopping list title copy");
  assert.ok(client.includes("shoppingListEmptyHelper"), "cart entry uses empty helper copy");
  assert.ok(client.includes("setListOpen(true)"), "cart entry opens shopping list panel");
  assert.ok(
    client.includes("itemCount") || client.includes("counts.itemCount"),
    "cart entry uses item count badge"
  );
  assert.ok(
    !client.includes("OfertasShoppingListCartEntry"),
    "legacy inline cart row removed in favor of floating entry"
  );

  assert.ok(client.includes("intentResultsHref"), "discovery intent route helper");
  assert.ok(client.includes('mode: "flyers"'), "weekly flyer intent mode");
  assert.ok(client.includes('mode: "coupons"'), "coupon intent mode");
  assert.ok(client.includes('mode: "promos"'), "promotion intent mode");
  assert.ok(client.includes('mode: "stores"'), "local store intent mode");
  assert.ok(client.includes('mode: "services"'), "local service intent mode");
  assert.ok(client.includes('mode: "food"'), "food intent mode");
  assert.ok(copy.includes("Destacados en Leonix"), "ES featured visibility copy");
  assert.ok(copy.includes("Featured on Leonix"), "EN featured visibility copy");
  assert.ok(!copy.includes("Patrocinadores de Leonix"), "removed Patrocinadores de Leonix from Ofertas base copy");
  assert.ok(!copy.toLowerCase().includes("magazine holder"), "no magazine holder pipeline wording");
  assert.ok(!copy.toLowerCase().includes("where to find us"), "no where-to-find-us pipeline wording");

  assert.ok(copy.includes("parseOfertasLocalesResultMode") || client.includes("parseOfertasLocalesResultMode"), "result mode parser wired");
  assert.ok(copy.includes("ofertasLocalesResultModeCopy") || client.includes("ofertasLocalesResultModeCopy"), "result mode copy helper");
  assert.ok(copy.includes("Volantes semanales"), "ES flyers mode title");
  assert.ok(copy.includes("Weekly flyers"), "EN flyers mode title");
  assert.ok(copy.includes("Buscar por producto"), "ES products mode title");
  assert.ok(copy.includes("Search by product"), "EN products mode title");
  assert.ok(client.includes("ofertas-results-mode-intro"), "mode-aware results intro block");
  assert.ok(client.includes("showItemsFirst"), "product-first ordering logic");
  assert.ok(!copy.toLowerCase().includes("magazine holder pipeline"), "no magazine holder pipeline wording");
  assert.ok(!copy.toLowerCase().includes("fake partner"), "no fake partner wording");

  const publicOffersRoute = read("app/api/ofertas-locales/public-offers/route.ts");
  const publicSearchRoute = read("app/api/ofertas-locales/public-search/route.ts");
  const publishRoute = read("app/api/ofertas-locales/publish/route.ts");
  assert.ok(publicOffersRoute.includes('.eq("status", "approved")'), "public offers require approved status");
  assert.ok(
    publicSearchRoute.includes('.eq("review_status", "approved")') &&
      publicSearchRoute.includes(".eq(\"is_active\", true)") &&
      publicSearchRoute.includes('.eq("ofertas_locales.status", "approved")'),
    "public search triple gate on items"
  );
  assert.ok(publishRoute.includes("pending_review"), "publish inserts pending_review not public approved");
  assert.ok(client.includes("/api/ofertas-locales/public-offers"), "client calls public offers API");
  assert.ok(client.includes("/api/ofertas-locales/public-search"), "client calls public search API");

  const adminReviewMutations = read("app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts");
  const itemReviewActivation = read("app/lib/ofertas-locales/ofertasLocalesItemReviewActivation.ts");
  const itemReviewMapper = read("app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts");
  const adminReviewRoute = read("app/api/ofertas-locales/admin/[id]/review/route.ts");
  const itemsRoute = read("app/api/ofertas-locales/items/[itemId]/route.ts");

  assert.ok(
    adminReviewMutations.includes("syncOfertaLocalItemsActivationAfterAdminReview"),
    "admin review syncs child item activation"
  );
  assert.ok(
    adminReviewMutations.includes('.eq("review_status", "approved")') &&
      adminReviewMutations.includes("is_active: true"),
    "parent approve activates already-approved items"
  );
  assert.ok(
    adminReviewMutations.includes("item_activation_failed") ||
      adminReviewMutations.includes("item_deactivation_failed"),
    "admin item sync surfaces errors"
  );
  assert.ok(
    adminReviewMutations.includes("published_at"),
    "parent approve sets published_at"
  );
  assert.ok(
    itemReviewActivation.includes("shouldOfertaLocalItemBePubliclyActive"),
    "public activation rule helper exported"
  );
  assert.ok(
    itemReviewActivation.includes('parentOfferStatus !== "approved"'),
    "item activation requires approved parent"
  );
  assert.ok(
    itemReviewMapper.includes("resolveOfertaLocalItemIsActiveOnReviewPatch"),
    "item PATCH uses activation resolver"
  );
  assert.ok(
    adminReviewRoute.includes("mutateOfertaLocalAdminReview"),
    "admin review route uses mutation helper"
  );
  assert.ok(
    adminReviewRoute.includes("/clasificados/ofertas-locales/results"),
    "admin approve revalidates public results"
  );
  assert.ok(
    itemsRoute.includes("mapOfertaLocalItemReviewPatchToDbUpdate") &&
      itemsRoute.includes("parentStatus"),
    "item PATCH route passes parent status into review mapper"
  );

  assert.ok(
    copy.includes("Agregar a lista") && copy.includes("Add to list"),
    "add to list copy"
  );
  assert.ok(copy.includes("shoppingListTitle"), "shoppingListTitle copy key");
  assert.ok(copy.includes("shoppingListOpen"), "shoppingListOpen copy key");
  assert.ok(
    copy.includes("Agrega productos para planear tu visita.") &&
      copy.includes("Add items to plan your visit."),
    "ES/EN shopping list empty helper text"
  );
  assert.ok(copy.includes("viewList"), "viewList copy key");
  assert.ok(copy.includes("savedOnDevice"), "savedOnDevice copy key");
  assert.ok(copy.includes("mapHandoffNote"), "mapHandoffNote copy key");
  assert.ok(copy.includes("Guardado en este dispositivo"), "ES saved-on-device copy");
  assert.ok(copy.includes("Saved on this device"), "EN saved-on-device copy");
  assert.ok(
    copy.includes("no es optimización automática") &&
      copy.includes("not automatic route optimization"),
    "map handoff truth copy ES/EN"
  );
  assert.ok(copy.includes("Copiar lista") || copy.includes("Copy list"), "copy list copy");

  assert.ok(card.includes("onAdd") || card.includes("addToList"), "item card supports add");

  assert.ok(drawer.includes("isAdded"), "detail drawer isAdded prop");
  assert.ok(drawer.includes("onAdd"), "detail drawer onAdd prop");
  assert.ok(drawer.includes("onRemove"), "detail drawer onRemove prop");
  assert.ok(drawer.includes("onOpenList"), "detail drawer onOpenList prop");
  assert.ok(drawer.includes("addToList") || drawer.includes("c.addToList"), "detail drawer add CTA");
  assert.ok(drawer.includes("viewList") || drawer.includes("c.viewList"), "detail drawer view list CTA");

  assert.ok(panel.includes("savedOnDevice") || panel.includes("c.savedOnDevice"), "panel saved-on-device");
  assert.ok(panel.includes("mapHandoffNote") || panel.includes("c.mapHandoffNote"), "panel map handoff note");
  assert.ok(panel.includes("groupOfertaLocalShoppingListByBusiness") || panel.includes("group"), "panel groups by store");
  assert.ok(!panel.includes("routeOptimization"), "no route optimization");

  assertNoFakeStrings("panel", panel);
  assertNoFakeStrings("drawer", drawer);
  assertNoFakeStrings("search client", client);

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

  console.log("Stack E — Ofertas Locales shopping list + results mode audit passed.");
}

run();
