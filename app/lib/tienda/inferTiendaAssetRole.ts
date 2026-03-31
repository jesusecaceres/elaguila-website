import type { TiendaAssetRole } from "@/app/tienda/types/tiendaStoredAssets";

export function inferTiendaAssetRoleFromPathname(pathname: string): TiendaAssetRole | null {
  const seg = pathname.split("/").pop() ?? "";
  const lower = seg.toLowerCase();
  if (lower.startsWith("business-card-front")) return "business-card-front";
  if (lower.startsWith("business-card-back")) return "business-card-back";
  if (lower.startsWith("design-json-snapshot")) return "design-json-snapshot";
  if (lower.startsWith("upload-front")) return "upload-front";
  if (lower.startsWith("upload-back")) return "upload-back";
  return null;
}
