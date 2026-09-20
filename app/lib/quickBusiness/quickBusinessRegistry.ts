/**
 * Quick Business — ONE registry of category metadata (server-safe: no `app/(site)` imports).
 *
 * Every value is repository truth cited in docs/quick-business/LEONIX_QUICK_BUSINESS_CORE_ARCHITECTURE_MATRIX.md.
 * Pricing here is POSTURE ONLY (`packageKey`); the amount is always resolved from
 * `app/lib/listingPlans/revenuePricingMatrix.ts` at render time. No Quick price is written here.
 *
 * Each posture names its category's SIMPLE package from BUSINESS_CATEGORY_PACKAGE_PAIR
 * (businessAccessLevel.ts). Quick previously named the Full base keys, which would have sold the
 * full product to a Quick customer.
 */

import type { QuickClassifiedMediaContract } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import type { QuickBusinessCategoryKey, QuickBusinessDefinition } from "./quickBusinessTypes";
import { QUICK_BUSINESS_CATEGORY_KEYS } from "./quickBusinessTypes";

/**
 * SIMPLE media contract. `maxImages` always restates the category's canonical lane cap from
 * LANE_MEDIA_REGISTRY (app/lib/media/listingMediaConfigs.ts), never a Quick-only number — the same
 * documented-literal + mechanical-drift-assertion convention that registry uses for itself and
 * that Quick Classifieds uses for every one of its lanes. `null` therefore means "the canonical
 * lane enforces no count cap", not "Quick chose unlimited".
 *
 * Quick is stricter than canonical in exactly one direction, the Media Lock: `minImages: 1`, so a
 * Quick ad can never publish without one real photo even where the canonical lane allows zero.
 * Drift in either direction is caught by verify-quick-business-access-level-01.ts.
 */
// Bible §11.1: Quick Business max 3 real images, no video. Canonical lane caps are higher but
// do not apply to the $249 Quick product. The Full lane retains its own unchanged limits.
function media(note: { es: string; en: string }): QuickClassifiedMediaContract {
  return { minImages: 1, maxImages: 3, videoOptional: false, note };
}

export const QUICK_BUSINESS_DEFINITIONS: Record<QuickBusinessCategoryKey, QuickBusinessDefinition> = {
  servicios: {
    key: "servicios",
    status: "live",
    emoji: "🛠️",
    label: { es: "Servicios", en: "Services" },
    tagline: { es: "Mecánicos, limpieza, contratistas, belleza, salud, asesorías y más.", en: "Mechanics, cleaning, contractors, beauty, health, consulting and more." },
    standardApplicationPath: "/publicar/servicios",
    // Quick commercial package (revenuePricingMatrix.ts: servicios_quick_monthly, SIMPLE access;
    // amount read at render time). servicios_base_monthly is the upgrade target, never the Quick sale.
    pricing: { kind: "monthly", packageKey: "servicios_quick_monthly", category: "servicios" },
    // Bible §11.1: Quick cap is 3 images (canonical lane allows 24 for Full, not overridden here).
    media: media({ es: "Hasta 3 fotos reales de tu negocio o tu trabajo. La primera será la portada.", en: "Up to 3 real photos of your business or your work. The first one is the cover." }),
    mediaIntro: {
      es: "Se necesita al menos una foto real de tu negocio (fachada, equipo o trabajo). La primera será la portada.",
      en: "At least one real photo of your business is required (storefront, team or work). The first one is the cover.",
    },
    manage: {
      dashboardHref: "/dashboard/servicios",
      editNote: { es: "Editas tu perfil desde Mis Servicios (abre la aplicación existente con tus datos).", en: "Edit your profile from My Services (opens the existing application with your data)." },
      endNote: { es: "Pausar / reactivar desde Mis Servicios.", en: "Pause / resume from My Services." },
      billingNote: { es: "Suscripción mensual; se administra desde tu panel.", en: "Monthly subscription; managed from your dashboard." },
    },
    staff: {
      // Existing verified server path: api/clasificados/servicios/publish assistedAction save_for_client / publish_for_client.
      publishForClientSupported: true,
      note: { es: "Leonix puede guardar o publicar por el cliente con el flujo existente “Crear para el cliente”.", en: "Leonix can save or publish for the client through the existing “Create for Client” flow." },
    },
    essentialQuestionCount: 12,
  },
  restaurantes: {
    key: "restaurantes",
    status: "live",
    emoji: "🍽️",
    label: { es: "Restaurantes", en: "Restaurants" },
    tagline: { es: "Restaurante, café, panadería, food truck o catering.", en: "Restaurant, café, bakery, food truck or catering." },
    standardApplicationPath: "/publicar/restaurantes",
    // Quick commercial package (restaurantes_quick_monthly, SIMPLE access).
    pricing: { kind: "monthly", packageKey: "restaurantes_quick_monthly", category: "restaurantes" },
    // Bible §11.1: Quick cap is 3 images (canonical lane allows 24 for Full, not overridden here).
    media: media({ es: "Hasta 3 fotos reales: fachada, platillos o interior. La primera será la portada.", en: "Up to 3 real photos: storefront, dishes or interior. The first one is the cover." }),
    mediaIntro: {
      es: "Se necesita al menos una foto real de tu restaurante (fachada, platillos o interior). La primera será la portada.",
      en: "At least one real photo of your restaurant is required (storefront, dishes or interior). The first one is the cover.",
    },
    manage: {
      dashboardHref: "/dashboard/restaurantes",
      editNote: { es: "Editas tu ficha desde Mis Restaurantes (abre la aplicación existente con tus datos).", en: "Edit your listing from My Restaurants (opens the existing application with your data)." },
      endNote: { es: "Pausar / reactivar desde Mis Restaurantes.", en: "Pause / resume from My Restaurants." },
      billingNote: { es: "Suscripción mensual; se administra desde tu panel.", en: "Monthly subscription; managed from your dashboard." },
    },
    staff: {
      publishForClientSupported: false,
      note: { es: "El cliente inicia sesión con su correo y publica a su nombre.", en: "The customer signs in with their email and publishes in their own name." },
    },
    essentialQuestionCount: 11,
  },
  "autos-dealer": {
    key: "autos-dealer",
    // Closeout (PM decision): the canonical Dealer product is vehicle-first, so Quick asks for the dealer identity
    // PLUS the customer's FIRST REAL vehicle (minimum canonical data + real vehicle photo). Nothing is fabricated.
    status: "live",
    emoji: "🚗",
    label: { es: "Autos (concesionario)", en: "Autos (dealer)" },
    tagline: { es: "Tu negocio + tu primer vehículo", en: "Your dealership + your first vehicle" },
    standardApplicationPath: "/publicar/autos/negocios",
    // Quick commercial package (autos_dealer_quick_monthly, SIMPLE access): one active vehicle,
    // no inventory pack — Simple never inherits the Full package's larger allowance.
    pricing: { kind: "monthly", packageKey: "autos_dealer_quick_monthly", category: "autos" },
    // Bible §11.1: Quick cap is 3 vehicle images regardless of the uncapped canonical dealer lane.
    media: media({ es: "Hasta 3 fotos reales de tu primer vehículo. La primera será la portada del vehículo.", en: "Up to 3 real photos of your first vehicle. The first one is the vehicle cover." }),
    mediaIntro: {
      es: "Se necesita al menos una foto real del vehículo que publicas (no del negocio). La primera será la portada del vehículo.",
      en: "At least one real photo of the vehicle you are listing is required (not of the business). The first one is the vehicle cover.",
    },
    manage: {
      dashboardHref: "/dashboard/mis-anuncios?cat=autos",
      editNote: { es: "Inventario y perfil desde Mis Anuncios (abre la aplicación de dealer existente con tus datos).", en: "Inventory and profile from My Ads (opens the existing dealer application with your data)." },
      endNote: { es: "Retirar / restaurar vehículos desde Mis Anuncios.", en: "Unpublish / restore vehicles from My Ads." },
      billingNote: { es: "Suscripción mensual + paquete de inventario opcional.", en: "Monthly subscription + optional inventory pack." },
    },
    staff: { publishForClientSupported: false, note: { es: "El cliente inicia sesión con su correo y publica a su nombre.", en: "The customer signs in with their email and publishes in their own name." } },
    essentialQuestionCount: 16,
  },
  "bienes-negocio": {
    key: "bienes-negocio",
    // Closeout (PM decision): the canonical agent product is property-first, so Quick asks for the professional
    // identity PLUS the customer's FIRST REAL property (minimum canonical data + real property photo).
    status: "live",
    emoji: "🏢",
    label: { es: "Bienes Raíces (agente / negocio)", en: "Real Estate (agent / business)" },
    tagline: { es: "Tu perfil + tu primera propiedad", en: "Your profile + your first property" },
    standardApplicationPath: "/publicar/bienes-raices",
    // Quick commercial package (br_agent_quick_monthly, SIMPLE access): one active property,
    // no inventory pack.
    pricing: { kind: "monthly", packageKey: "br_agent_quick_monthly", category: "bienes-raices" },
    // Bible §11.1: Quick cap is 3 property images (canonical lane allows 40 for Full, not overridden here).
    media: media({ es: "Hasta 3 fotos reales de tu primera propiedad. La primera será la portada de la propiedad.", en: "Up to 3 real photos of your first property. The first one is the property cover." }),
    mediaIntro: {
      es: "Se necesita al menos una foto real de la propiedad que publicas (no de tu oficina). La primera será la portada de la propiedad.",
      en: "At least one real photo of the property you are listing is required (not of your office). The first one is the property cover.",
    },
    manage: {
      dashboardHref: "/dashboard/mis-anuncios?cat=bienes-raices",
      editNote: { es: "Propiedades y perfil desde Mis Anuncios (abre la aplicación de agente existente con tus datos).", en: "Properties and profile from My Ads (opens the existing agent application with your data)." },
      endNote: { es: "Pausar / reactivar propiedades desde Mis Anuncios.", en: "Pause / resume properties from My Ads." },
      billingNote: { es: "Suscripción mensual + paquete de inventario opcional.", en: "Monthly subscription + optional inventory pack." },
    },
    staff: { publishForClientSupported: false, note: { es: "El cliente inicia sesión con su correo y publica a su nombre.", en: "The customer signs in with their email and publishes in their own name." } },
    essentialQuestionCount: 19,
  },
};

/** Owner priority order (PM: Servicios → Restaurantes → Autos Dealer → Bienes Raíces). */
export const QUICK_BUSINESS_ORDER: readonly QuickBusinessCategoryKey[] = ["servicios", "restaurantes", "autos-dealer", "bienes-negocio"];

export function getQuickBusinessDefinition(key: QuickBusinessCategoryKey): QuickBusinessDefinition {
  return QUICK_BUSINESS_DEFINITIONS[key];
}

export function listQuickBusinessDefinitions(): QuickBusinessDefinition[] {
  return QUICK_BUSINESS_ORDER.map((k) => QUICK_BUSINESS_DEFINITIONS[k]);
}

export function listLiveQuickBusinessKeys(): QuickBusinessCategoryKey[] {
  return QUICK_BUSINESS_ORDER.filter((k) => QUICK_BUSINESS_DEFINITIONS[k].status === "live");
}

export function quickBusinessRegistryIsComplete(): boolean {
  const declared = new Set<string>(QUICK_BUSINESS_CATEGORY_KEYS);
  const defined = new Set<string>(Object.keys(QUICK_BUSINESS_DEFINITIONS));
  if (declared.size !== defined.size) return false;
  for (const k of declared) if (!defined.has(k)) return false;
  return QUICK_BUSINESS_ORDER.length === declared.size;
}
