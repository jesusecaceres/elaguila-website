/**
 * Stack FINAL-AI-1 — Ofertas Locales AI scan + public items + shopping list map V1 audit.
 * Run: npm run ofertas-locales:final-ai-1-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_AI_1_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_AI_1_AUDIT.md";
const SCAN_ROUTE = "app/api/ofertas-locales/scan/route.ts";
const SCAN_ID_ROUTE = "app/api/ofertas-locales/[id]/scan/route.ts";
const SCAN_HANDLER = "app/lib/ofertas-locales/ofertasLocalesScanApiHandler.ts";
const DOC_AI_CONFIG = "app/lib/ofertas-locales/ofertasLocalesDocumentAiConfig.ts";
const ITEMS_ROUTE = "app/api/ofertas-locales/items/route.ts";
const ITEM_PATCH = "app/api/ofertas-locales/items/[itemId]/route.ts";
const REVIEW_AUTH = "app/lib/ofertas-locales/ofertasLocalesReviewAuth.ts";
const ITEM_ACTIVATION = "app/lib/ofertas-locales/ofertasLocalesItemReviewActivation.ts";
const ITEM_MAPPER = "app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts";
const PUBLIC_SEARCH_API = "app/api/ofertas-locales/public-search/route.ts";
const PUBLIC_SEARCH_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const ITEM_CARD = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx";
const ITEM_DRAWER = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx";
const SHOPPING_LIST = "app/lib/ofertas-locales/ofertasLocalesShoppingList.ts";
const SHOPPING_PANEL = "app/(site)/clasificados/ofertas-locales/OfertasLocalesShoppingListPanel.tsx";
const REVIEW_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx";
const OWNER_AI = "app/(site)/dashboard/ofertas-locales/[id]/OfertasLocalesOwnerAiManageSection.tsx";
const ADMIN_AI = "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminAiItemReviewSection.tsx";
const ADMIN_MUTATIONS = "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts";
const CLICKABLE_HELPERS = "app/lib/ofertas-locales/ofertasLocalesClickableItemPreviewHelpers.ts";

const ALLOWED = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^app\/\(site\)\/dashboard\/ofertas-locales\//,
  /^app\/admin\/\(dashboard\)\/workspace\/clasificados\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-ai-1-audit\.ts$/,
] as const;

const FORBIDDEN = [
  /stripe/i,
  /routes\.googleapis\.com\/directions\/v2:computeRoutes/,
  /twilio/i,
  /sendgrid/i,
  /resend/i,
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function changedFiles(): string[] {
  let tracked: string[] = [];
  let untracked: string[] = [];
  try {
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    tracked = [];
  }
  try {
    untracked = execSync("git ls-files --others --exclude-standard", { cwd: ROOT, encoding: "utf8" })
      .split(/\r?\n/)
      .filter(Boolean);
  } catch {
    untracked = [];
  }
  return [...new Set([...tracked, ...untracked])].map((x) => x.replace(/\\/g, "/"));
}

function isAllowed(file: string): boolean {
  return ALLOWED.some((re) => re.test(file));
}

function run() {
  assert.ok(exists(PLAN), "FINAL-AI-1 plan must exist");
  assert.ok(exists(AUDIT_DOC), "FINAL-AI-1 audit doc must exist");
  assert.ok(exists(SCAN_ROUTE), "scan route must exist");
  assert.ok(exists(SCAN_ID_ROUTE), "[id]/scan route must exist");
  assert.ok(exists(SCAN_HANDLER), "scan handler must exist");

  const scanHandler = read(SCAN_HANDLER);
  const docAi = read(DOC_AI_CONFIG);
  const itemsRoute = read(ITEMS_ROUTE);
  const itemPatch = read(ITEM_PATCH);
  const reviewAuth = read(REVIEW_AUTH);
  const activation = read(ITEM_ACTIVATION);
  const mapper = read(ITEM_MAPPER);
  const publicApi = read(PUBLIC_SEARCH_API);
  const publicClient = read(PUBLIC_SEARCH_CLIENT);
  const shoppingList = read(SHOPPING_LIST);
  const shoppingPanel = read(SHOPPING_PANEL);
  const reviewPanel = read(REVIEW_PANEL);
  const adminMutations = read(ADMIN_MUTATIONS);
  const clickable = read(CLICKABLE_HELPERS);

  assert.match(reviewAuth, /resolveOfertasLocalesOwnerOrAdminAuth/, "review auth helper");
  assert.match(scanHandler, /resolveOfertasLocalesOwnerOrAdminAuth/, "scan requires owner/admin auth");
  assert.match(
    scanHandler,
    /isOfertaLocalDocumentAiConfigured|processOfertaLocalAssetWithDocumentAi/,
    "scan references Document AI via handler imports"
  );
  assert.match(docAi, /GOOGLE_DOCUMENT_AI_CREDENTIALS_JSON/, "Document AI env defined");
  assert.doesNotMatch(scanHandler, /NEXT_PUBLIC.*DOCUMENT_AI/, "no public Document AI creds");

  assert.match(scanHandler, /status: "processing"/, "scan job processing state");
  assert.match(scanHandler, /status: "needs_review"/, "scan job needs_review state");
  assert.match(scanHandler, /status: "failed"/, "scan job failed state");
  assert.match(scanHandler, /is_active: false/, "candidates inactive by default");

  assert.match(itemsRoute, /resolveOfertasLocalesOwnerOrAdminAuth/, "items list auth");
  assert.match(itemPatch, /resolveOfertasLocalesOwnerOrAdminAuth/, "item patch auth");
  assert.match(itemPatch, /mapOfertaLocalItemReviewPatchToDbUpdate/, "item patch mapper");
  assert.match(activation, /parentOfferStatus !== "approved"/, "activation gated by parent");

  assert.match(reviewPanel, /handleStatusAction/, "approve/reject actions");
  assert.match(reviewPanel, /reviewStatus/, "review status patch");
  assert.ok(exists(OWNER_AI), "owner AI manage section");
  assert.ok(exists(ADMIN_AI), "admin AI review section");

  assert.match(publicApi, /\.eq\("review_status", "approved"\)/, "public requires approved items");
  assert.match(publicApi, /\.eq\("is_active", true\)/, "public requires active items");
  assert.match(publicApi, /\.eq\("ofertas_locales.status", "approved"\)/, "public requires approved parent");
  assert.doesNotMatch(
    publicApi.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
    /owner_id/,
    "public search API must not select owner_id"
  );

  assert.ok(exists(ITEM_CARD), "public item cards");
  assert.ok(exists(ITEM_DRAWER), "item detail drawer");
  assert.match(clickable, /highlightSupportDetected: false/, "no fake bounding box highlight");

  assert.match(shoppingList, /buildOfertaLocalShoppingListGoogleMapsDirUrl/, "maps dir builder");
  assert.match(shoppingList, /google\.com\/maps\/dir/, "google maps dir URL");
  assert.match(shoppingPanel, /buildOfertaLocalShoppingListGoogleMapsDirUrl/, "shopping panel uses maps");
  assert.doesNotMatch(shoppingList, /routes\.googleapis\.com/, "no Routes API in shopping list");

  assert.match(adminMutations, /oferta_local_items/, "admin mutations touch items on offer approve");

  for (const file of changedFiles()) {
    if (file.startsWith(".next/")) continue;
    if (!exists(file)) continue;
    if (
      file !== "package.json" &&
      file !== "scripts/ofertas-locales-final-ai-1-audit.ts" &&
      /\.(ts|tsx|js|mjs)$/.test(file)
    ) {
      const content = read(file);
      if (FORBIDDEN.some((re) => re.test(file) || re.test(content))) {
        throw new Error(`Forbidden pattern in changed file: ${file}`);
      }
    }
    if (!isAllowed(file)) {
      throw new Error(`Changed file outside FINAL-AI-1 allowlist: ${file}`);
    }
  }

  console.log("ofertas-locales-final-ai-1-audit: OK");
}

run();
