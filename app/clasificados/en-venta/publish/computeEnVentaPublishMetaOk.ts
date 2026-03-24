import type { PublishDraftSnapshot } from "@/app/clasificados/lib/publishDraftSnapshot";

/** En Venta taxonomy + seller_kind shape (price handled in publishRequirements). */
export function computeEnVentaPublishMetaOk(s: PublishDraftSnapshot): boolean {
  const rama = (s.details.rama ?? "").trim();
  const itemType = (s.details.itemType ?? "").trim();
  const condition = (s.details.condition ?? "").trim();
  const sk = (s.details.seller_kind ?? "").trim();
  if (!rama || !itemType || !condition) return false;
  if (sk && sk !== "individual" && sk !== "business") return false;
  return true;
}
