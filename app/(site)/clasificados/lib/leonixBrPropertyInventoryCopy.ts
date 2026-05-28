import { LEONIX_GLOBAL_MAILTO } from "@/app/data/leonixGlobalContact";
import type { BrPropertyInventoryLang } from "./leonixBrPropertyInventoryPolicy";
import {
  BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES,
  BASE_BR_NEGOCIO_MONTHLY_PRICE,
  BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT,
  BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE,
  BR_PROPERTY_INVENTORY_UPGRADE_AVG_PER_PROPERTY,
  BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT,
  BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE,
  BR_PROPERTY_INVENTORY_BASE_AVG_PER_PROPERTY,
} from "./leonixBrPropertyInventoryPolicy";

function formatUsd(amount: number): string {
  const hasCents = Math.abs(amount % 1) > 0.001;
  return hasCents
    ? `$${amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    : `$${amount.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

export function brNegocioBasePlanPitch(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? `Tu plan de Bienes Raíces cuesta ${formatUsd(BASE_BR_NEGOCIO_MONTHLY_PRICE)}/mes e incluye hasta ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} propiedades activas dentro de tu perfil profesional.`
    : `Your Real Estate plan is ${formatUsd(BASE_BR_NEGOCIO_MONTHLY_PRICE)}/month and includes up to ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} active properties inside your professional profile.`;
}

export function brPropertyInventoryUpgradePitch(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? `Con el Inventario de Propiedades por ${formatUsd(BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE)}/mes puedes agregar hasta ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} propiedades adicionales y mostrar hasta ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} propiedades activas en total por ${formatUsd(BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE)}/mes.`
    : `With Property Inventory for ${formatUsd(BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE)}/month you can add up to ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} additional properties and show up to ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} active properties total for ${formatUsd(BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE)}/month.`;
}

export function brPropertyInventoryUpgradeDetail(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? "Eso mejora el costo promedio por propiedad activa y convierte tu perfil en un catálogo profesional conectado: cada propiedad tiene su propia página pública, fotos, detalles, ID Leonix y permanece vinculada a tu perfil principal."
    : "That improves the average cost per active property and turns your profile into a connected professional catalog: every property gets its own public page, photos, details, Leonix Ad ID, and stays linked to your main profile.";
}

export function brPropertyInventoryValueMathLine(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? `Referencia: plan base ≈ ${formatUsd(BR_PROPERTY_INVENTORY_BASE_AVG_PER_PROPERTY)} por propiedad activa · con upgrade ≈ ${formatUsd(BR_PROPERTY_INVENTORY_UPGRADE_AVG_PER_PROPERTY)} por propiedad activa (hasta ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} en total).`
    : `Reference: base plan ≈ ${formatUsd(BR_PROPERTY_INVENTORY_BASE_AVG_PER_PROPERTY)} per active property · with upgrade ≈ ${formatUsd(BR_PROPERTY_INVENTORY_UPGRADE_AVG_PER_PROPERTY)} per active property (up to ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} total).`;
}

export function brPropertyInventoryTotalWithUpgradeLine(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? `Total con el upgrade: hasta ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} propiedades activas por ${formatUsd(BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE)}/mes.`
    : `Total with upgrade: up to ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} active properties for ${formatUsd(BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE)}/month.`;
}

export function brPropertyInventoryContactLeonixLine(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "¿Necesitas más de 8 propiedades? Contacta a Leonix." : "Need more than 8 properties? Contact Leonix.";
}

export function brPropertyInventoryUpgradeCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Activar inventario de propiedades" : "Unlock Property Inventory";
}

export function brPropertyInventoryDrawerContinueCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Continuar y agregar propiedad" : "Continue and add property";
}

export function brPropertyInventoryAddPropertyCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Agregar propiedad" : "Add property";
}

export function brPropertyInventoryAddToInventoryCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Agregar al inventario" : "Add to inventory";
}

/** Drawer CTA when inventory upgrade is active (BR13D). */
export function brPropertyInventoryAddPropertyToInventoryCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Agregar propiedad al inventario" : "Add property to inventory";
}

export function brPropertyInventoryAddMorePropertiesLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Añadir más propiedades" : "Add more properties";
}

export function brPropertyInventoryBaseLimitMessage(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? `Tu plan de Bienes Raíces incluye hasta ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} propiedades activas. Activa el Inventario de Propiedades por ${formatUsd(BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE)}/mes para agregar hasta ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} propiedades adicionales.`
    : `Your Real Estate plan includes up to ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} active properties. Unlock Property Inventory for ${formatUsd(BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE)}/month to add up to ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} additional properties.`;
}

export function brPropertyInventoryMaxTotalLimitMessage(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? `Has llegado al límite de ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} propiedades activas en total. Si necesitas más, contacta a Leonix.`
    : `You have reached the ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} total active property limit. If you need more, contact Leonix.`;
}

/** Placeholder — Stripe entitlement wiring deferred (BR13B/BR13D). */
export function brPropertyInventoryUpgradeContactHref(lang: BrPropertyInventoryLang): string {
  const subject = encodeURIComponent(
    lang === "es" ? "Bienes Raíces — Inventario de propiedades" : "Real Estate — Property Inventory",
  );
  const body = encodeURIComponent(
    `${brPropertyInventoryUpgradePitch(lang)}\n\n${brPropertyInventoryTotalWithUpgradeLine(lang)}\n\n${brPropertyInventoryContactLeonixLine(lang)}`,
  );
  return `${LEONIX_GLOBAL_MAILTO}?subject=${subject}&body=${body}`;
}

export function brPropertyInventoryValueDrawerCopy(lang: BrPropertyInventoryLang): {
  title: string;
  close: string;
  baseBullet: string;
  upgradeBullet: string;
  valueParagraph: string;
  catalogBullet: string;
  leonixBullet: string;
  contactLine: string;
  paymentNote: string;
} {
  const base = formatUsd(BASE_BR_NEGOCIO_MONTHLY_PRICE);
  const upgrade = formatUsd(BR_PROPERTY_INVENTORY_UPGRADE_MONTHLY_PRICE);
  const total = formatUsd(BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_MONTHLY_PRICE);
  if (lang === "es") {
    return {
      title: "Inventario de Propiedades",
      close: "Cerrar",
      baseBullet: `Plan base: ${base}/mes · hasta ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} propiedades activas en tu perfil profesional.`,
      upgradeBullet: `Upgrade: ${upgrade}/mes · suma hasta ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} propiedades adicionales.`,
      valueParagraph: `Total con upgrade: ${total}/mes · hasta ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} propiedades activas. ${brPropertyInventoryValueMathLine("es")}`,
      catalogBullet:
        "Convierte tu perfil en un catálogo profesional conectado: más visibilidad para tu portafolio y cada propiedad con página pública propia.",
      leonixBullet: "Cada propiedad conserva su propio ID Leonix, fotos, detalles y enlace al perfil principal del agente o negocio.",
      contactLine: brPropertyInventoryContactLeonixLine("es"),
      paymentNote:
        "La activación del inventario se gestiona con Leonix. No se procesa el pago en esta pantalla.",
    };
  }
  return {
    title: "Property Inventory",
    close: "Close",
    baseBullet: `Base plan: ${base}/mo · up to ${BASE_BR_NEGOCIO_INCLUDED_ACTIVE_PROPERTIES} active properties in your professional profile.`,
    upgradeBullet: `Upgrade: ${upgrade}/mo · adds up to ${BR_PROPERTY_INVENTORY_UPGRADE_EXTRA_ACTIVE_LIMIT} additional properties.`,
    valueParagraph: `Total with upgrade: ${total}/mo · up to ${BR_PROPERTY_INVENTORY_TOTAL_WITH_UPGRADE_LIMIT} active properties. ${brPropertyInventoryValueMathLine("en")}`,
    catalogBullet:
      "Turn your profile into a connected professional catalog: more visibility for your portfolio, with each property on its own public page.",
    leonixBullet: "Every property keeps its own Leonix Ad ID, photos, details, and link to your main agent or business profile.",
    contactLine: brPropertyInventoryContactLeonixLine("en"),
    paymentNote: "Inventory activation is handled with Leonix. Payment is not processed on this screen.",
  };
}

export function brInventoryAddModeTitle(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Agregar propiedad al inventario" : "Add property to inventory";
}

export function brInventoryAddModeSubcopy(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? "Esta propiedad se conectará a tu perfil principal de Bienes Raíces. Tendrá su propia página pública, fotos, detalles e ID Leonix."
    : "This property will be connected to your main Real Estate profile. It will have its own public page, photos, details, and Leonix Ad ID.";
}

export function brInventoryConnectedToParentLine(lang: BrPropertyInventoryLang, parentLeonixAdId: string): string {
  return lang === "es" ? `Conectada a: ${parentLeonixAdId}` : `Connected to: ${parentLeonixAdId}`;
}

export function brInventoryPreviewOwnerBanner(
  lang: BrPropertyInventoryLang,
  parentLeonixAdId: string | null,
): { title: string; connected: string | null } {
  return lang === "es"
    ? {
        title: "Vista previa — propiedad de inventario",
        connected: parentLeonixAdId ? `Conectada a ${parentLeonixAdId}` : null,
      }
    : {
        title: "Preview — inventory property",
        connected: parentLeonixAdId ? `Connected to ${parentLeonixAdId}` : null,
      };
}

export function brLeonixAdIdPlaceholderLine(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "ID Leonix se asignará al publicar" : "Leonix Ad ID will be assigned at publish";
}

export function brRelatedAgentPropertiesCopy(lang: BrPropertyInventoryLang) {
  return lang === "es"
    ? {
        title: "Más propiedades de este agente",
        subtitle: "Explora otras propiedades activas conectadas a este perfil.",
        viewAll: "Ver todas las propiedades",
        viewProperty: "Ver propiedad",
      }
    : {
        title: "More properties from this agent",
        subtitle: "Explore other active properties connected to this profile.",
        viewAll: "View all properties",
        viewProperty: "View property",
      };
}
