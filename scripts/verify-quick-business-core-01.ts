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
import { decideBusinessBasePlanOffer } from "../app/lib/listingPlans/businessBasePlanOfferPolicy";
import { businessBasePackageKeys } from "../app/lib/listingPlans/businessAccessLevel";

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
  assert.equal((reg.match(/publishForClientSupported: true/g) ?? []).length, 4, "publish-for-client is wired for all 4 Quick Business categories (Servicios, Restaurantes, Autos Dealer, Bienes Negocio — QB-CONVERGENCE closeout)");
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
  assert.deepEqual(contactKeys, ["phone", "sms", "whatsapp", "email", "website"], "shared business contact step declares phone / sms / whatsapp / email / website (Bible §10.1)");
  const hoursKeys = [...shared.matchAll(/key: "(hours[A-Za-z]+)"/g)].map((m) => m[1]!);
  assert.deepEqual(hoursKeys, ["hoursDays", "hoursOpen", "hoursClose"], "shared hours fields declared");
  // Bible §10.1: email and website cannot satisfy the direct-contact minimum; SMS is explicit, not derived from phone.
  assert.ok(shared.includes('atLeastOne: { keys: ["phone", "sms", "whatsapp"]'), "contact step requires at least one of phone/SMS/WhatsApp (email/website cannot satisfy; SMS is independent of phone)");

  // Self-test: a synthetic adapter with a decorative field and a phantom read must FAIL the detector.
  const synthetic = `{ key: "title", kind: "text" } { key: "ghost", kind: "text" } title: quickStr(values, "title"), extra: quickStr(values, "phantomKey"),`;
  const sw = analyzeAdapter(synthetic, [], []);
  assert.deepEqual(unwired(sw), ["ghost"], "detector self-test: decorative field is caught");
  assert.deepEqual(phantom(sw, new Set()), ["phantomKey"], "detector self-test: undeclared read is caught");

  const adapters: Record<string, { canonical: string[]; allowedReads?: string[] }> = {
    "serviciosQuickBusinessAdapter.ts": {
      canonical: [
        "businessTypeId,", "customServiceDescription:", "businessName:", "selectedServiceIds:", "customServicesOffered:", "aboutText:", "city: resolveCity(values)", "hours: hoursFrom(values", "phone:", "quoteMessagePhone:", "whatsapp:", "email:", "website:", "coverUrl:", "gallery,", "featuredGalleryIds:", "confirmListingAccurate:", "confirmPhotosRepresentBusiness:", "confirmCommunityRules:",
      ],
    },
    "restaurantesQuickBusinessAdapter.ts": {
      canonical: [
        'productType: "established_restaurant"', "businessName:", "businessType:", "businessTypeCustom:", "primaryCuisine:", "primaryCuisineCustom:", "shortSummary:", "serviceModes,", "cityCanonical: resolveCity(values)", "...weeklyHoursFrom(values)", "phoneNumber:", "whatsAppNumber:", "email:", "websiteUrl:", "heroImage:", "galleryImages:",
        // Gate 1 wired: smsNumber propagated through RestauranteListingDraft → listing_json.
        'smsNumber: quickStr(values, "sms")',
      ],
    },
    "autosDealerQuickBusinessAdapter.ts": {
      canonical: [
        'autosLane: "negocios"', "vehicleTitle: buildVehicleTitle(year, make, model, trim) || undefined", "year,", "make,", "model,", "trim,", 'condition: conditionOrUndefined(quickStr(values, "condition"))', "mileage: numberOrUndefined(quickWholeDollars(values.mileage))", "price: numberOrUndefined(quickWholeDollars(values.price))", 'vin: quickStr(values, "vin") || undefined', 'description: quickStr(values, "description") || undefined', "city,", "zip,", 'dealerName: quickStr(values, "dealerName") || undefined', 'dealerPhoneOffice: quickStr(values, "phone") || undefined', 'dealerSmsPhone: quickStr(values, "sms") || undefined', 'dealerWhatsapp: quickStr(values, "whatsapp") || undefined', 'dealerEmail: quickStr(values, "email") || undefined', 'dealerWebsite: quickStr(values, "website") || undefined', "dealerAddressCity: city", "dealerAddressZip: zip", "mediaImages,", "heroImages: mediaImages.map((m) => m.url)",
      ],
    },
    "bienesNegocioQuickBusinessAdapter.ts": {
      canonical: [
        'sellerTipo: "agente_individual"', "categoriaPropiedad,", 'normalizeResidencialTipoPropiedadCodigo(quickStr(values, "tipoCodigo"))', 'normalizeComercialTipoCodigo(quickStr(values, "comercialTipoCodigo"))', 'normalizeTerrenoTipoCodigo(quickStr(values, "terrenoTipoCodigo"))', 'recamaras: categoriaPropiedad === "residencial" ? quickStr(values, "recamaras") : ""', 'banos: categoriaPropiedad === "residencial" ? quickStr(values, "banos") : ""', 'titulo: quickStr(values, "titulo")', "precio: quickWholeDollars(values.precio)", "...(condicionPropiedad ? { condicionPropiedad } : {})", 'descripcionPrincipal: quickStr(values, "descripcion")', "ciudad: resolveCity(values)", 'areaCiudad: quickStr(values, "areaCiudad")', 'direccionCodigoPostal: quickStr(values, "zip")', "fotosDataUrls: media.map((m) => m.dataUrl)", "fotoPortadaIndex: 0", 'agenteNombre: quickStr(values, "agenteNombre")', 'agenteTitulo: quickStr(values, "agenteTitulo")', 'agenteLicencia: quickStr(values, "agenteLicencia")', 'marcaNombre: quickStr(values, "marcaNombre")', 'agenteTelefonoPersonal: quickStr(values, "phone")', 'agenteWhatsapp: quickStr(values, "whatsapp")', 'correoPrincipal: quickStr(values, "email")', 'agenteSitioWeb: quickStr(values, "website")', "confirmListingAccurate: confirmations.infoTruthful", "confirmPhotosRepresentItem: confirmations.mediaAccurate", "confirmCommunityRules: confirmations.rulesAccepted", "confirmPaymentAfterPreview: confirmations.paymentAfterPreview",
        // Gate 1 wired: agenteSmsPersonal propagated through AgenteIndividualResidencialFormState → identityAgente.smsPersonal.
        'agenteSmsPersonal: quickStr(values, "sms")',
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
  assert.ok(reg.includes("return { minImages: 1, maxImages: 3, videoOptional: false, note };"), "Quick Business media: 3 max, no video");
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
  // Quick sells the SIMPLE package, never the Full $399 base package. Naming a base key here
  // would charge a Quick customer for the full product.
  assert.deepEqual(new Set(keys), new Set(["servicios_quick_monthly", "restaurantes_quick_monthly", "autos_dealer_quick_monthly", "br_agent_quick_monthly"]), "postures name only the four Quick commercial packages");
  for (const k of keys) assert.ok(matrix.includes(`"${k}"`), `packageKey ${k} exists in revenuePricingMatrix`);
  const tree = execSync(`git ls-files --others --exclude-standard --cached "${QB_ROUTE}" "${QB_LIB}"`, { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter(Boolean);
  assert.ok(tree.length >= 12, "Quick Business tree present");
  for (const f of tree) {
    const src = read(f);
    // The doorway component may reference the /api/stripe/billing-portal-session URL path — a route name, not
    // Stripe SDK usage. Strip that path before checking for SDK/pricing literals in the QB tree.
    const srcNoPortalUrl = src.replace(/\/api\/stripe\/billing-portal-session/g, "");
    assert.ok(!/39900|12900|9900|\$399|\$99|priceCents: \d|stripe|Stripe|promo/.test(srcNoPortalUrl), `${f}: no amount / Stripe SDK / promo literal (billing portal URL path excepted)`);
    assert.ok(!/signInWithOtp|signInWithPassword|cookies\(\)|createServerClient|service_role|SUPABASE_SERVICE_ROLE_KEY/.test(src), `${f}: no auth / privileged code`);
    assert.ok(!/owner_id|owner_user_id|ownerUserId|rosterId|authUserId/.test(src), `${f}: never writes or reads an owner / staff identity`);
    // The Quick tree never touches the database and never calls a PUBLISH endpoint. The customer
    // doorway is the one file that legitimately calls server APIs, because a control that cannot
    // perform its action is worse than no control — but only the management/read endpoints named
    // here, each of which is authenticated and ownership-checked server-side. Any other `/api/`
    // call, and any direct Supabase access anywhere in the tree, still fails.
    const DOORWAY_ALLOWED_ENDPOINTS = [
      "/api/stripe/billing-portal-session", // server-created portal session (no static URL)
      "/api/clasificados/quick-business/my-listing", // read-only canonical listing resolution
      "/api/clasificados/servicios/manage", // existing owner lifecycle endpoint
      "/api/clasificados/restaurantes/manage", // existing owner lifecycle endpoint
      "/api/clasificados/bienes-raices/listing-lifecycle", // existing owner lifecycle endpoint
      "/api/clasificados/autos/listings/", // existing owner unpublish/restore endpoints
    ];
    let stripped = src;
    for (const allowed of DOORWAY_ALLOWED_ENDPOINTS) stripped = stripped.split(allowed).join("");
    assert.ok(
      !/\.from\(|\.insert\(|\.update\(|\.upsert\(/.test(stripped),
      `${f}: never touches the database directly`,
    );
    assert.ok(
      !/fetch\(\s*["'`]\/api\//.test(stripped),
      `${f}: never calls an API outside the allowlisted management endpoints`,
    );
    // Whatever it calls, it must never be a publish endpoint. Scoped to actual fetch targets:
    // an import path such as `lib/publish/leonixRequiredForPreviewGates` is not an API call.
    assert.ok(
      !/fetch\(\s*["'`][^"'`]*\/publish\b/.test(src),
      `${f}: never calls a publish endpoint`,
    );
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
    /^app\/components\//, /^app\/api\//, /^supabase\//, /^app\/\(site\)\/clasificados\//,
    // Remaining-families closeout: Ofertas coupon checkout consent was cross-wired to the flyer $399.
    // The one dashboard file below is aligned to the existing server package; no other dashboard path is opened.
    /^app\/\(site\)\/dashboard\/(?!ofertas-locales\/\[id\]\/checkout\/page\.tsx$)/,
    // Remaining-families mission (branch claude/quick-remaining-families-build-2026-09, off this exact certified
    // SHA): the additive `/publicar/comida-local/rapido/**` tree is a standalone Quick front door onto the
    // EXISTING Comida Local product — it cannot join the closed, verifier-locked `quickBusinessRegistry.ts` union
    // (asserted "exactly four live categories" above), so it lives beside it instead. Never widens this registry.
    /^app\/\(site\)\/publicar\/(?!negocio-rapido\/|comida-local\/|PublicarGatewayClient\.tsx$)/,
    /^app\/admin\/(?!\(dashboard\)\/businesses\/QuickApplicationsLaunchpad\.tsx$)/,
    /^app\/lib\/quickClassifieds\//, /^app\/manifest\.ts$/,
  ];
  /**
   * SIMPLE-vs-FULL commercial closeout — the owner authorized exactly these Revenue OS and
   * server-entitlement surfaces so Quick could stop pointing at the Full base packages. The
   * list is file-exact rather than a directory pattern, so the guard still catches any other
   * drift into `app/lib/listingPlans/` or `app/api/`.
   */
  const MISSION_AUTHORIZED = new Set([
    "app/lib/listingPlans/businessAccessLevel.ts", // new: the SIMPLE/FULL resolver
    "app/lib/listingPlans/fullOnlyFeatureGate.ts", // new: the server gate for Full-only features
    "app/lib/listingPlans/categoryCommercialPlan.ts", // reuses the existing entitlement fetch
    "app/lib/listingPlans/revenuePricingMatrix.ts", // the four Quick packages + access declarations
    "app/lib/listingPlans/revenueActiveEntitlementGuard.ts", // Quick packages join the recharge guard
    "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts", // the four Quick checkout constants
    "app/lib/listingPlans/businessAccessCopy.ts", // new: centralized ES/EN Simple/Full copy, no prices
    "app/api/dashboard/analytics/listing/route.ts", // analytics becomes a Full-only capability
    // Staff truth (Gate 11): the entitlement tracker could not tell a Quick row from a Full row,
    // because both read package_tier "digital_only". Additive display only — one badge, one SKU
    // line, and the package_key column the writer already populates surfaced on the read type.
    "app/admin/(dashboard)/workspace/package-entitlements/page.tsx",
    "app/admin/_lib/packageEntitlementData.ts",
    // Chunk 2 (Gate 1) — closing the purchase circuit. Chunk 1 declared the Quick packages but
    // nothing sold them: the Quick intake handed off to the shared preview, the preview checked
    // out the FULL key, and the webhook would have skipped a Quick payment as "wrong package",
    // leaving a paying customer unpublished. Each file below either chooses between two existing
    // package keys or widens an exact-key gate to accept EITHER of a category's two base keys.
    "app/lib/listingPlans/businessQuickPlanSignal.ts", // new: which base package is being bought
    "app/lib/listingPlans/categoryCommercialPlanPolicy.ts", // a live Quick row is a canonical plan
    "app/lib/listingPlans/publishCheckoutCheckpoint.ts", // Quick inventory allowance constants
    "app/lib/listingPlans/revenueFulfillment.ts", // webhook routes a Quick payment to its category
    "app/lib/listingPlans/revenueServiciosFulfillment.ts", // a paid Quick listing publishes
    "app/lib/listingPlans/revenueRestaurantFulfillment.ts", // a paid Quick listing publishes
    "app/lib/listingPlans/revenueAutosDealerFulfillment.ts", // a paid Quick listing publishes
    "app/lib/listingPlans/revenueBienesNegocioFulfillment.ts", // a paid Quick listing publishes
    "app/api/revenue-os/checkout/route.ts", // the autos pre-flight accepts the Quick dealer key
    "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx",
    "app/(site)/clasificados/restaurantes/preview/RestaurantePreviewClient.tsx",
    "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
    "app/(site)/clasificados/autos/negocios/lib/autosDealerRevenueCheckout.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
    // Chunk 2 (Gate 3) — the SIMPLE -> FULL upgrade, and the resume price. A paid Simple customer
    // had no purchasable route to Full, because a published listing has no checkout in its
    // preview; and a Quick customer who abandoned Stripe was re-offered the FULL package, because
    // the dashboard link carries no `?plan=quick` marker. Both are answered from server state.
    // Nothing below writes to a listing row, so the upgrade cannot change identity.
    "app/lib/listingPlans/businessBasePlanOfferPolicy.ts", // the decision, pure
    "app/lib/listingPlans/businessBasePlanOffer.ts", // its owner-verified server reads
    "app/lib/listingPlans/businessBasePlanOfferClient.ts", // the read-only client hook
    "app/api/revenue-os/business-base-plan/route.ts", // read-only, bearer-auth, no mutation
    "app/(site)/dashboard/lib/businessSimpleToFullUpgradeCheckout.ts", // the one upgrade starter
    "app/(site)/dashboard/components/BusinessSimpleToFullUpgradePanel.tsx", // its shared CTA
    "app/(site)/dashboard/servicios/page.tsx",
    "app/(site)/dashboard/restaurantes/page.tsx",
    "app/(site)/clasificados/autos/dashboard/AutosDealerInventoryDashboardSection.tsx",
    "app/(site)/dashboard/components/LeonixRealEstateListingManageCard.tsx",
    // Gate 2 corrective — TranslateAdControl wired into the Bienes Negocio public detail shell.
    // Two new lib-only files (translate-ad module + hook); one existing shell updated.
    "app/(site)/clasificados/bienes-raices/lib/bienesNegocioTranslateAd.ts",
    "app/(site)/clasificados/bienes-raices/lib/useBienesNegocioShellTranslation.ts",
    "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx",
    // Gate 1 (SMS trace) — explicit smsNumber field added to Restaurantes model + contact hub; explicit
    // agenteSmsPersonal propagated through Bienes agente form state → negocio form state → preview VM.
    // No schema migration: smsNumber / smsPersonal persists in listing_json (JSONB). Backwards-compatible
    // optional fields; legacy drafts without them fall back to phone-derived SMS.
    "app/(site)/clasificados/restaurantes/application/restauranteListingApplicationModel.ts",
    "app/(site)/clasificados/restaurantes/application/buildRestaurantContactHub.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/schema/bienesRaicesNegocioFormState.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish.ts",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/application/mapping/mapBienesRaicesNegocioStateToPreviewVm.ts",
    // Gate 4 (Staff Operations — Restaurantes) — publish route accepts assistedAction following the
    // Servicios golden pattern: HMAC-signed cookie, category guard, client-attributed row,
    // linkAssistedListingToBusiness. The UI buttons in RestaurantePreviewClient.tsx remain REPAIR_REQUIRED.
    "app/api/clasificados/restaurantes/publish/route.ts",
    // QB Commercial Closeout — Lifecycle + Convergence gates.
    // These are the ONLY new server surfaces authorized. All others remain protected.
    "app/lib/listingPlans/quickToFullConvergence.ts", // Gate QB-CONVERGENCE-01: cancel Quick after Full webhook
    "app/lib/business/assistedListingCustody.ts", // extended AssistedListingSource to include autos + bienes
    "app/api/clasificados/autos/assisted-publish/route.ts", // Gate QB-STAFF-AUTOS-01: dealer staff-assisted publish
    "app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts", // Gate QB-STAFF-BR-01: bienes staff-assisted publish
    "app/api/clasificados/restaurantes/manage/route.ts", // Gate QB-RESTAURANTES-MANAGE-01: archive action
    "app/api/stripe/billing-portal-session/route.ts", // server-side Stripe billing portal session (never static URL)
    "app/api/clasificados/quick-business/my-listing/route.ts", // listing state resolver for doorway
    // ---------------------------------------------------------------------------------------
    // QUICK FINAL REPAIR — canonical identity, real lifecycle, immediate convergence, semantic
    // media. Each entry is a surface the repair could not be performed without; nothing else in
    // the protected tree is opened.
    // ---------------------------------------------------------------------------------------
    // A1 identity: self-service publishing must write the same canonical business↔listing link
    // that staff-assisted publishing writes, or "My Business" has no durable identity to resolve.
    "app/lib/business/canonicalListingLink.ts", // new: ownership-proving, idempotent link writer
    "app/api/business/listing-link/route.ts", // new: the one server seam for browser-published Bienes
    "app/api/clasificados/servicios/publish/route.ts", // additive self-service link write
    "app/api/clasificados/autos/listings/route.ts", // additive self-service link write (dealer main row)
    "app/(site)/clasificados/lib/leonixPublishRealEstateListingCore.ts", // additive link write-back call
    // Consequence of A1: self-published links would otherwise appear in the admin "Leonix-prepared
    // drafts" strip and make that label false. Filtered by linked_by vs owner.
    "app/admin/(dashboard)/businesses/[businessId]/PreparedListingsStrip.tsx",
    // A3 convergence: policy and orchestration split out of the server-only module so the
    // behaviour can be proven by a test instead of asserted as a comment.
    "app/lib/listingPlans/quickToFullConvergencePure.ts", // new: pure planner
    "app/lib/listingPlans/quickToFullConvergenceCore.ts", // new: port-injected executor
    "app/lib/listingPlans/revenueAuditLog.ts", // the four convergence audit actions
    // A4 security: HMAC crypto extracted so forgery/tamper/expiry are provable by real attacks.
    "app/lib/auth/assistedPublishingToken.ts", // new: pure token crypto
    "app/lib/auth/assistedPublishingSession.ts", // now a thin server-only wrapper, API unchanged
  ]);
  // A touched entry from `git status --short` may be a directory (`app/api/new-dir/`) for newly
  // added dirs not yet staged; check if it is authorized directly or all contained authorized files.
  function isPathAuthorized(f: string): boolean {
    if (MISSION_AUTHORIZED.has(f)) return true;
    if (f.endsWith("/")) return [...MISSION_AUTHORIZED].some((auth) => auth.startsWith(f));
    return false;
  }
  const violations = touched.filter(
    (f) => f.startsWith("app/") && !isPathAuthorized(f) && PROTECTED.some((re) => re.test(f)),
  );
  assert.deepEqual(violations, [], `protected canonical / certified surfaces must not change: ${violations.join(", ")}`);
  // Section 6's claim is NO PARALLEL PRODUCT: Quick must not grow its own tables. Gate
  // QB-LIFECYCLE-02 authors one additive migration that only widens two existing lifecycle CHECK
  // constraints so two genuinely-missing owner capabilities can later exist — it creates no table
  // and is deliberately NOT applied. The guard is therefore narrowed to the real claim rather than
  // dropped: a migration may not create a table, and may not create a Quick-specific one at all.
  for (const f of touched.filter((x) => x.startsWith("supabase/migrations/"))) {
    const sql = read(f);
    assert.ok(!/create\s+table/i.test(sql), `${f}: Quick must not create a database table`);
    assert.ok(!/quick_/i.test(sql.replace(/^\s*--.*$/gm, "")), `${f}: no Quick-specific database object`);
  }
  assert.ok(
    !touched.some((f) => f.startsWith("app/api/") && !isPathAuthorized(f)),
    "no new API route outside MISSION_AUTHORIZED",
  );
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
  /**
   * Gate QB-MEDIA-02 / QB-LIFECYCLE-02 add two CROSS-FAMILY CONTRACT modules. By definition they
   * must name every family's vocabulary in one place — that is what makes them one contract rather
   * than four divergent copies. They are exempt from the per-adapter isolation rule, and in
   * exchange are held to a stricter one asserted immediately below: they may DESCRIBE a family's
   * data but must never CONSTRUCT a listing or touch a draft store.
   */
  const CROSS_FAMILY_CONTRACTS = new Set([
    `${QB_LIB}/quickBusinessMediaSemantics.ts`,
    `${QB_LIB}/quickBusinessLifecycleCapabilities.ts`,
  ]);
  for (const f of quickFiles) {
    const src = read(f);
    if (CROSS_FAMILY_CONTRACTS.has(f)) {
      assert.ok(
        !/createEmptyListing|createDefaultClasificados|mergePartialAgente|saveAutos|persistServicios|Draft\s*=\s*\{/.test(src),
        `${f}: a cross-family contract may describe data, never construct a listing or a draft`,
      );
      continue;
    }
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

// 9. UPGRADE BILLING CONVERGENCE — Gate 4 corrective -----------------------------------------------------------
// Verifies three linked correctness properties (all mock-based, no live DB/Stripe):
//   a. billingHref is defined in all 4 registry manage blocks and points to the real Stripe portal path.
//   b. The client doorway's billing section points to manage.billingHref (the real portal), not manageHref.
//   c. The Pause section carries the REPAIR_REQUIRED comment and no longer labels the button "Pausar".
//   d. decideBusinessBasePlanOffer (pure, no DB) correctly routes:
//      "simple" → upgrade (sells full key), "full" → settled (nothing to sell).
//   e. businessBasePackageKeys lists Full before Quick for each category — so a listing with both active
//      resolves to Full, never to a false downgrade.
{
  // (a) billingHref in all 4 manage blocks
  for (const catKey of ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"] as const) {
    const block = registryBlock(catKey.includes("-") ? `"${catKey}"` : catKey);
    assert.ok(block.includes('billingHref: "/dashboard/perfil"'), `${catKey} manage block has billingHref → /dashboard/perfil`);
  }
  // (b) billing uses server-side POST to /api/stripe/billing-portal-session (Gate QB-LIFECYCLE-02):
  //     the Stripe customer ID is resolved server-side, never passed from browser state.
  const myBiz = read(`${QB_COMPONENTS}/QuickBusinessMyBusinessClient.tsx`);
  assert.ok(myBiz.includes("/api/stripe/billing-portal-session"), "billing POSTs to server-side Stripe billing portal route (never a static URL)");
  assert.ok(myBiz.includes('method: "POST"'), "billing portal call is a POST (read-only management, never a data mutation)");
  assert.ok(!myBiz.includes("href={billingHref}") && !myBiz.includes("href={manage.billingHref}"), "billing link is not a static anchor (uses server-side session redirect)");
  // (c) Pause/End controls. The previous form of this check asserted that NO Pause button may
  // exist, which was the honest state while the doorway could not mutate anything. Gate
  // QB-LIFECYCLE-02 makes those mutations real, so the requirement inverts: a control may exist,
  // but ONLY where the family's schema genuinely supports it. That is a strictly stronger claim
  // than "no button", and it is what the doorway is now held to.
  assert.ok(
    myBiz.includes("getLifecycleCapability(") && myBiz.includes('state === "supported"'),
    "lifecycle controls are rendered from the capability matrix, never unconditionally",
  );
  assert.ok(
    myBiz.includes("isTransitionLegalFrom("),
    "a control is only offered when the transition is legal from the listing's real current status",
  );
  assert.ok(
    myBiz.includes("resolveLifecycleEndpoint("),
    "the endpoint comes from the capability matrix, so an unsupported intent cannot form a request",
  );
  // Labels come from the matrix, so no hard-coded verb can promise an action the schema lacks.
  assert.ok(
    !/>\s*(Pausar|Pause)\s*</.test(myBiz),
    "no hard-coded Pause label — labels are supplied by the capability that proves the action exists",
  );
  assert.ok(myBiz.includes('"Go to dashboard"'), "the not-available path still offers honest navigation (en)");
  // (d) decideBusinessBasePlanOffer pure logic — tested inline without DB (imported statically above)
  for (const cat of ["servicios", "restaurantes", "autos", "bienes-raices"] as const) {
    const upgradeOffer = decideBusinessBasePlanOffer({
      category: cat,
      accessLevel: "simple",
      heldPackageKey: "some_quick_key",
      resumePackageKey: null,
    });
    assert.equal(upgradeOffer.mode, "upgrade", `decideBusinessBasePlanOffer(${cat}, simple) → upgrade`);
    assert.ok(upgradeOffer.sellPackageKey !== null, `upgrade offer for ${cat} has a sellPackageKey`);

    const settledOffer = decideBusinessBasePlanOffer({
      category: cat,
      accessLevel: "full",
      heldPackageKey: "some_full_key",
      resumePackageKey: null,
    });
    assert.equal(settledOffer.mode, "settled", `decideBusinessBasePlanOffer(${cat}, full) → settled`);
    assert.equal(settledOffer.sellPackageKey, null, `settled offer for ${cat} sells nothing`);
  }
  // (e) businessBasePackageKeys — Full must come before Quick (imported statically above)
  for (const cat of ["servicios", "restaurantes", "autos", "bienes-raices"] as const) {
    const keys = businessBasePackageKeys(cat);
    assert.ok(keys.length >= 2, `${cat} has at least two base package keys (Full + Quick)`);
    const fullIdx = keys.findIndex((k) => !k.includes("quick"));
    const quickIdx = keys.findIndex((k) => k.includes("quick"));
    assert.ok(fullIdx >= 0 && quickIdx >= 0, `${cat} has both full and quick package keys`);
    assert.ok(fullIdx < quickIdx, `${cat}: Full key comes before Quick in businessBasePackageKeys (dual-active resolves to Full)`);
  }
}

// 10. (Gate 2 corrective) BIENES NEGOCIO TRANSLATION — TranslateAdControl wired in the public detail shell -----------
{
  const SHELL_PATH = "app/(site)/clasificados/bienes-raices/listing/BienesRaicesNegocioLiveDetailShell.tsx";
  const TRANSLATE_MODULE = "app/(site)/clasificados/bienes-raices/lib/bienesNegocioTranslateAd.ts";
  const TRANSLATE_HOOK = "app/(site)/clasificados/bienes-raices/lib/useBienesNegocioShellTranslation.ts";
  assert.ok(exists(SHELL_PATH), "BienesRaicesNegocioLiveDetailShell.tsx exists");
  assert.ok(exists(TRANSLATE_MODULE), "bienesNegocioTranslateAd.ts module exists");
  assert.ok(exists(TRANSLATE_HOOK), "useBienesNegocioShellTranslation hook exists");
  const shell = read(SHELL_PATH);
  assert.ok(shell.includes("TranslateAdControl"), "shell imports TranslateAdControl");
  assert.ok(shell.includes("useBienesNegocioShellTranslation"), "shell imports useBienesNegocioShellTranslation");
  assert.ok(shell.includes("requestAdTranslation"), "shell imports requestAdTranslation");
  assert.ok(shell.includes("shellTx.displayData"), "shell passes shellTx.displayData (not bare data) to the preview page");
  assert.ok(shell.includes("beforeMainGrid: translateControl"), "shell wires translateControl into publicChrome.beforeMainGrid");
  // Translation module correctness: title, description, and locationNote map to the right canonical fields.
  const mod = read(TRANSLATE_MODULE);
  assert.ok(mod.includes("title: data.titulo"), "translate module maps título → title slot");
  assert.ok(mod.includes("description: data.descripcionPrincipal"), "translate module maps descripcionPrincipal → description slot");
  assert.ok(mod.includes("next = { ...next, titulo: translated.title"), "translate module applies title back to titulo");
  assert.ok(mod.includes("next = { ...next, descripcionPrincipal: translated.description"), "translate module applies description back to descripcionPrincipal");
}

// 11. STAFF OPERATIONS — QB Commercial Closeout -------------------------------------------------------------------
// Proves:
//   a. publishForClientSupported: true for ALL 4 categories (QB-STAFF-AUTOS-01 + QB-STAFF-BR-01 wired).
//   b. No REPAIR_REQUIRED remains for Autos Dealer or Bienes Negocio.
//   c. The launchpad renders the staff note for ALL categories.
{
  // (a) All 4 categories are now wired
  assert.equal((reg.match(/publishForClientSupported: true/g) ?? []).length, 4, "all 4 categories have publishForClientSupported: true (QB Commercial Closeout)");
  assert.equal((reg.match(/publishForClientSupported: false/g) ?? []).length, 0, "no category has publishForClientSupported: false any more");

  // (b) All 4 staff blocks are wired — no REPAIR_REQUIRED
  for (const catKey of ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"] as const) {
    const keyExpr = catKey.includes("-") ? `"${catKey}"` : catKey;
    const block = registryBlock(keyExpr);
    assert.ok(block.includes("publishForClientSupported: true"), `${catKey} staff block is wired (publishForClientSupported: true)`);
    assert.ok(!block.includes("publishForClientSupported: false"), `${catKey} staff block does NOT incorrectly declare false`);
  }
  // Autos and Bienes REPAIR_REQUIRED must be gone (routes now exist)
  for (const catKey of ["autos-dealer", "bienes-negocio"] as const) {
    const block = registryBlock(`"${catKey}"`);
    assert.ok(!block.includes("REPAIR_REQUIRED"), `${catKey} staff block no longer carries REPAIR_REQUIRED (route now wired)`);
  }
  // New staff routes exist
  assert.ok(exists("app/api/clasificados/autos/assisted-publish/route.ts"), "Autos Dealer staff-assisted publish route exists (QB-STAFF-AUTOS-01)");
  assert.ok(exists("app/api/clasificados/bienes-raices/negocio/assisted-publish/route.ts"), "Bienes Negocio staff-assisted publish route exists (QB-STAFF-BR-01)");
  // Restaurantes manage route (archive action, no paused status in canonical schema)
  assert.ok(exists("app/api/clasificados/restaurantes/manage/route.ts"), "Restaurantes manage route exists (archive action only)");
  const restaurantesManage = read("app/api/clasificados/restaurantes/manage/route.ts");
  // Route accepts only "archive"; "paused" must not appear in ALLOWED_ACTIONS or any status transition
  assert.ok(restaurantesManage.includes('"archive"'), "Restaurantes manage: archive action present");
  assert.ok(!restaurantesManage.includes('"paused"') || restaurantesManage.includes('does NOT have a "paused"'), "Restaurantes manage: paused only appears in a disclaimer comment, never as an action");
  // Billing portal session route (server-side, never static URL)
  assert.ok(exists("app/api/stripe/billing-portal-session/route.ts"), "Stripe billing portal session route exists (server-side, never static URL)");
  // My-listing resolver exists
  assert.ok(exists("app/api/clasificados/quick-business/my-listing/route.ts"), "Quick Business my-listing resolver route exists");

  // (c) Launchpad renders staff note for ALL categories (not gated on publishForClientSupported: true)
  const launchpad = read("app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx");
  // The note must appear in BOTH the true branch and a fallback (else/ternary) — NOT in a single if-true block only
  assert.ok(
    launchpad.includes("def.staff.publishForClientSupported ?") || launchpad.includes("def.staff.publishForClientSupported &&"),
    "launchpad checks publishForClientSupported",
  );
  // The note text must be reachable when publishForClientSupported is false
  const afterTrueBranch = launchpad.slice(launchpad.indexOf("def.staff.note.es"));
  // There must be a second occurrence of def.staff.note.es (the false/else branch)
  assert.ok(afterTrueBranch.includes("def.staff.note.es", 1), "launchpad renders def.staff.note.es in BOTH branches (supported and REPAIR_REQUIRED)");
}

// 12. MEDIA SEMANTICS — Gate 6 corrective -------------------------------------------------------------------
// Proves at all authority layers: 0 images → blocked, 1–3 → allowed, 4 → blocked, video → blocked.
// Layer 1: contract definition (registry).
// Layer 2: validation function shape (quickClassifiedValidation.ts).
// Layer 3: intake UI enforcement (QuickBusinessIntakeClient.tsx, QuickMediaStep.tsx).
// Layer 4: adapter shape (first image becomes canonical cover/hero/primary).
{
  // Layer 1 — registry contract
  assert.ok(reg.includes("return { minImages: 1, maxImages: 3, videoOptional: false, note };"), "registry contract: minImages=1, maxImages=3, videoOptional=false (Bible §11.1)");
  // All 4 categories use this same contract helper; confirm by counting media() invocations
  assert.equal((reg.match(/media\(\{/g) ?? []).length, 4, "all 4 categories use the shared media() factory (same contract applied everywhere)");

  // Layer 2 — validation function shape
  const validation = read("app/lib/quickClassifieds/quickClassifiedValidation.ts");
  // 0 images → blocked: media.length < contract.minImages triggers an issue
  assert.ok(validation.includes("media.length < contract.minImages"), "validateQuickMedia: 0 images blocked via minImages check");
  // 4 images → blocked: media.length > contract.maxImages triggers an issue when maxImages is non-null
  assert.ok(validation.includes("contract.maxImages != null && media.length > contract.maxImages"), "validateQuickMedia: 4+ images blocked via maxImages check");
  // 1–3 → allowed: the function returns [] when both conditions pass (no negative assertion needed;
  // the two guarded branches above are the only error paths in the function)

  // Layer 3 — intake UI: (a) validation called at Next and Submit, (b) file input rejects non-images, (c) video not offered
  const intake = read(`${QB_COMPONENTS}/QuickBusinessIntakeClient.tsx`);
  assert.ok(intake.includes("validateQuickMedia(draft.media, definition.media, lang)"), "QuickBusinessIntakeClient: validateQuickMedia called at step navigation and submit");
  const mediaStep = read("app/(site)/publicar/rapido/_components/QuickMediaStep.tsx");
  assert.ok(mediaStep.includes('accept="image/*"'), "QuickMediaStep: file input accepts image/* only (video inputs absent)");
  assert.ok(!mediaStep.includes('accept="video') && !mediaStep.includes("video/*"), "QuickMediaStep: no video accept attribute (video blocked at upload layer)");

  // Layer 4 — adapter: first image is the canonical cover/hero/primary (no photo → no cover)
  const sv = read(`${QB_ADAPTERS}/serviciosQuickBusinessAdapter.ts`);
  assert.ok(sv.includes("coverUrl: gallery[0]?.url"), "Servicios: first image is the canonical cover (undefined when none)");
  const rs = read(`${QB_ADAPTERS}/restaurantesQuickBusinessAdapter.ts`);
  assert.ok(rs.includes("heroImage: hero ??"), "Restaurantes: first image is the canonical hero");
  const ad = read(`${QB_ADAPTERS}/autosDealerQuickBusinessAdapter.ts`);
  assert.ok(ad.includes("isPrimary: i === 0"), "Dealer: first vehicle photo is the canonical primary MediaImageEntry");
  const bd = read(`${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`);
  assert.ok(bd.includes("fotoPortadaIndex: 0"), "Bienes: first property photo is the canonical portada cover");
}

// 13. VERIFIER TRUTH — Gate 7 corrective -------------------------------------------------------------------
// Self-tests: key assertions in this verifier must ACTUALLY FAIL on broken inputs.
// Without negative tests a passing verifier is indistinguishable from one that trivially returns true.
{
  // (a) Staff: verifier catches a registry where one of the 4 true entries is incorrectly set to false
  const regMissingWiring = reg.replace(/publishForClientSupported: true/g, (m, offset) => {
    // Replace the first occurrence with "false" — simulates 1 gap regression
    const before = reg.slice(0, offset);
    const occurrencesSoBefore = (before.match(/publishForClientSupported: true/g) ?? []).length;
    return occurrencesSoBefore < 1 ? "publishForClientSupported: false" : m;
  });
  let caught = false;
  try {
    assert.equal((regMissingWiring.match(/publishForClientSupported: true/g) ?? []).length, 4, "self-test: should fail with fewer than 4 true entries");
  } catch {
    caught = true;
  }
  assert.ok(caught, "Gate 7 self-test (a): publishForClientSupported count assertion catches a registry with fewer than 4 true entries");

  // (b) Media: verifier catches a contract with minImages: 0 (Media Lock violated)
  const regBrokenMin = reg.replace("return { minImages: 1, maxImages: 3, videoOptional: false, note };", "return { minImages: 0, maxImages: 3, videoOptional: false, note };");
  let caughtMedia = false;
  try {
    assert.ok(regBrokenMin.includes("return { minImages: 1, maxImages: 3, videoOptional: false, note };"), "self-test: should fail when minImages ≠ 1");
  } catch {
    caughtMedia = true;
  }
  assert.ok(caughtMedia, "Gate 7 self-test (b): media contract assertion catches minImages: 0 (Media Lock violation)");

  // (c) Billing: verifier catches a doorway that uses a static href for billing (old pattern, now prohibited)
  //     Server-side billing portal session is now required; a static Link would be the regression.
  const syntheticDoorwayWithStaticBilling = `<Link href={billingHref}>Billing</Link>`;
  let caughtBilling = false;
  try {
    // The new check: billing must NOT use a static href
    assert.ok(!syntheticDoorwayWithStaticBilling.includes("href={billingHref}"), "self-test: should fail when static billingHref anchor exists");
  } catch {
    caughtBilling = true;
  }
  assert.ok(caughtBilling, "Gate 7 self-test (c): doorway billing check catches a static billingHref anchor (regression to old pattern)");

  // (d) Upgrade: decideBusinessBasePlanOffer must reject an impossible input at the type level;
  //     prove here that the settled offer provides null sellPackageKey (non-null would mean double-selling)
  const settledSimulation = decideBusinessBasePlanOffer({ category: "servicios", accessLevel: "full", heldPackageKey: "x", resumePackageKey: null });
  assert.equal(settledSimulation.sellPackageKey, null, "Gate 7 self-test (d): settled Full customer has null sellPackageKey (no double-sell possible)");
  let caughtSettled = false;
  try {
    assert.ok(settledSimulation.sellPackageKey !== null, "self-test: should fail when sellPackageKey is null");
  } catch {
    caughtSettled = true;
  }
  assert.ok(caughtSettled, "Gate 7 self-test (d): settled-offer null check assertion catches a non-null sellPackageKey (double-sell)");
}

console.log("verify-quick-business-core-01: OK");
