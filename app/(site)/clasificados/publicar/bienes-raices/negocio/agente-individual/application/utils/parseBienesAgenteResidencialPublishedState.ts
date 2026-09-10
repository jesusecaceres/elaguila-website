/**
 * Gate BIENES-NEGOCIO-1 — the ONE pure parser that reads a published Bienes Raíces Negocio
 * (agente-individual) row back into `AgenteIndividualResidencialFormState`.
 *
 * Forward-ports the SEMANTICS of sealed Globalization commit `733408dd` ("stop Bienes Negocio
 * dashboard-edit from destroying published listings"), which found that the dashboard-edit reverse
 * mapper was a thin second reimplementation dropping ~130 of ~150 form fields on every edit —
 * confirmed destructive on Republish. It is NOT a cherry-pick: the body below was extracted
 * VERBATIM from THIS branch's own live `BienesRaicesNegocioLiveDetailShell.buildPublishedState()`
 * — the function that already renders every one of these fields correctly on the real public page
 * — so the parser matches current runtime, not the sealed branch's runtime.
 *
 * Deliberate deltas from the sealed version, each verified against THIS branch:
 *  - `direccionVerificationStatus` / `direccionProvider` / `direccionProviderPlaceId` are OMITTED:
 *    those fields arrived with the G23 address-verifier adoption (`3c23e875`), which is NOT on this
 *    branch. `AgenteIndividualResidencialFormState` has no such fields here, so porting them would
 *    not compile.
 *  - `agenteWhatsapp` keeps this branch's `phone` fallback rather than the sealed
 *    `identityMeta.negocioWhatsapp || phone`: `leonixNegocioBusinessMetaFromFormState.ts` never
 *    writes a `negocioWhatsapp` key, so reading one would be reading a value that is never
 *    persisted.
 *
 * Additions BEYOND the sealed commit (this gate), each restoring a field that IS provably persisted
 * but which neither the public shell nor the reverse mapper read back — see `§HOA` and
 * `§HIGHLIGHTS` below.
 *
 * Pure: no I/O, no React, no Supabase. Callers supply the row.
 */
import {
  LEONIX_DP_BR_LISTING_STATUS,
  LEONIX_DP_BR_SHOW_EXACT_ADDRESS,
  parseLeonixListingContract,
  parseLeonixMachineFacetRead,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import { stripLeonixPublishedDescriptionBody } from "@/app/clasificados/lib/leonixListingGalleryMarker";
import {
  createEmptyAgenteIndividualResidencialState,
  type AgenteIndividualResidencialFormState,
  type BienesAdditionalBusinessLink,
} from "@/app/clasificados/publicar/bienes-raices/negocio/agente-individual/schema/agenteIndividualResidencialFormState";
import { AGENTE_RES_TO_HIGHLIGHT_PRESET } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/mapAgenteResidencialFormStateToNegocioForPublish";

type Lang = "es" | "en";

export type BienesLiveListingLike = {
  id: string;
  title: { es: string; en: string };
  priceLabel: { es: string; en: string };
  city: string;
  blurb: { es: string; en: string };
  images?: string[] | null;
  businessName?: string | null;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
  detailPairs?: unknown;
  owner_id?: string | null;
  leonix_ad_id?: string | null;
  br_inventory_group_id?: string | null;
  br_inventory_parent_listing_id?: string | null;
  inventory_role?: string | null;
  zip?: string | null;
  /**
   * Gate BIENES-PRIVADO-2 — the row's real numeric price, the same value Gate BIENES-NEGOCIO-2
   * exposed as `Listing.priceNumber` for the JSON-LD Offer. Additive and optional: the
   * published-state parser never reads it, and the Negocio shell ignores it. It exists so the
   * Privado related-properties rail can score price proximity against a real number instead of
   * re-parsing a formatted price label.
   */
  priceNumber?: number | null;
};

export type ParentIdentityRow = {
  id: string;
  business_name?: string | null;
  business_meta?: string | null;
  contact_phone?: string | null;
  contact_email?: string | null;
};

function trim(v: unknown): string {
  return v == null ? "" : typeof v === "string" ? v.trim() : String(v).trim();
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (!raw) return {};
  if (typeof raw === "object" && !Array.isArray(raw)) return raw as Record<string, unknown>;
  try {
    const parsed = JSON.parse(String(raw));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function parseJsonArray(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (!raw) return [];
  try {
    const parsed = JSON.parse(String(raw));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function pairValue(detailPairs: unknown, label: string): string {
  return readLeonixDetailPairValue(detailPairs, label) ?? "";
}

function humanPairValue(detailPairs: unknown, labels: string[]): string {
  for (const label of labels) {
    const value = pairValue(detailPairs, label);
    if (value && value !== "—") return value;
  }
  return "";
}

function numberString(raw: unknown): string {
  const s = trim(raw);
  if (!s || s === "—") return "";
  const match = s.replace(/,/g, "").match(/\d+(\.\d+)?/);
  return match?.[0] ?? "";
}

function splitBaths(raw: string): { baths: string; halfBaths: string } {
  const s = trim(raw);
  if (!s || s === "—") return { baths: "", halfBaths: "" };
  const half = s.match(/(\d+)\s*med/i)?.[1] ?? "";
  const first = s.replace(/,/g, "").match(/\d+(\.\d+)?/)?.[0] ?? "";
  if (first.includes(".")) {
    const n = Number(first);
    if (Number.isFinite(n)) {
      const whole = Math.floor(n);
      return { baths: whole > 0 ? String(whole) : "", halfBaths: n - whole >= 0.5 ? "1" : "" };
    }
  }
  return { baths: first, halfBaths: half };
}

function normalizeUrl(raw: unknown): string {
  const s = trim(raw);
  if (!s) return "";
  if (/^https?:\/\//i.test(s) || s.startsWith("data:")) return s;
  if (/^www\./i.test(s)) return `https://${s}`;
  return s;
}

function socialUrls(raw: unknown): string[] {
  return trim(raw)
    .split(/\r?\n/)
    .map(normalizeUrl)
    .filter(Boolean);
}

function parseBusinessExtraLinks(raw: unknown): BienesAdditionalBusinessLink[] {
  return parseJsonArray(raw)
    .map((item): BienesAdditionalBusinessLink | null => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const title = trim(obj.title);
      const url = normalizeUrl(obj.url);
      return url ? { title, url } : null;
    })
    .filter((item): item is BienesAdditionalBusinessLink => Boolean(item))
    .slice(0, 2);
}

function firstSocialFor(raw: unknown, token: string): string {
  return socialUrls(raw).find((url) => url.toLowerCase().includes(token)) ?? "";
}

function listingStatus(detailPairs: unknown): AgenteIndividualResidencialFormState["estadoAnuncio"] {
  const raw = pairValue(detailPairs, LEONIX_DP_BR_LISTING_STATUS).toLowerCase();
  if (raw === "bajo_contrato") return "bajo_contrato";
  if (raw === "vendido") return "vendido";
  if (raw === "pendiente") return "pendiente";
  return "disponible";
}

function subtypeFromPair(detailPairs: unknown): string {
  const raw = humanPairValue(detailPairs, ["Subtipo", "Tipo"]);
  if (!raw || raw === "—") return "";
  return raw
    .split("·")
    .map((part) => part.trim())
    .filter(Boolean)
    .at(-1) ?? "";
}

/**
 * §HOA — Gate BIENES-NEGOCIO-1 addition (beyond sealed `733408dd`).
 *
 * The HOA / community / pet / rental / parking block IS persisted: `leonixBrGate12d.ts` serializes
 * `hasHoa`, `hoaFee`, `hoaFrequency`, `hoaIncludes`, `communityRules`, `petRules`,
 * `rentalRestrictions`, `shortTermRentalAllowed` and `parkingRules` into the
 * `Leonix:br_gate12d_v1` detail pair using the SAME key names the form state uses. Neither the
 * public shell nor the reverse mapper read them back, so an owner edit silently emptied every one
 * of them. Restored here, from the same `gate` object the address fields already come from.
 */
function triBool(raw: unknown): AgenteIndividualResidencialFormState["hasHoa"] | null {
  const v = trim(raw).toLowerCase();
  return v === "yes" || v === "no" || v === "unknown"
    ? (v as AgenteIndividualResidencialFormState["hasHoa"])
    : null;
}

function hoaFrequency(raw: unknown): AgenteIndividualResidencialFormState["hoaFrequency"] | null {
  const v = trim(raw).toLowerCase();
  return v === "monthly" || v === "quarterly" || v === "yearly" || v === "unknown"
    ? (v as AgenteIndividualResidencialFormState["hoaFrequency"])
    : null;
}

/**
 * §HIGHLIGHTS — Gate BIENES-NEGOCIO-1 addition (beyond sealed `733408dd`).
 *
 * Residential highlights are persisted as `Leonix:highlight_slugs` (comma-separated), written from
 * the Negocio `highlightPresets` keys lowercased with non-`[a-z0-9_]` stripped. The forward map
 * `AGENTE_RES_TO_HIGHLIGHT_PRESET` is now exported from its own module and INVERTED here — no
 * second highlight vocabulary is introduced.
 *
 * Commercial and land `destacados` are deliberately NOT restored: the publish path converts them to
 * free-text highlight LINES only (`comercialHighlightLines` / `terrenoHighlightLines`), never to
 * slugs, so there is nothing to invert. Fabricating checkbox state from prose would be inventing
 * data. Their text survives in `detail_pairs` and the merge contract preserves it.
 */
function restoreResidencialDestacados(
  base: AgenteIndividualResidencialFormState["destacados"],
  highlightSlugs: readonly string[],
): AgenteIndividualResidencialFormState["destacados"] {
  if (highlightSlugs.length === 0) return base;
  const canon = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  const bySlug = new Map<string, string>();
  for (const [destacadoId, presetKey] of Object.entries(AGENTE_RES_TO_HIGHLIGHT_PRESET)) {
    if (presetKey) bySlug.set(canon(presetKey), destacadoId);
  }
  const next = { ...base };
  for (const slug of highlightSlugs) {
    const destacadoId = bySlug.get(canon(slug));
    if (destacadoId && destacadoId in next) {
      (next as Record<string, boolean>)[destacadoId] = true;
    }
  }
  return next;
}

function splitCoAgent(raw: unknown): { name: string; title: string; phone: string; email: string } {
  const parts = trim(raw)
    .split("·")
    .map((part) => part.trim());
  return {
    name: parts[0] ?? "",
    title: parts[1] ?? "",
    phone: parts.find((part) => /\d{3}/.test(part)) ?? "",
    email: parts.find((part) => /@/.test(part)) ?? "",
  };
}

export function parseBienesAgenteResidencialPublishedState(input: {
  listing: BienesLiveListingLike;
  parentIdentity?: ParentIdentityRow | null;
  lang: Lang;
}): AgenteIndividualResidencialFormState {
  const { listing, parentIdentity } = input;
  const identityMeta = parseJsonObject(parentIdentity?.business_meta ?? listing.business_meta);
  const detailPairs = listing.detailPairs;
  const contract = parseLeonixListingContract(detailPairs);
  const facets = parseLeonixMachineFacetRead(detailPairs);
  const gate = parseJsonObject(pairValue(detailPairs, "Leonix:br_gate12d_v1"));
  const contact = parseJsonObject(pairValue(detailPairs, "Leonix:contact_channels_v1"));
  const base = createEmptyAgenteIndividualResidencialState();
  const photos = (listing.images ?? []).map(trim).filter(Boolean);
  const baths = splitBaths(humanPairValue(detailPairs, ["Baños", "Bathrooms"]));
  const metaSocial = identityMeta.negocioRedes;
  const website = normalizeUrl(identityMeta.negocioSitioWeb ?? contact.website);
  const email = trim(identityMeta.negocioEmail) || trim(parentIdentity?.contact_email) || trim(listing.contact_email);
  const phone = trim(identityMeta.negocioTelOficina) || trim(parentIdentity?.contact_phone) || trim(listing.contact_phone);
  const coAgent = splitCoAgent(identityMeta.negocioCoAgente);
  const broker = splitCoAgent(identityMeta.negocioSocioFinanciero);
  const rawPrice = listing.priceLabel[input.lang] || listing.priceLabel.es || listing.priceLabel.en;
  const category = contract.categoriaPropiedad ?? "residencial";
  const showExact = pairValue(detailPairs, LEONIX_DP_BR_SHOW_EXACT_ADDRESS).toLowerCase() === "true";

  return {
    ...base,
    sellerTipo: "agente_individual",
    categoriaPropiedad: category,
    titulo: listing.title[input.lang] || listing.title.es || listing.title.en,
    precio: numberString(rawPrice),
    ciudad: listing.city,
    areaCiudad: trim(gate.neighborhood),
    direccionLinea1: trim(gate.streetAddress),
    direccionEstado: pairValue(detailPairs, "Leonix:state"),
    direccionCodigoPostal: pairValue(detailPairs, "Leonix:postal_code") || trim(listing.zip),
    direccionPais: pairValue(detailPairs, "Leonix:country") || base.direccionPais,
    direccion: humanPairValue(detailPairs, ["Dirección", "Address"]),
    mostrarDireccionExacta: showExact,
    estadoAnuncio: listingStatus(detailPairs),
    tipoPropiedadCodigo: facets.resultsPropertyKind === "departamento" ? "condominio" : "casa",
    subtipoPropiedad: category === "residencial" ? subtypeFromPair(detailPairs) : "",
    comercialTipoCodigo: "oficina",
    comercialSubtipoPropiedad: category === "comercial" ? subtypeFromPair(detailPairs) : "",
    comercialUso: humanPairValue(detailPairs, ["Uso", "Commercial use"]),
    comercialOficinas: humanPairValue(detailPairs, ["Oficinas", "Office spaces"]),
    comercialNiveles: humanPairValue(detailPairs, ["Niveles", "Levels"]),
    terrenoTipoCodigo: "rancho",
    terrenoSubtipoPropiedad: category === "terreno_lote" ? subtypeFromPair(detailPairs) : "",
    terrenoUsoZonificacion: humanPairValue(detailPairs, ["Zonificación", "Zona", "Uso de suelo"]),
    terrenoServicios: humanPairValue(detailPairs, ["Servicios"]),
    terrenoTopografia: humanPairValue(detailPairs, ["Topografía"]),
    fotosDataUrls: photos,
    fotoPortadaIndex: 0,
    videoUrl: "",
    // Global Business Hub OS — pilot-lane video cap raised 4 -> 8, matching the publish-side
    // AGENTE_RES_MAX_VIDEO_URLS. This is the real live-display cap (the equivalent literal at
    // anuncio/[id]/page.tsx:762 is dead code — that block never renders for bienes-raices
    // listings, confirmed unreachable, left untouched).
    videoUrls: parseJsonArray(identityMeta.negocioExternalVideoUrls).map(normalizeUrl).filter(Boolean).slice(0, 8),
    tourUrl: normalizeUrl(gate.virtualTourUrl ?? contact.tourUrl),
    brochureUrl: normalizeUrl(gate.brochureUrl ?? contact.brochureUrl),
    recamaras: facets.bedroomsCount != null ? String(facets.bedroomsCount) : humanPairValue(detailPairs, ["Recámaras", "Habitaciones", "Bedrooms"]),
    banos: facets.bathroomsCount != null ? String(Math.floor(facets.bathroomsCount)) : baths.baths,
    mediosBanos: facets.bathroomsCount != null && facets.bathroomsCount % 1 >= 0.5 ? "1" : baths.halfBaths,
    tamanoInteriorSqft: numberString(humanPairValue(detailPairs, ["Pies cuadrados", "Superficie", "Sq ft", "Interior"])),
    tamanoLoteSqft: numberString(humanPairValue(detailPairs, ["Lote", "Tamaño del lote", "Lot"])),
    estacionamientos: facets.parkingSpots != null && facets.parkingSpots > 0 ? String(facets.parkingSpots) : "",
    // §HOA — restored from the same `Leonix:br_gate12d_v1` payload the address fields come from.
    // Every value falls back to the EMPTY-DRAFT default (`base.*`), never to a fabricated one, so a
    // listing that genuinely never had an HOA block round-trips as "no HOA block" rather than as
    // invented content.
    hasHoa: triBool(gate.hasHoa) ?? base.hasHoa,
    hoaFee: trim(gate.hoaFee) || base.hoaFee,
    hoaFrequency: hoaFrequency(gate.hoaFrequency) ?? base.hoaFrequency,
    hoaIncludes: trim(gate.hoaIncludes) || base.hoaIncludes,
    communityRules: trim(gate.communityRules) || base.communityRules,
    petRules: trim(gate.petRules) || base.petRules,
    rentalRestrictions: trim(gate.rentalRestrictions) || base.rentalRestrictions,
    shortTermRentalAllowed: triBool(gate.shortTermRentalAllowed) ?? base.shortTermRentalAllowed,
    parkingRules: trim(gate.parkingRules) || base.parkingRules,
    // §HIGHLIGHTS — residential checkbox state rebuilt from the persisted slug list.
    destacados: restoreResidencialDestacados(base.destacados, facets.highlightSlugs),
    descripcionPrincipal: stripLeonixPublishedDescriptionBody(listing.blurb[input.lang] || listing.blurb.es || listing.blurb.en),
    agenteFotoDataUrl: trim(identityMeta.negocioFotoAgenteUrl),
    agenteNombre: trim(identityMeta.negocioAgente),
    agenteTitulo: trim(identityMeta.negocioCargo),
    agenteLicencia: trim(identityMeta.negocioLicencia),
    agenteTelefonoPersonal: phone,
    agenteTelefonoOficina: phone,
    agenteWhatsapp: phone,
    agenteSitioWeb: website,
    correoPrincipal: email,
    marcaNombre: trim(identityMeta.negocioNombreCorreduria) || trim(parentIdentity?.business_name) || trim(listing.business_name),
    marcaLogoDataUrl: trim(identityMeta.negocioLogoUrl),
    marcaLicencia: trim(identityMeta.negocioLicencia),
    marcaSitioWeb: website,
    mostrarMarcaEnTarjeta: true,
    socialInstagram: firstSocialFor(metaSocial, "instagram"),
    socialFacebook: firstSocialFor(metaSocial, "facebook"),
    socialYoutube: firstSocialFor(metaSocial, "youtube"),
    socialTiktok: firstSocialFor(metaSocial, "tiktok"),
    socialX: firstSocialFor(metaSocial, "twitter") || firstSocialFor(metaSocial, "x.com"),
    googleBusinessUrl: normalizeUrl(identityMeta.negocioGoogleBusinessUrl),
    googleReviewsUrl: normalizeUrl(identityMeta.negocioGoogleReviewsUrl),
    yelpReviewsUrl: normalizeUrl(identityMeta.negocioYelpReviewsUrl),
    businessExtraUrls: parseBusinessExtraLinks(identityMeta.negocioBusinessExtraUrls),
    agenteAreaServicio: trim(identityMeta.negocioZonasServicio),
    agenteIdiomas: trim(identityMeta.negocioIdiomas),
    mostrarSegundoAgente: Boolean(coAgent.name),
    agente2Nombre: coAgent.name,
    agente2Titulo: coAgent.title,
    agente2TelefonoPersonal: coAgent.phone,
    agente2TelefonoOficina: coAgent.phone,
    agente2Whatsapp: coAgent.phone,
    agente2Correo: coAgent.email,
    mostrarBrokerAsesor: Boolean(broker.name),
    brokerNombre: broker.name,
    brokerTitulo: broker.title,
    brokerTelefonoPersonal: broker.phone,
    brokerTelefonoOficina: broker.phone,
    brokerWhatsapp: broker.phone,
    brokerEmail: broker.email,
    brokerSitioWeb: website,
    permitirSolicitarInformacion: true,
    permitirProgramarVisita: true,
    permitirLlamar: true,
    permitirWhatsApp: true,
    permitirVerSitioWeb: Boolean(website),
    permitirVerRedes: true,
    permitirVerListadoCompleto: true,
    permitirVerTour: Boolean(normalizeUrl(gate.virtualTourUrl ?? contact.tourUrl)),
    permitirVerFolleto: Boolean(normalizeUrl(gate.brochureUrl ?? contact.brochureUrl)),
    ctaNumeroLlamadas: phone,
    ctaNumeroWhatsapp: phone,
    ctaCorreoSolicitarInfo: email,
    ctaEnlaceProgramarVisita: email ? `mailto:${email}` : "",
    ctaEnlaceSitioWeb: website,
    ctaUrlListadoCompleto: website,
    ctaUrlTour: normalizeUrl(gate.virtualTourUrl ?? contact.tourUrl),
    ctaUrlFolleto: normalizeUrl(gate.brochureUrl ?? contact.brochureUrl),
    extraOpenHouse: Boolean(gate.openHouseEnabled),
    openHouseSlots: gate.openHouseEnabled
      ? [
          {
            fecha: trim(gate.openHouseDate),
            fechaFin: trim(gate.openHouseEndDate),
            inicio: trim(gate.openHouseStartTime),
            fin: trim(gate.openHouseEndTime),
            diasHorariosAdicionales: trim(gate.openHouseAdditionalDays),
            notas: trim(gate.openHouseNotes),
          },
        ]
      : [],
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: photos.length > 0,
    confirmCommunityRules: true,
    confirmPaymentAfterPreview: true,
  };
}
