/**
 * Centralized ES/EN copy for the SIMPLE vs FULL business products and the upgrade path.
 *
 * Two rules this module exists to enforce:
 *
 *   1. NO PRICES. Not one amount appears here. Every surface renders the amount from
 *      `getRevenuePackagePriceCents` against the package key, so the pricing matrix stays the
 *      only place a price is written and copy can never drift from what Stripe charges.
 *
 *   2. SIMPLE IS SOLD POSITIVELY. Simple is a real product for a small business that wants to be
 *      found and called, not a crippled Full. Nothing here promises analytics or a Business Hub
 *      at the Simple level, because the server gate would refuse it and the customer would have
 *      been sold something they cannot use.
 */

export type BusinessAccessCopyLang = "es" | "en";

type Bilingual = { es: string; en: string };

function pick(value: Bilingual, lang: BusinessAccessCopyLang): string {
  return lang === "en" ? value.en : value.es;
}

const SIMPLE_HEADLINE: Bilingual = {
  es: "Tu negocio visible. Tus contactos directos. Sin complicaciones.",
  en: "Your business visible. Your contacts direct. No complications.",
};

const FULL_HEADLINE: Bilingual = {
  es: "Tu presencia completa de negocio en Leonix.",
  en: "Your complete business presence on Leonix.",
};

const SIMPLE_BODY: Bilingual = {
  es: "Tu ficha pública, tus fotos reales y los botones para que te llamen, te escriban o lleguen a tu puerta. Tú la administras en minutos desde tu teléfono.",
  en: "Your public listing, your real photos and the buttons that let customers call you, message you or find your door. You manage it in minutes from your phone.",
};

const FULL_BODY: Bilingual = {
  es: "Todo lo de Simple, más tu perfil completo de negocio, tus herramientas y la información de rendimiento de tu anuncio.",
  en: "Everything in Simple, plus your full business profile, your tools and the performance information for your listing.",
};

/** Simple's included list. Every line here is a capability the server actually grants at SIMPLE. */
const SIMPLE_INCLUDES: Bilingual[] = [
  { es: "Tu ficha pública en Leonix", en: "Your public listing on Leonix" },
  { es: "Fotos reales de tu negocio", en: "Real photos of your business" },
  { es: "Botones de llamada, mensaje y correo", en: "Call, message and email buttons" },
  { es: "Tu sitio web y cómo llegar", en: "Your website and directions" },
  { es: "Editar, pausar o terminar cuando quieras", en: "Edit, pause or end whenever you want" },
  { es: "Ayuda de una persona real", en: "Help from a real person" },
];

/** What FULL adds. Phrased as additions so Simple never reads as a list of missing things. */
const FULL_ADDS: Bilingual[] = [
  { es: "Tu perfil completo de negocio", en: "Your complete business profile" },
  { es: "Información de rendimiento de tu anuncio", en: "Performance information for your listing" },
  { es: "Herramientas de negocio", en: "Business tools" },
  { es: "Más espacio para tu inventario", en: "More room for your inventory" },
];

const UPGRADE_CTA: Bilingual = { es: "Mejorar a Full", en: "Upgrade to Full" };

const UPGRADE_REASSURANCE: Bilingual = {
  es: "Tu anuncio, tus fotos y tu dirección web siguen siendo los mismos. Solo se abre lo demás.",
  en: "Your listing, your photos and your web address stay the same. Everything else simply opens up.",
};

/**
 * Where the upgrade actually happens. Named explicitly because the upgrade is deliberately NOT a
 * fresh application: reopening the category's public intake would start a second listing, and the
 * whole contract is that the customer keeps the one they have. The identity-preserving route is
 * the owner dashboard, where editing reopens the existing application against the existing
 * listing id and its preview leads to the Full checkout for that same id.
 */
const UPGRADE_WHERE: Bilingual = {
  es: "Se hace desde tu panel, con el mismo anuncio que ya tienes. No vuelvas a empezar uno nuevo.",
  en: "You do it from your dashboard, with the listing you already have. Don't start a new one.",
};

const UPGRADE_LOCKED_FEATURE: Bilingual = {
  es: "Esta sección es parte de Full. Mejora tu plan y se abre al instante, sin volver a crear tu anuncio.",
  en: "This section is part of Full. Upgrade your plan and it opens right away, without recreating your listing.",
};

/** Print bundles. Print placement and digital access are sold as two truths in one sentence. */
const PRINT_QUARTER: Bilingual = {
  es: "Tu anuncio impreso + presencia digital Simple incluida.",
  en: "Your print ad + Simple digital presence included.",
};

const PRINT_FULL_TIERS: Bilingual = {
  es: "Tu anuncio impreso + presencia completa de negocio incluida.",
  en: "Your print ad + complete business presence included.",
};

export type BusinessAccessCopyKey =
  | "simpleName"
  | "fullName"
  | "simpleHeadline"
  | "fullHeadline"
  | "simpleBody"
  | "fullBody"
  | "upgradeCta"
  | "upgradeReassurance"
  | "upgradeWhere"
  | "upgradeLockedFeature"
  | "printQuarterBundle"
  | "printFullBundle";

const COPY: Record<BusinessAccessCopyKey, Bilingual> = {
  simpleName: { es: "Simple", en: "Simple" },
  fullName: { es: "Full", en: "Full" },
  simpleHeadline: SIMPLE_HEADLINE,
  fullHeadline: FULL_HEADLINE,
  simpleBody: SIMPLE_BODY,
  fullBody: FULL_BODY,
  upgradeCta: UPGRADE_CTA,
  upgradeReassurance: UPGRADE_REASSURANCE,
  upgradeWhere: UPGRADE_WHERE,
  upgradeLockedFeature: UPGRADE_LOCKED_FEATURE,
  printQuarterBundle: PRINT_QUARTER,
  printFullBundle: PRINT_FULL_TIERS,
};

export function businessAccessCopy(
  key: BusinessAccessCopyKey,
  lang: BusinessAccessCopyLang,
): string {
  return pick(COPY[key], lang);
}

export function simpleIncludesList(lang: BusinessAccessCopyLang): string[] {
  return SIMPLE_INCLUDES.map((item) => pick(item, lang));
}

export function fullAddsList(lang: BusinessAccessCopyLang): string[] {
  return FULL_ADDS.map((item) => pick(item, lang));
}

/**
 * The bundle sentence for a print tier. Mirrors the owner's commercial lock exactly: quarter
 * page bundles Simple, the larger tiers bundle Full. Returns null for print tiers that are not
 * business bundles, so a caller cannot accidentally promise digital access that does not exist.
 */
export function printBundleCopy(
  printTier: string | null | undefined,
  lang: BusinessAccessCopyLang,
): string | null {
  const tier = String(printTier ?? "").trim().toLowerCase();
  if (tier === "quarter_page") return businessAccessCopy("printQuarterBundle", lang);
  if (tier === "half_page" || tier === "full_page" || tier === "premium") {
    return businessAccessCopy("printFullBundle", lang);
  }
  return null;
}
