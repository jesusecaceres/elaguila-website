/**
 * LEONIX QUICK — remaining lower-priority families (Comida Local, Ofertas Locales, Negocios Locales,
 * Viajes, Iglesias, Recursos). Server-safe: no `app/(site)` imports, so the staff launchpad and future
 * server pages can read it. A DELIBERATELY thin, additive registry — it does NOT extend, widen, or import
 * from the certified Quick Classifieds (`app/lib/quickClassifieds`) or Quick Business Core
 * (`app/lib/quickBusiness`) registries, whose own verifiers lock exact category counts.
 *
 * Every entry records the TECHNICALLY CORRECT action for that family's REAL current product (cold-mapped
 * in docs/quick-remaining/LEONIX_QUICK_REMAINING_FAMILIES_ARCHITECTURE_MATRIX.md) — never a forced Quick
 * form where the existing destination is already the right (or only) door:
 *
 * - `quick_form`   — a genuinely NEW, minimum-truthful Quick intake exists (Comida Local only), feeding
 *                    the EXISTING canonical draft/validator/preview/payment/public output unmodified.
 * - `direct_link`  — the EXISTING canonical application/submission entry is the correct destination.
 *                    Long, short, paid, free, moderated — whatever it truthfully is; Quick does not
 *                    wrap it. `href` is the exact existing route.
 * - `content_link` — not a create/submit product at all (pure discovery directory or editorial content).
 *                    The correct staff action is to open the page and copy/share its URL.
 */

export type QuickRemainingActionKind = "quick_form" | "direct_link" | "content_link";

export type QuickRemainingText = { es: string; en: string };

export type QuickRemainingPricingPosture = { kind: "monthly"; packageKey: string; category: string } | null;

export type QuickRemainingDefinition = {
  key: string;
  emoji: string;
  label: QuickRemainingText;
  tagline: QuickRemainingText;
  action: QuickRemainingActionKind;
  /** Existing route Quick hands off to (quick_form's own route, or the existing canonical entry). */
  href: string;
  /** Rough "≈ N preguntas" — only set for `quick_form` (the one category Quick actually shortens). */
  essentialQuestionCount?: number;
  pricing: QuickRemainingPricingPosture;
  /** Existing owner-management destination, or null when there is genuinely none (content-only families). */
  manageHref: string | null;
  /** One honest line explaining WHY this is the action (long form, moderation queue, directory, free, etc.). */
  note: QuickRemainingText;
};

export const QUICK_REMAINING_ORDER: readonly string[] = [
  "comida-local",
  "ofertas-locales",
  "negocios-locales",
  "viajes",
  "iglesias",
  "recursos",
];

export const QUICK_REMAINING_DEFINITIONS: Record<string, QuickRemainingDefinition> = {
  "comida-local": {
    key: "comida-local",
    emoji: "🌮",
    label: { es: "Comida Local", en: "Local Food" },
    tagline: { es: "Tu negocio + un plato real que vendes", en: "Your business + one real dish you sell" },
    action: "quick_form",
    href: "/publicar/comida-local/rapido",
    essentialQuestionCount: 7,
    // Existing base package (revenuePricingMatrix.ts: comida_local_base_monthly, monthly subscription; amount read at render time).
    pricing: { kind: "monthly", packageKey: "comida_local_base_monthly", category: "comida-local" },
    manageHref: "/dashboard/mis-anuncios?cat=comida-local",
    note: {
      es: "Perfil de comida local en minutos; extras (horario, redes, más fotos) se agregan después desde el panel.",
      en: "Local food profile in minutes; extras (hours, socials, more photos) are added later from the dashboard.",
    },
  },
  "ofertas-locales": {
    key: "ofertas-locales",
    emoji: "🏷️",
    label: { es: "Ofertas Locales", en: "Local Offers" },
    tagline: { es: "Volante interactivo o cupón — el cliente elige", en: "Interactive flyer or coupon — the customer chooses" },
    action: "direct_link",
    href: "/publicar/ofertas-locales",
    pricing: null,
    manageHref: "/dashboard/ofertas-locales",
    note: {
      es: "El volante usa revisión con IA (no se puede acortar); el cupón corre en el mismo formulario. Usa la aplicación existente.",
      en: "The flyer uses AI review (cannot be shortened); the coupon runs in the same form. Use the existing application.",
    },
  },
  "negocios-locales": {
    key: "negocios-locales",
    emoji: "🏘️",
    label: { es: "Negocios Locales", en: "Local Businesses" },
    tagline: { es: "Directorio de negocios por sector", en: "Business directory by sector" },
    action: "content_link",
    href: "/negocios-locales",
    pricing: null,
    manageHref: null,
    note: {
      es: "Directorio de descubrimiento, no un producto propio. Cada sector ya enlaza a su propia aplicación existente.",
      en: "A discovery directory, not its own product. Each sector already links to its own existing application.",
    },
  },
  viajes: {
    key: "viajes",
    emoji: "✈️",
    label: { es: "Viajes", en: "Travel" },
    tagline: { es: "Agencia de viajes o viaje en cola de revisión", en: "Travel agency or trip, pending review" },
    action: "direct_link",
    href: "/publicar/viajes",
    pricing: null,
    manageHref: "/dashboard/viajes",
    note: {
      es: "Sin pago en línea hoy — el envío entra a revisión del equipo Leonix. Usa la aplicación existente.",
      en: "No online payment today — submissions go to Leonix team review. Use the existing application.",
    },
  },
  iglesias: {
    key: "iglesias",
    emoji: "⛪",
    label: { es: "Iglesias", en: "Churches" },
    tagline: { es: "Directorio de iglesias, gratis", en: "Church directory, free" },
    action: "direct_link",
    href: "/iglesias/registrar",
    pricing: null,
    manageHref: null,
    note: {
      es: "Gratis; el equipo Leonix revisa cada registro. Usa el formulario existente.",
      en: "Free; the Leonix team reviews every submission. Use the existing form.",
    },
  },
  recursos: {
    key: "recursos",
    emoji: "📚",
    label: { es: "Recursos Comunitarios", en: "Community Resources" },
    tagline: { es: "Directorio editorial del equipo Leonix", en: "Leonix team editorial directory" },
    action: "content_link",
    href: "/recursos-comunitarios",
    pricing: null,
    manageHref: null,
    note: {
      es: "No hay publicación pública — es contenido editorial. Abre el directorio y comparte el enlace.",
      en: "No public submission — this is editorial content. Open the directory and share the link.",
    },
  },
};

export function getQuickRemainingDefinition(key: string): QuickRemainingDefinition | null {
  return QUICK_REMAINING_DEFINITIONS[key] ?? null;
}

export function listQuickRemainingDefinitions(): QuickRemainingDefinition[] {
  return QUICK_REMAINING_ORDER.map((k) => QUICK_REMAINING_DEFINITIONS[k]!);
}

export function quickRemainingRegistryIsComplete(): boolean {
  const declared = new Set(QUICK_REMAINING_ORDER);
  const defined = new Set(Object.keys(QUICK_REMAINING_DEFINITIONS));
  if (declared.size !== defined.size) return false;
  for (const k of declared) if (!defined.has(k)) return false;
  return true;
}
