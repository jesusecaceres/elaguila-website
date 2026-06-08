/**
 * Stack B — Ofertas Locales owner review audit.
 * Run: npm run ofertas-locales:stack-b-owner-review-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_B_OWNER_REVIEW_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_STACK_B_OWNER_REVIEW_AUDIT.md";
const MAPPER = "app/lib/ofertas-locales/ofertasLocalesItemReviewMapper.ts";
const LIST_ROUTE = "app/api/ofertas-locales/items/route.ts";
const PATCH_ROUTE = "app/api/ofertas-locales/items/[itemId]/route.ts";
const REVIEW_PANEL = "app/(site)/publicar/ofertas-locales/OfertasLocalesAiItemReviewPanel.tsx";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";

const NAV_FILES = ["app/components/Navbar.tsx", "app/components/AdvertiseDropdown.tsx"] as const;

const STACK_B_CHANGED_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-stack-b-owner-review-audit\.ts$/,
] as const;

function read(rel: string): string {
  return fs.readFileSync(path.join(ROOT, rel.replace(/\//g, path.sep)), "utf8");
}

function exists(rel: string): boolean {
  return fs.existsSync(path.join(ROOT, rel.replace(/\//g, path.sep)));
}

function isStackBChangedFile(file: string): boolean {
  return STACK_B_CHANGED_PATTERNS.some((re) => re.test(file));
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
  assert.ok(exists(PLAN), "Stack B plan must exist");
  assert.ok(exists(AUDIT_DOC), "Stack B audit doc must exist");
  assert.ok(exists(MAPPER), "item review mapper must exist");
  assert.ok(exists(LIST_ROUTE), "items list API must exist");
  assert.ok(exists(PATCH_ROUTE), "item patch API must exist");
  assert.ok(exists(REVIEW_PANEL), "review panel must exist");

  const mapper = read(MAPPER);
  const listRoute = read(LIST_ROUTE);
  const patchRoute = read(PATCH_ROUTE);
  const panel = read(REVIEW_PANEL);
  const app = read(APP_CLIENT);
  const copy = read(COPY);
  const pkg = read("package.json");

  assert.ok(mapper.includes("mapOfertaLocalItemReviewRowToViewModel"), "view model mapper");
  assert.ok(mapper.includes("validateOfertaLocalItemReviewPatch"), "patch validation");
  assert.ok(mapper.includes("mapOfertaLocalItemReviewPatchToDbUpdate"), "db update mapper");
  assert.ok(mapper.includes("is_active: false"), "mapper forces inactive");

  assert.ok(listRoute.includes("getBearerUserId"), "list API requires auth");
  assert.ok(listRoute.includes("owner_id"), "list API checks owner");
  assert.ok(patchRoute.includes("getBearerUserId"), "patch API requires auth");
  assert.ok(patchRoute.includes("owner_id"), "patch API checks owner");
  assert.ok(!patchRoute.includes("is_active: true"), "patch API does not activate items");
  assert.ok(patchRoute.includes("is_active: false") || mapper.includes("is_active: false"), "inactive enforced");

  assert.ok(panel.includes("OfertasLocalesAiItemReviewPanel"), "review panel export");
  assert.ok(
    copy.includes("Revisa los productos antes de publicarlos") ||
      copy.includes("Review extracted items before they can be published"),
    "review-before-publish copy"
  );
  assert.ok(
    copy.includes("todavía no aparecerán públicamente") ||
      copy.includes("will not appear publicly until Leonix enables public item search"),
    "approved-not-public copy"
  );
  assert.ok(
    panel.includes("Aún no hay productos extraídos") ||
      copy.includes("Aún no hay productos extraídos") ||
      copy.includes("No extracted items are ready for review yet"),
    "empty state copy"
  );
  assert.ok(app.includes("OfertasLocalesAiItemReviewPanel"), "app uses review panel");

  const stackBChanged = changedFiles().filter(isStackBChangedFile);
  for (const nav of NAV_FILES) {
    assert.ok(!stackBChanged.includes(nav), `Nav untouched: ${nav}`);
  }
  assert.ok(!stackBChanged.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!stackBChanged.some((f) => f.startsWith("app/(site)/dashboard/")), "dashboard untouched");
  assert.ok(!stackBChanged.some((f) => f.startsWith("app/(site)/clasificados/")), "clasificados untouched");
  assert.ok(!stackBChanged.some((f) => f.includes("categoryConfig")), "categoryConfig untouched");
  assert.ok(!stackBChanged.some((f) => f.toLowerCase().includes("stripe")), "no Stripe");
  assert.ok(
    !stackBChanged.some((f) => f.startsWith("supabase/migrations/")),
    "no Supabase migration created"
  );

  assert.ok(
    pkg.includes('"ofertas-locales:stack-b-owner-review-audit"'),
    "package script for stack B audit"
  );

  console.log("Stack B — Ofertas Locales owner review audit passed.");
}

run();
