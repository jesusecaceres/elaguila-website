import type { ViajesBusinessResult } from "../data/viajesResultsSampleData";
import { normalizeViajesDestinationKey } from "./normalizeViajesDestination";
import type { ViajesStagedListingRow } from "./viajesStagedListingTypes";
import type { ViajesNegociosDraft } from "@/app/(site)/publicar/viajes/negocios/lib/viajesNegociosDraftTypes";
import type { ViajesPrivadoDraft } from "@/app/(site)/publicar/viajes/privado/lib/viajesPrivadoDraftTypes";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80";

const NEGOCIOS_OFFER_TO_TRIP_KEYS: Record<string, string[]> = {
  paquete: ["tours", "paquete"],
  tour: ["tours", "tour"],
  crucero: ["cruceros", "crucero"],
  resort: ["resorts", "resort"],
  escapada: ["fin-de-semana", "escapada"],
};

const PRIVADO_OFFER_TO_TRIP_KEYS: Record<string, string[]> = {
  day_trip: ["dia"],
  weekend: ["fin-de-semana", "escapada"],
  resort: ["resorts", "resort"],
  tour: ["tours", "tour"],
  excursion: ["actividades", "tours"],
  cruise: ["cruceros"],
  activity: ["actividades"],
  transport: ["transporte"],
  other: ["tours"],
};

function firstRemoteImageUrl(d: ViajesNegociosDraft): string | null {
  const u = d.imagenPrincipal.trim();
  if (u.startsWith("http")) return u;
  for (const g of d.galeriaUrls) {
    if (typeof g === "string" && g.startsWith("http")) return g;
  }
  return null;
}

function firstRemoteImageUrlPrivado(d: ViajesPrivadoDraft): string | null {
  const u = d.imagenUrl.trim();
  if (u.startsWith("http")) return u;
  for (const g of d.galeriaUrls) {
    if (typeof g === "string" && g.startsWith("http")) return g;
  }
  return null;
}

function negociosTripKeys(offerType: string): string[] {
  return NEGOCIOS_OFFER_TO_TRIP_KEYS[offerType] ?? (offerType ? [offerType] : ["tours"]);
}

function privadoTripKeys(offerType: string): string[] {
  return PRIVADO_OFFER_TO_TRIP_KEYS[offerType] ?? (offerType ? [offerType] : ["tours"]);
}

function negociosAudience(d: ViajesNegociosDraft): string[] {
  const k: string[] = [];
  if (d.familias) k.push("familias");
  if (d.parejas) k.push("parejas");
  if (d.grupos) k.push("grupos");
  return k;
}

function privadoAudience(d: ViajesPrivadoDraft): string[] {
  const k: string[] = [];
  if (d.familias) k.push("familias");
  if (d.parejas) k.push("parejas");
  if (d.grupos) k.push("grupos");
  return k;
}

function budgetFromTag(tag: string): "" | "economico" | "moderado" | "premium" {
  if (tag === "economico" || tag === "moderado" || tag === "premium") return tag;
  return "";
}

function destSlugsFromLabel(label: string): string[] {
  const first = label.split(/[,·]/)[0]?.trim() ?? label;
  const slug = normalizeViajesDestinationKey(first).replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  return slug ? [slug] : [];
}

function summarizeIncluye(s: string, max = 180): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (!t) return "";
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

export function mapViajesStagedRowToViajesBusinessResult(row: ViajesStagedListingRow): ViajesBusinessResult | null {
  const j = row.listing_json as { version?: number; negocios?: ViajesNegociosDraft; privado?: ViajesPrivadoDraft };
  const href = `/clasificados/viajes/oferta/${row.slug}`;
  const publishedAt = row.published_at || row.submitted_at || row.created_at;

  if (row.lane === "business" && j.negocios) {
    const d = j.negocios;
    const img = row.hero_image_url?.trim() || firstRemoteImageUrl(d) || FALLBACK_HERO;
    const title = d.titulo.trim() || row.title;
    const dest = d.destino.trim() || "—";
    return {
      kind: "business",
      id: row.id,
      imageSrc: img,
      imageAlt: title,
      businessName: d.businessName.trim() || row.submitter_name?.trim() || "—",
      offerTitle: title,
      destination: dest,
      destSlugs: destSlugsFromLabel(dest),
      departureCity: d.ciudadSalida.trim() || "—",
      duration: d.duracion.trim() || "—",
      price: d.precio.trim() || "—",
      includedSummary: summarizeIncluye(d.incluye.trim() || d.descripcion.trim()),
      whatsapp: d.whatsapp.trim() || undefined,
      href,
      tripTypeKeys: negociosTripKeys(d.offerType),
      publishedAt,
      audienceKeys: negociosAudience(d),
      budgetBand: budgetFromTag(d.presupuestoTag),
      durationKey: "",
      seasonKeys: [],
      discovery: { featuredBase: 46, sourceTrust: 1, completeness: 0.75 },
      sellerLane: "business",
    };
  }

  if (row.lane === "private" && j.privado) {
    const d = j.privado;
    const img = row.hero_image_url?.trim() || firstRemoteImageUrlPrivado(d) || FALLBACK_HERO;
    const title = d.titulo.trim() || row.title;
    const dest = d.destino.trim() || "—";
    return {
      kind: "business",
      id: row.id,
      imageSrc: img,
      imageAlt: title,
      businessName: d.displayName.trim() || row.submitter_name?.trim() || "—",
      offerTitle: title,
      destination: dest,
      destSlugs: destSlugsFromLabel(dest),
      departureCity: d.ciudadSalida.trim() || "—",
      duration: d.duracion.trim() || "—",
      price: d.precio.trim() || "—",
      includedSummary: summarizeIncluye(d.incluye.trim() || d.descripcion.trim()),
      whatsapp: d.whatsapp.trim() || undefined,
      href,
      tripTypeKeys: privadoTripKeys(d.offerType),
      publishedAt,
      audienceKeys: privadoAudience(d),
      budgetBand: budgetFromTag(d.presupuestoTag),
      durationKey: "",
      seasonKeys: [],
      discovery: { featuredBase: 44, sourceTrust: 1, completeness: 0.72 },
      sellerLane: "private",
    };
  }

  return null;
}
