import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import { parseLeonixListingContract, readLeonixDetailPairValue } from "@/app/clasificados/lib/leonixRealEstateListingContract";
import {
  parseLeonixContactChannelsV1FromDetailPairs,
  leonixContactChannelsFormSliceFromPayload,
} from "@/app/clasificados/lib/leonixContactChannelsV1";
import { augmentLeonixDetailPairsFromStructuredColumns } from "@/app/clasificados/lib/leonixListingStructuredPayload";
import { rentasShowExactAddressFromDetailPairs } from "@/app/clasificados/rentas/lib/leonixRentasShowing";
import { readLeonixPropertyLocationFromRow } from "@/app/clasificados/shared/constants/leonixPropertyLocationContract";
import { rentasRentalFlowGroupForTipo } from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";
import { createEmptyRentasPrivadoFormState, mergePartialRentasPrivadoState, type RentasPrivadoFormState } from "../privado/schema/rentasPrivadoFormState";
import { createEmptyRentasNegocioFormState, mergePartialRentasNegocioState, type RentasNegocioFormState } from "../negocio/schema/rentasNegocioFormState";

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

/** Exact-label detail_pairs lookup — mirrors the same primitive already proven correct on the
 * live public Rentas listing page (`mapListingRowToRentasPublicListing.ts`). */
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

/**
 * Wave 4 P0 fix — reads back the residencial/comercial/terreno structured property-fact rows
 * that `buildRentasResidencialPropertyRows` / `buildComercialPropertyRows` / `buildTerrenoPropertyRows`
 * (rentasRentalTypeApply.ts) write as human label/value detail_pairs at publish. tipoCodigo/subtipo
 * are left at their schema defaults rather than reverse-matched from display labels — the same
 * accepted limitation already present in the proven Bienes Negocio shared parser
 * (parseBienesAgenteResidencialPublishedState.ts), not a new gap introduced here.
 */
function structuredPropertyFactsFromDetailPairs(
  detailPairs: unknown,
  categoria: RentasPrivadoFormState["categoriaPropiedad"],
): Pick<Partial<RentasPrivadoFormState>, "residencial" | "comercial" | "terreno"> {
  if (categoria === "comercial") {
    return {
      comercial: {
        ...createEmptyRentasPrivadoFormState().comercial,
        uso: pv(detailPairs, "Uso"),
        interiorSqft: digits(pv(detailPairs, "Tamaño interior")),
        oficinas: digits(pv(detailPairs, "Oficinas")),
        banos: digits(pv(detailPairs, "Baños")),
        niveles: digits(pv(detailPairs, "Niveles / pisos")),
        estacionamiento: pv(detailPairs, "Estacionamiento"),
        zonificacion: pv(detailPairs, "Zonificación"),
        condicion: (() => {
          const c = pv(detailPairs, "Condición").toLowerCase();
          const m: Record<string, RentasPrivadoFormState["comercial"]["condicion"]> = {
            excelente: "excelente",
            buena: "buena",
            regular: "regular",
            "necesita reparación": "necesita_reparacion",
          };
          return m[c] ?? "";
        })(),
        accesoCarga: pv(detailPairs, "Acceso de carga").toLowerCase() === "sí",
      },
    };
  }
  if (categoria === "terreno_lote") {
    return {
      terreno: {
        ...createEmptyRentasPrivadoFormState().terreno,
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
      ...createEmptyRentasPrivadoFormState().residencial,
      recamaras: digits(pv(detailPairs, "Recámaras")),
      banos: digits(pv(detailPairs, "Baños completos")),
      mediosBanos: digits(pv(detailPairs, "Medios baños")),
      interiorSqft: digits(pv(detailPairs, "Interior (ft²)")),
      loteSqft: digits(pv(detailPairs, "Lote (ft²)")),
      estacionamiento: digits(pv(detailPairs, "Estacionamientos")),
      ano: digits(pv(detailPairs, "Año de construcción")),
      condicion: (() => {
        const c = pv(detailPairs, "Condición").toLowerCase();
        const m: Record<string, RentasPrivadoFormState["residencial"]["condicion"]> = {
          excelente: "excelente",
          buena: "buena",
          regular: "regular",
          "necesita reparación": "necesita_reparacion",
        };
        return m[c] ?? "";
      })(),
    },
  };
}

/**
 * Wave 4 P0 fix — reads back the flow-specific extension rows (`extensionRows` in
 * rentasRentalTypeApply.ts) for whichever rental flow group is active. Same human label/value
 * detail_pairs already proven correct on the live public page via
 * `buildRentasPublishedFlowExtensionRows`.
 */
function flowExtensionFieldsFromDetailPairs(detailPairs: unknown, rentalTypeCode: string | null): Partial<RentasNegocioFormState> {
  const g = rentasRentalFlowGroupForTipo(rentalTypeCode ?? "");
  const siNo = (raw: string): "" | "si" | "no" => {
    const t = raw.trim().toLowerCase();
    if (t === "sí" || t === "si") return "si";
    if (t === "no") return "no";
    return "";
  };
  if (g === "room_shared") {
    const bano = pv(detailPairs, "Tipo de baño").toLowerCase();
    const cocina = pv(detailPairs, "Cocina").toLowerCase();
    return {
      rentasEspacioTipoBano: bano.includes("privado") ? "privado" : bano.includes("compartido") ? "compartido" : bano.includes("no incluido") ? "no_incluido" : "",
      rentasEspacioTipoCocina: cocina.includes("privada") ? "privada" : cocina.includes("compartida") ? "compartida" : cocina.includes("no incluida") ? "no_incluida" : "",
      rentasEspacioEntradaPrivada: siNo(pv(detailPairs, "Entrada privada")),
      rentasEspacioLavanderia: siNo(pv(detailPairs, "Lavandería disponible")),
      rentasEspacioMaxOcupantes: digits(pv(detailPairs, "Máximo de ocupantes")),
      rentasPreferenciasEspacioCompartido: pv(detailPairs, "Preferencias del espacio compartido"),
    };
  }
  if (g === "storage_parking") {
    return {
      rentasAlmacenTamanoAprox: pv(detailPairs, "Tamaño aproximado"),
      rentasAlmacenAcceso24h: siNo(pv(detailPairs, "Acceso 24/7")),
      rentasAlmacenElectricidad: siNo(pv(detailPairs, "Electricidad disponible")),
      rentasAlmacenSeguridad: siNo(pv(detailPairs, "Seguridad / acceso controlado")),
      rentasAlmacenUsoPermitido: pv(detailPairs, "Uso permitido"),
      rentasAlmacenDimensiones: pv(detailPairs, "Altura / dimensiones"),
    };
  }
  if (g === "commercial_space") {
    return {
      rentasComercialUsoPermitido: pv(detailPairs, "Uso permitido"),
      rentasComercialTamanoFt2: digits(pv(detailPairs, "Tamaño (ft²)")),
      rentasComercialBanoDisponible: siNo(pv(detailPairs, "Baño disponible")),
      rentasComercialHorarioAcceso: pv(detailPairs, "Horario / acceso"),
      rentasComercialContratoMinimo: pv(detailPairs, "Contrato mínimo"),
    };
  }
  if (g === "land_parcel") {
    return {
      rentasLoteUsoPermitido: pv(detailPairs, "Uso permitido"),
      rentasLoteServiciosDisponibles: pv(detailPairs, "Servicios disponibles"),
      rentasLoteAcceso: pv(detailPairs, "Acceso"),
      rentasLoteZonificacion: pv(detailPairs, "Zonificación"),
    };
  }
  return {};
}

function basePartialFromRow(row: Record<string, unknown>): Partial<RentasPrivadoFormState> {
  // Wave 4 P0 fix — augment from listing_json/contact_json the same way the proven public
  // mapper does, so older rows that store structured payload outside detail_pairs still hydrate.
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(row.detail_pairs, row.listing_json, row.contact_json);
  const rx = parseRentasDetailMachineRead(detailPairs);
  const lx = parseLeonixListingContract(detailPairs);
  const gallery = imagesFromRow(row.images);
  const categoria: RentasPrivadoFormState["categoriaPropiedad"] =
    lx.categoriaPropiedad === "comercial" || lx.categoriaPropiedad === "terreno_lote" ? lx.categoriaPropiedad : "residencial";
  const loc = readLeonixPropertyLocationFromRow(row);
  const showExact = rentasShowExactAddressFromDetailPairs(detailPairs);
  // Wave 4 P0 fix — was previously never read at all, silently resetting to blank on every edit
  // despite being correctly persisted and publicly rendered (mapListingRowToRentasPublicListing.ts).
  const zonaVecindario = pv(detailPairs, "Zona o vecindario") || pv(detailPairs, "Colonia");
  const direccionLinea1 = pv(detailPairs, "Ubicación") || pv(detailPairs, "Dirección");

  return {
    categoriaPropiedad: categoria,
    titulo: trim(row.title),
    rentaMensual: digits(row.price),
    deposito: rx.depositUsdDigits ?? "",
    plazoContrato: (rx.leaseTermCode as RentasPrivadoFormState["plazoContrato"]) ?? "",
    plazoContratoOtro: rx.leaseTermCode === "otro" ? (rx.leaseTermCustom ?? "") : "",
    disponibilidad: rx.availabilityNote ?? "",
    amueblado: (rx.furnishedCode as RentasPrivadoFormState["amueblado"]) ?? "",
    mascotas: (rx.petsCode as RentasPrivadoFormState["mascotas"]) ?? "",
    tipoDeRenta: (rx.rentalTypeCode as RentasPrivadoFormState["tipoDeRenta"]) ?? "",
    tipoDeRentaOtro: rx.rentalTypeCustom ?? "",
    condicionesAlquiler: rx.leaseConditions ?? "",
    ciudad: trim(row.city),
    zonaVecindario,
    direccionEstado: loc.state ?? trim(row.state),
    direccionCodigoPostal: loc.zip ?? trim(row.zip),
    direccionPais: loc.country || "United States",
    descripcion: trim(row.description),
    estadoAnuncio: (rx.listingStatus as RentasPrivadoFormState["estadoAnuncio"]) || "disponible",
    requisitos: rx.requirements ?? "",
    serviciosIncluidosLegacy: rx.servicesIncluded ?? "",
    showingByAppointment: rx.showingByAppointment === true,
    showingAvailability: rx.showingAvailability ?? "",
    showingInstructions: rx.showingInstructions ?? "",
    virtualTourUrl: rx.virtualTourUrl ?? "",
    media: {
      ...createEmptyRentasPrivadoFormState().media,
      photoDataUrls: gallery,
      primaryImageIndex: 0,
      videoUrl: rx.videoUrl ?? "",
      videoUrls: rx.videoUrls ?? (rx.videoUrl ? [rx.videoUrl] : []),
    },
    seller: {
      ...createEmptyRentasPrivadoFormState().seller,
      telefono: trim(row.contact_phone),
      correo: trim(row.contact_email),
      whatsapp: rx.contactWhatsappDigits ?? "",
      mensajesTexto: rx.contactSmsDigits ?? "",
      notaContacto: "",
    },
    // Globalization Build D-F2B — was previously omitted entirely, silently resetting website/
    // socials/additional-websites to blank on every dashboard edit despite being correctly
    // persisted and publicly rendered.
    contactChannels: leonixContactChannelsFormSliceFromPayload(
      parseLeonixContactChannelsV1FromDetailPairs(detailPairs),
    ),
    // Wave 4 P0 fix — the address block (line/exact-address toggle) previously had no read-back
    // at all on this lane; direccionLinea1 sources the same "Ubicación"/"Dirección" pair already
    // proven correct on the live public page.
    direccionLinea1,
    mostrarDireccionExacta: showExact,
    ...structuredPropertyFactsFromDetailPairs(detailPairs, categoria),
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  };
}

export function mapOwnedRentasListingToPrivadoFormState(row: Record<string, unknown>): RentasPrivadoFormState {
  return mergePartialRentasPrivadoState({
    ...createEmptyRentasPrivadoFormState(),
    ...basePartialFromRow(row),
  });
}

export function mapOwnedRentasListingToNegocioFormState(row: Record<string, unknown>): RentasNegocioFormState {
  const base = basePartialFromRow(row);
  const detailPairs = augmentLeonixDetailPairsFromStructuredColumns(row.detail_pairs, row.listing_json, row.contact_json);
  const rx = parseRentasDetailMachineRead(detailPairs);
  const meta = parseJsonObject(row.business_meta);

  return mergePartialRentasNegocioState({
    ...base,
    v: undefined,
    negocioNombre: trim(row.business_name),
    negocioTelDirecto: trim(row.contact_phone),
    negocioEmail: trim(row.contact_email),
    // Wave 4 P0 fix — this reverse mapper previously stranded the already-computed WhatsApp/SMS
    // digits on the "seller" partial key, which RentasNegocioFormState's own merge function
    // (mergePartialRentasNegocioState) never reads back from — they were silently dropped on
    // every Negocio dashboard edit despite round-tripping correctly for Privado. Both are written
    // to detail_pairs directly (mergeRentasNegocioMachinePairs), not business_meta.
    negocioWhatsapp: rx.contactWhatsappDigits ?? "",
    negocioMensajesTexto: rx.contactSmsDigits ?? "",
    // Wave 4 P0 fix — the business-identity fields below were never read back at all on the
    // Negocio dashboard-edit lane (only negocioNombre/negocioTelDirecto/negocioEmail were set,
    // from plain row columns). business_meta is built by the shared BR Negocio serializer
    // (leonixNegocioBusinessMetaFromFormState.ts) for the "agente_individual" advertiser type
    // Rentas Negocio always uses; negocioLicencia/negocioSitioWeb/negocioRedes are additionally
    // (and more faithfully) persisted as their own detail_pairs machine keys
    // (mergeRentasNegocioMachinePairs), preferred here over the business_meta copies.
    negocioMarca: trim(meta.negocioNombreCorreduria),
    negocioLogoDataUrl: trim(meta.negocioFotoAgenteUrl),
    negocioLicencia: rx.businessLicense || trim(meta.negocioLicencia),
    negocioTelOficina: trim(meta.negocioTelOficina),
    negocioSitioWeb: rx.businessWebsite || trim(meta.negocioSitioWeb),
    negocioRedes: rx.businessSocial || trim(meta.negocioRedes),
    negocioGoogleReviewsUrl: trim(meta.negocioGoogleReviewsUrl),
    negocioYelpReviewsUrl: trim(meta.negocioYelpReviewsUrl),
    negocioBio: trim(meta.negocioDescripcion),
    negocioIdiomas: trim(meta.negocioIdiomas),
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
    // Package A closure — `updated_at` added so callers can anchor the local edit workspace
    // to the row version it was hydrated from (draftWorkspaceContract Rule 3).
    // Wave 4 P0 fix — added business_meta/listing_json/contact_json: the shared BR Negocio
    // business_meta reader and the structured-payload augmenter (both already proven correct on
    // the live public Rentas listing page) need these to restore business identity fields.
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
