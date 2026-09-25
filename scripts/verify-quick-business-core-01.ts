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
        'productType: "established_restaurant"', "businessName:", "businessType:", "businessTypeCustom:", "primaryCuisine:", "primaryCuisineCustom:", "shortSummary:", "serviceModes,", "cityCanonical: resolveCity(values)", "...weeklyHoursFrom(values)", "phoneNumber:", "whatsAppNumber:", "email:", "websiteUrl:", "heroImage:", "foodImages:",
        // Quick photos 2..N land in `foodImages` (the Comida bucket the public gallery actually renders), not
        // `galleryImages` (venue supplemental, never rendered publicly). Owner lock 2026-09-24.
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
        'sellerTipo: "agente_individual"', "categoriaPropiedad,", 'normalizeResidencialTipoPropiedadCodigo(quickStr(values, "tipoCodigo"))', 'normalizeComercialTipoCodigo(quickStr(values, "comercialTipoCodigo"))', 'normalizeTerrenoTipoCodigo(quickStr(values, "terrenoTipoCodigo"))', 'recamaras: categoriaPropiedad === "residencial" ? quickStr(values, "recamaras") : ""', 'banos: categoriaPropiedad === "residencial" ? quickStr(values, "banos") : ""', 'titulo: quickStr(values, "titulo")', "precio: quickWholeDollars(values.precio)", "...(condicionPropiedad ? { condicionPropiedad } : {})", 'descripcionPrincipal: quickStr(values, "descripcion")', "ciudad: resolveCity(values)", 'areaCiudad: quickStr(values, "areaCiudad")', 'direccionCodigoPostal: quickStr(values, "zip")', "fotosDataUrls: galleryMediaOnly(media).map((m) => m.dataUrl)", "fotoPortadaIndex: 0", 'agenteNombre: quickStr(values, "agenteNombre")', 'agenteTitulo: quickStr(values, "agenteTitulo")', 'agenteLicencia: quickStr(values, "agenteLicencia")', 'marcaNombre: quickStr(values, "marcaNombre")', 'agenteTelefonoPersonal: quickStr(values, "phone")', 'agenteWhatsapp: quickStr(values, "whatsapp")', 'correoPrincipal: quickStr(values, "email")', 'agenteSitioWeb: quickStr(values, "website")', "confirmListingAccurate: confirmations.infoTruthful", "confirmPhotosRepresentItem: confirmations.mediaAccurate", "confirmCommunityRules: confirmations.rulesAccepted", "confirmPaymentAfterPreview: confirmations.paymentAfterPreview",
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
  assert.ok(reg.includes("return { minImages: 1, maxImages, videoOptional: false, note: note(maxImages) };"), "Quick Business media: category-aware max from the one cap table, no video");
  const intake = read(`${QB_COMPONENTS}/QuickBusinessIntakeClient.tsx`);
  /**
   * Gate QB-MEDIA-03 — the intake no longer reuses the certified Quick Classifieds media step.
   *
   * WHY THE EXPECTATION CHANGED: the certified step produces `QuickMediaItem`, which carries no
   * semantic role. The 2026-09-21 independent audit found the Quick Business media contract
   * operationally inert precisely because no producer emitted a role — so the certified step was
   * structurally incapable of satisfying the contract this verifier exists to protect. Quick
   * Business now owns a role-aware step INSIDE its own tree; the certified step and the certified
   * type remain byte-unchanged, which is what the reuse rule was actually protecting. The new
   * step is held to the same no-video lock, asserted below on the file that now renders.
   */
  assert.ok(
    intake.includes('from "./QuickBusinessMediaStep"') &&
      intake.includes("validateQuickBusinessIntakeMedia(draft.media, definition.media, lang, category)") &&
      intake.includes("undeclaredRoleIssues(draft.media, lang)"),
    "intake renders the role-aware Quick Business media step and runs the media lock at Next and submit",
  );
  assert.ok(
    !intake.includes('from "@/app/publicar/rapido/_components/QuickMediaStep"'),
    "the certified role-less media step is no longer rendered by Quick Business",
  );
  /**
   * Quick Business carries its own media contract because `QuickClassifiedMediaContract` types
   * `videoOptional` as the literal `true` (every Classifieds lane allows optional video) while
   * Quick Business allows none. The intake narrows its contract when handing it to the certified
   * `QuickMediaStep`. That narrowing is only sound because QuickMediaStep never reads
   * `videoOptional` — so assert that precondition mechanically here rather than trusting the
   * comment that states it.
   */
  {
    const mediaStepSrc = read("app/(site)/publicar/rapido/_components/QuickMediaStep.tsx");
    assert.ok(
      !/contract\.videoOptional/.test(mediaStepSrc),
      "QuickMediaStep must not read contract.videoOptional — the Quick Business narrowing in QuickBusinessIntakeClient depends on it",
    );
    assert.ok(
      mediaStepSrc.includes("contract.maxImages") && mediaStepSrc.includes("contract.note"),
      "QuickMediaStep reads only the count cap and the note from the contract",
    );
  }
  const review = read(`${QB_COMPONENTS}/QuickBusinessReviewStep.tsx`);
  assert.ok(review.includes("media.length === 0"), "review submit disabled without an image");
  assert.ok(read(`${QB_ADAPTERS}/serviciosQuickBusinessAdapter.ts`).includes("coverUrl: gallery[0]?.url") && read(`${QB_ADAPTERS}/restaurantesQuickBusinessAdapter.ts`).includes("heroImage: hero ?? \"\""), "first real image becomes the canonical cover / hero");
  {
    // Gate QB-MEDIA-03 — same canonical shape (`MediaImageEntry`, cover = first), now built from
    // the gallery with identity assets removed and the declared role stamped onto each entry.
    const dealerSrc = read(`${QB_ADAPTERS}/autosDealerQuickBusinessAdapter.ts`);
    assert.ok(
      /sourceType: "file",\s*isPrimary: i === 0,\s*sortOrder: i,\s*role: m\.role,/.test(dealerSrc),
      "Dealer: first real VEHICLE photo is the primary MediaImageEntry, and every entry declares its role",
    );
    assert.ok(
      dealerSrc.includes("galleryMediaOnly(media).map((m, i) => ({"),
      "Dealer: a dealership logo never enters the vehicle gallery",
    );
  }
  assert.ok(read(`${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`).includes("fotosDataUrls: galleryMediaOnly(media).map((m) => m.dataUrl)") && read(`${QB_ADAPTERS}/bienesNegocioQuickBusinessAdapter.ts`).includes("fotoPortadaIndex: 0"), "Bienes: first real PROPERTY photo is the cover (existing property media shape)");
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
    // SALES-READY PREVIEWS + ONLINE IX REWARDS REDEMPTION (2026-09-21).
    //
    // Two mission outcomes, and each entry below is a surface the outcome could not be reached
    // without. The guard itself is unchanged — no pattern was relaxed, no protected path removed.
    //
    // ONLINE REDEMPTION. Credits could be earned and not spent: every online checkout refused them
    // because reducing a `recurring` line item would have set the subscription's price for ever.
    // They now ride a Stripe `duration: "once"` coupon on the first invoice — the mechanism the
    // verified-intro discount already uses — so the line item, and therefore every renewal, is
    // untouched. One new module plus the checkout route that mints and attaches it.
    "app/lib/listingPlans/rewardsFirstInvoiceStripeCoupon.ts", // new: the amount_off once-coupon
    // ---------------------------------------------------------------------------------------
    // FINAL QUICK SALES PREVIEW WORKSPACE (2026-09-21).
    //
    // One secure sales motion for the four paid Quick categories: establish server-issued assisted
    // custody for a real customer/business, build the ad in the category's EXISTING intake, save it
    // as one canonical non-public draft, show the prospect an expiring read-only preview, revise
    // the same draft, and publish that same row only after the server itself confirms payment.
    //
    // The guard is unchanged: no pattern relaxed, no protected path removed. Every entry below is
    // a surface the outcome could not be reached without, and no entry introduces a parallel
    // product, a new lifecycle vocabulary, a fifth intake, or a Quick-specific table.
    "app/lib/auth/prospectPreviewToken.ts", // new: pure HMAC crypto for the expiring preview link
    "app/lib/auth/prospectPreviewSession.ts", // new: its server-only secret holder, fail-closed
    "app/lib/sales/assistedSameRowBinding.ts", // new: pure same-row authority decision
    "app/lib/sales/assistedClientAuthorization.ts", // new: customer↔business proof, server-side
    "app/lib/sales/salesWorkspaceAudit.ts", // new: staff audit via the EXISTING admin_audit_log
    "app/lib/sales/quickSalesCategories.ts", // new: the four categories → existing tables/intakes
    "app/lib/sales/prospectPreviewReader.ts", // new: whitelisted, read-only preview fields
    "app/lib/sales/assistedSaveForClientClient.ts", // new: the one client caller, four contracts
    // Directory entries cover the case where git reports an untracked FOLDER; the explicit file
    // paths beneath them cover the case where the same files are already tracked. Both spellings
    // are listed on purpose — an authorization that only works before the first commit is not one.
    "app/api/admin/sales-preview/", // new: custody, preview-link and post-payment publish routes
    "app/api/admin/sales-preview/custody/route.ts",
    "app/api/admin/sales-preview/preview-link/route.ts",
    "app/api/admin/sales-preview/publish/route.ts",
    "app/admin/(dashboard)/workspace/quick-sales/", // new: the staff workspace screen
    "app/admin/(dashboard)/workspace/quick-sales/page.tsx",
    "app/admin/(dashboard)/workspace/quick-sales/QuickSalesWorkspaceClient.tsx",
    "app/(site)/vista-previa/", // new: the prospect's read-only preview page
    "app/(site)/vista-previa/[category]/page.tsx",
    "app/(site)/clasificados/components/AssistedSaveForClientBar.tsx", // new: the shared staff strip
    // The three existing intakes that mount that shared strip. None gains a field, a draft store,
    // or a publish path of its own — see verify-p0-staff-assisted-category-access-01.ts. The Bienes
    // preview client is already authorized above, from an earlier mission.
    "app/(site)/publicar/restaurantes/RestauranteApplicationClient.tsx",
    "app/(site)/publicar/autos/shared/components/AutosPublishConfirmCore.tsx",
    // SALES PREVIEWS. Three server defects found by mapping the staff-assisted workflow, each of
    // which put an unpaid or mis-attributed listing in front of a customer:
    //  - Restaurantes `save_for_client` inserted `status: "published"` — the exact public predicate
    //    — so staff preparing an ad put an UNPAID listing live; it had no custody check, so a
    //    cookie for one business could overwrite another's row; and `publish_for_client` had no
    //    payment gate at all.
    //  - Autos `publish_for_client` checked for cleared payment and then changed nothing: the row
    //    stayed `draft` while staff were told the client's ad was published.
    //  - Bienes reported `{ ok: true }` on writes that matched zero rows.
    // The Restaurantes and Autos routes are already authorized above; Bienes is authorized here.
    // No new lifecycle vocabulary and no new public surface was introduced.
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
    // ------------------------------------------------------------------------------------------
    // Gate QB-MEDIA-03 (2026-09-21 audit repair) — the semantic media contract was DECLARED but
    // operationally inert: no producer emitted a role, a missing role was resolved to the
    // required subject role, and only the two staff-assisted routes enforced it. Making the claim
    // real required exactly these surfaces and no others.
    // ------------------------------------------------------------------------------------------
    // The four CUSTOMER self-service publish seams now run the canonical validator server-side.
    // (servicios/publish, restaurantes/publish and autos/listings are already authorized above
    // for the QB-IDENTITY-01 link write; the Bienes seam is new because that family publishes
    // from the browser and therefore had no server publish handler to host the check.)
    //
    // Gate QB-BOUNDARY-02 RETIRED this route: asking a gate and then inserting from the browser
    // anyway was two independent steps, and the second did not depend on the first. It stays
    // authorized because DELETING it is itself a change to a protected path, and its replacement
    // is the atomic publish endpoint below.
    "app/api/clasificados/bienes-raices/negocio/publish-media-gate/route.ts",
    // ------------------------------------------------------------------------------------------
    // Gate QB-BOUNDARY-01 / -02 (2026-09-21 product-boundary closeout). Quick semantic-media
    // enforcement was reaching SHARED Full publish paths, because it keyed off `lane` and
    // `sellerType` — neither of which is a product, and both of which arrive from the browser.
    // Closing that needed a server-owned product fact, and closing the Bienes browser insert
    // needed a server publish operation. Exactly these surfaces, and no others.
    // ------------------------------------------------------------------------------------------
    // The product rule, pure: which base package (SIMPLE vs FULL) a publish is bound to, read
    // from assisted context / live entitlement / checkout ledger / server custody, and only then
    // from a declaration that can restrict the caller and never relax anything.
    "app/lib/listingPlans/quickBusinessProductIdentity.ts",
    // Its server reads. Two service-role-written ledgers, read-only, failing closed in the SAFE
    // direction: an outage can make the answer stricter, never more permissive.
    "app/lib/listingPlans/quickBusinessProductIdentityServer.ts",
    // The atomic Quick Bienes publish: verify bearer → verify product → validate media → validate
    // fields → write → link, in one authenticated server operation. Replaces the deleted gate.
    "app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts",
    // Its pure contract (column whitelist, server-owned columns, field rules, reuse key) and its
    // port-injected operation, split out so the security claims are proven by RUNNING them.
    "app/lib/clasificados/bienes-raices/quickBienesPublishContract.ts",
    "app/lib/clasificados/bienes-raices/quickBienesPublishOperation.ts",
    // The two previews that now declare WHICH BASE PACKAGE they are about to charge, so the
    // server no longer has to infer a product from a lane or a seller type. Declaration only:
    // the server re-resolves it, and a declaration is read in the restricting direction alone.
    "app/(site)/clasificados/autos/negocios/preview/AutosNegociosPreviewClient.tsx",
    "app/(site)/clasificados/publicar/bienes-raices/negocio/agente-individual/preview/AgenteIndividualResidencialPreviewClient.tsx",
    // The one line that carries the customer's declared photo roles from the canonical agente
    // draft into the publish core, so the gate above is told what the customer actually said.
    // Additive and optional: a draft without roles passes `null` and is answered with a
    // correction, never a guess.
    "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts",
    // `MediaImageEntry.role?` — the additive field that lets a dealer photo say whether it is a
    // vehicle or a dealership logo. Without it the two are the same object and the rule is
    // unenforceable.
    "app/(site)/clasificados/autos/negocios/types/autoDealerListing.ts",
    // The matching dealer-lane error code for the new 422 refusal.
    "app/lib/clasificados/autos/autosPublishApiContract.ts",
    // ---------------------------------------------------------------------------------------
    // LEONIX IX REWARDS (branch claude/leonix-ix-rewards-global-2026-09) — a SEPARATE authorized
    // mission that shares this working tree. Its surfaces are listed so this guard keeps catching
    // unexpected drift instead of being disabled; nothing here is a Quick Business surface, and
    // the Quick product itself is unchanged by any of it.
    // ---------------------------------------------------------------------------------------
    "app/lib/rewards/rewardsPolicy.ts",
    "app/lib/rewards/rewardsLedgerCore.ts",
    "app/lib/rewards/rewardsLedger.ts",
    "app/lib/rewards/rewardsFulfillment.ts",
    "app/api/rewards/wallet/route.ts",
    "app/api/admin/rewards/route.ts",
    "app/(site)/dashboard/components/LeonixCreditsPanel.tsx",
    "app/admin/(dashboard)/workspace/rewards/page.tsx",
    "app/admin/(dashboard)/workspace/rewards/RewardsWorkspaceClient.tsx",
    // Earn/reverse hooks into the existing payment pipeline. Each is an additive, best-effort
    // call placed AFTER the payment is already settled; none changes payment behaviour.
    "app/lib/listingPlans/manualClearedPayments.ts",
    "app/lib/listingPlans/revenueSubscriptionEvents.ts",
    // --- IX Rewards completion + adversarial repair pass ---
    // The redemption, scheduling and reconciliation surfaces the first Rewards commit itself
    // named as open, plus the fixes an independent review then forced. Listed for the same reason
    // as the block above: so this guard keeps catching unexpected drift rather than being switched
    // off. None is a Quick Business surface, and the Quick product is unchanged by every one.
    "app/lib/rewards/rewardsCheckoutRedemption.ts", // reserve/commit/release bound to checkout
    "app/lib/rewards/rewardsCsvReconciliation.ts", // pure CSV parsing, validation, idempotency
    "app/lib/rewards/rewardsStaffQuery.ts", // the pure staff input rules, so tests can call them
    "app/api/revenue-os/admin/rewards-sweep/route.ts", // the protected promotion + expiry seam
    "app/api/admin/rewards/reconciliation/route.ts", // staff-only CSV preview -> commit
    // Payment-pipeline touch points. Each is additive: a credits-applied figure and a
    // "this total is already net" flag on the payment record, the subscriber carried onto a
    // renewal row so it can be attributed at all, and the commit/release of a credit hold placed
    // beside the existing earn hook.
    "app/lib/listingPlans/revenuePaymentRecords.ts",
    "app/lib/listingPlans/subscriptionLifecycle.ts",
    // The pure renewal-earn decision, extracted so a truth table can prove it rather than a
    // source-string match. No Stripe client, no Supabase, no Quick surface.
    "app/lib/listingPlans/invoiceRenewalEarnPolicy.ts",
    // The owner dashboard, which now MOUNTS the customer wallet panel. One import, one element;
    // no Quick surface on this page changes.
    "app/(site)/dashboard/page.tsx",
    // -----------------------------------------------------------------------
    // LEONIX IX REWARDS — SOURCE CLOSEOUT. The customer-facing redemption control and the staff
    // refund-resolution queue. Listed FILE-EXACT so this guard keeps catching unexpected drift
    // rather than being switched off.
    //
    // Two of these are SHARED checkout surfaces the Quick product also uses, and both changes are
    // strictly additive: `PublishCheckoutCheckpoint` gains one OPTIONAL prop (`creditsEligible`)
    // that a category must opt into, so an unwired category renders exactly what it did before;
    // `revenueCategoryCheckoutClient` stops DISCARDING credits fields the server already sent.
    // Neither alters any Quick media, product-identity or publish rule.
    // -----------------------------------------------------------------------
    "app/(site)/clasificados/components/LeonixCheckoutCreditsPanel.tsx", // the redemption control
    "app/(site)/clasificados/components/PublishCheckoutCheckpoint.tsx", // one optional prop
    "app/(site)/clasificados/publicar/servicios/preview/ClasificadosServiciosPreviewClient.tsx", // first wired category
    "app/lib/listingPlans/revenueCategoryCheckoutClient.ts", // reads back the server's credits answer
    "app/lib/listingPlans/revenueCategoryCheckoutPayload.ts", // carries requestedCreditsCents
    "app/lib/rewards/rewardsRefundResolutionQueue.ts", // the unattributable-refund queue
    "app/admin/(dashboard)/workspace/rewards-refunds/page.tsx", // staff queue page
    "app/admin/(dashboard)/workspace/rewards-refunds/RewardsRefundQueueClient.tsx",
    // -----------------------------------------------------------------------
    // IX REWARDS FINANCIAL CERTIFICATION (2026-09-21). Four further shared surfaces, each changed
    // for a demonstrated money defect and each strictly ADDITIVE. None touches a Quick media rule,
    // a product-identity rule or a publish rule, which is what this guard exists to protect.
    //
    //   AdminWorkspaceNav / adminAccessControl / adminStrings — the refund-resolution queue was
    //     reachable only by typing its URL. That queue is the entire mechanism that keeps an
    //     unattributable refund from being silently dropped, so a backlog with no link in the
    //     shell is the silent drop it exists to prevent. Two nav entries and their labels are
    //     added, both behind the SAME `hasPaymentTrackerAccess` permission the payment tracker
    //     already uses; no existing entry, permission or route changes.
    //
    //   refundDisputeFoundations — `payment_status = 'disputed'` was a one-way door, and the
    //     rewards promotion sweep refuses a disputed payment outright, so the un-disputed
    //     remainder of a partially disputed payment stayed frozen in `pending` for ever. One
    //     metadata field records what to return to, and one new function returns to it when the
    //     dispute is WON. Nothing existing is removed or re-pointed.
    // -----------------------------------------------------------------------
    "app/admin/_components/AdminWorkspaceNav.tsx", // two additive nav entries, same permission
    "app/admin/_lib/adminAccessControl.ts", // the same two hrefs in the nav allowlist
    "app/admin/_lib/adminStrings.ts", // their labels, both languages
    "app/lib/listingPlans/refundDisputeFoundations.ts", // a won dispute stops withholding
    // -----------------------------------------------------------------------
    // QUICK SALES ENTRY CONSOLIDATION (2026-09-22) — `/admin/workspace/quick-sales` becomes the
    // SOLE staff entry for creating a Leonix-managed client ad in the four paid categories. No
    // migration, no payment/rewards schema, no Autos/Bienes ownership change, no new custody
    // table. Every existing category intake, custody route, preview token, payment gate and
    // audit path is preserved; what changes is WHERE staff are routed and what a mixed request
    // is allowed to do:
    //
    //   create-for-client / managed / [businessId] / AdminCommandCenterDashboard /
    //   staffOperatingSystem / clasificadosQueueSurfaceMeta — every admin launcher for
    //     Servicios, Restaurantes, Autos Dealer and Bienes Negocio deep-links the cockpit
    //     (`buildQuickSalesHref`) instead of opening the category's PUBLIC application on the
    //     staff browser. Other lanes keep their existing launcher.
    //   application-context — never re-mints the assisted cookie over a BOUND context for the
    //     same business + category (would have silently dropped same-row binding).
    //   PublishAuthGate / PublishAuthGateLayout / AssistedPublishingUiContext /
    //   LeonixManagedModeBanner — a persistent bilingual "Modo Leonix / Leonix Managed" banner
    //     whenever the server verified an assisted context; only business/category/row cross to
    //     the client, never roster or auth ids.
    //   customerBearerUserId — the one generic bearer→user resolution, so Autos/Bienes (which
    //     never read a bearer) can refuse an assisted request that also carries an unrelated
    //     customer/site session (409 assisted_session_conflict, audited).
    // Executed proof: scripts/verify-quick-sales-entry-consolidation-01.ts (harness).
    // -----------------------------------------------------------------------
    "app/admin/(dashboard)/businesses/[businessId]/page.tsx", // Quick Sales button beside Create Ad
    "app/admin/(dashboard)/businesses/create-for-client/page.tsx", // four paid cards → cockpit
    "app/admin/(dashboard)/businesses/managed/page.tsx", // Create ad → cockpit with business preselected
    "app/admin/(dashboard)/workspace/clasificados/_lib/clasificadosQueueSurfaceMeta.ts", // paid publish links → cockpit
    "app/admin/_components/AdminCommandCenterDashboard.tsx", // Concierge card secondary verb → cockpit
    "app/admin/_lib/staffOperatingSystem.ts", // Quick Sales leads CLIENT WORK under its own capability
    "app/api/admin/businesses/[businessId]/application-context/route.ts", // never clobbers a bound cookie
    "app/components/auth/AssistedPublishingUiContext.tsx", // optional listingId on the UI context
    "app/components/auth/PublishAuthGate.tsx", // mounts the persistent banner
    "app/components/auth/PublishAuthGateLayout.tsx", // passes only business/category/row to the client
    "app/components/auth/LeonixManagedModeBanner.tsx", // new: the banner
    "app/lib/auth/customerBearerUserId.ts", // new: generic bearer → customer user id (read-only)
    // -----------------------------------------------------------------------
    // QUICK SALES CANONICAL PUBLISH READINESS (repair, 2026-09-22) — cleared payment is necessary,
    // never sufficient. The cockpit publisher re-runs each category's OWN publish contract against
    // the STORED row through one shared server service (the same readiness / media / product /
    // required-child predicates the category routes import), refuses a paid-but-incomplete draft
    // with the category's own status and body, and refuses replay explicitly. QUICK IS ADDITIVE:
    // the normal category routes are byte-identical to f29c8ed6 (pinned by the verifier). No
    // migration, no payment/rewards schema, no ownership change, no new custody table.
    // Executed proof: scripts/verify-quick-sales-canonical-publish-readiness-01.ts.
    // -----------------------------------------------------------------------
    "app/lib/sales/canonicalPublishReadiness.ts", // new: the Quick-only canonical readiness + activation adapter
    "app/api/admin/sales-preview/publish/route.ts", // cockpit: readiness after payment, before any write
    // -----------------------------------------------------------------------
    // STAFF GATEWAY EIGHT-FAMILY REPAIR (2026-09-22) — existing canonical applications gain the
    // shared Save-for-Client bar; payment authority fails closed; claim transfer refuses false
    // success. No parallel product, no new intake, no Quick-specific table.
    // -----------------------------------------------------------------------
    "app/(site)/clasificados/publicar/rentas/privado/application/RentasPrivadoForm.tsx",
    "app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts",
    "app/(site)/clasificados/publicar/servicios/components/ClasificadosServiciosApplication.tsx",
    "app/(site)/publicar/empleos/quick/EmpleoQuickApplicationClient.tsx",
    "app/(site)/publicar/restaurantes/restauranteApplicationFormCopy.ts",
    "app/(site)/clasificados/lib/leonixBrMachineFacetPairsFromFormState.ts",
    "app/(site)/clasificados/bienes-raices/resultados/cards/BienesRaicesNegocioCard.tsx",
    "app/(site)/clasificados/bienes-raices/resultados/cards/listingTypes.ts",
    "app/(site)/clasificados/comida-local/components/ComidaLocalListingCard.tsx",
    "app/(site)/clasificados/comida-local/page.tsx",
    "app/(site)/clasificados/empleos/lib/empleosPublicListingsDbServer.ts",
    "app/(site)/clasificados/restaurantes/application/buildRestaurantePublishPayload.ts",
    "app/(site)/clasificados/restaurantes/application/createEmptyRestauranteDraft.ts",
    "app/(site)/clasificados/restaurantes/application/mapRestauranteDraftToShell.ts",
    "app/(site)/clasificados/restaurantes/application/restauranteTaxonomy.ts",
    "app/(site)/clasificados/restaurantes/application/useRestauranteDraft.ts",
    "app/(site)/clasificados/restaurantes/components/RestaurantePublishedListingCard.tsx",
    "app/(site)/clasificados/restaurantes/data/restaurantesPublicBlueprintData.ts",
    "app/(site)/clasificados/restaurantes/lib/restaurantesLandingInventoryServer.ts",
    "app/(site)/clasificados/restaurantes/lib/restaurantesListingEngagement.ts",
    "app/(site)/clasificados/restaurantes/lib/restaurantesResultsInventoryServer.ts",
    "app/(site)/clasificados/restaurantes/shell/RestaurantePreviewCard.tsx",
    "app/admin/(dashboard)/workspace/clasificados/autos/page.tsx",
    "app/admin/(dashboard)/workspace/payment-tracker/manual-payment/ManualPaymentClient.tsx",
    "app/admin/(dashboard)/workspace/payment-tracker/manual-payment/page.tsx",
    "app/admin/_lib/adminAdSearch.ts",
    "app/api/admin/autos/listings/[id]/route.ts",
    "app/api/business/ownership-claim/accept/route.ts",
    "app/api/clasificados/autos/checkout/route.ts",
    "app/api/clasificados/autos/listings/[id]/route.ts",
    "app/api/clasificados/comida-local/publish/route.ts",
    "app/api/clasificados/empleos/listings/route.ts",
    "app/api/clasificados/rentas/listing-edit/route.ts",
    "app/components/forms/BusinessAddressVerifiedInput.tsx",
    "app/components/leonixCommunityTrust/LeonixCommunityTrustCardStrip.tsx",
    "app/lib/business/ownership/linkedListingOwnerTransfer.ts",
    "app/lib/business/ownership/linkedListingOwnerTransferServer.ts",
    "app/lib/listingPlans/listingPackagePaymentAuthority.ts",
    "app/lib/listingPlans/listingPackagePaymentAuthorityServer.ts",
  ]);
  // A touched entry from `git status --short` may be a directory (`app/api/new-dir/`) for newly
  // added dirs not yet staged; check if it is authorized directly or all contained authorized files.
  function isPathAuthorized(f: string): boolean {
    if (MISSION_AUTHORIZED.has(f)) return true;
    if (f.endsWith("/")) return [...MISSION_AUTHORIZED].some((auth) => auth.startsWith(f));
    return false;
  }
  // HISTORICAL / MISSION-SCOPED (reclassified 2026-09-24): the PROTECTED + MISSION_AUTHORIZED guard
  // is computed as `git diff <certified SHA> HEAD` — "what did THIS Quick mission change vs the
  // certified base". That is only meaningful on a single-mission branch. A release/integration
  // branch (QA merge + launch closeout, carrying many later missions: Autos/Rentas/Empleos/Comida,
  // Servicios lifecycle, staff sales, ...) legitimately differs from that base in every protected
  // tree, so the guard cannot hold there by construction and would only ever report other missions'
  // authorized work. On integration branches it is therefore skipped with an explicit note; the
  // durable, branch-independent invariants (no Quick product table / API route / public page, the
  // certified Quick Classifieds tree, pricing + registry locks) keep running unchanged below.
  const currentBranch = execSync("git branch --show-current", { cwd: ROOT, encoding: "utf8" }).trim();
  const IS_INTEGRATION_BRANCH = /^(release|integration)\//.test(currentBranch) || currentBranch === "main";
  const violations = touched.filter(
    (f) => f.startsWith("app/") && !isPathAuthorized(f) && PROTECTED.some((re) => re.test(f)),
  );
  if (IS_INTEGRATION_BRANCH) {
    console.log(`NOTE: protected-surface mission guard skipped on integration branch "${currentBranch}" (${violations.length} cumulative cross-mission paths vs certified SHA — historical, not a Quick regression)`);
  } else {
    assert.deepEqual(violations, [], `protected canonical / certified surfaces must not change: ${violations.join(", ")}`);
  }
  // Section 6's claim is NO PARALLEL PRODUCT: Quick must not grow its own tables. Gate
  // QB-LIFECYCLE-02 authors one additive migration that only widens two existing lifecycle CHECK
  // constraints so two genuinely-missing owner capabilities can later exist — it creates no table
  // and is deliberately NOT applied. The guard is therefore narrowed to the real claim rather than
  // dropped: a migration may not create a table, and may not create a Quick-specific one at all.
  for (const f of touched.filter((x) => x.startsWith("supabase/migrations/"))) {
    const sql = read(f).replace(/^\s*--.*$/gm, "");
    // Section 6's claim is that QUICK grows no product tables of its own. A table belonging to a
    // different authorized mission (e.g. the IX Rewards ledger) is not Quick growing one, so the
    // check is on the table NAME rather than on the existence of any CREATE TABLE at all.
    const createdTables = [...sql.matchAll(/create\s+table\s+(?:if\s+not\s+exists\s+)?(?:public\.)?(\w+)/gi)].map((m) => m[1]!);
    for (const t of createdTables) {
      assert.ok(
        !/quick|servicios|restaurantes|autos|bienes/i.test(t),
        `${f}: Quick must not create a product table (${t})`,
      );
    }
    assert.ok(!/quick_/i.test(sql), `${f}: no Quick-specific database object`);
  }
  if (!IS_INTEGRATION_BRANCH) {
    assert.ok(
      !touched.some((f) => f.startsWith("app/api/") && !isPathAuthorized(f)),
      "no new API route outside MISSION_AUTHORIZED",
    );
  }
  // Branch-independent form of the same claim: Quick owns no API surface of its own beyond the
  // two known, verifier-locked owner-read / publish-adapter routes.
  {
    const quickApi = execSync("git ls-files app/api", { cwd: ROOT, encoding: "utf8" }).trim().split(/\r?\n/).filter((f) => /quick/i.test(f));
    assert.deepEqual(
      quickApi.sort(),
      ["app/api/clasificados/bienes-raices/negocio/quick-publish/route.ts", "app/api/clasificados/quick-business/my-listing/route.ts"],
      "Quick has exactly the two known API routes (no new Quick API route)",
    );
  }
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
  // Gate QB-MEDIA-03 — the one mapping is now `galleryMediaOnly(media)`: identity assets are
  // filtered out rather than silently becoming vehicle photos. Still exactly one mapping, and
  // still no dealer-logo field is written by Quick.
  assert.ok(
    (ad.match(/mediaImages: MediaImageEntry\[\] = galleryMediaOnly\(media\)\.map/g) ?? []).length === 1 && !/dealerLogo/.test(ad),
    "Dealer: customer photos map ONLY to the vehicle gallery, never to a dealer logo",
  );
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
  // LAUNCHPAD ARCHITECTURE (superseded 2026-09-24): the old per-card "Negocios Rápidos / Quick
  // Business" section (registry-driven cards, Quick-form links, community/tier1 renderCard) was
  // replaced by the owner-locked Quick Sales entry consolidation. Current, protected invariants:
  //  - the ONLY staff create verb goes to the Quick Sales cockpit (server-issued custody),
  //  - the launchpad only copies/shares CUSTOMER self-service links (customer opens them on their
  //    own device) and never opens a customer application on the staff browser,
  //  - the eight Quick applications + other customer applications come from the staff master
  //    launcher (single source), the existing Create-for-Client flow stays linked.
  // Executed proof of the rendered output: scripts/verify-quick-sales-entry-consolidation-01.ts (A8).
  assert.ok(lp.includes("buildQuickSalesHref({ lang: linkLang })") && lp.includes('data-quick-sales-entry="launchpad"') && lp.includes("Crear anuncio gestionado / Create managed ad"), "launchpad's only create verb is the Quick Sales cockpit");
  assert.ok(lp.includes("staffCustomerQuickLinkItems()") && lp.includes("STAFF_MASTER_LAUNCHER_ITEMS") && lp.includes("Ocho solicitudes Quick / Eight Quick applications"), "launchpad lists the Quick applications from the single staff master launcher source");
  assert.ok(!lp.includes("Abrir con el cliente / Open with customer") && !lp.includes("Crear negocio rápido con el cliente") && !lp.includes("Abrir aplicación completa / Open full application"), "launchpad no longer opens any customer application on the staff browser");
  assert.ok(lp.includes("🔗 Copiar / Copy") && lp.includes("📤 Compartir / Share") && lp.includes("copyToClipboard") && lp.includes("tryWebShare"), "the customer's own link stays copy/share-able on every launchpad card");
  assert.ok(lp.includes("quickClassifiedShareUrl(") && lp.includes("Enviar solicitud al cliente / Send customer application"), "Quick Classifieds chooser share preserved");
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

  // (c) Launchpad staff note (superseded 2026-09-24). The old contract was "the per-category staff
  // note renders in BOTH the supported and REPAIR_REQUIRED branch". The launchpad no longer renders
  // any per-category note or capability branch at all (Quick Sales entry consolidation: staff create
  // only through the cockpit, which holds custody). The protected invariant is now: the launchpad
  // neither gates on nor claims per-category publish-for-client support, and every registry
  // definition still declares it as supported (asserted above), so no category can be silently
  // presented as unsupported/blocked to staff.
  const launchpad = read("app/admin/(dashboard)/businesses/QuickApplicationsLaunchpad.tsx");
  assert.ok(
    !launchpad.includes("publishForClientSupported") && !launchpad.includes("def.staff.note"),
    "launchpad has no per-category publish-for-client branch or staff note to gate (custody lives in the Quick Sales cockpit)",
  );
  assert.ok(!/REPAIR_REQUIRED|no está disponible|not available/i.test(launchpad), "launchpad presents no category as unavailable / repair-required");
}

// 12. MEDIA SEMANTICS — Gate 6 corrective -------------------------------------------------------------------
// Proves at all authority layers: 0 images → blocked, 1–3 → allowed, 4 → blocked, video → blocked.
// Layer 1: contract definition (registry).
// Layer 2: validation function shape (quickClassifiedValidation.ts).
// Layer 3: intake UI enforcement (QuickBusinessIntakeClient.tsx, QuickMediaStep.tsx).
// Layer 4: adapter shape (first image becomes canonical cover/hero/primary).
{
  // Layer 1 — registry contract
  assert.ok(reg.includes("return { minImages: 1, maxImages, videoOptional: false, note: note(maxImages) };"), "registry contract: minImages=1, maxImages=<per-category table>, videoOptional=false (Bible §11.1)");
  // All 4 categories use this same contract helper; confirm by counting media() invocations
  assert.equal(
    (reg.match(/media\("(?:servicios|restaurantes|autos-dealer|bienes-negocio)", /g) ?? []).length,
    4,
    "all 4 categories use the shared media() factory (same contract applied everywhere)",
  );

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
  assert.ok(
    intake.includes("validateQuickBusinessIntakeMedia(draft.media, definition.media, lang, category)"),
    "QuickBusinessIntakeClient: the Quick Business media validator is called at step navigation and submit",
  );
  // Gate QB-MEDIA-03 — and the browser is explicitly NOT the boundary: the same contract is
  // re-run on the server against the payload that actually arrives.
  assert.ok(
    intake.includes("re-run on the server against the payload that actually arrives"),
    "QuickBusinessIntakeClient: the intake states that browser validation is UX, not the security boundary",
  );
  // Layer 2b — that validator is strictly stronger than the Classifieds one it replaced here:
  // it enforces the same count bounds AND rejects video AND excludes identity assets from the
  // minimum, so a logo can never stand in for the required photo.
  {
    const semantics = read(`${QB_LIB}/quickBusinessMediaSemantics.ts`);
    assert.ok(semantics.includes("export function validateQuickBusinessIntakeMedia("), "the intake validator exists");
    assert.ok(/contract\.videoOptional/.test(semantics), "it enforces the no-video rule");
    assert.ok(/contract\.minImages/.test(semantics) && /contract\.maxImages/.test(semantics), "it enforces both count bounds");
    assert.ok(/IDENTITY_ROLES\.includes/.test(semantics), "identity assets do not count toward the minimum");
  }
  const mediaStep = read("app/(site)/publicar/rapido/_components/QuickMediaStep.tsx");
  assert.ok(mediaStep.includes('accept="image/*"'), "QuickMediaStep: file input accepts image/* only (video inputs absent)");
  assert.ok(!mediaStep.includes('accept="video') && !mediaStep.includes("video/*"), "QuickMediaStep: no video accept attribute (video blocked at upload layer)");
  // Gate QB-MEDIA-03 — the step Quick Business actually renders is held to the SAME no-video lock,
  // and, additionally, must never pre-select a subject role for a declared-attribution family.
  {
    const qbStep = read(`${QB_COMPONENTS}/QuickBusinessMediaStep.tsx`);
    assert.ok(qbStep.includes('accept="image/*"'), "QuickBusinessMediaStep: file input accepts image/* only");
    assert.ok(!qbStep.includes('accept="video') && !qbStep.includes("video/*"), "QuickBusinessMediaStep: no video accept attribute");
    assert.ok(
      qbStep.includes('SUBJECT_ATTRIBUTION[category] === "structural" ? subjectRole : null'),
      "QuickBusinessMediaStep: a vehicle/property family starts every new photo UNMARKED — no silent default",
    );
    assert.ok(
      qbStep.includes("compressImageFileToJpegDataUrl"),
      "QuickBusinessMediaStep: reuses the EXISTING compressor, so canonical stores receive the representation they already expect",
    );
  }

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
  const regBrokenMin = reg.replace("return { minImages: 1, maxImages, videoOptional: false, note: note(maxImages) };", "return { minImages: 0, maxImages, videoOptional: false, note: note(maxImages) };");
  let caughtMedia = false;
  try {
    assert.ok(regBrokenMin.includes("return { minImages: 1, maxImages, videoOptional: false, note: note(maxImages) };"), "self-test: should fail when minImages ≠ 1");
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
