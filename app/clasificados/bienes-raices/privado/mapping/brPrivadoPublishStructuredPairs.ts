/**
 * BR Privado: structured detail rows for publish preview + `detail_pairs` (privado lane only).
 * No negocio formatters, resolvers, or negocio-only fields.
 */

import { BR_PROPERTY_TYPE_OPTIONS } from "@/app/clasificados/bienes-raices/shared/fields/bienesRaicesTaxonomy";
import { isBrPrivadoResidential } from "@/app/clasificados/bienes-raices/privado/publish/brPrivadoPublishConstants";

export type BrPrivadoPublishLang = "es" | "en";

export function getBrPrivadoPublishStructuredDetailPairs(
  lang: BrPrivadoPublishLang,
  details: Record<string, string>,
  _cityDisplay: string
): Array<{ label: string; value: string }> {
  const out: Array<{ label: string; value: string }> = [];
  const pt = (details.brPropertyType ?? "").trim();
  if (pt) {
    const opt = BR_PROPERTY_TYPE_OPTIONS.find((o) => o.value === pt);
    out.push({ label: lang === "es" ? "Tipo de propiedad" : "Property type", value: opt ? opt.label[lang] : pt });
  }
  const subtype = (details.brPropertySubtype ?? "").trim();
  if (subtype) out.push({ label: lang === "es" ? "Subtipo" : "Subtype", value: subtype });
  const zone = (details.brZone ?? "").trim();
  if (zone) out.push({ label: lang === "es" ? "Nombre de la vecindad" : "Neighborhood name", value: zone });
  const addrLine = (details.brAddress ?? "").trim() || (details.direccionPropiedad ?? "").trim();
  if (addrLine) out.push({ label: lang === "es" ? "Dirección" : "Address", value: addrLine });
  if (isBrPrivadoResidential(pt)) {
    const br = (details.brBedrooms ?? "").trim();
    if (br) out.push({ label: lang === "es" ? "Recámaras" : "Bedrooms", value: br });
    const ba = (details.brBathrooms ?? "").trim();
    if (ba) out.push({ label: lang === "es" ? "Baños" : "Bathrooms", value: ba });
    const hb = (details.brHalfBathrooms ?? "").trim();
    if (hb) out.push({ label: lang === "es" ? "Medios baños" : "Half bathrooms", value: hb });
  }
  const sq = (details.brSquareFeet ?? "").trim();
  if (sq) out.push({ label: lang === "es" ? "Pies²" : "Sq ft", value: sq });
  const lot = (details.brLotSize ?? "").trim();
  if (lot) out.push({ label: lang === "es" ? "Terreno" : "Lot size", value: lot });
  const lv = (details.brLevels ?? "").trim();
  if (lv) out.push({ label: lang === "es" ? "Niveles" : "Levels", value: lv });
  const pk = (details.brParkingSpaces ?? "").trim();
  if (pk) out.push({ label: lang === "es" ? "Estacionamiento" : "Parking", value: pk });
  const videoUrl = (details.brVideoUrl ?? "").trim();
  if (videoUrl) out.push({ label: lang === "es" ? "Video de la propiedad" : "Property video", value: videoUrl });
  const virtualTour = (details.brVirtualTourUrl ?? "").trim();
  if (virtualTour) out.push({ label: lang === "es" ? "Tour virtual" : "Virtual tour", value: virtualTour });
  const yearBuilt = (details.brYearBuilt ?? "").trim();
  if (yearBuilt) out.push({ label: lang === "es" ? "Año de construcción" : "Year built", value: yearBuilt });
  const zoning = (details.brZoning ?? "").trim();
  if (zoning) out.push({ label: lang === "es" ? "Zonificación" : "Zoning", value: zoning });
  const servAgua = (details.brServicioAgua ?? "").trim().toLowerCase();
  const servElec = (details.brServicioElectricidad ?? "").trim().toLowerCase();
  const servGas = (details.brServicioGas ?? "").trim().toLowerCase();
  const servDrenaje = (details.brServicioDrenaje ?? "").trim().toLowerCase();
  const servInternet = (details.brServicioInternet ?? "").trim().toLowerCase();
  const serviciosList: string[] = [];
  if (servAgua === "si" || servAgua === "sí" || servAgua === "yes") serviciosList.push(lang === "es" ? "Agua" : "Water");
  if (servElec === "si" || servElec === "sí" || servElec === "yes") serviciosList.push(lang === "es" ? "Electricidad" : "Electric");
  if (servGas === "si" || servGas === "sí" || servGas === "yes") serviciosList.push(lang === "es" ? "Gas" : "Gas");
  if (servDrenaje === "si" || servDrenaje === "sí" || servDrenaje === "yes")
    serviciosList.push(lang === "es" ? "Drenaje" : "Sewer");
  if (servInternet === "si" || servInternet === "sí" || servInternet === "yes") serviciosList.push("Internet");
  if (serviciosList.length > 0)
    out.push({ label: lang === "es" ? "Servicios disponibles" : "Utilities available", value: serviciosList.join(", ") });
  const utilDetails = (details.brUtilitiesForProperty ?? "").trim();
  if (utilDetails) {
    out.push({
      label: lang === "es" ? "Detalles adicionales de servicios" : "Additional utility details",
      value: utilDetails,
    });
  }
  return out;
}
