/**
 * LEONIX QUICK BUSINESS CORE — source-contract verifier (Gate 13).
 * Run: npx tsx scripts/verify-quick-business-core-01.ts
 *
 * Same hand-rolled node:assert convention as every other verify-*.ts in this repo. Proves the owner locks:
 *  1. registry: the four Quick Business categories exist; Servicios + Restaurantes live, Dealer + Bienes direct.
 *  2. field wiring: every visible field key declared by an adapter is READ by that adapter (no decorative field),
 *     no adapter reads an undeclared key (typo / phantom read), and the Tier-2 canonical destinations are written.
 *     The detector is SELF-TESTED against synthetic broken mappings so it cannot trivially pass.
 *  3. media lock: minImages 1 in every definition; the intake reuses the certified media step.
 *  4. routes: live adapters hand off to the EXISTING previews; direct categories link the EXISTING applications.
 *  5. pricing lock: only existing monthly package keys; no amount literal; no Stripe / promo code in the Quick tree.
 *  6. no parallel product: no Quick public page / template / table / migration / API route.
 *  7. structured-subsystem protection: Dealer Quick creates no vehicle, Bienes Quick creates no property,
 *     Restaurantes Quick fabricates no menu / coupon / hours, Servicios Quick fabricates no credential / payment /
 *     specialty; certified Quick Classifieds files untouched vs. the certified SHA.
 *  8. staff launchpad: the four business priorities + send-link + manage, Quick Classifieds section preserved,
 *     community direct links intact; one PWA.
 */
import { strict as assert } from "node:assert";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { execSync } from "node:child_process";

const ROOT = process.cwd();
const read = (rel: string) => readFileSync(join(ROOT, rel), "utf8");
const exists = (rel: string) => existsSync(join(ROOT, rel));
const QB_LIB = "app/lib/quickBusiness";
const QB_ROUTE = "app/(site)/publicar/negocio-rapido";
const QB_ADAPTERS = `${QB_ROUTE}/_adapters`;
const QB_COMPONENTS = `${QB_ROUTE}/_components`;
const CERTIFIED_CLASSIFIEDS_SHA = "7555fb6456dff1797a7ca8d5716f99abdc511cce";

// 1. REGISTRY ----------------------------------------------------------------------------------------------
const reg = read(`${QB_LIB}/quickBusinessRegistry.ts`);
{
  for (const k of ["servicios:", "restaurantes:", '"autos-dealer":', '"bienes-negocio":']) assert.ok(reg.includes(k), `registry has ${k}`);
  assert.equal((reg.match(/status: "live"/g) ?? []).length, 2, "exactly two live Quick Business categories (Servicios, Restaurantes)");
  assert.equal((reg.match(/status: "direct"/g) ?? []).length, 2, "exactly two direct categories (Dealer, Bienes negocio)");
  assert.ok(reg.includes('code: "REQUIRES_VEHICLE_INVENTORY"') && reg.includes('code: "REQUIRES_PROPERTY_INVENTORY"'), "direct reasons are explicit");
  assert.ok(reg.includes('standardApplicationPath: "/publicar/autos/negocios"') && reg.includes('standardApplicationPath: "/publicar/bienes-raices"'), "direct categories link the EXISTING applications");
  assert.ok(reg.includes('standardApplicationPath: "/publicar/servicios"') && reg.includes('standardApplicationPath: "/publicar/restaurantes"'), "live categories name their EXISTING applications");
  assert.ok(reg.includes("publishForClientSupported: true") && (reg.match(/publishForClientSupported: false/g) ?? []).length === 3, "publish-for-client is claimed for Servicios only (the one verified server path)");
}

// 2. FIELD WIRING (self-tested detector) ----------------------------------------------------------------------
type Wiring = { declared: Set<string>; read: Set<string> };
function analyzeAdapter(src: string, sharedContactKeys: string[], hoursKeys: string[]): Wiring {
  const declared = new Set([...src.matchAll(/\{\s*key: "([A-Za-z]+)"/g)].map((m) => m[1]!));
  if (/businessContactStep\(/.test(src)) for (const k of sharedContactKeys) declared.add(k);
  if (/businessHoursFields\(\)/.test(src)) for (const k of hoursKeys) declared.add(k);
  if (/cityField\(/.test(src)) declared.add("city");
  const read = new Set<string>();
  for (const m of src.matchAll(/\((?:values|v), "([A-Za-z]+)"\)/g)) read.add(m[1]!);
  for (const m of src.matchAll(/values\.([A-Za-z]+)\b/g)) read.add(m[1]!);
  for (const m of src.matchAll(/isOther\("([A-Za-z]+)"\)/g)) read.add(m[1]!);
  if (/resolveCity\(values\)/.test(src)) read.add("city");
  if (/readBusinessHours\(values\)/.test(src)) for (const k of hoursKeys) read.add(k);
  return { declared, read };
}
function unwired(w: Wiring): string[] {
  return [...w.declared].filter((k) => !w.read.has(k));
}
function phantom(w: Wiring, allowed: Set<string>): string[] {
  return [...w.read].filter((k) => !w.declared.has(k) && !allowed.has(k));
}
{
  const shared = read(`${QB_ADAPTERS}/quickBusinessAdapterShared.ts`);
  const contactKeys = [...shared.matchAll(/\{ key: "([A-Za-z]+)", kind: "(?:phone|email|text)"/g)].map((m) => m[1]!);
  assert.deepEqual(contactKeys, ["phone", "whatsapp", "email", "website"], "shared business contact step declares phone / whatsapp / email / website");
  const hoursKeys = [...shared.matchAll(/key: "(hours[A-Za-z]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(hoursKeys, ["hoursDays", "hoursOpen", "hoursClose"], "shared hours fields declared");
  assert.ok(shared.includes('atLeastOne: { keys: ["phone", "whatsapp", "email", "website"]'), "contact step requires at least one channel");

  // Self-test: a synthetic adapter with a decorative field and a phantom read must FAIL the detector.
  const synthetic = `{ key: "title", kind: "text" } { key: "ghost", kind: "text" } title: quickStr(values, "title"), extra: quickStr(values, "phantomKey"),`;
  const sw = analyzeAdapter(synthetic, [], []);
  assert.deepEqual(unwired(sw), ["ghost"], "detector self-test: decorative field is caught");
  assert.deepEqual(phantom(sw, new Set()), ["phantomKey"], "detector self-test: undeclared read is caught");

  const adapters: Record<string, { canonical: string[]; allowedReads?: string[] }> = {
    "serviciosQuickBusinessAdapter.ts": {
      canonical: [
        "businessTypeId,", "customServiceDescription:", "businessName:", "selectedServiceIds:", "customServicesOffered:", "aboutText:", "city: resolveCity(values)", "hours: hoursFrom(values", "phone:", "whatsapp:", "email:", "website:", "coverUrl:", "gallery,", "featuredGalleryIds:", "confirmListingAccurate:", "confirmPhotosRepresentBusiness:", "confirmCommunityRules:",
      ],
    },
    "restaurantesQuickBusinessAdapter.ts": {
      canonical: [
        'productType: "established_restaurant"', "businessName:", "businessType:", "businessTypeCustom:", "primaryCuisine:", "primaryCuisineCustom:", "shortSummary:", "serviceModes,", "cityCanonical: resolveCity(values)", "...weeklyHoursFrom(values)", "phoneNumber:", "whatsAppNumber:", "email:", "websiteUrl:", "heroImage:", "galleryImages:",
      ],
    },
  };
  for (const [file, e] of Object.entries(adapters)) {
    const src = read(`${QB_ADAPTERS}/${file}`);
    const w = analyzeAdapter(src, contactKeys, hoursKeys);
    assert.deepEqual(unwired(w), [], `${file}: every visible field is read by buildAndWriteCanonicalDraft`);
    assert.deepEqual(phantom(w, new Set(e.allowedReads ?? [])), [], `${file}: no undeclared adapter read`);
    for (const k of e.canonical) assert.ok(src.includes(k), `${file}: writes canonical destination \`${k}\``);
  }
  // Gate-before-store order + existing store + existing preview handoff.
  const sv = read(`${QB_ADAPTERS}/serviciosQuickBusinessAdapter.ts`);
  assert.ok(/evaluateServiciosPublishReadiness\(state, ctx\.lang\)[\s\S]*await persistServiciosDraftForPreviewNavigation\(state\)/.test(sv), "Servicios: canonical readiness runs before the canonical store write");
  assert.ok(sv.includes('"/clasificados/publicar/servicios/preview"'), "Servicios: hands off to the EXISTING preview");
  assert.ok(sv.includes("createDefaultClasificadosServiciosState()") && sv.includes("syncServiciosContactEnables(draft)"), "Servicios: starts from the canonical default state and derives contact enables canonically");
  const rs = read(`${QB_ADAPTERS}/restaurantesQuickBusinessAdapter.ts`);
  assert.ok(/auditRestaurantePublishReadiness\(draft, "draft"\)[\s\S]*await saveRestauranteDraftToStorageResolved\(draft\)/.test(rs), "Restaurantes: canonical readiness audit runs before the canonical store write");
  assert.ok(rs.includes('"/clasificados/restaurantes/preview"'), "Restaurantes: hands off to the EXISTING preview");
  assert.ok(rs.includes("createEmptyRestauranteDraft()"), "Restaurantes: starts from the canonical empty draft");
}

// 3. MEDIA LOCK ----------------------------------------------------------------------------------------------
{
  assert.ok(reg.includes("return { minImages: 1, maxImages, videoOptional: true, note };"), "every definition builds media with minImages 1");
  const intake = read(`${QB_COMPONENTS}/QuickBusinessIntakeClient.tsx`);
  assert.ok(intake.includes('from "@/app/publicar/rapido/_components/QuickMediaStep"') && intake.includes("validateQuickMedia(draft.media, definition.media, lang)"), "intake reuses the certified media step + media lock at Next and submit");
  const review = read(`${QB_COMPONENTS}/QuickBusinessReviewStep.tsx`);
  assert.ok(review.includes("media.length === 0"), "review submit disabled without an image");
  assert.ok(read(`${QB_ADAPTERS}/serviciosQuickBusinessAdapter.ts`).includes("coverUrl: gallery[0]?.url") && read(`${QB_ADAPTERS}/restaurantesQuickBusinessAdapter.ts`).includes("heroImage: hero ?? \"\""), "first real image becomes the canonical cover / hero");
  for (const f of [`${QB_COMPONENTS}/QuickBusinessIntakeClient.tsx`, `${QB_COMPONENTS}/QuickBusinessReviewStep.tsx`, `${QB_COMPONENTS}/QuickBusinessChooser.tsx`]) {
    assert.ok(!/unsplash|placeholder\.com|picsum|generateImage|FALLBACK_IMG/i.test(read(f)), `${f}: no fake image fallback satisfies the minimum`);
  }
}

// 4. ROUTES ----------------------------------------------------------------------------------------------------
{
  assert.ok(exists(`${QB_ROUTE}/page.tsx`) && exists(`${QB_ROUTE}/[category]/page.tsx`), "chooser + category intake routes exist");
  assert.ok(!exists(`${QB_ROUTE}/layout.tsx`), "Quick Business adds no layout of its own (inherits PublishAuthGateLayout from /publicar)");
  assert.ok(read("app/(site)/publicar/layout.tsx").includes("PublishAuthGateLayout"), "/publicar/** wrapped by the existing gate");
  const chooser = read(`${QB_COMPONENTS}/QuickBusinessChooser.tsx`);
  assert.ok(chooser.includes('const direct = def.status === "direct";') && chooser.includes("withLang(def.standardApplicationPath, routeLang) : quickBusinessCategoryPath("), "chooser links direct categories to the existing application");
  const idx = read(`${QB_ADAPTERS}/index.ts`);
  assert.ok(idx.includes("servicios: serviciosQuickBusinessAdapter") && idx.includes("restaurantes: restaurantesQuickBusinessAdapter") && !/autos|bienes/.test(idx.replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "")), "adapter registry holds only the two live categories");
}

// 5. PRICING LOCK ---------------------------------------------------------------------------------------------
{
  const matrix = read("app/lib/listingPlans/revenuePricingMatrix.ts");
  const keys = [...reg.matchAll(/packageKey: "([a-z0-9_]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(new Set(keys), new Set(["servicios_base_monthly", "restaurantes_base_monthly", "autos_dealer_monthly", "br_agent_monthly"]), "postures name only the four existing base packages");
  for (const k of keys) assert.ok(matrix.includes(`"${k}"`), `packageKey ${k} exists in revenuePricingMatrix`);
  const tree = execSync(`git ls-files --others --exclude-standard --cached "${QB_ROUTE}" "${QB_LIB}"`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  assert.ok(tree.length >= 12, "Quick Business tree present");
  for (const f of tree) {
    const src = read(f);
    assert.ok(!/39900|12900|9900|\$399|\$99|priceCents: \d|stripe|Stripe|promo/.test(src), `${f}: no amount / Stripe / promo literal`);
    assert.ok(!/signInWithOtp|signInWithPassword|cookies\(\)|createServerClient|service_role|SUPABASE_SERVICE_ROLE_KEY/.test(src), `${f}: no auth / privileged code`);
    assert.ok(!/owner_id|owner_user_id|ownerUserId|rosterId|authUserId/.test(src), `${f}: never writes or reads an owner / staff identity`);
    assert.ok(!/\.from\(|\.insert\(|\.update\(|\.upsert\(|fetch\(\s*["'`]\/api\//.test(src), `${f}: never inserts rows or calls a publish API`);
    assert.ok(!/storage\.from|@vercel\/blob|mux/i.test(src), `${f}: never uploads media (existing publishers do)`);
  }
  for (const f of [`${QB_COMPONENTS}/QuickBusinessChooser.tsx`, `${QB_COMPONENTS}/QuickBusinessReviewStep.tsx`]) assert.ok(read(f).includes("getRevenuePackagePriceCents("), `${f} reads price from the server authority at render time`);
}

// 6. NO PARALLEL PRODUCT + PROTECTED PATHS ------------------------------------------------------------------------
{
  const changed = execSync(`git diff --name-only ${CERTIFIED_CLASSIFIEDS_SHA} HEAD`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  const untracked = execSync("git status --short", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter((l) => l.startsWith("??") || l.startsWith(" M") || l.startsWith("M ") || l.startsWith("A ")).map((l) => l.slice(3).trim());
  const touched = [...new Set([...changed, ...untracked])].map((f) => f.replace(/\\/g, "/"));
  const PROTECTED = [
    /^app\/lib\/listingIdentity\//, /^app\/lib\/listingPlans\//, /^app\/lib\/listingLifecycle\//, /^app\/lib\/media\//, /^app\/lib\/listingDrafts\//, /^app\/lib\/auth\//, /^app\/lib\/business\//,
    /^app\/components\//, /^app\/api\//, /^supabase\//, /^app\/\(site\)\/clasificados\//, /^app\/\(site\)\/dashboard\//,
    /^app\/\(site\)\/publicar\/(?!negocio-rapido\/|PublicarGatewayClient\.tsx$)/,
    /^app\/admin\/(?!\(dashboard\)\/businesses\/QuickApplicationsLaunchpad\.tsx$)/,
    /^app\/lib\/quickClassifieds\//, /^app\/manifest\.ts$/,
  ];
  const violations = touched.filter((f) => f.startsWith("app/") && PROTECTED.some((re) => re.test(f)));
  assert.deepEqual(violations, [], `protected canonical / certified surfaces must not change: ${violations.join(", ")}`);
  assert.ok(!touched.some((f) => f.startsWith("supabase/migrations/")), "no new database migration");
  assert.ok(!touched.some((f) => f.startsWith("app/api/")), "no new API route");
  const forbidden = execSync("git ls-files --others --exclude-standard --cached app", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/)
    .filter((f) => f.startsWith(`${QB_ROUTE}/`) || f.startsWith(`${QB_LIB}/`))
    .filter((f) => /QuickBusiness\w*(Page|Card|Detail|Profile|Shell|Marketplace|Table|Menu|Inventory)\w*\.tsx?$/.test(f.split("/").pop() ?? ""));
  assert.deepEqual(forbidden, [], "no Quick Business public page / card / profile / shell / table / menu / inventory in the Quick tree");
  assert.ok(!/create table|CREATE TABLE|createTable/.test(reg + read(`${QB_LIB}/quickBusinessTypes.ts`)), "no table definition in the Quick Business lib");
}

// 7. STRUCTURED-SUBSYSTEM PROTECTION ----------------------------------------------------------------------------
{
  const allQuick = execSync(`git ls-files --others --exclude-standard --cached "${QB_ROUTE}" "${QB_LIB}"`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean).map((f) => read(f)).join("\n");
  assert.ok(!/autoDealerDraft|AutoDealerListing|mediaImages|heroImages|inventory_vehicle|vehicleTitle|\bvin\b/i.test(allQuick), "Dealer Quick creates no vehicle / inventory data");
  assert.ok(!/bienesRaicesNegocioFormState|AgenteIndividualResidencialFormState|photoUrls|petsAllowed|precio:/.test(allQuick), "Bienes Quick creates no property data");
  const rs = read(`${QB_ADAPTERS}/restaurantesQuickBusinessAdapter.ts`);
  assert.ok(!/featuredDishes|menuUrl|menuFile|coupons|couponFlyer|specialHoursNote|delivery: true|dineIn: true/.test(rs), "Restaurantes Quick fabricates no menu / coupon / hours note / delivery flag");
  const sv = read(`${QB_ADAPTERS}/serviciosQuickBusinessAdapter.ts`);
  assert.ok(!/hasLicense|licenseNumber|isInsured|certifications|paymentMethodIds|specialtiesLine|selectedQuickFactIds|selectedReasonIds|languageIds|amenityOptionIds|coupons|promotions/.test(sv), "Servicios Quick fabricates no credential / payment / specialty / language / coupon data");
  assert.ok(/hoursFrom\(values/.test(sv) && /weeklyHoursFrom\(values\)/.test(rs), "hours come from the customer's answers, never from a default schedule");
  // Certified Quick Classifieds code byte-identical to the certified SHA.
  const classifiedsDiff = execSync(`git diff --name-only ${CERTIFIED_CLASSIFIEDS_SHA} HEAD -- "app/(site)/publicar/rapido" app/lib/quickClassifieds`, { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(classifiedsDiff, "", "certified Quick Classifieds tree unchanged vs. the certified SHA");
  const dirty = execSync("git status --short -- \"app/(site)/publicar/rapido\" app/lib/quickClassifieds", { cwd: ROOT, encoding: "utf8" }).trim();
  assert.equal(dirty, "", "certified Quick Classifieds tree has no uncommitted change");
}

// 8. STAFF LAUNCHPAD + ONE PWA + CLASSIFIEDS PRESERVED ---------------------------------------------------------------
{
  const lp = read("app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx");
  assert.ok(lp.includes("Negocios Rápidos / Quick Business"), "launchpad has the Quick Business section");
  assert.ok(lp.includes("listQuickBusinessDefinitions()"), "launchpad lists the registry's four business priorities in order");
  assert.ok(lp.includes("Enviar enlace de negocio / Send business link") && lp.includes("Administrar negocio / Manage business"), "launchpad exposes send-link + manage for business");
  assert.ok(lp.includes("Crear negocio rápido con el cliente / Create quick business with customer") && lp.includes("Abrir aplicación completa / Open full application"), "launchpad verbs are honest per category status");
  assert.ok(lp.includes("Aplicaciones Rápidas / Quick Applications") && lp.includes("{tier1.map((def) => renderCard(def, \"large\"))}") && lp.includes("{community.map((def) => renderCard(def, \"compact\"))}"), "Quick Classifieds section preserved (Tier-1 + community)");
  assert.ok(lp.includes('if (isCommunity || def.status === "blocked") return withLang(def.standardApplicationPath, lang);'), "community direct links intact");
  assert.ok(lp.includes('href="/admin/businesses/create-for-client"'), "existing Create-for-Client flow still linked");
  assert.ok(!/publicamos por ti|we publish for you|publish on your behalf/i.test(lp), "no over-promise of staff-side publishing");
  assert.ok(!/manifest|serviceWorker|register\(/.test(lp), "launchpad registers no PWA / worker");
  const manifests = execSync("git ls-files app public", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter((f) => /(^|\/)manifest(\.webmanifest|\.json|\.ts)$/.test(f));
  assert.deepEqual(manifests, ["app/manifest.ts"], "exactly one PWA manifest");
  const gw = read("app/(site)/publicar/PublicarGatewayClient.tsx");
  assert.ok(gw.includes('quickBusinessChooserPath(routeLang, "gateway")') && gw.includes('quickClassifiedsChooserPath(routeLang, "gateway")'), "gateway carries both additive Quick entries");
  for (const p of ["app/(site)/publicar/rapido/page.tsx", "app/(site)/publicar/rapido/[category]/page.tsx", "app/(site)/publicar/rapido/mi-anuncio/page.tsx"]) assert.ok(exists(p), `Quick Classifieds route present: ${p}`);
  // Bilingual: every Quick Business copy entry has es + en.
  const copy = read(`${QB_LIB}/quickBusinessCopy.ts`);
  const esCount = (copy.match(/\bes: "/g) ?? []).length;
  const enCount = (copy.match(/\ben: "/g) ?? []).length;
  assert.equal(esCount, enCount, "every Quick Business copy entry has both ES and EN");
}

console.log("verify-quick-business-core-01: OK");
