/**
 * Stack FINAL-1 — Ofertas Locales pipeline truth audit.
 * Run: npm run ofertas-locales:final-1-pipeline-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1_PIPELINE_TRUTH_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_1_PIPELINE_TRUTH_AUDIT.md";
const PUBLISH_ROUTE = "app/api/ofertas-locales/publish/route.ts";
const PUBLIC_OFFERS_ROUTE = "app/api/ofertas-locales/public-offers/route.ts";
const PUBLIC_PAGE = "app/(site)/clasificados/ofertas-locales/page.tsx";
const PUBLIC_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const APP_CLIENT = "app/(site)/publicar/ofertas-locales/OfertasLocalesApplicationClient.tsx";
const APP_COPY = "app/(site)/publicar/ofertas-locales/ofertasLocalesApplicationCopy.ts";
const PUBLISH_MAPPER = "app/lib/ofertas-locales/ofertasLocalesPublishMapper.ts";
const HUB_PAGE = "app/(site)/clasificados/page.tsx";
const PUBLIC_COPY = "app/(site)/clasificados/ofertas-locales/ofertasLocalesPublicSearchCopy.ts";

const STACK_PATTERNS = [
  /^app\/lib\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^app\/\(site\)\/publicar\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/\(site\)\/clasificados\/page\.tsx$/,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-1-pipeline-audit\.ts$/,
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

function isStackFile(file: string): boolean {
  return STACK_PATTERNS.some((re) => re.test(file));
}

function run() {
  assert.ok(exists(PLAN), "FINAL-1 plan must exist");
  assert.ok(exists(AUDIT_DOC), "FINAL-1 audit doc must exist");
  assert.ok(exists(PUBLISH_ROUTE), "publish API must exist");
  assert.ok(exists(PUBLIC_PAGE), "public route must exist");
  assert.ok(exists(PUBLIC_CLIENT), "public search client must exist");

  const publish = read(PUBLISH_ROUTE);
  const offersRoute = read(PUBLIC_OFFERS_ROUTE);
  const client = read(PUBLIC_CLIENT);
  const app = read(APP_CLIENT);
  const appCopy = read(APP_COPY);
  const mapper = read(PUBLISH_MAPPER);
  const hub = read(HUB_PAGE);
  const pubCopy = read(PUBLIC_COPY);
  const pkg = read("package.json");

  assert.ok(publish.includes("getBearerUserId"), "publish requires auth");
  assert.ok(publish.includes("validateOfertaLocalDraftForServerPublish"), "publish server validates");
  assert.ok(mapper.includes('status: "pending_review"'), "mapper sets pending_review");
  assert.ok(!publish.includes('"approved"') || publish.includes("pending_review"), "publish does not approve");
  assert.ok(!publish.includes("published") && !publish.includes("live"), "publish does not publish/live");

  assert.ok(
    appCopy.includes("Enviar para revisión") && appCopy.includes("Submit for review"),
    "submit for review copy"
  );
  assert.ok(
    appCopy.includes("no aparecerá públicamente") || appCopy.includes("will not appear publicly"),
    "reviewed-before-public copy"
  );
  assert.ok(app.includes("submitForReview") || app.includes("submitOfertaLocalDraftForReview"), "wizard submits");

  assert.ok(exists(PUBLIC_OFFERS_ROUTE), "public offers API exists");
  assert.ok(offersRoute.includes('"status", "approved"') || offersRoute.includes('.eq("status", "approved")'), "offers API approved only");
  const offersSelect = offersRoute.match(/\.select\([\s\S]*?\)\s*\)/)?.[0] ?? offersRoute;
  assert.ok(!offersSelect.includes("internal_notes"), "offers API select must not include internal_notes");
  assert.ok(!offersRoute.includes("pending_review"), "offers API excludes pending_review query");

  assert.ok(client.includes("/api/ofertas-locales/public-offers"), "client fetches public offers");
  assert.ok(client.includes("/api/ofertas-locales/public-search"), "client fetches public items");
  assert.ok(pubCopy.includes("Ofertas Locales") || pubCopy.includes("Local Deals"), "landing hero copy");
  assert.ok(client.includes("pipelineEmptyTitle") || pubCopy.includes("Todavía estamos agregando"), "pipeline empty state");
  assert.ok(client.includes("/publicar/ofertas-locales"), "business CTA to publish");
  assert.ok(hub.includes("/clasificados/ofertas-locales"), "hub links to public route");

  const changed = changedFiles().filter(isStackFile);
  assert.ok(!changed.some((f) => f.startsWith("app/admin/")), "admin untouched");
  assert.ok(!changed.some((f) => f.startsWith("app/(site)/dashboard/")), "dashboard untouched");
  assert.ok(!changed.some((f) => f.toLowerCase().includes("stripe")), "no Stripe");
  assert.ok(!changed.some((f) => f.startsWith("supabase/migrations/")), "no migration created");
  assert.ok(!client.includes("route optimization"), "no route optimization");
  assert.ok(!client.includes("shopping-route-builder"), "no route builder");

  assert.ok(pkg.includes('"ofertas-locales:final-1-pipeline-audit"'), "audit script in package.json");

  console.log("Stack FINAL-1 — Ofertas Locales pipeline truth audit passed.");
}

run();
