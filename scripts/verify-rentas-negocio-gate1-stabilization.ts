/**
 * Gate RENTAS-NEGOCIO-1 verifier — activation boundary, published→edit round trip, country truth,
 * WhatsApp, media, and same-row safety.
 *
 * The centrepiece is a REAL behavioral round trip (§2): a fully-populated Rentas Negocio form
 * state is published to params, a `listings` row is synthesized from exactly what the edit route
 * would persist, the row is hydrated back, and the rebuilt params are compared field-by-field
 * against the originals. That is the only honest way to prove "a no-op edit preserves the
 * published listing" — a source grep cannot.
 *
 * `stripComments()` runs before every source assertion so a doc comment can never satisfy a check
 * about the code.
 *
 * Run: node node_modules/tsx/dist/cli.mjs scripts/verify-rentas-negocio-gate1-stabilization.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  createEmptyRentasNegocioFormState,
  type RentasNegocioFormState,
} from "../app/(site)/clasificados/publicar/rentas/negocio/schema/rentasNegocioFormState";
import { buildRentasNegocioListingParams } from "../app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState";
import { mapOwnedRentasListingToNegocioFormState } from "../app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration";
import {
  FIXED_TERM_ACTIVATION_BLOCKED_ERROR,
  requiresCanonicalTermOnActivation,
} from "../app/lib/listingLifecycle/fixedTermActivationGuard";
import { getRevenuePackageDefinition } from "../app/lib/listingPlans/revenuePricingMatrix";
import {
  buildInternationalWhatsAppWaMeHrefWithText,
  normalizeInternationalWhatsAppDigits,
} from "../app/lib/whatsapp/internationalWhatsApp";

const ROOT = join(__dirname, "..");
let passed = 0;
const failures: string[] = [];

function assert(cond: unknown, label: string): void {
  if (cond) {
    passed += 1;
    return;
  }
  failures.push(label);
}

function read(rel: string): string {
  return readFileSync(join(ROOT, rel), "utf8");
}

function stripComments(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:])\/\/.*$/gm, "$1");
}

const HYDRATION = "app/(site)/clasificados/publicar/rentas/shared/rentasDashboardEditHydration.ts";
const EDIT_ROUTE = "app/api/clasificados/rentas/listing-edit/route.ts";
const VERIFY_ROUTE = "app/api/clasificados/leonix/stripe/checkout/verify/route.ts";
const PAY_SERVICE = "app/lib/clasificados/bienes-raices/brListingPaymentService.ts";
const BUILDER = "app/(site)/clasificados/lib/leonixPublishRealEstateFromDraftState.ts";

/* ════════════ 1. LEGACY ACTIVATION BYPASS — CLOSED ═══════════════════════════════════════ */

// 1a. The lifecycle boundary itself.
assert(
  requiresCanonicalTermOnActivation({ category: "rentas" }).required === true,
  "a Rentas row may NOT be activated by a generic path",
);
assert(
  requiresCanonicalTermOnActivation({ category: "rentas", seller_type: "business" }).required === true,
  "Rentas Negocio specifically is refused",
);
assert(
  requiresCanonicalTermOnActivation({ category: "rentas", seller_type: "personal" }).required === true,
  "Rentas Privado is refused too — one product, one rule",
);
assert(
  requiresCanonicalTermOnActivation({ category: "bienes-raices", seller_type: "personal" }).required === true,
  "Bienes FSBO (also fixed-term) is refused by the same boundary",
);
assert(
  requiresCanonicalTermOnActivation({ category: "bienes-raices", seller_type: "business" }).required === false,
  "Bienes Negocio (a subscription) is NOT refused — its activation path is unaffected",
);
assert(
  requiresCanonicalTermOnActivation({ category: "servicios" }).required === false,
  "a category with no persisted term is not blocked",
);
assert(requiresCanonicalTermOnActivation({}).required === false, "an unreadable row is never blocked by this guard");
assert(
  requiresCanonicalTermOnActivation({ category: "  RENTAS  " }).required === true,
  "the guard is case/whitespace tolerant",
);
{
  const v = requiresCanonicalTermOnActivation({ category: "rentas" });
  assert(v.required && v.code === FIXED_TERM_ACTIVATION_BLOCKED_ERROR, "the refusal is typed");
  assert(v.required && v.canonicalFulfillment === "activatePaidRentasListingFromRevenueOs", "and names the only legitimate authority");
}

// 1b. The shared service refuses BEFORE writing.
{
  const src = stripComments(read(PAY_SERVICE));
  assert(src.includes("requiresCanonicalTermOnActivation(existing)"), "the shared activation service consults the boundary");
  const guardIdx = src.indexOf("const termVerdict = requiresCanonicalTermOnActivation(existing);");
  // EOL-agnostic on purpose: this worktree uses CRLF.
  const genericUpdateIdx = src.indexOf("published_at: existing.published_at ?? now,");
  assert(guardIdx > 0, "the guard is present");
  assert(genericUpdateIdx > 0 && guardIdx < genericUpdateIdx, "the guard runs BEFORE the generic activation write");
  assert(src.includes("return { ok: false, transitioned: false, error: termVerdict.code };"), "it fails closed with a typed error");
  assert(src.includes("listing_json"), "the row read includes listing_json so the BR lane can be resolved");
  // The dead Rentas dispatch is gone — leaving it would imply this path still activates Rentas.
  assert(!src.includes("triggerRentasSavedSearchMatchBestEffort"), "the unreachable Rentas Saved Search dispatch was removed");
  assert(src.includes("triggerBienesRaicesSavedSearchMatchBestEffort"), "the BR dispatch is untouched");
}

// 1c. The legacy endpoint now carries both guards its sibling webhook has.
{
  const src = stripComments(read(VERIFY_ROUTE));
  assert(src.includes('metadataKeys.some((k) => k.startsWith("leonix_"))'), "guard 1: canonical Revenue OS sessions rejected");
  assert(src.includes('error: "canonical_revenue_os_session"'), "with a typed reason");
  assert(src.includes('session.metadata?.category !== "bienes-raices"'), "guard 2: legacy Bienes Raíces sessions only");
  assert(src.includes('error: "unsupported_category"'), "with a typed reason");
  const guardIdx = src.indexOf('startsWith("leonix_")');
  const activateIdx = src.indexOf("tryActivateBrListingAfterPayment(");
  assert(guardIdx > 0 && activateIdx > guardIdx, "both guards run BEFORE any activation call");
  // Same two guards as the sibling webhook — the two halves of the legacy lane now agree.
  const webhook = stripComments(read("app/api/clasificados/leonix/stripe/webhook/route.ts"));
  assert(webhook.includes('startsWith("leonix_")'), "the sibling webhook still carries guard 1");
  assert(webhook.includes('session.metadata?.category !== "bienes-raices"'), "and guard 2");
}

// 1d. Canonical activation is untouched and still writes the term.
{
  const src = stripComments(read("app/lib/listingPlans/revenueRentasFulfillment.ts"));
  assert(src.includes("expires_at: expiresAt"), "the canonical Rentas fulfillment still writes expires_at");
  assert(src.includes("computeFixedDayRenewalExpiresAt("), "using the shared fixed-term engine");
  assert(!src.includes("fixedTermActivationGuard"), "and is not itself gated by the new boundary");
  assert(!/\.insert\(/.test(src), "still no duplicate listing");
  assert(src.includes("triggerRentasSavedSearchMatchBestEffort"), "Saved Search is triggered by the canonical path");
  const def = getRevenuePackageDefinition("rentas_30d");
  assert(def?.priceCents === 2499 && def?.durationDays === 30 && def?.billingMode === "one_time", "$24.99 / 30 days, one-time");
}

/* ════════════ 2. PUBLISHED → EDIT ROUND TRIP (behavioral) ════════════════════════════════ */

/** A Negocio state exercising every field group the old hydration destroyed. */
function fullNegocioState(): RentasNegocioFormState {
  const s = createEmptyRentasNegocioFormState();
  return {
    ...s,
    titulo: "Departamento amueblado cerca del centro",
    descripcion: "Espacio luminoso con estacionamiento incluido.",
    rentaMensual: "1850",
    deposito: "1850",
    plazoContrato: "12-meses",
    disponibilidad: "Disponible desde el 1 de octubre",
    amueblado: "amueblado",
    mascotas: "permitidas",
    requisitos: "Comprobante de ingresos y referencias.",
    condicionesAlquiler: "No fumar dentro de la unidad.",
    tipoDeRenta: "apartamento",
    categoriaPropiedad: "residencial",
    estadoAnuncio: "disponible",
    ciudad: "Santa Rosa",
    zonaVecindario: "Roseland",
    direccionEstado: "CA",
    direccionCodigoPostal: "95407",
    direccionPais: "Mexico",
    direccionLinea1: "1234 Sebastopol Rd",
    mostrarDireccionExacta: true,
    showingByAppointment: true,
    showingAvailability: "Lunes a viernes, 9am-5pm",
    showingInstructions: "Llamar antes de llegar.",
    virtualTourUrl: "https://example.com/tour",
    residencial: {
      ...s.residencial,
      recamaras: "3",
      banos: "2",
      mediosBanos: "1",
      interiorSqft: "1400",
      loteSqft: "5000",
      estacionamiento: "2",
      ano: "1998",
    },
    media: {
      ...s.media,
      photoDataUrls: [
        "https://cdn.example.com/a.jpg",
        "https://cdn.example.com/b.jpg",
        "https://cdn.example.com/c.jpg",
      ],
      primaryImageIndex: 2,
      videoUrl: "",
      videoUrls: [],
    },
    negocioNombre: "Rentas del Valle",
    negocioMarca: "Valle Property Group",
    negocioLicencia: "DRE 01234567",
    negocioTelDirecto: "7075551234",
    negocioTelOficina: "7075559876",
    negocioEmail: "contacto@rentasdelvalle.com",
    negocioWhatsapp: "7075554321",
    negocioMensajesTexto: "7075557777",
    negocioSitioWeb: "https://rentasdelvalle.com",
    negocioBio: "Administramos rentas en el condado de Sonoma desde 2010.",
    negocioIdiomas: "Español, English",
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  };
}

/**
 * Synthesizes the published row from build params EXACTLY as the edit route persists it, so the
 * round trip proves the real contract rather than a convenient one.
 */
function rowFromParams(params: Record<string, unknown>): Record<string, unknown> {
  return {
    id: "11111111-2222-3333-4444-555555555555",
    owner_id: "owner-1",
    category: "rentas",
    seller_type: params.sellerType,
    title: params.title,
    description: params.description,
    city: params.city,
    state: params.state,
    zip: params.zip,
    price: params.price,
    business_name: params.businessName,
    business_meta: params.businessMetaJson,
    detail_pairs: params.detailPairs,
    contact_phone: params.contactPhoneDigits,
    contact_email: params.contactEmail,
    images: params.imageSources,
    leonix_ad_id: "LX-RENTAS-0001",
    updated_at: "2026-09-10T00:00:00.000Z",
  };
}

{
  const original = fullNegocioState();
  const first = buildRentasNegocioListingParams(original, "es");
  assert(first.ok === true, "the seeded Negocio state publishes");

  if (first.ok) {
    const row = rowFromParams(first.params as unknown as Record<string, unknown>);
    const hydrated = mapOwnedRentasListingToNegocioFormState(row);
    const second = buildRentasNegocioListingParams(hydrated, "es");
    assert(second.ok === true, "the hydrated state re-publishes");

    if (second.ok) {
      const a = first.params as unknown as Record<string, unknown>;
      const b = second.params as unknown as Record<string, unknown>;

      // THE no-op edit proof: every column the edit route writes must survive unchanged.
      for (const col of [
        "title",
        "description",
        "city",
        "state",
        "zip",
        "price",
        "sellerType",
        "businessName",
        "contactPhoneDigits",
        "contactEmail",
      ]) {
        assert(JSON.stringify(a[col]) === JSON.stringify(b[col]), `no-op edit preserves column: ${col}`);
      }

      // business_meta is a WHOLE-COLUMN overwrite — the exact thing that was being destroyed.
      assert(
        JSON.stringify(a.businessMetaJson) === JSON.stringify(b.businessMetaJson),
        "no-op edit preserves business_meta byte-for-byte",
      );
      const metaStr = String(a.businessMetaJson ?? "");
      assert(metaStr.length > 2, "business_meta is genuinely populated (the test would be vacuous otherwise)");
      for (const marker of ["Valle Property Group", "7075559876", "rentasdelvalle.com"]) {
        assert(metaStr.includes(marker), `business_meta really carries ${marker}`);
        assert(String(b.businessMetaJson ?? "").includes(marker), `and still carries it after the round trip: ${marker}`);
      }

      // Media: the gallery AND the cover must survive.
      assert(JSON.stringify(a.imageSources) === JSON.stringify(b.imageSources), "no-op edit preserves gallery order");
      const firstImages = a.imageSources as string[];
      assert(firstImages[0] === "https://cdn.example.com/c.jpg", "publish rotates the chosen cover to index 0");
      assert((b.imageSources as string[])[0] === firstImages[0], "the cover survives the round trip");
      assert(hydrated.media.primaryImageIndex === 0, "hydration points the cover index at the rotated cover");
      assert(hydrated.media.photoDataUrls.length === 3, "every photo is restored");

      // detail_pairs: every label present before must still be present with the same value.
      const pairsOf = (v: unknown) =>
        new Map(
          (Array.isArray(v) ? v : [])
            .filter((p): p is { label: string; value: string } => !!p && typeof p === "object")
            .map((p) => [String(p.label), String(p.value)]),
        );
      const pa = pairsOf(a.detailPairs);
      const pb = pairsOf(b.detailPairs);
      assert(pa.size > 20, "the seeded listing really produces a rich detail_pairs set");
      const lost: string[] = [];
      for (const [label, value] of pa) {
        if (pb.get(label) !== value) lost.push(label);
      }
      assert(lost.length === 0, `no detail_pairs label loses its value on a no-op edit (lost: ${lost.slice(0, 8).join(" | ")})`);
    }

    // Field-level restoration of everything the old mapper dropped.
    assert(hydrated.negocioMarca === original.negocioMarca, "business brand restored");
    assert(hydrated.negocioLicencia === original.negocioLicencia, "license restored");
    assert(hydrated.negocioTelOficina === original.negocioTelOficina, "office phone restored");
    assert(hydrated.negocioSitioWeb === original.negocioSitioWeb, "website restored");
    assert(hydrated.negocioBio === original.negocioBio, "business bio restored");
    assert(hydrated.negocioIdiomas === original.negocioIdiomas, "languages restored");
    assert(hydrated.negocioWhatsapp === original.negocioWhatsapp, "WhatsApp restored at the TOP level the merge reads");
    assert(hydrated.negocioMensajesTexto === original.negocioMensajesTexto, "SMS restored at the top level");
    assert(hydrated.negocioNombre === original.negocioNombre, "business name restored");
    assert(hydrated.negocioEmail === original.negocioEmail, "business email restored");

    assert(hydrated.zonaVecindario === original.zonaVecindario, "neighborhood restored (was hardcoded blank)");
    assert(hydrated.mostrarDireccionExacta === true, "exact-address privacy toggle restored (had no read-back at all)");
    assert(hydrated.direccionEstado === original.direccionEstado, "state restored");
    assert(hydrated.direccionCodigoPostal === original.direccionCodigoPostal, "ZIP restored");

    assert(hydrated.residencial.recamaras === "3", "bedrooms restored");
    assert(hydrated.residencial.banos === "2", "bathrooms restored");
    assert(hydrated.residencial.mediosBanos === "1", "half-baths restored");
    assert(hydrated.residencial.estacionamiento === "2", "parking restored");
    assert(hydrated.residencial.interiorSqft === "1400", "interior size restored");
    assert(hydrated.residencial.ano === "1998", "year built restored");

    assert(hydrated.deposito === original.deposito, "deposit restored");
    assert(hydrated.plazoContrato === original.plazoContrato, "lease term restored");
    assert(hydrated.mascotas === original.mascotas, "pets restored");
    assert(hydrated.amueblado === original.amueblado, "furnished restored");
    assert(hydrated.requisitos === original.requisitos, "requirements restored");
    assert(hydrated.disponibilidad === original.disponibilidad, "availability restored");
    assert(hydrated.showingByAppointment === true, "showing-by-appointment restored");
    assert(hydrated.showingAvailability === original.showingAvailability, "showing availability restored");
    assert(hydrated.showingInstructions === original.showingInstructions, "showing instructions restored");
    assert(hydrated.virtualTourUrl === original.virtualTourUrl, "virtual tour restored");
    assert(hydrated.estadoAnuncio === original.estadoAnuncio, "listing availability status restored");
    assert(hydrated.tipoDeRenta === original.tipoDeRenta, "rental type restored");
  }
}

/* ════════════ 3. FLOW EXTENSIONS (room_shared) round trip ════════════════════════════════ */
{
  const base = fullNegocioState();
  const roomState: RentasNegocioFormState = {
    ...base,
    tipoDeRenta: "cuarto_recamara",
    rentasEspacioTipoBano: "privado",
    rentasEspacioTipoCocina: "compartida",
    rentasEspacioEntradaPrivada: "si",
    rentasEspacioLavanderia: "no",
    rentasEspacioMaxOcupantes: "2",
    rentasPreferenciasEspacioCompartido: "Preferimos personas que no fumen.",
  };
  const built = buildRentasNegocioListingParams(roomState, "es");
  assert(built.ok === true, "a room_shared Negocio listing publishes");
  if (built.ok) {
    const h = mapOwnedRentasListingToNegocioFormState(rowFromParams(built.params as unknown as Record<string, unknown>));
    assert(h.rentasEspacioTipoBano === "privado", "room_shared: bathroom type restored");
    assert(h.rentasEspacioTipoCocina === "compartida", "room_shared: kitchen type restored");
    assert(h.rentasEspacioEntradaPrivada === "si", "room_shared: private entrance restored");
    assert(h.rentasEspacioLavanderia === "no", "room_shared: laundry restored (a real 'no', not blank)");
    assert(h.rentasEspacioMaxOcupantes === "2", "room_shared: max occupants restored");
    assert(
      h.rentasPreferenciasEspacioCompartido === roomState.rentasPreferenciasEspacioCompartido,
      "room_shared: shared-space preferences restored",
    );
  }
}

/* ════════════ 4. COUNTRY TRUTH ═══════════════════════════════════════════════════════════ */
{
  const src = stripComments(read(HYDRATION));
  assert(!src.includes('direccionPais: "United States"'), "the hardcoded country is gone");
  assert(src.includes("const persistedCountry = trim(loc.country);"), "the real persisted country is read");
  assert(
    src.includes("...(persistedCountry ? { direccionPais: persistedCountry } : {})"),
    "and applied only when it genuinely exists — otherwise the schema default applies",
  );

  // Behavioral: a non-US country survives, and a listing with no country falls back honestly.
  const withCountry = fullNegocioState();
  const built = buildRentasNegocioListingParams(withCountry, "es");
  assert(built.ok === true, "a listing with a non-US country publishes");
  if (built.ok) {
    const h = mapOwnedRentasListingToNegocioFormState(rowFromParams(built.params as unknown as Record<string, unknown>));
    assert(h.direccionPais === "Mexico", "a non-US country is NOT rewritten to United States");
  }
  const noCountry = mapOwnedRentasListingToNegocioFormState({
    id: "x",
    category: "rentas",
    title: "t",
    city: "Santa Rosa",
    detail_pairs: [],
    images: [],
  });
  assert(noCountry.direccionPais === "United States", "a row with no persisted country uses the form schema's own declared default");
}

/* ════════════ 5. WHATSAPP ════════════════════════════════════════════════════════════════ */
{
  const NEG_VM = "app/(site)/clasificados/publicar/rentas/negocio/application/mapping/mapRentasNegocioStateToPreviewVm.ts";
  const LIVE_VM = "app/(site)/clasificados/rentas/listing/mapRentasListingLiveToPreviewVm.ts";
  for (const [rel, label] of [
    [NEG_VM, "Negocio preview"],
    [LIVE_VM, "live public detail"],
  ] as const) {
    const src = stripComments(read(rel));
    assert(src.includes("buildInternationalWhatsAppWaMeHrefWithText("), `${label} uses the shared WhatsApp contract`);
    assert(!/https:\/\/wa\.me\//.test(src), `${label} builds no wa.me URL of its own`);
    assert(src.includes("rentasLeadSmsBody(lang)"), `${label} uses the existing ES/EN lead copy`);
  }
  const neg = stripComments(read(NEG_VM));
  assert(!neg.includes("RENTAS_LEAD_MESSAGE_ES"), "the hardcoded Spanish lead text is gone from the Negocio preview");
  assert(neg.includes('waHrefFromPhoneDisplay(waRaw, lang)'), "and lang is actually threaded to the WhatsApp builder");

  // Behavioral: the exact defects.
  assert(normalizeInternationalWhatsAppDigits("7075554321") === "17075554321", "a bare 10-digit US number gains its country code");
  assert(buildInternationalWhatsAppWaMeHrefWithText("7075554321", "hola")?.startsWith("https://wa.me/17075554321?text="), "and produces a routable link");
  assert(normalizeInternationalWhatsAppDigits("525512345678") === "525512345678", "a number that already has a country code is untouched");
  assert(normalizeInternationalWhatsAppDigits("12345678") === "12345678", "a legitimate 8-digit international number is accepted (old floor rejected it)");
  assert(normalizeInternationalWhatsAppDigits("1234567") === null, "below the sanity floor is refused");
  assert(normalizeInternationalWhatsAppDigits("1234567890123456") === null, "above the E.164 ceiling is refused");
  assert(buildInternationalWhatsAppWaMeHrefWithText("", "hola") === null, "no number means no link, never a broken one");
}

/* ════════════ 6. MEDIA ═══════════════════════════════════════════════════════════════════ */
{
  const src = stripComments(read(BUILDER));
  assert(src.includes('warnDroppedUnpersistableMedia("rentas negocio publish"'), "Negocio publish adopts the shared media-drop warning");
  assert(src.includes('warnDroppedUnpersistableMedia("rentas privado publish"'), "Privado publish adopts it too");
  assert(src.includes("withRentasDroppedMediaWarning("), "a concise owner-facing warning is produced");
  assert(src.includes("warnings: [...result.warnings, message]"), "appended to the EXISTING core warnings channel — no new channel");
  assert(src.includes('lang === "en"'), "the warning is bilingual");
  assert(!src.includes("droppedUnpersistable.join"), "no raw media URL is shown to the owner");

  const preview = stripComments(read("app/(site)/clasificados/rentas/preview/negocio/components/RentasNegocioPreviewClient.tsx"));
  assert(preview.includes("publishNote"), "the preview has a note state distinct from the error state");
  assert(preview.includes("if (r.warnings.length) setPublishNote("), "fed from the publish result's warnings");
  assert(preview.includes('role="status"'), "rendered as a status, not an error");
  // Non-blocking: the note must not sit on a path that returns before checkout.
  const noteIdx = preview.indexOf("setPublishNote(r.warnings.join");
  const checkoutIdx = preview.indexOf("startRevenueCategoryCheckout(");
  assert(noteIdx > 0 && checkoutIdx > noteIdx, "the note is set and checkout still proceeds — never blocking");
  assert(!preview.includes("setCheckoutErr(r.warnings"), "a warning is never raised as a blocking checkout error");
}

/* ════════════ 7. SAME-ROW / NO-RECHARGE — preserved, not changed ═════════════════════════ */
{
  const src = stripComments(read(EDIT_ROUTE));
  // The patch must not touch identity, publication, term or entitlement.
  const patchBlock = src.slice(src.indexOf("const patch: Record<string, unknown> = {"), src.indexOf("const { data: updated, error: updateError }"));
  for (const forbidden of ["status", "is_published", "published_at", "expires_at", "owner_id", "leonix_ad_id", "id:"]) {
    assert(!patchBlock.includes(`${forbidden}:`), `the edit patch never writes ${forbidden}`);
  }
  assert(src.includes('.eq("id", listingId)'), "the write is id-scoped");
  assert(src.includes('.eq("owner_id", bearerUserId)'), "and owner-scoped");
  assert(src.includes('.eq("category", "rentas")'), "and category-scoped");
  assert(src.includes('code: "leonix_id_mismatch"'), "a Leonix ad id mismatch is rejected");
  assert(src.includes('code: "lane_mismatch"'), "the lane is verified from the ROW");
  assert(src.includes("mergeDetailPairs(existing.detail_pairs"), "unknown legacy detail_pairs are preserved by the route");
  assert(src.includes("rejectUnsafeMedia("), "unsafe media still cannot reach a published row");
  assert(!/stripe|revenue-os|checkout/i.test(src), "the edit path calls no payment engine");
  // This gate did not modify the route at all.
  assert(!src.includes("fixedTermActivationGuard"), "the edit route was not modified by this gate");
}

/* ════════════ 8. CAPABILITY REGISTRY — deliberately NOT changed ══════════════════════════ */
{
  const registry = read("app/(site)/dashboard/lib/ownerEntityCapabilityRegistry.ts");
  assert(registry.includes('"rentas-negocio": merge({'), "the rentas-negocio row still exists");
  assert(
    registry.includes('identity: { publicView: "supported", preview: "supported", results: "supported", edit: "supported", analytics: "unsupported" }'),
    "and is UNCHANGED by this gate — the trap was recorded, not 'fixed'",
  );
  // Proof the row is unreachable: nothing outside the registry names it, so analytics cannot regress.
  const consumers = ["app/(site)/dashboard/mis-anuncios/[id]/page.tsx", "app/(site)/dashboard/mis-anuncios/page.tsx"];
  for (const rel of consumers) {
    assert(!read(rel).includes('"rentas-negocio"'), `${rel} does not resolve the rentas-negocio row`);
  }
  assert(
    read("app/(site)/dashboard/mis-anuncios/[id]/page.tsx").includes('? "rentas-privado"'),
    "a rentas row still resolves through rentas-privado, where analytics is supported",
  );
}

/* ════════════ 9. PROTECTED SURFACES / SCOPE ══════════════════════════════════════════════ */
{
  // The Application form and the Preview view component were not redesigned.
  assert(read("app/(site)/clasificados/publicar/rentas/negocio/application/RentasNegocioForm.tsx").length > 0, "the Application form still exists");
  assert(read("app/(site)/clasificados/rentas/preview/shared/RentasVisualMatchPreviewView.tsx").length > 0, "the shared Preview view still exists");
  // No migration, no scheduler, no second payment engine in anything this gate authored.
  for (const rel of [HYDRATION, "app/lib/listingLifecycle/fixedTermActivationGuard.ts", VERIFY_ROUTE, PAY_SERVICE]) {
    const src = stripComments(read(rel));
    assert(!/CREATE TABLE|ALTER TABLE|ADD COLUMN/i.test(src), `no schema change in ${rel}`);
    assert(!/cron|setInterval\(/i.test(src), `no scheduler in ${rel}`);
  }
  assert(!stripComments(read(HYDRATION)).includes("new Stripe("), "the hydration path has no payment code");
  // Deferred work genuinely not started.
  assert(!read("app/sitemap.ts").includes("rentas"), "Rentas sitemap deferred to RENTAS-NEGOCIO-2");
}

/* ─────────────────────────────────── report ────────────────────────────────────────────── */

if (failures.length > 0) {
  console.error(`\nverify-rentas-negocio-gate1-stabilization: ${passed} passed, ${failures.length} FAILED\n`);
  for (const f of failures) console.error(`  FAIL  ${f}`);
  process.exit(1);
}
console.log(`verify-rentas-negocio-gate1-stabilization: ${passed}/${passed} PASS`);
