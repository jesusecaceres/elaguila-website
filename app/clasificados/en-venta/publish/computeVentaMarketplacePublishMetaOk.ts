import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";

/** En Venta marketplace listing: subcategoría, artículo, condición. */
export function computeVentaMarketplacePublishMetaOk(s: PublishDraftSnapshot): boolean {
  return (
    s.category !== "en-venta" ||
    (!!(s.details.rama ?? "").trim() &&
      !!(s.details.itemType ?? "").trim() &&
      !!(s.details.condition ?? "").trim())
  );
}
