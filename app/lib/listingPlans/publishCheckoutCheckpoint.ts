/**
 * Leonix Publish Checkout Checkpoint — shared contract + pure resolver.
 * Gate PUBLISH-CHECKOUT-CHECKPOINT-STANDARD-01
 *
 * No mutations, no Stripe secrets, no DB writes, no fake paid/promo/newsletter state.
 */

import { formatMoneyCents } from "./packagePricingRules";
import {
  getRevenuePackageDefinition,
  type RevenuePackageDefinition,
} from "./revenuePricingMatrix";
import {
  publishCheckpointFinalActionCheckout,
  publishCheckpointFinalActionFreePublish,
} from "./publishCheckoutCopy";

/** Revenue OS checkout does not yet support a separate Bienes inventory pack line item. */
export const REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED = false;

/** Revenue OS checkout supports one packageKey per session; offers add-on is bundled via addOns[]. */
export const REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED = true;

/** Canonical Revenue OS package key for Restaurante category-owned coupon module. */
export const RESTAURANTES_COUPON_ADDON_PACKAGE_KEY = "restaurantes_offers_addon";

/** Canonical Revenue OS package key for Servicios category-owned offers/coupons module. */
export const SERVICIOS_OFFERS_ADDON_PACKAGE_KEY = "servicios_offers_addon";

export const BR_INVENTORY_PACK_PRICE_CENTS = 9900;
export const BR_INVENTORY_PACK_MAX_CHILDREN = 4;
export const BR_BASE_INCLUDED_PROPERTIES = 1;
export const BR_TOTAL_ACTIVE_PROPERTY_LIMIT = BR_BASE_INCLUDED_PROPERTIES + BR_INVENTORY_PACK_MAX_CHILDREN;

export type PublishCheckpointMode = "checkout" | "free_publish";

export type PublishCheckpointLanguage = "en" | "es";

export type PublishCheckpointLineItem = {
  id: string;
  labelEn: string;
  labelEs: string;
  priceCents: number;
  /** When true, price renders as "+$X/mo" style add-on line. */
  isAddOn?: boolean;
  /** Optional sub-label (e.g. "includes 1 featured property"). */
  detailEn?: string;
  detailEs?: string;
};

export type PublishCheckpointAddOn = {
  id: string;
  labelEn: string;
  labelEs: string;
  priceCents: number;
  selected: boolean;
  detailEn?: string;
  detailEs?: string;
};

export type PublishCheckpointConfirmation = {
  id: string;
  labelEn: string;
  labelEs: string;
  required: boolean;
};

export type PublishCheckpointOptIn = {
  id: "newsletter";
  labelEn: string;
  labelEs: string;
  optional: true;
};

export type PublishCheckpointPromoState = {
  eligible: boolean;
  /** When false, UI must hide promo field or show deferred honest message only. */
  uiEnabled: boolean;
  code?: string | null;
  discountCents?: number | null;
  messageEn?: string | null;
  messageEs?: string | null;
};

export type PublishCheckpointConfig = {
  category: string;
  packageKey: string;
  listingId?: string | null;
  leonixAdId?: string | null;
  listingDraftId?: string | null;
  lang: PublishCheckpointLanguage;
  mode: PublishCheckpointMode;
  /** Base plan line item override; when omitted, resolved from Revenue OS matrix. */
  baseLineItem?: Omit<PublishCheckpointLineItem, "id"> & { id?: string };
  addOns?: PublishCheckpointAddOn[];
  childInventoryCount?: number;
  confirmations: PublishCheckpointConfirmation[];
  newsletterEligible?: boolean;
  promoEligible?: boolean;
  /** Restaurant coupon/offers module selected in draft. */
  restaurantOffersAddonSelected?: boolean;
  returnPath?: string | null;
};

export type PublishCheckpointResolvedState = {
  category: string;
  packageKey: string;
  packageDef: RevenuePackageDefinition | null;
  lang: PublishCheckpointLanguage;
  mode: PublishCheckpointMode;
  lineItems: PublishCheckpointLineItem[];
  addOns: PublishCheckpointAddOn[];
  subtotalCents: number;
  discountCents: number;
  totalCents: number;
  totalLabel: string;
  monthlyTotalLabel: string;
  confirmations: PublishCheckpointConfirmation[];
  newsletterOptIn: PublishCheckpointOptIn | null;
  promo: PublishCheckpointPromoState;
  finalActionLabel: string;
  finalActionEnabled: boolean;
  blocked: boolean;
  blockReasonEn: string | null;
  blockReasonEs: string | null;
  helperTextEn: string | null;
  helperTextEs: string | null;
  checkoutPayload: {
    category: string;
    packageKey: string;
    listingId?: string;
    listingDraftId?: string;
    leonixAdId?: string;
    returnPath?: string;
    locale: PublishCheckpointLanguage;
    promoCode?: string;
    addOns?: Array<{ key: string; quantity?: number }>;
    metadata: Record<string, string | number | boolean>;
  };
};

function labelForLang(
  lang: PublishCheckpointLanguage,
  en: string,
  es: string,
): string {
  return lang === "es" ? es : en;
}

export function formatPublishCheckpointMoney(
  cents: number,
  lang: PublishCheckpointLanguage,
  opts?: { isAddOn?: boolean; monthly?: boolean },
): string {
  const base = formatMoneyCents(cents, lang === "es" ? "es-US" : "en-US");
  const prefix = opts?.isAddOn ? "+" : "";
  const suffix = opts?.monthly !== false ? (lang === "es" ? "/mes" : "/mo") : "";
  return `${prefix}${base}${suffix}`;
}

function brInventoryPackBlockReason(lang: PublishCheckpointLanguage, childCount: number): string | null {
  if (childCount > BR_INVENTORY_PACK_MAX_CHILDREN) {
    return lang === "es"
      ? "Ya tienes 4 propiedades adicionales en este paquete de inventario. Elimina una propiedad o contacta a Leonix para un plan de oficina más grande."
      : "You already have 4 additional properties in this inventory pack. Remove one property or contact Leonix for a larger office plan.";
  }
  if (childCount >= 1 && !REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED) {
    return lang === "es"
      ? "El Paquete de inventario (+$99/mes) aún no está disponible en el pago seguro de Leonix. Contacta a Leonix o publica solo la propiedad principal por ahora."
      : "The Inventory Pack (+$99/mo) is not yet available in Leonix secure checkout. Contact Leonix or publish the main property only for now.";
  }
  return null;
}

function restaurantCouponAddonBlockReason(lang: PublishCheckpointLanguage): string {
  return lang === "es"
    ? "Para continuar al pago seguro hoy, vuelve a editar y desactiva el módulo de cupones del restaurante. Tu descuento promocional sí queda aplicado al plan base de $399/mes."
    : "To continue to secure payment today, go back and turn off the restaurant coupon module. Your promo discount is applied to the $399/mo base plan.";
}

/** True when Restaurante coupon module is selected but Revenue OS cannot charge it yet. */
export function isRestaurantCouponCheckoutBlocked(config: PublishCheckpointConfig): boolean {
  return (
    config.category === "restaurantes" &&
    Boolean(config.restaurantOffersAddonSelected) &&
    !REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED
  );
}

/**
 * Pure resolver — computes display state and checkout payload metadata without side effects.
 */
export function resolvePublishCheckoutCheckpoint(
  config: PublishCheckpointConfig,
  opts?: {
    checkedConfirmationIds?: Set<string> | string[];
    newsletterOptIn?: boolean;
    promoCode?: string | null;
    promoDiscountCents?: number | null;
    promoUiEnabled?: boolean;
  },
): PublishCheckpointResolvedState {
  const lang = config.lang === "en" ? "en" : "es";
  const packageDef = getRevenuePackageDefinition(config.packageKey);
  const childCount = Math.max(0, config.childInventoryCount ?? 0);
  const checked = new Set(opts?.checkedConfirmationIds ?? []);
  const requiredIds = config.confirmations.filter((c) => c.required).map((c) => c.id);
  const allRequiredChecked = requiredIds.every((id) => checked.has(id));

  const lineItems: PublishCheckpointLineItem[] = [];
  const addOns: PublishCheckpointAddOn[] = [...(config.addOns ?? [])];

  let blocked = false;
  let blockReasonEn: string | null = null;
  let blockReasonEs: string | null = null;

  const baseCents = packageDef?.priceCents ?? config.baseLineItem?.priceCents ?? 0;

  if (config.category === "bienes-raices" && config.packageKey === "br_agent_monthly") {
    const blockEs = brInventoryPackBlockReason("es", childCount);
    const blockEn = brInventoryPackBlockReason("en", childCount);
    if (blockEs || blockEn) {
      blocked = true;
      blockReasonEs = blockEs;
      blockReasonEn = blockEn;
    }

    lineItems.push({
      id: "base",
      labelEn: config.baseLineItem?.labelEn ?? "Agent Showcase",
      labelEs: config.baseLineItem?.labelEs ?? "Vitrina de agente",
      priceCents: baseCents,
      detailEn: config.baseLineItem?.detailEn ?? "Includes 1 main/featured property",
      detailEs: config.baseLineItem?.detailEs ?? "Incluye 1 propiedad principal/destacada",
    });

    const inventoryPackApplies =
      childCount >= 1 && childCount <= BR_INVENTORY_PACK_MAX_CHILDREN;

    addOns.push({
      id: "inventory_pack",
      labelEn: "Inventory Pack",
      labelEs: "Paquete de inventario",
      priceCents: BR_INVENTORY_PACK_PRICE_CENTS,
      selected: inventoryPackApplies,
      detailEn: "Up to 4 additional active properties",
      detailEs: "Hasta 4 propiedades adicionales activas",
    });
  } else if (config.category === "restaurantes" && config.packageKey === "restaurantes_base_monthly") {
    lineItems.push({
      id: "base",
      labelEn: config.baseLineItem?.labelEn ?? "Established restaurant",
      labelEs: config.baseLineItem?.labelEs ?? "Restaurante establecido",
      priceCents: baseCents,
    });

    const restaurantCouponSelected = Boolean(config.restaurantOffersAddonSelected);
    const offersDef = getRevenuePackageDefinition(RESTAURANTES_COUPON_ADDON_PACKAGE_KEY);
    const offersPriceCents = offersDef?.priceCents ?? 9900;

    if (restaurantCouponSelected) {
      if (REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED) {
        addOns.push({
          id: "restaurant_coupon_module",
          labelEn: "Restaurant coupon module",
          labelEs: "Módulo de cupones del restaurante",
          priceCents: offersPriceCents,
          selected: true,
          detailEn: "Category-owned coupon module selected in your application",
          detailEs: "Módulo de cupones seleccionado en tu solicitud",
        });
      } else {
        blocked = true;
        blockReasonEs = restaurantCouponAddonBlockReason("es");
        blockReasonEn = restaurantCouponAddonBlockReason("en");
        addOns.push({
          id: "restaurant_coupon_module",
          labelEn: "Restaurant coupon module",
          labelEs: "Módulo de cupones del restaurante",
          priceCents: offersPriceCents,
          selected: true,
          detailEn: "Selected in your application — not included in today's secure checkout",
          detailEs: "Seleccionado en tu solicitud — no incluido en el pago seguro de hoy",
        });
      }
    }
  } else if (config.baseLineItem) {
    lineItems.push({
      id: config.baseLineItem.id ?? "base",
      labelEn: config.baseLineItem.labelEn,
      labelEs: config.baseLineItem.labelEs,
      priceCents: config.baseLineItem.priceCents,
      detailEn: config.baseLineItem.detailEn,
      detailEs: config.baseLineItem.detailEs,
    });
  } else if (packageDef) {
    lineItems.push({
      id: "base",
      labelEn: packageDef.label,
      labelEs: packageDef.label,
      priceCents: packageDef.priceCents,
    });
  }

  const restaurantCouponBlockedCheckout =
    config.category === "restaurantes" &&
    Boolean(config.restaurantOffersAddonSelected) &&
    !REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED;

  const selectedAddOnCents = addOns
    .filter((a) => {
      if (!a.selected) return false;
      if (restaurantCouponBlockedCheckout && a.id === "restaurant_coupon_module") return false;
      return true;
    })
    .reduce((sum, a) => sum + a.priceCents, 0);

  const subtotalCents = lineItems.reduce((sum, li) => sum + li.priceCents, 0) + selectedAddOnCents;
  const discountCents = Math.max(0, opts?.promoDiscountCents ?? 0);
  const totalCents = Math.max(0, subtotalCents - discountCents);

  const totalLabel = formatPublishCheckpointMoney(totalCents, lang, { monthly: true });
  const monthlyTotalLabel = totalLabel;

  const promoEligible = config.promoEligible ?? packageDef?.promoEligible ?? false;
  const promoUiEnabled = Boolean(opts?.promoUiEnabled);

  const newsletterOptIn: PublishCheckpointOptIn | null =
    config.newsletterEligible !== false
      ? {
          id: "newsletter",
          labelEn:
            "Send me Leonix promotions, magazine updates, local advertising opportunities, and launch news.",
          labelEs:
            "Quiero recibir promociones de Leonix, novedades de la revista, oportunidades de publicidad local y noticias del lanzamiento.",
          optional: true,
        }
      : null;

  const finalActionLabel =
    config.mode === "checkout"
      ? publishCheckpointFinalActionCheckout(lang)
      : publishCheckpointFinalActionFreePublish(lang);

  const finalActionEnabled = !blocked && allRequiredChecked;

  const inventoryPackSelected =
    config.category === "bienes-raices" &&
    childCount >= 1 &&
    childCount <= BR_INVENTORY_PACK_MAX_CHILDREN;

  const metadata: Record<string, string | number | boolean> = {
    lane: config.category === "bienes-raices" ? "negocio" : config.category,
    newsletter_opt_in: Boolean(opts?.newsletterOptIn),
    lang,
  };

  if (config.category === "bienes-raices") {
    metadata.inventory_child_count = childCount;
    metadata.inventory_pack_selected = inventoryPackSelected && REVENUE_OS_BR_INVENTORY_PACK_SUPPORTED;
    metadata.inventory_pack_slots = BR_INVENTORY_PACK_MAX_CHILDREN;
    metadata.base_included_properties = BR_BASE_INCLUDED_PROPERTIES;
    metadata.total_active_property_limit = BR_TOTAL_ACTIVE_PROPERTY_LIMIT;
  }

  if (config.category === "restaurantes") {
    const offersDef = getRevenuePackageDefinition(RESTAURANTES_COUPON_ADDON_PACKAGE_KEY);
    metadata.restaurant_coupon_addon_selected = Boolean(config.restaurantOffersAddonSelected);
    if (config.restaurantOffersAddonSelected && REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED) {
      metadata.restaurant_offers_addon_package_key = RESTAURANTES_COUPON_ADDON_PACKAGE_KEY;
      metadata.restaurant_offers_addon_price_cents = offersDef?.priceCents ?? 9900;
    }
  }

  const restaurantCouponAddOnSelected =
    config.category === "restaurantes" &&
    Boolean(config.restaurantOffersAddonSelected) &&
    REVENUE_OS_RESTAURANTES_OFFERS_ADDON_SUPPORTED;

  if (config.listingId?.trim()) metadata.listing_id = config.listingId.trim();
  if (config.leonixAdId?.trim()) metadata.leonix_ad_id = config.leonixAdId.trim();
  if (opts?.promoCode?.trim()) metadata.promo_code = opts.promoCode.trim();

  const checkoutPayload: PublishCheckpointResolvedState["checkoutPayload"] = {
    category: config.category,
    packageKey: config.packageKey,
    locale: lang,
    metadata,
    ...(config.listingId?.trim() ? { listingId: config.listingId.trim() } : {}),
    ...(config.listingDraftId?.trim() ? { listingDraftId: config.listingDraftId.trim() } : {}),
    ...(config.leonixAdId?.trim() ? { leonixAdId: config.leonixAdId.trim() } : {}),
    ...(config.returnPath?.trim() ? { returnPath: config.returnPath.trim() } : {}),
    ...(opts?.promoCode?.trim() ? { promoCode: opts.promoCode.trim() } : {}),
    ...(restaurantCouponAddOnSelected
      ? { addOns: [{ key: RESTAURANTES_COUPON_ADDON_PACKAGE_KEY, quantity: 1 }] }
      : {}),
  };

  return {
    category: config.category,
    packageKey: config.packageKey,
    packageDef,
    lang,
    mode: config.mode,
    lineItems,
    addOns,
    subtotalCents,
    discountCents,
    totalCents,
    totalLabel,
    monthlyTotalLabel,
    confirmations: config.confirmations,
    newsletterOptIn,
    promo: {
      eligible: promoEligible,
      uiEnabled: promoEligible && promoUiEnabled,
      code: opts?.promoCode ?? null,
      discountCents: opts?.promoDiscountCents ?? null,
    },
    finalActionLabel,
    finalActionEnabled,
    blocked,
    blockReasonEn,
    blockReasonEs,
    helperTextEn: blocked ? blockReasonEn : null,
    helperTextEs: blocked ? blockReasonEs : null,
    checkoutPayload,
  };
}

/** Category-specific confirmation presets for proof categories. */
export const RESTAURANTES_CHECKPOINT_CONFIRMATIONS: PublishCheckpointConfirmation[] = [
  {
    id: "truthful_info",
    required: true,
    labelEn: "I confirm the restaurant information is truthful and up to date.",
    labelEs: "Confirmo que la información del restaurante es verdadera y está actualizada.",
  },
  {
    id: "media_accurate",
    required: true,
    labelEn:
      "I confirm the photos, logos, hours, prices/offers, and contact details represent my business correctly.",
    labelEs:
      "Confirmo que las fotos, logos, horarios, precios/ofertas y datos de contacto representan correctamente mi negocio.",
  },
  {
    id: "rules_responsible",
    required: true,
    labelEn:
      "I confirm this listing follows Leonix rules and that I am responsible for the published information.",
    labelEs:
      "Confirmo que este anuncio sigue las reglas de Leonix y que soy responsable por la información publicada.",
  },
  {
    id: "payment_required",
    required: true,
    labelEn: "I understand payment is required before this listing becomes active.",
    labelEs: "Entiendo que el pago es requerido antes de que este anuncio quede activo.",
  },
];

export const BIENES_NEGOCIO_CHECKPOINT_CONFIRMATIONS: PublishCheckpointConfirmation[] = [
  {
    id: "accurate_info",
    required: true,
    labelEn: "I confirm my property and agent information is accurate and up to date.",
    labelEs: "Confirmo que la información de la propiedad y del agente es correcta y está actualizada.",
  },
  {
    id: "rights_to_publish",
    required: true,
    labelEn:
      "I confirm I have rights to publish these photos, videos, documents, property details, and agent information.",
    labelEs:
      "Confirmo que tengo derecho a publicar estas fotos, videos, documentos, detalles de la propiedad e información del agente.",
  },
  {
    id: "marketplace_rules",
    required: true,
    labelEn: "I confirm this listing follows Leonix real estate and marketplace rules.",
    labelEs: "Confirmo que este anuncio sigue las reglas de bienes raíces y marketplace de Leonix.",
  },
  {
    id: "payment_required",
    required: true,
    labelEn:
      "I understand payment is required before this listing and any additional inventory become active.",
    labelEs:
      "Entiendo que el pago es requerido antes de que este anuncio y cualquier inventario adicional queden activos.",
  },
];

export function publishCheckpointBlockReason(
  state: PublishCheckpointResolvedState,
): string | null {
  return labelForLang(state.lang, state.blockReasonEn ?? "", state.blockReasonEs ?? "") || null;
}
