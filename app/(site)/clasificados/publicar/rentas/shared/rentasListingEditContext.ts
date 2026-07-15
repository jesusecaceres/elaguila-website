export type RentasListingEditLane = "privado" | "negocio";
export type RentasListingEditHydrationStatus = "idle" | "loading" | "ready" | "error";

export type RentasListingEditContext = {
  mode: "listing-edit";
  source: "dashboard";
  listingId: string;
  leonixAdId: string | null;
  lane: RentasListingEditLane;
  returnHref: string;
  originalSnapshotLoaded: boolean;
  hydrationStatus: RentasListingEditHydrationStatus;
  dirty: boolean;
};

export function parseRentasListingEditContext(
  searchParams: URLSearchParams,
  expectedLane: RentasListingEditLane,
): RentasListingEditContext | null {
  const listingId = searchParams.get("listingId")?.trim() ?? "";
  const source = searchParams.get("source")?.trim() ?? "";
  const mode = searchParams.get("mode")?.trim() ?? "";
  const edit = searchParams.get("edit")?.trim() ?? "";
  const lane = (searchParams.get("lane")?.trim() || expectedLane) as RentasListingEditLane;
  if (source !== "dashboard" || mode !== "listing-edit" || edit !== "1" || !listingId) return null;
  if (lane !== expectedLane) return null;
  const returnTo = searchParams.get("returnTo")?.trim();
  const lang = searchParams.get("lang") === "en" ? "en" : "es";
  const fallback = `/dashboard/mis-anuncios?cat=rentas&lang=${lang}`;
  return {
    mode: "listing-edit",
    source: "dashboard",
    listingId,
    leonixAdId: searchParams.get("leonixAdId")?.trim() || null,
    lane,
    returnHref: returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : fallback,
    originalSnapshotLoaded: false,
    hydrationStatus: "idle",
    dirty: false,
  };
}

export function rentasListingEditWorkspaceKey(input: {
  listingId: string;
  lane: RentasListingEditLane;
}): string {
  return `rentas:listing-edit:${input.listingId}:${input.lane}`;
}

export function rentasListingEditPreviewParams(input: RentasListingEditContext): Record<string, string> {
  return {
    edit: "1",
    source: "dashboard",
    mode: "listing-edit",
    listingId: input.listingId,
    lane: input.lane,
    returnTo: input.returnHref,
    ...(input.leonixAdId ? { leonixAdId: input.leonixAdId } : {}),
  };
}
