import type { EnVentaSellerKind } from "../contracts/enVentaPublishContract";

export type EnVentaInsertShape = {
  seller_type: "personal" | "business";
};

export function mapEnVentaSellerKindToDb(kind: string | undefined): EnVentaInsertShape["seller_type"] {
  const k = (kind ?? "").trim().toLowerCase() as EnVentaSellerKind | "";
  return k === "business" ? "business" : "personal";
}
