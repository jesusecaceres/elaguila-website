import { createSupabaseBrowserClient } from "@/app/lib/supabase/browser";
import { parseRentasDetailMachineRead } from "@/app/clasificados/rentas/lib/rentasDetailPairRead";
import { parseLeonixListingContract } from "@/app/clasificados/lib/leonixRealEstateListingContract";
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

function basePartialFromRow(row: Record<string, unknown>): Partial<RentasPrivadoFormState> {
  const rx = parseRentasDetailMachineRead(row.detail_pairs);
  const lx = parseLeonixListingContract(row.detail_pairs);
  const gallery = imagesFromRow(row.images);
  return {
    categoriaPropiedad:
      lx.categoriaPropiedad === "comercial" || lx.categoriaPropiedad === "terreno_lote" ? lx.categoriaPropiedad : "residencial",
    titulo: trim(row.title),
    rentaMensual: digits(row.price),
    deposito: rx.depositUsdDigits ?? "",
    plazoContrato: (rx.leaseTermCode as RentasPrivadoFormState["plazoContrato"]) ?? "",
    disponibilidad: rx.availabilityNote ?? "",
    amueblado: (rx.furnishedCode as RentasPrivadoFormState["amueblado"]) ?? "",
    mascotas: (rx.petsCode as RentasPrivadoFormState["mascotas"]) ?? "",
    tipoDeRenta: (rx.rentalTypeCode as RentasPrivadoFormState["tipoDeRenta"]) ?? "",
    tipoDeRentaOtro: rx.rentalTypeCustom ?? "",
    condicionesAlquiler: rx.leaseConditions ?? "",
    ciudad: trim(row.city),
    direccionEstado: trim(row.state),
    direccionCodigoPostal: trim(row.zip),
    direccionPais: "United States",
    zonaVecindario: "",
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
    confirmListingAccurate: true,
    confirmPhotosRepresentItem: true,
    confirmCommunityRules: true,
  };
}

export async function hydrateRentasDashboardEditDraft(input: {
  listingId: string;
  lane: "privado" | "negocio";
}): Promise<
  | { ok: true; lane: "privado"; draft: RentasPrivadoFormState; leonixAdId: string | null }
  | { ok: true; lane: "negocio"; draft: RentasNegocioFormState; leonixAdId: string | null }
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
    .select("id, owner_id, title, description, city, state, zip, category, price, images, detail_pairs, contact_phone, contact_email, leonix_ad_id, seller_type, business_name")
    .eq("id", listingId)
    .eq("owner_id", ownerId)
    .eq("category", "rentas")
    .maybeSingle();
  if (error || !data?.id) return { ok: false, message: error?.message ?? "Rentas listing not found." };
  const base = basePartialFromRow(data as Record<string, unknown>);
  const leonixAdId = trim((data as Record<string, unknown>).leonix_ad_id) || null;
  if (input.lane === "negocio") {
    const draft = mergePartialRentasNegocioState({
      ...base,
      v: undefined,
      negocioNombre: trim((data as Record<string, unknown>).business_name),
      negocioTelDirecto: trim((data as Record<string, unknown>).contact_phone),
      negocioEmail: trim((data as Record<string, unknown>).contact_email),
      confirmListingAccurate: true,
      confirmPhotosRepresentItem: true,
      confirmCommunityRules: true,
    });
    return { ok: true, lane: "negocio", draft, leonixAdId };
  }
  const draft = mergePartialRentasPrivadoState({
    ...createEmptyRentasPrivadoFormState(),
    ...base,
  });
  return { ok: true, lane: "privado", draft, leonixAdId };
}
