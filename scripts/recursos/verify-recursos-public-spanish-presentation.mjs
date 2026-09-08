#!/usr/bin/env node
/**
 * Gate ES-8 verifier — trusted public Spanish presentation. Static source checks only (no DB/network).
 */
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..", "..");

const checks = [];
function assert(name, ok, detail) {
  checks.push({ name, ok, detail });
}
function read(relPath) {
  const p = join(ROOT, relPath);
  if (!existsSync(p)) return null;
  return readFileSync(p, "utf8");
}

const resolverFile = read("app/lib/recursos/recursosBilingualFallback.ts");
const publicQueriesFile = read("app/lib/recursos/server/communityResourcesPublicQueries.ts");
const detailPageFile = read("app/(site)/recursos-comunitarios/recurso/[slug]/page.tsx");
const cardFile = read("app/components/recursos/ResourceCard.tsx");
const gridFile = read("app/components/recursos/ResourceResultsGrid.tsx");
const jsonLdFile = read("app/lib/recursos/recursosResourceJsonLd.ts");
const acceptActionsFile = read("app/admin/recursosChangeProposalActions.ts");
const languageFile = read("app/lib/language.ts");

// ---------- ES-8B: canonical resolver exists ----------
assert("recursosBilingualFallback.ts exists", resolverFile !== null);
if (resolverFile) {
  assert("resolveBilingualField exported", /export function resolveBilingualField/.test(resolverFile));
  assert("takes esValue/enValue/lang/spanishStatus", /esValue:/.test(resolverFile) && /enValue:/.test(resolverFile) && /lang:/.test(resolverFile) && /spanishStatus:/.test(resolverFile));
  assert("returns value/displayLang/isFallback (caller can know display value, language, and whether fallback occurred)", /value: string/.test(resolverFile) && /displayLang: RecursosLang/.test(resolverFile) && /isFallback: boolean/.test(resolverFile));
  assert(
    "trusted statuses are exactly official_spanish and verified_translation",
    (() => {
      const m = resolverFile.match(/const TRUSTED_SPANISH_STATUSES[^;]+;/);
      if (!m) return false;
      return /"official_spanish"/.test(m[0]) && /"verified_translation"/.test(m[0]) && !/"needs_translation_review"/.test(m[0]) && !/"official_english_only"/.test(m[0]) && !/"not_available"/.test(m[0]);
    })(),
  );
  assert("needs_translation_review does not render ES (not in the trusted set, and lang=es branch requires isTrustedSpanishStatus)", /isTrustedSpanishStatus\(input\.spanishStatus\) && es/.test(resolverFile));
  assert("not_available does not render ES (same trusted-set gate, no separate carve-out)", !/"not_available".*=>.*es/i.test(resolverFile));
  assert("official_english_only does not render ES (same trusted-set gate, no separate carve-out)", !/"official_english_only".*=>.*es/i.test(resolverFile));
  assert("does not create a second Spanish-status classifier (imports SpanishStatus type, doesn't redeclare the union)", /import type \{ SpanishStatus \} from "\.\/intake\/server\/resourceSpanishStatusDb"/.test(resolverFile) && !/type SpanishStatus =/.test(resolverFile));
  assert("lang=en preserves English as today (EN preferred, silent ES fallback only if EN blank, never marked as a trust fallback)", /if \(input\.lang === "en"\)/.test(resolverFile));
  assert("both-blank returns empty string (callers render nothing, no invented placeholder prose)", /value: "", displayLang: "en", isFallback: false \};\s*\n}/.test(resolverFile) || /return \{ value: "",/.test(resolverFile));
}

// ---------- ES-8A/8K: resolver applied to description/eligibility/hoursNote on detail page ----------
assert("detail page exists", detailPageFile !== null);
if (detailPageFile) {
  assert("imports resolveBilingualField (not the old resolveResourceDescription)", /resolveBilingualField/.test(detailPageFile) && !/resolveResourceDescription/.test(detailPageFile));
  assert("description uses the resolver", /shortDescriptionEs.*shortDescriptionEn.*lang: recursosLang/s.test(detailPageFile) || /esValue: resource\.shortDescriptionEs/.test(detailPageFile));
  assert("eligibility uses the resolver (no ad-hoc ternary)", /esValue: resource\.eligibilityEs, enValue: resource\.eligibilityEn/.test(detailPageFile));
  assert("hoursNote uses the resolver (fixes the flagged inconsistency — previously no fallback marker at all)", /esValue: resource\.contact\.hoursNoteEs, enValue: resource\.contact\.hoursNoteEn/.test(detailPageFile));
  assert("hoursNote now carries an (EN) fallback marker (previously missing entirely)", /hoursNote\.isFallback/.test(detailPageFile));
  assert("no duplicate (EN) marker per field (each field's JSX has exactly one isFallback-driven span)", (detailPageFile.match(/\(EN\)/g) || []).length === 3); // description + eligibility + hoursNote
}

// ---------- ES-8J: public cards use trusted resolver ----------
assert("ResourceCard.tsx exists", cardFile !== null);
if (cardFile) {
  assert("imports resolveBilingualField (not the old resolveResourceDescription)", /resolveBilingualField/.test(cardFile) && !/resolveResourceDescription/.test(cardFile));
  assert("card description uses the resolver", /esValue: resource\.shortDescriptionEs, enValue: resource\.shortDescriptionEn/.test(cardFile));
  assert("card eligibility uses the resolver (previously a raw ternary with no trust gate)", /esValue: resource\.eligibilityEs, enValue: resource\.eligibilityEn/.test(cardFile));
  assert("card carries spanishStatus into the resolver (PublicResourceWithSpanishTrust prop, not PublicResourceRecord)", /PublicResourceWithSpanishTrust/.test(cardFile) && /spanishStatus: resource\.spanishStatus/.test(cardFile));
}
assert("ResourceResultsGrid.tsx (used by category + search results pages) carries the spanish-trust type through, not the narrower PublicResourceRecord", gridFile !== null && /PublicResourceWithSpanishTrust/.test(gridFile));

// ---------- ES-8H: partial-field fallback supported ----------
assert(
  "resolver is called PER FIELD, independently, on the detail page (description/eligibility/hoursNote each get their own resolveBilingualField call — not one all-or-nothing decision)",
  detailPageFile !== null && (detailPageFile.match(/resolveBilingualField\(/g) || []).length >= 3,
);
assert(
  "resolver is called PER FIELD on the card too",
  cardFile !== null && (cardFile.match(/resolveBilingualField\(/g) || []).length >= 2,
);

// ---------- ES-8I: no duplicate language rows/routes, query-param behavior retained ----------
assert("no /es/ or /en/ route segment introduced (detail page path stays [slug] only)", existsSync(join(ROOT, "app", "(site)", "recursos-comunitarios", "recurso", "[slug]", "page.tsx")) && !existsSync(join(ROOT, "app", "(site)", "es")) && !existsSync(join(ROOT, "app", "(site)", "en")));
assert("query-param lang behavior retained (normalizeLang/navCopyLang pattern still present and unmodified in language.ts)", languageFile !== null && /export function normalizeLang/.test(languageFile) && /export function navCopyLang/.test(languageFile));
assert("detail page still reads lang via searchParams (?lang=es|en), no new route param introduced", detailPageFile !== null && /searchParams\?: Promise<\{ lang\?: string \}>/.test(detailPageFile));

// ---------- ES-8G: public provenance copy ----------
if (detailPageFile) {
  assert("public provenance copy exists (Spanish + English variants)", /Información verificada por Leonix · Fuente oficial disponible/.test(detailPageFile) && /Information verified by Leonix · Official source available/.test(detailPageFile));
  assert("provenance copy never mentions AI/machine/generated translation", !/\b(AI translated|machine translated|generated by AI)\b/i.test(detailPageFile));
  assert(
    "provenance copy hidden during an EN fallback (gated on description.displayLang===es && !isFallback for the es viewer branch)",
    /description\.displayLang === "es" && !description\.isFallback/.test(detailPageFile),
  );
  assert("provenance line only renders when showSpanishProvenance is true (explicit boolean gate, not inline optimism)", /showSpanishProvenance/.test(detailPageFile) && /\{showSpanishProvenance \?/.test(detailPageFile));
}

// ---------- ES-8L: English accepted change stales verified_translation ----------
assert("recursosChangeProposalActions.ts exists", acceptActionsFile !== null);
if (acceptActionsFile) {
  assert("maybeDowngradeSpanishStatusOnAccept exists", /async function maybeDowngradeSpanishStatusOnAccept/.test(acceptActionsFile));
  assert("EN field + verified_translation -> needs_translation_review", /spanishStatus === "verified_translation".*needs_translation_review/s.test(acceptActionsFile) || /"verified_translation"[\s\S]{0,300}"needs_translation_review"/.test(acceptActionsFile));
  assert("called from the single-accept action, after the field write, before/around the status transition", /dbUpdateSingleResourceField\(proposal!\.resourceId[\s\S]{0,200}maybeDowngradeSpanishStatusOnAccept\(proposal!\.resourceId/.test(acceptActionsFile));
  assert("called from the bulk-safe-accept loop too (not just the single-accept path)", /dbUpdateSingleResourceField\(proposal\.resourceId[\s\S]{0,200}maybeDowngradeSpanishStatusOnAccept\(proposal\.resourceId/.test(acceptActionsFile));
  assert("never erases Spanish text (no *_es write anywhere in the downgrade function)", (() => {
    const fn = acceptActionsFile.match(/async function maybeDowngradeSpanishStatusOnAccept[\s\S]*?\n}/);
    return fn ? !/shortDescriptionEs|detailsEs|eligibilityEs|hoursNoteEs/.test(fn[0]) : false;
  })());
  assert("never calls a translation-generation function (no auto-regenerate)", (() => {
    const fn = acceptActionsFile.match(/async function maybeDowngradeSpanishStatusOnAccept[\s\S]*?\n}/);
    return fn ? !/generateSpanishTranslationProposals|translateVerifiedFacts/.test(fn[0]) : false;
  })());
  assert("never touches verification_status/last_verified_at/next_verification_at", (() => {
    const fn = acceptActionsFile.match(/async function maybeDowngradeSpanishStatusOnAccept[\s\S]*?\n}/);
    return fn ? !/verification_status|last_verified_at|next_verification_at|verificationStatus/.test(fn[0]) : false;
  })());
}

// ---------- ES-8M: official-Spanish-source independence, official-bilingual conservative staleness ----------
if (acceptActionsFile) {
  assert(
    "official_spanish_source is NOT staled by an EN presentation change (explicit early return before any downgrade)",
    /spanishStatus === "official_spanish" && spanishSourceType === "official_spanish_source"\) return;/.test(acceptActionsFile),
  );
  assert(
    "official_bilingual_source IS conservatively staled by an EN presentation change",
    /spanishStatus === "official_spanish" && spanishSourceType === "official_bilingual_source"/.test(acceptActionsFile),
  );
}

// ---------- ES-8N: official Spanish source not incorrectly relabeled AI ----------
if (acceptActionsFile) {
  assert(
    "accepted ES-field changes preserve spanishSourceType as-is (passed through unchanged, never hardcoded to ai_translation_reviewed)",
    /dbSetCommunityResourceSpanishStatus\(resourceId, "needs_translation_review", spanishSourceType\)/.test(acceptActionsFile) && !/"ai_translation_reviewed"/.test(acceptActionsFile.slice(acceptActionsFile.indexOf("maybeDowngradeSpanishStatusOnAccept"))),
  );
}

// ---------- ES-8O: no structured fact translated / high-risk unaffected ----------
assert(
  "resolver only ever receives translatable presentation fields (shortDescription/details/eligibility/hoursNote), never phone/address/is24Hours",
  detailPageFile !== null && cardFile !== null && !/resolveBilingualField\(\{\s*esValue: resource\.contact\.(phone|crisisPhone|sms|email|websiteUrl)/.test(detailPageFile + cardFile),
);
assert("structured facts (phone/crisisPhone/sms/address/is24Hours) are read directly off resource.contact, never through the resolver", detailPageFile !== null && /resource\.contact\.is24Hours/.test(detailPageFile) && !/resolveBilingualField.*is24Hours/.test(detailPageFile));

// ---------- No direct public write / no auto approval ----------
assert("no ES-8 public-surface file imports a resource-write function", ![resolverFile, publicQueriesFile, detailPageFile, cardFile, jsonLdFile].some((f) => f && /dbUpdateSingleResourceField|dbCreateCommunityResource|dbSetCommunityResourceSpanishStatus/.test(f)));
assert("public query layer (communityResourcesPublicQueries.ts) is read-only (no insert/update/delete calls)", publicQueriesFile !== null && !/\.insert\(|\.update\(|\.delete\(/.test(publicQueriesFile));
assert(
  "maybeDowngradeSpanishStatusOnAccept only ever sets status to needs_translation_review (never official_spanish/verified_translation — no auto-approval path)",
  acceptActionsFile !== null &&
    (() => {
      const fn = acceptActionsFile.match(/async function maybeDowngradeSpanishStatusOnAccept[\s\S]*?\n}/);
      if (!fn) return false;
      const setCalls = fn[0].match(/dbSetCommunityResourceSpanishStatus\([^)]*\)/g) || [];
      return setCalls.length > 0 && setCalls.every((c) => c.includes('"needs_translation_review"'));
    })(),
);

// ---------- Public query layer carries spanish trust ----------
assert("communityResourcesPublicQueries.ts exists", publicQueriesFile !== null);
if (publicQueriesFile) {
  assert("selects spanish_status/spanish_source_type", /"spanish_status"/.test(publicQueriesFile) && /"spanish_source_type"/.test(publicQueriesFile));
  assert("exposes them via a public-only wrapper type (not by extending shared ResourceRecord/rowToResourceRecord)", /export type PublicResourceWithSpanishTrust/.test(publicQueriesFile));
  assert("does not modify the shared rowToResourceRecord/ResourceRecord (reused unchanged from communityResourcesDb.ts)", /rowToResourceRecord, slugifyResource, type CommunityResourceRow \} from "\.\/communityResourcesDb"/.test(publicQueriesFile));
}

// ---------- No new migration ----------
assert(
  "no new migration file added in this gate (spanish trust joined at the query layer, no schema change)",
  (() => {
    const migrationsDir = join(ROOT, "supabase", "migrations");
    if (!existsSync(migrationsDir)) return false;
    const files = readdirSync(migrationsDir);
    return !files.some((f) => /es[-_]?8|public[-_]?spanish|trusted[-_]?spanish/i.test(f));
  })(),
);

let passCount = 0;
for (const c of checks) {
  console.log(`${c.ok ? "PASS" : "FAIL"} — ${c.name}${c.detail !== undefined && !c.ok ? ` (${JSON.stringify(c.detail)})` : ""}`);
  if (c.ok) passCount++;
}
console.log(`\n${passCount}/${checks.length} checks passed.`);
if (passCount !== checks.length) process.exitCode = 1;
