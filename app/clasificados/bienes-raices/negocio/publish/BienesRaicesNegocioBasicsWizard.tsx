"use client";

import type { Dispatch, SetStateAction } from "react";
import { useMemo } from "react";
import CityAutocomplete from "@/app/components/CityAutocomplete";
import ListingView from "@/app/clasificados/components/ListingView";
import type { ListingData } from "@/app/clasificados/components/ListingView";
import { formatUsPhone10 } from "@/app/clasificados/bienes-raices/negocio/utils/brNegocioContactHelpers";
import type { PublishStep } from "@/app/clasificados/config/categorySchema";
import { FaFacebook, FaInstagram, FaTiktok, FaWhatsapp, FaTwitter, FaYoutube } from "react-icons/fa";

const EN_VENTA_BR_PROPERTY_TYPES: Array<{ value: string; label: { es: string; en: string } }> = [
  { value: "casa", label: { es: "Casa", en: "House" } },
  { value: "apartamento", label: { es: "Apartamento", en: "Apartment" } },
  { value: "condo", label: { es: "Condo", en: "Condo" } },
  { value: "townhouse", label: { es: "Townhouse", en: "Townhouse" } },
  { value: "lote", label: { es: "Lote", en: "Lot" } },
  { value: "finca", label: { es: "Finca", en: "Farm / ranch" } },
  { value: "oficina", label: { es: "Oficina", en: "Office" } },
  { value: "local-comercial", label: { es: "Local comercial", en: "Commercial space" } },
  { value: "edificio", label: { es: "Edificio", en: "Building" } },
  { value: "proyecto-nuevo", label: { es: "Proyecto nuevo", en: "New development" } },
];

type BrSubcategoriaKey = "residencial" | "condos-townhomes" | "multifamiliar" | "terrenos" | "comercial" | "industrial";

function getBrSubcategoriaFromPropertyType(propertyType: string): BrSubcategoriaKey {
  const pt = (propertyType ?? "").trim().toLowerCase();
  if (["casa", "apartamento", "finca"].includes(pt)) return "residencial";
  if (["condo", "townhouse"].includes(pt)) return "condos-townhomes";
  if (["edificio"].includes(pt)) return "multifamiliar";
  if (["lote"].includes(pt)) return "terrenos";
  if (["oficina", "local-comercial"].includes(pt)) return "comercial";
  if (["proyecto-nuevo"].includes(pt)) return "residencial";
  return "residencial";
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

export type BienesRaicesNegocioBasicsWizardProps = {
  lang: "es" | "en";
  cxOut?: typeof cx;
  details: Record<string, string>;
  setDetails: Dispatch<SetStateAction<Record<string, string>>>;
  title: string;
  setTitle: (v: string) => void;
  price: string;
  setPrice: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  basicsShowValidation: boolean;
  requirements: {
    titleOk: boolean;
    descOk: boolean;
    priceOk: boolean;
    cityOk: boolean;
    bienesRaicesMetaOk: boolean;
  };
  formatBrNegocioPriceInputDisplay: (v: string) => string;
  formatBrNegocioIntegerInputDisplay: (v: string) => string;
  brNegocioDigitsOnly: (v: string) => string;
  logoUploading: boolean;
  agentPhotoUploading: boolean;
  uploadBusinessImage: (file: File, kind: "logo" | "agent") => void;
  goToStep: (s: PublishStep) => void;
  previewListing: ListingData;
};

export function BienesRaicesNegocioBasicsWizard({
  lang,
  cxOut = cx,
  details,
  setDetails,
  title,
  setTitle,
  price,
  setPrice,
  city,
  setCity,
  basicsShowValidation,
  requirements,
  formatBrNegocioPriceInputDisplay,
  formatBrNegocioIntegerInputDisplay,
  brNegocioDigitsOnly,
  logoUploading,
  agentPhotoUploading,
  uploadBusinessImage,
  goToStep,
  previewListing,
}: BienesRaicesNegocioBasicsWizardProps) {
  const step = useMemo(() => {
    const n = parseInt((details.brNegocioWizardStep ?? "1").trim(), 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    if (n > 7) return 7;
    return n;
  }, [details.brNegocioWizardStep]);

  const setStep = (n: number) => {
    const clamped = Math.min(7, Math.max(1, n));
    setDetails((prev) => ({ ...prev, brNegocioWizardStep: String(clamped) }));
  };

  const labels = useMemo(
    () =>
      lang === "es"
        ? {
            steps: ["Principal", "Propiedad", "Medios", "Descripción", "Hechos", "Negocio", "Vista previa"],
            next: "Siguiente",
            back: "Atrás",
            toMedia: "Ir a fotos y publicar",
          }
        : {
            steps: ["Basics", "Property", "Media URLs", "Description", "Facts", "Business", "Preview"],
            next: "Next",
            back: "Back",
            toMedia: "Continue to photos & publish",
          },
    [lang]
  );

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#C9B46A]/35 bg-[#FFFCF6] px-4 py-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-[#111111]/60">
          {lang === "es" ? "Paso" : "Step"} {step} / 7 — {labels.steps[step - 1]}
        </p>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {[1, 2, 3, 4, 5, 6, 7].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStep(s)}
              className={cxOut(
                "h-7 min-w-[1.75rem] rounded-full px-2 text-xs font-semibold transition",
                s === step ? "bg-[#111111] text-[#F5F5F5]" : "bg-white/80 text-[#111111]/60 border border-black/10 hover:bg-white"
              )}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Tipo de propiedad" : "Property type"}{" *"}</label>
            <select
              value={details.enVentaPropertyType ?? ""}
              onChange={(e) => {
                const v = e.target.value;
                setDetails((prev) => ({ ...prev, enVentaPropertyType: v, bienesRaicesSubcategoria: getBrSubcategoriaFromPropertyType(v) }));
              }}
              className={cxOut(
                "mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-[#111111]",
                basicsShowValidation && !details.enVentaPropertyType?.trim() ? "border-red-500" : "border-black/10"
              )}
            >
              <option value="">{lang === "es" ? "Elige tipo…" : "Choose type…"}</option>
              {EN_VENTA_BR_PROPERTY_TYPES.map((o) => (
                <option key={o.value} value={o.value}>
                  {lang === "es" ? o.label.es : o.label.en}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Subtipo" : "Subtype"}</label>
            <input
              value={details.enVentaPropertySubtype ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, enVentaPropertySubtype: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Título del anuncio" : "Listing title"}{" *"}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className={cxOut("mt-2 w-full rounded-xl border bg-white/90 px-4 py-3", basicsShowValidation && !requirements.titleOk ? "border-red-500" : "border-black/10")}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Precio" : "Price"}{" *"}</label>
              <input
                inputMode="numeric"
                value={price}
                onChange={(e) => setPrice(formatBrNegocioPriceInputDisplay(e.target.value))}
                className={cxOut("mt-2 w-full rounded-xl border bg-white/90 px-4 py-3", basicsShowValidation && !requirements.priceOk ? "border-red-500" : "border-black/10")}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Estado del listado" : "Listing status"}</label>
              <select
                value={details.brNegocioListingStatus ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioListingStatus: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-sm"
              >
                <option value="">{lang === "es" ? "Opcional" : "Optional"}</option>
                <option value="active">{lang === "es" ? "Activo" : "Active"}</option>
                <option value="pending">{lang === "es" ? "Pendiente" : "Pending"}</option>
                <option value="sold">{lang === "es" ? "Vendido" : "Sold"}</option>
                <option value="coming_soon">{lang === "es" ? "Próximamente" : "Coming soon"}</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Ciudad" : "City"}{" *"}</label>
            <CityAutocomplete value={city} onChange={setCity} lang={lang} label="" variant="light" className="mt-2" invalid={basicsShowValidation && !requirements.cityOk} />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Vecindad" : "Neighborhood"}</label>
            <input
              value={details.enVentaZone ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, enVentaZone: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Número" : "Street #"}</label>
              <input
                value={details.brNegocioStreetNumber ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioStreetNumber: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Calle" : "Street"}</label>
              <input
                value={details.brNegocioStreet ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioStreet: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estado" : "State"}</label>
              <input
                value={details.brNegocioState ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioState: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "ZIP" : "ZIP"}</label>
              <input
                value={details.brNegocioZip ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioZip: e.target.value.replace(/[^\d-]/g, "").slice(0, 10) }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="rounded-xl border border-black/10 bg-white/80 p-4 space-y-3">
          <h4 className="text-sm font-medium text-[#111111]">{lang === "es" ? "Datos rápidos" : "Quick facts"}</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Recámaras" : "Bedrooms"} *</label>
              <input
                value={details.enVentaBedrooms ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaBedrooms: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Baños" : "Baths"} *</label>
              <input
                value={details.enVentaBathrooms ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaBathrooms: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Medios baños" : "Half baths"}</label>
              <input
                value={details.enVentaHalfBathrooms ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaHalfBathrooms: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Pies²" : "Sq ft"} *</label>
              <input
                value={formatBrNegocioIntegerInputDisplay(details.enVentaSquareFeet ?? "")}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaSquareFeet: brNegocioDigitsOnly(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Terreno" : "Lot"}</label>
              <input
                value={formatBrNegocioIntegerInputDisplay(details.enVentaLotSize ?? "")}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLotSize: brNegocioDigitsOnly(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Niveles" : "Levels"}</label>
              <input
                value={details.enVentaLevels ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaLevels: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estacionamiento" : "Parking"}</label>
              <input
                value={details.enVentaParkingSpaces ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaParkingSpaces: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Año" : "Year built"}</label>
              <input
                value={details.enVentaYearBuilt ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaYearBuilt: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Estilo / tipo de hogar" : "Style / home type"}</label>
              <input
                value={details.enVentaArchitecturalStyle ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, enVentaArchitecturalStyle: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-3 rounded-xl border border-black/10 bg-white/80 p-4">
          <p className="text-xs text-[#111111]/70">{lang === "es" ? "Sube las fotos en el paso siguiente. Aquí solo enlaces." : "Upload photos in the next step. URLs only here."}</p>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Video de la propiedad" : "Property video URL"}</label>
            <input
              value={details.enVentaVideoUrl ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, enVentaVideoUrl: e.target.value }))}
              placeholder="https://"
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Tour virtual" : "Virtual tour"}</label>
            <input
              value={details.enVentaVirtualTourUrl ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, enVentaVirtualTourUrl: e.target.value }))}
              placeholder="https://"
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Tour (campo negocio)" : "Tour (business field)"}</label>
            <input
              value={details.negocioRecorridoVirtual ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, negocioRecorridoVirtual: e.target.value }))}
              placeholder="https://"
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Plano / floor plan URL" : "Floor plan URL"}</label>
            <input
              value={details.negocioFloorPlanUrl ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, negocioFloorPlanUrl: e.target.value }))}
              placeholder="https://"
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Resumen corto (opcional)" : "Short summary (optional)"}</label>
            <input
              value={details.brNegocioListingSummary ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioListingSummary: e.target.value }))}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Destacados (uno por línea)" : "Highlights (one per line)"}</label>
            <textarea
              value={details.brNegocioHighlights ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, brNegocioHighlights: e.target.value }))}
              rows={4}
              placeholder={lang === "es" ? "Ej: Cocina renovada\nGaraje para 2 autos" : "e.g. Renovated kitchen\n2-car garage"}
              className="mt-2 w-full rounded-xl border border-black/10 bg-white/90 px-4 py-3 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#111111]">{lang === "es" ? "Descripción completa" : "Full description"}{" *"}</label>
            <textarea
              value={details.enVentaFullDescription ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, enVentaFullDescription: e.target.value }))}
              rows={8}
              className={cxOut("mt-2 w-full rounded-xl border bg-white/90 px-4 py-3 text-sm", basicsShowValidation && !requirements.descOk ? "border-red-500" : "border-black/10")}
            />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Comodidades (texto libre)" : "Amenities (free text)"}</label>
            <input
              value={details.comodidades ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, comodidades: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4 rounded-xl border border-black/10 bg-white/80 p-4 max-h-[min(70vh,520px)] overflow-y-auto">
          <h4 className="text-sm font-semibold text-[#111111]">{lang === "es" ? "Hechos y características (opcional)" : "Facts & features (optional)"}</h4>
          {(
            [
              { k: "enVentaKitchenFeatures", es: "Cocina", en: "Kitchen" },
              { k: "enVentaHeating", es: "Calefacción", en: "Heating" },
              { k: "enVentaCooling", es: "Enfriamiento", en: "Cooling" },
              { k: "enVentaAppliancesIncluded", es: "Electrodomésticos", en: "Appliances" },
              { k: "enVentaFlooring", es: "Pisos", en: "Flooring" },
              { k: "enVentaParkingFeatures", es: "Estacionamiento (detalles)", en: "Parking details" },
              { k: "enVentaLotFeatures", es: "Terreno", en: "Lot" },
              { k: "enVentaExteriorFeatures", es: "Exterior", en: "Exterior" },
              { k: "enVentaZoning", es: "Zonificación", en: "Zoning" },
              { k: "enVentaSpecialConditions", es: "Condiciones especiales", en: "Special conditions" },
              { k: "enVentaUtilitiesForProperty", es: "Servicios (detalle)", en: "Utilities detail" },
            ] as const
          ).map(({ k, es, en }) => (
            <div key={k}>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? es : en}</label>
              <input
                value={(details as Record<string, string>)[k] ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, [k]: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
          ))}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {(
              [
                { key: "enVentaServicioAgua", es: "Agua", en: "Water" },
                { key: "enVentaServicioElectricidad", es: "Electricidad", en: "Electric" },
                { key: "enVentaServicioGas", es: "Gas", en: "Gas" },
                { key: "enVentaServicioDrenaje", es: "Drenaje", en: "Sewer" },
                { key: "enVentaServicioInternet", es: "Internet", en: "Internet" },
              ] as const
            ).map(({ key, es, en }) => {
              const val = (details[key] ?? "").toString().trim().toLowerCase();
              const isOn = val === "si" || val === "sí" || val === "yes";
              return (
                <label key={key} className="flex items-center gap-2 cursor-pointer text-sm">
                  <input
                    type="checkbox"
                    checked={isOn}
                    onChange={(e) => setDetails((prev) => ({ ...prev, [key]: e.target.checked ? "si" : "" }))}
                    className="rounded border-black/20"
                  />
                  {lang === "es" ? es : en}
                </label>
              );
            })}
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-4 rounded-xl border border-[#C9B46A]/30 bg-[#F8F6F0]/80 p-4">
          <h4 className="text-sm font-semibold text-[#111111]">{lang === "es" ? "Identidad del negocio" : "Business identity"}</h4>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Nombre del negocio" : "Business name"} *</label>
            <input
              value={details.negocioNombre ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, negocioNombre: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Correduría / broker" : "Brokerage"}</label>
            <input
              value={details.negocioNombreCorreduria ?? ""}
              onChange={(e) => setDetails((prev) => ({ ...prev, negocioNombreCorreduria: e.target.value }))}
              className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Agente" : "Agent"}</label>
              <input
                value={details.negocioAgente ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, negocioAgente: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Co-agente" : "Co-agent"}</label>
              <input
                value={details.negocioCoAgente ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, negocioCoAgente: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Cargo" : "Role"}</label>
            <input value={details.negocioCargo ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioCargo: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-3">
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Logo" : "Logo"}</label>
              <div className="mt-1 flex items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-[#C9B46A]/50 bg-white px-3 py-1.5 text-xs font-semibold">
                  {logoUploading ? "…" : "↑"}
                  <input type="file" accept="image/*" className="sr-only" disabled={logoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "logo"); e.target.value = ""; }} />
                </label>
                {details.negocioLogoUrl ? <img src={details.negocioLogoUrl} alt="" className="h-10 w-10 rounded border object-cover" /> : null}
              </div>
            </div>
            <div>
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Foto agente" : "Agent photo"}</label>
              <div className="mt-1 flex items-center gap-2">
                <label className="cursor-pointer rounded-lg border border-[#C9B46A]/50 bg-white px-3 py-1.5 text-xs font-semibold">
                  {agentPhotoUploading ? "…" : "↑"}
                  <input type="file" accept="image/*" className="sr-only" disabled={agentPhotoUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadBusinessImage(f, "agent"); e.target.value = ""; }} />
                </label>
                {details.negocioFotoAgenteUrl ? <img src={details.negocioFotoAgenteUrl} alt="" className="h-10 w-10 rounded border object-cover" /> : null}
              </div>
            </div>
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Licencia" : "License"}</label>
            <input value={details.negocioLicencia ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioLicencia: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Zonas de servicio" : "Service areas"}</label>
            <textarea value={details.negocioZonasServicio ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioZonasServicio: e.target.value }))} rows={2} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div className="flex flex-wrap gap-2 items-end">
            <div className="min-w-[8rem] flex-1">
              <label className="text-xs text-[#111111]/80">{lang === "es" ? "Tel. oficina" : "Office phone"}</label>
              <input
                value={details.negocioTelOficina ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, negocioTelOficina: formatUsPhone10(e.target.value) }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm"
              />
            </div>
            <div className="w-20">
              <label className="text-xs text-[#111111]/80">Ext.</label>
              <input
                value={details.negocioTelExtension ?? ""}
                onChange={(e) => setDetails((prev) => ({ ...prev, negocioTelExtension: e.target.value.replace(/[^\dA-Za-z#*]/g, "").slice(0, 8) }))}
                className="mt-1 w-full rounded-lg border border-black/10 px-2 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">Email</label>
            <input type="email" value={details.negocioEmail ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioEmail: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Sitio web" : "Website"}</label>
            <input value={details.negocioSitioWeb ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioSitioWeb: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-[#111111]/55 uppercase">{lang === "es" ? "Redes" : "Social"}</p>
            {(
              [
                { key: "negocioSocialFacebook" as const, Icon: FaFacebook, lab: "Facebook" },
                { key: "negocioSocialInstagram" as const, Icon: FaInstagram, lab: "Instagram" },
                { key: "negocioSocialYoutube" as const, Icon: FaYoutube, lab: "YouTube" },
                { key: "negocioSocialTiktok" as const, Icon: FaTiktok, lab: "TikTok" },
                { key: "negocioSocialWhatsapp" as const, Icon: FaWhatsapp, lab: "WhatsApp" },
                { key: "negocioSocialX" as const, Icon: FaTwitter, lab: "X" },
              ] as const
            ).map(({ key, Icon, lab }) => (
              <div key={key} className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0 text-[#111111]/60" />
                <input value={(details as Record<string, string>)[key] ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, [key]: e.target.value }))} className="min-w-0 flex-1 rounded-lg border border-black/10 px-2 py-1.5 text-sm" placeholder={lab} />
              </div>
            ))}
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Idiomas" : "Languages"}</label>
            <input value={details.negocioIdiomas ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioIdiomas: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Horario" : "Hours"}</label>
            <input value={details.negocioHorario ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioHorario: e.target.value }))} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="text-xs text-[#111111]/80">{lang === "es" ? "Descripción del negocio" : "Business description"}</label>
            <textarea value={details.negocioDescripcion ?? ""} onChange={(e) => setDetails((prev) => ({ ...prev, negocioDescripcion: e.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-black/10 px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={(details.negocioPlusMasAnuncios ?? "") === "si"} onChange={(e) => setDetails((prev) => ({ ...prev, negocioPlusMasAnuncios: e.target.checked ? "si" : "" }))} className="rounded border-black/20" />
            {lang === "es" ? "Más anuncios de esta empresa" : "More listings from this company"}
          </label>
        </div>
      )}

      {step === 7 && (
        <div className="space-y-4">
          <p className="text-sm text-[#111111]/80">{lang === "es" ? "Así se verá tu listado. Luego sube fotos y finaliza." : "This is how your listing will look. Then upload photos and finish."}</p>
          <div className="max-h-[min(88vh,920px)] w-full min-w-0 overflow-y-auto overflow-x-hidden">
            <ListingView listing={previewListing} previewMode hideProComparisonUI />
          </div>
          <button
            type="button"
            onClick={() => goToStep("media")}
            className="w-full rounded-xl bg-[#111111] px-5 py-3.5 text-sm font-semibold text-[#F5F5F5] hover:opacity-95"
          >
            {labels.toMedia}
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button type="button" onClick={() => setStep(step - 1)} disabled={step <= 1} className="rounded-xl border border-black/10 bg-[#F5F5F5] px-5 py-2.5 text-sm font-semibold disabled:opacity-40">
          {labels.back}
        </button>
        {step < 7 && (
          <button type="button" onClick={() => setStep(step + 1)} className="rounded-xl bg-yellow-500/90 px-5 py-2.5 text-sm font-semibold text-black hover:bg-yellow-500">
            {labels.next}
          </button>
        )}
      </div>
    </div>
  );
}
