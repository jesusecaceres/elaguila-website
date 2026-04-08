import type { CuponCardPayload, CuponesPagePayload } from "./payloadTypes";

const DEFAULT_COUPONS: CuponCardPayload[] = [
  {
    titleEs: "10% de Descuento en Detallado Completo",
    titleEn: "10% Off Complete Detail",
    businessEs: "Bay Area Detailing",
    businessEn: "Bay Area Detailing",
    descriptionEs: "Detalle exterior + interior. Solo nuevos clientes.",
    descriptionEn: "Full exterior + interior detail. New customers only.",
    image: "/coupons/detailing.jpg",
    expiresEs: "15/02/2026",
    expiresEn: "02/15/2026",
  },
  {
    titleEs: "Compra 1 y Llévate 1 Gratis (Smoothie)",
    titleEn: "Buy 1 Get 1 Free Smoothie",
    businessEs: "Jungle Smoothies",
    businessEn: "Jungle Smoothies",
    descriptionEs: "Cualquier sabor. Límite 1 por cliente.",
    descriptionEn: "Any flavor. Limit 1 per customer.",
    image: "/coupons/smoothie.jpg",
    expiresEs: "01/03/2026",
    expiresEn: "03/01/2026",
  },
  {
    titleEs: "$5 de Descuento en Cualquier Servicio",
    titleEn: "$5 Off Any Service",
    businessEs: "War Fitness",
    businessEn: "War Fitness",
    descriptionEs: "Válido para nuevos miembros. Presenta el cupón.",
    descriptionEn: "Valid for new members. Show coupon at front desk.",
    image: "/coupons/war-fitness.jpg",
    expiresEs: "20/02/2026",
    expiresEn: "02/20/2026",
  },
];

const BASE_TITLES = {
  es: "Cupones",
  en: "Coupons",
} as const;

const BASE_INTRO = {
  es: "Ofertas locales con estilo Leonix — claras, cálidas y fáciles de leer.",
  en: "Local offers with Leonix clarity — warm, readable, and trustworthy.",
} as const;

export type CuponesMerged = {
  titleEs: string;
  titleEn: string;
  introEs: string;
  introEn: string;
  coupons: CuponCardPayload[];
};

function sanitizeCoupons(raw: unknown): CuponCardPayload[] | null {
  if (!Array.isArray(raw) || raw.length === 0) return null;
  const out: CuponCardPayload[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    const c: CuponCardPayload = {
      titleEs: String(o.titleEs ?? "").trim(),
      titleEn: String(o.titleEn ?? "").trim(),
      businessEs: String(o.businessEs ?? "").trim(),
      businessEn: String(o.businessEn ?? "").trim(),
      descriptionEs: String(o.descriptionEs ?? "").trim(),
      descriptionEn: String(o.descriptionEn ?? "").trim(),
      image: String(o.image ?? "").trim() || "/coupons/detailing.jpg",
      expiresEs: String(o.expiresEs ?? "").trim(),
      expiresEn: String(o.expiresEn ?? "").trim(),
    };
    if (!c.titleEs && !c.titleEn) continue;
    out.push(c);
  }
  return out.length ? out : null;
}

export function mergeCuponesPagePayload(patch: Record<string, unknown>): CuponesMerged {
  const p = patch as unknown as CuponesPagePayload;
  const fromDb = sanitizeCoupons(p.coupons);
  return {
    titleEs: p.pageTitle?.es?.trim() || BASE_TITLES.es,
    titleEn: p.pageTitle?.en?.trim() || BASE_TITLES.en,
    introEs: p.intro?.es?.trim() || BASE_INTRO.es,
    introEn: p.intro?.en?.trim() || BASE_INTRO.en,
    coupons: fromDb ?? DEFAULT_COUPONS,
  };
}
