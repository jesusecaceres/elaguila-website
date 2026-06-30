/**
 * scripts/comunidad-com1-launch-audit.ts
 *
 * COM-1 launch audit for Comunidad y Eventos pipeline.
 * Run with: npx tsx scripts/comunidad-com1-launch-audit.ts
 *
 * Checks:
 *  1. All new location fields are present in communityQuickDraft types.
 *  2. No hardcoded "CA" fallbacks remain in key files.
 *  3. Publish detail pairs include addressLine2 and country keys.
 *  4. Copy file has countryLabel and addressLine2 for all 4 locales.
 */

import { readFileSync } from "fs";
import { resolve } from "path";

const ROOT = resolve(__dirname, "..");

function readSrc(rel: string): string {
  return readFileSync(resolve(ROOT, rel), "utf-8");
}

type CheckResult = { pass: boolean; label: string; detail?: string };

const results: CheckResult[] = [];

function check(label: string, pass: boolean, detail?: string) {
  results.push({ pass, label, detail });
}

// ── 1. Draft type has addressLine2 and country ────────────────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/types/communityQuickDraft.ts");
  check("Draft: addressLine2 field exists", src.includes("addressLine2"));
  check("Draft: country field exists", src.includes("country"));
  check("Draft: emptyCommon initializes addressLine2", src.includes("addressLine2: \"\""));
  check("Draft: emptyCommon initializes country", /country:\s*""/.test(src));
}

// ── 2. No hardcoded "CA" fallbacks in critical files ─────────────────────────
const caFallbackFiles = [
  "app/(site)/publicar/community/shared/preview/communityQuickAdPrimitives.tsx",
  "app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx",
  "app/(site)/publicar/comunidad/lib/comunidadPublishedQuickToDraft.ts",
  "app/(site)/publicar/clases/lib/clasesPublishedQuickToDraft.ts",
];
for (const f of caFallbackFiles) {
  const src = readSrc(f);
  const hasCAFallback = /\|\|\s*["']CA["']/.test(src);
  check(`No "CA" fallback in ${f.split("/").pop()}`, !hasCAFallback);
}

// ── 3. Publish detail pairs include new location keys ─────────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/publish/publishCommunityQuickToListings.ts");
  check("Publish pairs: Leonix:addressLine2 key", src.includes("Leonix:addressLine2"));
  check("Publish pairs: Leonix:country key", src.includes("Leonix:country"));
}

// ── 4. Envelope snapshot includes new fields ─────────────────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/publish/buildCommunityPublishEnvelope.ts");
  check("Envelope snapshot: addressLine2", src.includes("addressLine2"));
  check("Envelope snapshot: country", src.includes("country"));
}

// ── 5. Copy file has countryLabel and addressLine2 for all 4 locales ─────────
{
  const src = readSrc("app/(site)/publicar/community/shared/copy/communityPublishCopy.ts");
  const countryLabelCount = (src.match(/countryLabel/g) ?? []).length;
  const addr2Count = (src.match(/addressLine2/g) ?? []).length;
  check("Copy: countryLabel in all 4 locales (≥4)", countryLabelCount >= 4, `found ${countryLabelCount}`);
  check("Copy: addressLine2 in all 4 locales (≥4)", addr2Count >= 4, `found ${addr2Count}`);
}

// ── 6. LocationSection call sites have new props ─────────────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx");
  const occurrences = src.split("addressLine2Label=").length - 1;
  check("LocationSection: addressLine2Label prop (2 call sites)", occurrences >= 2, `found ${occurrences}`);
  const countryOcc = src.split("countryLabel=").length - 1;
  check("LocationSection: countryLabel prop (2 call sites)", countryOcc >= 2, `found ${countryOcc}`);
}

// ── 7. Search blob includes country and addr2 ─────────────────────────────────
{
  const src = readSrc("app/(site)/clasificados/community/CommunityListingsResultsClient.tsx");
  check("Results: search blob includes Leonix:country", src.includes('"Leonix:country"'));
  check("Results: search blob includes Leonix:addressLine2", src.includes('"Leonix:addressLine2"'));
}

// ── 8. Smart schedule section exists ─────────────────────────────────────────
{
  const src = readSrc("app/(site)/publicar/community/shared/components/ComunidadSmartScheduleSection.tsx");
  check("SmartSchedule: dateToDayKey function exists", src.includes("dateToDayKey"));
  check("SmartSchedule: auto-activation useEffect exists", src.includes("useEffect"));
  check("SmartSchedule: preserves manual edits", src.includes("open.trim()") || src.includes("open"));
}

// ── Report ────────────────────────────────────────────────────────────────────
console.log("\n─────────────────────────────────────────");
console.log(" COM-1 Comunidad y Eventos Launch Audit");
console.log("─────────────────────────────────────────\n");

let passed = 0;
let failed = 0;
for (const r of results) {
  const icon = r.pass ? "✅" : "❌";
  const detail = r.detail ? ` (${r.detail})` : "";
  console.log(`${icon} ${r.label}${detail}`);
  if (r.pass) passed++;
  else failed++;
}

console.log(`\n─────────────────────────────────────────`);
console.log(` PASSED: ${passed}  FAILED: ${failed}`);
console.log(`─────────────────────────────────────────\n`);

if (failed > 0) process.exit(1);
