import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";
import type { RentasFlowFormSlice } from "@/app/clasificados/rentas/shared/rentasRentalTypeApply";
import { formatRentasServiciosIncluidosOutputMultiline } from "@/app/clasificados/rentas/shared/rentasPublishFormHelpers";
import {
  coerceRentasTipoDeRentaId,
  rentasRentalFlowGroupForTipo,
} from "@/app/clasificados/rentas/shared/rentasRentalTypeTaxonomy";

function trim(s: unknown): string {
  if (s == null) return "";
  return typeof s === "string" ? s.trim() : String(s).trim();
}

function rowValue(rows: Array<{ label: string; value: string }> | undefined, labels: string[]): string {
  if (!rows?.length) return "";
  for (const r of rows) {
    const label = trim(r.label).toLowerCase();
    if (!label) continue;
    if (labels.some((needle) => label === needle || label.includes(needle))) {
      const v = trim(r.value);
      if (v) return v;
    }
  }
  return "";
}

/** Browse cards: prefer city/state + zone; avoid using a street-first fallback as the only line when possible. */
export function privacySafeLocation(parts: { cityStateZip?: string; colonia?: string; fallback: string }): string {
  const cityStateZip = trim(parts.cityStateZip);
  const zona = trim(parts.colonia);
  if (cityStateZip && zona) return `${cityStateZip} · ${zona}`;
  if (cityStateZip) return cityStateZip;
  if (zona) return zona;
  const fb = trim(parts.fallback);
  if (fb && !/^\d+\s/.test(fb)) return fb;
  return cityStateZip || zona || "—";
}

function inferAvailability(label: string): RentasPublicListing["rentasListingAvailability"] {
  const t = trim(label).toLowerCase();
  if (t.includes("rentado")) return "rentado";
  if (t.includes("bajo contrato")) return "bajo_contrato";
  if (t.includes("pendiente")) return "pendiente";
  if (t.includes("disponible")) return "disponible";
  return null;
}

function triSiNo(v: string): boolean | null {
  const t = v.trim().toLowerCase();
  if (t === "si" || t === "sí") return true;
  if (t === "no") return false;
  return null;
}

function roomBathPublic(code: string): string | undefined {
  const c = code.trim();
  const m: Record<string, string> = {
    privado: "privado",
    compartido: "compartido",
    no_incluido: "no incluido",
  };
  return m[c] ?? (c || undefined);
}

function roomKitchenPublic(code: string): string | undefined {
  const c = code.trim();
  const m: Record<string, string> = {
    privada: "privada",
    compartida: "compartida",
    no_incluida: "no incluida",
  };
  return m[c] ?? (c || undefined);
}

function prettifySqftFromDigits(raw: string): string {
  const d = raw.replace(/\D/g, "");
  if (!d) return "";
  const n = Number(d);
  if (!Number.isFinite(n) || n <= 0) return "";
  return `${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n)} ft²`;
}

/**
 * Merge draft “tipo de renta” flow hints so the preview result card matches live `buildRentasResultsCardSummaryEs`.
 */
export function rentasPreviewResultCardFlowOverlay(state: RentasFlowFormSlice, base: RentasPublicListing): RentasPublicListing {
  const code = coerceRentasTipoDeRentaId(state.tipoDeRenta);
  if (!code) return base;
  const g = rentasRentalFlowGroupForTipo(code);
  const svc = formatRentasServiciosIncluidosOutputMultiline(state);

  const overlay: Partial<RentasPublicListing> = {
    rentalTypeCode: code,
    rentalTypeCustom: code === "otro" ? trim(state.tipoDeRentaOtro) || undefined : undefined,
    rentasRoomBathLabel: state.rentasEspacioTipoBano ? roomBathPublic(state.rentasEspacioTipoBano) : undefined,
    rentasRoomKitchenLabel: state.rentasEspacioTipoCocina ? roomKitchenPublic(state.rentasEspacioTipoCocina) : undefined,
    rentasRoomMaxOccupants: state.rentasEspacioMaxOcupantes.replace(/\D/g, "") || undefined,
    rentasStorageAccess24h: triSiNo(state.rentasAlmacenAcceso24h),
    rentasStorageSecurity: triSiNo(state.rentasAlmacenSeguridad),
    leaseTermCode: trim(state.plazoContrato) || undefined,
    servicesIncluded: trim(svc) || undefined,
    mascotasPermitidas: state.mascotas === "permitidas" ? true : state.mascotas === "no_permitidas" ? false : base.mascotasPermitidas,
    amueblado: state.amueblado === "amueblado" ? true : state.amueblado === "sin_amueblar" ? false : base.amueblado,
  };

  const sq = trim(base.sqft);
  const sqWeak = !sq || sq === "—";

  if (g === "storage_parking") {
    const t = trim(state.rentasAlmacenTamanoAprox);
    if (t && sqWeak) {
      overlay.sqft = /ft²|ft2|sq|pies/i.test(t) ? t : prettifySqftFromDigits(t) || t;
    }
  }

  if (g === "land_parcel" && state.categoriaPropiedad === "terreno_lote") {
    const lot = trim(state.terreno.loteSqft);
    const cur = trim(base.lotSqft);
    if (lot && (!cur || cur === "—")) {
      overlay.lotSqft = prettifySqftFromDigits(lot) || `${lot} ft²`;
    }
  }

  if (g === "commercial_space") {
    const tsq = state.rentasComercialTamanoFt2.replace(/\D/g, "");
    if (tsq && sqWeak) {
      overlay.sqft = prettifySqftFromDigits(tsq);
    }
    if (state.rentasComercialBanoDisponible === "si") {
      const b = trim(base.baths);
      if (!b || b === "—") {
        overlay.baths = "Sí";
        overlay.fullBaths = "Sí";
      }
    }
  }

  return { ...base, ...overlay };
}

export function buildRentasResultCardPreviewListingFromPrivadoVm(
  vm: BienesRaicesPrivadoPreviewVm,
): RentasPublicListing {
  const rows = vm.propertyDetailsRows ?? [];
  const zona = rowValue(rows, ["zona o vecindario", "zona", "vecindario"]);
  const browseLoc = privacySafeLocation({
    cityStateZip: vm.location.cityStateZip,
    colonia: zona,
    fallback: vm.addressLine,
  });
  return {
    id: "preview-rentas-privado",
    title: trim(vm.heroTitle) || "Renta",
    imageUrl: trim(vm.media.heroUrl) || "/logo.png",
    galleryUrls: vm.media.allPhotoUrls?.length ? vm.media.allPhotoUrls : undefined,
    rentDisplay: trim(vm.priceDisplay) || "Consultar",
    addressLine: browseLoc,
    resultBrowseLocation: browseLoc,
    beds: rowValue(rows, ["recámaras", "recamaras"]) || "—",
    baths: rowValue(rows, ["baños completos", "baños", "banos"]) || "—",
    sqft: rowValue(rows, ["interior (ft²)", "interior (ft2)", "interior", "sqft", "tamaño (ft²)", "tamaño (ft2)"]) || "—",
    categoriaPropiedad: vm.categoria,
    branch: "privado",
    badges: ["privado"],
    promoted: false,
    layout: "vertical",
    rentasListingAvailability: inferAvailability(vm.listingStatusLabel),
    amueblado: rowValue(rows, ["amueblado"]).toLowerCase() === "amueblado",
    mascotasPermitidas: rowValue(rows, ["mascotas"]).toLowerCase() === "permitidas",
  };
}

export function buildRentasResultCardPreviewListingFromNegocioVm(
  vm: BienesRaicesNegocioPreviewVm,
  categoria: BrNegocioCategoriaPropiedad,
): RentasPublicListing {
  const rows = vm.propertyDetailsRows ?? [];
  const browseLoc = privacySafeLocation({
    cityStateZip: vm.location.cityStateZip,
    colonia: vm.location.colonia,
    fallback: vm.addressLine,
  });
  return {
    id: "preview-rentas-negocio",
    title: trim(vm.heroTitle) || "Renta",
    imageUrl: trim(vm.media.heroUrl) || "/logo.png",
    galleryUrls: vm.media.allPhotoUrls?.length ? vm.media.allPhotoUrls : undefined,
    rentDisplay: trim(vm.priceDisplay) || "Consultar",
    addressLine: browseLoc,
    resultBrowseLocation: browseLoc,
    beds: rowValue(rows, ["recámaras", "recamaras"]) || "—",
    baths: rowValue(rows, ["baños completos", "baños", "banos"]) || "—",
    sqft: rowValue(rows, ["interior (ft²)", "interior (ft2)", "interior", "sqft", "tamaño (ft²)", "tamaño (ft2)"]) || "—",
    categoriaPropiedad: categoria,
    branch: "negocio",
    badges: ["negocio"],
    promoted: false,
    layout: "vertical",
    rentasListingAvailability: inferAvailability(vm.listingStatusLabel),
    amueblado: rowValue(rows, ["amueblado"]).toLowerCase() === "amueblado",
    mascotasPermitidas: rowValue(rows, ["mascotas"]).toLowerCase() === "permitidas",
  };
}
