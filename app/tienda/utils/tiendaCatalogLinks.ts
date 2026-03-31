import type { Lang } from "../types/tienda";
import type { TiendaCatalogItemRow } from "@/app/lib/tienda/tiendaCatalogTypes";
import { isPrintUploadProductSlug } from "../product-configurators/print-upload/productConfigs";
import {
  businessCardConfigurePath,
  printUploadConfigurePath,
  withLang,
} from "./tiendaRouting";

function isBusinessCardSelfServeSlug(slug: string): boolean {
  return slug === "standard-business-cards" || slug === "two-sided-business-cards";
}

/** Primary action for a catalog item (no Stripe). */
export function catalogItemPrimaryAction(
  item: TiendaCatalogItemRow,
  lang: Lang
): { href: string; label: string } {
  const en = lang === "en";
  const link = item.linked_product_slug;

  if (item.cta_mode === "self_serve" || item.cta_mode === "upload_ready") {
    if (link && isPrintUploadProductSlug(link)) {
      return {
        href: withLang(printUploadConfigurePath(link), lang),
        label: en ? "Configure & upload" : "Configurar y subir",
      };
    }
    if (link && isBusinessCardSelfServeSlug(link)) {
      return {
        href: withLang(businessCardConfigurePath(link), lang),
        label: en ? "Design online" : "Diseñar en línea",
      };
    }
    if (link) {
      return {
        href: withLang(`/tienda/p/${link}`, lang),
        label: en ? "Open product page" : "Ver página del producto",
      };
    }
  }

  if (item.cta_mode === "catalog_only") {
    return {
      href: withLang(`/tienda/c/${item.category_slug}`, lang),
      label: en ? "Back to category" : "Volver a categoría",
    };
  }

  return {
    href: withLang("/contacto", lang),
    label:
      item.cta_mode === "request_quote"
        ? en
          ? "Request a quote"
          : "Solicitar cotización"
        : en
          ? "Contact Leonix"
          : "Contactar Leonix",
  };
}
