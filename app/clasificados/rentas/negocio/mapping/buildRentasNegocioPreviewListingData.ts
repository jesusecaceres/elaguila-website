/**
 * Rentas negocio: augment publish full-preview ListingData with category + business rail + tier
 * so ListingView matches live anuncio identity semantics (draft sources only).
 */

import type { BusinessRailData, ListingData } from "../../../components/ListingView";
import { mapRentasNegocioDetailsTierToDb } from "./rentasNegocioDetailsTierToDb";
import { coalesceNegocioNombreFromWizard } from "@/app/clasificados/en-venta/publish/coalesceWizardDetailValue";

/** Same parsing as anuncio/[id]/page.tsx `parseRentasSocialLinks` (behavior-preserving). */
function parseRentasSocialLinks(raw: string | null | undefined): Array<{ label: string; url: string }> | null {
  const s = (raw ?? "").trim();
  if (!s) return null;
  const out: Array<{ label: string; url: string }> = [];
  const urlLike = /https?:\/\/[^\s,]+/gi;
  const parts = s.split(/[,;]|\s+-\s+/).map((p) => p.trim()).filter(Boolean);
  for (const part of parts) {
    const urlMatch = part.match(urlLike);
    const url = urlMatch ? urlMatch[0] : "";
    const labelPart = url ? part.replace(urlLike, "").replace(/^[:\s]+|[:\s]+$/g, "").trim() : part;
    const label =
      labelPart.toLowerCase().startsWith("facebook")
        ? "Facebook"
        : labelPart.toLowerCase().startsWith("instagram") || labelPart.toLowerCase().startsWith("ig")
          ? "Instagram"
          : labelPart.toLowerCase().startsWith("whatsapp") || labelPart.toLowerCase().startsWith("wa")
            ? "WhatsApp"
            : labelPart.toLowerCase().startsWith("twitter") || labelPart.toLowerCase().startsWith("x ")
              ? "X"
              : labelPart || "Red social";
    if (url && /^https?:\/\//i.test(url)) {
      out.push({ label, url });
    } else if (/^https?:\/\//i.test(part)) {
      out.push({ label: "Red social", url: part });
    }
  }
  if (out.length === 0 && /https?:\/\//i.test(s)) {
    const m = s.match(urlLike);
    if (m) m.forEach((u) => out.push({ label: "Enlace", url: u }));
  }
  return out.length > 0 ? out : null;
}

export type BuildRentasNegocioPreviewListingDataParams = {
  base: ListingData;
  categoryFromUrl: string;
  details: Record<string, string>;
  contactEmail: string;
  agentProfileReturnUrl: string | null;
  lang: "es" | "en";
};

/**
 * When `categoryFromUrl === "rentas"` and `details.rentasBranch === "negocio"`, merges
 * `category: "rentas"`, `businessRail`, `businessRailTier`, and `agentProfileReturnUrl`.
 * Otherwise returns `base` unchanged.
 */
export function buildRentasNegocioPreviewListingData(params: BuildRentasNegocioPreviewListingDataParams): ListingData {
  const { base, categoryFromUrl, details, contactEmail, agentProfileReturnUrl, lang } = params;
  const branch = (details.rentasBranch ?? "").trim().toLowerCase();
  if (categoryFromUrl !== "rentas" || branch !== "negocio") {
    return base;
  }

  const d = details;
  const name = coalesceNegocioNombreFromWizard(d) || (lang === "es" ? "Negocio" : "Business");

  const rawSocials = (d.negocioRedes ?? "").trim();
  const parsedSocials = parseRentasSocialLinks(rawSocials);

  let agentEmail: string | null = (d.negocioEmail ?? "").trim() || null;
  if (!agentEmail) {
    const ce = (contactEmail ?? "").trim();
    if (/.+@.+\..+/.test(ce)) agentEmail = ce;
  }

  const dbTier = mapRentasNegocioDetailsTierToDb((d.rentasTier ?? "").trim());
  const businessRailTier: ListingData["businessRailTier"] =
    dbTier === "plus" ? "business_plus" : "business_standard";

  const websiteTrim = (d.negocioSitioWeb ?? "").trim();
  const logoTrim = (d.negocioLogoUrl ?? "").trim();
  const agentPhotoTrim = (d.negocioFotoAgenteUrl ?? "").trim();
  const tourTrim = (d.negocioRecorridoVirtual ?? "").trim();
  const licTrim = (d.negocioLicencia ?? "").trim();

  const businessRail: BusinessRailData = {
    name,
    agent: (d.negocioAgente ?? "").trim(),
    role: (d.negocioCargo ?? "").trim(),
    ...(licTrim ? { agentLicense: licTrim } : {}),
    officePhone: (d.negocioTelOficina ?? "").trim(),
    ...(agentEmail ? { agentEmail } : {}),
    website: websiteTrim || null,
    socialLinks: parsedSocials ?? [],
    rawSocials: parsedSocials && parsedSocials.length > 0 ? "" : rawSocials,
    logoUrl: logoTrim || null,
    agentPhotoUrl: agentPhotoTrim || null,
    languages: (d.negocioIdiomas ?? "").trim(),
    hours: (d.negocioHorario ?? "").trim(),
    virtualTourUrl: tourTrim || null,
    plusMoreListings: (d.negocioPlusMasAnuncios ?? "") === "si",
  };

  return {
    ...base,
    category: "rentas",
    businessRail,
    businessRailTier,
    agentProfileReturnUrl: agentProfileReturnUrl ?? base.agentProfileReturnUrl ?? null,
  };
}
