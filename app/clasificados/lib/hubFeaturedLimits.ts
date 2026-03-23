import type { HubCategoryKey } from "../config/clasificadosHub";
import { HUB_FEATURED_LIMIT_NUMBERS } from "../config/clasificadosHub";

export function buildHubFeaturedLimits(isMobile: boolean): Record<HubCategoryKey, number> {
  const { big3Desktop, otherDesktop, big3Mobile, otherMobile } = HUB_FEATURED_LIMIT_NUMBERS;
  return {
    rentas: isMobile ? big3Mobile : big3Desktop,
    "en-venta": isMobile ? big3Mobile : big3Desktop,
    "bienes-raices": isMobile ? otherMobile : otherDesktop,
    empleos: isMobile ? big3Mobile : big3Desktop,
    servicios: isMobile ? otherMobile : otherDesktop,
    travel: isMobile ? otherMobile : otherDesktop,
    autos: isMobile ? otherMobile : otherDesktop,
    clases: isMobile ? 2 : 4,
    comunidad: isMobile ? 2 : 4,
    restaurantes: isMobile ? otherMobile : otherDesktop,
  };
}
