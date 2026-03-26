import { NextResponse } from "next/server";
import { getRoughDistanceMiles, getRoughDistanceMilesFromCoords } from "@/app/lib/distance";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const viewer = searchParams.get("viewer") ?? "";
  const viewerLatRaw = searchParams.get("viewerLat");
  const viewerLngRaw = searchParams.get("viewerLng");
  const listing = searchParams.get("listing") ?? "";
  const viewerLat = viewerLatRaw ? Number(viewerLatRaw) : null;
  const viewerLng = viewerLngRaw ? Number(viewerLngRaw) : null;

  const miles =
    viewerLat !== null && viewerLng !== null && Number.isFinite(viewerLat) && Number.isFinite(viewerLng)
      ? getRoughDistanceMilesFromCoords({ lat: viewerLat, lng: viewerLng }, listing)
      : getRoughDistanceMiles(viewer, listing);
  return NextResponse.json({ miles: miles ?? null });
}
