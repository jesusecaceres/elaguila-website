/**
 * LAUNCH — Empleos lane classification + decisions (San Jose launch).
 * Run: node node_modules/tsx/dist/cli.mjs --tsconfig scripts/lib/tsconfig.harness.json scripts/verify-launch-empleos-lanes-01.ts
 *
 * LANE CLASSIFICATION (from current source; nothing here invents support):
 *   Quick   = the ONLY paid, staff-sold, launch-offered job lane. empleos_job_post_paid, $24.99 flat.
 *             Staff launcher -> /publicar/empleos/quick; assisted save + server-backed reopen already wired.
 *   Feria   = FREE community lane (empleos_job_fair_free, $0). Public hub offers it to customers; staff do NOT
 *             sell it (no staff product; the launcher has one Empleos product).
 *   Premium = LEGACY route. Not linked from the public hub (hub = Quick + Feria only), no staff product, no
 *             pricing key of its own; it still resolves for pre-existing rows (dashboard edit redirect, preview).
 *   Empleos is NOT a Quick/Full business product ($249/$399 never apply).
 * DECISIONS: A staff reopen = Quick only (explicit, not a gap) · B SMS hidden where the lane has no independent
 * SMS (never derived from call phone) · C address verification stays on Quick + Feria; Premium is legacy and is
 * not adopted · D related-job cards now use the shared translation layer · E canonical URL untouched.
 */
import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { QUICK_SALES_CATEGORY_MAP } from "../app/lib/sales/quickSalesCategories";
import { STAFF_CATEGORY_PRICED_PACKAGE_KEYS, isStaffBusinessPairExcluded } from "../app/lib/sales/staffBusinessProduct";
import { resolveStaffOpenIntakeNavigation, STAFF_INTAKE_FORBIDDEN_PATHS } from "../app/lib/sales/staffServiciosGateway";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import { EMPLEOS_PUBLISH_ROUTES } from "../app/(site)/publicar/empleos/shared/constants/empleosPublishRoutes";
import { normalizeEmpleosQuickDraft } from "../app/(site)/publicar/empleos/shared/types/empleosQuickDraft";
import { hydrateQuickDraftFromEnvelope } from "../app/(site)/publicar/empleos/shared/lib/empleosDraftFromEnvelope";
import { buildEmpleosPublishEnvelopeFromQuick } from "../app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope";
import { resolveLeonixSiteOrigin } from "../app/lib/siteOrigin";
import { empleosJobPublicAbsoluteUrl } from "../app/(site)/clasificados/empleos/lib/empleosSiteUrl";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");

const failures: string[] = [];
const passed: string[] = [];
let checks = 0;
function check(name: string, fn: () => void) {
  checks += 1;
  try {
    fn();
    passed.push(name);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

const quickClient = read("app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx");
const feriaClient = read("app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx");
const premiumClient = read("app/(site)/publicar/empleos/premium/EmpleoPremiumApplicationClient.tsx");
const hub = read("app/(site)/publicar/empleos/EmpleosPublicarHubClient.tsx");
const launcher = read("app/lib/sales/staffMasterLauncher.ts");
const readiness = read("app/lib/sales/canonicalPublishReadiness.ts");

// ── A. Lane classification / staff reopen scope ───────────────────────────────────────────────────
check("A1: staff launcher sells exactly ONE Empleos product -> the Quick paid intake (no Premium/Feria product)", () => {
  assert.equal(QUICK_SALES_CATEGORY_MAP.empleos.intakePath, "/publicar/empleos/quick");
  const block = launcher.slice(launcher.indexOf('id: "empleos"'), launcher.indexOf('id: "autos-privado"'));
  assert.ok(block.includes("singleProduct({"), "single product");
  assert.ok(block.includes("STAFF_CATEGORY_PRICED_PACKAGE_KEYS.empleos"));
  assert.ok(!/premium|feria/i.test(block), "no Premium/Feria staff product in the launcher");
  assert.equal(STAFF_CATEGORY_PRICED_PACKAGE_KEYS.empleos, "empleos_job_post_paid");
});

check("A2: staff intake navigation REFUSES Premium and Feria for Empleos (only Quick opens)", () => {
  for (const forbidden of [EMPLEOS_PUBLISH_ROUTES.premium, EMPLEOS_PUBLISH_ROUTES.feria, EMPLEOS_PUBLISH_ROUTES.hub]) {
    assert.ok(STAFF_INTAKE_FORBIDDEN_PATHS.empleos.includes(forbidden), `${forbidden} is a forbidden staff destination`);
    const nav = resolveStaffOpenIntakeNavigation({
      selectedCategory: "empleos",
      liveCustody: { category: "empleos", intakePath: forbidden },
    });
    assert.equal(nav.allowed, false, `${forbidden} must not open for staff`);
  }
  const ok = resolveStaffOpenIntakeNavigation({
    selectedCategory: "empleos",
    liveCustody: { category: "empleos", intakePath: EMPLEOS_PUBLISH_ROUTES.quick },
  });
  assert.equal(ok.allowed, true);
});

check("A3: assisted publish-readiness recognises only the Quick lane (Premium/Feria are never staff-published)", () => {
  assert.ok(readiness.includes('"empleos lane is not quick"'));
  assert.ok(readiness.includes("hydrateQuickDraftFromEnvelope"));
  assert.ok(!/hydratePremiumDraftFromEnvelope|hydrateFeriaDraftFromEnvelope/.test(readiness));
});

check("A4: Quick client keeps the server-backed reopen (same row): useAssistedBoundRow('empleos') + hydrate + listing id", () => {
  assert.ok(quickClient.includes('useAssistedBoundRow("empleos")'));
  assert.ok(quickClient.includes("hydrateQuickDraftFromEnvelope("));
  assert.ok(quickClient.includes("setServerListingId(listingId)"));
  assert.ok(quickClient.includes("assistedBound.markHydrated()"));
});

check("A5: Premium/Feria clients do NOT wire the staff assisted-reopen spine (no invented support)", () => {
  assert.ok(!premiumClient.includes("useAssistedBoundRow"));
  assert.ok(!feriaClient.includes("useAssistedBoundRow"));
});

check("A6: public hub offers only Quick (paid) and Feria (free); Premium is not linked", () => {
  assert.ok(hub.includes("EMPLEOS_PUBLISH_ROUTES.quick"));
  assert.ok(hub.includes("EMPLEOS_PUBLISH_ROUTES.feria"));
  assert.ok(!hub.includes("EMPLEOS_PUBLISH_ROUTES.premium"));
  assert.ok(!/["'`]\/publicar\/empleos\/premium/.test(hub));
});

check("A7: pricing untouched — paid post $24.99 flat one-time, feria free $0; Empleos excluded from $249/$399", () => {
  const paid = getRevenuePackageDefinition("empleos_job_post_paid");
  assert.ok(paid);
  assert.equal(paid!.priceCents, 2499);
  assert.equal(paid!.billingMode, "one_time");
  const free = getRevenuePackageDefinition("empleos_job_fair_free");
  assert.ok(free);
  assert.equal(free!.priceCents, 0);
  assert.equal(free!.billingMode, "free");
  assert.equal(isStaffBusinessPairExcluded("empleos"), true);
  assert.equal(getRevenuePackageDefinition("empleos_job_post_premium"), null, "no Premium price key exists");
});

// ── B. SMS truth ───────────────────────────────────────────────────────────────────────────────────
check("B1: Quick keeps an INDEPENDENT smsPhone end to end (input -> envelope -> hydrate), never derived from the call phone", () => {
  assert.ok(quickClient.includes("patch({ smsPhone:"), "Quick has its own SMS input");
  const draft = normalizeEmpleosQuickDraft({
    title: "Crew lead",
    businessName: "El Sazón",
    city: "Oakland",
    state: "CA",
    stateRegion: "CA",
    country: "United States",
    jobType: "tiempo-completo",
    schedule: "L-V",
    payAmount: "28",
    payUnit: "hora",
    description: "Crew lead.",
    images: [{ id: "i", url: "https://cdn.example.test/j.jpg", alt: "x", isMain: true }],
    phone: "5105550100",
    smsPhone: "5105550102",
    email: "jobs@example.test",
  });
  const back = hydrateQuickDraftFromEnvelope(buildEmpleosPublishEnvelopeFromQuick(draft, "es"));
  assert.equal(back!.smsPhone, "5105550102");
  assert.equal(back!.phone, "5105550100");
});

check("B2: phone present + NO sms => SMS stays empty (hidden), never fabricated from the call phone", () => {
  const draft = normalizeEmpleosQuickDraft({
    title: "Crew lead",
    businessName: "El Sazón",
    city: "Oakland",
    state: "CA",
    stateRegion: "CA",
    country: "United States",
    jobType: "tiempo-completo",
    schedule: "L-V",
    payAmount: "28",
    payUnit: "hora",
    description: "Crew lead.",
    images: [{ id: "i", url: "https://cdn.example.test/j.jpg", alt: "x", isMain: true }],
    phone: "5105550100",
    email: "jobs@example.test",
  });
  const env = buildEmpleosPublishEnvelopeFromQuick(draft, "es");
  assert.ok(!String((env as { quick?: { smsPhone?: string } }).quick?.smsPhone ?? "").trim(), "no sms in envelope");
  const back = hydrateQuickDraftFromEnvelope(env);
  assert.equal(String(back!.smsPhone ?? "").trim(), "");
  const cta = read("app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx");
  assert.ok(cta.includes("const hasSms = Boolean(smsPhone?.trim())"), "detail SMS action renders only for a real SMS number");
});

check("B3: Premium/Feria carry no SMS field or render — classified GREEN by hiding, not invented (Feria uses contactPhone)", () => {
  const premiumDraft = read("app/(site)/publicar/empleos/shared/types/empleosPremiumDraft.ts");
  const feriaDraft = read("app/(site)/publicar/empleos/shared/types/empleosFeriaDraft.ts");
  const premiumSnap = read("app/(site)/publicar/empleos/shared/publish/empleosPublishSnapshots.ts");
  assert.ok(!/smsPhone/.test(premiumDraft) && !/smsPhone/.test(feriaDraft));
  const premiumBlock = premiumSnap.slice(premiumSnap.indexOf("EmpleosPremiumPublishSnapshot"));
  assert.ok(!/smsPhone/.test(premiumBlock.slice(0, premiumBlock.indexOf("EmpleosFeriaPublishSnapshot") > 0 ? premiumBlock.indexOf("EmpleosFeriaPublishSnapshot") : 4000)));
  assert.ok(!/sms:/i.test(read("app/(site)/clasificados/empleos/components/premiumJob/EmpleoPremiumDetailPage.tsx")));
});

// ── C. Address ─────────────────────────────────────────────────────────────────────────────────────
check("C1: shared verified address is used on Quick and Feria; Premium (legacy, unlinked) keeps its plain field by decision", () => {
  assert.ok(quickClient.includes("BusinessAddressVerifiedInput"));
  assert.ok(feriaClient.includes("BusinessAddressVerifiedInput"));
  assert.ok(!premiumClient.includes("BusinessAddressVerifiedInput"));
  assert.ok(premiumClient.includes("employerAddress"), "Premium editing of existing rows is untouched");
});

// ── D. Related-job translation ─────────────────────────────────────────────────────────────────────
check("D1: related-job cards on BOTH detail clients go through the shared translation layer (same as results list)", () => {
  const card = read("app/(site)/clasificados/empleos/components/EmpleosRelatedJobCard.tsx");
  assert.ok(card.includes("EmpleosJobTranslationLayer"));
  assert.ok(card.includes("translateControl"));
  assert.ok(card.includes("EmpleosJobResultCard"));
  assert.ok(!/requestAdTranslation|fetch\(/.test(card), "no second translator");
  const results = read("app/(site)/clasificados/empleos/components/EmpleosResultsView.tsx");
  assert.ok(results.includes("EmpleosJobTranslationLayer"), "results list keeps its layer");
  for (const rel of [
    "app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx",
    "app/(site)/clasificados/empleos/EmpleosPublicLaneDetailClient.tsx",
  ]) {
    const src = read(rel);
    assert.ok(src.includes("<EmpleosRelatedJobCard"), `${rel} renders the translatable related card`);
    assert.ok(!src.includes("<EmpleosJobResultCard"), `${rel} no longer renders raw untranslated related cards`);
    assert.ok(src.includes("<EmpleosJobTranslationLayer job={job}"), `${rel} keeps the main-listing layer`);
  }
});

// ── E. Canonical output preserved ──────────────────────────────────────────────────────────────────
check("E1: Empleos public URL still derives from the canonical Leonix origin (siteOrigin), never a deployment host", () => {
  const src = read("app/(site)/clasificados/empleos/lib/empleosSiteUrl.ts");
  assert.ok(src.includes('from "@/app/lib/siteOrigin"') && src.includes("resolveLeonixSiteOrigin()"));
  const url = empleosJobPublicAbsoluteUrl("my-job", "en");
  assert.ok(url.startsWith(resolveLeonixSiteOrigin() + "/clasificados/empleos/my-job"));
  assert.ok(url.endsWith("?lang=en"));
  assert.ok(!url.includes("vercel.app"));
});

check("E2: shared Quick share drawer and bilingual discovery adapter are still in place", () => {
  const cta = read("app/(site)/clasificados/empleos/components/quickJob/QuickJobCTACard.tsx");
  assert.ok(/share/i.test(cta));
  assert.ok(read("app/(site)/clasificados/empleos/EmpleoPublicDetailClient.tsx").includes("EmpleosJobTranslationLayer job={job}"));
});

console.log(`\n${passed.length}/${checks} passed`);
for (const p of passed) console.log(`  OK   ${p}`);
if (failures.length) {
  console.error(`\n${failures.length} FAILED`);
  for (const f of failures) console.error(`  FAIL ${f}`);
  process.exit(1);
}
console.log("\nverify-launch-empleos-lanes-01: ALL CHECKS EXECUTED AND PASSED");
