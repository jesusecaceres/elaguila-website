/**
 * Gate RENTAS-NEGOCIO-1 — THE canonical published-row → editable-Rentas-state interpretation.
 *
 * ── WHAT THIS FILE IS ────────────────────────────────────────────────────────────────────────
 * One reverse mapper, shared by both Rentas lanes, that turns a published `listings` row back into
 * the exact form state the owner edited. It is the counterpart of
 * `buildRentasPrivadoListingParams` / `buildRentasNegocioListingParams`, and the two must agree
 * field-for-field or a dashboard edit silently destroys published data.
 *
 * ── THE DEFECT THIS REPLACES ─────────────────────────────────────────────────────────────────
 * The previous version restored roughly 30 of `RentasNegocioFormState`'s ~103 fields plus three
 * business columns. Everything it did not read was rebuilt from `createEmpty…` defaults and then
 * written straight back over the published row, because:
 *
 *   - `business_meta` is a WHOLE-COLUMN overwrite. `buildRentasNegocioListingParams` composes
 *     `businessMetaJson` entirely from form state, and the edit route writes it unconditionally.
 *     `mergeDetailPairs` protects detail_pairs labels; it cannot protect a column. So an ordinary
 *     edit replaced the published business identity with one rebuilt from a mostly-empty form.
 *   - a rebuilt-from-default state can emit a `Leonix:` pair with an EMPTY value, and an empty
 *     replacement still counts as a replacement in `mergeDetailPairs`.
 *
 * Lost on every edit: the entire business identity, the whole address block including the
 * exact-address privacy toggle and the neighborhood, the structured included-services list, all
 * structured residencial/comercial/terreno property facts, and all 21 flow-extension fields
 * (room_shared / storage_parking / commercial_space / land_parcel).
 *
 * ── PROVENANCE ───────────────────────────────────────────────────────────────────────────────
 * Re-derived from the semantics of sealed Globalization `67919479`, NOT cherry-picked. That commit
 * is not an ancestor of this branch and its file has diverged from ours. Every primitive below was
 * re-verified to exist at this HEAD, and two things genuinely differ:
 *
 *   1. `leonixContactChannelsFormSliceFromPayload` DOES NOT EXIST here. The payload → form-slice
 *      conversion is written locally against this branch's own `LeonixContactChannelsFormSlice`
 *      and `LeonixContactChannelsV1Payload` shapes.
 *   2. `negocioGoogleReviewsUrl` / `negocioYelpReviewsUrl` DO NOT EXIST on this branch's
 *      `RentasNegocioFormState`. They are deliberately not restored — inventing them would not
 *      type-check and would imply a field the owner cannot edit.
 *
 * ── RULES THIS FILE OBEYS ────────────────────────────────────────────────────────────────────
 * - Nothing is invented from prose. Every value comes from a persisted machine pair, a persisted
 *   human label the publisher itself wrote, a real column, or `business_meta`.
 * - Unknown legacy `detail_pairs` are never wiped: this mapper only READS. Preservation of
 *   unrecognised labels is the edit route's `mergeDetailPairs`, which is untouched.
 * - Where a value cannot be recovered, the field is left ABSENT from the partial so the form
 *   schema's own declared default applies — never overwritten with a guess.
 *
 * Every reading primitive used here is one the live public Rentas page already relies on, so the
 * edit view and the public view interpret the same row the same way.
 */
import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import {
  parseLeonixListingContract,
  readLeonixDetailPairValue,
} from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  createEmptyLeonixContactChannelsFormSlice,
  parseLeonixContactChannelsV1FromDetailPairs,
  type LeonixContactChannelsFormSlice,
  type LeonixContactChannelsV1Payload,
} from "@/app/clasificados/lib/leonixContactChannelsV1";
import { augmentLeonixDetailPairsFromStructuredColumns } from "@/app/clasificados/lib/leonixListingStructuredPayload";
import { rentasShowExactAddressFromDetailPairs } from "@/app/clasificados/rentas/lib/leonixRentasShowing";
import { parseBrGate12dV1 } from "@/app/clasificados/lib/leonixBrGate12d";
import { readLeonixPropertyLocationFromRow } from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
import { rentasRentalFlowGroupForTipo } from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import {
  createEmptyRentasPrivadoFormState,
  mergePartialRentasPrivadoState,
  type RentasPrivadoFormState,
} from "../privado/schema/rentasPrivadoFormState";
import {
  mergePartialRentasNegocioState,
  type RentasNegocioFormState,
} from "../negocio/schema/rentasNegocioFormState";

function trim(raw: unknown): string {
  return typeof raw === "string" ? raw.trim() : raw == null ? "" : String(raw).trim();
}

function imagesFromRow(images: unknown): string[] {
  if (!Array.isArray(images)) return [];
  return images
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        return trim(o.url ?? o.src);
      }
      return "";
    })
    .filter((u) => /^https?:\/\//i.test(u));
}

function digits(raw: unknown): string {
  return trim(raw).replace(/\D/g, "");
}

/** Exact-label `detail_pairs` lookup — the same primitive the live public Rentas page uses. */
function pv(detailPairs: unknown, label: string): string {
  return readLeonixDetailPairValue(detailPairs, label) ?? "";
}

function parseJsonObject(raw: unknown): Record<string, unknown> {
  if (typeof raw !== "string" || !raw.trim()) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

function metaString(meta: Record<string, unknown>, key: string): string {
  return trim(meta[key]);
}

const siNo = (raw: string): "" | "si" | "no" => {
  const t = raw.trim().toLowerCase();
  if (t === "sí" || t === "si") return "si";
  if (t === "no") return "no";
  return "";
};

const boolToSiNo = (v: boolean | undefined): "" | "si" | "no" => (v === true ? "si" : v === false ? "no" : "");

/**
 * Payload → editable form slice.
 *
 * Written locally because this branch has no `leonixContactChannelsFormSliceFromPayload`. It
 * inverts `buildLeonixContactChannelsV1PayloadFromFormSlice` exactly: the payload stores booleans
 * where the slice stores `si`/`no`, and nullable URLs where the slice stores plain strings. A
 * missing payload returns the schema's own empty slice rather than a fabricated one, so a listing
 * published before contact-channels existed hydrates to the form's declared defaults.
 */
function contactChannelsSliceFromPayload(
  payload: LeonixContactChannelsV1Payload | null,
): LeonixContactChannelsFormSlice {
  const empty = createEmptyLeonixContactChannelsFormSlice();
  if (!payload) return empty;
  return {
    masInformacionUrl: trim(payload.website) || empty.masInformacionUrl,
    instagram: trim(payload.instagram),
    facebook: trim(payload.facebook),
    youtube: trim(payload.youtube),
    tiktok: trim(payload.tiktok),
    permitirLlamadas: boolToSiNo(payload.allowCall) || empty.permitirLlamadas,
    permitirSms: boolToSiNo(payload.allowSms) || empty.permitirSms,
    whatsappActivo: boolToSiNo(payload.whatsappEnabled) || empty.whatsappActivo,
    contactoPreferido: payload.preferred ?? empty.contactoPreferido,
  };
}

/**
 * Structured residencial / comercial / terreno property facts, read back from the human
 * label/value rows the publisher itself writes (`rentasRentalTypeApply.ts`'s
 * `buildRentasResidencialPropertyRows` / `buildComercialPropertyRows` / `buildTerrenoPropertyRows`)
 * and the live public page already renders.
 *
 * `tipoCodigo` / `subtipo` are deliberately left at their schema defaults rather than
 * reverse-matched from display labels — the same accepted limitation already present in the proven
 * Bienes Negocio shared parser (`parseBienesAgenteResidencialPublishedState.ts`). Reverse-matching
 * a translated label would be inventing a value from prose, which this file does not do.
 */
function structuredPropertyFactsFromDetailPairs(
  detailPairs: unknown,
  categoria: RentasPrivadoFormState["categoriaPropiedad"],
): Pick<Partial<RentasPrivadoFormState>, "residencial" | "comercial" | "terreno"> {
  const empty = createEmptyRentasPrivadoFormState();
  const condicion = <T extends string>(map: Record<string, T>): T | "" => {
    const c = pv(detailPairs, "Condición").toLowerCase();
    return map[c] ?? "";
  };
  const CONDICION_MAP = {
    excelente: "excelente",
    buena: "buena",
    regular: "regular",
    "necesita reparación": "necesita_reparacion",
  } as const;

  if (categoria === "comercial") {
    return {
      comercial: {
        ...empty.comercial,
        uso: pv(detailPairs, "Uso"),
        interiorSqft: digits(pv(detailPairs, "Tamaño interior")),
        oficinas: digits(pv(detailPairs, "Oficinas")),
        banos: digits(pv(detailPairs, "Baños")),
        niveles: digits(pv(detailPairs, "Niveles / pisos")),
        estacionamiento: pv(detailPairs, "Estacionamiento"),
        zonificacion: pv(detailPairs, "Zonificación"),
        condicion: condicion<RentasPrivadoFormState["comercial"]["condicion"] & string>(
          CONDICION_MAP as Record<string, RentasPrivadoFormState["comercial"]["condicion"] & string>,
        ),
        accesoCarga: pv(detailPairs, "Acceso de carga").toLowerCase() === "sí",
      },
    };
  }
  if (categoria === "terreno_lote") {
    return {
      terreno: {
        ...empty.terreno,
        loteSqft: digits(pv(detailPairs, "Tamaño del lote")),
        usoZonificacion: pv(detailPairs, "Uso / zonificación"),
        acceso: pv(detailPairs, "Acceso"),
        servicios: pv(detailPairs, "Servicios disponibles"),
        topografia: pv(detailPairs, "Topografía"),
        listoConstruir: pv(detailPairs, "Listo para construir").toLowerCase() === "sí",
        cercado: pv(detailPairs, "Cercado").toLowerCase() === "sí",
      },
    };
  }
  return {
    residencial: {
      ...empty.residencial,
      recamaras: digits(pv(detailPairs, "Recámaras")),
      banos: digits(pv(detailPairs, "Baños completos")),
      mediosBanos: digits(pv(detailPairs, "Medios baños")),
      interiorSqft: digits(pv(detailPairs, "Interior (ft²)")),
      loteSqft: digits(pv(detailPairs, "Lote (ft²)")),
      estacionamiento: digits(pv(detailPairs, "Estacionamientos")),
      ano: digits(pv(detailPairs, "Año de construcción")),
      condicion: condicion<RentasPrivadoFormState["residencial"]["condicion"] & string>(
        CONDICION_MAP as Record<string, RentasPrivadoFormState["residencial"]["condicion"] & string>,
      ),
    },
  };
}

/**
 * The flow-specific extension rows (`extensionRows` in `rentasRentalTypeApply.ts`) for whichever
 * rental flow group the persisted rental type belongs to — the same rows the live public page
 * renders via `buildRentasPublishedFlowExtensionRows`.
 */
function flowExtensionFieldsFromDetailPairs(
  detailPairs: unknown,
  rentalTypeCode: string | null,
): Partial<RentasNegocioFormState> {
  const group = rentasRentalFlowGroupForTipo(rentalTypeCode ?? "");

  if (group === "room_shared") {
    const bano = pv(detailPairs, "Tipo de baño").toLowerCase();
    const cocina = pv(detailPairs, "Cocina").toLowerCase();
    return {
      rentasEspacioTipoBano: bano.includes("privado")
        ? "privado"
        : bano.includes("compartido")
        ? "compartido"
        : bano.includes("no incluido")
        ? "no_incluido"
        : "",
      rentasEspacioTipoCocina: cocina.includes("privada")
        ? "privada"
        : cocina.includes("compartida")
        ? "compartida"
        : cocina.includes("no incluida")
        ? "no_incluida"
        : "",
      rentasEspacioEntradaPrivada: siNo(pv(detailPairs, "Entrada privada")),
      rentasEspacioLavanderia: siNo(pv(detailPairs, "Lavandería disponible")),
      rentasEspacioMaxOcupantes: digits(pv(detailPairs, "Máximo de ocupantes")),
      rentasPreferenciasEspacioCompartido: pv(detailPairs, "Preferencias del espacio compartido"),
    };
  }
  if (group === "storage_parking") {
    return {
      rentasAlmacenTamanoAprox: pv(detailPairs, "Tamaño aproximado"),
      rentasAlmacenAcceso24h: siNo(pv(detailPairs, "Acceso 24/7")),
      rentasAlmacenElectricidad: siNo(pv(detailPairs, "Electricidad disponible")),
      rentasAlmacenSeguridad: siNo(pv(detailPairs, "Seguridad / acceso controlado")),
      rentasAlmacenUsoPermitido: pv(detailPairs, "Uso permitido"),
      rentasAlmacenDimensiones: pv(detailPairs, "Altura / dimensiones"),
    };
  }
  if (group === "commercial_space") {
    return {
      rentasComercialUsoPermitido: pv(detailPairs, "Uso permitido"),
      rentasComercialTamanoFt2: digits(pv(detailPairs, "Tamaño (ft²)")),
      rentasComercialBanoDisponible: siNo(pv(detailPairs, "Baño disponible")),
      rentasComercialHorarioAcceso: pv(detailPairs, "Horario / acceso"),
      rentasComercialContratoMinimo: pv(detailPairs, "Contrato mínimo"),
    };
  }
  if (group === "land_parcel") {
    return {
      rentasLoteUsoPermitido: pv(detailPairs, "Uso permitido"),
      rentasLoteServiciosDisponibles: pv(detailPairs, "Servicios disponibles"),
      rentasLoteAcceso: pv(detailPairs, "Acceso"),
      rentasLoteZonificacion: pv(detailPairs, "Zonificación"),
    };
  }
  return {};
}

/**
 * The shared interpretation. Both lanes go through this; only business identity and the flow
 * extensions are lane-specific.
 */
function basePartialFromRow(row: Record<string, unknown>): Partial<RentasPrivadoFormState> {
  // Augment from `listing_json` / `contact_json` exactly as the live public mapper does, so a row
  // that stored structured payload outside `detail_pairs` still hydrates.
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(
    row.detail_pairs,
    row.listing_json,
    row.contact_json,
  );
  const rx = parseRentasDetailMachineRead(detailPairs);
  const lx = parseLeonixListingContract(detailPairs);
  const gallery = imagesFromRow(row.images);
  const categoria: RentasPrivadoFormState["categoriaPropiedad"] =
    lx.categoriaPropiedad === "comercial" || lx.categoriaPropiedad === "terreno_lote"
      ? lx.categoriaPropiedad
      : "residencial";
  const loc = readLeonixPropertyLocationFromRow(row);
  // The structured address payload the publisher itself writes — the faithful source for the
  // raw street, neighborhood, state and ZIP the owner actually typed.
  const gate12d = parseBrGate12dV1(detailPairs);
  const empty = createEmptyRentasPrivadoFormState();

  // Country: hydrate the REAL persisted value. When the row genuinely carries none, the field is
  // left blank so `mergePartial…` applies the form schema's own declared default — the literal is
  // not repeated here. The previous version hardcoded "United States" unconditionally, silently
  // rewriting the country of any listing that had a different one.
  const persistedCountry = trim(loc.country);

  return {
    categoriaPropiedad: categoria,
    titulo: trim(row.title),
    rentaMensual: digits(row.price),
    deposito: rx.depositUsdDigits ?? "",
    plazoContrato: (rx.leaseTermCode as RentasPrivadoFormState["plazoContrato"]) ?? "",
    plazoContratoOtro: rx.leaseTermCode === "otro" ? rx.leaseTermCustom ?? "" : "",
    disponibilidad: rx.availabilityNote ?? "",
    amueblado: (rx.furnishedCode as RentasPrivadoFormState["amueblado"]) ?? "",
    mascotas: (rx.petsCode as RentasPrivadoFormState["mascotas"]) ?? "",
    tipoDeRenta: (rx.rentalTypeCode as RentasPrivadoFormState["tipoDeRenta"]) ?? "",
    tipoDeRentaOtro: rx.rentalTypeCustom ?? "",
    condicionesAlquiler: rx.leaseConditions ?? "",
    ciudad: trim(row.city),
    // Address block — none of these had any read-back before.
    //
    // The street line comes from `Leonix:br_gate12d_v1`, the STRUCTURED payload the publisher
    // writes, not from the human `Dirección` pair. `Dirección` is a COMPOSED display line
    // ("street, city, ST zip, country"); feeding it back into `direccionLinea1` and
    // re-publishing would compose the city/state/zip a second time and corrupt the address on
    // every edit. The round-trip verifier catches exactly that.
    zonaVecindario: trim(gate12d?.neighborhood) || pv(detailPairs, "Zona o vecindario") || pv(detailPairs, "Colonia"),
    direccionLinea1: trim(gate12d?.streetAddress),
    mostrarDireccionExacta: rentasShowExactAddressFromDetailPairs(detailPairs),
    direccionEstado: trim(gate12d?.state) || loc.state || trim(row.state),
    direccionCodigoPostal: trim(gate12d?.zip) || loc.zip || trim(row.zip),
    ...(persistedCountry ? { direccionPais: persistedCountry } : {}),
    descripcion: trim(row.description),
    estadoAnuncio: (rx.listingStatus as RentasPrivadoFormState["estadoAnuncio"]) || "disponible",
    requisitos: rx.requirements ?? "",
    serviciosIncluidosLegacy: rx.servicesIncluded ?? "",
    showingByAppointment: rx.showingByAppointment === true,
    showingAvailability: rx.showingAvailability ?? "",
    showingInstructions: rx.showingInstructions ?? "",
    virtualTourUrl: rx.virtualTourUrl ?? "",
    media: {
      ...empty.media,
      photoDataUrls: gallery,
      // `primaryImageIndex: 0` is CORRECT here, not a stub. `orderedRentasGallerySourcesForPublish`
      // rotates the gallery at publish so the owner's chosen cover is stored FIRST, so the
      // persisted order already encodes the cover and index 0 always points at it. The round trip
      // is stable: hydrate [cover, …] at index 0 → publish rotates by 0 → same order.
      primaryImageIndex: 0,
      videoUrl: rx.videoUrl ?? "",
      videoUrls: rx.videoUrls ?? (rx.videoUrl ? [rx.videoUrl] : []),
    },
    seller: {
      ...empty.seller,
      telefono: trim(row.contact_phone),
      correo: trim(row.contact_email),
      whatsapp: rx.contactWhatsappDigits ?? "",
      mensajesTexto: rx.contactSmsDigits ?? "",
      notaContacto: pv(detailPairs, "Mensaje del contacto"),
    },
    // Website / socials / call-SMS-WhatsApp preferences — previously omitted entirely, so an edit
    // silently blanked every one of them despite correct persistence and public rendering.
    contactChannels: contactChannelsSliceFromPayload(
      parseLeonixContactChannelsV1FromDetailPairs(detailPairs),
    ),
    ...structuredPropertyFactsFromDetailPairs(detailPairs, categoria),
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  };
}

export function mapOwnedRentasListingToPrivadoFormState(row: Record<string, unknown>): RentasPrivadoFormState {
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(
    row.detail_pairs,
    row.listing_json,
    row.contact_json,
  );
  const rx = parseRentasDetailMachineRead(detailPairs);
  return mergePartialRentasPrivadoState({
    ...createEmptyRentasPrivadoFormState(),
    ...basePartialFromRow(row),
    ...(flowExtensionFieldsFromDetailPairs(detailPairs, rx.rentalTypeCode) as Partial<RentasPrivadoFormState>),
  });
}

export function mapOwnedRentasListingToNegocioFormState(row: Record<string, unknown>): RentasNegocioFormState {
  const base = basePartialFromRow(row);
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(
    row.detail_pairs,
    row.listing_json,
    row.contact_json,
  );
  const rx = parseRentasDetailMachineRead(detailPairs);
  const meta = parseJsonObject(row.business_meta);

  return mergePartialRentasNegocioState({
    ...base,
    v: undefined,
    negocioNombre: trim(row.business_name),
    negocioTelDirecto: trim(row.contact_phone),
    negocioEmail: trim(row.contact_email),
    // WhatsApp / SMS were computed correctly by the previous version but stranded on the `seller`
    // partial key, which `mergePartialRentasNegocioState` never reads back — it maps only the
    // top-level `negocioWhatsapp` / `negocioMensajesTexto`. Both are persisted as their own
    // `detail_pairs` machine keys by `mergeRentasNegocioMachinePairs`, not in `business_meta`.
    negocioWhatsapp: rx.contactWhatsappDigits ?? "",
    negocioMensajesTexto: rx.contactSmsDigits ?? "",
    // Business identity. `business_meta` is the shared BR Negocio serializer's output for the
    // `agente_individual` advertiser type Rentas Negocio always uses. Where a field is ALSO
    // persisted as its own machine pair, the machine pair is preferred — it is the more faithful
    // round-trip of what the owner typed.
    negocioMarca: metaString(meta, "negocioNombreCorreduria"),
    negocioLogoDataUrl: metaString(meta, "negocioFotoAgenteUrl"),
    negocioLicencia: rx.businessLicense || metaString(meta, "negocioLicencia"),
    negocioTelOficina: metaString(meta, "negocioTelOficina"),
    negocioSitioWeb: rx.businessWebsite || metaString(meta, "negocioSitioWeb"),
    negocioRedes: rx.businessSocial || metaString(meta, "negocioRedes"),
    negocioBio: metaString(meta, "negocioDescripcion"),
    negocioIdiomas: metaString(meta, "negocioIdiomas"),
    ...flowExtensionFieldsFromDetailPairs(detailPairs, rx.rentalTypeCode),
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  });
}

export async function hydrateRentasDashboardEditDraft(input: {
  listingId: string;
  lane: "privado" | "negocio";
}): Promise<
  | { ok: true; lane: "privado"; draft: RentasPrivadoFormState; leonixAdId: string | null; sourceUpdatedAt: string | null }
  | { ok: true; lane: "negocio"; draft: RentasNegocioFormState; leonixAdId: string | null; sourceUpdatedAt: string | null }
  | { ok: false; message: string }
> {
  const listingId = input.listingId.trim();
  if (!listingId) return { ok: false, message: "Missing listing id." };
  const sb = createSupabaseBrowserClient();
  const { data: auth } = await sb.auth.getUser();
  const ownerId = auth.user?.id;
  if (!ownerId) return { ok: false, message: "Sign in required." };
  const { data, error } = await sb
    .from("listings")
    // `updated_at` anchors the local edit workspace to the row version it was hydrated from
    // (draftWorkspaceContract Rule 3).
    //
    // Gate RENTAS-NEGOCIO-1 added `business_meta`, `listing_json` and `contact_json`: the business
    // identity reader and the structured-payload augmenter — both already proven on the live
    // public Rentas page — cannot restore anything without them. Their absence is precisely why
    // business identity was being destroyed.
    .select(
      "id, owner_id, title, description, city, state, zip, category, price, images, detail_pairs, listing_json, contact_json, contact_phone, contact_email, leonix_ad_id, seller_type, business_name, business_meta, updated_at",
    )
    .eq("id", listingId)
    .eq("owner_id", ownerId)
    .eq("category", "rentas")
    .maybeSingle();
  if (error || !data?.id) return { ok: false, message: error?.message ?? "Rentas listing not found." };
  const record = data as Record<string, unknown>;
  const leonixAdId = trim(record.leonix_ad_id) || null;
  const sourceUpdatedAt = trim(record.updated_at) || null;
  if (input.lane === "negocio") {
    const draft = mapOwnedRentasListingToNegocioFormState(record);
    return { ok: true, lane: "negocio", draft, leonixAdId, sourceUpdatedAt };
  }
  const draft = mapOwnedRentasListingToPrivadoFormState(record);
  return { ok: true, lane: "privado", draft, leonixAdId, sourceUpdatedAt };
}
