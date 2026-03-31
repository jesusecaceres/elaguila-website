import type { TiendaOrderAssetRow } from "./tiendaOrdersData";

export type TiendaAdminAssetGroupId = "designed-reference" | "customer-uploads" | "session-data" | "other";

export type TiendaAdminAssetGroup = {
  id: TiendaAdminAssetGroupId;
  title: string;
  subtitle: string;
  assets: TiendaOrderAssetRow[];
};

function roleGroup(assetRole: string): TiendaAdminAssetGroupId {
  switch (assetRole) {
    case "business-card-front":
    case "business-card-back":
      return "designed-reference";
    case "upload-front":
    case "upload-back":
      return "customer-uploads";
    case "design-json-snapshot":
      return "session-data";
    default:
      return "other";
  }
}

/**
 * Groups durable assets for fulfillment review: reference PNGs/JSON vs original customer files.
 */
export function groupTiendaOrderAssetsForAdmin(assets: TiendaOrderAssetRow[]): TiendaAdminAssetGroup[] {
  const buckets: Record<TiendaAdminAssetGroupId, TiendaOrderAssetRow[]> = {
    "designed-reference": [],
    "customer-uploads": [],
    "session-data": [],
    other: [],
  };

  for (const a of assets) {
    buckets[roleGroup(a.asset_role)].push(a);
  }

  const meta: Record<TiendaAdminAssetGroupId, { title: string; subtitle: string }> = {
    "designed-reference": {
      title: "Designed online — reference exports",
      subtitle: "Raster PNG snapshots from the builder (layout fidelity). Not press-ready PDF/CMYK.",
    },
    "customer-uploads": {
      title: "Customer-uploaded artwork",
      subtitle: "Original files submitted by the customer — preferred for production when applicable.",
    },
    "session-data": {
      title: "Session / snapshot data",
      subtitle: "JSON builder state for support and re-open (not a print file).",
    },
    other: {
      title: "Other assets",
      subtitle: "Additional roles on this order.",
    },
  };

  const order: TiendaAdminAssetGroupId[] = ["designed-reference", "customer-uploads", "session-data", "other"];
  return order
    .filter((id) => buckets[id].length > 0)
    .map((id) => ({
      id,
      title: meta[id].title,
      subtitle: meta[id].subtitle,
      assets: buckets[id],
    }));
}
