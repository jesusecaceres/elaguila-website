import type { BrNegocioCategoriaPropiedad } from "@/app/clasificados/bienes-raices/shared/brNegocioBranchParams";
import type { BienesRaicesPrivadoPreviewVm } from "@/app/clasificados/bienes-raices/preview/privado/model/bienesRaicesPrivadoPreviewVm";
import type { BienesRaicesNegocioPreviewVm } from "@/app/clasificados/publicar/bienes-raices/negocio/application/mapping/bienesRaicesNegocioPreviewVm";
import type { RentasPublicListing } from "@/app/clasificados/rentas/model/rentasPublicListing";

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

function privacySafeLocation(parts: { cityStateZip?: string; colonia?: string; fallback: string }): string {
  const cityStateZip = trim(parts.cityStateZip);
  const zona = trim(parts.colonia);
  if (zona && cityStateZip) return `${zona}, ${cityStateZip}`;
  if (cityStateZip) return cityStateZip;
  if (zona) return zona;
  return trim(parts.fallback) || "—";
}

function inferAvailability(label: string): RentasPublicListing["rentasListingAvailability"] {
  const t = trim(label).toLowerCase();
  if (t.includes("rentado")) return "rentado";
  if (t.includes("bajo contrato")) return "bajo_contrato";
  if (t.includes("pendiente")) return "pendiente";
  if (t.includes("disponible")) return "disponible";
  return null;
}

export function buildRentasResultCardPreviewListingFromPrivadoVm(
  vm: BienesRaicesPrivadoPreviewVm,
): RentasPublicListing {
  const rows = vm.propertyDetailsRows ?? [];
  const zona = rowValue(rows, ["zona o vecindario", "zona", "vecindario"]);
  return {
    id: "preview-rentas-privado",
    title: trim(vm.heroTitle) || "Renta",
    imageUrl: trim(vm.media.heroUrl) || "/logo.png",
    galleryUrls: vm.media.allPhotoUrls?.length ? vm.media.allPhotoUrls : undefined,
    rentDisplay: trim(vm.priceDisplay) || "Consultar",
    addressLine: privacySafeLocation({
      cityStateZip: vm.location.cityStateZip,
      colonia: zona,
      fallback: vm.addressLine,
    }),
    beds: rowValue(rows, ["recámaras", "recamaras"]) || "—",
    baths: rowValue(rows, ["baños completos", "baños", "banos"]) || "—",
    sqft: rowValue(rows, ["interior (ft²)", "interior (ft2)", "interior", "sqft"]) || "—",
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
  return {
    id: "preview-rentas-negocio",
    title: trim(vm.heroTitle) || "Renta",
    imageUrl: trim(vm.media.heroUrl) || "/logo.png",
    galleryUrls: vm.media.allPhotoUrls?.length ? vm.media.allPhotoUrls : undefined,
    rentDisplay: trim(vm.priceDisplay) || "Consultar",
    addressLine: privacySafeLocation({
      cityStateZip: vm.location.cityStateZip,
      colonia: vm.location.colonia,
      fallback: vm.addressLine,
    }),
    beds: rowValue(rows, ["recámaras", "recamaras"]) || "—",
    baths: rowValue(rows, ["baños completos", "baños", "banos"]) || "—",
    sqft: rowValue(rows, ["interior (ft²)", "interior (ft2)", "interior", "sqft"]) || "—",
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
