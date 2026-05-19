import type { BrPropertyInventoryLang } from "./leonixBrPropertyInventoryPolicy";

export function brNegocioBasePlanPitch(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? "Tu plan de Bienes Raíces incluye hasta 3 propiedades activas dentro de tu perfil profesional."
    : "Your Real Estate plan includes up to 3 active properties inside your professional profile.";
}

export function brPropertyInventoryUpgradePitch(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? "¿Tienes más propiedades? Activa el Inventario de Propiedades por $89.99/mes y agrega hasta 5 propiedades adicionales."
    : "Have more properties? Unlock Property Inventory for $89.99/month and add up to 5 additional properties.";
}

export function brPropertyInventoryUpgradeDetail(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? "Cada propiedad tendrá su propia página pública, fotos, detalles, ID Leonix y aparecerá conectada a tu perfil principal."
    : "Each property gets its own public page, photos, details, Leonix Ad ID, and stays connected to your main profile.";
}

export function brPropertyInventoryTotalWithUpgradeLine(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Total con el upgrade: hasta 8 propiedades activas." : "Total with the upgrade: up to 8 active properties.";
}

export function brPropertyInventoryContactLeonixLine(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "¿Necesitas más de 8 propiedades? Contacta a Leonix." : "Need more than 8 properties? Contact Leonix.";
}

export function brPropertyInventoryUpgradeCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Activar inventario de propiedades" : "Unlock Property Inventory";
}

export function brPropertyInventoryAddPropertyCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Agregar propiedad" : "Add property";
}

export function brPropertyInventoryAddToInventoryCtaLabel(lang: BrPropertyInventoryLang): string {
  return lang === "es" ? "Agregar al inventario" : "Add to inventory";
}

export function brPropertyInventoryBaseLimitMessage(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? "Tu plan de Bienes Raíces incluye hasta 3 propiedades activas. Activa el Inventario de Propiedades por $89.99/mes para agregar hasta 5 propiedades adicionales."
    : "Your Real Estate plan includes up to 3 active properties. Unlock Property Inventory for $89.99/month to add up to 5 additional properties.";
}

export function brPropertyInventoryMaxTotalLimitMessage(lang: BrPropertyInventoryLang): string {
  return lang === "es"
    ? "Has llegado al límite de 8 propiedades activas en total. Si necesitas más, contacta a Leonix."
    : "You have reached the 8 total active property limit. If you need more, contact Leonix.";
}

/** Placeholder — Stripe entitlement wiring deferred (BR13B). */
export function brPropertyInventoryUpgradeContactHref(lang: BrPropertyInventoryLang): string {
  const subject = encodeURIComponent(
    lang === "es" ? "Bienes Raíces — Inventario de propiedades" : "Real Estate — Property Inventory",
  );
  const body = encodeURIComponent(
    `${brPropertyInventoryUpgradePitch(lang)}\n\n${brPropertyInventoryTotalWithUpgradeLine(lang)}`,
  );
  return `mailto:soporte@elaguila.com?subject=${subject}&body=${body}`;
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
