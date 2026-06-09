/**
 * Stack FINAL-2 — Ofertas Locales admin review queue audit.
 * Run: npm run ofertas-locales:final-2-admin-review-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_2_ADMIN_REVIEW_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_2_ADMIN_REVIEW_AUDIT.md";
const ADMIN_PAGE = "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/page.tsx";
const ADMIN_LIST = "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/OfertasLocalesAdminReviewList.tsx";
const ADMIN_ACTIONS = "app/admin/(dashboard)/workspace/clasificados/ofertas-locales/actions.ts";
const ADMIN_HELPERS = "app/lib/ofertas-locales/ofertasLocalesAdminHelpers.ts";
const ADMIN_MUTATIONS = "app/lib/ofertas-locales/ofertasLocalesAdminReviewMutations.ts";
const REVIEW_API = "app/api/ofertas-locales/admin/[id]/review/route.ts";
const PUBLIC_OFFERS = "app/api/ofertas-locales/public-offers/route.ts";
const PUBLIC_SEARCH = "app/api/ofertas-locales/public-search/route.ts";
const ADMIN_LAYOUT = "app/admin/(dashboard)/layout.tsx";

const ALLOWED = [
  /^app\/admin\//,
  /^app\/lib\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-2-admin-review-audit\.ts$/,
] as const;

const FORBIDDEN = [
  /^app\/\(site\)\/dashboard\//,
  /stripe/i,
  /route.?optim/i,
  /sms|email.*shopping/i,
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
  assert.ok(exists(PLAN), "admin review plan must exist");
  assert.ok(exists(AUDIT_DOC), "admin audit doc must exist");
  assert.ok(exists(ADMIN_PAGE), "admin page must exist");
  assert.ok(exists(ADMIN_LIST), "admin list component must exist");
  assert.ok(exists(REVIEW_API), "review API must exist");
  assert.ok(exists(ADMIN_HELPERS), "admin helpers must exist");
  assert.ok(exists(ADMIN_MUTATIONS), "admin mutations must exist");

  const layout = read(ADMIN_LAYOUT);
  const adminPage = read(ADMIN_PAGE);
  const adminList = read(ADMIN_LIST);
  const actions = read(ADMIN_ACTIONS);
  const reviewApi = read(REVIEW_API);
  const mutations = read(ADMIN_MUTATIONS);
  const helpers = read(ADMIN_HELPERS);
  const offers = read(PUBLIC_OFFERS);
  const search = read(PUBLIC_SEARCH);

  assert.match(layout, /requireAdminCookie/, "admin layout must require admin cookie");
  assert.match(adminPage, /listOfertasLocalesAdminRows|ofertas_locales/, "admin page must reference Ofertas Locales records");
  assert.match(adminPage, /listOfertasLocalesAdminRows/, "admin page must list rows");
  assert.match(helpers, /pending_review/, "helpers must include pending_review queue");
  assert.match(adminList, /flyerAssets|couponAssets/, "admin detail must show assets");
  assert.match(adminList, /facebookUrl|instagramUrl|googleReviewUrl|yelpUrl/, "admin detail social links");
  assert.match(adminList, /wantsAiSearchableSpecials|AI Searchable/, "admin detail AI intent");
  assert.match(adminList, /featuredPlacementScope|Featured placement/, "admin detail featured intent");
  assert.match(adminList, /pending_review/, "admin list references pending queue");

  assert.match(actions, /requireAdminCookie/, "server action must require admin");
  assert.match(actions, /approve|reject|archive/, "server action supports review actions");
  assert.match(reviewApi, /requireAdminCookie/, "review API must require admin");
  assert.match(reviewApi, /approve|reject|archive/, "review API supports actions");

  assert.match(mutations, /approved/, "approve sets approved status");
  assert.match(mutations, /rejected/, "reject sets rejected status");
  assert.match(mutations, /archived/, "archive sets archived status");
  assert.match(mutations, /pending_review/, "mutations reference reviewable statuses");

  assert.match(offers, /\.eq\("status",\s*"approved"\)/, "public offers approved only");
  assert.doesNotMatch(offers, /internal_notes/, "public offers must not select internal_notes");
  assert.doesNotMatch(offers, /owner_id/, "public offers must not select owner_id");

  assert.match(search, /ofertas_locales\.status",\s*"approved"\)/, "public search parent approved");
  assert.match(search, /review_status",\s*"approved"\)/, "public search items approved");

  assert.doesNotMatch(offers, /fake|seed.*approved/i, "no fake approved offers");
  assert.doesNotMatch(adminPage, /rating|review_count/i, "no fake ratings in admin");

  const changed = changedFiles();
  const unrelated = changed.filter((f) => !isAllowed(f));
  for (const f of unrelated) {
    const forbidden = FORBIDDEN.some((re) => re.test(f));
    if (forbidden) {
      assert.fail(`forbidden file changed: ${f}`);
    }
  }

  console.log("FINAL-2 admin review audit passed.");
  if (changed.length) {
    console.log("Changed files:", changed.join(", "));
  }
}

run();
