/**
 * Stack FINAL-3 — Ofertas Locales seller dashboard audit.
 * Run: npm run ofertas-locales:final-3-seller-dashboard-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_3_SELLER_DASHBOARD_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_3_SELLER_DASHBOARD_AUDIT.md";
const DASH_PAGE = "app/(site)/dashboard/ofertas-locales/page.tsx";
const MANAGE_PAGE = "app/(site)/dashboard/ofertas-locales/[id]/page.tsx";
const OWNER_LIST_API = "app/api/ofertas-locales/owner/route.ts";
const OWNER_DETAIL_API = "app/api/ofertas-locales/owner/[id]/route.ts";
const OWNER_HELPERS = "app/lib/ofertas-locales/ofertasLocalesOwnerHelpers.ts";
const OWNER_UPDATE = "app/lib/ofertas-locales/ofertasLocalesOwnerUpdateMapper.ts";
const PUBLIC_OFFERS = "app/api/ofertas-locales/public-offers/route.ts";

const ALLOWED = [
  /^app\/\(site\)\/dashboard\/ofertas-locales\//,
  /^app\/\(site\)\/dashboard\/ofertas-locales\.tsx$/,
  /^app\/lib\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-3-seller-dashboard-audit\.ts$/,
] as const;

const FORBIDDEN = [
  /^app\/admin\//,
  /stripe/i,
  /route.?optim/i,
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
    tracked = execSync("git diff --name-only", { cwd: ROOT, encoding: "utf8" }).split(/\r?\n/).filter(Boolean);
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
  assert.ok(exists(PLAN), "seller dashboard plan must exist");
  assert.ok(exists(AUDIT_DOC), "seller dashboard audit doc must exist");
  assert.ok(exists(DASH_PAGE), "owner dashboard page must exist");
  assert.ok(exists(MANAGE_PAGE), "owner manage page must exist");
  assert.ok(exists(OWNER_LIST_API), "owner list API must exist");
  assert.ok(exists(OWNER_DETAIL_API), "owner detail API must exist");

  const dash = read(DASH_PAGE);
  const manage = read(MANAGE_PAGE);
  const listApi = read(OWNER_LIST_API);
  const detailApi = read(OWNER_DETAIL_API);
  const helpers = read(OWNER_HELPERS);
  const update = read(OWNER_UPDATE);
  const offers = read(PUBLIC_OFFERS);

  assert.match(dash, /getUser|login\?redirect/, "dashboard must require auth");
  assert.match(dash, /ofertas-locales\/owner/, "dashboard must fetch owner API");
  assert.match(dash, /Todavía no has enviado|You have not submitted/, "empty state copy");
  assert.match(dash, /publicar\/ofertas-locales/, "publish CTA");
  assert.match(dash, /pending_review|displayStatus|status/, "status display");

  assert.match(listApi, /getBearerUserId/, "owner list requires bearer auth");
  assert.match(listApi, /owner_id|listOfertasLocalesForOwner/, "owner list filters by owner");
  assert.match(helpers, /mapOfertaLocalRowToOwnerListItem/, "owner list projection");
  assert.match(helpers, /parseOfertaLocalOwnerSafeRejectionNote/, "safe rejection note");

  assert.match(detailApi, /getBearerUserId/, "owner detail requires auth");
  assert.match(detailApi, /getOfertaLocalForOwner/, "ownership verification");
  assert.match(detailApi, /pending_review/, "resubmit sets pending_review");
  assert.match(detailApi, /edit_not_allowed|EDITABLE_STATUSES/, "blocks approved edit");
  assert.match(detailApi, /forbidden_fields|owner_id|internal_notes/, "blocks status escalation fields");

  assert.match(update, /status:\s*"pending_review"/, "update mapper never approves");
  assert.match(manage, /flyerAssets|couponAssets/, "manage shows assets");
  assert.match(manage, /facebookUrl|googleReviewUrl|yelpUrl/, "manage social links");
  assert.match(manage, /wantsAiSearchableSpecials|AI Searchable/, "AI intent");
  assert.match(manage, /featuredPlacement|Featured placement/, "featured intent");

  assert.match(offers, /\.eq\("status",\s*"approved"\)/, "public still approved only");
  assert.doesNotMatch(offers, /internal_notes/, "public no internal_notes");
  assert.doesNotMatch(
    listApi.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
    /internal_notes/,
    "owner list API no internal_notes leak"
  );

  assert.doesNotMatch(dash, /views|clicks|analytics.*fake/i, "no fake analytics on dashboard");

  const changed = changedFiles();
  for (const f of changed) {
    if (!isAllowed(f) && FORBIDDEN.some((re) => re.test(f))) {
      assert.fail(`forbidden file changed: ${f}`);
    }
  }

  console.log("FINAL-3 seller dashboard audit passed.");
}

run();
