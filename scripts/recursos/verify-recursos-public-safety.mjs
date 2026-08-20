import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..", "..");

function read(rel) {
  return fs.readFileSync(path.join(root, rel), "utf8");
}
function exists(rel) {
  return fs.existsSync(path.join(root, rel));
}

const checks = [];
function assert(name, condition, detail) {
  checks.push({ name, ok: Boolean(condition), detail });
}

/** Recursively collect files under a dir matching an extension filter. */
function collectFiles(dir, exts) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const out = [];
  const walk = (d) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (exts.some((e) => entry.name.endsWith(e))) out.push(path.relative(root, full).split(path.sep).join("/"));
    }
  };
  walk(abs);
  return out;
}

const PUBLIC_ROUTE_FILES = collectFiles("app/(site)/recursos-comunitarios", [".tsx", ".ts"]);
const PUBLIC_COMPONENT_FILES = collectFiles("app/components/recursos", [".tsx", ".ts"]);
const ALL_PUBLIC_FILES = [...PUBLIC_ROUTE_FILES, ...PUBLIC_COMPONENT_FILES, "app/sitemap.ts"].filter((f) => exists(f));

assert("found Recursos public route files", PUBLIC_ROUTE_FILES.length > 0, PUBLIC_ROUTE_FILES.length);
assert("found Recursos public component files", PUBLIC_COMPONENT_FILES.length > 0, PUBLIC_COMPONENT_FILES.length);

// ---- No direct table query anywhere in the public surface ----
const DIRECT_QUERY_RE = /\.from\(\s*["']community_resources["']\s*\)/;
for (const f of ALL_PUBLIC_FILES) {
  const src = read(f);
  assert(`no direct .from("community_resources") in ${f}`, !DIRECT_QUERY_RE.test(src), f);
}

// ---- Every route/component that reads resource data imports the two safety-gated functions
// (or a helper — recursosResourceJsonLd/recursosUrls/urgencyStyle/etc. — that never queries) ----
const DATA_READING_ROUTE_FILES = [
  "app/(site)/recursos-comunitarios/page.tsx",
  "app/(site)/recursos-comunitarios/[category]/page.tsx",
  "app/(site)/recursos-comunitarios/resultados/page.tsx",
  "app/(site)/recursos-comunitarios/recurso/[slug]/page.tsx",
  "app/sitemap.ts",
];
for (const f of DATA_READING_ROUTE_FILES) {
  assert(`${f} exists`, exists(f));
  if (!exists(f)) continue;
  const src = read(f);
  const usesApproved = /listPublicCommunityResources|getPublicCommunityResourceBySlug/.test(src);
  assert(`${f} uses an approved safety-gated query function`, usesApproved, f);
}

// ---- Detail route: fetch via getPublicCommunityResourceBySlug, notFound() on null ----
const DETAIL_ROUTE = "app/(site)/recursos-comunitarios/recurso/[slug]/page.tsx";
if (exists(DETAIL_ROUTE)) {
  const src = read(DETAIL_ROUTE);
  assert("detail route imports getPublicCommunityResourceBySlug", /getPublicCommunityResourceBySlug/.test(src));
  assert("detail route calls notFound() when the resource is null", /if\s*\(\s*!resource\s*\)\s*notFound\(\)/.test(src));
  assert("detail route never imports the admin write DB module", !/from\s+["'].*communityResourcesDb["']/.test(src));
}

// ---- Address-withheld safety exists in the render path ----
const detailSrc = exists(DETAIL_ROUTE) ? read(DETAIL_ROUTE) : "";
assert("detail route checks addressWithheldForSafety before rendering an address", /addressWithheldForSafety/.test(detailSrc));
assert("detail route has a distinct withheld-address branch (never falls through to a raw address)", /addressWithheld\s*\?/.test(detailSrc));

const ctaAdapterSrc = exists("app/lib/recursos/resourceCtaAdapter.ts") ? read("app/lib/recursos/resourceCtaAdapter.ts") : "";
assert(
  "resourceCtaAdapter's directions intent is gated on addressWithheldForSafety",
  /addressWithheldForSafety\)\s*return null/.test(ctaAdapterSrc),
);

// ---- is24Hours gates the 24/7 UI — never inferred from urgency/category ----
assert(
  "detail route's 24/7 badge is gated by contact.is24Hours (never inferred from urgencyLevel alone)",
  /is24Hours\s*\?/.test(detailSrc) || /contact\.is24Hours/.test(detailSrc),
);
assert(
  "detail route does not infer 24/7 from urgencyLevel/category/crisisPhone text matching",
  !/is24Hours\s*=\s*true/.test(detailSrc) && !/crisisPhone\s*&&.*is24/i.test(detailSrc),
);

// ---- CTA rendering hides unsupported actions (never a disabled fake button) ----
const quickActionsSrc = exists("app/components/recursos/ResourceQuickActions.tsx") ? read("app/components/recursos/ResourceQuickActions.tsx") : "";
assert("ResourceQuickActions returns null when no actions are available (hides, never fakes)", /shown\.length === 0\) return null/.test(quickActionsSrc));
assert("ResourceQuickActions filters to only actions with a real backing intent", /available\s*=\s*order\.filter/.test(quickActionsSrc));

// ---- internal-only fields never rendered publicly ----
for (const f of ALL_PUBLIC_FILES) {
  const src = read(f);
  assert(`internalNotes never referenced in ${f}`, !/internalNotes/.test(src), f);
  assert(`partnerStatus never referenced in ${f}`, !/partnerStatus/.test(src), f);
  assert(`printEligible never referenced in ${f}`, !/printEligible/.test(src), f);
}

// ---- Sitemap obtains resources through the approved query function only ----
const sitemapSrc = exists("app/sitemap.ts") ? read("app/sitemap.ts") : "";
assert("sitemap.ts imports listPublicCommunityResources", /listPublicCommunityResources/.test(sitemapSrc));
assert("sitemap.ts contains no direct table query", !DIRECT_QUERY_RE.test(sitemapSrc));

// ---- 12 categories preserved exactly ----
const EXPECTED_CATEGORIES = [
  "urgent-safety",
  "food-basic-needs",
  "housing-rent",
  "mental-health-recovery",
  "health-clinics",
  "legal-immigration",
  "babies-kids-parents",
  "youth-education",
  "jobs-training",
  "seniors-disability",
  "transportation-access",
  "community-support",
];
if (exists("app/lib/recursos/categories.ts")) {
  const src = read("app/lib/recursos/categories.ts");
  const slugMatches = [...src.matchAll(/slug:\s*"([a-z-]+)"/g)].map((m) => m[1]);
  assert("categories.ts declares exactly the 12 locked category slugs, in order", JSON.stringify(slugMatches) === JSON.stringify(EXPECTED_CATEGORIES), slugMatches);
}

// ---- No machine translation layer introduced ----
// Comments are stripped before matching: this doctrine is deliberately documented in prose
// ("...rather than auto-translate...") right next to the code that enforces it, and that prose
// legitimately contains the word "translate" without being a translation layer.
function stripJsComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/[^\n]*/g, "");
}
const TRANSLATION_RE = /translate|Translation|google-translate|deepl|GoogleTranslate/i;
for (const f of ALL_PUBLIC_FILES) {
  const codeOnly = stripJsComments(read(f));
  assert(`no machine-translation layer referenced in ${f}`, !TRANSLATION_RE.test(codeOnly), f);
}
if (exists("app/lib/recursos/recursosBilingualFallback.ts")) {
  const src = read("app/lib/recursos/recursosBilingualFallback.ts");
  assert(
    "bilingual fallback helper never invents Spanish text (English fallback only)",
    /isEnglishFallback/.test(src) && !TRANSLATION_RE.test(stripJsComments(src)),
  );
}

// ---- Search V1 stays keyword/category/urgency only — no geolocation/cost/audience filters wired publicly ----
const filterFormSrc = exists("app/components/recursos/RecursosFilterForm.tsx") ? read("app/components/recursos/RecursosFilterForm.tsx") : "";
assert("public filter form has no geolocation input", !/geolocation|navigator\.geolocation/i.test(filterFormSrc));

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
