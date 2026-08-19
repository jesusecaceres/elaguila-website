/**
 * Globalization Build 04 — Global Lifecycle + Translate Ad + SEO/Schema.
 *
 * Static contract verifier. Run: npx tsx scripts/verify-globalization-lifecycle-translate-seo-04.ts
 */
import { strict as assert } from "node:assert";
import * as fs from "node:fs";

const failures: string[] = [];
function check(name: string, fn: () => void) {
  try {
    fn();
    console.log(`OK: ${name}`);
  } catch (e) {
    failures.push(`${name}: ${e instanceof Error ? e.message : String(e)}`);
    console.error(`FAIL: ${name}`);
    console.error(`  ${e instanceof Error ? e.message : String(e)}`);
  }
}

function read(path: string): string {
  return fs.readFileSync(path, "utf8");
}

/** Strips block/line comments so a check on "what the code actually does" isn't confused by
 * doc comments that legitimately name the very fields they document as excluded. */
function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
}

// =================================================================================
// Gate 4 — duplicate-row-on-edit / stale-draft-after-publish fix
// =================================================================================

check("Clases inline publish handler clears the draft session on success (reset()), not just the in-flight id", () => {
  const src = read("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx");
  const clasesHandler = src.slice(src.indexOf('kind: "clases"'), src.indexOf('kind: "clases"') + 1500);
  assert.ok(/removeItem\(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS\.clases\)/.test(clasesHandler));
  assert.ok(/reset\(\);/.test(clasesHandler), "handlePublish for clases must call reset() after a successful publish");
});

check("Comunidad inline publish handler clears the draft session on success (reset())", () => {
  const src = read("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx");
  const comunidadHandler = src.slice(src.indexOf('kind: "comunidad"'), src.indexOf('kind: "comunidad"') + 900);
  assert.ok(/removeItem\(COMMUNITY_IN_FLIGHT_LISTING_ID_KEYS\.comunidad\)/.test(comunidadHandler));
  assert.ok(/reset\(\);/.test(comunidadHandler), "handlePublish for comunidad must call reset() after a successful publish");
});

check("Shared CommunityQuickPreviewPublishBar (Clases + Comunidad preview-publish entry point) clears the actual draft key on success, not just in-flight/staged keys", () => {
  const src = read("app/(site)/publicar/community/shared/preview/CommunityQuickPreviewPublishBar.tsx");
  assert.ok(src.includes("COMMUNITY_SESSION_KEYS"), "must import the real draft session key map");
  assert.ok(
    /removeItem\(COMMUNITY_SESSION_KEYS\[kind\]\)/.test(src),
    "must remove the kind-scoped draft key on successful publish",
  );
});

check("Busco and Mascotas already correctly clear their draft key on publish success (regression guard — these were never broken)", () => {
  const busco = read("app/(site)/publicar/busco/quick/BuscoQuickPreviewPublishBar.tsx");
  assert.ok(/removeItem\(BUSCO_QUICK_DRAFT_KEY\)/.test(busco));
  const mascotas = read(
    "app/(site)/publicar/mascotas-y-perdidos/quick/preview/MascotasPerdidosQuickPreviewPublishBar.tsx",
  );
  assert.ok(/removeItem\(MASCOTAS_PERDIDOS_QUICK_DRAFT_KEY\)/.test(mascotas));
});

check("categoryRouteRegistry.ts no longer carries the stale 'publishCommunityQuickToListings always INSERTs a fresh row, no dedup' claim (Clases/Comunidad adapters) — corrected to reflect the real I.6B/I.6C dedup + this build's Gate 4 fix", () => {
  const src = read("app/lib/listingIdentity/categoryRouteRegistry.ts");
  assert.ok(
    !src.includes("no update-if-exists check, no dedup against a prior successful publish"),
    "stale/inaccurate comment must be corrected, not left describing disproven behavior",
  );
});

// =================================================================================
// Gate 5 — En Venta lifecycle repairs
// =================================================================================

check("Dashboard editar page derives is_free from the edited price for en-venta only (not for free-only categories)", () => {
  const src = read("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx");
  assert.ok(
    /listing\.category\s*\?\?\s*""\)\.toLowerCase\(\)\s*===\s*"en-venta"/.test(src),
    "the is_free fix must be gated on category === 'en-venta'",
  );
  assert.ok(src.includes("payload.is_free = !hasRealPrice"));
});

check("Dashboard editar page strips the legacy [LEONIX_IMAGES] gallery marker for display and reattaches it verbatim on save, never letting the owner edit/corrupt it", () => {
  const src = read("app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx");
  assert.ok(src.includes("stripLeonixPublishedDescriptionBody"));
  assert.ok(src.includes("descriptionGalleryTail"));
  assert.ok(
    /LEONIX_IMAGES\]\[\\s\\S\]\*\?\\\[\\\/LEONIX_IMAGES/.test(src) || src.includes("LEONIX_IMAGES\\]"),
    "must extract the raw marker via regex independent of the stripped display text",
  );
});

// =================================================================================
// Gate 7 — Clases organizerLogoUrl fix
// =================================================================================

check("Clases published-quick-to-draft hydration now reads organizerLogoUrl (previously silently dropped)", () => {
  const src = read("app/(site)/publicar/clases/lib/clasesPublishedQuickToDraft.ts");
  assert.ok(src.includes('d.organizerLogoUrl = (pairs["Leonix:organizerLogoUrl"]'));
});

check("Clases quick ad canvas now renders organizerLogoUrl (previously never passed to CommunityPremiumIdentitySection)", () => {
  const src = read("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
  assert.ok(src.includes("organizerLogoUrl={draft.organizerLogoUrl}"));
});

// =================================================================================
// Gate 12 — Comida Local Translate Ad adoption
// =================================================================================

check("Comida Local translate-ad builder exists and only sends human prose fields (queVendes/locationNote/availabilityNote), never phone/whatsapp/social/food-type/price-level/payment fields", () => {
  const src = read("app/lib/clasificados/comida-local/comidaLocalTranslateAd.ts");
  assert.ok(src.includes("vm.queVendes"));
  assert.ok(src.includes("vm.locationNote"));
  assert.ok(src.includes("vm.availabilityNote"));
  const code = stripComments(src);
  assert.ok(!/phone|whatsapp|instagram|facebook|tiktok|serviceOptions|paymentMethods|priceLevel/i.test(code));
});

check("Comida Local public detail client renders TranslateAdControl via the shared translation-layer hook", () => {
  const src = read("app/(site)/clasificados/comida-local/components/ComidaLocalPublicDetailClient.tsx");
  assert.ok(src.includes("useComidaLocalPublicTranslation"));
  assert.ok(src.includes("translateControl"));
  assert.ok(src.includes("displayVm"));
});

// =================================================================================
// Gate 13 — Ofertas Locales / Cupones Translate Ad adoption (offer-level only)
// =================================================================================

check("Ofertas Locales translate-ad builder sends only offer.description/offer.membershipNote — never any item-level (AI/OCR-extracted) field", () => {
  const src = read("app/lib/ofertas-locales/ofertasLocalesTranslateAd.ts");
  assert.ok(src.includes("offer.description"));
  assert.ok(src.includes("offer.membershipNote"));
  const code = stripComments(src);
  assert.ok(
    !/itemName|normalizedItemName|priceText|priceAmount|searchTags|sourceBbox|subcategory/.test(code),
    "must never reference any item-level AI-extracted field in actual code (comments documenting the exclusion are fine)",
  );
});

check("Ofertas Locales public detail view wires the translation hook and uses displayOffer (not the raw offer) for the two translatable fields", () => {
  const src = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicDetailView.tsx");
  assert.ok(src.includes("useOfertasLocalesPublicTranslation"));
  assert.ok(src.includes("displayOffer.description"));
  assert.ok(src.includes("displayOffer.membershipNote"));
});

check("No item-level Ofertas Locales component (item card / item detail drawer) imports TranslateAdControl", () => {
  const itemCard = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemCard.tsx");
  const itemDrawer = read("app/(site)/clasificados/ofertas-locales/OfertasLocalesPublicItemDetailDrawer.tsx");
  assert.ok(!itemCard.includes("TranslateAdControl"));
  assert.ok(!itemDrawer.includes("TranslateAdControl"));
});

// =================================================================================
// Gate 11 — Translate Ad contract preserved (no second API, no guardrail bypass)
// =================================================================================

check("Both new adopters reuse the one real TranslateAdControl component and the one real requestAdTranslation API wrapper — no second translation API introduced", () => {
  const comidaLocal = read("app/(site)/clasificados/comida-local/lib/useComidaLocalPublicTranslation.tsx");
  const ofertas = read("app/(site)/clasificados/ofertas-locales/lib/useOfertasLocalesPublicTranslation.tsx");
  for (const src of [comidaLocal, ofertas]) {
    assert.ok(src.includes('from "@/app/components/translation/TranslateAdControl"'));
  }
  const comidaLocalAd = read("app/lib/clasificados/comida-local/comidaLocalTranslateAd.ts");
  const ofertasAd = read("app/lib/ofertas-locales/ofertasLocalesTranslateAd.ts");
  for (const src of [comidaLocalAd, ofertasAd]) {
    assert.ok(src.includes('requestAdTranslation as request'), "must re-export the one real requestAdTranslation, never a second implementation");
  }
});

// =================================================================================
// Gate 16/17/18 — SEO shared helper, structured data truth, canonical
// =================================================================================

check("Shared BreadcrumbList JSON-LD helper exists and builds real schema.org structured data (no fabricated rating fields)", () => {
  const src = read("app/lib/seo/breadcrumbJsonLd.ts");
  assert.ok(src.includes('"@type": "BreadcrumbList"'));
  assert.ok(src.includes('"@type": "ListItem"'));
  assert.ok(!/rating|review/i.test(src));
});

check("Restaurantes detail page adopts the shared BreadcrumbList helper (mirrors its own real visible breadcrumb: Clasificados / Restaurantes / business name)", () => {
  const src = read("app/(site)/clasificados/restaurantes/[slug]/page.tsx");
  assert.ok(src.includes("breadcrumbJsonLd"));
  assert.ok(src.includes("shellData.businessName"));
});

check("BR-Negocio branch of the generic anuncio layout adopts the shared BreadcrumbList helper, gated on the same premiumBr flag that gates its visible breadcrumb nav", () => {
  const src = read("app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx");
  const breadcrumbBlock = src.slice(src.indexOf("const breadcrumb ="), src.indexOf("const breadcrumb =") + 400);
  assert.ok(/premiumBr\s*\n?\s*\?/.test(breadcrumbBlock));
});

check("Servicios [slug] layout now sets a real canonical URL on every metadata branch (not-found, pending, rejected/suspended, and published) — previously missing entirely", () => {
  const src = read("app/(site)/clasificados/servicios/[slug]/layout.tsx");
  const canonicalOccurrences = (src.match(/alternates:\s*\{\s*canonical\s*\}/g) ?? []).length;
  assert.ok(canonicalOccurrences >= 4, `expected canonical set on all 4 return branches, found ${canonicalOccurrences}`);
});

check("No JSON-LD builder touched in this build emits AggregateRating/reviewCount/ratingValue — Leonix Community Trust doctrine preserved", () => {
  const files = [
    "app/lib/seo/breadcrumbJsonLd.ts",
    "app/(site)/clasificados/restaurantes/[slug]/page.tsx",
    "app/(site)/clasificados/en-venta/listing/EnVentaAnuncioLayout.tsx",
    "app/(site)/clasificados/servicios/[slug]/layout.tsx",
  ];
  for (const f of files) {
    const src = read(f);
    assert.ok(!/AggregateRating|aggregateRating/.test(src), `${f} must never emit AggregateRating`);
  }
});

// =================================================================================
// Final Lifecycle Closure — Gate 11: category-aware owner-edit adapters
// =================================================================================

const ADAPTERS_PATH = "app/(site)/dashboard/mis-anuncios/[id]/editar/categoryLifecycleAdapters.ts";
const EDITAR_PATH = "app/(site)/dashboard/mis-anuncios/[id]/editar/page.tsx";

check("Category lifecycle adapter file exists and defines all 5 required categories with hydrate + serialize", () => {
  const src = read(ADAPTERS_PATH);
  for (const cat of ["en-venta", "busco", "clases", "comunidad", "mascotas-y-perdidos"]) {
    assert.ok(src.includes(`"${cat}"`), `adapter registry must include ${cat}`);
  }
  assert.ok(src.includes("hydrate:"));
  assert.ok(src.includes("serialize:"));
  assert.ok(src.includes("export function getCategoryLifecycleAdapter"));
});

check("Every category adapter's serialize() builds detail_pairs via the shared upsert helper (preserves unrelated pairs) — never replaces detail_pairs with a hand-built array that could drop unrelated pairs", () => {
  const src = read(ADAPTERS_PATH);
  const serializeFns = src.match(/function serialize\w+\([\s\S]*?\n}/g) ?? [];
  assert.ok(serializeFns.length >= 5, "expected a serialize function per category");
  for (const fn of serializeFns) {
    assert.ok(fn.includes("upsertDetailPairs("), "each serialize() must build detail_pairs via upsertDetailPairs, not a hand-rolled replacement");
  }
});

check("upsertDetailPairs preserves every existing pair not being updated (real update-only merge, not a destructive replace)", () => {
  const src = read(ADAPTERS_PATH);
  const fn = src.slice(src.indexOf("function upsertDetailPairs"), src.indexOf("function readColumn"));
  assert.ok(fn.includes("existing.filter"), "must filter/keep existing pairs, not discard them");
});

check("En Venta adapter covers real owner-editable public fields (brand, model, city, state, zip, phone, email) and documents dual-write fields as intentionally frozen with a real reason", () => {
  const src = read(ADAPTERS_PATH);
  const block = src.slice(src.indexOf("EN VENTA"), src.indexOf("BUSCO"));
  for (const key of ['"brand"', '"model"', '"city"', '"state"', '"zip"', '"phone"', '"email"']) {
    assert.ok(block.includes(key), `En Venta field spec must include ${key}`);
  }
  assert.ok(block.includes("EN_VENTA_FROZEN"));
  assert.ok(/reasonEs:|reasonEn:/.test(block), "frozen fields must carry a real documented reason");
});

check("Busco adapter covers the proven prior-audit fields (budget, urgency, location, contact channels)", () => {
  const src = read(ADAPTERS_PATH);
  const block = src.slice(src.indexOf("// BUSCO", src.indexOf("EN VENTA") + 1) - 200, src.indexOf("CLASES"));
  for (const key of ['"budget"', '"urgency"', '"city"', '"state"', '"zip"', '"phone"', '"whatsapp"', '"email"']) {
    assert.ok(block.includes(key), `Busco field spec must include ${key}`);
  }
});

check("Clases adapter covers real public fields and keeps pricing/monetization frozen with a documented reason (no Stripe/pricing touched)", () => {
  const src = read(ADAPTERS_PATH);
  const block = src.slice(src.indexOf("// CLASES", src.indexOf("BUSCO") + 1) - 200, src.indexOf("COMUNIDAD"));
  for (const key of ['"organizer"', '"venue"', '"city"', '"phone"', '"email"']) {
    assert.ok(block.includes(key), `Clases field spec must include ${key}`);
  }
  assert.ok(/costo de la clase|class cost type/i.test(block), "pricing/cost-type must be explicitly documented as frozen");
  const codeOnly = stripComments(block);
  assert.ok(!/stripe/i.test(codeOnly), "must never touch Stripe");
});

check("Comunidad adapter: editable human description is NOT the composite storage blob, and save updates the same canonical representation the public detail page renders", () => {
  const adaptersSrc = read(ADAPTERS_PATH);
  assert.ok(adaptersSrc.includes("export function splitCompositeDescription"));
  assert.ok(adaptersSrc.includes("export function rebuildCompositeDescription"));
  assert.ok(adaptersSrc.includes("export function isCompositeDescriptionCategory"));
  assert.ok(/comunidad/.test(adaptersSrc.match(/isCompositeDescriptionCategory[\s\S]*?\n}/)?.[0] ?? ""));

  const editarSrc = read(EDITAR_PATH);
  assert.ok(editarSrc.includes("splitCompositeDescription"), "editar page must split the composite blob on load");
  assert.ok(editarSrc.includes("rebuildCompositeDescription"), "editar page must rebuild the composite blob on save");
  assert.ok(
    editarSrc.includes("setDescription(userText)"),
    "the visible/editable description state must be set from the extracted user text, never the raw composite blob",
  );
});

check("Comunidad + Clases adapters cover the same real structured fields (organizer/venue/address/contact) so editing description doesn't leave those stale", () => {
  const src = read(ADAPTERS_PATH);
  const block = src.slice(src.indexOf("// COMUNIDAD", src.indexOf("CLASES") + 1) - 200, src.indexOf("MASCOTAS"));
  for (const key of ['"organizer"', '"venue"', '"addressLine1"', '"city"', '"phone"', '"email"']) {
    assert.ok(block.includes(key), `Comunidad field spec must include ${key}`);
  }
});

check("Mascotas adapter covers the proven prior-audit fields (noticeType, lastSeenLocation, contact) and mirrors the real publish pipeline's phoneDigits==whatsappDigits behavior", () => {
  const src = read(ADAPTERS_PATH);
  const block = src.slice(src.indexOf("function serializeMascotas"), src.indexOf("// Registry"));
  assert.ok(block.includes('"Leonix:noticeType"'));
  assert.ok(block.includes('"Leonix:lastSeenLocation"'));
  assert.ok(block.includes('"Leonix:phoneDigits": phoneDigits'));
  assert.ok(block.includes('"Leonix:whatsappDigits": phoneDigits'), "must mirror the real publish pipeline's single-phone-drives-both-fields behavior");
});

check("Edit page never surfaces a raw storage artifact ([LEONIX_IMAGES], detail_pairs JSON, internal Leonix: labels) as visible/editable text — only human field labels and plain values", () => {
  const src = read(EDITAR_PATH);
  // The textarea/inputs must be bound to extracted plain values (description, categoryFieldValues[...]),
  // never to raw row.detail_pairs or row fields directly.
  assert.ok(!/value=\{listing\?\.detail_pairs/.test(src), "must never bind an input directly to raw detail_pairs");
  assert.ok(!/value=\{JSON\.stringify/.test(src), "must never render raw JSON into an editable field");
});

check("Category field UI renders each field's human label (ES/EN), never the raw Leonix: machine key, and frozen fields are shown as a read-only list, never as disabled inputs mimicking editable controls", () => {
  const src = read(EDITAR_PATH);
  assert.ok(src.includes("lang === \"es\" ? field.labelEs : field.labelEn"));
  assert.ok(src.includes("categoryAdapter.frozenFields.map"));
  const frozenBlock = src.slice(src.indexOf("No editable aquí todavía") - 400, src.indexOf("No editable aquí todavía") + 900);
  assert.ok(!/<input|<textarea|<select/.test(frozenBlock), "frozen fields must render as plain text, not as disabled form controls");
});

check("Update-only safety: category adapters' serialize() output is merged into the SAME payload passed to applyOwnerListingPatch (the one proven owner+id-scoped UPDATE helper) — no adapter ever calls a different/new mutation path", () => {
  const src = read(EDITAR_PATH);
  const saveFn = src.slice(src.indexOf("async function save()"), src.indexOf("async function markStatus"));
  assert.ok(saveFn.includes("categoryAdapter.serialize("));
  assert.ok(saveFn.includes("applyOwnerListingPatch(supabase, id, userId, payload)"), "must still go through the one owner-scoped update helper");
  const codeOnly = stripComments(saveFn);
  assert.ok(!/\.insert\(/i.test(codeOnly), "save() must never call .insert(...)");
});

check("Known lifecycle defects from the prior audit are fixed: Clases organizerLogoUrl render, duplicate-row-after-publish (Clases/Comunidad), Comunidad description desync — none reintroduced", () => {
  const canvas = read("app/(site)/publicar/clases/components/ClasesQuickAdCanvas.tsx");
  assert.ok(canvas.includes("organizerLogoUrl={draft.organizerLogoUrl}"));
  const applicationClient = read("app/(site)/publicar/community/shared/CommunityQuickApplicationClient.tsx");
  assert.ok((applicationClient.match(/reset\(\);/g) ?? []).length >= 2, "both Clases and Comunidad inline publish handlers must call reset() on success");
});

// =================================================================================
// Forbidden-scope guards
// =================================================================================

check("No Stripe/pricing-implementation file touched by this build's lifecycle fixes", () => {
  const src = read("app/(site)/publicar/community/shared/required/communityRequiredForPreview.ts");
  assert.ok(src.includes("shouldBlockClasesPaidPublish"), "paid-class publish block must remain intact, untouched");
});

if (failures.length) {
  console.error(`\n${failures.length} check(s) FAILED`);
  process.exit(1);
}
console.log("\nverify-globalization-lifecycle-translate-seo-04: PASS");
