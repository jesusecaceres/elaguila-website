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

export function hasPhysicalAddress(profile: {
  contact: { physicalAddressDisplay?: string; mapsSearchHref?: string };
}): boolean {
  return Boolean(
    profile.contact.physicalAddressDisplay?.trim() || profile.contact.mapsSearchHref?.trim(),
  );
}
