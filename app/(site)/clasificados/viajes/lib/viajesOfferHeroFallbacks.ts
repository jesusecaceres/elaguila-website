/**
 * Premium hero fallbacks (Unsplash, whitelisted in next.config) + kind inference.
 */

export type ViajesHeroVisualKind = "default" | "resort" | "car" | "itinerary";

/** Fallback chain ends here — all URLs must be reachable or we show gradient-only. */
export const VIAJES_HERO_FALLBACK_BY_KIND: Record<ViajesHeroVisualKind, string> = {
  default: "https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80",
  resort: "https://images.unsplash.com/photo-1552074284-5e88f742d1f5?auto=format&fit=crop&w=2000&q=80",
  car: "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=2000&q=80",
  itinerary: "https://images.unsplash.com/photo-1523906834658-6e24ef2386f9?auto=format&fit=crop&w=2000&q=80",
};

export type ViajesOfferHeroInferInput = {
  tags: string[];
  title: string;
  slug: string;
  partner: { isAffiliate: boolean };
  /** From CMS/draft when set */
  heroVisualKind?: ViajesHeroVisualKind;
};

export function inferViajesHeroVisualKind(input: ViajesOfferHeroInferInput): ViajesHeroVisualKind {
  if (input.heroVisualKind) return input.heroVisualKind;
  const t = `${input.title} ${input.slug} ${input.tags.join(" ")}`.toLowerCase();
  if (/\b(renta de autos|renta auto|car rental|alquiler de auto|renta veh|suv|road trip)\b/.test(t)) {
    return "car";
  }
  if (/\b(resort|hotel|todo incluido|all[- ]?inclusive|playa|beach|boutique)\b/.test(t)) {
    return "resort";
  }
  if (/\b(tour|itinerar|express|días|noches|crucero|cruise|guiad)\b/.test(t) || (!input.partner.isAffiliate && /\b(agenc|operador|operadora)\b/.test(t))) {
    return "itinerary";
  }
  return "default";
}

export function buildHeroFallbackChain(primary: string | undefined, kind: ViajesHeroVisualKind): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  const push = (u: string) => {
    const t = u.trim();
    if (!t || seen.has(t)) return;
    seen.add(t);
    out.push(t);
  };
  push(primary ?? "");
  push(VIAJES_HERO_FALLBACK_BY_KIND[kind]);
  if (kind !== "default") push(VIAJES_HERO_FALLBACK_BY_KIND.default);
  return out;
}
