/**
 * LEONIX QUICK CLASSIFIEDS — SIMPLE ON-RAMP + STAFF QUICK APPLICATIONS — source-contract verifier.
 * Run: npx tsx scripts/verify-quick-classifieds-onramp-01.ts
 *
 * Same hand-rolled node:assert convention as every other verify-*.ts in this repo (no jest/vitest).
 * Proves the OWNER LOCKS held:
 *  1. ONE PWA — no second manifest, the launchpad lives inside StaffCommandCenter (additive insertion).
 *  2. NO REDESIGN — no canonical application / preview / publisher / renderer / registry / pricing file changed.
 *  3. NO SECOND AUTH — Quick routes sit under app/(site)/publicar/layout.tsx (PublishAuthGateLayout); no
 *     signInWithOtp / password / cookie code in the Quick tree.
 *  4. NO STAFF OWNERSHIP — Quick never writes an owner id, never calls a publish API, never uploads media.
 *  5. MEDIA LOCK — minImages is 1 in every definition; Empleos is honestly BLOCKED_BY_EXISTING_MEDIA_OUTPUT.
 *  6. PRICING LOCK — no new packageKey; every paid posture names an existing matrix key.
 *  7. ONE FRAMEWORK — one registry, one adapter per live category, each writing through the category's own
 *     canonical draft store and running the category's own preview gate.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const exists = (rel: string) => existsSync(join(ROOT, rel));

const QUICK_LIB = "app/lib/quickClassifieds";
const QUICK_ROUTE = "app/(site)/publicar/rapido";
const ADAPTERS = `${QUICK_ROUTE}/_adapters`;

// 1. ONE PWA ------------------------------------------------------------------------------------------
{
  const manifests = execSync("git ls-files app public", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split(/\r?\n/)
    .filter((f) => /(^|\/)manifest(\.webmanifest|\.json|\.ts)$/.test(f));
  assert.deepEqual(manifests, ["app/manifest.ts"], "exactly one PWA manifest (app/manifest.ts)");
  const manifest = read("app/manifest.ts");
  assert.ok(manifest.includes('start_url: "/admin/businesses"'), "PWA start_url unchanged");
  const scc = read("app/admin/(dashboard)/businesses/StaffCommandCenter.tsx");
  assert.ok(scc.includes('import { QuickApplicationsLaunchpad } from "./QuickApplicationsLaunchpad";'), "launchpad imported by StaffCommandCenter");
  const headerIdx = scc.indexOf("<LeonixServiceWorkerRegister />");
  const launchIdx = scc.indexOf("<QuickApplicationsLaunchpad />");
  const todayIdx = scc.indexOf("Hoy / Today");
  assert.ok(headerIdx > 0 && launchIdx > headerIdx && launchIdx < todayIdx, "launchpad renders directly under the Concierge header, above Hoy / Today");
  assert.ok(scc.includes("Owner Handoff") && scc.includes("count={home.dueFollowUps.length}"), "existing Command Center content untouched");
  const lp = read("app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx");
  assert.ok(lp.includes("Aplicaciones Rápidas / Quick Applications"), "launchpad title ES / EN");
  assert.ok(lp.includes("min-h-[44px]"), "launchpad tap targets ≥ 44px");
  assert.ok(lp.includes("tryWebShare") && lp.includes("copyToClipboard"), "launchpad reuses existing share launchers");
  assert.ok(lp.includes('href="/admin/businesses/create-for-client"'), "launchpad links the EXISTING Create-for-Client flow for business customers");
  assert.ok(!/manifest|serviceWorker|register\(/.test(lp), "launchpad registers no PWA / worker");
  const os = read("app/admin/_lib/staffOperatingSystem.ts");
  assert.ok(os.includes('buildConciergeInventoryHref("create_listing")'), "existing Quick Actions untouched");
  const intents = read("app/admin/_lib/conciergeIntent.ts");
  assert.ok(intents.includes('"create_listing",') && intents.includes('"creative_studio",'), "concierge intents unchanged");
}

// 2. NO REDESIGN — protected canonical files not modified vs origin/main -------------------------------
{
  const base = execSync("git merge-base HEAD origin/main", { cwd: ROOT, encoding: "utf8" }).trim();
  const changed = execSync(`git diff --name-only ${base} HEAD`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  const untracked = execSync("git status --short", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter((l) => l.startsWith("??")).map((l) => l.replace(/^\?\?\s+/, ""));
  const touched = [...changed, ...untracked].map((f) => f.replace(/\\/g, "/"));
  const PROTECTED = [
    /^app\/lib\/listingIdentity\//,
    /^app\/lib\/listingPlans\//,
    /^app\/lib\/listingLifecycle\//,
    /^app\/lib\/media\//,
    /^app\/lib\/listingDrafts\//,
    /^app\/lib\/auth\//,
    /^app\/components\/auth\//,
    /^app\/api\//,
    /^supabase\//,
    /^app\/\(site\)\/clasificados\//,
    /^app\/\(site\)\/dashboard\//,
    /^app\/\(site\)\/publicar\/(?!rapido\/|PublicarGatewayClient\.tsx$)/,
    /^app\/admin\/(?!\(dashboard\)\/businesses\/(StaffCommandCenter|QuickApplicationsLaunchpad)\.tsx$)/,
    /^app\/manifest\.ts$/,
  ];
  const violations = touched.filter((f) => PROTECTED.some((re) => re.test(f)));
  assert.deepEqual(violations, [], `protected canonical surfaces must not change: ${violations.join(", ")}`);
  assert.ok(!touched.some((f) => f.startsWith("supabase/migrations/")), "no new database migration");
  // Gateway change is additive (one link + one import)
  const gw = read("app/(site)/publicar/PublicarGatewayClient.tsx");
  assert.ok(gw.includes('quickClassifiedsChooserPath(routeLang, "gateway")'), "gateway carries the additive Quick entry");
  assert.ok(gw.includes("resolvePublicarGatewayDestination(deepLinkCat, routeLang)"), "gateway deep-link behaviour unchanged");
}

// 3. NO SECOND AUTH -------------------------------------------------------------------------------------
{
  const layout = read("app/(site)/publicar/layout.tsx");
  assert.ok(layout.includes("PublishAuthGateLayout"), "/publicar/** (incl. /publicar/rapido) is wrapped by the existing PublishAuthGateLayout");
  assert.ok(!exists(`${QUICK_ROUTE}/layout.tsx`), "Quick adds no layout of its own (inherits the gate)");
  const tree = execSync(`git ls-files --others --exclude-standard --cached "${QUICK_ROUTE}" "${QUICK_LIB}"`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  assert.ok(tree.length >= 15, "Quick tree present");
  for (const f of tree) {
    const src = read(f);
    assert.ok(!/signInWithOtp|signInWithPassword|signUp\(|cookies\(\)|createServerClient|service_role|SUPABASE_SERVICE_ROLE_KEY/.test(src), `${f}: no auth / privileged code in Quick`);
  }
}

// 4. NO STAFF OWNERSHIP / NO PUBLISH FROM QUICK ---------------------------------------------------------
{
  const files = execSync(`git ls-files --others --exclude-standard --cached "${ADAPTERS}" "${QUICK_ROUTE}/_components"`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  for (const f of files) {
    const src = read(f);
    assert.ok(!/owner_id|owner_user_id|ownerUserId|rosterId|authUserId/.test(src), `${f}: never writes or reads an owner / staff identity`);
    assert.ok(!/\.from\(|\.insert\(|\.update\(|\.upsert\(|fetch\(\s*["'`]\/api\//.test(src), `${f}: never inserts rows or calls a publish API`);
    assert.ok(!/storage\.from|@vercel\/blob|mux/i.test(src), `${f}: never uploads media (existing publishers do)`);
  }
}

// 5. MEDIA LOCK + EMPLEOS BLOCKER -------------------------------------------------------------------------
{
  const reg = read(`${QUICK_LIB}/quickClassifiedRegistry.ts`);
  const types = read(`${QUICK_LIB}/quickClassifiedTypes.ts`);
  assert.ok(types.includes("minImages: 1;"), "media contract type pins minImages to 1");
  assert.ok(reg.includes("return { minImages: 1, maxImages, videoOptional: true, note };"), "every definition builds media with minImages 1");
  assert.ok(reg.includes('code: "BLOCKED_BY_EXISTING_MEDIA_OUTPUT"'), "Empleos recorded as BLOCKED_BY_EXISTING_MEDIA_OUTPUT");
  assert.ok(!exists(`${ADAPTERS}/empleosQuickAdapter.ts`), "no Empleos Quick adapter (blocked, not half-built)");
  const idx = read(`${ADAPTERS}/index.ts`);
  assert.ok(!/empleos:/.test(idx), "adapter registry has no Empleos entry");
  const media = read(`${QUICK_ROUTE}/_components/QuickMediaStep.tsx`);
  assert.ok(media.includes("compressImageFileToJpegDataUrl"), "media step reuses the existing image compressor (no second media system)");
  assert.ok(!/unsplash|placeholder\.com|picsum|generateImage|dall-e|openai/i.test(media), "media step never generates or fakes images");
  const store = read(`${QUICK_ROUTE}/_components/quickIntakeDraftStore.ts`);
  assert.ok(store.includes("createDraftHeavyMediaIdbStore("), "intake persistence reuses the shared heavy-media IndexedDB helper");
  // canonical caps cited by the registry match repository truth
  assert.ok(read("app/(site)/publicar/mascotas-y-perdidos/shared/mascotasPerdidosQuickDraft.ts").includes("export const MAX_MASCOTAS_PHOTOS = 4;"), "Mascotas cap = 4");
  assert.ok(reg.includes("media(4,"), "registry mirrors the Mascotas cap");
  assert.ok(read("app/(site)/clasificados/publicar/rentas/privado/schema/rentasPrivadoFormState.ts").includes("const MAX_PHOTOS = 8;"), "Rentas cap = 8");
  assert.ok(read("app/(site)/clasificados/publicar/bienes-raices/privado/schema/bienesRaicesPrivadoFormState.ts").includes("const MAX_PHOTOS = 8;"), "BR cap = 8");
  assert.ok(/media\(8,/.test(reg), "registry mirrors the Rentas / BR caps");
}

// 6. PRICING LOCK ------------------------------------------------------------------------------------------
{
  const reg = read(`${QUICK_LIB}/quickClassifiedRegistry.ts`);
  const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
  const keys = [...reg.matchAll(/packageKey: "([a-z0-9_]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(new Set(keys), new Set(["rentas_30d", "empleos_job_post_paid", "autos_privado_30d", "br_fsbo_45d"]), "paid postures name only the four existing keys");
  for (const k of keys) assert.ok(matrix.includes(`"${k}"`), `packageKey ${k} exists in revenuePricingMatrix`);
  assert.ok(!/priceCents|stripe|Stripe|promo/.test(reg), "registry carries no price, Stripe or promo values");
  for (const f of ["QuickReviewStep.tsx", "QuickCategoryChooser.tsx"]) {
    const src = read(`${QUICK_ROUTE}/_components/${f}`);
    assert.ok(src.includes("getRevenuePackagePriceCents("), `${f} reads price from the server authority at render time`);
    assert.ok(!/2499|4999|\$24|\$49/.test(src), `${f} hardcodes no amount`);
  }
}

// 7. ONE FRAMEWORK, ONE ADAPTER PER LIVE CATEGORY, CANONICAL STORE + CANONICAL GATE --------------------------
{
  const expectations: Record<string, { store: RegExp; gate: RegExp; handoff: RegExp }> = {
    "enVentaQuickAdapter.ts": { store: /persistEnVentaPreviewHandoffAsync\("pro"/, gate: /collectEnVentaCoreBlockers\(/, handoff: /\/clasificados\/en-venta\/preview/ },
    "rentasPrivadoQuickAdapter.ts": { store: /await saveRentasPrivadoDraft\(/, gate: /gateRentasPrivadoPreview\(/, handoff: /RENTAS_PREVIEW_PRIVADO/ },
    "autosPrivadoQuickAdapter.ts": { store: /await saveAutosPrivadoDraftResolved\(/, gate: /getAutosPreviewCompletenessIssues\("privado"/, handoff: /\/clasificados\/autos\/privado\/preview/ },
    "bienesRaicesPrivadoQuickAdapter.ts": { store: /await saveBienesRaicesPrivadoDraft\(/, gate: /gateBienesRaicesPrivadoPreview\(/, handoff: /BR_PREVIEW_PRIVADO/ },
    "communityQuickAdapters.ts": { store: /flushCommunityDraftToSession\(COMMUNITY_SESSION_KEYS\.(clases|comunidad)/, gate: /gate(Clases|Comunidad)QuickPreview\(/, handoff: /communityHandoffPreviewUrl\(/ },
    "buscoQuickAdapter.ts": { store: /sessionStorage\.setItem\(BUSCO_QUICK_DRAFT_KEY/, gate: /gateBuscoQuickPreview\(/, handoff: /buscoHandoffPreviewUrl\(/ },
    "mascotasQuickAdapter.ts": { store: /sessionStorage\.setItem\(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY/, gate: /gateMascotasPerdidosQuickPreview\(/, handoff: /mascotasPerdidosHandoffPreviewUrl\(/ },
  };
  for (const [file, e] of Object.entries(expectations)) {
    const src = read(`${ADAPTERS}/${file}`);
    assert.ok(e.store.test(src), `${file}: writes through the category's own canonical draft store`);
    assert.ok(e.gate.test(src), `${file}: runs the category's own required-for-preview gate`);
    assert.ok(e.handoff.test(src), `${file}: hands off to the category's existing preview`);
  }
  const idx = read(`${ADAPTERS}/index.ts`);
  for (const k of ['"en-venta"', "rentas", "autos", '"bienes-raices"', "clases", "comunidad", "busco", '"mascotas-y-perdidos"']) {
    assert.ok(idx.includes(`${k}:`), `adapter registry has ${k}`);
  }
  const reg = read(`${QUICK_LIB}/quickClassifiedRegistry.ts`);
  const liveCount = (reg.match(/status: "live"/g) ?? []).length;
  const blockedCount = (reg.match(/status: "blocked"/g) ?? []).length;
  assert.equal(liveCount, 8, "eight live categories");
  assert.equal(blockedCount, 1, "one blocked category (Empleos)");
  // No parallel product architecture
  const forbidden = execSync("git ls-files --others --exclude-standard --cached app", { cwd: ROOT, encoding: "utf8" })
    .trim()
    .split(/\r?\n/)
    .filter((f) => f.startsWith("app/(site)/publicar/rapido/") || f.startsWith("app/lib/quickClassifieds/"))
    .filter((f) => /Quick\w*(Page|Card|Detail|Marketplace|ListingTable)\w*\.tsx?$/.test(f.split("/").pop() ?? ""));
  assert.deepEqual(forbidden, [], "no QuickXPage / QuickXCard / QuickXDetail / marketplace / listing table in the Quick tree");
  // Review step reuses the EXISTING confirmation components
  const review = read(`${QUICK_ROUTE}/_components/QuickReviewStep.tsx`);
  assert.ok(review.includes("ListingRulesConfirmationSection") && review.includes("CommunityPublishConfirmationSection"), "review reuses existing confirmation components");
  assert.ok(!/infoTruthful:\s*true|rulesAccepted:\s*true|mediaAccurate:\s*true/.test(read(`${QUICK_ROUTE}/_components/quickIntakeDraftStore.ts`)), "confirmations are never pre-ticked");
  // My Ad doorway links only existing owner surfaces
  const doorway = read(`${QUICK_ROUTE}/_components/QuickMyAdClient.tsx`);
  assert.ok(doorway.includes("/dashboard/mis-anuncios") && !/\.from\(|fetch\(/.test(doorway), "doorway is links only into existing owner surfaces");
  assert.ok(reg.includes('manageHref: "/dashboard/empleos"'), "Empleos doorway targets its own existing dashboard");
  // Docs present
  assert.ok(exists("docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_EXECUTION_BLUEPRINT.md"), "blueprint present");
  assert.ok(exists("docs/quick-classifieds/LEONIX_QUICK_CLASSIFIEDS_CATEGORY_MATRIX.md"), "category matrix present");
}

console.log("verify-quick-classifieds-onramp-01: OK");
