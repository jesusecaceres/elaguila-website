/**
 * Gate 2D — Comunidad + Clases owner-QA debt closure self-test.
 *
 * Verifies the 7 owner-QA gaps closed in this gate:
 *   1/2/3/7. Checkpoint CTA layout (Comunidad + Clases) — category-owned "compact" path, no
 *            horizontal-scroll/far-right CTA dependency, other categories' checkpoints untouched
 *   4/5/6.   Clases multi-audience: cap/dedupe, legacy single-audience hydration, persistence+search
 *   7/8.     Clases bring/materials/requirements: distinct fields, legacy-safe (no old combined key)
 *   9-12.    Schedule modes: one-time, recurring weekly, date-range, ongoing
 *   13-17.   Payment catalog: Apple Pay/Google Pay/Klarna/Afterpay added with real react-icons
 *            brand marks, Affirm deliberately NOT added (no canonical asset), no fake logos,
 *            "Otro" stays a normal text input
 *   18-20.   Email uses native mailto for Comunidad + Clases (no Leonix custom sheet/modal),
 *            canonical buildMailtoHref safety untouched
 *   21-28.   Prior gate verifiers still pass; no Mascotas/Busco/Revenue-OS files touched; no migration
 *
 * No network, no React. Run from repo root:
 *   npx tsx scripts/gate-2d-community-owner-qa-debt-selftest.ts
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";

import {
  emptyClasesQuickDraft,
  normalizeClasesQuickDraft,
  MAX_CLASES_AUDIENCES,
} from "../app/(site)/publicar/community/shared/types/communityQuickDraft";
import { buildClasesDetailPairs } from "../app/(site)/publicar/clases/lib/clasesPublishPayload";
import { clasesPublishedQuickToDraft, type ClasesPublishedListingLike } from "../app/(site)/publicar/clases/lib/clasesPublishedQuickToDraft";
import { clasesSearchTypeAndLevel } from "../app/(site)/clasificados/clases/shared/clasesSearchBlob";
import type { CommunityListingPairMap } from "../app/(site)/clasificados/community/shared/communityListingDetailPairs";
import {
  CLASES_PAYMENT_METHOD_ORDER,
  isClasesPaymentMethodId,
} from "../app/(site)/publicar/clases/lib/clasesPaymentMethods";
import { buildMailtoHref } from "../app/lib/digitalContact/humanConnection/nativeChannelHrefs";

const ROOT = join(__dirname, "..");
function read(relPath: string): string {
  return readFileSync(join(ROOT, relPath), "utf8");
}
function pairs(entries: Record<string, string>): { label: string; value: string }[] {
  return Object.entries(entries).map(([label, value]) => ({ label, value }));
}

// ---------------------------------------------------------------------------
// 1, 2, 3, 7. Checkpoint CTA layout — Comunidad + Clases category-owned compact path
// ---------------------------------------------------------------------------
{
  const quickLane = read("app/(site)/clasificados/publicar/_components/QuickLaneCheckpointClient.tsx");
  assert.ok(
    /compact\s*=\s*category === "comunidad" \|\| category === "clases"/.test(quickLane),
    "expected Comunidad + Clases to opt into the compact checkpoint layout",
  );
  assert.ok(quickLane.includes("compact={compact}"), "compact flag must actually be forwarded to the stack");

  const checkpoint = read("app/(site)/clasificados/publicar/_components/PublishEntryCheckpoint.tsx");
  assert.ok(checkpoint.includes("compact = false"), "compact must default to false — every other category's checkpoint stays unchanged");
  assert.ok(
    /mt-4 flex flex-wrap items-center gap-3/.test(checkpoint),
    "the Publicar/Ver más CTA row must stay in a wrapping flex row (no far-right/absolute positioning, no horizontal scroll dependency)",
  );
  assert.ok(!/overflow-x-auto|overflow-x-scroll/.test(checkpoint), "checkpoint card must not rely on horizontal scrolling");
  console.log("OK: Comunidad + Clases checkpoint cards get a category-owned compact layout; CTA row has no horizontal-scroll/far-right dependency; other categories unaffected (default false)");
}

// ---------------------------------------------------------------------------
// 4, 5, 6. Multi-audience: cap/dedupe, legacy hydration, persistence + search
// ---------------------------------------------------------------------------
{
  assert.equal(MAX_CLASES_AUDIENCES, 3, "expected a cap of 3 audiences");

  const draft = normalizeClasesQuickDraft({
    audience: "jovenes",
    audiences: ["jovenes", "jovenes", "adultos", "adultos_mayores", "ninos"],
  });
  assert.deepEqual(draft.audiences, ["jovenes", "adultos", "adultos_mayores"], `expected dedupe + cap at 3, got ${JSON.stringify(draft.audiences)}`);
  assert.equal(draft.audience, "jovenes", "audience must mirror audiences[0]");

  const legacyDraft = normalizeClasesQuickDraft({ audience: "adultos" });
  assert.deepEqual(legacyDraft.audiences, ["adultos"], "expected audiences[] to fall back to [audience] when absent (legacy)");

  const multiDraft = { ...emptyClasesQuickDraft(), audiences: ["jovenes", "adultos"] };
  const detailPairs = buildClasesDetailPairs(multiDraft);
  const audPair = detailPairs.find((p) => p.label === "Leonix:audiences");
  assert.equal(audPair?.value, "jovenes,adultos", "expected multi-audience CSV persistence");

  const listing: ClasesPublishedListingLike = { id: "l1", title: { es: "C", en: "C" }, blurb: { es: "", en: "" }, city: "San José" };
  const legacyHydrated = clasesPublishedQuickToDraft(
    pairs({ "Leonix:communityLane": "quick", "Leonix:communityKind": "clases", "Leonix:classCategory": "yoga", "Leonix:audience": "familias" }),
    listing,
    "es",
  );
  assert.deepEqual(legacyHydrated?.audiences, ["familias"], "legacy listing (no Leonix:audiences key) must hydrate to [primary audience]");

  const multiHydrated = clasesPublishedQuickToDraft(
    pairs({
      "Leonix:communityLane": "quick",
      "Leonix:communityKind": "clases",
      "Leonix:classCategory": "yoga",
      "Leonix:audience": "jovenes",
      "Leonix:audiences": "jovenes,adultos_mayores",
    }),
    listing,
    "es",
  );
  assert.deepEqual(multiHydrated?.audiences, ["jovenes", "adultos_mayores"]);

  const { typeLine } = clasesSearchTypeAndLevel(
    { "Leonix:classCategory": "yoga", "Leonix:audiences": "jovenes,adultos_mayores" } as CommunityListingPairMap,
    true,
    "es",
  );
  assert.ok(typeLine.includes("Adultos mayores"), `expected the non-primary audience to remain searchable, got: ${typeLine}`);

  console.log("OK: multi-audience cap/dedupe, legacy single-audience hydration, and full-audience persistence/search all verified");
}

// ---------------------------------------------------------------------------
// 7, 8. Bring / Materials / Requirements — distinct fields, legacy-safe
// ---------------------------------------------------------------------------
{
  const draft = { ...emptyClasesQuickDraft(), bringNote: "Ropa cómoda", materialsNote: "Tapete propio", requirementsNote: "Nivel intermedio" };
  const detailPairs = buildClasesDetailPairs(draft);
  assert.equal(detailPairs.find((p) => p.label === "Leonix:materialsNote")?.value, "Tapete propio");
  assert.equal(detailPairs.find((p) => p.label === "Leonix:requirementsNote")?.value, "Nivel intermedio");

  const listing: ClasesPublishedListingLike = { id: "l2", title: { es: "C", en: "C" }, blurb: { es: "", en: "" }, city: "San José" };
  const legacyHydrated = clasesPublishedQuickToDraft(
    pairs({
      "Leonix:communityLane": "quick",
      "Leonix:communityKind": "clases",
      "Leonix:classCategory": "yoga",
      "Leonix:bringNote": "Ropa cómoda y agua",
    }),
    listing,
    "es",
  );
  assert.equal(legacyHydrated?.bringNote, "Ropa cómoda y agua", "legacy combined bring/materials field must still render");
  assert.equal(legacyHydrated?.materialsNote, "", "legacy listing has no materialsNote — must default empty, not throw");
  assert.equal(legacyHydrated?.requirementsNote, "", "legacy listing has no requirementsNote — must default empty, not throw");

  const canvas = read("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
  const order = ["community-premium-description", "community-premium-bring", "community-premium-materials", "community-premium-requirements"];
  const positions = order.map((needle) => canvas.indexOf(needle));
  assert.ok(positions.every((p) => p >= 0), "expected description/bring/materials/requirements cards all present");
  for (let i = 1; i < positions.length; i++) {
    assert.ok(positions[i]! > positions[i - 1]!, `expected public detail order ${order.join(" -> ")}`);
  }
  console.log("OK: distinct bring/materials/requirements fields persist, legacy combined field still renders, public detail order correct");
}

// ---------------------------------------------------------------------------
// 9-12. Schedule modes
// ---------------------------------------------------------------------------
{
  // 9. One-time
  const oneTimeDraft = {
    ...emptyClasesQuickDraft(),
    scheduleMode: "one_time" as const,
    oneTimeDate: "2026-09-12",
    oneTimeStart: "10:00",
    oneTimeEnd: "12:00",
  };
  const oneTimePairs = buildClasesDetailPairs(oneTimeDraft);
  assert.equal(oneTimePairs.find((p) => p.label === "Leonix:scheduleMode")?.value, "one_time");
  assert.equal(oneTimePairs.find((p) => p.label === "Leonix:oneTimeDate")?.value, "2026-09-12");
  assert.equal(oneTimePairs.find((p) => p.label === "Leonix:oneTimeStart")?.value, "10:00");
  assert.equal(oneTimePairs.find((p) => p.label === "Leonix:oneTimeEnd")?.value, "12:00");
  assert.ok(!oneTimePairs.some((p) => p.label === "Leonix:classStartDate"), "one-time mode must not also persist a date range");

  const listing: ClasesPublishedListingLike = { id: "l3", title: { es: "C", en: "C" }, blurb: { es: "", en: "" }, city: "San José" };
  const oneTimeHydrated = clasesPublishedQuickToDraft(
    pairs({
      "Leonix:communityLane": "quick",
      "Leonix:communityKind": "clases",
      "Leonix:classCategory": "yoga",
      "Leonix:scheduleMode": "one_time",
      "Leonix:oneTimeDate": "2026-09-12",
      "Leonix:oneTimeStart": "10:00",
      "Leonix:oneTimeEnd": "12:00",
    }),
    listing,
    "es",
  );
  assert.equal(oneTimeHydrated?.scheduleMode, "one_time");
  assert.equal(oneTimeHydrated?.oneTimeDate, "2026-09-12");

  // 10, 11. Recurring weekly + date range
  const dateRangeDraft = { ...emptyClasesQuickDraft(), scheduleMode: "recurring" as const, startDate: "2026-09-03", endDate: "2026-10-22" };
  const dateRangePairs = buildClasesDetailPairs(dateRangeDraft);
  assert.equal(dateRangePairs.find((p) => p.label === "Leonix:scheduleMode")?.value, "recurring");
  assert.equal(dateRangePairs.find((p) => p.label === "Leonix:classStartDate")?.value, "2026-09-03");
  assert.equal(dateRangePairs.find((p) => p.label === "Leonix:classEndDate")?.value, "2026-10-22");

  // 12. Ongoing (recurring, no dates) — legacy listings default here (no Leonix:scheduleMode key at all)
  const legacyRecurring = clasesPublishedQuickToDraft(
    pairs({ "Leonix:communityLane": "quick", "Leonix:communityKind": "clases", "Leonix:classCategory": "yoga" }),
    listing,
    "es",
  );
  assert.equal(legacyRecurring?.scheduleMode, "recurring", "legacy listings (no scheduleMode key) must default to recurring — their only prior shape");
  assert.equal(legacyRecurring?.startDate, "");
  assert.equal(legacyRecurring?.endDate, "");

  const canvas = read("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
  assert.ok(canvas.includes("t.ongoingLabel"), "public detail must explicitly label an ongoing (no end date) recurring class, not leave it blank");
  assert.ok(canvas.includes("t.oneTimeLabel"), "public detail must explicitly label a one-time class");

  const form = read("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  assert.ok(form.includes('name="clases-schedule-mode"'), "form must offer an explicit schedule-mode choice, not silently infer it");

  console.log("OK: one-time, recurring weekly, date-range, and explicitly-labeled ongoing schedule modes all supported; legacy listings default safely to recurring");
}

// ---------------------------------------------------------------------------
// 13-17. Payment catalog: Apple Pay / Google Pay / Klarna / Afterpay (real icons), Affirm excluded
// ---------------------------------------------------------------------------
{
  for (const id of ["apple_pay", "google_pay", "klarna", "afterpay"] as const) {
    assert.ok(isClasesPaymentMethodId(id), `expected ${id} to be a recognized Clases payment method`);
    assert.ok(CLASES_PAYMENT_METHOD_ORDER.includes(id), `expected ${id} in the selectable catalog order`);
  }
  assert.ok(!isClasesPaymentMethodId("affirm"), "Affirm must NOT be added — no canonical icon asset exists on the platform");

  const badge = read("app/(site)/publicar/clases/components/ClasesPaymentMethodBadge.tsx");
  assert.ok(badge.includes('from "react-icons/si"'), "brand icons must come from the already-installed react-icons library, not a custom asset");
  assert.ok(/Si(Applepay|Googlepay|Klarna|Afterpay)/.test(badge), "expected the real Simple Icons brand components to be imported");
  assert.ok(!/affirm/i.test(badge), "must not fabricate an Affirm icon");
  const catalog = read("app/(site)/publicar/clases/lib/clasesPaymentMethods.ts");
  assert.ok(!/"affirm"/i.test(catalog), "must not fabricate an Affirm catalog entry (id literal)");

  const form = read("app/(site)/publicar/clases/quick/ClasesQuickApplication.tsx");
  assert.ok(
    /value={state\.paymentMethodOther}[\s\S]{0,120}onChange={\(e\) => patch\({ paymentMethodOther: e\.target\.value }\)}/.test(form),
    "\"Otro\" payment method must remain a normal controlled text input (plain onChange, no keydown blocking of spacebar/paste)",
  );
  assert.ok(!/paymentMethodOther[\s\S]{0,200}onKeyDown/.test(form), "must not add a keydown handler that could block spacebar/paste on the Otro field");

  console.log("OK: Apple Pay/Google Pay/Klarna/Afterpay added with real react-icons brand marks; Affirm deliberately excluded (no canonical asset); no fake logos; Otro stays a normal text input");
}

// ---------------------------------------------------------------------------
// 18-20. Email — native mailto for Comunidad + Clases, canonical safety intact
// ---------------------------------------------------------------------------
{
  const canvas = read("app/(site)/publicar/community/shared/preview/CommunityContactCanvas.tsx");
  assert.ok(!canvas.includes("EmailContactOptionsSheet"), "Comunidad + Clases (shared canvas) must not use the obsolete Leonix custom email sheet/modal");
  assert.ok(/href={mailHref}/.test(canvas), "email CTA must be a plain native <a href> like phone/SMS/WhatsApp, not a JS-opened modal");

  const href = buildMailtoHref("test@example.com", "Hola", "Cuerpo");
  assert.ok(href && href.startsWith("mailto:test@example.com"), "canonical buildMailtoHref must still produce a valid mailto: href");
  assert.equal(buildMailtoHref("javascript:alert(1)"), null, "canonical unsafe-input rejection must be untouched");

  console.log("OK: Comunidad and Clases email now invoke native mailto directly (no custom modal); canonical buildMailtoHref safety unchanged");
}

// ---------------------------------------------------------------------------
// 25-28. Scope discipline — no Mascotas/Busco/Revenue OS files, no migration
// ---------------------------------------------------------------------------
{
  const changedFiles = execSync("git diff --name-only HEAD", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);
  const untrackedFiles = execSync("git status --porcelain", { cwd: ROOT, encoding: "utf8" })
    .split("\n")
    .filter((l) => l.startsWith("??"))
    .map((l) => l.slice(3).trim());
  const allTouched = [...new Set([...changedFiles, ...untrackedFiles])];

  const forbiddenPrefixes = [
    "app/(site)/publicar/mascotas-y-perdidos/",
    "app/(site)/clasificados/mascotas-y-perdidos/",
    "app/(site)/publicar/busco/",
    "app/(site)/clasificados/busco/",
    "app/lib/listingPlans/",
    "app/api/revenue-os/",
  ];
  const violations = allTouched.filter((f) => forbiddenPrefixes.some((p) => f.startsWith(p)));
  assert.equal(violations.length, 0, `expected no Mascotas/Busco/Revenue-OS files touched, found: ${violations.join(", ")}`);

  const migrationTouched = allTouched.some((f) => /supabase\/migrations\//i.test(f) || /\.sql$/i.test(f));
  assert.ok(!migrationTouched, "expected no DB migration files touched");

  console.log("OK: no Mascotas/Busco/Revenue-OS files touched; no DB migration added");
}

// ---------------------------------------------------------------------------
// 21-24. Prior gate verifiers still pass
// ---------------------------------------------------------------------------
{
  for (const script of [
    "scripts/gate-1-comunidad-eventos-qa-selftest.ts",
    "scripts/gate-2a-clases-qa-selftest.ts",
    "scripts/gate-2b-clases-revenue-os-selftest.ts",
    "scripts/gate-2c-community-contact-uri-selftest.ts",
  ]) {
    execSync(`npx tsx ${script}`, { cwd: ROOT, stdio: "pipe" });
  }
  console.log("OK: Gate 1, Gate 2A, Gate 2B, and Gate 2C verifiers still pass after owner-QA debt closure");
}

console.log("gate-2d-community-owner-qa-debt-selftest: PASS");
