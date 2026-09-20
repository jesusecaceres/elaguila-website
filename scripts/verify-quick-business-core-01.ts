/**
 * LEONIX QUICK BUSINESS CORE — source-contract verifier (Gate 13).
 * Run: npx tsx scripts/verify-quick-business-core-01.ts
 *
 * Same hand-rolled node:assert convention as every other verify-*.ts in this repo. Proves the owner locks:
 *  1. registry: the four Quick Business categories exist and are ALL live (Dealer + Bienes closed out with the
 *     customer's REAL first vehicle / first property — PM decision); truthful per-category media wording.
 *  2. field wiring: every visible field key declared by an adapter is READ by that adapter (no decorative field),
 *     no adapter reads an undeclared key (typo / phantom read), and the Tier-2 canonical destinations are written.
 *     The detector is SELF-TESTED against synthetic broken mappings so it cannot trivially pass.
 *  3. media lock: minImages 1 in every definition; the intake reuses the certified media step.
 *  4. routes: all four adapters hand off to the EXISTING previews; the honest "direct" fallback branches stay.
 *  5. pricing lock: only existing monthly package keys; no amount literal; no Stripe / promo code in the Quick tree.
 *  6. no parallel product: no Quick public page / template / table / migration / API route.
 *  7. structured-subsystem protection: vehicle fields live ONLY in the Dealer adapter (one real first vehicle, no
 *     bundled inventory, no fabricated mileage / VIN / condition), property fields ONLY in the Bienes adapter (one
 *     real first property, no inventory children, no fabricated license / beds / baths / condition / status),
 *     Restaurantes Quick fabricates no menu / coupon / hours, Servicios Quick fabricates no credential / payment /
 *     specialty; vehicle / property media are labeled truthfully (never "business photo"); certified Quick
 *     Classifieds files untouched vs. the certified SHA.
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
function registryBlock(key: string): string {
  const start = reg.indexOf(`  ${key}: {`);
  assert.ok(start >= 0, `registry has ${key}`);
  const rest = reg.slice(start + 1);
  const next = rest.search(/\n {2}(?:[a-z]+|"[a-z-]+"): \{/);
  return next >= 0 ? rest.slice(0, next) : rest.slice(0, rest.indexOf("\n};"));
}
{
  for (const k of ["servicios:", "restaurantes:", '"autos-dealer":', '"bienes-negocio":']) assert.ok(reg.includes(k), `registry has ${k}`);
  assert.equal((reg.match(/status: "live"/g) ?? []).length, 4, "all four Quick Business categories are live (Dealer + Bienes closed out)");
  assert.equal((reg.match(/status: "direct"/g) ?? []).length, 0, "no category is presented as direct / blocked any more");
  assert.ok(!reg.includes("directReason:"), "no direct reason remains in the registry");
  assert.ok(reg.includes('standardApplicationPath: "/publicar/autos/negocios"') && reg.includes('standardApplicationPath: "/publicar/bienes-raices"'), "Dealer / Bienes still name their EXISTING full application / selector");
  assert.ok(reg.includes('standardApplicationPath: "/publicar/servicios"') && reg.includes('standardApplicationPath: "/publicar/restaurantes"'), "Servicios / Restaurantes name their EXISTING applications");
  assert.ok(reg.includes("publishForClientSupported: true") && (reg.match(/publishForClientSupported: false/g) ?? []).length === 3, "publish-for-client is claimed for Servicios only (the one verified server path)");
  assert.equal((reg.match(/mediaIntro: \{/g) ?? []).length, 4, "every definition carries its own truthful media wording");
  const dealer = registryBlock('"autos-dealer"');
  const bienes = registryBlock('"bienes-negocio"');
  assert.ok(dealer.includes('tagline: { es: "Tu negocio + tu primer vehículo", en: "Your dealership + your first vehicle" }'), "Dealer tagline says dealership + first vehicle");
  assert.ok(bienes.includes('tagline: { es: "Tu perfil + tu primera propiedad", en: "Your profile + your first property" }'), "Bienes tagline says profile + first property");
  // Media-label truth: vehicle / property photos are never presented as business photos.
  const dealerMedia = dealer.slice(dealer.indexOf("media: media("), dealer.indexOf("manage: {"));
  const bienesMedia = bienes.slice(bienes.indexOf("media: media("), bienes.indexOf("manage: {"));
  assert.ok(/vehículo/.test(dealerMedia) && /vehicle/.test(dealerMedia), "Dealer media wording names the VEHICLE (es + en)");
  assert.ok(/propiedad/.test(bienesMedia) && /property/.test(bienesMedia), "Bienes media wording names the PROPERTY (es + en)");
  for (const [label, block] of [["Dealer", dealerMedia], ["Bienes", bienesMedia]] as const) {
    assert.ok(!/fotos? reales? de tu negocio|photos? of your business|foto de tu negocio|business photo/i.test(block), `${label} media wording never says "business photo"`);
  }
  assert.ok(reg.includes("essentialQuestionCount: 0") === false, "no category advertises zero questions any more");
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
    "autosDealerQuickBusinessAdapter.ts": {
      canonical: [
        'autosLane: "negocios"', "vehicleTitle: buildVehicleTitle(year, make, model, trim) || undefined", "year,", "make,", "model,", "trim,", 'condition: conditionOrUndefined(quickStr(values, "condition"))', "mileage: numberOrUndefined(quickWholeDollars(values.mileage))", "price: numberOrUndefined(quickWholeDollars(values.price))", 'vin: quickStr(values, "vin") || undefined', 'description: quickStr(values, "description") || undefined', "city,", "zip,", 'dealerName: quickStr(values, "dealerName") || undefined', 'dealerPhoneOffice: quickStr(values, "phone") || undefined', 'dealerWhatsapp: quickStr(values, "whatsapp") || undefined', 'dealerEmail: quickStr(values, "email") || undefined', 'dealerWebsite: quickStr(values, "website") || undefined', "dealerAddressCity: city", "dealerAddressZip: zip", "mediaImages,", "heroImages: mediaImages.map((m) => m.url)",
      ],
    },
    "bienesNegocioQuickBusinessAdapter.ts": {
      canonical: [
        'sellerTipo: "agente_individual"', "categoriaPropiedad,", 'normalizeResidencialTipoPropiedadCodigo(quickStr(values, "tipoCodigo"))', 'normalizeComercialTipoCodigo(quickStr(values, "comercialTipoCodigo"))', 'normalizeTerrenoTipoCodigo(quickStr(values, "terrenoTipoCodigo"))', 'recamaras: categoriaPropiedad === "residencial" ? quickStr(values, "recamaras") : ""', 'banos: categoriaPropiedad === "residencial" ? quickStr(values, "banos") : ""', 'titulo: quickStr(values, "titulo")', "precio: quickWholeDollars(values.precio)", "...(condicionPropiedad ? { condicionPropiedad } : {})", 'descripcionPrincipal: quickStr(values, "descripcion")', "ciudad: resolveCity(values)", 'areaCiudad: quickStr(values, "areaCiudad")', 'direccionCodigoPostal: quickStr(values, "zip")', "fotosDataUrls: media.map((m) => m.dataUrl)", "fotoPortadaIndex: 0", 'agenteNombre: quickStr(values, "agenteNombre")', 'agenteTitulo: quickStr(values, "agenteTitulo")', 'agenteLicencia: quickStr(values, "agenteLicencia")', 'marcaNombre: quickStr(values, "marcaNombre")', 'agenteTelefonoPersonal: quickStr(values, "phone")', 'agenteWhatsapp: quickStr(values, "whatsapp")', 'correoPrincipal: quickStr(values, "email")', 'agenteSitioWeb: quickStr(values, "website")', "confirmListingAccurate: confirmations.infoTruthful", "confirmPhotosRepresentItem: confirmations.mediaAccurate", "confirmCommunityRules: confirmations.rulesAccepted", "confirmPaymentAfterPreview: confirmations.paymentAfterPreview",
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
  const ad = read(`${QB_ADAPTERS}/autosDealerQuickBusinessAdapter.ts`);
  assert.ok(/getAutosPreviewCompletenessIssues\("negocios", listing\)[\s\S]*rememberAutosDraftNamespaceHint\("negocios", ns\)[\s\S]*await saveAutosNegociosDraftResolved\(ns, \{/.test(ad), "Dealer: canonical negocios completeness runs before the namespace hint + canonical store write");
  assert.ok(ad.includes('const AUTOS_DEALER_PREVIEW_ROUTE = "/clasificados/autos/negocios/preview";') && ad.includes("withLangParam(AUTOS_DEALER_PREVIEW_ROUTE, ctx.routeLang as SupportedLang)"), "Dealer: hands off to the EXISTING dealer preview");
  assert.ok(ad.includes("...createEmptyListing()") && ad.includes("syncDealerAddressFromStructured({"), "Dealer: starts from the canonical empty listing and syncs the dealer address canonically");
  assert.ok(ad.includes("editorStep: AUTOS_PUBLISH_FINAL_STEP_INDEX") && ad.includes("vehicleTitleOverride: false"), "Dealer: draft lands on the final editor step exactly like the Full flush");
  const bd = read(`${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`);
  assert.ok(/gateBienesRaicesNegocioPreview\(mapAgenteResidencialFormStateToNegocioForPublish\(state\)\)[\s\S]*const applicationInstanceId = createBrAgenteResApplicationInstanceId\(\);[\s\S]*await persistAgenteResApplicationDraftResolved\(state, \{ applicationInstanceId, writeReturn: true \}\)/.test(bd), "Bienes: canonical gate (on the canonical publish mapping) runs before a fresh-instance canonical store write");
  assert.ok(bd.includes("state.confirmListingAccurate && state.confirmPhotosRepresentItem && state.confirmCommunityRules && state.confirmPaymentAfterPreview"), "Bienes: the Full application's four pre-preview confirmations are required");
  assert.ok(bd.includes('const BR_AGENTE_PREVIEW_ROUTE = "/clasificados/publicar/bienes-raices/negocio/agente-individual/preview";') && bd.includes("withBrAgenteResApplicationInstanceParam(BR_AGENTE_PREVIEW_ROUTE, applicationInstanceId)"), "Bienes: hands off to the EXISTING agente preview scoped to the instance it just wrote");
  assert.ok(bd.includes("mergePartialAgenteIndividualResidencial({"), "Bienes: builds through the canonical merge (canonical defaults for everything not asked)");
  assert.ok(bd.includes("readAgenteResPreviewDraftRawForApplication({ applicationInstanceId })"), "Bienes: refuses to hand off when the canonical store did not persist");
}

// 3. MEDIA LOCK ----------------------------------------------------------------------------------------------
{
  assert.ok(reg.includes("return { minImages: 1, maxImages, videoOptional: true, note };"), "every definition builds media with minImages 1");
  const intake = read(`${QB_COMPONENTS}/QuickBusinessIntakeClient.tsx`);
  assert.ok(intake.includes('from "@/app/publicar/rapido/_components/QuickMediaStep"') && intake.includes("validateQuickMedia(draft.media, definition.media, lang)"), "intake reuses the certified media step + media lock at Next and submit");
  const review = read(`${QB_COMPONENTS}/QuickBusinessReviewStep.tsx`);
  assert.ok(review.includes("media.length === 0"), "review submit disabled without an image");
  assert.ok(read(`${QB_ADAPTERS}/serviciosQuickBusinessAdapter.ts`).includes("coverUrl: gallery[0]?.url") && read(`${QB_ADAPTERS}/restaurantesQuickBusinessAdapter.ts`).includes("heroImage: hero ?? \"\""), "first real image becomes the canonical cover / hero");
  assert.ok(read(`${QB_ADAPTERS}/autosDealerQuickBusinessAdapter.ts`).includes('sourceType: "file", isPrimary: i === 0, sortOrder: i'), "Dealer: first real VEHICLE photo is the primary MediaImageEntry (existing vehicle media shape)");
  assert.ok(read(`${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`).includes("fotosDataUrls: media.map((m) => m.dataUrl)") && read(`${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`).includes("fotoPortadaIndex: 0"), "Bienes: first real PROPERTY photo is the cover (existing property media shape)");
  assert.ok(intake.includes("{qt(definition.mediaIntro, lang)}") && !intake.includes("mediaBusinessIntro"), "intake shows the per-category truthful media wording (vehicle / property / business)");
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
  for (const k of ["servicios: serviciosQuickBusinessAdapter", "restaurantes: restaurantesQuickBusinessAdapter", '"autos-dealer": autosDealerQuickBusinessAdapter', '"bienes-negocio": bienesNegocioQuickBusinessAdapter']) assert.ok(idx.includes(k), `adapter registry holds ${k}`);
  assert.ok(exists(`${QB_ADAPTERS}/autosDealerQuickBusinessAdapter.ts`) && exists(`${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`), "Dealer + Bienes adapters exist");
  const intake = read(`${QB_COMPONENTS}/QuickBusinessIntakeClient.tsx`);
  assert.ok(intake.includes('if (!adapter || definition.status === "direct") {'), "intake keeps the honest direct fallback for any future non-live category");
  const review = read(`${QB_COMPONENTS}/QuickBusinessReviewStep.tsx`);
  assert.ok(review.includes('subject="property"') && review.includes("brAgenteApplicationPricingCopy(lang).confirmPayment") && review.includes("rulesOk && confirmations.paymentAfterPreview"), "review renders the EXISTING property confirmations + the existing agente payment acknowledgement for Bienes");
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
    // Remaining-families mission (branch claude/quick-remaining-families-build-2026-09, off this exact certified
    // SHA): the additive `/publicar/comida-local/rapido/**` tree is a standalone Quick front door onto the
    // EXISTING Comida Local product — it cannot join the closed, verifier-locked `quickBusinessRegistry.ts` union
    // (asserted "exactly four live categories" above), so it lives beside it instead. Never widens this registry.
    /^app\/\(site\)\/publicar\/(?!negocio-rapido\/|comida-local\/|PublicarGatewayClient\.tsx$)/,
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
  const quickFiles = execSync(`git ls-files --others --exclude-standard --cached "${QB_ROUTE}" "${QB_LIB}"`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  const DEALER = `${QB_ADAPTERS}/autosDealerQuickBusinessAdapter.ts`;
  const BIENES = `${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`;
  const VEHICLE_RE = /autoDealerDraft|AutoDealerListing|mediaImages|heroImages|inventory_vehicle|vehicleTitle|\bvin\b/i;
  const PROPERTY_RE = /bienesRaicesNegocioFormState|AgenteIndividualResidencialFormState|photoUrls|petsAllowed|precio:|fotosDataUrls/;
  for (const f of quickFiles) {
    const src = read(f);
    if (f !== DEALER) assert.ok(!VEHICLE_RE.test(src), `${f}: vehicle data lives only in the Dealer adapter`);
    if (f !== BIENES) assert.ok(!PROPERTY_RE.test(src), `${f}: property data lives only in the Bienes adapter`);
  }
  // Dealer: ONE real first vehicle, no bundled inventory, no fabricated vehicle facts.
  const ad = read(DEALER);
  assert.ok(ad.includes("additionalInventoryVehicles: []"), "Dealer: no bundled inventory children");
  assert.ok(!/inventoryBoostSelected|inventory_role|dealer_inventory_group_id|inProgressInventoryVehicleDraft|resolveDealerActiveVehicleLimit|AUTOS_DEALER_INVENTORY_PACK/.test(ad), "Dealer: inventory pack / roles / limits untouched by Quick");
  assert.ok(!/mileage: \d|vin: "|condition: "(new|used|certified)"|price: \d|stockNumber:|monthlyEstimate:|badges: \[|features: \[|dealerHours: \[|dealerLogo:/.test(ad), "Dealer: no fabricated mileage / VIN / condition / price / stock / hours / logo");
  assert.ok((ad.match(/mediaImages: MediaImageEntry\[\] = media\.map/g) ?? []).length === 1 && !/dealerLogo/.test(ad), "Dealer: customer photos map ONLY to the vehicle gallery, never to a dealer logo");
  assert.ok(/label: \{ es: "Tu primer vehículo", en: "Your first vehicle" \}|title: \{ es: "Tu primer vehículo", en: "Your first vehicle" \}/.test(ad), "Dealer: the vehicle step is labeled as the first vehicle");
  // Bienes: ONE real first property, no inventory children, no fabricated property / agent facts.
  const bd = read(BIENES);
  assert.ok(!/additionalInventoryProperties|inventoryPackAccepted|confirmInventoryPackPricing|BR_INVENTORY_PACK|brInventoryGroupId|inventoryMode/.test(bd), "Bienes: no inventory children / pack acceptance written by Quick");
  assert.ok(!/petsAllowed|estadoAnuncio:|condicionPropiedad: "|agenteLicencia: "|marcaNombre: "|recamaras: "\d|banos: "\d|tamanoInteriorSqft|direccionLinea1|destacados:|hasHoa|agenteFotoDataUrl|marcaLogoDataUrl|mostrarSegundoAgente: true|mostrarBrokerAsesor: true/.test(bd), "Bienes: no fabricated pets / status / condition / license / brokerage / beds / baths / sqft / address / amenities / agent photo / second agent / broker");
  assert.ok(bd.includes('key: "condicionPropiedad", kind: "select"') && bd.includes("required: true, options: CONDICION_OPTIONS"), "Bienes: property condition is ASKED (the canonical default would otherwise render on the preview)");
  assert.ok(/title: \{ es: "Tu primera propiedad", en: "Your first property" \}/.test(bd), "Bienes: the property step is labeled as the first property");
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
  assert.ok(lp.includes("Aplicación completa / Full application") && lp.includes("href={withLang(def.standardApplicationPath, linkLang)}"), "launchpad keeps the EXISTING full application one tap away on every Quick business card");
  assert.ok(lp.includes('if (def.status === "direct") return withLang(def.standardApplicationPath, lang);') && lp.includes('return quickBusinessCategoryPath(def.key, lang, "staff");'), "launchpad: Create Quick Business + Send Quick Link resolve to the Quick form for live categories");
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
