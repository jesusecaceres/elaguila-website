import { enVentaPublicLabel } from "../shared/constants/enVentaPublicLabels";

/** Seller-facing copy when a listing is hidden pending policy review (no email unless wired). */
export function enVentaSellerHiddenNotice(lang: "es" | "en"): string {
  const cat = enVentaPublicLabel(lang);
  return lang === "es"
    ? `Tu anuncio fue ocultado temporalmente porque puede no cumplir con las reglas de ${cat} y nuestra política familiar. Si crees que fue un error, puedes solicitar una revisión.`
    : `Your listing was temporarily hidden because it may not meet ${cat} rules and our family-safe policy. If you believe this was a mistake, you can request a review.`;
}

export const EN_VENTA_PLATFORM_RESPONSIBILITY = {
  es: "Leonix ofrece una plataforma de anuncios locales. Compradores y vendedores son responsables de verificar artículos, pagos, entrega y acuerdos.",
  en: "Leonix provides a local listing platform. Buyers and sellers are responsible for verifying items, payments, delivery, and agreements.",
} as const;

export const EN_VENTA_REPORT_DISCLAIMER = {
  es: "Leonix revisa reportes para mantener una comunidad segura, pero no participa en la venta, pago, entrega, garantía ni acuerdos entre comprador y vendedor.",
  en: "Leonix reviews reports to help keep the community safe, but Leonix is not a party to the sale, payment, delivery, warranty, or agreements between buyers and sellers.",
} as const;

export const EN_VENTA_REFRESH_HELPER = {
  es: "Vuelve a subir tu anuncio entre los listados recientes.",
  en: "Move your listing back among recent listings.",
} as const;

export type EnVentaReportReasonCode =
  | "policy"
  | "offensive"
  | "prohibited"
  | "scam"
  | "misleading"
  | "wrong_category"
  | "sold_unavailable"
  | "other";

export const EN_VENTA_REPORT_REASONS: Array<{
  code: EnVentaReportReasonCode;
  label: { es: string; en: string };
  highSeverity?: boolean;
}> = [
  { code: "policy", label: { es: "Va contra las reglas", en: "Against policy" } },
  { code: "offensive", label: { es: "Contenido ofensivo", en: "Offensive content" }, highSeverity: true },
  { code: "prohibited", label: { es: "Artículo prohibido", en: "Prohibited item" }, highSeverity: true },
  { code: "scam", label: { es: "Posible estafa", en: "Possible scam" }, highSeverity: true },
  { code: "misleading", label: { es: "Información falsa o engañosa", en: "False or misleading" } },
  { code: "wrong_category", label: { es: "Categoría incorrecta", en: "Wrong category" } },
  { code: "sold_unavailable", label: { es: "Ya vendido / no disponible", en: "Sold / unavailable" } },
  { code: "other", label: { es: "Otro", en: "Other" } },
];

export function enVentaReportReasonLabel(code: EnVentaReportReasonCode, lang: "es" | "en"): string {
  return EN_VENTA_REPORT_REASONS.find((r) => r.code === code)?.label[lang] ?? code;
}

export function formatEnVentaReportReasonForStorage(code: EnVentaReportReasonCode, details: string, lang: "es" | "en"): string {
  const label = enVentaReportReasonLabel(code, lang);
  const extra = details.trim();
  return extra ? `[${code}] ${label} — ${extra}` : `[${code}] ${label}`;
}

export function isHighSeverityEnVentaReport(code: EnVentaReportReasonCode): boolean {
  return EN_VENTA_REPORT_REASONS.some((r) => r.code === code && r.highSeverity);
}
