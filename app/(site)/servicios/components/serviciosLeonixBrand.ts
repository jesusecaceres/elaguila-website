import type { ServiciosLang } from "../types/serviciosBusinessProfile";
import type { ServiciosListingTemplate } from "@/app/(site)/clasificados/servicios/lib/serviciosTemplateRouting";
import { SV } from "./serviciosDesignTokens";

/** Leonix Servicios professional brand — cream, charcoal, burgundy, gold (Gate 13). */
export const LX = {
  ...SV,
  charcoal: "#1E1814",
  charcoalSoft: "#2F2A23",
  burgundy: "#7A1E2C",
  burgundyDark: "#5C1622",
  ivory: "#FFFCF7",
  gold: "#C9A84A",
  goldBorder: "#D4C4A8",
  chipBg: "#F5F0E8",
  /** Recognizable WhatsApp green — muted, not neon (Gate 13B). */
  whatsApp: "#1E8750",
  whatsAppDark: "#186B43",
  whatsAppShadow: "0 6px 16px rgba(30, 107, 66, 0.22)",
  /** Deep muted green — trust/verified only, never for primary CTAs. */
  trustGreen: "#2D5A3D",
  trustGreenSoft: "rgba(45, 90, 61, 0.14)",
  trustGreenText: "#2D5A3D",
  trustGreenTextOnDark: "#A8BFB0",
} as const;

export const LX_CHIP =
  "inline-flex max-w-full shrink-0 items-center rounded-md border border-[#D4C4A8]/90 bg-[#F5F0E8] px-2.5 py-1 text-[11px] font-semibold leading-tight text-[#1E1814] sm:text-xs";

export const LX_SECTION_CARD =
  "rounded-xl border border-[#E8D9C4]/90 bg-[#FFFDF7] shadow-sm sm:rounded-2xl";

export const LX_CTA_PRIMARY =
  "inline-flex min-h-[44px] min-w-0 touch-manipulation items-center justify-center gap-2 rounded-lg border-0 px-4 py-2.5 text-sm font-bold text-[#FFFCF7] shadow-md transition hover:brightness-[1.06] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/55";

export const LX_CTA_SECONDARY =
  "inline-flex min-h-[44px] min-w-0 touch-manipulation items-center justify-center gap-2 rounded-lg border-2 border-[#D4C4A8] bg-[#FFFCF7] px-4 py-2.5 text-sm font-bold text-[#1E1814] shadow-sm transition hover:border-[#C9A84A] hover:bg-[#FFFDF9] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40";

export const LX_CTA_WHATSAPP =
  "inline-flex min-h-[44px] min-w-0 touch-manipulation items-center justify-center gap-2 rounded-lg border-0 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:brightness-[1.04] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1E8750]/35";

export const LX_CTA_MAP =
  "inline-flex min-h-[44px] min-w-0 touch-manipulation items-center justify-center gap-2 rounded-lg border-2 border-[#3B2117] bg-[#1E1814] px-4 py-2.5 text-sm font-bold text-[#FFFCF7] shadow-sm transition hover:bg-[#2A2620] active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A84A]/40";

export const LX_HERO_BG =
  "relative overflow-hidden bg-gradient-to-br from-[#1E1814] via-[#3B2117] to-[#2A2620] text-[#FFFCF7]";

/** Premium editorial titles — `font-serif` (project-safe, no new font imports). */
export const LX_TYPE_SERIF_DISPLAY = "font-serif font-semibold tracking-tight text-balance";

/** Hero business name — large, ivory, authoritative (Gate 18). */
export const LX_HERO_TITLE = `${LX_TYPE_SERIF_DISPLAY} mt-1.5 leading-[1.08] text-[#FFFCF7] text-[clamp(1.75rem,4.2vw+0.55rem,3.15rem)] sm:leading-[1.06]`;

/** Major section headings (trust, services, offers). */
export const LX_SECTION_HEADING =
  "font-serif text-xl font-semibold tracking-tight text-[#1E1814] sm:text-[1.35rem] md:text-2xl";

/** Compact discovery/preview card business name. */
export const LX_COMPACT_CARD_TITLE =
  "font-serif text-base font-semibold leading-snug tracking-tight text-[#1E1814] sm:text-lg md:text-xl";

/** Logo/headshot on dark hero — cream field + gold border (Gate 18). */
export const LX_HERO_LOGO_FRAME =
  "relative mx-auto h-24 w-24 shrink-0 overflow-hidden rounded-lg border-[2.5px] border-[#C9A84A]/80 bg-[#FFFCF7] p-2 shadow-[0_8px_28px_rgba(201,168,74,0.24),0_4px_16px_rgba(0,0,0,0.38)] sm:mx-0 sm:h-[6.75rem] sm:w-[6.75rem] sm:p-2.5 lg:h-28 lg:w-28";

export const LX_HERO_CHIP =
  "inline-flex max-w-full shrink-0 items-center rounded-md border border-[#C9A84A]/40 bg-[#FFFCF7]/10 px-2.5 py-1 text-[10px] font-semibold leading-tight text-[#FFFCF7] sm:text-[11px]";

export const LX_HUB_CARD =
  "overflow-hidden rounded-xl border-2 border-[#E8D9C4] bg-[#FFFCF7] p-4 shadow-lg sm:rounded-2xl sm:p-6";

/** Wider Contact Hub shell on desktop professional profiles (Gate 15). */
export const LX_HUB_CARD_PRO =
  "overflow-hidden rounded-xl border-2 border-[#E8D9C4] bg-[#FFFCF7] p-5 shadow-xl sm:rounded-2xl sm:p-7 lg:p-8";

export const LX_PRO_SECTION_GAP = "space-y-6 sm:space-y-7 lg:space-y-8";

/** Centered professional profile canvas — premium width without full bleed (Gate 15). */
export const LX_PRO_MAIN_MAX = "mx-auto w-full max-w-[1440px]";

export const LX_PRO_INNER_PAD = "px-4 py-5 sm:px-8 sm:py-8 lg:px-10 lg:py-10";

/** Two-column profile grid: wider main + substantial Contact Hub sidebar. */
export const LX_PRO_GRID =
  "grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-[minmax(0,1.12fr)_min(100%,420px)] xl:grid-cols-[minmax(0,1.18fr)_min(100%,460px)] lg:gap-10 xl:gap-12";

export const LX_PRO_ASIDE =
  "hidden min-w-0 lg:block lg:sticky lg:top-6 lg:z-10 lg:w-full lg:max-w-[460px] lg:justify-self-end lg:self-start";

export const LX_CTA_HUB_SECONDARY =
  "inline-flex min-h-[48px] w-full flex-col items-center justify-center gap-1 rounded-lg border-2 border-[#D4C4A8] bg-[#FFFCF7] px-3 py-2.5 text-center text-xs font-bold text-[#1E1814] shadow-sm transition hover:border-[#C9A84A] hover:bg-[#FFFDF9] active:scale-[0.99] sm:text-sm";

export const LX_CTA_PRIMARY_LG =
  "sm:min-h-[48px] sm:px-5 sm:py-3 sm:text-base";

/** Standard cover-hero business name (serif on photo overlay). */
export const LX_STANDARD_HERO_TITLE = `${LX_TYPE_SERIF_DISPLAY} text-balance text-2xl leading-tight text-white drop-shadow-md sm:text-3xl md:text-4xl lg:text-5xl`;

/** Leonix text link accent (e.g. back to results) — burgundy, not discovery blue. */
export const LX_LINK_ACCENT = "text-sm font-bold text-[#7A1E2C] underline-offset-4 hover:underline";

/** Discovery / horizontal card CTAs (sharper radius, shared both pipelines). */
export const LX_CTA_CARD_PRIMARY = `${LX_CTA_PRIMARY} min-h-[42px] w-full rounded-lg px-4 py-2.5 text-sm sm:min-h-[44px]`;

export const LX_CTA_CARD_SECONDARY = `${LX_CTA_SECONDARY} min-h-[38px] flex-1 min-w-[6.75rem] rounded-lg px-2.5 py-2 text-xs sm:flex-none sm:min-h-[40px] sm:px-3 sm:text-sm`;

export const LX_CTA_CARD_WHATSAPP = `${LX_CTA_WHATSAPP} min-h-[38px] flex-1 min-w-[6.75rem] rounded-lg px-2.5 py-2 text-xs sm:flex-none sm:min-h-[40px] sm:px-3 sm:text-sm`;

/** Inline CTA row (listing card footer). */
export const LX_CTA_INLINE_PRIMARY = `${LX_CTA_PRIMARY} inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm`;

export const LX_CTA_INLINE_SECONDARY = `${LX_CTA_SECONDARY} inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm`;

export const LX_CTA_INLINE_WHATSAPP = `${LX_CTA_WHATSAPP} inline-flex min-h-[42px] items-center gap-2 rounded-lg px-4 py-2.5 text-sm`;

/** Standard hero logo frame on dark cover. */
export const LX_STANDARD_HERO_LOGO_WRAP =
  "rounded-xl border-2 border-[#C9A84A]/75 bg-[#FFFCF7]/95 p-2 shadow-[0_8px_32px_rgba(0,0,0,0.35)] sm:rounded-2xl sm:p-2.5";

export const LX_STANDARD_HERO_CHIP =
  "inline-flex max-w-[10.5rem] shrink-0 items-center rounded-md border border-[#C9A84A]/45 bg-black/35 px-2 py-0.5 text-[10px] font-semibold leading-tight text-[#FFFCF7] backdrop-blur-sm sm:max-w-[12rem] sm:px-2.5 sm:py-1 sm:text-xs";

export function cleanProfessionalChipLabel(raw: string): string {
  const t = String(raw ?? "").trim();
  if (!t) return "";
  const lower = t.toLowerCase();
  if (lower === "otro" || lower === "other") return "";
  if (lower.startsWith("otro:") || lower.startsWith("other:")) {
    return t.split(":").slice(1).join(":").trim();
  }
  return t;
}

const WEAK_CHIPS = new Set([
  "innovacion constante",
  "innovación constante",
  "constant innovation",
  "etiqueta breve",
  "brief tag",
  "short label",
]);

export function isWeakProfessionalChipLabel(label: string): boolean {
  const low = label.trim().toLowerCase();
  return !low || WEAK_CHIPS.has(low);
}

export function getTrustSectionHeading(template: ServiciosListingTemplate, lang: ServiciosLang): string {
  if (template === "legal_provider") {
    return lang === "en" ? "Trust for your legal case" : "Confianza para tu caso legal";
  }
  if (template === "clinic_provider") {
    return lang === "en" ? "Professional care you can trust" : "Atención profesional para tu salud";
  }
  if (template === "financial_provider") {
    return lang === "en" ? "Clear help for taxes & finances" : "Ayuda clara para tus impuestos y finanzas";
  }
  if (template === "advisor_provider") {
    return lang === "en" ? "Reliable advice for your business" : "Asesoría confiable para tu negocio";
  }
  return lang === "en" ? "Why choose us" : "¿Por qué elegirnos?";
}

export function getTrustSectionKicker(template: ServiciosListingTemplate, lang: ServiciosLang): string {
  if (template === "legal_provider") {
    return lang === "en" ? "Why clients work with us" : "Por qué nos eligen";
  }
  return lang === "en" ? "Trust & credentials" : "Confianza y credenciales";
}

const GENERIC_QUOTE_CTA_LABELS = new Set([
  "pedir cotización",
  "pedir cotizacion",
  "solicitar cotización",
  "solicitar cotizacion",
  "request quote",
  "request a quote",
  "pedir presupuesto",
]);

/** Hub/sidebar primary quote action — professional templates (Gate 13B legal copy). */
export function getHubQuoteCtaLabel(template: ServiciosListingTemplate, lang: ServiciosLang): string {
  if (template === "legal_provider") {
    return lang === "en" ? "Request Consultation" : "Solicitar consulta";
  }
  if (template === "clinic_provider") {
    return lang === "en" ? "Request Appointment" : "Solicitar cita";
  }
  if (template === "financial_provider") {
    return lang === "en" ? "Request Help" : "Solicitar ayuda";
  }
  if (template === "advisor_provider") {
    return lang === "en" ? "Schedule Consultation" : "Agendar consulta";
  }
  return lang === "en" ? "Contact" : "Contactar";
}

export function resolveProfessionalHubQuoteCtaLabel(
  stored: string | undefined,
  template: ServiciosListingTemplate | undefined,
  lang: ServiciosLang,
  fallback: string,
): string {
  const trimmed = stored?.trim();
  if (template) {
    if (!trimmed || GENERIC_QUOTE_CTA_LABELS.has(trimmed.toLowerCase())) {
      return getHubQuoteCtaLabel(template, lang);
    }
    return trimmed;
  }
  return trimmed || fallback;
}

export function getPrimaryCtaLabel(template: ServiciosListingTemplate, lang: ServiciosLang): string {
  if (template === "legal_provider") {
    return lang === "en" ? "Call for Consultation" : "Llamar para consulta";
  }
  if (template === "clinic_provider") {
    return lang === "en" ? "Request Appointment" : "Solicitar cita";
  }
  if (template === "financial_provider") {
    return lang === "en" ? "Request Help" : "Solicitar ayuda";
  }
  if (template === "advisor_provider") {
    return lang === "en" ? "Schedule Consultation" : "Agendar consulta";
  }
  return lang === "en" ? "Contact" : "Contactar";
}

export function getServicesTitle(template: ServiciosListingTemplate, lang: ServiciosLang): string {
  if (template === "legal_provider") {
    return lang === "en" ? "Practice areas" : "Áreas de práctica";
  }
  if (template === "clinic_provider") {
    return lang === "en" ? "Services & care" : "Servicios y atención";
  }
  if (template === "financial_provider") {
    return lang === "en" ? "Tax & accounting" : "Impuestos y contabilidad";
  }
  if (template === "advisor_provider") {
    return lang === "en" ? "Consulting services" : "Servicios de consultoría";
  }
  return lang === "en" ? "Services" : "Servicios";
}

export function collectProfessionalServiceChips(
  profile: {
    services: { title: string }[];
    about?: { specialtiesLine?: string } | null;
  },
  max: number,
): string[] {
  const out: string[] = [];
  const seen = new Set<string>();
  const add = (raw: string) => {
    const c = cleanProfessionalChipLabel(raw);
    if (!c || isWeakProfessionalChipLabel(c)) return;
    const key = c.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    out.push(c);
  };
  for (const s of profile.services) add(s.title);
  const spec = profile.about?.specialtiesLine?.trim();
  if (spec) {
    for (const part of spec.split(/[,;|·]/)) add(part);
  }
  return out.slice(0, max);
}

export function collectHeroTrustChips(
  profile: { quickFacts: { label: string }[] },
  max: number,
): string[] {
  const out: string[] = [];
  for (const f of profile.quickFacts) {
    const c = cleanProfessionalChipLabel(f.label);
    if (!c || isWeakProfessionalChipLabel(c)) continue;
    out.push(c);
    if (out.length >= max) break;
  }
  return out;
}

/** Hero: trust quick-facts first, then service chips — capped (Gate 14). */
export function collectHeroDisplayChips(
  profile: {
    quickFacts: { label: string }[];
    services: { title: string }[];
    about?: { specialtiesLine?: string } | null;
  },
  max = 3,
): string[] {
  const out = collectHeroTrustChips(profile, max);
  if (out.length >= max) return out;
  const seen = new Set(out.map((c) => c.toLowerCase()));
  for (const s of collectProfessionalServiceChips(profile, max)) {
    if (out.length >= max) break;
    const key = s.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

export function hasPhysicalAddress(profile: {
  contact: { physicalAddressDisplay?: string; mapsSearchHref?: string };
}): boolean {
  return Boolean(
    profile.contact.physicalAddressDisplay?.trim() || profile.contact.mapsSearchHref?.trim(),
  );
}
