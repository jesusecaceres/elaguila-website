import type { ListingUiStatus } from "@/app/(site)/dashboard/lib/listingDisplayStatus";
import {
  EN_VENTA_PUBLICAR_FREE,
  EN_VENTA_PUBLICAR_PRO,
} from "@/app/(site)/clasificados/en-venta/shared/constants/enVentaPublishRoutes";

export type EnVentaDashboardListingLifecycle = "active" | "paused" | "inactive";

export function resolveEnVentaDashboardListingLifecycle(
  uiStatus: ListingUiStatus,
  row?: { status?: string | null; is_published?: boolean | null },
): EnVentaDashboardListingLifecycle {
  if (uiStatus === "paused") return "paused";
  if (uiStatus === "sold" || uiStatus === "archived" || uiStatus === "expired") return "inactive";
  if (uiStatus === "draft") return "inactive";
  const st = String(row?.status ?? "").toLowerCase();
  if (st === "removed" || st === "unpublished" || st === "archived") return "inactive";
  if (row?.is_published === false && uiStatus !== "active") return "inactive";
  return "active";
}

export function enVentaShowsRepublicarListing(lifecycle: EnVentaDashboardListingLifecycle): boolean {
  return lifecycle === "inactive";
}

export function buildEnVentaRepublishPublishHref(plan: "free" | "pro", lang: "es" | "en"): string {
  const base = plan === "pro" ? EN_VENTA_PUBLICAR_PRO : EN_VENTA_PUBLICAR_FREE;
  return `${base}?lang=${lang}&republish=1`;
}
