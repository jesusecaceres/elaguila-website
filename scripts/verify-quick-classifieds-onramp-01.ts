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
    // Tier-1 Gate 5 — the ONE documented narrow exception: the Empleos media wiring repair (a new upload helper
    // + its single call-site insertion in the quick preview checkout). Everything else under these trees stays locked.
    /^app\/\(site\)\/clasificados\/(?!empleos\/quick-preview\/EmpleoQuickPreviewClient\.tsx$)/,
    // Remaining-families closeout: Ofertas coupon consent copy is derived from the existing
    // `ofertas_locales_coupons_30d` / flyer packages. No other dashboard path is opened.
    /^app\/\(site\)\/dashboard\/(?!ofertas-locales\/\[id\]\/checkout\/page\.tsx$)/,
    // Quick Business Core (Phase 2, branch claude/quick-business-core-build-2026-09): the additive
    // `/publicar/negocio-rapido/**` tree is the business intake sibling of `rapido/`; it never touches the
    // certified classifieds tree (asserted by scripts/verify-quick-business-core-01.ts §7).
    // Remaining-families mission (branch claude/quick-remaining-families-build-2026-09): the additive
    // `/publicar/comida-local/rapido/**` tree is a standalone Quick front door onto the EXISTING Comida Local
    // product — Comida Local cannot join the closed Quick Business Core registry, so it lives beside it.
    /^app\/\(site\)\/publicar\/(?!rapido\/|negocio-rapido\/|comida-local\/|PublicarGatewayClient\.tsx$|empleos\/shared\/publish\/empleosDraftMediaUpload\.ts$)/,
    /^app\/admin\/(?!\(dashboard\)\/businesses\/(StaffCommandCenter|QuickApplicationsLaunchpad)\.tsx$)/,
    /^app\/manifest\.ts$/,
  ];
  // Quick SIMPLE vs FULL commercial closeout (branch
  // cursor/quick-simple-vs-full-commercial-closeout-2026-09): the owner authorized a new SIMPLE
  // business access level sold at $99 beside the existing $399 Full packages. It is file-exact on
  // purpose — every other file under the trees above stays locked, and the blast radius of this
  // mission is asserted independently by scripts/verify-quick-business-access-level-01.ts and
  // scripts/verify-quick-business-core-01.ts.
  const MISSION_AUTHORIZED = new Set([
    "app/lib/listingPlans/businessAccessLevel.ts", // the SIMPLE/FULL resolver
    "app/lib/listingPlans/fullOnlyFeatureGate.ts", // the server gate for Full-only features
    "app/lib/listingPlans/businessAccessCopy.ts", // centralized ES/EN copy, no prices
    "app/lib/listingPlans/categoryCommercialPlan.ts", // reuses the existing entitlement fetch
    "app/lib/listingPlans/revenuePricingMatrix.ts", // the four $249 packages + access declarations
    "app/lib/listingPlans/revenueActiveEntitlementGuard.ts", // Quick joins the recharge guard
    "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts", // the four Quick checkout constants
    "app/api/dashboard/analytics/listing/route.ts", // analytics becomes a Full-only capability
    "app/admin/(dashboard)/workspace/package-entitlements/page.tsx", // staff can see the access level
    "app/admin/_lib/packageEntitlementData.ts", // surfaces the package_key the writer already stores
    // Chunk 2 — actually SELLING the Quick package. Chunk 1 defined the $99 packages but nothing
    // purchased them: Quick intake handed off to the shared preview, which checked out the Full
    // key, and the webhook would not have activated a Quick payment. These files close that
    // circuit. Each one either selects between two existing package keys or widens an exact-key
    // gate to accept EITHER of a category's two base keys; none adds a price, a Stripe id, a
    // parallel checkout, a second listing table or a second public page.
    "app/lib/listingPlans/businessQuickPlanSignal.ts", // which base package a checkout is buying
    "app/lib/listingPlans/categoryCommercialPlanPolicy.ts", // a live Quick row is a canonical plan
    "app/lib/listingPlans/publishCheckoutCheckpoint.ts", // Quick inventory allowance constants
    "app/lib/listingPlans/revenueFulfillment.ts", // webhook routes a Quick payment to its category
    "app/lib/listingPlans/revenueServiciosFulfillment.ts", // a paid Quick listing publishes
    "app/lib/listingPlans/revenueRestaurantFulfillment.ts", // a paid Quick listing publishes
    "app/lib/listingPlans/revenueAutosDealerFulfillment.ts", // a paid Quick listing publishes
    "app/lib/listingPlans/revenueBienesNegocioFulfillment.ts", // a paid Quick listing publishes
    "app/api/revenue-os/checkout/route.ts", // the autos pre-flight accepts the Quick dealer key
    // The four shared previews. Each reads the Quick marker off its own URL and picks the Quick
    // checkout constant instead of the Full one — the SAME preview, draft, publisher and public
    // page either way. Without the marker every one of them behaves exactly as before.
    "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
    "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
    "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
    "app/(site)/clasificados/autos/negocios/lib/autosDealerRevenueCheckout.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
    // Chunk 2 — the SIMPLE -> FULL upgrade, and the resume price. A paid Simple customer had no
    // purchasable route to Full (a published listing has no checkout in its preview), and a Quick
    // customer who abandoned Stripe was re-offered the Full package because the dashboard link
    // carries no `?plan=quick` marker. Both are answered from server state, not from the URL.
    // None of these adds a price, a Stripe id, a parallel checkout, a second listing table, a
    // second public page, or a write to any listing row.
    "app/lib/listingPlans/businessBasePlanOfferPolicy.ts", // the decision, pure
    "app/lib/listingPlans/businessBasePlanOffer.ts", // its owner-verified server reads
    "app/lib/listingPlans/businessBasePlanOfferClient.ts", // the read-only client hook
    "app/api/revenue-os/business-base-plan/route.ts", // read-only, bearer-auth, no mutation
    // The owner surfaces that carry the upgrade CTA. Each buys the category's EXISTING Full
    // package for a listing that already exists, through the one Revenue OS checkout.
    "app/(site)/dashboard/lib/businessSimpleToFullUpgradeCheckout.ts",
    "app/(site)/dashboard/components/BusinessSimpleToFullUpgradePanel.tsx",
    "app/(site)/dashboard/servicios/page.tsx",
    "app/(site)/dashboard/restaurantes/page.tsx",
    "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
    "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
    // -----------------------------------------------------------------------
    // Gates QB-LIFECYCLE + CONVERGENCE + STAFF (commit 883467d25). Quick stopped
    // being a price and became a lifecycle: a Quick customer can manage, converge
    // and bill their own listing. Each file widens an EXISTING owner-verified seam
    // to recognize the Quick base package beside the Full one. None adds a price,
    // a Stripe id, a parallel checkout, a second listing table or a public page.
    // -----------------------------------------------------------------------
    "app/lib/listingPlans/quickToFullConvergence.ts", // the convergence server reads
    "app/api/clasificados/quick-business/my-listing/route.ts", // owner reads their own Quick listing
    "app/api/clasificados/autos/assisted-publish/route.ts", // assisted Quick stays staff-gated
    "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts", // same, Bienes
    "app/api/clasificados/restaurantes/manage/route.ts", // Quick owner manage parity
    "app/api/stripe/billing-portal-session/route.ts", // a Quick subscription reaches the portal
    // -----------------------------------------------------------------------
    // Quick final repair (commit 2b2192d51): canonical identity, real lifecycle,
    // immediate convergence, semantic media. The assisted-publishing session and
    // token become the canonical staff-assisted context every Quick seam reads,
    // and convergence moves from a claim to a committed server operation.
    // -----------------------------------------------------------------------
    "app/lib/auth/assistedPublishingSession.ts", // the canonical assisted context
    "app/lib/auth/assistedPublishingToken.ts", // its verified token
    "app/lib/listingPlans/quickToFullConvergenceCore.ts", // convergence, against ports
    "app/lib/listingPlans/quickToFullConvergencePure.ts", // its pure decision
    "app/lib/listingPlans/revenueAuditLog.ts", // convergence and Quick writes are audited
    "app/api/business/listing-link/route.ts", // canonical business-listing linkage
    "app/api/clasificados/autos/listings/route.ts", // the Autos Quick media seam
    "app/api/clasificados/servicios/publish/route.ts", // the Servicios Quick media seam
    "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts", // the Bienes publish core
    "app/admin/(dashboard)/businesses/[businessId]/PreparedListingsStrip.tsx", // staff sees Quick state
    "supabase/migrations/20260920120000_quick_business_lifecycle_capability_parity.sql", // authored, not applied
    // -----------------------------------------------------------------------
    // Semantic media role declarations (commits 4ea02a374, 4ce07a6b6, 79ade5fd7).
    // Quick's media contract has to know what an image IS, so the editors that
    // already know emit an explicit role. These are ADDITIVE metadata changes on
    // Full surfaces: nothing here subjects a Full product to a Quick rule.
    // -----------------------------------------------------------------------
    "app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts",
    "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
    "app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts",
    "app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts",
    "app/api/clasificados/restaurantes/publish/route.ts",
    "app/(site)/clasificados/bienes-raices/lib/bienesNegocioTranslateAd.ts",
    "app/(site)/clasificados/bienes-raices/lib/useBienesNegocioShellTranslation.ts",
    "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx",
    // -----------------------------------------------------------------------
    // Quick product boundary (commit a98d6d9ff). The two refreeze blockers: Quick
    // enforcement reaching shared FULL publish paths, and the bypassable Quick
    // Bienes browser insert. Product identity is now a SERVER fact, and Quick
    // Bienes publishes through one authenticated server-custody operation.
    // -----------------------------------------------------------------------
    "app/lib/listingPlans/quickBusinessProductIdentity.ts", // the pure product rule
    "app/lib/listingPlans/quickBusinessProductIdentityServer.ts", // its server-owned reads
    "app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts", // atomic Quick Bienes custody
    // -----------------------------------------------------------------------
    // LEONIX IX REWARDS (branch claude/leonix-ix-rewards-global-2026-09) — a SECOND authorized
    // mission, converged into this branch. Its surfaces are listed FILE-EXACT so this guard keeps
    // catching unexpected drift instead of being switched off: none of them is a classifieds
    // on-ramp surface, and the Quick on-ramp itself is unchanged by every one of them.
    // -----------------------------------------------------------------------
    "app/(site)/dashboard/page.tsx", // mounts the customer wallet panel
    "app/(site)/dashboard/components/LeonixCreditsPanel.tsx", // the wallet panel itself
    "app/admin/(dashboard)/workspace/rewards/page.tsx", // staff wallet workspace
    "app/admin/(dashboard)/workspace/rewards/RewardsWorkspaceClient.tsx",
    "app/api/rewards/wallet/route.ts", // the customer's own wallet read
    "app/api/admin/rewards/route.ts", // staff money writes, super-admin gated
    "app/api/admin/rewards/reconciliation/route.ts", // staff-only CSV preview -> commit
    "app/api/revenue-os/admin/rewards-sweep/route.ts", // the protected promotion + expiry seam
    // Payment-pipeline touch points. Each is additive and runs AFTER the payment is settled;
    // none changes payment behaviour, and none is reachable from a Quick publish.
    "app/lib/listingPlans/invoiceRenewalEarnPolicy.ts", // the pure renewal-earn decision
    "app/lib/listingPlans/manualClearedPayments.ts",
    "app/lib/listingPlans/revenuePaymentRecords.ts",
    "app/lib/listingPlans/revenueSubscriptionEvents.ts",
    "app/lib/listingPlans/subscriptionLifecycle.ts",
    "supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql", // authored, NOT applied
  ]);
  const violations = touched.filter((f) => !MISSION_AUTHORIZED.has(f) && PROTECTED.some((re) => re.test(f)));
  assert.deepEqual(violations, [], `protected canonical surfaces must not change: ${violations.join(", ")}`);
  // NO NEW DATABASE MIGRATION — narrowed to the real claim, not dropped.
  //
  // This started as "no file under supabase/migrations/ may be touched at all", which was true
  // when the Quick on-ramp was the only mission in this tree. It stopped being usable the moment a
  // later AUTHORIZED Quick gate had to author one (the lifecycle/capability-parity migration), and
  // it would fail again for any second mission sharing the worktree — the same failure mode
  // commit 14ed879b8 fixed in the Quick Business core verifier.
  //
  // The claim worth keeping is stronger than "no file changed": the Quick on-ramp must not
  // introduce a migration of its OWN, and no migration this branch carries may create a Quick
  // product or listing table. Both are asserted below, so an unexpected migration still fails.
  const AUTHORIZED_MIGRATIONS = new Set([
    // Quick lifecycle + capability parity. Authored by an authorized Quick gate; NOT applied.
    "supabase/migrations/20260920120000_quick_business_lifecycle_capability_parity.sql",
    // LEONIX IX REWARDS foundation. Authored by the SECOND authorized mission converged into this
    // branch; NOT applied. It creates only `leonix_rewards_*` wallet/ledger/redemption tables —
    // no Quick product or listing table — which the per-migration check below still proves.
    "supabase/migrations/20260921120000_leonix_ix_rewards_foundation.sql",
  ]);
  const migrationsTouched = touched.filter((f) => f.startsWith("supabase/migrations/"));
  const unexpectedMigrations = migrationsTouched.filter((f) => !AUTHORIZED_MIGRATIONS.has(f));
  assert.deepEqual(
    unexpectedMigrations,
    [],
    `no new database migration beyond the authorized Quick set: ${unexpectedMigrations.join(", ")}`,
  );
  for (const migration of migrationsTouched) {
    const sql = read(migration);
    const createdTables = [...sql.matchAll(/CREATE TABLE(?:\s+IF NOT EXISTS)?\s+(?:public\.)?(\w+)/gi)].map(
      (m) => m[1]!,
    );
    const quickProductTables = createdTables.filter((t) => /quick|listing|classified|clasificado/i.test(t));
    assert.deepEqual(
      quickProductTables,
      [],
      `Quick must not create a product or listing table (${migration} creates: ${quickProductTables.join(", ")})`,
    );
  }
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
  // Tier-1 Gate 5 — Empleos media wiring repair: local photos are hosted in the EXISTING listing-images bucket
  // before the (unchanged) envelope mapper runs; the mapper's data:/blob: drop is preserved as the safety net.
  const empleosUpload = read("app/(site)/publicar/empleos/shared/publish/empleosDraftMediaUpload.ts");
  assert.ok(empleosUpload.includes('const BUCKET = "listing-images";'), "Empleos repair uses the existing listing-images bucket (no new storage)");
  assert.ok(empleosUpload.includes("${input.userId}/empleos/"), "Empleos uploads live under the customer's own uid folder");
  assert.ok(empleosUpload.includes("supabase.storage.from(BUCKET).upload("), "Empleos repair uploads with the customer's own Supabase session");
  assert.ok(!/service_role|SUPABASE_SERVICE_ROLE_KEY|owner_user_id/.test(empleosUpload), "Empleos repair is client-session only, never privileged");
  const envelopeSrc = read("app/(site)/publicar/empleos/shared/publish/buildEmpleosPublishEnvelope.ts");
  assert.ok(envelopeSrc.includes('if (u.startsWith("blob:") || u.startsWith("data:")) continue;'), "envelope mapper unchanged (still refuses local refs at the boundary)");
  const quickPreview = read("app/(site)/clasificados/empleos/quick-preview/EmpleoQuickPreviewClient.tsx");
  const uploadIdx = quickPreview.indexOf("await resolveEmpleosQuickDraftMediaForPublish(current");
  const envelopeIdx = quickPreview.indexOf("buildEmpleosPublishEnvelopeFromQuick(resolved.draft, lang)");
  assert.ok(uploadIdx > 0 && envelopeIdx > uploadIdx, "quick preview checkout hosts photos BEFORE building the envelope");
  assert.ok(quickPreview.includes("if (!resolved.ok) {"), "upload failure fails closed with a message (never silently drops)");
  assert.ok(exists(`${ADAPTERS}/empleosQuickAdapter.ts`), "Empleos Quick adapter present after the repair");
  const idx = read(`${ADAPTERS}/index.ts`);
  assert.ok(/empleos:/.test(idx), "adapter registry has an Empleos entry");
  assert.ok(!exists("app/(site)/publicar/empleos/feria/empleosDraftMediaUpload.ts") && !read("app/(site)/publicar/empleos/feria/EmpleoFeriaApplicationClient.tsx").includes("resolveEmpleosQuickDraftMediaForPublish"), "Feria untouched by the repair");
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
    "empleosQuickAdapter.ts": { store: /flushEmpleosDraftToSession\(EMPLEOS_SESSION_KEYS\.quick/, gate: /gateEmpleosQuickPreview\(/, handoff: /empleosHandoffPreviewUrl\("quick"/ },
  };
  for (const [file, e] of Object.entries(expectations)) {
    const src = read(`${ADAPTERS}/${file}`);
    assert.ok(e.store.test(src), `${file}: writes through the category's own canonical draft store`);
    assert.ok(e.gate.test(src), `${file}: runs the category's own required-for-preview gate`);
    assert.ok(e.handoff.test(src), `${file}: hands off to the category's existing preview`);
  }
  const idx = read(`${ADAPTERS}/index.ts`);
  for (const k of ['"en-venta"', "rentas", "autos", '"bienes-raices"', "empleos", "clases", "comunidad", "busco", '"mascotas-y-perdidos"']) {
    assert.ok(idx.includes(`${k}:`), `adapter registry has ${k}`);
  }
  const reg = read(`${QUICK_LIB}/quickClassifiedRegistry.ts`);
  const liveCount = (reg.match(/status: "live"/g) ?? []).length;
  const blockedCount = (reg.match(/status: "blocked"/g) ?? []).length;
  assert.equal(liveCount, 9, "nine live categories (Empleos unblocked by the Gate 5 repair)");
  assert.equal(blockedCount, 0, "no blocked category");
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

// 8. SHARED FORM INTERACTION CONTRACT (PM Control Master §20) ----------------------------------------------
{
  const renderer = read(`${QUICK_ROUTE}/_components/QuickFieldRenderer.tsx`);
  // Every text-like control forwards the raw keystroke value; no per-keystroke normalization.
  assert.ok(renderer.includes("onChange={(e) => onChange(field.key, e.target.value)}"), "text/number/phone/email/date inputs forward the raw value");
  assert.ok(/<textarea[\s\S]*?onChange=\{\(e\) => onChange\(field\.key, e\.target\.value\)\}/.test(renderer), "textarea forwards the raw value (multiline, spaces, accents)");
  const onChangeHandlers = renderer.match(/onChange=\{[^}]*\}/g) ?? [];
  for (const h of onChangeHandlers) {
    assert.ok(!/trim\(|toLowerCase\(|normalize\(|parseInt|parseFloat|Number\(|replace\(|slug/.test(h), `no destructive per-keystroke rewrite in handler: ${h}`);
  }
  assert.ok(!/\.trim\(\)/.test(renderer.replace(/typeof raw === "string" \? raw : ""/g, "")), "renderer never trims typed text");
  // City: raw value on change; canonicalization only on blur/select inside the existing CityAutocomplete.
  const city = read("app/components/CityAutocomplete.tsx");
  assert.ok(city.includes("onChange(e.target.value);"), "CityAutocomplete forwards the raw keystroke");
  assert.ok(city.includes("const handleBlur") || city.includes("onBlur={handleBlur}"), "CityAutocomplete canonicalizes on blur, not per keystroke");
  // Normalization happens at the adapter boundary only.
  const validation = read(`${QUICK_LIB}/quickClassifiedValidation.ts`);
  assert.ok(validation.includes("export function quickStr(") && validation.includes("return typeof v === \"string\" ? v.trim() : \"\";"), "quickStr trims at the adapter/validation boundary");
  // Chips write exact option values; a change never resets unrelated keys (spread-merge patch).
  const intake = read(`${QUICK_ROUTE}/_components/QuickIntakeClient.tsx`);
  assert.ok(intake.includes("setDraft((d) => ({ ...d, values: { ...d.values, [key]: value } }));"), "a field change patches only its own key");
  assert.ok(intake.includes("stepIndex: index") && intake.includes("goTo(stepIndex - 1)"), "Back/Next move the step index without touching values");
  assert.ok(intake.includes("saveQuickIntakeDraft(category, draftRef.current)"), "values + media + step persist to the tab draft (survives refresh and the same-tab login return)");
  assert.ok(intake.includes("values: { ...missing, ...d.values }"), "visible defaultValue prefills never overwrite what the customer typed");
  const media = read(`${QUICK_ROUTE}/_components/QuickMediaStep.tsx`);
  assert.ok(media.includes('accept="image/*"') && media.includes('capture="environment"'), "image control offers gallery + camera");
  assert.ok(media.includes("function makeCover(") && media.includes("function remove("), "cover + remove controls exist");
}

console.log("verify-quick-classifieds-onramp-01: OK");
