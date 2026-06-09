/**
 * Stack FINAL-4 — Ofertas Locales public detail audit.
 * Run: npm run ofertas-locales:final-4-public-detail-audit
 */
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "..");

const PLAN = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_4_PUBLIC_DETAIL_PLAN.md";
const AUDIT_DOC = "app/lib/ofertas-locales/OFERTAS_LOCALES_FINAL_4_PUBLIC_DETAIL_AUDIT.md";
const DETAIL_PAGE = "app/(site)/clasificados/ofertas-locales/[id]/page.tsx";
const DETAIL_VIEW = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx";
const HUB_CARD = "app/(site)/clasificados/ofertas-locales/OfertasLocalesBusinessHubLiteCard.tsx";
const OFFER_CARD = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicOfferCard.tsx";
const DETAIL_HELPERS = "app/lib/ofertas-locales/ofertasLocalesPublicDetailHelpers.ts";
const DETAIL_API = "app/api/ofertas-locales/public-offers/[id]/route.ts";
const PUBLIC_OFFERS = "app/api/ofertas-locales/public-offers/route.ts";
const SEARCH_CLIENT = "app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicSearchClient.tsx";
const FINAL3_DASH = "app/(site)/dashboard/ofertas-locales/page.tsx";
const FINAL3_SCRIPT = "scripts/ofertas-locales-final-3-seller-dashboard-audit.ts";

const ALLOWED = [
  /^app\/\(site\)\/clasificados\/ofertas-locales\//,
  /^app\/lib\/ofertas-locales\//,
  /^app\/api\/ofertas-locales\//,
  /^package\.json$/,
  /^scripts\/ofertas-locales-final-4-public-detail-audit\.ts$/,
] as const;

const FORBIDDEN = [
  /^app\/admin\//,
  /^app\/\(site\)\/dashboard\//,
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
  assert.ok(exists(PLAN), "public detail plan must exist");
  assert.ok(exists(AUDIT_DOC), "public detail audit doc must exist");
  assert.ok(exists(DETAIL_PAGE), "public detail page must exist");
  assert.ok(exists(DETAIL_API), "public detail API must exist");
  assert.ok(exists(DETAIL_HELPERS), "public detail helpers must exist");
  assert.ok(exists(HUB_CARD), "Business Hub Lite card must exist");

  assert.ok(exists(FINAL3_DASH), "FINAL-3 dashboard must exist for verification");
  assert.ok(exists(FINAL3_SCRIPT), "FINAL-3 audit script must exist");

  const detailPage = read(DETAIL_PAGE);
  const detailView = read(DETAIL_VIEW);
  const hub = read(HUB_CARD);
  const card = read(OFFER_CARD);
  const helpers = read(DETAIL_HELPERS);
  const detailApi = read(DETAIL_API);
  const offers = read(PUBLIC_OFFERS);
  const client = read(SEARCH_CLIENT);

  assert.match(helpers, /isOfertaLocalPublicOfferRowEligible/, "detail uses eligibility filter");
  assert.match(helpers, /mapOfertaLocalPublicDetailRowToDetail/, "detail mapper exists");
  assert.match(helpers, /parseOfertaLocalPublishedSocialLinksFromInternalNotes/, "social parse server-side");
  assert.doesNotMatch(
    helpers.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
    /return.*internal_notes/,
    "helpers must not return internal_notes"
  );

  assert.match(detailApi, /fetchPublicOfertaLocalDetailById/, "detail API uses safe fetch");
  assert.match(detailApi, /not_available/, "unavailable response for private ids");

  assert.match(detailPage, /OfertasLocalesPublicDetailUnavailable/, "unavailable state");
  assert.match(detailPage, /fetchPublicOfertaLocalDetailById/, "server-side safe query");

  assert.match(card, /ofertaLocalPublicDetailPath|clasificados\/ofertas-locales\//, "result card links to detail");
  assert.match(card, /viewDeal|Ver oferta|View deal/, "view deal CTA");

  assert.match(detailView, /flyerAssets|couponAssets/, "detail shows assets");
  assert.match(detailView, /OfertasLocalesBusinessHubLiteCard/, "Business Hub Lite on detail");
  assert.match(detailView, /membershipUrl|signUpBeforeYouGo|Regístrate/, "membership block");
  assert.match(detailView, /digitalCouponUrl|activateDigitalCoupons/, "digital coupon block");
  assert.match(detailView, /wantsAiSearchableSpecials|AI Searchable/, "honest AI note");
  assert.doesNotMatch(detailView, /featured.*badge|rating|review_count/i, "no fake featured/reviews");

  assert.match(hub, /googleBusinessUrl|googleReviewUrl|yelpUrl/, "Google/Yelp support");
  assert.match(hub, /directionsHref|directions/, "directions CTA");

  assert.match(offers, /\.eq\("status",\s*"approved"\)/, "list API approved only");
  assert.doesNotMatch(offers, /internal_notes/, "list API no internal_notes");
  assert.doesNotMatch(
    detailApi.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, ""),
    /owner_id/,
    "detail API no owner_id"
  );

  assert.doesNotMatch(client, /OfertasLocalesPublicOfferDetailDrawer/, "drawer replaced by detail route");

  const changed = changedFiles();
  for (const f of changed) {
    if (!isAllowed(f) && FORBIDDEN.some((re) => re.test(f))) {
      assert.fail(`forbidden file changed: ${f}`);
    }
  }

  console.log("FINAL-4 public detail audit passed.");
}

run();
