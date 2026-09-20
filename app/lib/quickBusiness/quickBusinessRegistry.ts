/**
 * Quick Business — ONE registry of category metadata (server-safe: no `app/(site)` imports).
 *
 * Every value is repository truth cited in docs/quick-business/LEONIX_QUICK_BUSINESS_CORE_ARCHITECTURE_MATRIX.md.
 * Pricing here is POSTURE ONLY (`packageKey`); the amount is always resolved from
 * `app/lib/listingPlans/revenuePricingMatrix.ts` at render time. No Quick SKU, no Quick price.
 */

import type { QuickClassifiedMediaContract } from "@/app/lib/quickClassifieds/quickClassifiedTypes";
import type { QuickBusinessCategoryKey, QuickBusinessDefinition } from "./quickBusinessTypes";
import { QUICK_BUSINESS_CATEGORY_KEYS } from "./quickBusinessTypes";

function media(maxImages: number | null, note: { es: string; en: string }): QuickClassifiedMediaContract {
  return { minImages: 1, maxImages, videoOptional: true, note };
}

export const QUICK_BUSINESS_DEFINITIONS: Record<QuickBusinessCategoryKey, QuickBusinessDefinition> = {
  servicios: {
    key: "servicios",
    status: "live",
    emoji: "🛠️",
    label: { es: "Servicios", en: "Services" },
    tagline: { es: "Mecánicos, limpieza, contratistas, belleza, salud, asesorías y más.", en: "Mechanics, cleaning, contractors, beauty, health, consulting and more." },
    standardApplicationPath: "/publicar/servicios",
    // Existing base package (revenuePricingMatrix.ts: servicios_base_monthly, monthly subscription; amount read at render time).
    pricing: { kind: "monthly", packageKey: "servicios_base_monthly", category: "servicios" },
    media: media(null, { es: "Sube fotos reales de tu negocio o tu trabajo. La primera será la portada.", en: "Upload real photos of your business or your work. The first one is the cover." }),
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
    pricing: { kind: "monthly", packageKey: "restaurantes_base_monthly", category: "restaurantes" },
    media: media(null, { es: "Sube fotos reales: fachada, platillos o interior. La primera será la portada.", en: "Upload real photos: storefront, dishes or interior. The first one is the cover." }),
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
    status: "direct",
    directReason: {
      code: "REQUIRES_VEHICLE_INVENTORY",
      reason: { es: "Un concesionario se publica en Leonix con al menos un vehículo real; el formulario completo te guía vehículo por vehículo.", en: "A dealership publishes on Leonix with at least one real vehicle; the full application guides you vehicle by vehicle." },
    },
    emoji: "🚗",
    label: { es: "Autos (concesionario)", en: "Autos (dealer)" },
    tagline: { es: "Lote o concesionario con inventario de vehículos.", en: "Dealership or lot with vehicle inventory." },
    standardApplicationPath: "/publicar/autos/negocios",
    pricing: { kind: "monthly", packageKey: "autos_dealer_monthly", category: "autos" },
    media: media(null, { es: "Fotos reales de cada vehículo (en la aplicación completa).", en: "Real photos of each vehicle (in the full application)." }),
    manage: {
      dashboardHref: "/dashboard/mis-anuncios?cat=autos",
      editNote: { es: "Inventario y perfil desde Mis Anuncios.", en: "Inventory and profile from My Ads." },
      endNote: { es: "Retirar / restaurar vehículos desde Mis Anuncios.", en: "Unpublish / restore vehicles from My Ads." },
      billingNote: { es: "Suscripción mensual + paquete de inventario opcional.", en: "Monthly subscription + optional inventory pack." },
    },
    staff: { publishForClientSupported: false, note: { es: "El cliente publica a su nombre.", en: "The customer publishes in their own name." } },
    essentialQuestionCount: 0,
  },
  "bienes-negocio": {
    key: "bienes-negocio",
    status: "direct",
    directReason: {
      code: "REQUIRES_PROPERTY_INVENTORY",
      reason: { es: "Un agente o negocio inmobiliario se publica en Leonix con al menos una propiedad real; el formulario completo te guía propiedad por propiedad.", en: "A real-estate agent or business publishes on Leonix with at least one real property; the full application guides you property by property." },
    },
    emoji: "🏢",
    label: { es: "Bienes Raíces (agente / negocio)", en: "Real Estate (agent / business)" },
    tagline: { es: "Agentes, brokers y negocios inmobiliarios con propiedades.", en: "Agents, brokers and real-estate businesses with properties." },
    standardApplicationPath: "/publicar/bienes-raices",
    pricing: { kind: "monthly", packageKey: "br_agent_monthly", category: "bienes-raices" },
    media: media(null, { es: "Fotos reales de cada propiedad (en la aplicación completa).", en: "Real photos of each property (in the full application)." }),
    manage: {
      dashboardHref: "/dashboard/mis-anuncios?cat=bienes-raices",
      editNote: { es: "Propiedades y perfil desde Mis Anuncios.", en: "Properties and profile from My Ads." },
      endNote: { es: "Pausar / reactivar propiedades desde Mis Anuncios.", en: "Pause / resume properties from My Ads." },
      billingNote: { es: "Suscripción mensual + paquete de inventario opcional.", en: "Monthly subscription + optional inventory pack." },
    },
    staff: { publishForClientSupported: false, note: { es: "El cliente publica a su nombre.", en: "The customer publishes in their own name." } },
    essentialQuestionCount: 0,
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
